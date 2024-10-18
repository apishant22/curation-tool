import os
import requests
import base64
from backend.db import db_helper


def request(orcid_id):
    reply = ""
    #db_helper.update_researcher_summary(orcid_id, "test data")

    # Configuration
    API_KEY = ""   #"c5bbc229e53e449f96378cec96bd1f78"
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
                        "text": "You are an AI assistant that helps people find information."
                        # Replace this text with the actual instructions for the LLM
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Details of the person in question: " + db_helper.get_author_details_from_db(orcid_id)
                    }
                ]
            }
        ],
        "temperature": 0.7,  # How likely the model is to write SENTENCES that are innovative/unexpected
        "top_p": 0.95,  # How likely the model is to choose WORDS that are innovative/unexpected
        "max_tokens": 800  # The maximum amount of tokens used in the output needs to be much higher
    }

    ENDPOINT = """https://proj-gpt-dev.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-
    version=2024-02-15-preview"""

    # Send request
    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
    except requests.RequestException as e:
        raise SystemExit(f"Failed to make the request. Error: {e}")

    # Handle the response as needed (e.g., print or process)
    reply = response.json()
    db_helper.update_researcher_summary(orcid_id, reply)
