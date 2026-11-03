"""Synthetic unit tests for prospective inference and WORM archiving."""
import csv
import json
import io
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from nba_totals_research.forward_pipeline import (
    infer_rolling_team_total, put_object_lock, execute_once, tsa_signed_time)

NOW = datetime(2026, 11, 2, 16, tzinfo=timezone.utc)
ROWS = [
    ("2026-10-01", "aaa", "ccc", 100, 100),
    ("2026-10-03", "ddd", "aaa", 110, 100),
    ("2026-10-04", "bbb", "eee", 125, 115),
    ("2026-10-06", "fff", "bbb", 115, 105),
    ("2026-11-01", "aaa", "bbb", 190, 190),
]
class FakeStream:
    def __init__(self, data): self.data = data
    def read(self): return self.data

class FakeS3:
    def __init__(self, mode="COMPLIANCE", corrupt=False):
        self.mode, self.corrupt = mode, corrupt
        self.raw, self.retention = None, None
    def put_object(self, **kwargs):
        self.raw = kwargs["Body"]
        self.retention = kwargs["ObjectLockRetainUntilDate"]
        return {"VersionId": "version-1"}
    def get_object_retention(self, **kwargs):
        return {"Retention": {"Mode": self.mode, "RetainUntilDate": self.retention}}
    def get_object(self, **kwargs):
        return {"Body": FakeStream(b"tampered" if self.corrupt else self.raw)}

class TestForwardPipeline(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.csv = Path(self.tmp.name) / "synthetic.csv"
        with self.csv.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["date","away","home","score_away","score_home"])
            writer.writerows(ROWS)

    def test_actual_baseline_inference(self):
        result = infer_rolling_team_total(
            self.csv, away="aaa", home="bbb", cutoff=NOW, n_games=2)
        self.assertEqual(result["expected_total"], "217.5000")
        self.assertFalse(result["eligible_for_verified_evaluation"])

    def test_excludes_future_and_late_games(self):
        result = infer_rolling_team_total(
            self.csv, away="aaa", home="bbb", cutoff=NOW, n_games=2)
        self.assertNotEqual(result["expected_total"], "380.0000")

    def test_naive_feature_cutoff_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Timezone-aware feature cutoff"):
            infer_rolling_team_total(
                self.csv, away="aaa", home="bbb",
                cutoff=datetime(2026, 11, 2, 16), n_games=2)

    def test_insufficient_history_fails(self):
        with self.assertRaises(ValueError):
            infer_rolling_team_total(self.csv, away="aaa", home="bbb",
                                     cutoff=NOW, n_games=10)

    def test_object_lock_success_and_verifies_bytes(self):
        deadline = datetime.now(timezone.utc) + timedelta(days=40)
        result = put_object_lock(FakeS3(), bucket="test",
                                 key="record", raw=b"abc", retain_until=deadline)
        self.assertEqual(result["version_id"], "version-1")

    def test_object_lock_without_compliance_fails(self):
        deadline = datetime.now(timezone.utc) + timedelta(days=40)
        with self.assertRaises(ValueError):
            put_object_lock(FakeS3(mode="GOVERNANCE"), bucket="test",
                            key="record", raw=b"abc", retain_until=deadline)

    def test_corrupt_archive_fails(self):
        deadline = datetime.now(timezone.utc) + timedelta(days=40)
        with self.assertRaises(ValueError):
            put_object_lock(FakeS3(corrupt=True), bucket="test",
                            key="record", raw=b"abc", retain_until=deadline)

    def test_tsa_signed_time_requires_unique_valid_timestamp(self):
        payload = json.dumps({"timestamp_response_text":
            "Status: Granted.\nTime stamp: Nov  2 17:01:12 2026 GMT\n"}).encode()
        self.assertEqual(tsa_signed_time(payload),
            datetime(2026, 11, 2, 17, 1, 12, tzinfo=timezone.utc))
        with self.assertRaises(ValueError):
            tsa_signed_time(b'{"timestamp_response_text":"no timestamp"}')

    def test_rights_gate_fails_before_inference(self):
        with self.assertRaises(ValueError):
            execute_once(data_csv=self.csv, workdir=Path(self.tmp.name),
                game_id="test", away="aaa", home="bbb",
                tipoff=(NOW + timedelta(hours=3)).isoformat(),
                feature_cutoff=NOW.isoformat(), source_rights_approved=False,
                schedule_verified=True, tsa_url="https://example.org/tsa",
                tsa_ca=self.csv, s3_client=FakeS3(), s3_bucket="test",
                retain_until=NOW + timedelta(days=40), clock=lambda: NOW,
                n_games=2)

if __name__ == "__main__":
    unittest.main()
