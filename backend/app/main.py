import json

from flask import Flask

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)

# this one works!
@app.route('/search/<name>')
def search(name):
    result = scraper.identify_input_type_and_search_author(name)
    return result

@app.route('/query/<author>')
def query(author):
    '''Retrieve profile and LLM summary of author from the database, creating them if they do not exist.'''
    author = json.loads(author)

    # no extra slashes allowed in URLS
    author['Profile Link'] = f'https://dl.acm.org/profile/{author['Profile Link']}'
    print(author)

    # get the orcid id
    # TODO should this be from the database instead of scraping? what to do when there is no orcid?
    publications = scraper.scrape_author_publications(author['Profile Link'])
    orcid = scraper.find_author_orcid_by_dois(publications, author['Name'])
    print(orcid)

    # does the author exist in the database?
    existing_researcher = db.get_records(model.Researcher, filters={"orcid": orcid})
    print(existing_researcher)

    # if so, retrieve and return their details
    if existing_researcher:
        details = db.get_author_details_from_db(orcid)

    # if not, scrape the details
    else:
        details = json.loads(scraper.scrape_author_details(author['Name'], author['Profile Link']))

        # generate and store llm summary
        llm.request(orcid)

    details['Summary'] = db.get_researcher_summary(orcid)

    print(details)
    return json.dumps(details)
