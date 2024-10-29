import pytest
from backend.db.clear_db import clear_all_tables
from backend.db.models import *
from backend.db.db_helper import *

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
    clear_all_tables()
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
                'Publication Date': '2023-05-01',
                'Citation Count': 8,
                'Co-Authors': [
                    {'Name': 'Jane Smith', 'Orcid ID': '0000-0001-2345-9876'}
                ]
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
    assert publications[0]['Citation Count'] == 8
    assert len(publications[0]['Co-Authors']) == 1
    assert publications[0]['Co-Authors'][0]['Name'] == 'Jane Smith'
    assert publications[0]['Co-Authors'][0]['Orcid ID'] == '0000-0001-2345-9876'

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

def test_get_researcher_summary(setup_database, session):
    researcher = Researcher(orcid='0000-0001-2345-6789', name='John Doe', bio='Researcher in AI', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    summary = get_researcher_summary('0000-0001-2345-6789', session=session)
    assert summary == 'Expert in machine learning'

    summary = get_researcher_summary('0000-0000-0000-0000', session=session)
    assert summary == 'No researcher found with ORCID: 0000-0000-0000-0000'

def test_update_author_details_in_db(setup_database, session):
    clear_all_tables()
    author_details_initial = {
        'Name': 'John Doe',
        'Orcid ID': '0000-0001-2345-6789',
        'Biography': ['Researcher in AI'],
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
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'A groundbreaking paper on AI.',
                'Publication Date': '2023-05-01',
                'Citation Count': 10,
                'Co-Authors': [
                    {'Name': 'Jane Smith', 'Orcid ID': '0000-0001-2345-9876'},
                    {'Name': 'Alice Johnson', 'Orcid ID': '0000-0002-3456-7890'}
                ]
            }
        ]
    }

    store_author_details_in_db(author_details_initial)

    author_details_updated = {
        'Name': 'John Doe',
        'Orcid ID': '0000-0001-2345-6789',
        'Biography': ['Researcher in Robotics'],
        'Employment History': [
            {
                'Organization': 'University of Southampton',
                'Department': 'School of Electronics and Computer Science',
                'Start Date': '01/04/2023',
                'End Date': '31/12/2023',
                'Role': 'Senior Lecturer'
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
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'An updated groundbreaking paper on AI.',
                'Publication Date': '2023-05-01',
                'Citation Count': 12,
                'Co-Authors': [
                    {'Name': 'Jane Smith', 'Orcid ID': '0000-0001-2345-9876'},
                    {'Name': 'Alice Johnson', 'Orcid ID': '0000-0002-3456-7890'}
                ]
            },
            {
                'Title': 'Robotics Advancements',
                'DOI': '10.1234/robotics2024',
                'Abstract': 'A new paper on robotics.',
                'Publication Date': '2024-03-01',
                'Citation Count': 5,
                'Co-Authors': [
                    {'Name': 'Tom Lee', 'Orcid ID': '0000-0003-4567-8901'}
                ]
            }
        ]
    }

    update_author_details_in_db(author_details_updated)

    retrieved_details = get_author_details_from_db('0000-0001-2345-6789')

    assert retrieved_details is not None
    assert retrieved_details['Name'] == 'John Doe'
    assert retrieved_details['Orcid ID'] == '0000-0001-2345-6789'
    assert 'Researcher in Robotics' in retrieved_details['Biography']

    employment_history = retrieved_details['Employment History']
    assert len(employment_history) == 1
    assert employment_history[0]['Organization'] == 'University of Southampton'
    assert employment_history[0]['Department'] == 'School of Electronics and Computer Science'
    assert employment_history[0]['Role'] == 'Senior Lecturer'
    assert employment_history[0]['End Date'] == '2023-12-31'

    education_history = retrieved_details['Education History']
    assert len(education_history) == 1
    assert education_history[0]['Institution'] == 'University of Cambridge'
    assert education_history[0]['Department'] == 'Computer Science'
    assert education_history[0]['Role'] == 'Student'

    publications = retrieved_details['Publications']
    assert len(publications) == 2

    publication1 = publications[0]
    assert publication1['Title'] == 'AI Revolution'
    assert publication1['Abstract'] == 'An updated groundbreaking paper on AI.'
    assert publication1['Citation Count'] == 12
    assert len(publication1['Co-Authors']) == 2
    assert publication1['Co-Authors'][0]['Name'] == 'Jane Smith'

    publication2 = publications[1]
    assert publication2['Title'] == 'Robotics Advancements'
    assert publication2['Abstract'] == 'A new paper on robotics.'
    assert publication2['Citation Count'] == 5
    assert len(publication2['Co-Authors']) == 1
    assert publication2['Co-Authors'][0]['Name'] == 'Tom Lee'

def test_delete_author_details_from_db(setup_database, session):
    author_details_initial = {
        'Name': 'John Doe',
        'Orcid ID': '0000-0001-2345-6789',
        'Biography': ['Researcher in AI'],
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
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'A groundbreaking paper on AI.',
                'Publication Date': '2023-05-01'
            }
        ]
    }

    store_author_details_in_db(author_details_initial)
    delete_author_details_from_db('0000-0001-2345-6789')
    retrieved_details = get_author_details_from_db('0000-0001-2345-6789')

    assert retrieved_details is None