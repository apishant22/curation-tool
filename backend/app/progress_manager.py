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

    def get_progress(self, profile_link):
        return self.progress_store.get(profile_link, "No progress available.")

    def clear_progress(self, profile_link):
        if profile_link in self.progress_store:
            del self.progress_store[profile_link]
