import time


class ProgressManager:
    _instance = None
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ProgressManager, cls).__new__(cls, *args, **kwargs)
            cls._instance.progress_store = {}
        return cls._instance

    def update_progress(self, profile_link, status):
        print(f"Updating progress for {profile_link}: {status}")
        self.progress_store[profile_link] = status

    def get_progress(self, profile_link, max_retries=10, retry_delay=0.5):
        retries = 5
        while retries < max_retries:
            progress = self.progress_store.get(profile_link)
            if progress:
                print(f"Progress found for profile_link {profile_link}: {progress}")
                return progress
            print(f"Progress not available for {profile_link}. Retrying... ({retries + 1}/{max_retries})")
            time.sleep(retry_delay)
            retries += 1

        print(f"Progress still not available for {profile_link} after {max_retries} retries.")
        return "No progress available."

    def clear_progress(self, profile_link):
        if profile_link in self.progress_store:
            del self.progress_store[profile_link]
