import os
from datetime import datetime
import json

import requests
import base64
from backend.db import db_helper

def request(orcid_id):
    reply = ""

    # Configuration
    API_KEY = "c5bbc229e53e449f96378cec96bd1f78"
    # IMAGE_PATH = "YOUR_IMAGE_PATH"
    # encoded_image = base64.b64encode(open(IMAGE_PATH, 'rb').read()).decode('ascii')
    headers = {
        "Content-Type": "application/json",
        "api-key": API_KEY,
    }

    # Payload for the request
    payload = {
        "messages": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        #"text": "You are a professional writer that summarises the life and works of academic researchers from their published papers and their education and employment histories. The summaries are intended to be read by anyone on a site similar to Wikiepdia, and to not require specialist knowledge. The summary must only contain information that is provided in the prompt. Ignore any empty fields, do not mention anything about them in the summary. The summary should be written in a neutral tone and should not contain any personal opinions or biases. The summary should be approximately 400 words long."
                        "text": load_prompt()
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Details of the person in question: " + str(db_helper.get_author_details_from_db(orcid_id))
                    }
                ]
            }
        ],
        "temperature": 0.7,  # How likely the model is to write SENTENCES that are innovative/unexpected
        "top_p": 0.95,  # How likely the model is to choose WORDS that are innovative/unexpected
        "max_tokens": 800  # The maximum amount of tokens used in the output needs to be much higher
    }

    ENDPOINT = "https://proj-gpt-dev.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview"

    # Send request
    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
    except requests.RequestException as e:
        raise SystemExit(f"Failed to make the request. Error: {e}")

    # Handle the response as needed (e.g., print or process)
    reply = json.dumps(response.json())
    print(reply)
    log(reply)
    summary = get_summary_text(reply)
    db_helper.update_researcher_summary(orcid_id, summary)

def log(response):
    try:
        with open("logfile.txt", 'a') as file:
            file.write("Response recieved " + datetime.now().strftime('%d-%m-%Y %H:%M:%S') + '\n')
            file.write(str(response) + '\n')
            file.write("=======================" + '\n')
        print("Response logged successfully.")
    except Exception as e:
        print(f"An error occurred while logging the response: {e}")

def get_summary_text(reply):
    try:
        json_reply = json.loads(reply)
        summary = json_reply["choices"][0]["message"]["content"]
        return summary
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"An error occurred while extracting summary text: {e}")
        return "Error: Unable to extract summary text."
    
def load_prompt():
    prompt_path = os.path.join(os.path.dirname(__file__), "prompt.txt")
    try:
        with open(prompt_path, "r") as file:
            prompt = file.read()
        return prompt
    except FileNotFoundError:
        print(f"Error: The file 'prompt.txt' was not found at {prompt_path}")
        return "Default prompt text or handle the error appropriately."


# request("0000-0002-1684-1539")
