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
'''
def generate_all_authors_network():
   session = db_helper.get_session()

   # Query all researchers
   researchers = session.query(Researcher).all()
   nodes = []
   edges = []

   # Build nodes
   for researcher in researchers:
       nodes.append({
               "id": researcher.id,
               "name": researcher.name,
               "link": researcher.profile_link,
        })
   # Fetch all co-authorship relationships
   coauthorships = session.query(PaperAuthors).all()
   coauthor_map = {}
    
   for coauthorship in coauthorships:
       doi = coauthorship.doi
       researcher_id = coauthorship.id

       if doi not in coauthor_map:
           coauthor_map[doi] = []
       coauthor_map[doi].append(researcher_id)
    
    # Build edges based on coauthorship
   for doi, researcher_ids in coauthor_map.items():
       for i, source in enumerate(researcher_ids):
           for target in researcher_ids[i+1:]:
               # Avoid duplicate edges
               if{"source": source, "target": target} not in edges and {"source": target, "target": source} not in edges:
                   edges.append({"source": source, "target": target})
   return {"nodes": nodes, "edges": edges}


def convert_to_json(name):
    record = retrieve_formatted_records(Researcher,{'name':name})
    id = record[0].get('id')
    nodes,edges = generatesNodesAndEdges(int(id))

    graph_data = {
        "nodes":nodes,
        "edges":edges
    }
    json_string = json.dumps(graph_data, indent=4)

    with open("graph.json", "w") as json_file:
        json.dump(graph_data, json_file, indent=4)

    return json_string

convert_to_json("Leslie Anthony Carr")'''















