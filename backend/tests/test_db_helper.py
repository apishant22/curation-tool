import pytest
from backend.db.clear_db import clear_all_tables
from backend.db.models import Base
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
    researcher = Researcher(name='John Doe', profile_link="https://dl.acm.org/profile/1234", summary='Expert in machine learning')
    result = add_record(researcher, session=session)
    assert result is True

def test_get_records(setup_database, session):
    researcher = Researcher(name='Jane Smith', profile_link="https://dl.acm.org/profile/5678", summary='Expert in AI and Robotics')
    session.add(researcher)
    session.commit()

    records = get_records(Researcher, filters={'name': 'Jane Smith'}, session=session)
    assert len(records) == 1
    assert records[0].name == 'Jane Smith'
    assert records[0].profile_link == "https://dl.acm.org/profile/5678"

def test_update_record(setup_database, session):
    researcher = Researcher(name='John Doe', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    updates = {'name': 'Jane Doe'}
    result = update_record(Researcher, filters={'name': 'John Doe'}, updates=updates, session=session)
    assert result is True

    updated = session.query(Researcher).filter_by(name='Jane Doe').first()
    assert updated is not None
    assert updated.name == 'Jane Doe'

def test_delete_record(setup_database, session):
    researcher = Researcher(name='John Doe', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    result = delete_record(Researcher, filters={'name': 'John Doe'}, session=session)
    assert result is True

    deleted = session.query(Researcher).filter_by(name='John Doe').first()
    assert deleted is None

def test_store_and_get_author_details(setup_database, session):
    clear_all_tables()

    author_details = {
        'Name': 'John Doe',
        'Profile Link': "https://dl.acm.org/profile/1234",
        'Fields of Study': ['Machine Learning', 'Artificial Intelligence'],
        'Publications': [
            {
                'Title': 'Robotics Revolution',
                'DOI': '10.1234/robotics2023',
                'Abstract': 'A groundbreaking paper on Robotics.',
                'Publication Date': '2023-05-01',
                'Citation Count': 8,
                'Co-Authors': [{'Name': 'Jane Smith'}]
            }
        ]
    }

    print("Storing author details for test case:")
    store_author_details_in_db(author_details, session=session)
    session.commit()

    researcher = session.query(Researcher).filter_by(name='John Doe').first()
    print("Researcher directly queried in test:", researcher)
    assert researcher is not None, "Expected to find 'John Doe' in the database, but found None."

    retrieved_details = get_author_details_from_db('John Doe', session=session)
    print("Retrieved details:", retrieved_details)

    assert retrieved_details is not None, "Expected to retrieve data, but got None."
    assert retrieved_details['Name'] == 'John Doe'
    assert retrieved_details['Profile Link'] == "https://dl.acm.org/profile/1234"
    assert 'Machine Learning' in retrieved_details['Fields of Study']
    assert 'Artificial Intelligence' in retrieved_details['Fields of Study']

    publications = retrieved_details['Publications']
    assert len(publications) == 1
    assert publications[0]['Title'] == 'Robotics Revolution'
    assert publications[0]['DOI'].strip() == '10.1234/robotics2023'
    assert publications[0]['Citation Count'] == 8
    assert len(publications[0]['Co-Authors']) == 1
    assert publications[0]['Co-Authors'][0]['Name'] == 'Jane Smith'


def test_update_researcher_summary(setup_database, session):
    researcher = Researcher(name='John Doe', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    new_summary = 'This researcher specializes in AI and Robotics.'
    update_researcher_summary(author_name='John Doe', new_summary=new_summary, session=session)

    updated_researcher = session.query(Researcher).filter_by(name='John Doe').first()
    assert updated_researcher is not None
    assert updated_researcher.summary == new_summary

def test_get_researcher_summary(setup_database, session):
    researcher = Researcher(name='John Doe', summary='Expert in machine learning')
    session.add(researcher)
    session.commit()

    summary = get_researcher_summary('John Doe', session=session)
    assert summary == 'Expert in machine learning'

    summary = get_researcher_summary('Unknown Name', session=session)
    assert summary == 'No researcher found with name: Unknown Name'

def test_update_author_details_in_db(setup_database, session):
    clear_all_tables()
    author_details_initial = {
        'Name': 'John Doe',
        'Profile Link': "https://dl.acm.org/profile/1234",
        'Fields of Study': ['Artificial Intelligence'],
        'Publications': [
            {
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'A groundbreaking paper on AI.',
                'Publication Date': '2023-05-01',
                'Citation Count': 10,
                'Co-Authors': [{'Name': 'Jane Smith'}, {'Name': 'Alice Johnson'}]
            }
        ]
    }

    store_author_details_in_db(author_details_initial, session=session)
    session.commit()

    author_details_updated = {
        'Name': 'John Doe',
        'Profile Link': "https://dl.acm.org/profile/1234",
        'Fields of Study': ['Artificial Intelligence', 'Robotics'],
        'Publications': [
            {
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'An updated groundbreaking paper on AI.',
                'Publication Date': '2023-05-01',
                'Citation Count': 12,
                'Co-Authors': [{'Name': 'Jane Smith'}, {'Name': 'Alice Johnson'}]
            },
            {
                'Title': 'Robotics Advancements',
                'DOI': '10.1234/robotics2024',
                'Abstract': 'A new paper on robotics.',
                'Publication Date': '2024-03-01',
                'Citation Count': 5,
                'Co-Authors': [{'Name': 'Tom Lee'}]
            }
        ]
    }

    update_author_details_in_db(author_details_updated, session=session)
    session.commit()

    retrieved_details = get_author_details_from_db('John Doe', session=session)
    print("Retrieved details:", retrieved_details)

    assert retrieved_details is not None, "Expected to retrieve updated details, but got None."
    assert retrieved_details['Name'] == 'John Doe'
    assert 'Robotics' in retrieved_details['Fields of Study']

    publications = retrieved_details['Publications']
    assert len(publications) == 2
    assert publications[0]['Title'] == 'AI Revolution'
    assert publications[1]['Title'] == 'Robotics Advancements'


def test_delete_author_details_from_db(setup_database, session):
    author_details_initial = {
        'Name': 'John Doe',
        'Profile Link': "https://dl.acm.org/profile/1234",
        'Fields of Study': ['Artificial Intelligence'],
        'Publications': [
            {
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'A groundbreaking paper on AI.',
                'Publication Date': '2023-05-01'
            }
        ]
    }

    store_author_details_in_db(author_details_initial, session=session)
    delete_author_details_from_db('John Doe', session=session)
    retrieved_details = get_author_details_from_db('John Doe')

    assert retrieved_details is None

def test_store_and_retrieve_co_authors(setup_database, session):
    clear_all_tables()

    author_details = {
        'Name': 'John Doe',
        'Profile Link': "https://dl.acm.org/profile/1234",
        'Fields of Study': ['Artificial Intelligence'],
        'Publications': [
            {
                'Title': 'AI Revolution',
                'DOI': '10.1234/airevolution2023',
                'Abstract': 'A groundbreaking paper on AI.',
                'Publication Date': '2023-05-01',
                'Citation Count': 10,
                'Co-Authors': [
                    {'Name': 'Jane Smith', 'Profile Link': "https://dl.acm.org/profile/5678"},
                    {'Name': 'Alice Johnson', 'Profile Link': "https://dl.acm.org/profile/9101"}
                ]
            }
        ]
    }

    store_author_details_in_db(author_details, session=session)
    session.commit()

    primary_author = session.query(Researcher).filter_by(name='John Doe').first()
    assert primary_author is not None, "Primary author 'John Doe' should exist in the database."
    assert primary_author.profile_link == "https://dl.acm.org/profile/1234"

    co_author1 = session.query(Researcher).filter_by(name='Jane Smith').first()
    co_author2 = session.query(Researcher).filter_by(name='Alice Johnson').first()
    assert co_author1 is not None, "Co-author 'Jane Smith' should exist in the database."
    assert co_author2 is not None, "Co-author 'Alice Johnson' should exist in the database."
    assert co_author1.profile_link == "https://dl.acm.org/profile/5678", "Co-author 'Jane Smith' should have the correct profile link."
    assert co_author2.profile_link == "https://dl.acm.org/profile/9101", "Co-author 'Alice Johnson' should have the correct profile link."

    publication = session.query(Paper).filter_by(doi='10.1234/airevolution2023').first()
    assert publication is not None, "Publication 'AI Revolution' should exist in the database."
    assert publication.title == 'AI Revolution'
    assert publication.citations == 10

    primary_author_assoc = session.query(PaperAuthors).filter_by(doi='10.1234/airevolution2023', id=primary_author.id).first()
    co_author1_assoc = session.query(PaperAuthors).filter_by(doi='10.1234/airevolution2023', id=co_author1.id).first()
    co_author2_assoc = session.query(PaperAuthors).filter_by(doi='10.1234/airevolution2023', id=co_author2.id).first()
    assert primary_author_assoc is not None, "Primary author should be associated with the publication."
    assert co_author1_assoc is not None, "Co-author 'Jane Smith' should be associated with the publication."
    assert co_author2_assoc is not None, "Co-author 'Alice Johnson' should be associated with the publication."
