import json

from flask import Flask
from flask_cors import CORS

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)

CORS(app)

# this one works!
@app.route('/search/<name>/<int:page>')
def search(name, page):
    return scraper.identify_input_type_and_search_author(name, page)

@app.route('/query/<name>/<profile_link>')
def query(name, profile_link):
    '''Retrieve profile and LLM summary of author from the database, creating them if they do not exist.'''

    # no extra slashes allowed in URLS
    profile_link = f'https://dl.acm.org/profile/{profile_link}'
    print(name, profile_link)

    # get the orcid id
    # TODO should this be from the database instead of scraping? what to do when there is no orcid?
    publications = scraper.scrape_author_publications(profile_link)
    orcid = scraper.find_author_orcid_by_dois(publications, name)
    print(orcid)

    # does the author exist in the database?
    existing_researcher = db.get_records(model.Researcher, filters={"orcid": orcid})
    print(existing_researcher)

    # if so, retrieve and return their details
    if existing_researcher:
        details = db.get_author_details_from_db(orcid)

    # if not, scrape the details
    else:
        details = json.loads(scraper.scrape_author_details(name, profile_link))

        # generate and store llm summary
        llm.request(orcid)

    details['Summary'] = db.get_researcher_summary(orcid)

    print(details)
    return details

@app.route('/misc_profiles/<number>')
def misc_profiles(number):
    '''Fetch number of profiles from the database'''

    # select 'number' arbitrary orcids
    orcids = [row[0] for row in db.get_records(model.Researcher.orcid, limit=number)]
    print(orcids)

    # fetch and return their details
    result = [db.get_author_details_from_db(orcid) for orcid in orcids]
    print(result)
    return result
