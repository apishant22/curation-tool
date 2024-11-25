import time
import requests
from bs4 import BeautifulSoup
import re
from gender_guesser.detector import Detector


class ACMAuthorSearcher:
    results_per_page = 21

    def __init__(self, filter_by_gender=False):
        self.seen_authors = set()
        self.current_query = None
        self.next_page_cache = []
        self.gender_detector = Detector()
        self.filter_by_gender = filter_by_gender

    def filter_authors_by_gender(self, authors):
        if not self.filter_by_gender:
            return authors

        filtered_authors = []
        for author in authors:
            try:
                name = author["Name"]
                first_name = name.split()[0]
                gender = self.gender_detector.get_gender(first_name)
                if gender != "male":
                    filtered_authors.append(author)
                else:
                    print(f"Skipped '{name}' (Gender: {gender})")
            except Exception as e:
                print(f"Error processing name '{author.get('Name', 'Unknown')}': {e}")
        return filtered_authors

    def scrape_page(self, url, headers, profile_url_pattern, is_field):
        try:
            time.sleep(1)

            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Failed to retrieve data from URL: {url}")
                return []

            soup = BeautifulSoup(response.content, 'html.parser')
            items = soup.find_all('li', class_='search__item') if is_field else soup.find_all('li', class_='people__people-list')

            results = []
            for item in items:
                if is_field:
                    author_elements = item.find_all('a', title=True)
                    for author in author_elements:
                        author_name = author['title'].strip()
                        author_link = f"https://dl.acm.org{author['href']}"
                        if profile_url_pattern.match(author_link) and author_name not in self.seen_authors:
                            self.seen_authors.add(author_name)
                            results.append({
                                "Name": author_name,
                                "Location": None,
                                "Profile Link": author_link
                            })
                else:
                    name_tag = item.find('div', class_='name')
                    name = name_tag.text.strip() if name_tag else 'Unknown'
                    location_tag = item.find('div', class_='location')
                    location = location_tag.text.strip() if location_tag else 'Unknown location'
                    profile_link_tag = item.find('a', href=True, title="View Profile")
                    profile_link = f"https://dl.acm.org{profile_link_tag['href']}" if profile_link_tag else 'No profile link'

                    if name not in self.seen_authors:
                        self.seen_authors.add(name)
                        results.append({
                            "Name": name,
                            "Location": location,
                            "Profile Link": profile_link
                        })

            return self.filter_authors_by_gender(results)

        except Exception as e:
            print(f"Error scraping page: {e}")
            return []


    def fetch_pages(self, base_url, headers, profile_url_pattern, is_field, start_page, end_page):
        urls = [f"{base_url}&startPage={i}" for i in range(start_page, end_page)]
        results = []

        for url in urls:
            page_results = self.scrape_page(url, headers, profile_url_pattern, is_field)
            results.extend(page_results)

        return results

    def search_acm_author(self, author_name, page_number, max_pages):
        formatted_name = author_name.replace(' ', '+')
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html'
        }

        if self.current_query != author_name:
            print(f"Query has changed. Resetting state for author: {author_name}")
            self.seen_authors = set()
            self.next_page_cache = []
            self.current_query = author_name

        profile_url_pattern = re.compile(r"^https://dl\.acm\.org/profile/\d+$")
        base_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_name}&content=people&target=people-tab&sortBy=relevancy&groupByField=ContribIdSingleValued"
        results = []

        if self.next_page_cache:
            results.extend(self.next_page_cache[:self.results_per_page])
            self.next_page_cache = self.next_page_cache[self.results_per_page:]

        start_page = page_number
        while len(results) < self.results_per_page and start_page < max_pages:
            end_page = start_page + 3
            page_results = self.fetch_pages(base_url, headers, profile_url_pattern, is_field=False, start_page=start_page, end_page=min(end_page, max_pages))
            start_page += 3

            for result in page_results:
                if len(results) < self.results_per_page:
                    results.append(result)
                else:
                    self.next_page_cache.append(result)

        return {
            "results": results,
            "no_previous_page": page_number == 0,
            "no_next_page": not self.next_page_cache and start_page >= max_pages
        }

    def search_acm_field(self, field_name, page_number):
        formatted_field = field_name.replace(' ', '+')
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html'
        }

        if self.current_query != field_name:
            print(f"Query has changed. Resetting state for field: {field_name}")
            self.seen_authors = set()
            self.next_page_cache = []
            self.current_query = field_name

        profile_url_pattern = re.compile(r"^https://dl.acm\.org/profile/\d+$")
        base_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_field}&content=standard&target=default&sortBy="
        results = []

        if self.next_page_cache:
            results.extend(self.next_page_cache[:self.results_per_page])
            self.next_page_cache = self.next_page_cache[self.results_per_page:]

        if len(results) < self.results_per_page:
            current_page_results = self.fetch_pages(
                base_url, headers, profile_url_pattern, is_field=True,
                start_page=page_number, end_page=page_number + 1
            )
            for result in current_page_results:
                if len(results) < self.results_per_page:
                    results.append(result)
                else:
                    self.next_page_cache.append(result)

        next_page_results = self.fetch_pages(
            base_url, headers, profile_url_pattern, is_field=True,
            start_page=page_number + 1, end_page=page_number + 2
        )
        for result in next_page_results:
            self.next_page_cache.append(result)

        no_next_page = len(self.next_page_cache) == 0

        return {
            "results": results,
            "no_previous_page": page_number == 0,
            "no_next_page": no_next_page
        }