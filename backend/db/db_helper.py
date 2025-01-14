import os
from datetime import datetime
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from backend.db.models import Researcher, Paper, PaperAuthors, Fields_of_Study, ResearcherFieldsOfStudy, MaxPagesCache

# Load environment variables
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, '..', 'db', 'azure.env')
load_dotenv(env_path)

# Database configuration
server = os.getenv('DB_SERVER')
database = os.getenv('DB_DATABASE')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')

connection_string = (
    f"mssql+pymssql://{username}:{password}@{server}/{database}"
)

engine = create_engine(
    connection_string,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        'login_timeout': 60,
        'timeout': 60,
        'tds_version': '7.4'  # Ensures compatibility with newer SQL Server versions
    }
    
)

Session = scoped_session(sessionmaker(bind=engine))

# Helper functions for session management and date conversion
def get_session():
    try:
        session = Session()
        return session
    except SQLAlchemyError as e:
        print(f"Error creating session: {e}")
        return None

# Add records to the database
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

# Retrieve records from the database
def get_records(model, filters=None, session=None, limit=None, case_insensitive=False):
    if not session:
        session = get_session()
        if not session:
            return []
    try:
        query = session.query(model)

        if filters:
            if case_insensitive:
                for field, value in filters.items():
                    query = query.filter(func.lower(getattr(model, field)) == func.lower(value))
            else:
                query = query.filter_by(**filters)

        if limit is not None:
            query = query.limit(limit)

        return query.all()

    except SQLAlchemyError as e:
        print(f"Error retrieving records: {e}")
        return []
    finally:
        session.close()

# Update a record in the database
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

# Delete a record from the database
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
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

# Function to store author details from JSON
def store_author_details_in_db(author_details, session=None):
    if not session:
        session = get_session()

    try:
        primary_author_name = author_details['Name']
        primary_author_profile_link = author_details.get('Profile Link', None)
        fields_of_study = author_details.get('Fields of Study', [])
        publications = author_details.get('Publications', [])

        primary_author = session.query(Researcher).filter_by(profile_link=primary_author_profile_link).first()
        if not primary_author:
            primary_author = Researcher(name=primary_author_name, profile_link=primary_author_profile_link)
            session.add(primary_author)
            session.commit()

        for field_name in fields_of_study:
            field = session.query(Fields_of_Study).filter_by(field_name=field_name).first()
            if not field:
                field = Fields_of_Study(field_name=field_name)
                session.add(field)
                session.commit()
            if field not in primary_author.fields_of_study:
                primary_author.fields_of_study.append(field)

        for pub in publications:
            publication = session.query(Paper).filter_by(doi=pub['DOI']).first()
            if not publication:
                publication = Paper(
                    doi=pub['DOI'],
                    title=pub['Title'],
                    abstract=pub.get('Abstract', None),
                    publication_date=convert_date_string(pub.get('Publication Date')),
                    citations=pub.get('Citation Count', 0),
                )
                session.add(publication)
                session.commit()
            else:
                publication.title = pub['Title']
                publication.abstract = pub.get('Abstract', publication.abstract)
                publication.publication_date = convert_date_string(pub.get('Publication Date'))
                publication.citations = pub.get('Citation Count', publication.citations)
                session.commit()

            if primary_author not in publication.researchers:
                publication.researchers.append(primary_author)

            co_authors = pub.get('Co-Authors', [])
            for co_author in co_authors:
                co_author_name = co_author['Name']
                co_author_profile_link = co_author.get('Profile Link', None)

                co_author_entry = session.query(Researcher).filter_by(profile_link=co_author_profile_link).first()
                if not co_author_entry:
                    co_author_entry = Researcher(name=co_author_name, profile_link=co_author_profile_link)
                    session.add(co_author_entry)
                    session.commit()

                if co_author_entry not in publication.researchers:
                    publication.researchers.append(co_author_entry)

        session.commit()

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

