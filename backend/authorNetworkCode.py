import json
from backend.db import db_helper
from backend.db.models import PaperAuthors, Researcher

def retrieve_formatted_records(model, filters=None):
    session = db_helper.get_session()
    query = session.query(model)
    if filters:
        query = query.filter_by(**filters)

    results = query.all()
    return [{key: str(value) for key, value in result.__dict__.items() if not key.startswith('_')}
            for result in results]

def generatesNodesAndEdges(id, max_nodes=50):
    var = retrieve_formatted_records(PaperAuthors, {'id': id})
    nodes = []
    edges = []
    relevantdois = []
    ids = []
    idset = set()

    for record in var:
        relevantdois.append(record.get('doi'))

    for doi in relevantdois:
        collaborators = []
        for entry in retrieve_formatted_records(PaperAuthors, {'doi': doi}):
            collaborators.append(entry.get('id')) if entry.get('id') != str(id) else None
        ids.append(collaborators)

    for element in ids:
        for number in element:
            idset.add(number)

    temp = retrieve_formatted_records(Researcher, {'id': id})[0]
    nodes.append({"id": temp.get("id"), "name": temp.get("name"), "link": temp.get("profile_link")})

    for item in idset:
        if len(nodes) >= max_nodes + 1:
            break
        record = retrieve_formatted_records(Researcher, {'id': int(item)})[0]
        if not any(node['link'] == record.get("profile_link") for node in nodes):
            nodes.append({"id": record.get("id"), "name": record.get("name"), "link": record.get("profile_link")})

    node_ids = {node['id'] for node in nodes}

    for lists in ids:
        for person1 in lists:
            for person2 in lists:
                if person1 in node_ids and person2 in node_ids and person1 != person2:
                    edge = {"source": person1, "target": person2}
                    reverse_edge = {"source": person2, "target": person1}
                    if edge not in edges and reverse_edge not in edges:
                        edges.append(edge)

    # Add edges connecting the main node to collaborators
    for lists in ids:
        for person1 in lists:
            if person1 in node_ids:
                edges.append({"source": temp.get("id"), "target": person1})

    return nodes, edges

def convert_to_json(name):
    # Retrieve the ID for the given name
    record = retrieve_formatted_records(Researcher, {'name': name})
    id = record[0].get('id')
    nodes, edges = generatesNodesAndEdges(int(id))

    # Construct the graph data
    graph_data = {
        "nodes": nodes,
        "links": edges
    }

    # Write to JSON file
    json_string = json.dumps(graph_data, indent=4)
    print(json_string)
    return json_string

convert_to_json("JERZY WILDE")