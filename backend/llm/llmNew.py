import os
from datetime import datetime
from pydantic import BaseModel
from typing import List

from backend.llm.core.azure_functions import AzureOpenAIFunctions
import backend.llm.config as config
import backend.llm.functions.web_browsing as browser

import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from backend.db import db_helper

# -- The message schema for the assistant
class Message(BaseModel):
    role: str
    content: str


# -- The conversation schema for the assistant
class Conversation(BaseModel):
    conversation: List[Message]

# Initialize the assistant (GPT Model) with the functions
assistant = AzureOpenAIFunctions(
    azure_openai_endpoint=config.azure_openai_endpoint,
    azure_openai_key_key=config.azure_openai_key_key,
    azure_api_version=config.azure_api_version,
    model=config.azure_openai_deployment_name,
    functions=[
        browser.text_search,
        browser.news_search,
        browser.images_search,
        browser.webpage_scraper
    ]
)

def log(response):
    try:
        with open("logfile.txt", 'a') as file:
            file.write("Response recieved " + datetime.now().strftime('%d-%m-%Y %H:%M:%S') + '\n')
            file.write(str(response) + '\n')
            file.write("=======================" + '\n')
        print("Response logged successfully.")
    except Exception as e:
        print(f"An error occurred while logging the response: {e}")
    
def load_prompt(prompt):
    prompt_path = os.path.join(os.path.dirname(__file__), prompt)
    try:
        with open(prompt_path, "r") as file:
            prompt = file.read()
        return prompt
    except FileNotFoundError:
        print(f"Error: The file 'prompt.txt' was not found at {prompt_path}")
        return "Default prompt text or handle the error appropriately."


def request(orcid_id):
    subject = db_helper.get_author_details_from_db(orcid_id)
    name = subject['Name']
    conversation = Conversation(conversation=[])
    system_message = Message(role='system', content=load_prompt('system_prompt.txt'))
    conversation.conversation.insert(0, system_message)
    prompt_message = Message(role='user', content=name)
    conversation.conversation.insert(1, prompt_message)
    conversation_dict = [message.model_dump() for message in conversation.conversation]
    response = assistant.ask(conversation_dict)
    summary = response.choices[0].message.content
    log(response)
    #RED = '\033[91m'
    #GREEN = '\033[92m'
    #ENDC = '\033[0m'  # Resets the color to default
    #print(f"{RED}\nQuery: {prompt_message} {ENDC}\n")
    #print(f"{GREEN}Reply: {summary}{ENDC}\n")
    #print(f"{RED}\nOutput: {response} {ENDC}\n")
    #return {"reply": response.choices[0].message.content}
    db_helper.update_researcher_summary(orcid_id, summary)
    #print(f"{RED}{db_helper.get_researcher_summary(orcid_id, session=None)}")


#request("0000-0002-1684-1539")
