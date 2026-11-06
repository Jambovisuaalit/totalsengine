import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from nba_totals_research.synthetic_e2e import produce, verify
from nba_totals_research.release_gate import evaluate
from nba_totals_research.balldontlie_games_adapter import select_event, CapturedResponse


class SyntheticEndToEnd(unittest.TestCase):
    def test_chain_and_tamper_detection(self):
        with TemporaryDirectory() as td:
            path = Path(td) / "bundle"
            result = produce(path, commit="a"*40, run_id="123")
            self.assertEqual(result["gate"], "HOLD")
            self.assertTrue(verify(path)["local_integrity_verified"])
            (path / "features.json").write_bytes(b"tampered")
            with self.assertRaises(ValueError):
                verify(path)

    def test_release_gate_never_promotes_production(self):
        ci = {name: "success" for name in (
            "Root CI", "NBA research regression and evidence contracts",
            "NBA totals evidence core (synthetic)")}
        rights = {"review_status": "APPROVED", "allow_capture": True,
                  "allow_raw_retention": True}
        evidence = {name: True for name in (
            "sigstore_verified", "source_availability_verified",
            "actual_start_verified", "independent_oos_verified",
            "odds_provenance_verified")}
        r = evaluate(head_sha="a"*40, ci=ci, rights=rights,
                     source_evidence=evidence,
                     synthetic_receipt={"verification_status": "PASS_SYNTHETIC_ONLY"})
        self.assertEqual(r["synthetic_acceptance"], "PASS")
        self.assertEqual(r["production_release"], "HOLD")
        self.assertEqual(r["ev_signals"], "HOLD")
        self.assertEqual(r["automatic_bet_placement"], "DISABLED")

    def test_missing_receipt_and_pending_rights(self):
        r = evaluate(head_sha="a"*40, ci={}, synthetic_receipt=None,
                     rights={"review_status": "PENDING"})
        self.assertEqual(r["synthetic_acceptance"], "HOLD")
        self.assertIn("synthetic_sigstore", r["missing"])

    def test_bdl_iso_scheduled_status(self):
        game = {"id": 1, "status": "2026-11-08T02:00:00+00:00",
                "datetime": "2026-11-08T02:00:00Z", "period": 0,
                "home_team_score": 0, "visitor_team_score": 0}
        capture = CapturedResponse(raw=b"{}", url="test", fetched_at_utc="2026-11-07T00:00:00Z",
                                   received_at_utc="2026-11-07T00:00:01Z", http_date=None,
                                   source_sha256="0"*64, games=(game,))
        self.assertEqual(select_event(capture, "1")[1], "PRE_GAME")
        game["period"] = 1
        self.assertEqual(select_event(capture, "1")[1], "UNKNOWN_OR_LIVE")
        game["period"] = 0
        game["status"] = "2026-11-09T02:00:00Z"
        self.assertEqual(select_event(capture, "1")[1], "UNKNOWN_OR_LIVE")


if __name__ == "__main__":
    unittest.main()
