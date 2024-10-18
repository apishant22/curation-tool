import os
from dotenv import load_dotenv

# Load environment variables from azure.env
load_dotenv('azure.env')

# Azure SQL Database Configuration
DB_SERVER = os.getenv('DB_SERVER')
DB_DATABASE = os.getenv('DB_DATABASE')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_ENCRYPT = os.getenv('DB_ENCRYPT', 'True')
DB_TRUST_SERVER_CERTIFICATE = os.getenv('DB_TRUST_SERVER_CERTIFICATE', 'False')
DB_MULTIPLE_ACTIVE_RESULT_SETS = os.getenv('DB_MULTIPLE_ACTIVE_RESULT_SETS', 'False')
DB_CONNECTION_TIMEOUT = os.getenv('DB_CONNECTION_TIMEOUT', '30')

# Example usage for constructing the database connection string
DATABASE_URL = (
    f'mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_DATABASE}'
    '?driver=ODBC+Driver+17+for+SQL+Server'
    f'&Encrypt={DB_ENCRYPT}'
    f'&TrustServerCertificate={DB_TRUST_SERVER_CERTIFICATE}'
    '&MultipleActiveResultSets=False'
    f'&Connection Timeout={DB_CONNECTION_TIMEOUT}'
)

# Utility Function
def get_database_url():
    return DATABASE_URL
