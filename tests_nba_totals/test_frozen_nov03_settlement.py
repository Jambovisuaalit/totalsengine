"""Offline regression for genuine 14-forecast frozen cohort and settlement controls."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from nba_totals_research.frozen_nov03_settlement import load_frozen, run

CUTOFF=datetime(2026,11,3,11,54,tzinfo=timezone.utc)
FIRST=datetime(2026,11,5,0,0,tzinfo=timezone.utc)

class FrozenCohortTests(unittest.TestCase):
    def test_exact_14_original_records_and_pregame_timestamp(self):
        rows, proof=load_frozen()
        self.assertEqual(len(rows),14)
        self.assertEqual(proof["n_original"],14)
        self.assertEqual(proof["predictions_sha256"],
                         "fca6fc731ca185ffd62c01fa90c7205be8a7a1d3b1bcafc7ffd53952f1745ccf")
        self.assertEqual(rows[0]["source_game_id"],"401909922")
        self.assertEqual(rows[-1]["source_game_id"],"401909935")

    def test_cannot_fetch_or_score_before_first_final_window(self):
        def no_fetch(*args):
            raise AssertionError("MUST NOT fetch results before six-hour delay")
        result=run(now=CUTOFF,fetch=no_fetch)
        self.assertEqual(result["n_input_forecasts"],14)
        self.assertEqual(result["n_unique_forecasts"],14)
        self.assertEqual(result["n_scored"],0)
        self.assertEqual(result["n_pending"],14)
        self.assertIsNone(result["mae"])
        self.assertIsNone(result["rmse"])
        self.assertFalse(result["evaluation_eligible"])
        self.assertFalse(result["worm_verified"])
        self.assertEqual(result["report_type"],"PROVISIONAL_FORWARD_PAPER_ONLY")

    def test_still_pending_when_final_missing(self):
        def fetch(day):
            return b'{"events":[]}'
        result=run(now=FIRST+timedelta(hours=9),fetch=fetch)
        self.assertEqual(result["n_scored"],0)
        self.assertEqual(result["n_pending"],14)
        self.assertIsNone(result["mae"])

    def test_single_exact_final_scores_without_counting_others(self):
        # No invented real result: deterministic synthetic ESPN-shaped fixture
        # validates the mechanical matching and provisional reporting only.
        def fetch(day):
            return json.dumps({"events":[{
                "id":"401909922","date":"2026-11-05T00:00:00Z",
                "status":{"type":{"completed":True,"state":"post"}},
                "competitions":[{"competitors":[
                    {"homeAway":"away","team":{"abbreviation":"PHI"},"score":"102"},
                    {"homeAway":"home","team":{"abbreviation":"DET"},"score":"113"}
                ]}]
            }]}).encode() if str(day)=="2026-11-05" else b'{"events":[]}'
        result=run(now=FIRST+timedelta(hours=9),fetch=fetch)
        self.assertEqual(result["n_scored"],1)
        self.assertEqual(result["n_pending"],13)
        self.assertAlmostEqual(result["mae"],5.4)
        self.assertAlmostEqual(result["rmse"],5.4)
        self.assertEqual(result["scored_rows"][0]["source_game_id"],"401909922")
        self.assertFalse(result["evaluation_eligible"])
        self.assertEqual(result["independently_verified_count"],0)

    def test_changed_tipoff_blocks_match_and_metrics(self):
        def fetch(day):
            return json.dumps({"events":[{
                "id":"401909922","date":"2026-11-05T00:30:00Z",
                "status":{"type":{"completed":True,"state":"post"}},
                "competitions":[{"competitors":[
                    {"homeAway":"away","team":{"abbreviation":"PHI"},"score":"101"},
                    {"homeAway":"home","team":{"abbreviation":"DET"},"score":"101"}
                ]}]
            }]}).encode() if str(day)=="2026-11-05" else b'{"events":[]}'
        result=run(now=FIRST+timedelta(hours=9),fetch=fetch)
        self.assertEqual(result["n_scored"],0)
        self.assertEqual(result["n_identity_mismatches"],1)
        self.assertIsNone(result["rmse"])

    def test_tampering_frozen_bytes_fails(self):
        from nba_totals_research.frozen_nov03_settlement import ROOT
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp)
            for name in ("manifest.json","timestamp-receipt.json","predictions.jsonl"):
                (d/name).write_bytes((ROOT/name).read_bytes())
            (d/"predictions.jsonl").write_bytes((d/"predictions.jsonl").read_bytes()+b" ")
            with self.assertRaisesRegex(ValueError,"SHA-256"):
                load_frozen(d)

if __name__=="__main__":
    unittest.main()
