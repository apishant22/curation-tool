import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from backend.db.models import Researcher, Paper, Paper_Authors, Organisation, Dept, Researcher_Employment, Researcher_Edu
from sqlalchemy.exc import IntegrityError, InvalidRequestError
from sqlalchemy.sql import text

base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, '..', 'db', 'azure.env')
load_dotenv(env_path)

server = os.getenv('DB_SERVER')
database = os.getenv('DB_DATABASE')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')

connection_string = (
    f"mssql+pyodbc://{username}:{password}@{server}/{database}"
    "?driver=ODBC+Driver+17+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"
)

engine = create_engine(
    connection_string,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"timeout": 60}
)

Session = scoped_session(sessionmaker(bind=engine))

# Helper functions for database interactions
def get_session():
    try:
        session = Session()
        return session
    except SQLAlchemyError as e:
        print(f"Error creating session: {e}")
        return None

def add_record(record, session=None):
    if not session:
        session = get_session()
        if not session:
            return False
    try:
        session.add(record)
        session.commit()
        return True
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error adding record: {e}")
        return False
    finally:
        session.close()

def get_records(model, filters=None, session=None, limit=None):
    if not session:
        session = get_session()
        if not session:
            return []
    try:
        query = session.query(model)

        if filters:
            query = query.filter_by(**filters)

        if limit is not None:
            query = query.limit(limit)

        return query.all()

    except SQLAlchemyError as e:
        print(f"Error retrieving records: {e}")
        return []
    finally:
        session.close()

def update_record(model, filters, updates, session=None):
    if not session:
        session = get_session()
        if not session:
            return False
    try:
        record = session.query(model).filter_by(**filters).first()
        if not record:
            return False
        for key, value in updates.items():
            setattr(record, key, value)
        session.commit()
        return True
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error updating record: {e}")
        return False
    finally:
        session.close()

def delete_record(model, filters, session=None):
    if not session:
        session = get_session()
        if not session:
            return False
    try:
        record = session.query(model).filter_by(**filters).first()
        if not record:
            return False
        session.delete(record)
        session.commit()
        return True
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error deleting record: {e}")
        return False
    finally:
        session.close()



def convert_date_string(date_str):
    if date_str in ['Unknown', None, '']:
        return None
    try:
        return datetime.strptime(date_str, "%d/%m/%Y")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None

