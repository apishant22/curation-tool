import os
from dotenv import load_dotenv

# Load environment variables from azure.env
load_dotenv('azure.env')

db_server = os.getenv('DB_SERVER')
db_database = os.getenv('DB_DATABASE')
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_encrypt = os.getenv('DB_ENCRYPT', 'yes').lower()  # Ensure it’s 'yes' or 'no'
db_trust_cert = os.getenv('DB_TRUST_SERVER_CERTIFICATE', 'no').lower()
db_conn_timeout = os.getenv('DB_CONNECTION_TIMEOUT', '60')

# Constructing the database URL
database_url = (
    f"mssql+pyodbc://{db_user}:{db_password}@{db_server}/{db_database}"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    f"&Encrypt={db_encrypt}"
    f"&TrustServerCertificate={db_trust_cert}"
    f"&Connection Timeout={db_conn_timeout}"
)
# Utility Function
def get_database_url():
    return database_url
