"""Synthetic-only contract tests. No API keys, real odds or external services."""
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from decimal import Decimal as D
from pathlib import Path
from nba_totals_research.core import Market, Quote, ConditionalModel, assess, write_private_receipt

GAME = "123e4567-e89b-42d3-a456-426614174000"
TIP = datetime(2026, 11, 12, tzinfo=timezone.utc)
AT = TIP - timedelta(minutes=62)
HASH = "a" * 64

def m(side="OVER", line="228.5", scope="NBA_FULL_GAME_TOTAL_INCLUDING_OT"):
    return Market(GAME, D(line), side, scope)

def q(book="book_a", odds="4.0", identity=None, **changes):
    return replace(Quote(identity or m(), book, D(odds), TIP, AT - timedelta(seconds=20),
                         AT - timedelta(seconds=50), HASH, "example-" + book), **changes)

def model(**changes):
    return replace(ConditionalModel("synthetic-only-unvalidated-v0", D("0.1"),
                                   {220: D("0.8"), 230: D("0.2")},
                                   {235: D("1")}), **changes)

def eval(qs, md=None):
    return assess(tuple(qs), md or model(), assessed_at=AT)

class ContractTests(unittest.TestCase):
    def test_line_shopping_max_odds_and_ev(self):
        x = eval([q("book_a", "4.0"), q("book_b", "4.2")])
        self.assertEqual(x.bookmaker, "book_b")
        self.assertEqual((x.p_win, x.p_push, x.p_lose), (D("0.28"), D("0"), D("0.72")))
        self.assertEqual(x.ev_per_unit, D("0.176"))
        self.assertEqual(x.status, "PAPER_CANDIDATE")
        self.assertFalse(x.publication_allowed)
        self.assertEqual(len(x.blockers), 4)
    def test_under_is_not_over(self):
        x = eval([q(identity=m(side="UNDER"))])
        self.assertEqual((x.p_win, x.p_lose), (D("0.72"), D("0.28")))
    def test_push_zero_profit(self):
        x = eval([q(odds="7", identity=m(line="230"))],
                 model(p_total_no_overtime={220:D("0.6"),230:D("0.4")},
                       p_total_given_overtime={240:D("1")}))
        self.assertEqual((x.p_win, x.p_push, x.p_lose), (D("0.1"), D("0.36"), D("0.54")))
        self.assertEqual(x.ev_per_unit, D("0.06"))
    def test_ot_adjustment_affects_ev(self):
        self.assertGreater(eval([q()], model(p_overtime=D("0.1"))).ev_per_unit,
                           eval([q()], model(p_overtime=D("0"))).ev_per_unit)
    def test_negative_ev_pass(self):
        self.assertEqual(eval([q(odds="1.91")]).status, "PASS")
    def test_exact_market_mismatch_rejected(self):
        for bad in (m(line="229"), m(side="UNDER"), m(scope="REG_ONLY")):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                eval([q("book_a"), q("book_b", identity=bad)])
    def test_stale_quote_rejected(self):
        with self.assertRaises(ValueError):
            eval([q(observed_at=AT-timedelta(minutes=3),
                    provider_published_at=AT-timedelta(minutes=3, seconds=20))])
    def test_post_t60_rejected(self):
        with self.assertRaises(ValueError):
            eval([q(observed_at=TIP-timedelta(minutes=59),
                    provider_published_at=TIP-timedelta(minutes=59, seconds=10))])
    def test_live_closed_rejected(self):
        for changes in ({"live": True}, {"offered": False}):
            with self.assertRaises(ValueError):
                eval([q(**changes)])
    def test_provider_future_timestamp_rejected(self):
        with self.assertRaises(ValueError):
            eval([q(provider_published_at=AT+timedelta(seconds=3))])
    def test_naive_timestamp_rejected(self):
        with self.assertRaises(ValueError):
            eval([q(observed_at=AT.replace(tzinfo=None))])
    def test_bad_line_rejected(self):
        for bad in (m(line="228.25"), m(line="999"), m(side="TOTAL")):
            with self.assertRaises(ValueError):
                eval([q(identity=bad)])
    def test_invalid_model_rejected(self):
        for bad in (model(p_total_no_overtime={220:D("0.99")}),
                    model(p_overtime=D("-0.1")),
                    model(p_total_given_overtime={240:D("-0.1"),235:D("1.1")})):
            with self.assertRaises(ValueError):
                eval([q()],bad)
    def test_duplicate_bookmaker_rejected(self):
        with self.assertRaises(ValueError):
            eval([q("book_a"),q("book_a",odds="4.2")])
    def test_hash_does_not_prove_model_validation(self):
        x = eval([q()],model(validation_report_sha256="b"*64))
        self.assertFalse(x.publication_allowed)
        self.assertIn("NO_INDEPENDENT_MODEL_ATTESTATION",x.blockers)
    def test_write_once_private_receipt(self):
        x=eval([q()])
        with tempfile.TemporaryDirectory() as td:
            dest=write_private_receipt(x,Path(td))
            self.assertTrue(dest.is_file())
            self.assertEqual(dest.stat().st_mode&0o777,0o600)
            with self.assertRaises(FileExistsError):
                write_private_receipt(x,Path(td))
    def test_evidence_hash_independent_of_quote_order(self):
        a=eval([q("book_a","4.0"),q("book_b","4.2")])
        b=eval([q("book_b","4.2"),q("book_a","4.0")])
        self.assertEqual(a.evidence_sha256,b.evidence_sha256)

if __name__ == "__main__":
    unittest.main()
