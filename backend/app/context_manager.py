from backend.app.search_scrape_context import SearchScrapeContext

search_context = None

def get_request_context(filter_gender=None):
    global search_context
    if search_context is None:
        search_context = SearchScrapeContext(filter_gender=filter_gender or False)
    elif filter_gender is not None:
        search_context.set_filter_gender(filter_gender)
    return search_context
