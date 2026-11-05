import unittest
from scripts.verify_polymarket_chain import check

class EvidenceGateTests(unittest.TestCase):
    def test_empty_is_blocked(self):
        report = check({})
        self.assertEqual(report["status"], "BLOCKED")
        self.assertFalse(report["evaluation_eligible"])

    def test_unverified_historical_quote_is_blocked(self):
        evidence = {
            "forecast": {"source_game_id": "401909922", "home": "det", "away": "phi",
                "scheduled_tipoff": "2026-11-05T00:00:00Z",
                "generated_at_host_utc": "2026-11-03T09:39:08Z",
                "expected_total": 220.4, "record_sha256": "candidate"},
            "market": {"venue": "polymarket.us", "event_id": "candidate",
                "market_id": "candidate", "game_id": "401909922", "line": 219.5,
                "side": "OVER", "period": "FULL_GAME_INCLUDING_OT",
                "captured_at_utc": "2026-11-05T01:00:00Z",
                "source_url": "https://polymarket.us", "raw_payload_sha256": "candidate",
                "bid": 0.5, "ask": 0.52, "resolution_rules": "candidate"},
            "result": {"source_game_id": "401909922", "status": "IN_PROGRESS",
                "home_score": 50, "away_score": 50,
                "source_url": "https://www.nba.com", "captured_at_utc": "2026-11-05T01:30:00Z"},
        }
        report = check(evidence)
        self.assertEqual(report["status"], "BLOCKED")
        self.assertTrue(any("before tipoff" in issue for issue in report["issues"]))
        self.assertTrue(any("FINAL" in issue for issue in report["issues"]))
        self.assertFalse(report["evaluation_eligible"])

    def test_naive_time_is_rejected(self):
        self.assertEqual(check({
            "forecast": {"source_game_id": "a", "home": "h", "away": "a",
                "scheduled_tipoff": "2026-11-05T00:00:00",
                "generated_at_host_utc": "2026-11-03T09:39:08Z",
                "expected_total": 220.4, "record_sha256": "x"},
            "market": {"venue": "polymarket.us", "event_id": "x", "market_id": "x",
                "line": 219.5, "side": "OVER", "captured_at_utc": "2026-11-04T23:00:00Z",
                "source_url": "x", "raw_payload_sha256": "x", "bid": 0.4,
                "ask": 0.5, "resolution_rules": "x"},
            "result": {"source_game_id": "a", "status": "FINAL", "home_score": 110,
                "away_score": 111, "source_url": "x",
                "captured_at_utc": "2026-11-05T03:00:00Z"}
        })["status"], "BLOCKED")

if __name__ == "__main__":
    unittest.main()
