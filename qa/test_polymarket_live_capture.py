import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from nba_totals_research.polymarket_live_capture import canonical, digest, preflight, capture


class PolymarketCaptureTests(unittest.TestCase):
    def test_deterministic_receipt_digest(self):
        self.assertEqual(digest(canonical({"b": 1, "a": 2})),
                         digest(canonical({"a": 2, "b": 1})))

    def test_rejects_naive_clock(self):
        with self.assertRaises(ValueError):
            preflight(tipoff=datetime.now(timezone.utc) + timedelta(hours=1),
                      now=datetime.now())

    def test_rejects_late_capture(self):
        now = datetime.now(timezone.utc)
        with self.assertRaisesRegex(ValueError, "too late"):
            preflight(tipoff=now + timedelta(seconds=70), now=now)

    def test_accepts_future_capture_window(self):
        now = datetime.now(timezone.utc)
        preflight(tipoff=now + timedelta(minutes=5), now=now)

    def test_rejects_missing_research_flags(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaisesRegex(ValueError, "fail-closed"):
                capture("nba-test", "tsc-nba-test", None)

    def test_rejects_unsupported_slugs(self):
        with patch.dict("os.environ", {"HALTED": "1", "PUBLICATION_ALLOWED": "false"}):
            with self.assertRaisesRegex(ValueError, "NBA event"):
                capture("../invalid", "../invalid", None)


if __name__ == "__main__":
    unittest.main()
