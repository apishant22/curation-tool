import json
from datetime import timedelta

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llmNew as llm
import backend.authorNetworkCode as nw
from backend.app.author_recommender import get_acm_recommendations_and_field_authors
import asyncio

from backend.app.progress_manager import ProgressManager

CACHE_LIFETIME = timedelta(weeks=4)
app = Flask(__name__)

progress_manager = ProgressManager()

# Define allowed origins
ALLOWED_ORIGINS = [
    "https://curation-tool.vercel.app",
    "http://localhost:3000"
]

# Simplified CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Content-Range"],
        "supports_credentials": True,
        "max_age": 600
    }
})

@app.after_request
def after_request(response):
    # Get the origin from the request
    origin = request.headers.get('Origin')
    
    # If the origin is in our allowed origins, set it in the response
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

def _search(search_type, name, page):
    normalized_name = name.lower()

    db.delete_stale_cache_entries(CACHE_LIFETIME)

    # try to get the estimated max pages from the database
    typ = model.SearchType.from_string(search_type)
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
    
@app.route('/network/<name>')
def network(name):
    try:
        network_data = nw.convert_to_json(name)
        return network_data,200
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@app.route('/search/author/<name>/<int:page>')
def search_author(name, page):
    return _search('author', name, page)

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

@app.route('/progress/<profile_link>', methods=['GET'])
def get_progress(profile_link):
    status = progress_manager.get_progress(profile_link)
    print(f"[DEBUG] Fetching progress for {profile_link}: {status}")
    return jsonify({"status": status}), 200


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

@app.route('/remove_summary/<author_name>', methods=['POST'])
def delete_summary(author_name):
    try:
        db.delete_researcher_summary(author_name)
        return jsonify({"message": f"'{author_name}'s summary go removed successfully"})
    except Exception as e:
        print(f"Error in /remove_summary route: {e}")
        return jsonify({"error": "An error occurred while removing  summary for author."}), 500

@app.route('/remove_author/<author_name>', methods=['POST'])
def remove_author(author_name):
    try:
        db.delete_author_details_from_db(author_name)
        return jsonify({"message": f"Author '{author_name}' removed successfully."}), 200
    except Exception as e:
        print(f"Error in /remove_author route: {e}")
        return jsonify({"error": "An error occurred while removing the author."}), 500

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

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(get_acm_recommendations_and_field_authors(
            authors=authors,
            max_recommendations=max_recommendations,
            max_results_per_field=max_results_per_field
        ))

        return jsonify(results), 200

    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/authors_with_summaries', methods=['GET'])
def get_authors_with_summaries():
    try:
        limit = request.args.get('limit', default=6, type=int)
        authors = db.get_latest_authors_with_summaries(limit=limit)

        if not authors:
            return jsonify({"message": "No authors with summaries found."}), 404

        return jsonify(authors), 200

    except Exception as e:
        print(f"Error fetching authors with summaries: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/coauthor_rewind/<string:author_name>', methods=['GET'])
def coauthor_rewind(author_name):
    try:
        wrapped_data = db.get_author_wrapped(author_name)
        print(json.dumps(wrapped_data, indent=4))
        if not wrapped_data:
            return jsonify({"error": "No data found for the given profile ID."}), 404

        return jsonify(wrapped_data), 200

    except Exception as e:
        print(f"Error in /coauthor_rewind route: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
