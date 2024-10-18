import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.models import Base, Researcher, Organisation, Dept, Researcher_Employment, Paper, Paper_Authors
from backend.db.db_helper import add_record, get_records, update_record, delete_record, get_or_add_org_and_dept, \
    get_author_details_from_db, store_author_details_in_db, update_researcher_summary

DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=engine)

@pytest.fixture(scope='function')
def setup_database():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(scope='function')
def session():
    connection = engine.connect()
    transaction = connection.begin()

    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

# Test functions

def test_add_record(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6789', name='John Doe', bio='Researcher in AI', summary='Expert in machine learning')
    result = add_record(researcher, session=session)  # Pass session
    assert result == True

def test_get_records(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6780', name='Jane Smith', bio='Researcher in Robotics', summary='Expert in AI and Robotics')
    session.add(researcher)
    session.commit()

    records = get_records(Researcher, filters={'orcid': '0000-0001-2345-6780'}, session=session)  # Pass session
    assert len(records) == 1
    assert records[0].name == 'Jane Smith'


def test_update_record(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6789', name='John Doe', bio='Researcher in AI', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    updates = {'name': 'Jane Doe'}
    result = update_record(Researcher, filters={'orcid': '0000-0001-2345-6789'}, updates=updates, session=session)  # Pass session
    assert result == True

    updated = session.query(Researcher).filter_by(orcid='0000-0001-2345-6789').first()
    assert updated.name == 'Jane Doe'

def test_delete_record(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6789', name='John Doe', bio='Researcher in AI', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    result = delete_record(Researcher, filters={'orcid': '0000-0001-2345-6789'}, session=session)  # Pass session
    assert result == True

    deleted = session.query(Researcher).filter_by(orcid='0000-0001-2345-6789').first()
    assert deleted is None

def test_get_author_details_from_db(setup_database, session):
    author_details = {
        'Name': 'John Doe',
        'Orcid ID': '0000-0001-2345-6789',
        'Biography': ['Researcher in Robotics'],
        'Employment History': [
            {
                'Organization': 'University of Southampton',
                'Department': 'School of Electronics and Computer Science',
                'Start Date': '01/04/2023',
                'End Date': 'Unknown',
                'Role': 'Lecturer'
            }
        ],
        'Education History': [
            {
                'Institution': 'University of Cambridge',
                'Department': 'Computer Science',
                'Start Date': '01/09/2015',
                'End Date': '01/07/2019',
                'Role': 'Student'
            }
        ],
        'Publications': [
            {
                'Title': 'Robotics Revolution',
                'DOI': '10.1234/robotics2023',
                'Abstract': 'A groundbreaking paper on Robotics.',
                'Publication Date': '2023-05-01'
            }
        ]
    }

    store_author_details_in_db(author_details)

    retrieved_details = get_author_details_from_db('0000-0001-2345-6789')

    assert retrieved_details is not None
    assert retrieved_details['Name'] == 'John Doe'
    assert retrieved_details['Orcid ID'] == '0000-0001-2345-6789'
    assert 'Researcher in Robotics' in retrieved_details['Biography']

    employment_history = retrieved_details['Employment History']
    assert len(employment_history) == 1
    assert employment_history[0]['Organization'] == 'University of Southampton'
    assert employment_history[0]['Department'] == 'School of Electronics and Computer Science'
    assert employment_history[0]['Role'] == 'Lecturer'

    education_history = retrieved_details['Education History']
    assert len(education_history) == 1
    assert education_history[0]['Institution'] == 'University of Cambridge'
    assert education_history[0]['Department'] == 'Computer Science'
    assert education_history[0]['Role'] == 'Student'

    publications = retrieved_details['Publications']
    assert len(publications) == 1
    assert publications[0]['Title'] == 'Robotics Revolution'

    assert publications[0]['DOI'].strip() == '10.1234/robotics2023'

def test_update_researcher_summary(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6789', name='John Doe', bio='Researcher in AI', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    added_researcher = session.query(Researcher).filter_by(orcid='0000-0001-2345-6789').first()
    assert added_researcher is not None
    assert added_researcher.summary == 'Expert in machine learning'

    new_summary = 'This researcher specializes in AI and Robotics.'
    update_researcher_summary(orcid_id='0000-0001-2345-6789', new_summary=new_summary, session=session)

    updated_researcher = session.query(Researcher).filter_by(orcid='0000-0001-2345-6789').first()
    assert updated_researcher is not None
    assert updated_researcher.summary == new_summary


