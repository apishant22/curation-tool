import json

from flask import Flask, jsonify, View
from flask_cors import CORS

import re
import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)
CORS(app)

# author_name_cache = {}  # is this ever used?

# This view is a class as it requires state in the form of a cache
class Search(View):
    orcid_pattern = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{4}$")

    def __init__(self):
        self.max_pages_cache = dict()
        self.last_searched_name = None

    def dispatch_request(self, name, page):
        if orcid_pattern.match(name):
            print(f"Detected ORCID ID: {name}. Fetching associated author name.")
            max_pages = 1

        else:
            normalized_name = name.lower()
            if normalized_name != self.last_searched_name:
                print(f"Cache miss or new name. Running scraper.get_estimated_max_pages for: {name}")
                max_pages = scraper.get_estimated_max_pages(name)
                self.max_pages_cache[normalized_name] = max_pages
                self.last_searched_name = normalized_name
            else:
                print(f"Cache hit for: {name}")
                max_pages = self.max_pages_cache.get(normalized_name, 0)

        search_results = scraper.identify_input_type_and_search_author(name, page, max_pages)
        return jsonify(search_results)

app.add_url_rule('/search/<name>/<int:page>', view_func=Search.as_view('search'))

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

@app.route('/misc_profiles/<int:number>')
def misc_profiles(number):
    '''Fetch number of profiles from the database'''
    # select 'number' arbitrary orcids
    orcids = [row[0] for row in db.get_records(model.Researcher.orcid, limit=number)]
    print(orcids)

    # fetch and return their details
    result = [db.get_author_details_from_db(orcid) for orcid in orcids]
    print(result)
    return result
