import copy
import unittest
from datetime import datetime, timezone
from nba_totals_research.real_source_evidence import freeze_source, validate_local


class SourceEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.policy = {
            "schema": 1, "review_status": "APPROVED",
            "source_id": "synthetic-provider", "endpoint_id": "nba-scoreboard",
            "allow_capture": True, "allow_raw_retention": True,
            "allow_sigstore_digest": True,
            "review_reference": "SYNTHETIC_TEST_ONLY", "reviewed_by": "test",
            "valid_from_utc": "2026-11-01T00:00:00Z",
            "valid_until_utc": "2026-12-01T00:00:00Z"
        }
        self.kw = dict(
            source_raw=b'{"games":[]}', source_id="synthetic-provider",
            endpoint_id="nba-scoreboard", source_record_id="source-42",
            fetched_at_utc="2026-11-06T00:00:00Z",
            collected_at_utc="2026-11-06T00:00:02Z",
            event_id="synthetic-game-42",
            scheduled_start_utc="2026-11-06T02:00:00Z",
            event_state_raw=b'{"state":"pre"}', observed_state="PRE_GAME",
            event_state_observed_at_utc="2026-11-05T23:59:59Z",
            feature_as_of_utc="2026-11-06T00:01:00Z",
            prediction_created_at_utc="2026-11-06T00:01:01Z",
            policy=self.policy)
    def test_bytes_hash_and_hold(self):
        m, b = freeze_source(**self.kw)
        self.assertTrue(validate_local(m, b))
        self.assertFalse(m["signature_verified"])
        self.assertIsNone(m["actual_start_utc"])
    def test_rights_denied_and_wrong_scope(self):
        self.policy["review_status"] = "PENDING"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
        self.policy["review_status"] = "APPROVED"
        self.policy["endpoint_id"] = "unlicensed"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
    def test_missing_retention_or_expired_rights(self):
        self.policy["allow_raw_retention"] = False
        with self.assertRaises(ValueError): freeze_source(**self.kw)
        self.policy["allow_raw_retention"] = True
        self.policy["valid_until_utc"] = "2026-11-05T00:00:00Z"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
    def test_future_and_stale_data_rejected(self):
        self.kw["fetched_at_utc"] = "2026-11-06T02:00:00Z"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
        self.kw["fetched_at_utc"] = "2026-11-05T23:00:00Z"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
    def test_live_event_and_missing_original_rejected(self):
        self.kw["observed_state"] = "LIVE"
        with self.assertRaises(ValueError): freeze_source(**self.kw)
        self.kw["observed_state"] = "PRE_GAME"
        self.kw["source_raw"] = b""
        with self.assertRaises(ValueError): freeze_source(**self.kw)
    def test_tampering_and_illegal_promotion_rejected(self):
        m, b = freeze_source(**self.kw)
        b["source_original.json"] = b"tampered"
        with self.assertRaises(ValueError): validate_local(m, b)
        m, b = freeze_source(**self.kw)
        m["signature_verified"] = True
        with self.assertRaises(ValueError): validate_local(m, b)
    def test_timestamp_must_be_timezone_aware(self):
        self.kw["collected_at_utc"] = "2026-11-06T00:00:02"
        with self.assertRaises(ValueError): freeze_source(**self.kw)


if __name__ == "__main__":
    unittest.main()
