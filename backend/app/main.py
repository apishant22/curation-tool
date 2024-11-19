from flask import Flask, jsonify
from flask.views import View
from flask_cors import CORS

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)
CORS(app)

def _search(search_type, name, page):
    assert(search_type in ('author', 'field'))

    normalized_name = name.lower()

    # try to get the estimated max pages from the database
    try:
        max_pages = db.get_records(model.MaxPagesCache.max_pages, {'name': normalized_name})[0][0]
    except IndexError:
        # scrape it and add to the cache if not found
        print(f"Cache miss or new input. Running scraper.get_estimated_max_pages for: {name}")
        max_pages = scraper.get_estimated_max_pages(name)  # TODO separate cache for authors and fields?
        db.add_record(model.MaxPagesCache(name=normalized_name, max_pages=max_pages))
    else:
        print(f"Cache hit for {name}: {max_pages}")

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

@app.route('/regenerate_request/<author_name>/<json_change_list>')
def regenerate_request(author_name, json_change_list):
    # regenerate the researcher summary
    llm.regenerate_request(author_name, json_change_list)

    # get the new summary from the database
    return db.get_researcher_summary(author_name)
