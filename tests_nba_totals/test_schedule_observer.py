"""Mocked external schedule observation; never calls network."""
import io
import unittest
from datetime import date
from unittest.mock import patch

from nba_totals_research.schedule_observer import observe_espn_nba_schedule


class FakeResponse:
    status = 200
    headers = {}
    def __init__(self, url, data):
        self.url, self.data = url, data
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def geturl(self):
        return self.url
    def read(self, size):
        return self.data[:size]


class FakeOpener:
    def __init__(self, data, redirect=False):
        self.data, self.redirect = data, redirect
    def open(self, request, timeout):
        url = request.full_url + ("/redirect" if self.redirect else "")
        assert request.get_method() == "GET"
        return FakeResponse(url, self.data)


class ScheduleObserverTests(unittest.TestCase):
    def test_observation_is_never_authority(self):
        with patch("nba_totals_research.schedule_observer.build_opener",
                   return_value=FakeOpener(b'{"events":[]}')):
            result = observe_espn_nba_schedule(date(2026, 11, 2))
        self.assertEqual(result.events, 0)
        self.assertFalse(result.independently_attested)
        self.assertFalse(result.bookmaker_quote_verified)
        self.assertFalse(result.publication_allowed)

    def test_redirect_rejected(self):
        with patch("nba_totals_research.schedule_observer.build_opener",
                   return_value=FakeOpener(b'{"events":[]}', redirect=True)):
            with self.assertRaises(ValueError):
                observe_espn_nba_schedule(date(2026, 11, 2))

    def test_bad_schema_rejected(self):
        with patch("nba_totals_research.schedule_observer.build_opener",
                   return_value=FakeOpener(b'{"unexpected":true}')):
            with self.assertRaises(ValueError):
                observe_espn_nba_schedule(date(2026, 11, 2))

    def test_invalid_timeout_rejected(self):
        with self.assertRaises(ValueError):
            observe_espn_nba_schedule(date(2026, 11, 2), timeout=0)
