"""Synthetic archive integration: a completed S3 marker is written last."""
import csv
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from nba_totals_research.forward_pipeline import execute_once, put_object_lock

NOW = datetime(2026, 11, 2, 9, 30, tzinfo=timezone.utc)

class _Body:
    def __init__(self, raw): self.raw = raw
    def read(self): return self.raw

class MemoryLockedS3:
    def __init__(self, fail_at=None):
        self.objects = {}
        self.order = []
        self.fail_at = fail_at
    def put_object(self, **kw):
        key = kw["Key"]
        if self.fail_at == len(self.order) or key in self.objects:
            raise ValueError("Simulated object lock write failure or existing key")
        assert kw["IfNoneMatch"] == "*"
        assert kw["ObjectLockMode"] == "COMPLIANCE"
        self.objects[key] = (kw["Body"], kw["ObjectLockRetainUntilDate"])
        self.order.append(key)
        return {"VersionId": str(len(self.order))}
    def get_object_retention(self, **kw):
        return {"Retention": {"Mode": "COMPLIANCE", "RetainUntilDate":
                             self.objects[kw["Key"]][1]}}
    def get_object(self, **kw):
        return {"Body": _Body(self.objects[kw["Key"]][0])}

class TestManifestCompletion(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.csv = root / "history.csv"
        with self.csv.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["date", "away", "home", "score_away", "score_home"])
            writer.writerows([
                ["2026-09-01", "aaa", "ccc", 110, 110],
                ["2026-09-02", "bbb", "ddd", 105, 105],
                ["2026-09-04", "eee", "aaa", 110, 110],
                ["2026-09-05", "fff", "bbb", 105, 105],
            ])
        self.args = {
            "data_csv": self.csv, "workdir": root, "game_id": "nba-abc",
            "away": "aaa", "home": "bbb",
            "tipoff": (NOW + timedelta(hours=2)).isoformat(),
            "feature_cutoff": (NOW - timedelta(minutes=5)).isoformat(),
            "source_rights_approved": True, "schedule_verified": True,
            "tsa_url": "https://example.com/tsa", "tsa_ca": self.csv,
            "s3_bucket": "simulated", "retain_until": datetime.now(timezone.utc) + timedelta(days=40),
            "n_games": 2, "clock": lambda: NOW,
        }
    def mock_tsa(self, digest, destination, **kwargs):
        destination.mkdir(parents=True, exist_ok=True)
        (destination / "request.tsq").write_bytes(b"synthetic-query")
        (destination / "response.tsr").write_bytes(b"synthetic-response")
        (destination / "timestamp-audit.json").write_text(json.dumps({
            "timestamp_response_text": "Time stamp: Nov  2 09:30:05 2026 GMT"}))
        return {"rfc3161_verified": True, "raw_sha256": digest}

    def test_completion_is_last_and_not_evaluation_eligible(self):
        storage = MemoryLockedS3()
        with patch("nba_totals_research.forward_pipeline.timestamp_digest", self.mock_tsa):
            report = execute_once(**self.args, s3_client=storage)
        self.assertTrue(storage.order[-1].endswith("/completion-manifest.json"))
        manifest = json.loads(storage.objects[storage.order[-1]][0])
        self.assertEqual(len(manifest["artifacts"]), 5)
        self.assertFalse(manifest["evaluation_eligible"])
        self.assertFalse(report["evaluation_eligible"])
        self.assertEqual(report["gate_status"], "NO_GO")
        with self.assertRaises(ValueError):
            with patch("nba_totals_research.forward_pipeline.timestamp_digest", self.mock_tsa):
                execute_once(**self.args, s3_client=storage)

    def test_partial_archive_has_no_completion_marker(self):
        storage = MemoryLockedS3(fail_at=3)
        with patch("nba_totals_research.forward_pipeline.timestamp_digest", self.mock_tsa):
            with self.assertRaises(ValueError):
                execute_once(**self.args, s3_client=storage)
        self.assertEqual(len(storage.order), 3)
        self.assertFalse(any("completion-manifest" in k for k in storage.order))

if __name__ == "__main__":
    unittest.main()
