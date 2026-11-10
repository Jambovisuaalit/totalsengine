import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from odds_ingest.ingest import normalize, parse

BASE = {"provider":"manual","event_id":"123","sport":"basketball","market":"total",
        "selection":"over","line":"220.5","decimal_odds":"1.91",
        "observed_at_utc":"2026-11-10T14:00:00Z"}

class OddsIngestTests(unittest.TestCase):
    def test_json_csv_equivalence(self):
        import json
        import csv
        import io
        b = io.StringIO()
        w = csv.DictWriter(b, fieldnames=BASE.keys())
        w.writeheader()
        w.writerow(BASE)
        a = parse(json.dumps([BASE]).encode(), "x.json")
        c = parse(b.getvalue().encode(), "x.csv")
        self.assertEqual(a[0]["decimal_odds"], c[0]["decimal_odds"])
        self.assertEqual(a[0]["quote_sha256"], c[0]["quote_sha256"])

    def test_reject_missing_field(self):
        with self.assertRaisesRegex(ValueError, "missing event_id"):
            normalize({k:v for k,v in BASE.items() if k != "event_id"})

    def test_reject_invalid_odds(self):
        for v in ["1", "NaN", "-2", "Infinity"]:
            with self.subTest(v=v), self.assertRaises(ValueError):
                normalize({**BASE, "decimal_odds":v})

    def test_timezone_required(self):
        with self.assertRaisesRegex(ValueError, "timezone required"):
            normalize({**BASE, "observed_at_utc":"2026-11-10T14:00:00"})

    def test_utc_normalization(self):
        x = normalize({**BASE, "observed_at_utc":"2026-11-10T16:00:00+02:00"})
        self.assertEqual(x["observed_at_utc"], BASE["observed_at_utc"])

    def test_negative_stake(self):
        with self.assertRaises(ValueError):
            normalize({**BASE, "max_stake":"-1"})

if __name__ == "__main__":
    unittest.main()
