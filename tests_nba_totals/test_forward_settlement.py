"""Synthetic fail-closed tests: Actions forecasts → verified local hashes → scores."""
import io
import json
import tempfile
import unittest
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from nba_totals_research.scheduled_paper_collector import canonical, digest
from nba_totals_research.forward_settlement import inspect_artifact, score_forecasts, run_report

NOW = datetime(2026, 11, 2, 16, tzinfo=timezone.utc)
TIP = NOW + timedelta(hours=8)
RUN = {"id": 77, "status": "completed", "conclusion": "success",
       "path": ".github/workflows/nba-forward-collection.yml", "head_branch": "main",
       "created_at": (NOW-timedelta(minutes=2)).isoformat(),
       "updated_at": (NOW+timedelta(minutes=2)).isoformat()}

def fixture():
    record = {
        "schema_version": 1, "research_only": True,
        "source": "ESPN_SCOREBOARD_UNVERIFIED",
        "source_game_id": "nba1", "away": "gs", "home": "ny",
        "scheduled_tipoff": TIP.isoformat(),
        "model_version": "rolling-team-total-v1",
        "expected_total": 225.5,
        "generated_at_host_utc": NOW.isoformat(),
        "history_source_game_ids": {"gs": ["old1"],"ny": ["old2"]},
        "source_availability_verified": False, "independently_timestamped": False,
        "evaluation_eligible": False, "publication_allowed": False,
        "gate_status": "NO_GO",
    }
    record["record_sha256"] = digest(canonical(record))
    source = json.dumps({"events":[]}).encode()
    predictions = canonical(record) + b"\n"
    manifest = {
       "generated_at_host_utc": NOW.isoformat(), "n_source_days": 1,
       "n_forecasts": 1, "n_games": 1,
       "predictions_sha256": digest(predictions),
       "source_sha256_by_day": {"2026-11-02": digest(source)},
       "gate_status":"NO_GO","publication_allowed":False,
    }
    return {"manifest.json": canonical(manifest),
            "predictions.jsonl": predictions,
            "source_snapshots/2026-11-02.json": source}

def zipfiles(files):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        for name, blob in files.items():
            z.writestr(name, blob)
    return out.getvalue()

class TestForwardSettlement(unittest.TestCase):
    def test_accept_valid_host_record_as_provisional_only(self):
        rows = inspect_artifact(zipfiles(fixture()), RUN, artifact_name="nba-paper-77")
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0]["evaluation_eligible"])

    def test_accept_digest_only_archive_as_provisional(self):
        files = fixture()
        files.pop("source_snapshots/2026-11-02.json")
        rows = inspect_artifact(zipfiles(files), RUN, artifact_name="nba-paper-77")
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0]["evaluation_eligible"])

    def test_reject_tampered_prediction_bytes(self):
        files = fixture()
        files["predictions.jsonl"] = files["predictions.jsonl"].replace(b"225.5", b"226.5")
        with self.assertRaises(ValueError):
            inspect_artifact(zipfiles(files), RUN, artifact_name="nba-paper-77")

    def test_reject_post_tipoff_workflow_completion(self):
        later = dict(RUN, updated_at=(TIP+timedelta(minutes=1)).isoformat())
        with self.assertRaises(ValueError):
            inspect_artifact(zipfiles(fixture()), later, artifact_name="nba-paper-77")

    def test_reject_other_workflow(self):
        other = dict(RUN, path=".github/workflows/other.yml")
        with self.assertRaises(ValueError):
            inspect_artifact(zipfiles(fixture()), other, artifact_name="nba-paper-77")

    def test_reject_cross_run_artifact(self):
        with self.assertRaises(ValueError):
            inspect_artifact(zipfiles(fixture()), RUN, artifact_name="nba-paper-88")

    def test_score_and_deduplicate(self):
        row = inspect_artifact(zipfiles(fixture()), RUN, artifact_name="nba-paper-77")[0]
        actual = {"source_game_id":"nba1","status":"FINAL","away":"gs","home":"ny",
                  "scheduled_tipoff":TIP.isoformat(),"score_away":110,"score_home":120}
        report = score_forecasts([row, row], [actual], at=TIP+timedelta(hours=8))
        self.assertEqual(report["n_scored"], 1)
        self.assertEqual(report["n_duplicates_discarded"], 1)
        self.assertEqual(report["mae"], 4.5)
        self.assertEqual(report["rmse"], 4.5)
        self.assertEqual(report["independently_verified_count"], 0)

    def test_identity_mismatch_is_not_scored(self):
        row = inspect_artifact(zipfiles(fixture()), RUN, artifact_name="nba-paper-77")[0]
        actual = {"source_game_id":"nba1","status":"FINAL","away":"ny","home":"gs",
                  "scheduled_tipoff":TIP.isoformat(),"score_away":120,"score_home":110}
        report = score_forecasts([row], [actual], at=TIP+timedelta(hours=8))
        self.assertEqual(report["n_scored"], 0)
        self.assertEqual(report["n_identity_mismatches"], 1)
        self.assertIsNone(report["mae"])

    def test_empty_forecasts_returns_no_fake_metrics(self):
        with tempfile.TemporaryDirectory() as d:
            report = run_report("org/repo","",Path(d), predictions=[],at=NOW)
            self.assertEqual(report["n_scored"],0)
            self.assertIsNone(report["rmse"])
            self.assertTrue((Path(d)/"report.json").exists())

if __name__ == "__main__":
    unittest.main()
