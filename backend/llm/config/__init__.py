import os
from dotenv import load_dotenv

# load_dotenv('backend\\llm\\llm.env')

env_path = os.path.join('backend', 'llm', 'llm.env')
load_dotenv(env_path)

azure_openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
azure_openai_key_key = os.getenv('AZURE_OPENAI_KEY')
azure_api_version = os.getenv('AZURE_API_VERSION', '2023-07-01-preview')
azure_openai_deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
#serpapi_key = os.getenv("SERPAPI_KEY")