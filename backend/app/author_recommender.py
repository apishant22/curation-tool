import time
import random
from fake_useragent import UserAgent
from collections import Counter
import requests
from bs4 import BeautifulSoup
import re
import networkx as nx
import datetime


class ACMAuthorSearcher:
    def __init__(self, crawl_delay=1):
        self.seen_authors = set()
        self.field_cache = {}
        self.ua = UserAgent()
        self.crawl_delay = crawl_delay

    def search_acm_field(self, field_name, page_number=1):
        formatted_field = field_name.replace(' ', '+')
        headers = {'User-Agent': self.ua.random}
        base_url = "https://dl.acm.org/action/doSearch"
        params = {
            "AllField": formatted_field,
            "content": "standard",
            "target": "default",
            "startPage": page_number,
        }

        try:
            time.sleep(self.crawl_delay)

            response = requests.get(base_url, headers=headers, params=params, timeout=10)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.content, 'html.parser')
            authors = []
            profile_url_pattern = re.compile(r"^https://dl.acm.org/profile/\d+$")
            items = soup.find_all('li', class_='search__item')

            for item in items:
                author_elements = item.find_all('a', title=True)
                for author in author_elements:
                    author_name = author['title'].strip()
                    author_link = f"https://dl.acm.org{author['href']}"
                    if profile_url_pattern.match(author_link) and author_name not in self.seen_authors:
                        self.seen_authors.add(author_name)
                        authors.append({
                            "Name": author_name,
                            "Profile Link": author_link
                        })

            return authors
        except Exception:
            return []

    def retry_search_acm_field(self, field_name, max_retries=3, required_minimum=0):
        if field_name in self.field_cache:
            cached_authors = self.field_cache[field_name]
            if len(cached_authors) >= required_minimum:
                return cached_authors

        delay = self.crawl_delay
        for attempt in range(max_retries):
            authors = self.search_acm_field(field_name, page_number=random.randint(1, 3))
            if authors:
                self.field_cache[field_name] = authors
                if len(authors) >= required_minimum:
                    return authors
            time.sleep(delay)
            delay *= 2

        self.field_cache[field_name] = self.field_cache.get(field_name, [])
        return self.field_cache[field_name]



class RecommendationsCache:
    def __init__(self):
        self.cache = {}

    def get(self, key):
        cached_data = self.cache.get(key)
        if cached_data:
            recommendations, weights, timestamp = cached_data
            if (datetime.datetime.now() - timestamp).seconds < 3600:
                print("[DEBUG] Cache hit.")
                self.debug_cache()
                return recommendations, weights
        print("[DEBUG] Cache miss or expired.")
        self.debug_cache()
        return None, None

    def set(self, key, recommendations, weights):
        self.cache[key] = (recommendations, weights, datetime.datetime.now())
        self.debug_cache()

    def debug_cache(self):
        for key, (recommendations, weights, timestamp) in self.cache.items():
            print(f"  Key: {key}")
            print(f"  Recommendations: {recommendations}")
            print(f"  Weights: {weights}")
            print(f"  Timestamp: {timestamp}\n")


class ACMRecommender:
    def __init__(self, acm_searcher, cache):
        self.acm_searcher = acm_searcher
        self.graph = nx.Graph()
        self.cache = cache

    def build_network(self, authors, acm_results):
        for author in authors:
            author_node = f"Author: {author['Name']}"
            self.graph.add_node(author_node, type="author")

            for field in author.get("Fields of Study", []):
                field_node = f"Field: {field}"
                self.graph.add_node(field_node, type="field")
                self.graph.add_edge(author_node, field_node, weight=1.0)

        for field, field_authors in acm_results.items():
            for acm_author in field_authors:
                acm_author_node = f"Author: {acm_author['Name']}"
                self.graph.add_node(acm_author_node, type="author")
                field_node = f"Field: {field}"
                if self.graph.has_node(field_node):
                    self.graph.add_edge(acm_author_node, field_node, weight=0.5)


    def get_weighted_fields(self, authors):
        default_fields = [("Artificial intelligence", 1),
                          ("Data Science", 1),
                          ("Cybersecurity", 1),
                          ("Software Engineering", 1),
                          ("Cloud Computing", 1)]

        all_fields = [field for author in authors for field in author.get("Fields of Study", [])]
        field_counts = Counter(all_fields)

        combined_fields = [(field, field_counts[field]) for field in field_counts]

        existing_fields = {field.lower() for field, _ in combined_fields}
        for field, weight in default_fields:
            if field.lower() not in existing_fields:
                combined_fields.append((field, weight))

        unique_fields = sorted(combined_fields, key=lambda x: -x[1])
        return unique_fields[:5]

    def find_best_matches(self, given_authors, max_recommendations=10, current_top_fields=None):
        recommendations = []
        given_author_nodes = [f"Author: {author['Name']}" for author in given_authors]

        for author_node in given_author_nodes:
            if author_node not in self.graph:
                continue

            neighbors = nx.single_source_shortest_path_length(self.graph, author_node, cutoff=2)
            for neighbor, distance in neighbors.items():
                if "Author: " in neighbor and neighbor not in given_author_nodes:
                    profile_link = self.graph.nodes[neighbor].get("profile_link", "")
                    if profile_link:
                        score = 1 / (1 + distance)
                        recommendations.append((neighbor.replace("Author: ", ""), profile_link, score))

        if not recommendations:
            fields_to_consider = current_top_fields if current_top_fields else set(
                field for author in given_authors for field in author.get("Fields of Study", [])
            )
            field_based_authors = []
            for field in fields_to_consider:
                field_based_authors.extend(self.acm_searcher.retry_search_acm_field(field))

            seen_authors = set()
            for author in field_based_authors:
                if author["Name"] not in seen_authors:
                    recommendations.append((author["Name"], author["Profile Link"], 1.0))
                    seen_authors.add(author["Name"])
                if len(recommendations) >= max_recommendations:
                    break

        recommendations = sorted(recommendations, key=lambda x: -x[2])
        unique_recommendations = {rec[0]: rec for rec in recommendations}
        return [{"Name": rec[0], "Profile Link": rec[1]} for rec in unique_recommendations.values()][:max_recommendations]

