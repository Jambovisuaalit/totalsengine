"""Release KPI: independent evidence cannot be self-certified by local data."""
import json
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

from nba_totals_research.collector import _synthetic, _canonical, _parse_quote, capture
from nba_totals_research.core import ConditionalModel, assess
from nba_totals_research.release_gate import (
    REQUIRED_GATES, audit_release_kpi, evaluate_release,
)

NOW = datetime(2026, 11, 2, 10, 0, tzinfo=timezone.utc)


class ReleaseKpiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "ledger"
        self.raw = _synthetic(NOW)
        self.item = json.loads(self.raw)

    def tearDown(self):
        self.tmp.cleanup()

    def collect(self, raw=None):
        return capture(self.raw if raw is None else raw, self.root,
                       source_mode="SYNTHETIC", clock=lambda: NOW)

    def paper(self, raw=None, **changes):
        raw = self.raw if raw is None else raw
        quote = _parse_quote(raw, NOW)
        model = ConditionalModel(
            "synthetic-unvalidated",
            Decimal("0.1"),
            {220: Decimal("0.6"), 235: Decimal("0.4")},
            {250: Decimal("1")},
        )
        result = assess((quote,), model, assessed_at=NOW)
        return replace(result, **changes)

    def test_all_six_gates_exposed_and_no_go(self):
        x = self.collect()
        report = evaluate_release(self.root, Path(x["private_receipt"]),
                                  paper=self.paper())
        self.assertEqual(tuple(report.checks), REQUIRED_GATES)
        self.assertTrue(report.checks["EXACT_MARKET_MATCH"])
        self.assertTrue(all(not report.checks[k]
                            for k in REQUIRED_GATES if k != "EXACT_MARKET_MATCH"))
        self.assertEqual(report.verdict, "NO_GO")
        self.assertFalse(report.publication_allowed)
        self.assertIsNone(report.kpi_verified_publish_rate)

    def test_empty_ledger_kpi_not_100_percent(self):
        result = audit_release_kpi(self.root)
        self.assertEqual(result["receipt_count"], 0)
        self.assertEqual(result["published_signal_denominator"], 0)
        self.assertIsNone(result["verified_publish_compliance_rate"])
        self.assertEqual(result["decision"], "NO_GO")

    def test_local_receipt_never_counts_as_published(self):
        self.collect()
        result = audit_release_kpi(self.root)
        self.assertEqual(result["receipt_count"], 1)
        self.assertEqual(result["published_signals_observed"], 0)
        self.assertIsNone(result["verified_publish_compliance_rate"])

    def test_replayed_payload_blocked(self):
        self.collect()
        repeated = self.collect()
        report = evaluate_release(self.root, Path(repeated["private_receipt"]),
                                  paper=self.paper())
        self.assertIn("RECEIPT_NOT_ELIGIBLE_OR_REPLAYED", report.reasons)
        self.assertFalse(report.checks["EXACT_MARKET_MATCH"])

    def test_rejected_late_quote_blocked(self):
        bad = _canonical(dict(self.item, scheduled_tipoff=(
            NOW + timedelta(minutes=59)).isoformat()))
        rejected = self.collect(bad)
        report = evaluate_release(self.root, Path(rejected["private_receipt"]))
        self.assertEqual(report.verdict, "NO_GO")
        self.assertIn("RECEIPT_NOT_ELIGIBLE_OR_REPLAYED", report.reasons)

    def test_no_linked_paper_assessment_blocks(self):
        x = self.collect()
        result = evaluate_release(self.root, Path(x["private_receipt"]))
        self.assertIn("NO_LINKED_PAPER_ASSESSMENT", result.reasons)
        self.assertFalse(result.checks["EXACT_MARKET_MATCH"])

    def test_other_game_or_line_or_side_or_book_is_not_exact(self):
        x = self.collect()
        paper = self.paper()
        bad = [
            replace(paper, market=replace(paper.market, line=Decimal("229.5"))),
            replace(paper, market=replace(paper.market, side="UNDER")),
            replace(paper, market=replace(paper.market, scope="REG_ONLY")),
            replace(paper, bookmaker="other_book"),
            replace(paper, decimal_odds=Decimal("1.95")),
            replace(paper, selected_quote_id="wrong_quote"),
            replace(paper, raw_response_sha256="b" * 64),
        ]
        for candidate in bad:
            with self.subTest(candidate=candidate):
                outcome = evaluate_release(self.root, Path(x["private_receipt"]),
                                           paper=candidate)
                self.assertFalse(outcome.checks["EXACT_MARKET_MATCH"])
                self.assertIn("MISSING_EXACT_MARKET_MATCH", outcome.reasons)

    def test_paper_assessment_late_clock_blocks_match(self):
        x = self.collect()
        later = replace(self.paper(), assessed_at=NOW+timedelta(minutes=3))
        outcome = evaluate_release(self.root, Path(x["private_receipt"]),
                                   paper=later)
        self.assertFalse(outcome.checks["EXACT_MARKET_MATCH"])

    def test_paper_pass_decision_never_publish(self):
        x = self.collect()
        pass_decision = replace(self.paper(), status="PASS")
        outcome = evaluate_release(self.root, Path(x["private_receipt"]),
                                   paper=pass_decision)
        self.assertIn("MODEL_DECISION_PASS", outcome.reasons)
        self.assertFalse(outcome.publication_allowed)

    def test_fake_paper_publication_true_is_refused(self):
        x = self.collect()
        fraudulent = replace(self.paper(), publication_allowed=True)
        outcome = evaluate_release(self.root, Path(x["private_receipt"]),
                                   paper=fraudulent)
        self.assertFalse(outcome.checks["EXACT_MARKET_MATCH"])
        self.assertFalse(outcome.publication_allowed)

    def test_self_claimed_rights_or_execution_cannot_upgrade_collector(self):
        fake = dict(self.item, execution_verified=True,
                    rights_approved=True, timestamp_attested=True)
        invalid = self.collect(_canonical(fake))
        report = evaluate_release(self.root, Path(invalid["private_receipt"]))
        self.assertEqual(report.verdict, "NO_GO")
        self.assertFalse(report.checks["DATA_RIGHTS_APPROVED"])
        self.assertFalse(report.checks["EXECUTION_VERIFIED"])
        self.assertFalse(report.checks["PRE_TIPOFF_ATTESTED"])

    def test_unverified_model_report_hash_never_passes_gate(self):
        x = self.collect()
        paper = self.paper()
        outcome = evaluate_release(self.root, Path(x["private_receipt"]),
                                   paper=replace(paper, model_version="model-report-present"))
        self.assertFalse(outcome.checks["INDEPENDENT_MODEL_VALIDATED"])

    def test_cross_ledger_receipt_refused(self):
        x = self.collect()
        with tempfile.TemporaryDirectory() as other:
            with self.assertRaisesRegex(ValueError, "belong"):
                evaluate_release(Path(other), Path(x["private_receipt"]))

    def test_tampered_receipt_prevents_even_policy_evaluation(self):
        x = self.collect()
        path = Path(x["private_receipt"])
        path.write_bytes(path.read_bytes() + b" ")
        with self.assertRaises(ValueError):
            evaluate_release(self.root, path, paper=self.paper())
        with self.assertRaises(ValueError):
            audit_release_kpi(self.root)

    def test_counts_include_rejected_and_duplicate_without_publishing(self):
        self.collect()
        self.collect()
        self.collect(b"invalid")
        result = audit_release_kpi(self.root)
        self.assertEqual(result["receipt_count"], 3)
        self.assertEqual(result["receipt_counts"]["DUPLICATE_PAYLOAD"], 1)
        self.assertEqual(result["receipt_counts"]["REJECTED"], 1)
        self.assertEqual(result["receipt_counts"]["SCHEMA_AND_LOCAL_TIME_VALID_ONLY"], 1)
        self.assertEqual(result["published_signals_observed"], 0)

    def test_fake_self_asserted_status_cannot_flip_release(self):
        x = self.collect()
        path = Path(x["private_receipt"])
        payload = json.loads(path.read_bytes())
        payload["independently_attested"] = True
        path.write_bytes(_canonical(payload))
        with self.assertRaises(ValueError):
            evaluate_release(self.root, path, paper=self.paper())


if __name__ == "__main__":
    unittest.main()
