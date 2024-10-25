import json

from flask import Flask, session
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

    profile_link = f'https://dl.acm.org/profile/{profile_link}'
    print(f"Author Name: {name}, Profile Link: {profile_link}")

    update_result, author_details_db = scraper.update_author_if_needed(name, profile_link)

    if update_result is None:
        return {
            "message": "Author details updated, but summary not available yet."
        }, 200

    return {
        "message": "Author summary retrieved successfully.",
        "summary": update_result,
        "author_details": author_details_db
    }, 200


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