global_cache = RecommendationsCache()
def get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5):
    print("Getting Recommendations...")
    acm_searcher = ACMAuthorSearcher(crawl_delay=1)
    recommender = ACMRecommender(acm_searcher, global_cache)

    if not authors:
        authors_key = ("default_fields",)
        cached_recommendations, _ = global_cache.get(authors_key)

        if cached_recommendations:
            return cached_recommendations

        default_fields = ["Artificial Intelligence", "Data Science", "Cybersecurity", "Software Engineering", "Cloud Computing"]
        field_author_mapping = []

        for field in default_fields:
            authors_for_field = acm_searcher.retry_search_acm_field(field, max_retries=3)
            sampled_authors = random.sample(authors_for_field, min(len(authors_for_field), max_results_per_field)) if authors_for_field else []
            field_author_mapping.append({
                'Subheading': field,
                'Authors': sampled_authors
            })

        recommendations = {
            "Recommended Authors": [{'Subheading': 'Top Picks For You', 'Authors': []}],
            "Authors by Weighted Fields": field_author_mapping
        }
        global_cache.set(authors_key, recommendations, [])
        return recommendations

    authors_key = tuple(sorted(author['Name'] for author in authors))
    cached_recommendations, cached_weights = global_cache.get(authors_key)

    if cached_recommendations:
        return cached_recommendations

    acm_results = {}
    for field in {field for author in authors for field in author.get("Fields of Study", [])}:
        authors_for_field = acm_searcher.retry_search_acm_field(field, max_retries=3)
        acm_results[field] = authors_for_field if authors_for_field else []

    recommender.build_network(authors, acm_results)

    current_weights = recommender.get_weighted_fields(authors)
    cached_top_fields = {field for field, _ in cached_weights[:5]} if cached_weights else set()

    if cached_recommendations and cached_weights and cached_weights[0][0] == current_weights[0][0]:
        top_picks = cached_recommendations["Recommended Authors"]
    else:
        top_picks = [{
            'Subheading': 'Top Picks For You',
            'Authors': recommender.find_best_matches(authors, max_recommendations=max_recommendations)
        }]

    field_author_mapping = []
    for field, weight in current_weights[:5]:
        if cached_recommendations and field in cached_top_fields:
            cached_field_data = next(
                (entry for entry in cached_recommendations["Authors by Weighted Fields"] if entry['Subheading'] == field),
                None
            )
            if cached_field_data:
                field_author_mapping.append(cached_field_data)
        else:
            if field in acm_results and acm_results[field]:
                sampled_authors = random.sample(acm_results[field], min(len(acm_results[field]), max_results_per_field))
            else:
                sampled_authors = []

            field_author_mapping.append({
                'Subheading': field,
                'Authors': sampled_authors
            })

    recommendations = {
        "Recommended Authors": top_picks,
        "Authors by Weighted Fields": field_author_mapping
    }

    global_cache.set(authors_key, recommendations, current_weights)
    return recommendations

'''
if __name__ == "__main__":
    authors = []
    results = get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5)
    print("Part 1 (Default Fields)")
    print(results)

    time.sleep(5)

    authors = [
        {"Name": "Jane Doe", "Fields of Study": ["Artificial Intelligence", "Machine Learning"]},
        {"Name": "John Smith", "Fields of Study": ["Cybersecurity", "Data Science"]}
    ]
    results = get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5)
    print("Part 2 (Specific Authors)")
    print(results)

    time.sleep(5)

    results = get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5)
    print("Part 3 (Cached Recommendations)")
    print(results)
'''