import asyncio
from datetime import timedelta

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llmNew as llm
import backend.authorNetworkCode as nw
from backend.app.author_recommender import get_acm_recommendations_and_field_authors
from backend.app.context_manager import get_request_context
from backend.app.search_scrape_context import SearchScrapeContext

CACHE_LIFETIME = timedelta(weeks=4)

app = Flask(__name__)
CORS(app)

def _search(search_type, name, page, filter_gender):
    assert(search_type in ('author', 'field'))

    normalized_name = name.lower()

    db.delete_stale_cache_entries(CACHE_LIFETIME)

    context = get_request_context(filter_gender)

    # try to get the estimated max pages from the database
    typ = 0 if search_type == 'author' else 1
    try:
        max_pages = db.get_records(model.MaxPagesCache.max_pages, {'name': normalized_name, 'search_type': typ})[0][0]
    except IndexError:
        # scrape it and add to the cache if not found
        print(f"Cache miss or new input. Running scraper.get_estimated_max_pages for: {search_type} {name}")
        try:
            max_pages = scraper.get_estimated_max_pages(name)  # Pass the timeout to scraper
            db.add_record(model.MaxPagesCache(name=normalized_name, max_pages=max_pages, search_type=typ))
        except requests.Timeout:
            msg = "The request to the external scraper timed out. Please try again later."
            print(msg)
            return jsonify(error=msg), 504
        except Exception as e:
            msg = f"An unexpected error occurred during scraping: {e}"
            print(msg)
            return jsonify(error=msg), 500
    else:
        print(f"Cache hit for {search_type} {name}: {max_pages}")

    # perform the search
    try:
        print(f"Searching: type={search_type}, name={name}, page={page}")
        print(f"Normalized name: {normalized_name}")
        print(f"Max pages from cache: {max_pages}")

        search_results = scraper.identify_input_type_and_search(
            context=context,
            input_value=name,
            page_number=page,
            search_type=search_type
        )
        print(f"Search results: {search_results}")

        return jsonify(search_results), 200

    except requests.Timeout:
        msg = "The request to the external scraper timed out. Please try again later."
        print(msg)
        return jsonify(error=msg), 504
    except Exception as e:
        msg = f'An unexpected error occurred: {e}'
        print(msg)
        return jsonify(error=msg), 500


# Expose graph.json data at http://localhost:3002/graph
@app.route('/graph', methods=['GET'])
def get_graph():
    try:
        graph_path = os.path.join(os.path.dirname(__file__), "graph.json")
        with open(graph_path,"r") as f:
            graph_data = json.load(f)
        return jsonify(graph_data), 200
    except FileNotFoundError:
        return jsonify({"error": "Graph data not found"}), 404
    
@app.route('/network/<name>')
def generate_network(name):
    network_data = nw.convert_to_json(name)
    # try:
    #     network_path = os.path.join(os.path.dirname(__file__), "graph.json")
    #     with open(network_path,"r") as f:
    #         network_data = json.load(f)
    #     return jsonify(network_data), 200
    # except FileNotFoundError:
    #     return jsonify({"error": "Network data not found"}), 404
    return network_data, 200


@app.route('/search/field/<name>/<int:page>')
def search_field(name, page):
    return _search('field', name, page)
@app.route('/search/author/<name>/<int:page>/<gender>')
def search_author(name, page,gender):
    return _search('author', name, page, gender)

@app.route('/search/field/<name>/<int:page>/<gender>')
def search_field(name, page, gender):
    return _search('field', name, page, gender)

@app.route('/query/<name>/<profile_link>')
def query(name, profile_link):
    profile_link = f'https://dl.acm.org/profile/{profile_link}'
    print(f"Author Name: {name}, Profile Link: {profile_link}")

    update_result, author_details_db = scraper.update_author_if_needed(name, profile_link)

    response = {'author_details': author_details_db}
    if update_result is None:
        response['message'] = "Author details updated, but summary not available yet."
    else:
        response |= {'message': "Author summary retrieved successfully.", "summary": update_result}

    return jsonify(response), 200

# TODO make this work with the new database
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

@app.route('/regenerate_request/<author_name>', methods=['POST'])
def regenerate_request(author_name):
    if (request.headers.get('Content-Type') == 'application/json'):
        json = request.json
    print(author_name, json)

    # regenerate the researcher summary
    llm.regenerate_request(author_name, json)
    # get the new summary from the database
    res = db.get_researcher_summary(author_name)
    print(res)
    return db.get_researcher_summary(author_name), 200

if __name__=="__main__":
    app.run(debug=True)
@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()

        print(f"[DEBUG] Raw input data: {data}")

        if not isinstance(data, dict) or 'authors' not in data:
            return jsonify({"error": "Invalid input. 'authors' key with a list of authors is required."}), 400

        authors = data.get('authors', [])
        max_recommendations = data.get('max_recommendations', 5)
        max_results_per_field = data.get('max_results_per_field', 5)

        try:
            max_recommendations = int(max_recommendations)
            max_results_per_field = int(max_results_per_field)
        except ValueError:
            return jsonify({"error": "Invalid input: max_recommendations and max_results_per_field must be integers."}), 400

        context = get_request_context()

        results = asyncio.run(get_acm_recommendations_and_field_authors(
            context=context,
            authors=authors,
            max_recommendations=max_recommendations,
            max_results_per_field=max_results_per_field
        ))

        return jsonify(results), 200

    except Exception as e:
        print(f"[ERROR] Exception occurred: {e} ")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/authors_with_summaries', methods=['GET'])
def get_authors_with_summaries():
    try:
        limit = request.args.get('limit', default=6, type=int)
        context = get_request_context()
        authors = db.get_latest_authors_with_summaries(context, limit=limit)

        if not authors:
            return jsonify({"message": "No authors with summaries found."}), 404

        return jsonify(authors), 200

    except Exception as e:
        print(f"Error fetching authors with summaries: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
