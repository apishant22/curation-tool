import os
import sys
import duckduckgo_search

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from backend.llm.core.azure_functions import AzureOpenAIFunctions
import backend.llm.config as config
import backend.llm.functions.web_browsing as browser
from backend.db import db_helper
import backend.llm.llmNew as llmNew
from backend.db import db_helper

assistant = AzureOpenAIFunctions(
    azure_openai_endpoint=config.azure_openai_endpoint,
    azure_openai_key_key=config.azure_openai_key_key,
    azure_api_version=config.azure_api_version,
    model=config.azure_openai_deployment_name,
    functions=[
        browser.text_search,
        browser.news_search,
        browser.webpage_scraper
    ]
)

def load_prompt(prompt):
    prompt_path = os.path.join(os.path.dirname(__file__), prompt)
    try:
        with open(prompt_path, "r", encoding='utf-8') as file:
            prompt = file.read()
        return prompt
    except FileNotFoundError:
        return "Default prompt text or handle the error appropriately."
    except UnicodeError as e:
        print(f"Encoding error: {e}")
        return "Error reading prompt file due to encoding issues."
    
def request(author_name, prompt_file):
    prompt_path = os.path.join(os.path.dirname(__file__), prompt_file)
    author = db_helper.get_author_details_from_db(author_name)
    if author is None:
        print("Author not found in the database.")
        return {"reply": "Author not found in the database."}
    
    conversation = llmNew.Conversation(conversation=[])
    system_message = llmNew.Message(role='system', content=load_prompt(prompt_file))
    conversation.conversation.insert(0, system_message)
    prompt_message = llmNew.Message(role='user', content=str(author))
    conversation.conversation.insert(1, prompt_message)
    conversation_dict = [message.model_dump() for message in conversation.conversation]
    
    try:
        response = assistant.ask(conversation_dict)
        summary = response.choices[0].message.content
        with open(prompt_path + '_summary.txt', 'w', encoding='utf-8') as file:
            file.write(summary)
        llmNew.log(response)
        return {"reply": summary}
    except (duckduckgo_search.exceptions.DuckDuckGoSearchException, UnicodeError) as e:
        print(f"Error occurred: {e}")
        return {"reply": f"Operation failed: {str(e)}"}

# Test the function
request('Cigdem Sengul', "few_shot_new_enhanced.txt")