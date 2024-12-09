from datetime import timedelta

from flask import Flask, jsonify, request
from flask.views import View
from flask_cors import CORS
import os
import json
import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llmNew as llm
import backend.authorNetworkCode as nw

CACHE_LIFETIME = timedelta(weeks=4)

app = Flask(__name__)
CORS(app)

def _search(search_type, name, page):
    assert(search_type in ('author', 'field'))

    normalized_name = name.lower()

    db.delete_stale_cache_entries(CACHE_LIFETIME)

    # try to get the estimated max pages from the database
    typ = 0 if search_type == 'author' else 1
    try:
        max_pages = db.get_records(model.MaxPagesCache.max_pages, {'name': normalized_name, 'search_type': typ})[0][0]
    except IndexError:
        # scrape it and add to the cache if not found
        print(f"Cache miss or new input. Running scraper.get_estimated_max_pages for: {search_type} {name}")
        # commenting this function out since it is not complete yet, use one parameter meanwhile it is getting done
        # max_pages = scraper.get_estimated_max_pages(name, search_type)  # TODO function needs updating to work for fields too
        max_pages = scraper.get_estimated_max_pages(search_type)
        db.add_record(model.MaxPagesCache(name=normalized_name, max_pages=max_pages, search_type=typ))
    else:
        print(f"Cache hit for {search_type} {name}: {max_pages}")

    # perform the search
    try:
        search_results = scraper.identify_input_type_and_search(
            input_value=name,
            page_number=page,
            search_type=search_type,
            max_pages=max_pages
        )

        return jsonify(search_results), 200

    except Exception as e:
        msg = f'An unexpected error occurred: {e}'
        print(msg)
        return jsonify(error = msg), 500

@app.route('/search/author/<name>/<int:page>')
def search_author(name, page):
    return _search('author', name, page)

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

@app.route('/update_summary/<author_name>', methods=['POST'])
def update_summary(author_name):
    if request.headers.get('Content-Type') == 'application/json':
        try:
            json_data = request.json
            new_summary = json_data.get('content')

            if not new_summary:
                return jsonify({"error": "No content provided"}), 400

            db.update_researcher_summary(author_name, new_summary)
            return jsonify({"message": f"Summary for {author_name} updated successfully"}), 200

        except Exception as e:
            print(f"Error in /update_summary route: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid Content-Type"}), 400


if __name__=="__main__":
    app.run(debug=True)
