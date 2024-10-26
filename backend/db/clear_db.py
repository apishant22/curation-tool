from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os
from dotenv import load_dotenv
from backend.azure_config import get_database_url

base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, '..', 'db', 'azure.env')
load_dotenv(env_path)

engine = create_engine(
    get_database_url(),
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"timeout": 60}
)
Session = sessionmaker(bind=engine)

def clear_all_tables():
    session = Session()
    metadata = MetaData()

    try:
        metadata.reflect(bind=engine)

        for table in metadata.sorted_tables:
            session.execute(table.delete())
            print(f"Cleared table: {table.name}")

        session.commit()
        print("All tables have been successfully cleared.")

    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error clearing tables: {e}")

    finally:
        session.close()

# Example usage
if __name__ == "__main__":
    clear_all_tables()
