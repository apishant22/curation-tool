import os
import random
import time

from fake_useragent import UserAgent
from collections import Counter
import aiohttp
from bs4 import BeautifulSoup
import re
import networkx as nx
import datetime
from node2vec import Node2Vec
import numpy as np
from sklearn.cluster import DBSCAN
import nest_asyncio
import traceback
import asyncio
import hashlib

nest_asyncio.apply()

def safe_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


class ACMAuthorSearcher:
    def __init__(self, crawl_delay=1):
        self.seen_authors = set()
        self.field_cache = {}
        self.ua = UserAgent()
        self.crawl_delay = crawl_delay
        self.semaphore = asyncio.Semaphore(1)

    async def fetch_page(self, session, field_name, page_number, start_time):
        delay = max(0, start_time + self.crawl_delay * (page_number - 1) - time.time())
        if delay > 0:
            await asyncio.sleep(delay)

        formatted_field = field_name.replace(' ', '+')
        headers = {
            'User-Agent': self.ua.random,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }
        base_url = "https://dl.acm.org/action/doSearch"
        params = {
            "AllField": formatted_field,
            "content": "standard",
            "target": "default",
            "startPage": page_number,
        }

        async with self.semaphore:
            for attempt in range(3):
                try:
                    query_string = '&'.join(f"{key}={value}" for key, value in params.items())
                    full_url = f"{base_url}?{query_string}"

                    timeout = aiohttp.ClientTimeout(
                        total=60,
                        connect=10,
                        sock_connect=10,
                        sock_read=50
                    )

                    async with session.get(base_url, headers=headers, params=params, timeout=timeout) as response:
                        if response.status == 200:
                            return await response.text()
                        print(f"[WARNING] Failed to fetch page {page_number} for field '{field_name}'. Status: {response.status}")
                except asyncio.TimeoutError as e:
                    print(f"[ERROR] TimeoutError while fetching page {page_number} for field '{field_name}': {e}")
                except aiohttp.ClientError as e:
                    print(f"[ERROR] ClientError while fetching page {page_number} for field '{field_name}': {e}")
                except Exception as e:
                    print(f"[ERROR] Unexpected exception occurred: {e}")
                sleep_time = 2 ** attempt
                await asyncio.sleep(sleep_time)
        print(f"[ERROR] Failed to fetch page {page_number} for field '{field_name}' after {attempt + 1} attempts.")
        return None

    async def search_acm_field_async(self, field_name, pages_to_fetch=1):
        authors = []
        try:
            async with aiohttp.ClientSession() as session:
                tasks = []
                start_time = time.time()
                for page_number in range(1, pages_to_fetch + 1):
                    task = asyncio.create_task(
                        self.fetch_page(session, field_name, page_number, start_time)
                    )
                    tasks.append(task)
                pages_content = await asyncio.gather(*tasks)
                for content in pages_content:
                    if not content:
                        continue
                    # Parse content and extract authors
                    soup = BeautifulSoup(content, 'html.parser')
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
        except Exception as e:
            print(f"[ERROR] Exception in search_acm_field_async for field '{field_name}': {e}")
            traceback.print_exc()
            return []

    async def retry_search_acm_field(self, field_name, max_retries=3, required_minimum=0):
        if field_name in self.field_cache:
            cached_authors = self.field_cache[field_name]
            if len(cached_authors) >= required_minimum:
                return cached_authors

        for attempt in range(max_retries):
            try:
                authors = await self.search_acm_field_async(field_name, pages_to_fetch=1)
                if authors:
                    self.field_cache[field_name] = authors
                    if len(authors) >= required_minimum:
                        return authors
            except Exception as e:
                print(f"[ERROR] Attempt {attempt + 1}/{max_retries} failed for field '{field_name}': {e}")
                traceback.print_exc()
                await asyncio.sleep(self.crawl_delay * (2 ** attempt))  # Exponential backoff

        self.field_cache[field_name] = self.field_cache.get(field_name, [])
        return self.field_cache[field_name]

class DynamicOntologyManager:
    def __init__(self):
        self.ontology = {}

    def update_ontology(self, field_name, authors):
        if field_name not in self.ontology:
            self.ontology[field_name] = set()
        self.ontology[field_name].update(author["Name"] for author in authors)

    def get_related_fields(self, field_name):
        if field_name in self.ontology:
            related_fields = [
                other_field for other_field, authors in self.ontology.items()
                if other_field != field_name and self.ontology[field_name] & authors
            ]
            return related_fields
        else:
            return []

    def cluster_topics(self, embeddings):
        clustering_model = DBSCAN(eps=0.5, min_samples=5)
        labels = clustering_model.fit_predict(embeddings)
        return labels


