import hashlib
import json
import unittest
from datetime import datetime, timezone
from io import BytesIO
from unittest.mock import patch

from nba_totals_research.balldontlie_games_adapter import (
    fetch_games, select_event, BASE_URL
)


class FakeResponse:
    status = 200
    headers = {"Date": "Thu, 05 Nov 2026 12:00:00 GMT"}
    def __init__(self, raw):
        self.stream = BytesIO(raw)
    def read(self, limit):
        return self.stream.read(limit)
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.data = {"data": [
            {"id": 123, "status": "Final", "period": 4,
             "home_team_score": 101, "visitor_team_score": 98},
            {"id": 124, "status": "2026-11-06T00:00:00", "period": 0,
             "home_team_score": 0, "visitor_team_score": 0},
        ], "meta": {"next_cursor": None}}
        self.raw = json.dumps(self.data, separators=(",", ":")).encode()
        self.request_headers = {}
        def open_fake(req, timeout):
            self.request_headers = dict(req.header_items())
            self.assertTrue(req.full_url.startswith(BASE_URL + "?"))
            self.assertEqual(timeout, 15)
            return FakeResponse(self.raw)
        self.opener = open_fake
        self.clock = lambda: datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc)

    def fetch(self):
        return fetch_games(day="2026-11-05", api_key="synthetic-secret-only",
                           opener=self.opener, clock=self.clock)

    def test_raw_bytes_are_unchanged_and_no_credentials_in_output(self):
        response = self.fetch()
        self.assertEqual(response.raw, self.raw)
        self.assertEqual(response.source_sha256, hashlib.sha256(self.raw).hexdigest())
        self.assertNotIn("synthetic-secret-only", repr(response))
        self.assertEqual(select_event(response, "123")[1], "FINAL")
        self.assertEqual(select_event(response, "124")[1], "UNKNOWN_OR_LIVE")

    def test_missing_key_fails_before_any_http(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(ValueError):
                fetch_games(day="2026-11-05", opener=self.opener, clock=self.clock)
        self.assertEqual(self.request_headers, {})

    def test_duplicate_event_rejected(self):
        self.data["data"].append(dict(self.data["data"][0]))
        self.raw = json.dumps(self.data).encode()
        with self.assertRaises(ValueError):
            select_event(self.fetch(), "123")

    def test_pagination_not_silently_dropped(self):
        self.data["meta"]["next_cursor"] = 25
        self.raw = json.dumps(self.data).encode()
        with self.assertRaises(ValueError):
            self.fetch()

    def test_invalid_date_refused(self):
        with self.assertRaises(ValueError):
            fetch_games(day="not-a-date", api_key="x", opener=self.opener)


if __name__ == "__main__":
    unittest.main()
