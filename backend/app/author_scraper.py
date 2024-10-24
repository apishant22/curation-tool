import requests
from bs4 import BeautifulSoup
import re
import time
import json
from fuzzywuzzy import fuzz
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

# Function to search ACM DL for an author and get search results
def search_acm_author(author_name, page_number):
    formatted_name = author_name.replace(' ', '+')

    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
    }

    author_list = []

    initial_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_name}&startPage=0&content=people&target=people-tab&sortBy=relevancy&groupByField=ContribIdSingleValued"
    response = requests.get(initial_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve author data for {author_name}")
        return {"authors": [], "no_previous_page": True, "no_next_page": True}

    soup = BeautifulSoup(response.content, 'html.parser')
    result_count_tag = soup.find('span', class_='result__count')
    total_authors = int(result_count_tag.text.split()[0]) if result_count_tag else 0
    authors_per_page = 20
    max_pages = ((total_authors + authors_per_page - 1) // authors_per_page) - 1

    no_previous_page = page_number <= 0
    no_next_page = page_number >= (max_pages - 1)

    if page_number < 0:
        page_number = 0
    elif page_number >= max_pages:
        page_number = max_pages - 1

    search_url = f"https://dl.acm.org/action/doSearch?AllField={formatted_name}&startPage={page_number}&content=people&target=people-tab&sortBy=relevancy&groupByField=ContribIdSingleValued"
    print(f"Searching URL: {search_url}")

    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve author data for {author_name} on page {page_number}")
        return {"authors": [], "no_previous_page": no_previous_page, "no_next_page": no_next_page}

    soup = BeautifulSoup(response.content, 'html.parser')

    author_items = soup.find_all('li', class_='people__people-list')
    if not author_items:
        print(f"No author items found on page {page_number}.")
        return {"authors": [], "no_previous_page": no_previous_page, "no_next_page": no_next_page}

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
        "no_previous_page": no_previous_page,
        "no_next_page": no_next_page
    }

# Function to identify if the input is an ORCID ID or an author name and search ACM DL
def identify_input_type_and_search_author(input_value, page_number):
    orcid_pattern = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{4}$")

    if orcid_pattern.match(input_value):
        print(f"Recognised input as ORCID ID: {input_value}")
        author_name = search_orcid_by_id(input_value)
        if not author_name:
            print(f"No author found for ORCID ID: {input_value}")
            return []
        return search_acm_author(author_name, page_number)
    else:
        print(f"Recognised input as author name: {input_value}")
        return search_acm_author(input_value, page_number)

# Function to use CrossRef to get ORCID ID from DOI
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
    publications = scrape_author_publications(profile_link)

    orcid_id = find_author_orcid_by_dois(publications, author_name)
    print(orcid_id)

    if not orcid_id:
        orcid_id = "Author does not have ORCID ID"
    else:
        orcid_id = orcid_id.replace("http://orcid.org/", "")

    for pub in publications:
        if pub['DOI'] != 'No DOI':
            abstract, publication_date = get_metadata_from_doi(pub['DOI'])
            pub['Abstract'] = abstract if abstract else "No abstract available."
            pub['Publication Date'] = publication_date if publication_date else "Unknown publication date"

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
def scrape_author_publications(profile_link):
    publications_url = f"{profile_link}/publications?Role=author&startPage=0&pageSize=50"

    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
    }

    response = requests.get(publications_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to retrieve publications for {profile_link}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    publications = []

    publication_items = soup.find_all('li', class_='search__item')

    for item in publication_items:
        title_tag = item.find('h5', class_='issue-item__title')
        title = title_tag.text.strip() if title_tag else 'Unknown title'

        author_tags = item.select('ul.rlist--inline.loa a[title]')
        authors = ', '.join([tag.text.strip() for tag in author_tags])

        doi_tag = item.find('div', class_='issue-item__detail').find_all('a', href=True)
        doi = None
        for link in doi_tag:
            if "https://doi.org/" in link['href']:
                doi = link['href'].replace("https://doi.org/", "")
                break

        doi = doi if doi else 'No DOI'

        publications.append({
            'Title': title,
#            'Authors': authors,
            'DOI': doi,
            'Abstract': 'N/A',
            'Publication Date': 'N/A'
        })

    return publications

# Retrieve metadata of oublications using Semantic Scholar API
def get_metadata_from_doi(doi):
    semantic_scholar_url = f"https://api.semanticscholar.org/graph/v1/paper/{doi}?fields=title,abstract,authors,publicationDate"

    retry_attempts = 3
    for attempt in range(retry_attempts):
        try:
            response = requests.get(semantic_scholar_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                abstract = data.get('abstract', 'No abstract available.')
                publication_date = data.get('publicationDate', 'Unknown publication date')
                return abstract, publication_date
            else:
                print(f"Attempt {attempt + 1}: Failed to retrieve data for DOI: {doi}, Status Code: {response.status_code}")
                print(f"Response Content: {response.text}")
                time.sleep(2)

        except Exception as e:
            print(f"Attempt {attempt + 1}: An error occurred while retrieving metadata from DOI: {e}")
            time.sleep(2)

    return None, None

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

# Function to process biographical information using ORCID API
def process_biography(orcid_id):
    biography_data = get_orcid_biography(orcid_id)
    biography = []
    if biography_data and 'content' in biography_data:
        biography_info = biography_data.get('content', 'No biography available.')
        biography.append(biography_info)
    else:
        biography_info = "No biographical information available."
        biography.append(biography_info)
    return biography


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

    # Normalize biography to always be a list
    if isinstance(details.get('Biography'), str):
        details['Biography'] = [details['Biography']]
    elif details.get('Biography') is None:
        details['Biography'] = ["No biographical information available."]

    return details

# Fucntion to handle logic on when to scrape and etc.
def update_author_if_needed(author_name, profile_link):
    scraped_author_details_json = scrape_author_details(author_name, profile_link)
    scraped_author_details = json.loads(scraped_author_details_json)

    orcid_id = scraped_author_details.get("Orcid ID")

    if not orcid_id:
        print("ORCID ID not found. Cannot proceed without ORCID ID.")
        return None

    try:
        author_details_db = get_author_details_from_db(orcid_id)

        if author_details_db:
            scraped_author_details = normalize_dates(scraped_author_details)
            author_details_db = normalize_dates(author_details_db)

            print("\n--- SCRAPED AUTHOR DETAILS ---")
            print(json.dumps(scraped_author_details, indent=4))
            print("\n--- DATABASE AUTHOR DETAILS ---")
            print(json.dumps(author_details_db, indent=4))

            diff = DeepDiff(author_details_db, scraped_author_details, ignore_order=True)

            if not diff:
                summary = get_researcher_summary(orcid_id)
                if summary and summary != "Summary not available.":
                    print("Data is up to date and summary is present. Returning existing summary.")
                    return json.dumps(summary, indent=4)
                else:
                    print("Summary is missing.")
                    return None
            else:
                print(f"Data differences found for ORCID ID {orcid_id}: {diff}")
                update_author_details_in_db(scraped_author_details)
                print("Database updated with the latest details.")
                return None

        else:
            print(f"No author found with ORCID ID: {orcid_id}. Adding new details to the database.")
            store_author_details_in_db(scraped_author_details)
            return None

    except NoResultFound:
        print(f"No author found with ORCID ID: {orcid_id}. Adding new details to the database.")
        store_author_details_in_db(scraped_author_details)
        return None

    except Exception as e:
        print(f"An error occurred: {e}")

    return None


# Example usage of the refactored functions
input_value = "0000-0002-1684-1539"
input = "Adriana"
page_number = 12
authors = identify_input_type_and_search_author(input, page_number)

if authors:
    print("\nAuthor Search Results:")
    print(authors)
else:
    print("No authors found.")
'''
selected_profile_author = "Adriana  Wilde"
selected_profile_link = "https://dl.acm.org/profile/99659070982"

author_details_json = update_author_if_needed(selected_profile_author, selected_profile_link)

print("\nDetailed Author Information:")
print(author_details_json)
'''
