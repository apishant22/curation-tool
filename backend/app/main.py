import json

from flask import Flask
from flask_cors import CORS

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
from flask import jsonify

app = Flask(__name__)

CORS(app)

max_pages_cache = {}
last_searched_name = None

@app.route('/search/<name>/<page>')
def search(name, page):
    global last_searched_name

    normalized_name = name.lower()

    if normalized_name != last_searched_name:
        print(f"Cache miss or new name. Running scraper.get_max_pages for: {name}")
        max_pages = scraper.get_max_pages(name)
        max_pages_cache[normalized_name] = max_pages
        last_searched_name = normalized_name
    else:
        print(f"Cache hit for: {name}")
        max_pages = max_pages_cache.get(normalized_name)

    page = int(page)
    search_results = scraper.identify_input_type_and_search_author(name, page, max_pages)
    search_results['max_pages'] = max_pages

    return jsonify(search_results)

@app.route('/query/<name>/<profile_link>')
def query(name, profile_link):
    profile_link = f'https://dl.acm.org/profile/{profile_link}'
    print(f"Author Name: {name}, Profile Link: {profile_link}")

    update_result, author_details_db = scraper.update_author_if_needed(name, profile_link)

    if update_result is None:
        return {
            "message": "Author details updated, but summary not available yet.",
            "author_details": author_details_db
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