# Function to get author details from the database
def get_author_details_from_db(author_name, session=None):
    if session is None:
        session = get_session()

    try:
        researcher = session.query(Researcher).filter(Researcher.name == author_name).first()
        if not researcher:
            return None

        researcher_id = researcher.id

        fields_of_study = [
            field.field_name for field in session.query(Fields_of_Study)
            .join(ResearcherFieldsOfStudy)
            .filter(ResearcherFieldsOfStudy.id == researcher_id).all()
        ]

        publications = []
        for paper in session.query(Paper).join(PaperAuthors).filter(PaperAuthors.id == researcher_id).all():
            co_authors = [
                {"Name": co_author.name, "Profile Link": co_author.profile_link}
                for co_author in session.query(Researcher)
                .join(PaperAuthors, Researcher.id == PaperAuthors.id)
                .filter(PaperAuthors.doi == paper.doi, Researcher.id != researcher_id).all()
            ]

            publication_date = paper.publication_date.strftime("%Y-%m-%d") if isinstance(paper.publication_date, datetime) else str(paper.publication_date)

            publications.append({
                "Title": paper.title,
                "DOI": paper.doi.strip(),
                "Abstract": paper.abstract,
                "Publication Date": publication_date,
                "Citation Count": paper.citations or 0,
                "Co-Authors": co_authors
            })

        author_details = {
            "Name": researcher.name,
            "Profile Link": researcher.profile_link,
            "Fields of Study": fields_of_study,
            "Publications": publications
        }
        return author_details

    except Exception as e:
        print(f"Error retrieving author details: {e}")
        return None


# Function to update author details in the database
def update_author_details_in_db(author_details, session=None):
    if session is None:
        session = get_session()

    try:
        author_name = author_details['Name']
        profile_link = author_details.get('Profile Link', None)
        fields_of_study = author_details.get('Fields of Study', [])
        publications = author_details.get('Publications', [])

        researcher = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(author_name)).first()

        if researcher:
            researcher.profile_link = profile_link
            session.commit()

            for field in fields_of_study:
                field_record = session.query(Fields_of_Study).filter(func.lower(Fields_of_Study.field_name) == func.lower(field)).first()
                if not field_record:
                    field_record = Fields_of_Study(field_name=field)
                    session.add(field_record)
                    session.commit()

                researcher_field_assoc = session.query(ResearcherFieldsOfStudy).filter_by(id=researcher.id, field_id=field_record.field_id).first()
                if not researcher_field_assoc:
                    new_researcher_field = ResearcherFieldsOfStudy(id=researcher.id, field_id=field_record.field_id)
                    session.add(new_researcher_field)
                    session.commit()

            for pub in publications:
                doi = pub['DOI']
                title = pub['Title']
                pub_date = convert_date_string(pub.get('Publication Date'))
                abstract = pub.get('Abstract', 'No abstract available.')
                citation_count = pub.get('Citation Count', 0)

                publication = session.query(Paper).filter_by(doi=doi).first()

                if publication:
                    publication.title = title
                    publication.publication_date = pub_date
                    publication.abstract = abstract
                    publication.citations = citation_count
                    session.commit()
                else:
                    new_paper = Paper(doi=doi, title=title, publication_date=pub_date, abstract=abstract, citations=citation_count)
                    session.add(new_paper)
                    session.commit()
                    new_author_assoc = PaperAuthors(doi=doi, id=researcher.id)
                    session.add(new_author_assoc)
                    session.commit()

                for co_author in pub.get('Co-Authors', []):
                    co_author_name = co_author.get("Name")
                    co_author_profile_link = co_author.get("Profile Link")

                    if co_author_name:
                        co_author_record = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(co_author_name)).first()
                        if not co_author_record:
                            co_author_record = Researcher(name=co_author_name, profile_link=co_author_profile_link)
                            session.add(co_author_record)
                            session.commit()

                        paper_author_assoc = session.query(PaperAuthors).filter_by(doi=doi, id=co_author_record.id).first()
                        if not paper_author_assoc:
                            new_paper_author = PaperAuthors(doi=doi, id=co_author_record.id)
                            session.add(new_paper_author)
                            session.commit()

    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error updating author details: {e}")
    finally:
        if session is not None:
            session.close()



