from pydantic import BaseModel
from typing import List

from core.azure_functions import AzureOpenAIFunctions
import config
import functions.web_browsing as browser


# THIS NEEDS TO BE INTEGRATED WITH OUR LLM.PY

# -- The message schema for the assistant
class Message(BaseModel):
    role: str
    content: str


# -- The conversation schema for the assistant
class Conversation(BaseModel):
    conversation: List[Message]

system_prompt = """You are an AI assistant with access to a websearch function.

The websearch function empowers you for real-time web search and information retrieval, particularly for current and 
relevant data from the internet in response to user queries, especially when such information is beyond your training 
data or when up-to-date information is essential. Always include the source URL for information fetched from the web.

All your responses should be in a human-readable format.
"""

# Initialize the assistant (GPT Model) with the functions
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

async def endpoint(conversation_id: str, conversation: Conversation):
    system_message = Message(role='system', content=system_prompt)
    conversation.conversation.insert(0, system_message)
    conversation_dict = [message.model_dump() for message in conversation.conversation]
    response = assistant.ask(conversation_dict)
    return {"id": conversation_id, "reply": response.choices[0].message.content}
