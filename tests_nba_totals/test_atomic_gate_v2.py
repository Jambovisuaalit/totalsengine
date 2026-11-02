"""Atomic v2 gate tests: synthetic proofs, no dispatch channel or credentials."""
import json
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from nba_totals_research.atomic_gate_v2 import OfflineGate
from nba_totals_research.collector import _parse_quote, _synthetic, capture
from nba_totals_research.core import ConditionalModel, assess
from decimal import Decimal

NOW = datetime(2026, 11, 2, 10, tzinfo=timezone.utc)


class AtomicOfflineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.ledger = self.root / "ledger"
        self.database = self.root / "paper-audit.sqlite3"
        self.gate = OfflineGate(self.database)
        self.raw = _synthetic(NOW)
        receipt = capture(self.raw, self.ledger, source_mode="SYNTHETIC",
                          clock=lambda: NOW)
        self.path = Path(receipt["private_receipt"])
        quote = _parse_quote(self.raw, NOW)
        model = ConditionalModel("synthetic", Decimal("0.1"),
                                 {220: Decimal("0.2"), 230: Decimal("0.8")},
                                 {250: Decimal("1")})
        self.paper = assess((quote,), model, assessed_at=NOW)

    def tearDown(self):
        self.tmp.cleanup()

    def run_once(self, request_id="test-id-0001", paper=None):
        return self.gate.evaluate_and_record(
            request_id=request_id, evidence_dir=self.ledger, receipt_file=self.path,
            paper=paper or self.paper, envelopes={}, roots={}, now=NOW,
            source_id="test-source", jurisdiction="FI")

    def test_default_kill_switch_on_and_no_publication(self):
        r = self.run_once()
        self.assertEqual(r.status, "HALTED")
        self.assertFalse(r.publication_allowed)
        self.assertEqual(r.actual_delivery_attempts, 0)
        self.assertFalse(r.checks["EXECUTION_VERIFIED"])
        stats = self.gate.audit()
        self.assertTrue(stats["kill_switch_active"])
        self.assertEqual(stats["published_signal_denominator"], 0)
        self.assertEqual(stats["published_without_verified_evidence"], 0)
        self.assertIsNone(stats["verified_publish_compliance_rate"])

    def test_idempotent_request_does_not_double_insert(self):
        a = self.run_once()
        b = self.run_once()
        self.assertEqual(a, b)
        self.assertEqual(self.gate.audit()["dry_run_attempts"], 1)

    def test_same_request_id_different_paper_rejected(self):
        from dataclasses import replace
        self.run_once()
        modified = replace(self.paper, evidence_sha256="f" * 64)
        with self.assertRaisesRegex(ValueError, "Idempotency collision"):
            self.run_once(paper=modified)
        self.assertEqual(self.gate.audit()["dry_run_attempts"], 1)

    def test_even_manually_disabled_kill_no_evidence_cannot_pass(self):
        # Only a synthetic test forcibly alters internal DB; production API
        # deliberately has no unhalt operation.
        with sqlite3.connect(self.database) as conn:
            conn.execute("UPDATE policy_control SET halted=0 WHERE singleton=1")
        r = self.run_once()
        self.assertEqual(r.status, "BLOCKED_MISSING_EVIDENCE")
        self.assertFalse(r.publication_allowed)
        self.assertEqual(self.gate.audit()["actual_delivery_attempts"], 0)
        self.gate.activate_kill_switch()
        self.assertTrue(self.gate.audit()["kill_switch_active"])

    def test_kill_switch_cannot_be_disabled_through_api(self):
        self.assertFalse(hasattr(self.gate, "disable_kill_switch"))
        self.assertFalse(hasattr(self.gate, "publish"))

    def test_invalid_input_refused_without_transaction_record(self):
        with self.assertRaises(ValueError):
            self.run_once(request_id="../unsafe")
        self.assertEqual(self.gate.audit()["dry_run_attempts"], 0)

    def test_tampered_receipt_rolls_back_without_record(self):
        self.path.write_bytes(self.path.read_bytes() + b"altered")
        with self.assertRaises(ValueError):
            self.run_once()
        self.assertEqual(self.gate.audit()["dry_run_attempts"], 0)

    def test_repeated_parallel_request_is_serialized(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _n: self.run_once(), range(4)))
        self.assertTrue(all(x.status == "HALTED" for x in results))
        self.assertEqual(self.gate.audit()["dry_run_attempts"], 1)

    def test_private_database_permissions(self):
        self.assertEqual(self.database.stat().st_mode & 0o777, 0o600)

    def test_multiple_unique_blocked_attempts_do_not_publish(self):
        for i in range(4):
            self.run_once(request_id=f"test-id-{i:04d}")
        audit = self.gate.audit()
        self.assertEqual(audit["dry_run_attempts"], 4)
        self.assertEqual(audit["actual_delivery_attempts"], 0)
        self.assertEqual(audit["published_without_verified_evidence"], 0)


if __name__ == "__main__":
    unittest.main()
