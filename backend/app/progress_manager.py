import sqlite3
import time
from datetime import datetime

class ProgressManager:
    _instance = None
    _db_path = "progress.db"

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ProgressManager, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialize_db()
        return cls._instance

    def _initialize_db(self):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS progress (
                profile_link TEXT PRIMARY KEY,
                status TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def update_progress(self, profile_link, status):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO progress (profile_link, status, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(profile_link) DO UPDATE SET
                status=excluded.status,
                updated_at=excluded.updated_at
        """, (profile_link, status, datetime.now()))
        conn.commit()
        conn.close()
        print(f"[DEBUG] Updated progress for '{profile_link}' to '{status}'")

    def get_progress(self, profile_link, max_retries=10, retry_delay=0.5):
        retries = 0
        while retries < max_retries:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM progress WHERE profile_link = ?", (profile_link,))
            result = cursor.fetchone()
            conn.close()

            if result:
                print(f"[DEBUG] Progress for '{profile_link}': {result[0]}")
                return result[0]

            print(f"[DEBUG] Progress not found for '{profile_link}'. Retrying... ({retries + 1}/{max_retries})")
            time.sleep(retry_delay)
            retries += 1

        print(f"[DEBUG] Progress still not found for '{profile_link}' after {max_retries} retries.")
        return "No progress available."

    def clear_progress(self, profile_link):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM progress WHERE profile_link = ?", (profile_link,))
        conn.commit()
        conn.close()
        print(f"[DEBUG] Cleared progress for '{profile_link}'")