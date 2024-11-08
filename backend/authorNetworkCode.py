import os
from datetime import datetime
import json
import requests
import base64
from backend.db import db_helper
from backend.db.models import Researcher, Paper, Paper_Authors, Organisation, Dept, Researcher_Employment, Researcher_Edu
from sqlalchemy import not_

def retrieve_formatted_records(model, filters=None):
    session = db_helper.get_session()

    query = session.query(model)

    if filters:
        query = query.filter_by(**filters)

    results = query.all()
    return [{key: str(value) for key, value in result.__dict__.items() if not key.startswith('_')}
                for result in results]
def orcid_to_name(orcidID):
    return db_helper.get_author_details_from_db(orcidID).get("Name")
def generatesNodesAndEdges(orcid):


    var = db_helper.get_author_details_from_db(orcid).get("Publications")
    paper_dois = []
    collaborators = []
    occurrence_dict = {}
    nodes = []
    edges = []
    researcher = orcid_to_name(orcid)


    for i in range(len(var)):
        paper_dois.append(var[i].get("DOI"))

    for doi in paper_dois:
        authorList = []
        coauthors = []
        collaborators_dict_list = retrieve_formatted_records(Paper_Authors,filters={"doi":doi})
        for i in collaborators_dict_list:
            number = i.get('orcid')
            coauthors.append(number) if number != orcid else None
        collaborators.append(coauthors)

    for i in range(len(collaborators)):
        for orcidID in collaborators[i]:
            name = db_helper.get_author_details_from_db(orcidID).get("Name")
            if(name in occurrence_dict):
                occurrence_dict[name] += 1
            else:

                occurrence_dict[name] = 1


    nodes = list(occurrence_dict.keys())
    newList = []
    for lists in collaborators:
        newList.append(list(map(orcid_to_name, lists))) if lists != [] else None

    for i in range(len(newList)):
        for item1 in newList[i]:
            for item2 in newList[i]:
                edges.append((item1,item2)) if item1 != item2 and (item1,item2) not in edges and (item2,item1) not in edges else None

    nodes.append(researcher)
    for item in nodes:
        edges.append((researcher,item))

    return nodes, edges










