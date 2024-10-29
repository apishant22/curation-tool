import requests
from bs4 import BeautifulSoup
import re
import math
import json
from fuzzywuzzy import fuzz, process
from backend.db.db_helper import *
from deepdiff import DeepDiff
from sqlalchemy.orm.exc import NoResultFound

# Function to search ORCID by ORCID ID and get author name
def search_orcid_by_id(orcid_id):
    orcid_url = f"https://pub.orcid.org/v3.0/{orcid_id}"
    headers = {
        'Accept': 'application/json'
    }

    response = requests.get(orcid_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve data for ORCID ID: {orcid_id}")
        return None

    try:
        data = response.json()
        given_name = data['person']['name']['given-names']['value']
        family_name = data['person']['name']['family-name']['value']
        author_name = f"{given_name} {family_name}"
        return author_name
    except Exception as e:
        print(f"Error parsing ORCID response: {e}")
        return None

def search_orcid_for_authors(authors):
    authors_with_orcid = []
    for author in authors:
        orcid_id = search_orcid_by_name(author['Name'])
        if orcid_id:
            author['Orcid ID'] = orcid_id
            authors_with_orcid.append(author)

    return authors_with_orcid

def search_orcid_by_name(name):
    base_url = "https://pub.orcid.org/v3.0/search"
    headers = {
        "Accept": "application/json"
    }
    params = {
        "q": f"given-names:{name.split()[0]} AND family-name:{name.split()[-1]}"
    }

    try:
        response = requests.get(base_url, headers=headers, params=params)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed to search ORCID for {name}: {e}")
        return None

    try:
        data = response.json()
        if data is not None and "result" in data and isinstance(data["result"], list) and len(data["result"]) > 0:
            orcid_id = data["result"][0]["orcid-identifier"]["path"]
            return orcid_id
        else:
            print(f"No results found in ORCID for {name}")
            return None
    except (ValueError, KeyError, TypeError) as e:
        print(f"Error parsing ORCID search response for {name}: {e}")
        return None

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
        "authors": author_list,
        "no_previous_page": page_number == 0,
        "no_next_page": page_number >= (max_pages - 1)
    }

# Function to identify if the input is an ORCID ID or an author name and search ACM DL
def identify_input_type_and_search_author(input_value, page_number, max_pages=None):
    orcid_pattern = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{4}$")

    if page_number < 0:
        page_number = 0

    if orcid_pattern.match(input_value):
        print(f"Recognised input as ORCID ID: {input_value}")
        author_name = search_orcid_by_id(input_value)
        if not author_name:
            print(f"No author found for ORCID ID: {input_value}")
            return {
                "authors": [],
                "no_previous_page": True,
                "no_next_page": True,
                "max_pages": 1
            }

        acm_results = search_acm_author(author_name, 0, 1)
        matching_authors = [
            author for author in acm_results["authors"]
            if search_orcid_by_name(author["Name"]) == input_value
        ]

        return {
            "authors": matching_authors,
            "no_previous_page": True,
            "no_next_page": True,
            "max_pages": 1
        }

    else:
        print(f"Recognised input as author name: {input_value}")
        if max_pages is None:
            max_pages = get_estimated_max_pages(input_value)

        acm_results = search_acm_author(input_value, page_number, max_pages)
        filtered_authors = [
            {**author, "Orcid ID": search_orcid_by_name(author["Name"])}
            for author in acm_results["authors"]
            if search_orcid_by_name(author["Name"])
        ]

        no_previous_page = page_number == 0
        no_next_page = page_number >= (max_pages - 1)

        return {
            "authors": filtered_authors,
            "no_previous_page": no_previous_page,
            "no_next_page": no_next_page,
            "max_pages": max_pages
        }

def find_closest_author_match(authors, target_name):
    if not authors:
        return None

    author_names = [author['Name'] for author in authors]
    closest_match_name, match_score = process.extractOne(target_name, author_names)

    if match_score >= 80:
        for author in authors:
            if author["Name"] == closest_match_name:
                return author
    return None

