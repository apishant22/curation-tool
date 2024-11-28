import os
from datetime import datetime
import json
import requests
import base64
from backend.db import db_helper
from backend.db.models import PaperAuthors,Researcher
from sqlalchemy import not_

def retrieve_formatted_records(model, filters=None):
    session = db_helper.get_session()
    query = session.query(model)
    if filters:
        query = query.filter_by(**filters)

    results = query.all()
    return [{key: str(value) for key, value in result.__dict__.items() if not key.startswith('_')}
                for result in results]

def generatesNodesAndEdges(id):
    var = retrieve_formatted_records(PaperAuthors,{'id': id})
    nodes = []
    edges = []
    relevantdois = []
    ids = []
    idset = []

    for record in var:
        relevantdois.append(record.get('doi'))

    for doi in relevantdois:
        collaborators = []
        for entry in retrieve_formatted_records(PaperAuthors,{'doi': doi}):
            collaborators.append(entry.get('id')) if entry.get('id') != str(id) else None
        ids.append(collaborators)

    for element in ids:
        for number in element:
            if number not in idset:
                idset.append(number)

    temp = retrieve_formatted_records(Researcher, {'id': id})[0]
    nodes.append({"id":temp.get("id"),"name":temp.get("name"),"link":temp.get("profile_link")})
    for item in idset:
        record = retrieve_formatted_records(Researcher,{'id':int(item)})[0]
        nodes.append({"id":record.get("id"),"name":record.get("name"),"link":record.get("profile_link")})



    for lists in ids:
        for person1 in lists:
            for person2 in lists:
                if person1 != person2 and {"source":person1,"target":person2} not in edges and {"source":person2,"target":person1} not in edges:
                    edges.append({"source":person1,"target":person2})

    for lists in ids:
        for person1 in lists:
            edges.append({"source": temp.get("id"), "target": person1})

    return nodes, edges


def convert_to_json(name):
    record = retrieve_formatted_records(Researcher,{'name':name})
    id = record[0].get('id')
    nodes,edges = generatesNodesAndEdges(int(id))

    graph_data = {
        "nodes":nodes,
        "links":edges
    }
    json_string = json.dumps(graph_data, indent=4)

    with open("graph.json", "w") as json_file:
        json.dump(graph_data, json_file, indent=4)
    print(json_string)
    return(json_string)
"""
def get_random_author(name):

"""

# convert_to_json("Leslie Anthony Carr")















