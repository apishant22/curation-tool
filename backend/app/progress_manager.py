import time


class ProgressManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            print("[DEBUG] Creating a new instance of ProgressManager")
            cls._instance = super(ProgressManager, cls).__new__(cls, *args, **kwargs)
            cls._instance.progress_store = {}
        return cls._instance

    def update_progress(self, profile_link, status):
        print(f"[DEBUG] Updating progress for profile_link '{profile_link}' to status: '{status}'")
        self.progress_store[profile_link] = status
        print(f"[DEBUG] Current progress store: {self.progress_store}")

    def get_progress(self, profile_link, max_retries=10, retry_delay=0.5):
        print(f"[DEBUG] Retrieving progress for profile_link '{profile_link}' with max_retries={max_retries} and retry_delay={retry_delay}")
        retries = 0
        while retries < max_retries:
            progress = self.progress_store.get(profile_link)
            if progress:
                print(f"[DEBUG] Progress found for profile_link '{profile_link}': {progress}")
                return progress
            print(f"[DEBUG] Progress not available for '{profile_link}'. Retrying... ({retries + 1}/{max_retries})")
            time.sleep(retry_delay)
            retries += 1

        print(f"[DEBUG] Progress still not available for profile_link '{profile_link}' after {max_retries} retries.")
        return "No progress available."

    def clear_progress(self, profile_link):
        print(f"[DEBUG] Clearing progress for profile_link '{profile_link}'")
        if profile_link in self.progress_store:
            del self.progress_store[profile_link]
            print(f"[DEBUG] Progress for profile_link '{profile_link}' cleared.")
        else:
            print(f"[DEBUG] No progress found for profile_link '{profile_link}' to clear.")
        print(f"[DEBUG] Current progress store: {self.progress_store}")