def store_author_details_in_db(author_details, session=None):
    try:
        author_name = author_details['Name']
        orcid_id = author_details['Orcid ID']
        bio = author_details['Biography'][0] if author_details['Biography'] else "No biographical information available."
        employment_history = author_details.get('Employment History', [])
        education_history = author_details.get('Education History', [])
        publications = author_details.get('Publications', [])
    except KeyError as e:
        print(f"Error: Missing key in author details: {e}")
        return

    with get_session() as session:
        existing_researcher = get_records(Researcher, filters={"orcid": orcid_id})
        if not existing_researcher:
            new_researcher = Researcher(orcid=orcid_id, name=author_name, bio=bio, summary=None)
            session.add(new_researcher)
            session.commit()

        for pub in publications:
            if not isinstance(pub, dict) or 'DOI' not in pub:
                print("Skipping invalid publication entry: not a dictionary.")
                continue

            doi = pub['DOI']
            title = pub['Title']
            pub_date = convert_date_string(pub['Publication Date'])
            abstract = pub['Abstract']
            citation_count = pub.get('Citation Count', 0)

            existing_pub = session.query(Paper).filter_by(doi=doi).first()
            if existing_pub:
                update_record(
                    Paper,
                    filters={"doi": doi},
                    updates={
                        "title": title,
                        "publication_date": pub_date,
                        "abstract": abstract,
                        "citation_count": citation_count
                    }
                )
            else:
                new_paper = Paper(doi=doi, title=title, publication_date=pub_date, abstract=abstract, citations=citation_count)
                session.add(new_paper)
                session.commit()

            co_authors = pub.get('Co-Authors', []) + [{"Name": author_name, "Orcid ID": orcid_id}]
            for co_author in co_authors:
                co_author_name = co_author.get("Name")
                co_author_orcid = co_author.get("Orcid ID")
                if not co_author_name or not co_author_orcid:
                    continue

                existing_co_author = get_records(Researcher, filters={"orcid": co_author_orcid})
                if not existing_co_author:
                    new_co_author = Researcher(orcid=co_author_orcid, name=co_author_name)
                    session.add(new_co_author)
                    session.commit()

                existing_paper_author = session.query(Paper_Authors).filter_by(doi=doi, orcid=co_author_orcid).first()
                if not existing_paper_author:
                    new_paper_author = Paper_Authors(doi=doi, orcid=co_author_orcid)
                    session.add(new_paper_author)
                    session.commit()

        for employment in employment_history:
            org_name = employment['Organization']
            dept_name = employment.get('Department', "Unknown Department")

            if org_name:
                org_id, dept_id = get_or_add_org_and_dept(org_name, dept_name)
                start_date = convert_date_string(employment.get('Start Date', ''))
                end_date = convert_date_string(employment.get('End Date', ''))

                if dept_id is not None:
                    existing_employment = get_records(Researcher_Employment, filters={
                        "orcid": orcid_id,
                        "dept_id": dept_id,
                        "start_date": start_date,
                        "role": employment.get('Role', 'Unknown')
                    })

                    if not existing_employment:
                        new_employment = Researcher_Employment(
                            orcid=orcid_id,
                            dept_id=dept_id,
                            start_date=start_date,
                            end_date=end_date,
                            role=employment['Role'] if employment['Role'] else "Unknown"
                        )
                        session.add(new_employment)
                        session.commit()
                    else:
                        update_record(
                            Researcher_Employment,
                            filters={"orcid": orcid_id, "dept_id": dept_id, "start_date": start_date},
                            updates={"end_date": end_date, "role": employment['Role'] if employment['Role'] else "Unknown"}
                        )
                else:
                    print(f"Skipping employment record due to missing department for organization '{org_name}'.")

        for education in education_history:
            if education == "No education history available.":
                print("No education history to store.")
                continue

            org_name = education['Institution']
            dept_name = education.get('Department', "Unknown Department")

            if org_name:
                org_id, dept_id = get_or_add_org_and_dept(org_name, dept_name)
                start_date = convert_date_string(education.get('Start Date', ''))
                end_date = convert_date_string(education.get('End Date', ''))

                if dept_id is not None:
                    existing_education = get_records(Researcher_Edu, filters={
                        "orcid": orcid_id,
                        "dept_id": dept_id,
                        "start_date": start_date
                    })

                    if not existing_education:
                        new_education = Researcher_Edu(
                            orcid=orcid_id,
                            dept_id=dept_id,
                            start_date=start_date,
                            end_date=end_date,
                            role=education['Role'] if education['Role'] else "Unknown"
                        )
                        session.add(new_education)
                        session.commit()
                    else:
                        update_record(
                            Researcher_Edu,
                            filters={"orcid": orcid_id, "dept_id": dept_id, "start_date": start_date},
                            updates={"end_date": end_date, "role": education['Role'] if education['Role'] else "Unknown"}
                        )
                else:
                    print(f"Skipping education record due to missing department for organization '{org_name}'.")

def delete_author_details_from_db(orcid_id, session=None):
    with get_session() as session:
        existing_details = get_author_details_from_db(orcid_id)
        if existing_details:
            delete_record(Researcher_Employment, filters={"orcid": orcid_id})
            delete_record(Researcher_Edu, filters={"orcid": orcid_id})
            delete_record(Paper_Authors, filters={"orcid": orcid_id})
            delete_record(Paper, filters={"doi": [pub['DOI'] for pub in existing_details['Publications']]})
            delete_record(Researcher, filters={"orcid": orcid_id})
            session.commit()

