import requests
from bs4 import BeautifulSoup
import re
import math
import json
from backend.db.db_helper import *

# from backend.llm import llmNew

# Function to search ACM DL for an author and get search results
def search_acm_author(author_name, page_number, max_pages):
    formatted_name = author_name.replace(' ', '+')
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
    }

    search_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_name}&startPage={page_number}&content=people&target=people-tab&sortBy=relevancy&groupByField=ContribIdSingleValued"
    print(f"Searching URL: {search_url}")

    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve author data for {author_name} on page {page_number}")
        return {"authors": [], "no_previous_page": page_number == 0, "no_next_page": page_number >= (max_pages - 1)}

    soup = BeautifulSoup(response.content, 'html.parser')
    author_items = soup.find_all('li', class_='people__people-list')
    author_list = []

    for item in author_items:
        name_tag = item.find('div', class_='name')
        name = name_tag.text.strip() if name_tag else 'Unknown'
        location_tag = item.find('div', class_='location')
        location = location_tag.text.strip() if location_tag else 'Unknown location'
        profile_link_tag = item.find('a', href=True, title="View Profile")
        profile_link = f"https://dl.acm.org{profile_link_tag['href']}" if profile_link_tag else 'No profile link'

        author_list.append({
            'Name': name,
            'Location': location,
            'Profile Link': profile_link
        })

    print(f"Total authors found on page {page_number}: {len(author_list)}")
    return {
        "results": author_list,
        "no_previous_page": page_number == 0,
        "no_next_page": page_number >= (max_pages - 1)
    }

unique_authors = set()

# Function to search ACM DL for authors in a specific field
def search_acm_field(field_name, page_number, max_pages):
    formatted_field = field_name.replace(' ', '+')
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
    }

    search_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_field}&startPage={page_number}&content=standard&target=default&sortBy="
    print(f"Searching URL: {search_url}")

    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve field data for {field_name} on page {page_number}")
        return {"results": [], "no_previous_page": page_number == 0, "no_next_page": page_number >= (max_pages - 1)}

    soup = BeautifulSoup(response.content, 'html.parser')
    items = soup.find_all('li', class_='search__item')

    author_list = []

    profile_url_pattern = re.compile(r"^https://dl\.acm\.org/profile/\d+$")

    for item in items:
        author_elements = item.find_all('a', title=True)

        for author in author_elements:
            author_name = author['title'].strip()
            author_link = f"https://dl.acm.org{author['href']}"

            if profile_url_pattern.match(author_link) and author_name not in unique_authors:
                unique_authors.add(author_name)
                author_list.append({
                    "Name": author_name,
                    'Location': None,
                    "Profile Link": author_link,
                })

    print(f"Total unique authors found for field '{field_name}' on page {page_number}: {len(author_list)}")
    return {
        "results": author_list,
        "no_previous_page": page_number == 0,
        "no_next_page": page_number >= (max_pages - 1)
    }



def identify_input_type_and_search(input_value, page_number, search_type, max_pages=None):
    if page_number < 0:
        page_number = 0

    if max_pages is None:
        max_pages = get_estimated_max_pages(input_value)

    if search_type == "author":
        print(f"Recognised input as author name: {input_value}")
        acm_results = search_acm_author(input_value, page_number, max_pages)

    elif search_type == "field":
        print(f"Recognised input as field: {input_value}")
        acm_results = search_acm_field(input_value, page_number, max_pages)

    else:
        raise ValueError("Invalid search type. Please use 'author' or 'field'.")

    no_previous_page = page_number == 0
    no_next_page = page_number >= (max_pages - 1)

    return {
        "results": acm_results["results"],
        "no_previous_page": no_previous_page,
        "no_next_page": no_next_page,
        "max_pages": max_pages,
        "search_type": search_type
    }