import threading

class RecommendationsCache:
    def __init__(self):
        self.cache = {}
        self.lock = threading.Lock()

    def get(self, key):
        with self.lock:
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
        weights = [(field, safe_int(weight)) for field, weight in weights]
        with self.lock:
            self.cache[key] = (recommendations, weights, datetime.datetime.now())
            self.debug_cache()



    def debug_cache(self):
        for key, (recommendations, weights, timestamp) in self.cache.items():
            print(f"  Key: {key}")
            print(f"  Recommendations: {recommendations}, type: {type(recommendations)}")
            print(f"  Weights: {weights}, type: {type(weights)}")
            print(f"  Timestamp: {timestamp}, type: {type(timestamp)}\n")


class ACMRecommender:
    def __init__(self, acm_searcher, cache):
        self.acm_searcher = acm_searcher
        self.graph = nx.Graph()
        self.cache = cache
        self.ontology_manager = DynamicOntologyManager()

    def build_network(self, authors, acm_results):
        for author in authors:
            author_node = f"Author: {author['Name']}"
            self.graph.add_node(author_node, type="author", profile_link=author.get("Profile Link", ""))

            for field in author.get("Fields of Study", []):
                field_node = f"Field: {field}"
                self.graph.add_node(field_node, type="field")
                self.graph.add_edge(author_node, field_node, weight=1.0, reason="Author studies this field")

        for field, field_authors in acm_results.items():
            self.ontology_manager.update_ontology(field, field_authors)
            for acm_author in field_authors:
                acm_author_node = f"Author: {acm_author['Name']}"
                self.graph.add_node(acm_author_node, type="author", profile_link=acm_author.get("Profile Link", ""))
                field_node = f"Field: {field}"
                if self.graph.has_node(field_node):
                    self.graph.add_edge(
                        acm_author_node, field_node,
                        weight=0.5,
                        reason="Author linked to this field from ACM results"
                    )

    def compute_graph_embeddings(self):
        num_cpus = os.cpu_count() // 2
        node2vec = Node2Vec(
            self.graph,
            dimensions=32,
            walk_length=15,
            num_walks=100,
            workers=num_cpus
        )
        self.model = node2vec.fit()


    def recommend_authors(self, target_authors, max_recommendations=5):
        if isinstance(max_recommendations, str) and max_recommendations.isdigit():
            max_recommendations = int(max_recommendations)
        elif not isinstance(max_recommendations, int):
            raise ValueError("max_recommendations must be an integer")

        recommendations = []
        given_author_nodes = [f"Author: {author['Name']}" for author in target_authors]

        for author_node in given_author_nodes:
            if author_node not in self.graph:
                continue

            neighbors = nx.single_source_shortest_path_length(self.graph, author_node, cutoff=2)
            for neighbor, distance in neighbors.items():
                if neighbor.startswith("Author: ") and neighbor not in given_author_nodes:
                    profile_link = self.graph.nodes[neighbor].get("profile_link", "")
                    if profile_link:
                        if isinstance(distance, int):
                            score = 1 / (1 + distance)
                        else:
                            score = 0.0
                        recommendations.append({
                            "Name": neighbor.replace("Author: ", ""),
                            "Profile Link": profile_link,
                            "Reason": "Recommended based on proximity in the author-field network.",
                            "Similarity": score
                        })

        recommendations = sorted(recommendations, key=lambda x: -float(x.get("Similarity", 0.0)))
        return recommendations[:max_recommendations]

    def recommend_authors_by_embeddings(self, target_authors, max_recommendations=5):
        self.compute_graph_embeddings()

        target_author_names = {f"Author: {author['Name']}" for author in target_authors}
        target_embeddings = np.array([
            self.model.wv[f"Author: {author['Name']}"]
            for author in target_authors
            if f"Author: {author['Name']}" in self.model.wv
        ])

        all_authors = [
            (
                node,
                self.graph.nodes[node].get("profile_link", ""),
                [
                    field.replace("Field: ", "")
                    for field in self.graph.neighbors(node)
                    if field.startswith("Field: ")
                ]
            )
            for node, attrs in self.graph.nodes(data=True) if attrs["type"] == "author"
        ]
        all_embeddings = np.array([self.model.wv[node] for node, _, _ in all_authors])

        if target_embeddings.size == 0 or all_embeddings.size == 0:
            print("[ERROR] No embeddings found for target authors or all authors.")
            return []

        similarities = target_embeddings @ all_embeddings.T
        mean_similarities = similarities.mean(axis=0)

        recommendations = []
        target_fields = set(
            field for author in target_authors for field in author.get("Fields of Study", [])
        )
        for (author_node, profile_link, fields), similarity in zip(all_authors, mean_similarities):
            if author_node in target_author_names:
                continue

            overlap_score = sum(1 for field in fields if field in target_fields)
            recommendations.append({
                "Author": author_node.replace("Author: ", ""),
                "Profile Link": profile_link,
                "Similarity": safe_float(similarity, 0.0),
                "Field Count": safe_int(len(fields)),
                "Overlap Score": safe_int(overlap_score),
                "Fields": fields or ["Unknown"]
            })

        field_weights = {field: safe_float(weight) for field, weight in self.get_weighted_fields(target_authors)}

        sorted_recommendations = sorted(
            recommendations,
            key=lambda x: (
                -safe_int(x.get("Overlap Score", 0)),
                -safe_int(x.get("Field Count", 0)),
                -safe_float(x.get("Similarity", 0.0)),
                -max(
                    [safe_float(field_weights.get(field, 0)) for field in x["Fields"] if field in field_weights],
                    default=0.0
                )
            )
        )

        field_coverage = set()
        diverse_recommendations = []
        for rec in sorted_recommendations:
            if len(diverse_recommendations) >= max_recommendations:
                break
            if any(field not in field_coverage for field in rec["Fields"]):
                diverse_recommendations.append(rec)
                field_coverage.update(rec["Fields"])

        if len(diverse_recommendations) < max_recommendations:
            remaining_recommendations = [
                rec for rec in sorted_recommendations
                if rec not in diverse_recommendations
            ]
            diverse_recommendations.extend(
                remaining_recommendations[:max_recommendations - len(diverse_recommendations)]
            )

        return diverse_recommendations

    def recommend_authors_with_explanations(self, target_authors, max_recommendations=5):
        recommendations = self.recommend_authors_by_embeddings(target_authors, max_recommendations)
        explanations = self.explain_recommendations(target_authors, recommendations)
        return recommendations, explanations

    def explain_recommendations(self, target_authors, recommendations):
        explanations = []
        for rec in recommendations:
            rec_name = rec["Author"].title()
            rec_link = rec["Profile Link"]
            rec_fields = rec.get("Fields", [])
            explanation = {"Recommended Author": rec_name, "Profile Link": rec_link, "Reason": ""}

            matched = False
            for target_author in target_authors:
                target_name = target_author['Name'].title()
                target_fields = target_author.get("Fields of Study", [])
                shared_fields = set(target_fields).intersection(set(rec_fields))

                if shared_fields:
                    field_list = ', '.join(shared_fields)
                    explanation["Reason"] = (
                        f"{rec_name} specializes in {field_list}, complementing your interest in {target_name}'s work."
                    )
                    matched = True
                    break

            if not matched:
                if rec_fields:
                    fields_list = ', '.join(rec_fields)
                    explanation["Reason"] = (
                        f"{rec_name} has made significant contributions in {fields_list}, which align with your interests."
                    )
                else:
                    explanation["Reason"] = (
                        f"{rec_name} is a recognized expert in relevant areas."
                    )

            explanations.append(explanation)

        return explanations

    def get_weighted_fields(self, authors):
        default_fields = [("Artificial Intelligence", 1),
                          ("Data Science", 1),
                          ("Cybersecurity", 1),
                          ("Software Engineering", 1),
                          ("Cloud Computing", 1)]

        field_counts = Counter(field for author in authors for field in author.get("Fields of Study", []))
        combined_fields = [(field, safe_int(count)) for field, count in field_counts.items()]

        existing_fields = set(field.lower() for field, _ in combined_fields)
        for field, weight in default_fields:
            if field.lower() not in existing_fields:
                combined_fields.append((field, safe_int(weight)))

        return sorted(combined_fields, key=lambda x: -x[1])[:5]

