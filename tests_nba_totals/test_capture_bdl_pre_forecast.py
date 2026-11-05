import json
import unittest
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

from nba_totals_research.capture_bdl_pre_forecast import capture
from nba_totals_research.real_source_evidence import sha256


class FakeResponse:
    status = 200
    headers = {"Date": "Thu, 05 Nov 2026 12:00:00 GMT"}
    def __init__(self, body): self.body = BytesIO(body)
    def read(self, count): return self.body.read(count)
    def __enter__(self): return self
    def __exit__(self, *args): return False


class BdlCaptureTests(unittest.TestCase):
    def setUp(self):
        self.policy = {
            "schema": 1, "review_status": "APPROVED",
            "source_id": "balldontlie-nba", "endpoint_id": "games-v1",
            "allow_capture": True, "allow_raw_retention": True,
            "allow_sigstore_digest": True,
            "review_reference": "SYNTHETIC_ONLY", "reviewed_by": "test",
            "valid_from_utc": "2026-11-01T00:00:00Z",
            "valid_until_utc": "2026-12-01T00:00:00Z"
        }
        self.raw = json.dumps({
            "data": [{"id": 42, "status": "Scheduled", "period": 0,
                      "datetime": "2026-11-06T02:00:00Z",
                      "home_team_score": 0, "visitor_team_score": 0}],
            "meta": {"next_cursor": None}
        }).encode()
        self.clock = lambda: datetime(2026, 11, 5, 21, tzinfo=timezone.utc)
        self.opener = lambda req, timeout: FakeResponse(self.raw)

    def test_original_bytes_persisted_pending_attestation(self):
        with TemporaryDirectory() as root:
            out = Path(root) / "new"
            m = capture(day="2026-11-05", game_id="42", policy=self.policy,
                        api_key="testonly", out=out, clock=self.clock,
                        opener=self.opener)
            self.assertEqual((out / "source-original.json").read_bytes(), self.raw)
            self.assertEqual(m["raw_sha256"], sha256(self.raw))
            self.assertEqual(m["gate"], "HOLD")
            self.assertFalse(m["sigstore_attested"])
            self.assertFalse(m["actual_start_verified"])

    def test_no_capture_on_live_source(self):
        self.raw = self.raw.replace(b"Scheduled", b"Live")
        with TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                capture(day="2026-11-05", game_id="42", policy=self.policy,
                        api_key="testonly", out=Path(root) / "new",
                        clock=self.clock, opener=self.opener)

    def test_no_capture_with_pending_rights(self):
        self.policy["review_status"] = "PENDING"
        with TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                capture(day="2026-11-05", game_id="42", policy=self.policy,
                        api_key="testonly", out=Path(root) / "new",
                        clock=self.clock, opener=self.opener)

    def test_no_capture_after_schedule(self):
        self.raw = self.raw.replace(b"2026-11-06T02:00:00Z", b"2026-11-05T20:00:00Z")
        with TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                capture(day="2026-11-05", game_id="42", policy=self.policy,
                        api_key="testonly", out=Path(root) / "new",
                        clock=self.clock, opener=self.opener)


if __name__ == "__main__":
    unittest.main()