def get_orcid_from_doi(doi):
    crossref_url = f"https://api.crossref.org/works/{doi}"

    try:
        response = requests.get(crossref_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            author_list = data.get('message', {}).get('author', [])
            authors = []
            for author in author_list:
                author_name = f"{author.get('given', '')} {author.get('family', '')}".strip()
                orcid_url = author.get('ORCID', None)
                orcid_id = orcid_url.replace("https://orcid.org/", "") if orcid_url else None
                authors.append({
                    "Name": author_name,
                    "Orcid ID": orcid_id
                })
            return authors
        else:
            print(f"Failed to retrieve data for DOI: {doi}, Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error while retrieving ORCID from DOI: {e}")

    return []

def get_estimated_max_pages(input_value):
    orcid_pattern = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{4}$")
    is_orcid = bool(orcid_pattern.match(input_value))
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

    author_items = soup.find_all('li', class_='people__people-list')
    orcid_count = 0
    for item in author_items:
        author_name = item.find('div', class_='name').text.strip() if item.find('div', 'name') else 'Unknown'
        if search_orcid_by_name(author_name):
            orcid_count += 1

    sample_size = len(author_items)
    orcid_ratio = orcid_count / sample_size if sample_size > 0 else 0
    estimated_orcid_authors = int(total_authors * orcid_ratio)

    page_size = 20
    max_pages = math.ceil(estimated_orcid_authors / page_size)
    print(f"Estimated ORCID Authors: {estimated_orcid_authors}, Max Pages: {max_pages}")

    return max_pages



# Function to find the ORCID ID associated with a given author by analysing all DOIs
def find_author_orcid_by_dois(publications, target_author_name):
    closest_match = None
    highest_similarity = 0

    for publication in publications:
        doi = publication['DOI']
        if doi == 'No DOI':
            continue

        authors = get_orcid_from_doi(doi)
        for author in authors:
            if author['Orcid ID']:
                similarity = fuzz.ratio(author['Name'].lower(), target_author_name.lower())
                if similarity > highest_similarity:
                    highest_similarity = similarity
                    closest_match = author['Orcid ID']

    if closest_match:
        return closest_match

    return None

# Function to scrape detailed information of an author from ACM profile link
def scrape_author_details(author_name, profile_link):
    publications = scrape_author_publications(profile_link, author_name)

    orcid_id = find_author_orcid_by_dois(publications, author_name)
    print(orcid_id)

    if not orcid_id:
        orcid_id = "Author does not have ORCID ID"
    else:
        orcid_id = orcid_id.replace("http://orcid.org/", "")

    author_details = {
        "Name": author_name,
        "Orcid ID": orcid_id,
        "Biography": [],
        "Employment History": [],
        "Education History": [],
        "Publications": publications
    }

    for pub in publications:
        if pub['DOI'] != 'No DOI':
            abstract, publication_date, citation_count, co_authors = get_metadata_from_doi(pub['DOI'], author_name)
            pub['Abstract'] = abstract if abstract else "No abstract available."
            pub['Publication Date'] = publication_date if publication_date else "Unknown publication date"
            pub['Citation Count'] = citation_count
            pub['Co-Authors'] = co_authors

        employment_history = process_employment(orcid_id)
        education_history = process_education(orcid_id)
        biography = process_biography(orcid_id)

        author_details = {
            "Name": author_name,
            "Orcid ID": orcid_id,
            "Biography": biography,
            "Employment History": employment_history,
            "Education History": education_history,
            "Publications": publications
        }

    return json.dumps(author_details, indent=4)


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

        if doi != 'No DOI':
            abstract, publication_date, citation_count, co_authors = get_metadata_from_doi(doi, author)
        else:
            abstract, publication_date, citation_count, co_authors = 'N/A', 'Unknown', 0, []

        publications.append({
            'Title': title,
            'DOI': doi,
            'Abstract': abstract,
            'Publication Date': publication_date,
            'Citation Count': citation_count,
            'Co-Authors': co_authors  # Store co-authors for later insertion
        })

    return publications

# Retrieve metadata of oublications using Semantic Scholar API
def get_co_authors_from_doi(doi, target_author_name):
    authors = get_orcid_from_doi(doi)
    co_authors = []

    for author in authors:
        if author["Name"].strip().lower() == target_author_name.strip().lower():
            continue

        if not author.get("Orcid ID"):
            author["Orcid ID"] = search_orcid_by_name(author["Name"])

        if author["Orcid ID"]:
            author["Orcid ID"] = author["Orcid ID"].replace("http://orcid.org/", "").replace("https://orcid.org/", "")
            co_authors.append(author)

    return co_authors


def get_metadata_from_doi(doi, target_author_name):
    semantic_scholar_url = f"https://api.semanticscholar.org/graph/v1/paper/{doi}?fields=title,abstract,authors,publicationDate,citationCount"

    try:
        response = requests.get(semantic_scholar_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            abstract = data.get('abstract', 'No abstract available.')
            publication_date = data.get('publicationDate', 'Unknown publication date')
            citation_count = data.get('citationCount', 0)

            co_authors_with_orcid = get_co_authors_from_doi(doi, target_author_name)
            return abstract, publication_date, citation_count, co_authors_with_orcid

        else:
            print(f"Failed to retrieve data for DOI: {doi}")
    except Exception as e:
        print(f"Error retrieving metadata from DOI: {e}")

    return "No abstract available.", "Unknown", 0, []



# Retrieve detailed info using ORCID API
def get_orcid_employment(orcid_id):
    url = f"https://pub.orcid.org/v3.0/{orcid_id}/employments"
    headers = {'Accept': 'application/json'}

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code == 200:
        employment_data = response.json()
        return employment_data
    else:
        print(f"Failed to retrieve employment data for ORCID ID: {orcid_id}")
        return None

def get_orcid_education(orcid_id):
    url = f"https://pub.orcid.org/v3.0/{orcid_id}/educations"
    headers = {'Accept': 'application/json'}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        education_data = response.json()
        return education_data
    else:
        print(f"Failed to retrieve education data for ORCID ID: {orcid_id}")
        return None


def get_orcid_biography(orcid_id):
    url = f"https://pub.orcid.org/v3.0/{orcid_id}/biography"
    headers = {'Accept': 'application/json'}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        biography_data = response.json()
        return biography_data
    else:
        print(f"Failed to retrieve biography for ORCID ID: {orcid_id}")
        return None


# Function to process employment history using ORCID API
def process_employment(orcid_id):
    employment_data = get_orcid_employment(orcid_id)
    employment_history = []

    if employment_data and 'affiliation-group' in employment_data:
        for group in employment_data.get('affiliation-group', []):
            for summary in group.get('summaries', []):
                employment = summary.get('employment-summary', {})
                if not employment:
                    continue

                organisation = employment.get('organization', {}).get('name', 'Unknown organization')
                role_title = employment.get('role-title', 'Unknown role title')
                department_name = employment.get('department-name', 'Unknown department')

                start_date = employment.get('start-date')
                start_date_str = format_date(start_date)

                end_date = employment.get('end-date')
                end_date_str = format_date(end_date)

                employment_info = {
                    "Organization": organisation,
                    "Role": role_title,
                    "Department": department_name,
                    "Start Date": start_date_str,
                    "End Date": end_date_str
                }
                employment_history.append(employment_info)

    if not employment_history:
        employment_info = "No employment history available."
        employment_history.append(employment_info)

    return employment_history

# Function to process education history using ORCID API
def process_education(orcid_id):
    education_data = get_orcid_education(orcid_id)
    education_history = []

    if education_data and 'affiliation-group' in education_data:
        for group in education_data['affiliation-group']:
            for summary in group.get('summaries', []):
                education = summary.get('education-summary', {})
                if not education:
                    continue

                institution = education.get('organization', {}).get('name', 'Unknown institution')
                role_title = education.get('role-title', 'Unknown role title')
                department_name = education.get('department-name', 'Unknown department')

                institution = institution.encode('utf-8').decode('utf-8')
                role_title = role_title.encode('utf-8').decode('utf-8')
                department_name = department_name.encode('utf-8').decode('utf-8')

                start_date = education.get('start-date')
                start_date_str = format_date(start_date)

                end_date = education.get('end-date')
                end_date_str = format_date(end_date)

                education_info = {
                    "Institution": institution,
                    "Role": role_title,
                    "Department": department_name,
                    "Start Date": start_date_str,
                    "End Date": end_date_str
                }
                education_history.append(education_info)

    if not education_history:
        education_info = "No education history available."
        education_history.append(education_info)

    return education_history

# Function to process biographical data using ORCID API
biography_cache = {}

def process_biography(orcid_id):
    if orcid_id in biography_cache:
        return biography_cache[orcid_id]

    url = f"https://pub.orcid.org/v3.0/{orcid_id}/biography"
    headers = {'Accept': 'application/json'}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        biography_data = response.json()
        biography_cache[orcid_id] = biography_data
        return biography_data

    except requests.exceptions.HTTPError as e:
        if response.status_code == 404:
            print(f"Biography not found for ORCID ID: {orcid_id}")
            biography_cache[orcid_id] = "No biographical information available."
            return "No biographical information available."

        print(f"HTTP error for ORCID ID: {orcid_id}")
        return "No biographical information available."

    except requests.exceptions.RequestException as e:
        print(f"Network error for ORCID ID: {orcid_id}")
        return "No biographical information available."



# Function to format date from ORCID data
def format_date(date_data):
    if not date_data:
        return 'Unknown'

    year = date_data.get('year', {}).get('value')
    month = date_data.get('month', {}).get('value')
    day = date_data.get('day', {}).get('value')

    if year:
        if month and day:
            return f"{int(day):02}/{int(month):02}/{year}"
        elif month:
            return f"{int(month):02}/{year}"
        else:
            return str(year)
    return 'Unknown'

# Function to normalise dates in JSON
def normalize_dates(details):
    for employment in details.get('Employment History', []):
        if isinstance(employment.get('Start Date'), datetime):
            employment['Start Date'] = employment['Start Date'].strftime("%Y-%m-%d")
        elif employment.get('Start Date') is None:
            employment['Start Date'] = "Unknown"
        elif isinstance(employment.get('Start Date'), str):
            try:
                parsed_date = datetime.strptime(employment['Start Date'], "%d/%m/%Y")
                employment['Start Date'] = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

        if isinstance(employment.get('End Date'), datetime):
            employment['End Date'] = employment['End Date'].strftime("%Y-%m-%d")
        elif employment.get('End Date') is None:
            employment['End Date'] = "Unknown"
        elif isinstance(employment.get('End Date'), str):
            try:
                parsed_date = datetime.strptime(employment['End Date'], "%d/%m/%Y")
                employment['End Date'] = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

        employment["Role"] = employment.get("Role") or "Unknown"
        employment["Department"] = employment.get("Department") or "Unknown Department"

    for publication in details.get('Publications', []):
        if isinstance(publication.get('Publication Date'), datetime):
            publication['Publication Date'] = publication['Publication Date'].strftime("%Y-%m-%d")
        elif publication.get('Publication Date') is None:
            publication['Publication Date'] = "Unknown"
        elif isinstance(publication.get('Publication Date'), str):
            try:
                parsed_date = datetime.strptime(publication['Publication Date'], "%d/%m/%Y")
                publication['Publication Date'] = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

    if isinstance(details.get('Biography'), str):
        details['Biography'] = [details['Biography']]
    elif details.get('Biography') is None:
        details['Biography'] = ["No biographical information available."]

    return details

# Fucntion to handle logic on when to scrape and etc.

def update_author_if_needed(author_name, profile_link):
    try:
        scraped_author_details_json = scrape_author_details(author_name, profile_link)

        if not scraped_author_details_json:
            print("No author details found in scrape_author_details.")
            return None, None

        if not isinstance(scraped_author_details_json, str):
            print("Unexpected data format for scraped author details.")
            return None, None

        try:
            scraped_author_details = json.loads(scraped_author_details_json)
        except json.JSONDecodeError:
            print("Failed to parse JSON from scraped author details.")
            return None, None

        if not isinstance(scraped_author_details, dict):
            print("Parsed author details are not in dictionary format.")
            return None, None

        orcid_id = scraped_author_details.get("Orcid ID")
        if not orcid_id:
            print("ORCID ID not found in scraped author details. Cannot proceed without ORCID ID.")
            return None, None

        author_details_db = get_author_details_from_db(orcid_id)

        if author_details_db is not None and not isinstance(author_details_db, dict):
            print("Database returned author details in an unexpected format.")
            return None, None

        scraped_author_details = normalize_dates(scraped_author_details)
        author_details_db = normalize_dates(author_details_db) if author_details_db else {}

        print("\n--- Scraped Author Details (Before Processing) ---")
        print(json.dumps(scraped_author_details, indent=4))

        if author_details_db:
            print("\n--- Existing Database Author Details ---")
            print(json.dumps(author_details_db, indent=4))

            diff = DeepDiff(author_details_db, scraped_author_details, ignore_order=True, ignore_string_case=True)

            if not diff:
                summary = get_researcher_summary(orcid_id)
                if summary and summary != "Summary not available.":
                    print("Data is up to date and summary is present. Returning existing summary.")
                    return summary, author_details_db
                else:
                    print("Summary is missing.")
                    return None, author_details_db
            else:
                print(f"\n--- Data differences found for ORCID ID {orcid_id} ---")
                print(diff)

                update_author_details_in_db(scraped_author_details)
                print("Database updated with the latest details.")
                return None, scraped_author_details

        else:
            print(f"No author found with ORCID ID: {orcid_id}. Adding new details to the database.")
            store_author_details_in_db(scraped_author_details)
            return None, scraped_author_details

    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None



'''
# Example usage of the refactored functions
input_value = "0000-0002-1684-1539"
input = "Adriana Wilde"
page_number = 0
authors = identify_input_type_and_search_author(input_value, page_number, 1)

if authors:
    print("\nAuthor Search Results:")
    print(authors)
else:
    print("No authors found.")ç

selected_profile_author = "Adriana Wilde"
selected_profile_link = "https://dl.acm.org/profile/99659070982"

author_details_json = update_author_if_needed(selected_profile_author, selected_profile_link)

print("\nDetailed Author Information:")
print(author_details_json)
'''