# Function to delete author details from the database
def delete_author_details_from_db(author_name, session=None):
    if session is None:
        session = get_session()

    try:
        researcher = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(author_name)).first()

        if researcher:
            session.query(PaperAuthors).filter(PaperAuthors.id == researcher.id).delete()
            session.query(ResearcherFieldsOfStudy).filter(ResearcherFieldsOfStudy.id == researcher.id).delete()
            session.delete(researcher)
            session.commit()
            print(f"Successfully deleted details for researcher: {author_name}")
        else:
            print(f"No researcher found with name: {author_name}")

    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error deleting author details: {e}")
    finally:
        if session is not None:
            session.close()

# Function to retrieve a researcher's summary from the database
def get_researcher_summary(author_name, session=None):
    if session is None:
        session = get_session()
    try:
        researcher = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(author_name)).first()
        if researcher:
            return researcher.summary if researcher.summary else "Summary not available."
        else:
            return f"No researcher found with name: {author_name}"
    except SQLAlchemyError as e:
        print(f"Error retrieving researcher summary: {e}")
        return None
    finally:
        if session is not None:
            session.close()

# Function to update a researcher's summary in the database
def update_researcher_summary(author_name, new_summary, session=None):
    if session is None:
        session = get_session()
    try:
        researcher = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(author_name)).first()

        if researcher:
            researcher.summary = new_summary
            session.commit()
            print(f"Successfully updated the summary for researcher with name: {author_name}")
        else:
            print(f"No researcher found with name: {author_name}")
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error updating researcher summary: {e}")
    finally:
        if session is not None:
            session.close()

def delete_researcher_summary(author_name, session=None):
    if session is None:
        session = get_session()
    try:
        researcher = session.query(Researcher).filter(func.lower(Researcher.name) == func.lower(author_name)).first()

        if researcher.summary:
            researcher.summary = None
            session.commit()
            print(f"Successfully removed the summary for researcher with name: {author_name}")
        else:
            print(f"No summary found for author: {author_name}")
    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error updating researcher summary: {e}")
    finally:
        if session is not None:
            session.close()


def get_researcher_by_profile_link(profile_link, session=None):
    if session is None:
        session = get_session()
    try:
        return session.query(Researcher).filter(Researcher.profile_link.like(profile_link)).first()
    except Exception as e:
        print(f"Error while querying researcher by profile link: {e}")
        return None


# Function to remove rows from max_pages_cache if they are too old
def delete_stale_cache_entries(delta, session=None):
    if session is None:
        session = get_session()

    try:
        cutoff = datetime.utcnow() - delta
        # result = session.delete(MaxPagesCache).where(MaxPagesCache.date_created <= cutoff).rowcount
        stale_entries = session.query(MaxPagesCache).filter(MaxPagesCache.date_created <= cutoff)
        result = stale_entries.delete()
        session.commit()

        if result > 0:
            print(f"Successfully removed {result} stale cache entries")
        elif result == 0:
            print("No stale cache entries to remove")
        else:
            print(f"Unexpected output while removing stale cache entries: {result}")

        return result

    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error deleting stale cache entries: {e}")
        return None

    finally:
        if session is not None:
            session.close()

def get_latest_authors_with_summaries(limit=6, session=None):
    if session is None:
        session = get_session()

    try:
        query = (
            session.query(Researcher)
            .filter(Researcher.summary.isnot(None))
            .order_by(Researcher.id.desc())
        )

        filtered_authors = query.limit(limit).all()

        author_list = [
            {
                "Name": author.name,
                "Profile Link": author.profile_link,
                "Summary": author.summary
            }
            for author in filtered_authors[:limit]
        ]

        return author_list

    except SQLAlchemyError as e:
        print(f"Error retrieving latest authors with summaries: {e}")
        return []
    finally:
        if session is not None:
            session.close()