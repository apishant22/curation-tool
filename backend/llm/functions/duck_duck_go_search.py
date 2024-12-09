from duckduckgo_search import DDGS
import json


class DuckDuckGoSearchManager:
    """
    A class to perform various types of web searches using DuckDuckGo.
    """

    def text_search(self, query, num_results=3) -> list:
        """
        Performs a DuckDuckGo text search and returns a list of URLs.

        Parameters:
        - query (str): The search query string for finding relevant text results.
        - num_results (int): The maximum number of URLs to return. Defaults to 3.

        Returns:
        - list of str: A list containing the URLs of the search results. Each URL in the list corresponds to a page that matches the search query.
        """
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=num_results)
            urls = [result['href'] for result in results]
            return urls

    def news_search(self, query, num_results=3) -> list:
        """
        Performs a DuckDuckGo news search and returns a list of news article URLs.

        Parameters:
        - query (str): The search query string for finding relevant news articles.
        - num_results (int): The maximum number of news article URLs to return. Defaults to 3.

        Returns:
        - list of str: A list containing the URLs of the news articles. Each URL in the list corresponds to a news article that matches the search query.
        """
        with DDGS() as ddgs:
            results = ddgs.news(query, max_results=num_results)
            urls = [result['url'] for result in results]
            return urls


if __name__ == "__main__":
    ddg_search = DuckDuckGoSearchManager()

    # Example usage:
    text_results = ddg_search.text_search("Is there any possibility of rain in Berlin today?", 3)
    print("Text Search Results:", json.dumps(text_results, indent=2, sort_keys=True))

    news_results = ddg_search.news_search("Is there any possibility of rain in Berlin today?", 3)
    print("News Search Results:", json.dumps(news_results, indent=2, sort_keys=True))
