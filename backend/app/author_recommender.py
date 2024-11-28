import os
import random
from fake_useragent import UserAgent
from collections import Counter
import aiohttp
import asyncio
from bs4 import BeautifulSoup
import re
import networkx as nx
import datetime
from gender_guesser.detector import Detector
from node2vec import Node2Vec
import numpy as np
from sklearn.cluster import DBSCAN
from transformers import pipeline
from backend.app.search_scrape_context import SearchScrapeContext
import nest_asyncio

nest_asyncio.apply()

sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    device=0
)

class ACMAuthorSearcher:
    def __init__(self, crawl_delay=1, filter_by_gender=False):
        self.seen_authors = set()
        self.field_cache = {}
        self.ua = UserAgent()
        self.crawl_delay = crawl_delay
        self.filter_by_gender = filter_by_gender

    async def fetch_page(self, session, field_name, page_number):
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
            async with session.get(base_url, headers=headers, params=params, timeout=10) as response:
                if response.status != 200:
                    print(f"[WARNING] Failed to fetch page {page_number} for field '{field_name}'. Status: {response.status}")
                    return None
                return await response.text()
        except Exception as e:
            print(f"[ERROR] Exception occurred while fetching page {page_number} for field '{field_name}': {e}")
            return None

    async def search_acm_field_async(self, field_name, pages_to_fetch=1):
        authors = []
        async with aiohttp.ClientSession() as session:
            for page_number in range(1, pages_to_fetch + 1):
                content = await self.fetch_page(session, field_name, page_number)
                await asyncio.sleep(self.crawl_delay)
                if not content:
                    continue

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

                            if self.filter_by_gender:
                                first_name = author_name.split()[0]
                                gender = self.get_gender(first_name)
                                if gender != "male":
                                    authors.append({
                                        "Name": author_name,
                                        "Profile Link": author_link,
                                        "Reason": f"Recommended because '{author_name}' has expertise in '{field_name}', "
                                                  f"which aligns with your search field."
                                    })
                            else:
                                authors.append({
                                    "Name": author_name,
                                    "Profile Link": author_link,
                                    "Reason": f"Recommended because '{author_name}' has expertise in '{field_name}', "
                                              f"which aligns with your search field."
                                })

        return authors


    def retry_search_acm_field(self, field_name, max_retries=3, required_minimum=0):
        if field_name in self.field_cache:
            cached_authors = self.field_cache[field_name]
            if len(cached_authors) >= required_minimum:
                return cached_authors

        for attempt in range(max_retries):
            try:
                authors = asyncio.run(self.search_acm_field_async(field_name, pages_to_fetch=3))
                if authors:
                    self.field_cache[field_name] = authors
                    if len(authors) >= required_minimum:
                        return authors
            except Exception as e:
                print(f"[ERROR] Attempt {attempt + 1}/{max_retries} failed for field '{field_name}': {e}")
        self.field_cache[field_name] = self.field_cache.get(field_name, [])
        return self.field_cache[field_name]

    def get_gender(self, first_name):
        detector = Detector()
        return detector.get_gender(first_name)


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
        self.contextual_weights = Counter()
        self.model = None
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

    def explain_recommendations(self, target_authors, recommendations):
        explanations = []
        for rec in recommendations:
            rec_name = rec["Author"]
            rec_link = rec["Profile Link"]
            rec_fields = rec.get("Fields", [])
            explanation = {"Recommended Author": rec_name, "Profile Link": rec_link, "Reason": []}

            for target_author in target_authors:
                target_name = target_author['Name']
                target_fields = target_author.get("Fields of Study", [])
                shared_fields = set(target_fields).intersection(set(rec_fields))

                if shared_fields:
                    explanation["Reason"].append(
                        f"'{rec_name}' specializes in {', '.join(shared_fields)} alongside '{target_name}' and has made notable contributions in this area."
                    )

            if rec_fields and not shared_fields:
                explanation["Reason"].append(
                    f"'{rec_name}' has made significant contributions in {', '.join(rec_fields)}, which align with your interests."
                )

            if not explanation["Reason"]:
                explanation["Reason"].append(
                    f"'{rec_name}' is a recognized expert in relevant areas."
                )

            explanations.append(explanation)

        return explanations




    def recommend_authors_with_explanations(self, target_authors, max_recommendations=5):
        recommendations = self.recommend_authors_by_embeddings(target_authors, max_recommendations)
        explanations = self.explain_recommendations(target_authors, recommendations)
        return recommendations, explanations


    def compute_graph_embeddings(self):
        num_cpus = os.cpu_count()//2
        node2vec = Node2Vec(self.graph, dimensions=32, walk_length=15, num_walks=100, workers=num_cpus)

        if not self.model:
            self.model = node2vec.fit()

        self.model = node2vec.fit()

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

        similarities = target_embeddings @ all_embeddings.T
        mean_similarities = similarities.mean(axis=0)

        recommendations = []
        for (author_node, profile_link, fields), similarity in zip(all_authors, mean_similarities):
            if author_node in target_author_names:
                continue

            overlap_score = sum(
                1 for field in fields if field in [
                    field for author in target_authors for field in author.get("Fields of Study", [])
                ]
            )
            recommendations.append({
                "Author": author_node.replace("Author: ", ""),
                "Profile Link": profile_link,
                "Similarity": similarity,
                "Field Count": len(fields),
                "Overlap Score": overlap_score,
                "Fields": fields or ["Unknown"]
            })

        # Sorting logic:
        # 1. Authors with high similarity to multiple authors
        # 2. Authors working in multiple fields
        # 3. Authors similar to multiple target authors or working in multiple fields
        # 4. Diverse field representation
        # 5. Authors contributing to highest-weight fields
        field_weights = {field: weight for field, weight in self.get_weighted_fields(target_authors)}
        sorted_recommendations = sorted(
            recommendations,
            key=lambda x: (
                -x["Overlap Score"],
                -x["Field Count"],
                -x["Similarity"],
                -max(field_weights.get(field, 0) for field in x["Fields"])
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

    def get_weighted_fields(self, authors):
        default_fields = [("Artificial Intelligence", 1),
                          ("Data Science", 1),
                          ("Cybersecurity", 1),
                          ("Software Engineering", 1),
                          ("Cloud Computing", 1)]

        field_counts = Counter(field for author in authors for field in author.get("Fields of Study", []))
        combined_fields = list(field_counts.items())

        existing_fields = set(field.lower() for field, _ in combined_fields)
        for field, weight in default_fields:
            if field.lower() not in existing_fields:
                combined_fields.append((field, weight))

        return sorted(combined_fields, key=lambda x: -x[1])[:5]


def get_acm_recommendations_and_field_authors(context, authors, max_recommendations=5, max_results_per_field=5):
    print("Getting Recommendations...")
    acm_searcher = ACMAuthorSearcher(context.should_filter_gender())
    recommender = ACMRecommender(acm_searcher, RecommendationsCache())

    if not authors:
        default_fields = ["Artificial Intelligence", "Data Science", "Cybersecurity", "Software Engineering", "Cloud Computing"]

        acm_results = {}
        for field in default_fields:
            acm_results[field] = acm_searcher.retry_search_acm_field(field, max_retries=3, required_minimum=max_results_per_field)

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

    authors_key = tuple(sorted(author['Name'] for author in authors))
    cached_recommendations, cached_weights = recommender.cache.get(authors_key)

    if cached_recommendations:
        return cached_recommendations

    acm_results = {}
    loop = asyncio.get_event_loop()
    fields_to_fetch = {field for author in authors for field in author.get("Fields of Study", [])}

    async def fetch_all_fields():
        tasks = [
            acm_searcher.search_acm_field_async(field, pages_to_fetch=3)
            for field in fields_to_fetch
        ]
        return await asyncio.gather(*tasks)

    all_results = loop.run_until_complete(fetch_all_fields())
    for field, result in zip(fields_to_fetch, all_results):
        acm_results[field] = result if result else []

    recommender.build_network(authors, acm_results)

    current_weights = recommender.get_weighted_fields(authors)

    recommendations, explanations = recommender.recommend_authors_with_explanations(authors, max_recommendations)

    diverse_picks = [
        {
            "Recommended Author": rec["Recommended Author"],
            "Profile Link": rec["Profile Link"],
            "Reason": "; ".join(rec["Reason"])
        }
        for rec in explanations[:max_recommendations]
    ]

    top_picks = [{
        'Subheading': 'Top Picks For You',
        'Authors': diverse_picks
    }]

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
                        "Reason": f"Recommended because '{author['Name']}' has expertise in '{field}', which aligns with your field of interest."
                    }
                    for author in sampled_authors
                ]
            })

    recommendations = {
        "Recommended Authors": top_picks,
        "Authors by Weighted Fields": field_author_mapping
    }

    recommender.cache.set(authors_key, recommendations, current_weights)
    return recommendations


if __name__ == "__main__":
    authors = [
        {"Name": "Jane Doe", "Fields of Study": ["Artificial Intelligence", "Machine Learning"]},
        {"Name": "John Smith", "Fields of Study": ["Cybersecurity", "Data Science"]}
    ]

    authors = []
    context = SearchScrapeContext()
    results = get_acm_recommendations_and_field_authors(context, authors, max_recommendations=5, max_results_per_field=5)
    print("Part 1 (Default Fields)")
    print(results)




if __name__ == "__main__":
    authors = [
        {"Name": "Jane Doe", "Fields of Study": ["Artificial Intelligence", "Machine Learning"]},
        {"Name": "John Smith", "Fields of Study": ["Cybersecurity", "Data Science"]}
    ]

    authors = []
    context = SearchScrapeContext()
    results = get_acm_recommendations_and_field_authors(context, authors, max_recommendations=5, max_results_per_field=5)
    print("Part 1 (Default Fields)")
    print(results)