from datetime import timedelta

import requests
from flask import Flask, jsonify, request, g
from flask_cors import CORS

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llmNew as llm
from backend.app.author_recommender import get_acm_recommendations_and_field_authors
from backend.app.search_scrape_context import SearchScrapeContext

CACHE_LIFETIME = timedelta(weeks=4)

app = Flask(__name__)
CORS(app)

def get_request_context(filter_gender=None):
    if not hasattr(g, 'search_context'):
        g.search_context = SearchScrapeContext(filter_gender=filter_gender or False)
    elif filter_gender is not None:
        g.search_context.set_filter_gender(filter_gender)
    return g.search_context

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

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()

        if not isinstance(data, dict) or 'authors' not in data:
            return jsonify({"error": "Invalid input. 'authors' key with a list of authors is required."}), 400

        authors = data.get('authors', [])
        max_recommendations = data.get('max_recommendations', 5)
        max_results_per_field = data.get('max_results_per_field', 5)

        context = get_request_context()

        results = get_acm_recommendations_and_field_authors(
            context=context,
            authors=authors,
            max_recommendations=max_recommendations,
            max_results_per_field=max_results_per_field
        )

        return jsonify(results), 200

    except Exception as e:
        print(f"Error occurred: {e}")
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
