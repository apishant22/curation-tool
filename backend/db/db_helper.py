import os
import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from backend.db.models import Researcher, Paper, Paper_Authors, Organisation, Dept, Researcher_Employment, Researcher_Edu
from sqlalchemy.exc import IntegrityError, InvalidRequestError

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

# Database connection setup
engine = create_engine(connection_string, echo=False)
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

def get_records(model, filters=None, session=None):
    if not session:
        session = get_session()
        if not session:
            return []
    try:
        query = session.query(model)
        if filters:
            query = query.filter_by(**filters)
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
    """Converts a date string to a datetime object or None."""
    if date_str in ['Unknown', None, '']:
        return None
    try:
        return datetime.strptime(date_str, "%d/%m/%Y")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None

def store_author_details_in_db(author_details, session = None):
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

    try:
        existing_researcher = get_records(Researcher, filters={"orcid": orcid_id})
    except InvalidRequestError as e:
        print(f"Error retrieving records: {e}")
        return

    if existing_researcher:
        update_record(
            Researcher,
            filters={"orcid": orcid_id},
            updates={"name": author_name, "bio": bio, "summary": None}
        )
    else:
        try:
            new_researcher = Researcher(orcid=orcid_id, name=author_name, bio=bio, summary=None)
            session = get_session()
            session.add(new_researcher)
            session.commit()
        except (InvalidRequestError, IntegrityError) as e:
            session.rollback()
            print(f"Failed to add researcher '{author_name}' to the database: {e}")
            return
        finally:
            session.close()

    session = get_session()
    for pub in publications:
        if not isinstance(pub, dict):
            print("Skipping invalid publication entry: not a dictionary.")
            continue
        existing_pub = session.query(Paper).filter_by(doi=pub['DOI']).first()
        if not existing_pub:
            new_paper = Paper(
                doi=pub['DOI'],
                title=pub['Title'],
                publication_date=convert_date_string(pub['Publication Date']),
                abstract=pub['Abstract']
            )
            session.add(new_paper)
            session.commit()

        existing_paper_author = session.query(Paper_Authors).filter_by(doi=pub['DOI'], orcid=orcid_id).first()
        if not existing_paper_author:
            new_paper_author = Paper_Authors(doi=pub['DOI'], orcid=orcid_id)
            session.add(new_paper_author)
            session.commit()
    session.close()

    session = get_session()
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
                    "start_date": start_date
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
    session.close()

    session = get_session()
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
            session.close()
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
            session.close()
            return org_id, None
    else:
        dept_id = existing_dept.dept_id

    session.close()
    return org_id, dept_id



def get_author_details_from_db(orcid_id):
    session = get_session()
    try:
        researcher = session.query(Researcher).options(
            joinedload(Researcher.employments).joinedload(Researcher_Employment.department).joinedload(Dept.organisation),
            joinedload(Researcher.education).joinedload(Researcher_Edu.department).joinedload(Dept.organisation),
        ).filter_by(orcid=orcid_id).first()

        if not researcher:
            return None

        employment_records = session.query(Researcher_Employment).filter_by(orcid=orcid_id).all()
        education_records = session.query(Researcher_Edu).filter_by(orcid=orcid_id).all()
        publication_records = session.query(Paper).join(Paper_Authors, Paper_Authors.doi == Paper.doi).filter(Paper_Authors.orcid == orcid_id).all()

        author_details = {
            "Name": researcher.name,
            "Orcid ID": researcher.orcid,
            "Biography": researcher.bio,
            "Employment History": [
                {
                    "Organization": employment.department.organisation.org_name if employment.department and employment.department.organisation else "Unknown Organization",
                    "Department": employment.department.dept_name.strip() if employment.department and employment.department.dept_name else "Unknown Department",
                    "Start Date": employment.start_date.strftime("%d/%m/%Y") if employment.start_date else "Unknown",
                    "End Date": employment.end_date.strftime("%d/%m/%Y") if employment.end_date else "Unknown",
                    "Role": employment.role if employment.role else "Unknown"
                }
                for employment in employment_records
            ],
            "Education History": [
                {
                    "Institution": education.department.organisation.org_name if education.department and education.department.organisation else "Unknown Institution",
                    "Department": education.department.dept_name.strip() if education.department and education.department.dept_name else "Unknown Department",
                    "Start Date": education.start_date.strftime("%d/%m/%Y") if education.start_date else "Unknown",
                    "End Date": education.end_date.strftime("%d/%m/%Y") if education.end_date else "Unknown",
                    "Role": education.role if education.role else "Unknown"
                }
                for education in education_records
            ],
            "Publications": [
                {
                    "Title": pub.title,
                    "DOI": pub.doi.strip(),
                    "Abstract": pub.abstract,
                    "Publication Date": pub.publication_date.strftime("%d/%m/%Y") if pub.publication_date else "Unknown"
                }
                for pub in publication_records
            ]
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