def update_author_details_in_db(author_details, session=None):
    try:
        author_name = author_details['Name']
        orcid_id = author_details['Orcid ID']
        bio = author_details['Biography'][0] if author_details['Biography'] else "No biographical information available."
        employment_history = author_details.get('Employment History', [])
        education_history = author_details.get('Education History', [])
        publications = author_details.get('Publications', [])
    except KeyError as e:
        print(f"Error: Missing key in author details: {e}")
        return

    with get_session() as session:
        try:
            existing_researchers = get_records(Researcher, filters={"orcid": orcid_id})

            if len(existing_researchers) > 1:
                print(f"Error: Multiple researchers found with ORCID ID {orcid_id}.")
                return

            existing_researcher = existing_researchers[0] if existing_researchers else None

            if existing_researcher:
                update_record(
                    Researcher,
                    filters={"orcid": orcid_id},
                    updates={"name": author_name, "bio": bio, "summary": None}
                )
            else:
                try:
                    new_researcher = Researcher(orcid=orcid_id, name=author_name, bio=bio, summary=None)
                    session.add(new_researcher)
                    session.commit()
                except (InvalidRequestError, IntegrityError) as e:
                    session.rollback()
                    print(f"Failed to add researcher '{author_name}' to the database: {e}")
                    return

            for employment in employment_history:
                org_name = employment['Organization']
                dept_name = employment.get('Department') if employment.get('Department') != "Unknown Department" else None

                if org_name:
                    org_id, dept_id = get_or_add_org_and_dept(org_name, dept_name)
                    start_date = convert_date_string(employment.get('Start Date', ''))
                    end_date = convert_date_string(employment.get('End Date', ''))

                    existing_employment = session.query(Researcher_Employment).filter_by(
                        orcid=orcid_id,
                        dept_id=dept_id,
                        start_date=start_date
                    ).first()

                    if existing_employment:
                        update_record(
                            Researcher_Employment,
                            filters={"orcid": orcid_id, "dept_id": dept_id, "start_date": start_date},
                            updates={"end_date": end_date, "role": employment['Role'] if employment['Role'] else "Unknown"}
                        )
                    else:
                        new_employment = Researcher_Employment(
                            orcid=orcid_id,
                            dept_id=dept_id,
                            start_date=start_date,
                            end_date=end_date,
                            role=employment['Role'] if employment['Role'] else "Unknown"
                        )
                        session.add(new_employment)
                        session.commit()

            for education in education_history:
                org_name = education['Institution']
                dept_name = education.get('Department') if education.get('Department') != "Unknown Department" else None

                if org_name:
                    org_id, dept_id = get_or_add_org_and_dept(org_name, dept_name)
                    start_date = convert_date_string(education.get('Start Date', ''))
                    end_date = convert_date_string(education.get('End Date', ''))

                    existing_education = session.query(Researcher_Edu).filter_by(
                        orcid=orcid_id,
                        dept_id=dept_id,
                        start_date=start_date
                    ).first()

                    if existing_education:
                        update_record(
                            Researcher_Edu,
                            filters={"orcid": orcid_id, "dept_id": dept_id, "start_date": start_date},
                            updates={"end_date": end_date, "role": education['Role'] if education['Role'] else "Unknown"}
                        )
                    else:
                        new_education = Researcher_Edu(
                            orcid=orcid_id,
                            dept_id=dept_id,
                            start_date=start_date,
                            end_date=end_date,
                            role=education['Role'] if education['Role'] else "Unknown"
                        )
                        session.add(new_education)
                        session.commit()

        except Exception as e:
            session.rollback()
            print(f"An error occurred while updating author details: {e}")

        finally:
            session.close()



def get_or_add_org_and_dept(org_name, dept_name):
    session = get_session()
    existing_org = session.query(Organisation).filter_by(org_name=org_name).first()
    if not existing_org:
        new_org = Organisation(org_name=org_name)
        try:
            session.add(new_org)
            session.commit()
            org_id = new_org.org_id
        except IntegrityError as e:
            session.rollback()
            print(f"Failed to add organization '{org_name}' to the database: {e}")
            return None, None
    else:
        org_id = existing_org.org_id

    # Check if the department exists
    existing_dept = session.query(Dept).filter_by(org_id=org_id, dept_name=dept_name).first()
    if not existing_dept:
        new_dept = Dept(org_id=org_id, dept_name=dept_name)
        try:
            session.add(new_dept)
            session.commit()
            dept_id = new_dept.dept_id
        except IntegrityError as e:
            session.rollback()
            print(f"Failed to add department '{dept_name}' to the database: {e}")
            return org_id, None
    else:
        dept_id = existing_dept.dept_id

    return org_id, dept_id

