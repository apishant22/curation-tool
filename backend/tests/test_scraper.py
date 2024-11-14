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
        "Name": "Adriana Wilde",
        "Profile Link": "https://dl.acm.org/profile/99659070982",
        "Fields of Study": [
            "Computing education",
            "Human computer interaction (HCI)"
        ],
        "Publications": [
            {
                "Title": "Content Co-creation for Novice Programmers",
                "DOI": "10.1145/3610969.3611135",
                "Abstract": "An action research on content co-creation...",
                "Publication Date": "2023-09-07",
                "Citation Count": 1,
                "Co-Authors": [
                    {"Name": "Jarutas Andritsch", "Profile Link": "https://dl.acm.org/profile/99661013948"}
                ]
            }
        ]
    }
    mock_scrape_author_details.return_value = json.dumps(scraped_data)

    update_author_if_needed("Adriana Wilde", "https://dl.acm.org/profile/99659070982")

    mock_store_author_details.assert_called_once_with(scraped_data)

@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.update_author_details_in_db')
def test_author_in_database_with_updated_data(mock_update_author_details, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Name": "Adriana Wilde",
        "Profile Link": "https://dl.acm.org/profile/99659070982",
        "Fields of Study": [
            "Computing education",
            "Human computer interaction (HCI)"
        ],
        "Publications": [
            {
                "Title": "Content Co-creation for Novice Programmers",
                "DOI": "10.1145/3610969.3611135",
                "Abstract": "An action research on content co-creation...",
                "Publication Date": "2023-09-07",
                "Citation Count": 1,
                "Co-Authors": [
                    {"Name": "Jarutas Andritsch", "Profile Link": "https://dl.acm.org/profile/99661013948"}
                ]
            }
        ]
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = {
        "Name": "Adriana Wilde",
        "Profile Link": "https://dl.acm.org/profile/99659070982",
        "Fields of Study": [
            "Computing education",
            "Human computer interaction (HCI)",
            "Visualization"
        ],
        "Publications": [
            {
                "Title": "Content Co-creation for Novice Programmers",
                "DOI": "10.1145/3610969.3611135",
                "Abstract": "An updated action research on content co-creation...",
                "Publication Date": "2023-09-07",
                "Citation Count": 2,
                "Co-Authors": [
                    {"Name": "Jarutas Andritsch", "Profile Link": "https://dl.acm.org/profile/99661013948"}
                ]
            },
            {
                "Title": "Equality, Diversity, and Inclusion in the CS Curriculum",
                "DOI": "10.1145/3610969.3611125",
                "Abstract": "Issues in equality, diversity, and inclusion in CS.",
                "Publication Date": "2023-09-07",
                "Citation Count": 1,
                "Co-Authors": []
            }
        ]
    }
    mock_scrape_author_details.return_value = json.dumps(scraped_data)

    update_author_if_needed("Adriana Wilde", "https://dl.acm.org/profile/99659070982")

    expected_updated_data = scraped_data
    mock_update_author_details.assert_called_once_with(expected_updated_data)


@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.get_researcher_summary')
def test_author_in_database_up_to_date_no_summary(mock_get_researcher_summary, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Name": "Adriana Wilde",
        "Profile Link": "https://dl.acm.org/profile/99659070982",
        "Fields of Study": [
            "Computing education",
            "Human computer interaction (HCI)"
        ],
        "Publications": [
            {
                "Title": "Content Co-creation for Novice Programmers",
                "DOI": "10.1145/3610969.3611135",
                "Abstract": "An action research on content co-creation...",
                "Publication Date": "2023-09-07",
                "Citation Count": 1,
                "Co-Authors": [
                    {"Name": "Jarutas Andritsch", "Profile Link": "https://dl.acm.org/profile/99661013948"}
                ]
            }
        ]
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = json.dumps(existing_data)
    mock_scrape_author_details.return_value = scraped_data
    mock_get_researcher_summary.return_value = None

    result, author_details_db = update_author_if_needed("Adriana Wilde", "https://dl.acm.org/profile/99659070982")

    assert result is None
    assert author_details_db == existing_data

    assert mock_get_researcher_summary.call_count >= 1


@patch('backend.app.author_scraper.scrape_author_details')
@patch('backend.app.author_scraper.get_author_details_from_db')
@patch('backend.app.author_scraper.get_researcher_summary')
def test_author_in_database_up_to_date_with_summary(mock_get_researcher_summary, mock_get_author_details, mock_scrape_author_details):
    existing_data = {
        "Name": "Adriana Wilde",
        "Profile Link": "https://dl.acm.org/profile/99659070982",
        "Fields of Study": [
            "Computing education",
            "Human computer interaction (HCI)"
        ],
        "Publications": [
            {
                "Title": "Content Co-creation for Novice Programmers",
                "DOI": "10.1145/3610969.3611135",
                "Abstract": "An action research on content co-creation...",
                "Publication Date": "2023-09-07",
                "Citation Count": 1,
                "Co-Authors": [
                    {"Name": "Jarutas Andritsch", "Profile Link": "https://dl.acm.org/profile/99661013948"}
                ]
            }
        ]
    }
    mock_get_author_details.return_value = existing_data
    scraped_data = json.dumps(existing_data)
    mock_scrape_author_details.return_value = scraped_data
    mock_get_researcher_summary.return_value = "Research summary."

    result, author_details_db = update_author_if_needed("Adriana Wilde", "https://dl.acm.org/profile/99659070982")

    assert result == "Research summary."
    assert author_details_db == existing_data
    mock_get_researcher_summary.assert_called_once()

