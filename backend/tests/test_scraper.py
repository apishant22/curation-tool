import pytest
from backend.db.models import *
from backend.app.author_scraper import *
from unittest.mock import patch
import json

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

@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.store_author_details_in_db')
def test_no_author_in_database(mock_store_author_details, mock_get_author_details, mock_scrape_author_details):
    mock_get_author_details.return_value = None
    scraped_data = {
        "Orcid ID": "0000-0002-1684-1539",
        "Name": "John Doe",
        "Biography": ["Test biography."],
        "Employment History": [],
        "Education History": [],
        "Publications": []
    }
    mock_scrape_author_details.return_value = json.dumps(scraped_data)

    update_author_if_needed("John Doe", "profile_link")

    mock_store_author_details.assert_called_once_with(scraped_data)

@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.update_author_details_in_db')
def test_author_in_database_with_updated_data(mock_update_author_details, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Orcid ID": "0000-0002-1684-1539",
        "Name": "John Doe",
        "Biography": ["Old biography."],
        "Employment History": [],
        "Education History": [],
        "Publications": []
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = {
        "Orcid ID": "0000-0002-1684-1539",
        "Name": "John Doe",
        "Biography": ["Updated biography."],
        "Employment History": [],
        "Education History": [],
        "Publications": []
    }
    mock_scrape_author_details.return_value = json.dumps(scraped_data)

    update_author_if_needed("John Doe", "profile_link")

    mock_update_author_details.assert_called_once_with(scraped_data)


@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.get_researcher_summary')
def test_author_in_database_up_to_date_no_summary(mock_get_researcher_summary, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Orcid ID": "0000-0002-1684-1539",
        "Name": "John Doe",
        "Biography": ["Test biography."],
        "Employment History": [],
        "Education History": [],
        "Publications": []
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = json.dumps(existing_data)
    mock_scrape_author_details.return_value = scraped_data
    mock_get_researcher_summary.return_value = None

    result, author_details_db = update_author_if_needed("John Doe", "profile_link")

    assert result is None
    assert author_details_db == existing_data
    mock_get_researcher_summary.assert_called_once()


@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.get_researcher_summary')
def test_author_in_database_up_to_date_with_summary(mock_get_researcher_summary, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Orcid ID": "0000-0002-1684-1539",
        "Name": "John Doe",
        "Biography": ["Test biography."],
        "Employment History": [],
        "Education History": [],
        "Publications": []
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = json.dumps(existing_data)
    mock_scrape_author_details.return_value = scraped_data
    mock_get_researcher_summary.return_value = "Test summary."

    result, author_details_db = update_author_if_needed("John Doe", "profile_link")

    assert result == "Test summary."
    assert author_details_db == existing_data
    mock_get_researcher_summary.assert_called_once()