def get_author_details_from_db(orcid_id):
    session = get_session()
    try:
        researcher_query = text("""
            SELECT orcid, name, bio
            FROM Researcher
            WHERE orcid = :orcid_id
        """)
        researcher = session.execute(researcher_query, {'orcid_id': orcid_id}).fetchone()

        if not researcher:
            return None

        employment_query = text("""
            SELECT re.orcid, o.org_name, d.dept_name, re.role, re.start_date, re.end_date
            FROM Researcher_Employment re
            LEFT JOIN Dept d ON re.dept_id = d.dept_id
            LEFT JOIN Organisation o ON d.org_id = o.org_id
            WHERE re.orcid = :orcid_id
        """)
        employment_records = session.execute(employment_query, {'orcid_id': orcid_id}).fetchall()

        education_query = text("""
            SELECT re.orcid, o.org_name, d.dept_name, re.role, re.start_date, re.end_date
            FROM Researcher_Edu re
            LEFT JOIN Dept d ON re.dept_id = d.dept_id
            LEFT JOIN Organisation o ON d.org_id = o.org_id
            WHERE re.orcid = :orcid_id
        """)
        education_records = session.execute(education_query, {'orcid_id': orcid_id}).fetchall()

        publication_query = text("""
            SELECT p.title, p.doi, p.abstract, p.publication_date, p.citations
            FROM Paper p
            JOIN Paper_Authors pa ON p.doi = pa.doi
            WHERE pa.orcid = :orcid_id
            ORDER BY p.publication_date ASC  -- Order by publication date ascending
        """)
        publication_records = session.execute(publication_query, {'orcid_id': orcid_id}).fetchall()


# Format publications
        publications = []
        for pub in publication_records:
            co_authors_query = text("""
                SELECT r.name, r.orcid
                FROM Paper_Authors pa
                JOIN Researcher r ON pa.orcid = r.orcid
                WHERE pa.doi = :doi AND pa.orcid != :orcid_id
            """)
            co_authors = session.execute(co_authors_query, {'doi': pub[1], 'orcid_id': orcid_id}).fetchall()

            co_authors_list = [
                {"Name": co_author[0], "Orcid ID": co_author[1]} for co_author in co_authors
            ]

            publications.append({
                "Title": pub[0],
                "DOI": pub[1].strip(),
                "Abstract": pub[2] if pub[2] else "No abstract available.",
                "Publication Date": pub[3].strftime("%Y-%m-%d") if pub[3] else "Unknown",
                "Citation Count": pub[4] if pub[4] is not None else 0,
                "Co-Authors": co_authors_list
            })

        employment_history = [
            {
                "Organization": employment[1] if employment[1] else "Unknown Organization",
                "Role": employment[3] if employment[3] else "Unknown",
                "Department": employment[2].strip() if employment[2] else "Unknown Department",
                "Start Date": employment[4].strftime("%Y-%m-%d") if employment[4] else "Unknown",
                "End Date": employment[5].strftime("%Y-%m-%d") if employment[5] else "Unknown"
            }
            for employment in employment_records
        ] if employment_records else ["No employment history available."]

        education_history = [
            {
                "Institution": education[1] if education[1] else "Unknown Institution",
                "Role": education[3] if education[3] else "Unknown",
                "Department": education[2].strip() if education[2] else "Unknown Department",
                "Start Date": education[4].strftime("%Y-%m-%d") if education[4] else "Unknown",
                "End Date": education[5].strftime("%Y-%m-%d") if education[5] else "Unknown"
            }
            for education in education_records
        ] if education_records else ["No education history available."]

        author_details = {
            "Name": researcher[1],
            "Orcid ID": researcher[0],
            "Biography": [researcher[2]] if researcher[2] else ["No biographical information available."],
            "Employment History": employment_history,
            "Education History": education_history,
            "Publications": publications
        }

        return author_details

    finally:
        session.close()


def update_researcher_summary(orcid_id, new_summary, session=None):
    if session is None:
        session = get_session()
    try:
        researcher = session.query(Researcher).filter_by(orcid=orcid_id).first()
        if researcher:
            researcher.summary = new_summary
            session.commit()
            print(f"Successfully updated the summary for researcher with ORCID: {orcid_id}")
        else:
            print(f"No researcher found with ORCID: {orcid_id}")
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error updating researcher summary: {e}")
    finally:
        if session is not None:
            session.close()

def get_researcher_summary(orcid_id, session=None):
    if session is None:
        session = get_session()
    try:
        researcher = session.query(Researcher).filter_by(orcid=orcid_id).first()
        if researcher:
            return researcher.summary if researcher.summary else "Summary not available."
        else:
            return f"No researcher found with ORCID: {orcid_id}"
    except SQLAlchemyError as e:
        print(f"Error retrieving researcher summary: {e}")
        return None
    finally:
        if session is not None:
            session.close()