recommendations_cache = RecommendationsCache()

async def get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5):
    try:
        print("Getting Recommendations...")
        acm_searcher = ACMAuthorSearcher()
        recommender = ACMRecommender(acm_searcher, recommendations_cache)

        max_recommendations = (
            int(max_recommendations) if isinstance(max_recommendations, str) and max_recommendations.isdigit()
            else max_recommendations if isinstance(max_recommendations, int)
            else 5
        )
        max_results_per_field = (
            int(max_results_per_field) if isinstance(max_results_per_field, str) and max_results_per_field.isdigit()
            else max_results_per_field if isinstance(max_results_per_field, int)
            else 5
        )

        for author in authors:
            if 'Fields of Study' in author:
                author['Fields of Study'] = [str(field) for field in author['Fields of Study'] if isinstance(field, str)]

        authors_key = tuple(sorted(author['Name'] for author in authors))

        authors_key_str = '_'.join(authors_key)

        seed = int(hashlib.sha256(authors_key_str.encode('utf-8')).hexdigest(), 16) % (2**32)

        random.seed(seed)

        cached_recommendations, cached_weights = recommender.cache.get(authors_key)
        if cached_recommendations:
            print("[DEBUG] Returning cached recommendations.")
            return cached_recommendations

        if not authors:
            default_fields = ["Artificial Intelligence", "Data Science", "Cybersecurity", "Software Engineering", "Cloud Computing"]

            acm_results = {}
            tasks = [
                acm_searcher.retry_search_acm_field(field, max_retries=3, required_minimum=max_results_per_field)
                for field in default_fields
            ]
            results = await asyncio.gather(*tasks)
            acm_results = dict(zip(default_fields, results))

            field_author_mapping = []
            for field, authors_for_field in acm_results.items():
                if authors_for_field:
                    sampled_authors = random.sample(authors_for_field, min(len(authors_for_field), max_results_per_field))
                    field_author_mapping.append({
                        'Subheading': field,
                        'Authors': [
                            {
                                "Name": author["Name"],
                                "Profile Link": author["Profile Link"],
                                "Reason": f"Recommended because '{author['Name']}' has expertise in '{field}', which aligns with the default fields of interest."
                            }
                            for author in sampled_authors
                        ]
                    })

            return {
                "Recommended Authors": [],
                "Authors by Weighted Fields": field_author_mapping
            }

        current_weights = recommender.get_weighted_fields(authors)
        top_fields = [field for field, weight in current_weights]

        fields_to_fetch = set(top_fields)

        tasks = [
            acm_searcher.search_acm_field_async(field, pages_to_fetch=1)
            for field in fields_to_fetch
        ]
        all_results = await asyncio.gather(*tasks)
        acm_results = {field: result for field, result in zip(fields_to_fetch, all_results)}

        recommender.build_network(authors, acm_results)

        recommendations, explanations = recommender.recommend_authors_with_explanations(authors, max_recommendations)

        diverse_picks = [
            {
                "Recommended Author": rec["Recommended Author"],
                "Profile Link": rec["Profile Link"],
                "Reason": rec["Reason"]
            }
            for rec in explanations[:max_recommendations]
        ]

        top_picks = [{
            'Subheading': 'Top Picks For You',
            'Authors': diverse_picks
        }]

        field_author_mapping = []
        for field in top_fields:
            authors_for_field = acm_results.get(field, [])
            if authors_for_field:
                sampled_authors = random.sample(authors_for_field, min(len(authors_for_field), max_results_per_field))
                field_author_mapping.append({
                    'Subheading': field,
                    'Authors': [
                        {
                            "Name": author["Name"].title(),
                            "Profile Link": author["Profile Link"],
                            "Reason": f"Recommended because {author['Name'].title()} has expertise in '{field}', which aligns with your field of interest."
                        }
                        for author in sampled_authors
                    ]
                })

        final_recommendations = {
            "Recommended Authors": top_picks,
            "Authors by Weighted Fields": field_author_mapping
        }

        authors_key = tuple(sorted(author['Name'] for author in authors))
        recommender.cache.set(authors_key, final_recommendations, current_weights)
        return final_recommendations

    except Exception as e:
        print("[ERROR] Exception occurred:")
        traceback.print_exc()


if __name__ == "__main__":

    authors = [
        {'Name': 'adriana wilde', 'Fields of Study': ['Computing education', 'Human computer interaction (HCI)', 'Visualization', 'Computer science education', 'Computer science education', 'Sensor devices and platforms', 'Sensor devices and platforms', 'Ubiquitous computing']}
    ]

    results = asyncio.run(get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5))

    print("Part 1 (Default Fields)")
    print(results)

    results1 = asyncio.run(get_acm_recommendations_and_field_authors(authors, max_recommendations=5, max_results_per_field=5))

    print("Part 2 (Default Fields)")
    print(results1)