def get_estimated_max_pages(input_value):
    formatted_name = input_value.replace(' ', '+')
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
    }

    initial_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_name}&startPage=0&content=people&target=people-tab&sortBy=relevancy&groupByField=ContribIdSingleValued"
    response = requests.get(initial_url, headers=headers)

    if response.status_code != 200:
        print(f"Failed to retrieve author data for {input_value}")
        return 0

    soup = BeautifulSoup(response.content, 'html.parser')
    result_count_tag = soup.find('span', class_='result__count')
    total_authors = int(result_count_tag.text.replace(',', '').split()[0]) if result_count_tag else 0

    page_size = 20
    max_pages = math.ceil(total_authors / page_size)
    print(f"Estimated Authors: {total_authors}, Max Pages: {max_pages}")

    return max_pages

# Function to scrape detailed information of an author from ACM profile link
def scrape_author_details(author_name, profile_link):
    headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html'}
    response = requests.get(profile_link, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve author profile for {author_name}")
        return {}

    soup = BeautifulSoup(response.content, 'html.parser')

    publications = scrape_author_publications(profile_link, author_name)
    subject_fields = extract_subject_fields(soup)


    author_details = {
            "Name": author_name,
            "Profile Link": profile_link,
            "Fields of Study": subject_fields,
            "Publications": publications
        }

    return json.dumps(author_details, indent=4)

def extract_subject_fields(soup):
    subject_fields_div = soup.find('div', class_='tag-cloud', attrs={'data-tags': True})
    if subject_fields_div:
        data_tags = subject_fields_div.get('data-tags')
        if data_tags:
            tags = json.loads(data_tags)
            return [tag['label'] for tag in tags if 'label' in tag]
    return []

# Function to scrape author's publications
def scrape_author_publications(profile_link, author):
    publications_url = f"{profile_link}/publications?Role=author&startPage=0&pageSize=50"
    headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html'}

    response = requests.get(publications_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve publications for {profile_link}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    publication_items = soup.find_all('li', class_='search__item')

    publications = []
    for item in publication_items:
        title_tag = item.find('h5', class_='issue-item__title')
        title = title_tag.text.strip() if title_tag else 'Unknown title'

        doi_tag = item.find('div', class_='issue-item__detail').find_all('a', href=True)
        doi = next((link['href'].replace("https://doi.org/", "") for link in doi_tag if "https://doi.org/" in link['href']), 'No DOI')

        co_authors = []
        author_list = item.find_all('a', title=True)
        for co_author in author_list:
            co_author_name = co_author['title'].strip()
            co_author_link = f"https://dl.acm.org{co_author['href']}"

            if co_author_name != author and co_author_name != "Get Access":
                co_authors.append({"Name": co_author_name, "Profile Link": co_author_link})

        if doi != 'No DOI':
            abstract, publication_date, citation_count = get_metadata_from_doi(doi, author)
        else:
            abstract, publication_date, citation_count = 'N/A', 'Unknown', 0

        publications.append({
            'Title': title,
            'DOI': doi,
            'Abstract': abstract,
            'Publication Date': publication_date,
            'Citation Count': citation_count,
            'Co-Authors': co_authors,
        })

    return publications

def get_metadata_from_doi(doi, target_author_name):
    semantic_scholar_url = f"https://api.semanticscholar.org/graph/v1/paper/{doi}?fields=title,abstract,publicationDate,citationCount"

    try:
        response = requests.get(semantic_scholar_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            abstract = data.get('abstract', 'No abstract available.')
            publication_date = data.get('publicationDate', 'Unknown publication date')
            citation_count = data.get('citationCount', 0)

            return abstract, publication_date, citation_count

        else:
            print(f"Failed to retrieve data for DOI: {doi}")
    except Exception as e:
        print(f"Error retrieving metadata from DOI: {e}")

    return "No abstract available.", "Unknown", 0

def scrape_latest_publication(profile_link, author):
    publications_url = f"{profile_link}/publications?Role=author&startPage=0&pageSize=1"
    headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html'}

    response = requests.get(publications_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve publications for {profile_link}")
        return None

    soup = BeautifulSoup(response.content, 'html.parser')
    latest_item = soup.find('li', class_='search__item')
    if not latest_item:
        return None

    title_tag = latest_item.find('h5', class_='issue-item__title')
    title = title_tag.text.strip() if title_tag else 'Unknown title'

    doi_tag = latest_item.find('div', class_='issue-item__detail').find_all('a', href=True)
    doi = next((link['href'].replace("https://doi.org/", "") for link in doi_tag if "https://doi.org/" in link['href']), 'No DOI')

    if doi != 'No DOI':
        abstract, publication_date, citation_count = get_metadata_from_doi(doi, author)
    else:
        abstract, publication_date, citation_count = 'N/A', 'Unknown', 0

    if publication_date == "Unknown":
        publication_date = None

    latest_publication = {
        'Title': title,
        'DOI': doi,
        'Abstract': abstract,
        'Publication Date': publication_date,
        'Citation Count': citation_count,
    }
    print("Latest Scraped Publication:", json.dumps(latest_publication, indent=4))
    return latest_publication

def get_latest_publication(publications):
    valid_publications = [
        pub for pub in publications if pub["Publication Date"] and pub["Publication Date"] != "None"
    ]

    latest_publication = max(
        valid_publications,
        key=lambda pub: datetime.strptime(pub["Publication Date"], "%Y-%m-%d")
    )
    return latest_publication

def update_author_if_needed(author_name, profile_link):
    try:
        latest_scraped_publication = scrape_latest_publication(profile_link, author_name)
        if not latest_scraped_publication:
            print("No latest publication found.")
            return None, None

        author_details_db = get_author_details_from_db(author_name)

        if not author_details_db or "Publications" not in author_details_db:
            print("No publication data found in the database for this author. Scraping and adding new author data...")

            scraped_author_details_json = scrape_author_details(author_name, profile_link)
            if not scraped_author_details_json:
                print("Failed to retrieve full author details during scrape.")
                return None, None

            scraped_author_details = json.loads(scraped_author_details_json)
            store_author_details_in_db(scraped_author_details)
            author_details_db = get_author_details_from_db(author_name)
            if not author_details_db:
                print(f"Failed to retrieve updated details from database for new author: {author_name}")
                return None, None

            print("New Author Details:", json.dumps(author_details_db, indent=4))
            return None, author_details_db

        latest_db_publication = get_latest_publication(author_details_db["Publications"])
        db_pub_date = latest_db_publication.get("Publication Date") if latest_db_publication else None
        scraped_pub_date = latest_scraped_publication.get("Publication Date")

        print("Latest Publication in Database:", json.dumps(latest_db_publication, indent=4) if latest_db_publication else "None")
        print("Latest Scraped Publication:", json.dumps(latest_scraped_publication, indent=4))

        if db_pub_date and scraped_pub_date:
            db_pub_date_obj = datetime.strptime(db_pub_date, "%Y-%m-%d")
            scraped_pub_date_obj = datetime.strptime(scraped_pub_date, "%Y-%m-%d")

            if db_pub_date_obj >= scraped_pub_date_obj:
                summary = get_researcher_summary(author_name)
                if summary and summary != "Summary not available.":
                    print("Data is up-to-date, and summary is present.")
                    return summary, author_details_db
                else:
                    print("Summary missing. Generating summary...")
                    return None, author_details_db

        print("New publication found or mismatch in data. Performing full scrape and updating database.")
        scraped_author_details_json = scrape_author_details(author_name, profile_link)
        if not scraped_author_details_json:
            print("Failed to retrieve full author details.")
            return None, None

        scraped_author_details = json.loads(scraped_author_details_json)
        update_author_details_in_db(scraped_author_details)

        author_details_db_after_update = get_author_details_from_db(author_name)
        print("Author Details After Update:", json.dumps(author_details_db_after_update, indent=4))
        return None, author_details_db_after_update

    except KeyError as e:
        print(f"KeyError during update: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None

'''
# Example usage of the refactored functions
input = "Adriana Wilde"
i = "Huiqiang Jia"
page_number = 0
search_type = "author" or "field"
authors = identify_input_type_and_search(i, page_number, search_type, 1)

if authors:
    print("\nAuthor Search Results:")
    print(authors)
else:
    print("No authors found.")

author_name =  "huiqiang jia"
profile_link = "https://dl.acm.org/profile/99659836122"

selected_profile_author = "Adriana Wilde"
selected_profile_link = "https://dl.acm.org/profile/99659070982"

author_details_json = update_author_if_needed(author_name, profile_link)

print("\nDetailed Author Information:")
print(author_details_json)
'''