import json
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from nba_totals_research.forward_paper_test import capture_prediction, settle_prediction, audit_pair

NOW = datetime(2026, 11, 2, 18, tzinfo=timezone.utc)
SHA = "a" * 64

class TestForwardPaperTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.args = dict(game_id="nba-game-1", model_version="v1",
                         scheduled_tipoff=(NOW + timedelta(hours=2)).isoformat(),
                         feature_cutoff=(NOW - timedelta(minutes=5)).isoformat(),
                         input_sha256=SHA, model_sha256=SHA,
                         expected_total="221.5",
                         generated_at=(NOW - timedelta(minutes=1)).isoformat(),
                         clock=lambda: NOW)

    def test_write_once_and_not_verified(self):
        result = capture_prediction(self.root, **self.args)
        self.assertFalse(result["external_timestamp_verified"])
        with self.assertRaises(FileExistsError):
            capture_prediction(self.root, **self.args)

    def test_reject_late_prediction(self):
        self.args["scheduled_tipoff"] = NOW.isoformat()
        with self.assertRaises(ValueError):
            capture_prediction(self.root, **self.args)

    def test_reject_future_cutoff(self):
        self.args["feature_cutoff"] = (NOW + timedelta(minutes=2)).isoformat()
        with self.assertRaises(ValueError):
            capture_prediction(self.root, **self.args)

    def test_settlement_does_not_modify_prediction(self):
        captured = capture_prediction(self.root, **self.args)
        with self.assertRaises(ValueError):
            settle_prediction(self.root, game_id="nba-game-1", model_version="v1",
                              score_home=110, score_away=112, result_source_sha256=SHA,
                              result_observed_at=NOW.isoformat(), clock=lambda: NOW)
        later = NOW + timedelta(hours=5)
        settled = settle_prediction(self.root, game_id="nba-game-1", model_version="v1",
                                    score_home=110, score_away=112, result_source_sha256=SHA,
                                    result_observed_at=later.isoformat(), clock=lambda: later)
        self.assertEqual(settled["actual_total"], 222)
        report = audit_pair(self.root, game_id="nba-game-1", model_version="v1")
        self.assertEqual(report["absolute_error"], "0.5")
        self.assertFalse(report["evaluation_eligible"])
        self.assertEqual(captured["prediction_sha256"], report["prediction_sha256"])
        with self.assertRaises(FileExistsError):
            settle_prediction(self.root, game_id="nba-game-1", model_version="v1",
                              score_home=110, score_away=112, result_source_sha256=SHA,
                              result_observed_at=later.isoformat(), clock=lambda: later)

    def test_detect_prediction_tampering(self):
        capture_prediction(self.root, **self.args)
        later = NOW + timedelta(hours=5)
        settle_prediction(self.root, game_id="nba-game-1", model_version="v1",
                          score_home=110, score_away=112, result_source_sha256=SHA,
                          result_observed_at=later.isoformat(), clock=lambda: later)
        path = self.root / "predictions" / "nba-game-1--v1.json"
        item = json.loads(path.read_text())
        item["expected_total"] = "100.0"
        path.write_text(json.dumps(item))
        with self.assertRaises(ValueError):
            audit_pair(self.root, game_id="nba-game-1", model_version="v1")

if __name__ == "__main__":
    unittest.main()
