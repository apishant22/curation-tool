from gender_guesser.detector import Detector


class SearchScrapeContext:
    def __init__(self, filter_gender=False):
        self.filter_gender = filter_gender
        self.gender_detector = Detector()

    def should_filter_gender(self):
        return self.filter_gender

    def get_gender(self, name):
        return self.gender_detector.get_gender(name.split()[0])

    def set_filter_gender(self, filter_gender):
        self.filter_gender = filter_gender
        pass
