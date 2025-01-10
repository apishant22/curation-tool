import json

from functions.duck_duck_go_search import DuckDuckGoSearchManager
from functions.web_scraper import WebContentScraper

ddg = DuckDuckGoSearchManager()
scraper = WebContentScraper()


def text_search(query: str, num_results: int = 7) -> str:
    """Conducts a general web text search and retrieves information from the internet in response to user queries.

    This function is best used when the user's query is seeking broad information available on various websites. It
    is ideal for queries that require diverse perspectives or data from multiple sources, not limited to current
    events or specific topics. Use this function for general inquiries, research, or when the user's query is not
    explicitly news-related. It fetches relevant data from the internet in response to user queries, enhancing GPT's
    knowledge base.

    :param query: The search query string for finding relevant web text results.
    :param num_results: The maximum number of URLs to return. Defaults to 3 if not provided. (optional)

    :return: A JSON-formatted string. Each element in the JSON represents the result of scraping a single URL,
    containing either the scraped content or an error message.
    """
    urls = ddg.text_search(query, int(num_results))
    scraped_data = scraper.scrape_multiple_websites(urls)
    return scraped_data


def news_search(query, num_results=3):
    """Conducts a search for news articles and retrieves information from the internet in response to user queries.

    This function is specifically designed for queries that require up-to-date information from news sources. It
    should be employed when the user is looking for recent developments, news stories, or when the query is
    explicitly about current events, politics, or other timely topics. Opt for this function for news-related
    inquiries or when the query demands the latest information from reliable news outlets. It fetches relevant data
    from the internet in response to user queries, enhancing GPT's knowledge base.

    :param query: The search query string for finding relevant news articles.
    :param num_results: The maximum number of news article URLs to return. Defaults to 3 if not provided.

    :return: A JSON-formatted string. Each element in the JSON represents the result of scraping a single URL,
    containing either the scraped content or an error message.
    """
    urls = ddg.news_search(query, int(num_results)) # DuckDuckGo search
    #urls = gs.google_search(query, int(num_results))  # Google search
    scraped_data = scraper.scrape_multiple_websites(urls)
    return scraped_data


def webpage_scraper(url):
    """Scrape a webpage for its text content.

    This function enables web scraping for GPT models. It fetches the text content of a webpage and returns it to the
    model. Use this function if user queries include a URL.

    :param url: The URL of the webpage to scrape.
    :return: A JSON-formatted string containing the scraped text. In case of an error, it returns a JSON-formatted string with an error message.
    """
    try:
        result = scraper.scrape_website(url)
        return result
    except Exception as e:
        return json.dumps({"error": str(e)})
