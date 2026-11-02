"""Offline synthetic-only Evidence Collector acceptance and failure tests."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from nba_totals_research.collector import (
    _canonical, _synthetic, capture, verify_ledger,
    MAX_INPUT_BYTES, ZERO_HASH,
)

UTC = timezone.utc
NOW = datetime(2026, 11, 2, 10, 0, tzinfo=UTC)


def sample(**changes):
    event = json.loads(_synthetic(NOW))
    event.update(changes)
    return _canonical(event)


class EvidenceCollectorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp.name) / "evidence"

    def tearDown(self):
        self.temp.cleanup()

    def collect(self, raw=None, *, clock=NOW, mode="SYNTHETIC"):
        return capture(sample() if raw is None else raw, self.directory,
                       source_mode=mode, clock=lambda: clock)

    def test_record_valid_synthetic_as_unverified(self):
        result = self.collect()
        self.assertEqual(result["status"], "SCHEMA_AND_LOCAL_TIME_VALID_ONLY")
        self.assertFalse(result["publication_allowed"])
        self.assertFalse(result["independently_attested"])
        self.assertEqual(result["executable_status"], "NOT_VERIFIED")
        self.assertEqual(result["network_calls"], 0)
        state = verify_ledger(self.directory)
        self.assertEqual(state["receipt_count"], 1)
        self.assertEqual(state["status"], "LOCAL_HASH_CHAIN_VALID")
        receipt = json.loads(Path(result["private_receipt"]).read_bytes())
        self.assertEqual(receipt["previous_receipt_sha256"], ZERO_HASH)
        self.assertEqual(receipt["timestamp_trust"], "LOCAL_HOST_CLOCK_UNATTESTED")
        self.assertEqual(receipt["source_mode"], "SYNTHETIC")
        self.assertEqual(receipt["quote"]["side"], "OVER")
        self.assertFalse(receipt["provider_rights_verified"])

    def test_private_file_and_dir_modes(self):
        x = self.collect()
        self.assertEqual(self.directory.stat().st_mode & 0o777, 0o700)
        self.assertEqual(Path(x["private_receipt"]).stat().st_mode & 0o777, 0o600)

    def test_hash_chain_links_two_distinct_samples(self):
        first = self.collect()
        second = self.collect(sample(provider_quote_id="synthetic-only-002"))
        self.assertEqual(second["sequence"], 2)
        receipt = json.loads(Path(second["private_receipt"]).read_bytes())
        self.assertEqual(receipt["previous_receipt_sha256"], first["receipt_sha256"])
        self.assertEqual(verify_ledger(self.directory)["head_sha256"],
                         second["receipt_sha256"])

    def test_repeat_payload_not_counted_as_independent_quote(self):
        self.collect()
        result = self.collect()
        self.assertEqual(result["status"], "DUPLICATE_PAYLOAD")
        self.assertEqual(result["reason_code"], "REPLAY_NOT_INDEPENDENT_SNAPSHOT")
        self.assertEqual(verify_ledger(self.directory)["receipt_count"], 2)

    def test_reject_and_record_late_quote(self):
        x = self.collect(sample(scheduled_tipoff=(NOW + timedelta(minutes=59)).isoformat()))
        self.assertEqual(x["status"], "REJECTED")
        self.assertEqual(verify_ledger(self.directory)["receipt_count"], 1)

    def test_reject_and_record_stale_provider_claim(self):
        x = self.collect(sample(
            provider_published_at=(NOW - timedelta(minutes=4)).isoformat()))
        self.assertEqual(x["status"], "REJECTED")

    def test_reject_inplay_and_closed(self):
        for kwargs in ({"live": True}, {"offered": False}):
            with self.subTest(kwargs=kwargs):
                x = self.collect(sample(**kwargs))
                self.assertEqual(x["status"], "REJECTED")

    def test_reject_mismatched_market_fields(self):
        for kwargs in ({"side": "Other"}, {"line": "228.25"},
                       {"scope": "REGULATION_ONLY"}, {"odds": "NaN"},
                       {"game_id": "wrong"}):
            with self.subTest(kwargs=kwargs):
                self.assertEqual(self.collect(sample(**kwargs))["status"], "REJECTED")

    def test_reject_untrusted_execution_claim_without_leaking_it(self):
        event = json.loads(sample())
        event["executable"] = True
        x = self.collect(_canonical(event))
        self.assertEqual(x["status"], "REJECTED")
        receipt = json.loads(Path(x["private_receipt"]).read_bytes())
        self.assertIsNone(receipt["quote"])
        self.assertEqual(receipt["executable_status"], "NOT_VERIFIED")

    def test_reject_malformed_json_without_copying_payload(self):
        x = self.collect(b'{"api_key":"sensitive-test-only","bad"')
        self.assertEqual(x["status"], "REJECTED")
        receipt = Path(x["private_receipt"]).read_text()
        self.assertNotIn("sensitive-test-only", receipt)
        self.assertEqual(verify_ledger(self.directory)["receipt_count"], 1)

    def test_oversize_payload_not_stored_as_raw(self):
        x = self.collect(b"x" * (MAX_INPUT_BYTES + 1))
        self.assertEqual(x["status"], "REJECTED")
        receipt = json.loads(Path(x["private_receipt"]).read_bytes())
        self.assertEqual(receipt["reason_code"], "OVERSIZE")
        self.assertIsNone(receipt["quote"])

    def test_tamper_detected_on_next_capture(self):
        x = self.collect()
        f = Path(x["private_receipt"])
        f.write_bytes(f.read_bytes() + b" ")
        with self.assertRaisesRegex(ValueError, "Tampered"):
            verify_ledger(self.directory)
        with self.assertRaisesRegex(ValueError, "Tampered"):
            self.collect(sample(provider_quote_id="different"))

    def test_delete_first_receipt_detected_if_second_remains(self):
        first = self.collect()
        self.collect(sample(provider_quote_id="other"))
        Path(first["private_receipt"]).unlink()
        with self.assertRaises(ValueError):
            verify_ledger(self.directory)

    def test_source_mode_not_trusted_from_payload(self):
        with self.assertRaises(ValueError):
            self.collect(mode="LIVE_LICENSED")
        self.assertFalse(self.directory.exists())

    def test_invalid_clock_refused_before_write(self):
        with self.assertRaises(ValueError):
            self.collect(clock=NOW.replace(tzinfo=None))
        self.assertFalse(self.directory.exists())

    def test_non_synthetic_local_file_always_unverified(self):
        x = self.collect(mode="LOCAL_FILE_UNVERIFIED")
        receipt = json.loads(Path(x["private_receipt"]).read_bytes())
        self.assertFalse(receipt["independently_attested"])
        self.assertEqual(receipt["source_mode"], "LOCAL_FILE_UNVERIFIED")

    def test_empty_ledger_verified_without_false_trust(self):
        state = verify_ledger(self.directory)
        self.assertEqual(state["status"], "EMPTY")
        self.assertFalse(state["independently_attested"])


if __name__ == "__main__":
    unittest.main()
