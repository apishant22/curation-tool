
import json

from flask import Flask, url_for
from markupsafe import escape
from sqlalchemy import cast, Text

import backend.app.author_scraper as scraper
import backend.db.db_helper as db
import backend.db.models as model
import backend.llm.llm as llm

app = Flask(__name__)

# http://orcid.org/0000-0002-1684-1539 -> 0000000216841539 for database
def format_orcid(orcid):
    return ''.join(char for char in orcid.split('/')[-1] if char != '-')

# this one works!
@app.route('/search/<name>')
def search(name):
    result = scraper.identify_input_type_and_search_author(name)
    print(escape(str(json.loads(result)[0])))
    # print(url_for('query', author=str(json.loads(result)[0])))
    return result

'''
# TODO this one still needs testing
@app.route('/query/<author>')
def query(author):
    author = json.loads(author)
    print(author['Name'])

    # does the profile exist in the database?

    try:
        orcid = db.get_records(
            model.Researcher.orcid,
            {'name': cast(author['Name'], Text)}
        )[0]
    except IndexError:
        orcid = None

    return str(orcid)

    # if it does, retrieve and return it
    if orcid is not None:
        # TODO should get_author_details_from_db also get the summary?
        details = db.get_author_details_from_db(orcid)
        details['Summary'] = db.get_records(
            model.Researcher.summary,
            {'orcid': orcid}
        ).first()

        return json.dumps(details)

    # scrape author details
    details = scraper.scrape_author_details(author['Name'], author['Profile Link'])

    # generate and store llm summary
    # TODO not sure if the llm request function is finished?
    summary = llm.request(orcid)

    details['Summary'] = summary
    db.update_record(
        model.Researcher,
        {'orcid': orcid},
        {'summary': summary}
    )

    # return author details
    return json.dumps(details)
'''

@app.route('/query/<author>')
def query(author):
    '''Retrieve profile and LLM summary of author from the database, creating them if they do not exist.'''
    author = json.loads(author)

    # no extra slashes allowed in URLS
    author['Profile Link'] = f'https://dl.acm.org/profile/{author['Profile Link']}'
    print(author)

    # get the orcid id
    # TODO should this be from the database instead of scraping? what to do when there is no orcid?
    publications = scraper.scrape_author_publications(author['Profile Link'])
    orcid = scraper.find_author_orcid_by_dois(publications, author['Name'])
    print(orcid, format_orcid(orcid))

    # does the author exist in the database?
    existing_researcher = db.get_records(model.Researcher, filters={"orcid": format_orcid(orcid)})
    print(existing_researcher)

    # if so, retrieve and return their details
    if existing_researcher:
        details = db.get_author_details_from_db(orcid)

    # if not, scrape the details
    else:
        details = json.loads(scraper.scrape_author_details(author['Name'], author['Profile Link']))

        # generate and store llm summary
        llm.request(orcid)

    details['Summary'] = db.get_researcher_summary(orcid)

    print(details)
    return json.dumps(details)
