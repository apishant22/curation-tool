import json

from flask import Flask, jsonify
from flask.views import View
from flask_cors import CORS

import re
import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)
CORS(app)

# This view is a class as it requires state in the form of a cache
class Search(View):
    def __init__(self):
        self.max_pages_cache = {}
        self.last_searched_name = None

    def dispatch_request(self, search_type, input, page):
        if search_type not in ['author', 'field']:
            return jsonify({"error": "Invalid search type. Must be 'author' or 'field'."}), 400

        normalized_name = input.lower()
        try:
            if normalized_name != self.last_searched_name:
                print(f"Cache miss or new input. Running scraper.get_estimated_max_pages for: {input}")
                max_pages = scraper.get_estimated_max_pages(input)
                self.max_pages_cache[normalized_name] = max_pages
                self.last_searched_name = normalized_name
            else:
                print(f"Cache hit for: {input}")
                max_pages = self.max_pages_cache.get(normalized_name, 0)

            search_results = scraper.identify_input_type_and_search(
                input_value=input,
                page_number=page,
                search_type=search_type,
                max_pages=max_pages
            )

            response = {
                "results": search_results["results"],
                "max_pages": search_results["max_pages"],
                "no_previous_page": search_results["no_previous_page"],
                "no_next_page": search_results["no_next_page"],
                "search_type": search_type
            }
            return jsonify(response), 200

        except ValueError as ve:
            print(f"ValueError during search: {ve}")
            return jsonify({"error": str(ve)}), 400
        except KeyError as ke:
            print(f"KeyError during search: {ke}")
            return jsonify({"error": "Internal error occurred. Please try again later."}), 500
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return jsonify({"error": "Unexpected error occurred. Please try again later."}), 500

app.add_url_rule('/search/<search_type>/<input>/<int:page>', view_func=Search.as_view('search'))

@app.route('/search/<search_type>/<input>/<int:page>', methods=['GET'])
def search_endpoint(search_type, input, page):
    print(f"Received request: search_type={search_type}, input={input}, page={page}")
    if search_type not in ['author', 'field']:
        return jsonify({"error": "Invalid search type. Must be 'author' or 'field'."}), 400
    return Search().dispatch_request(search_type, input, page)

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
