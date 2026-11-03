"""Create-only research ledger tests with synthetic forecasts."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from nba_totals_research.research_ledger import (
    archive_forecast, archive_settlement, archive_path, create_only, load_forecasts)
from nba_totals_research.scheduled_paper_collector import canonical, digest

NOW = datetime(2026, 11, 2, 16, tzinfo=timezone.utc)


def record():
    row = {
        "source_game_id":"111","away":"bos","home":"ny",
        "scheduled_tipoff":(NOW + timedelta(hours=8)).isoformat(),
        "generated_at_host_utc":NOW.isoformat(),
        "model_version":"rolling-team-total-v1",
        "expected_total":220.5,"evaluation_eligible":False,
        "publication_allowed":False,"gate_status":"NO_GO",
    }
    row["record_sha256"] = digest(canonical(row))
    return row


class TestResearchLedger(unittest.TestCase):
    def test_backfilled_artifact_records_actual_import_time(self):
        import io
        import zipfile
        from nba_totals_research.research_ledger import import_verified_artifact
        p = record()
        buf = io.BytesIO()
        pred_bytes = canonical(p) + bytes([10])
        manifest = canonical({
            "predictions_sha256": digest(pred_bytes),
            "source_sha256_by_day": {"2026-11-01":"sha"},
            "generated_at_host_utc": NOW.isoformat(),
        })
        with zipfile.ZipFile(buf,"w") as z:
            z.writestr("manifest.json",manifest)
            z.writestr("predictions.jsonl",pred_bytes)
        captured=[]
        def fake(*args):
            captured.append(args[-1])
            return {"status":"CREATED"}
        run={"id":19,"updated_at":(NOW + timedelta(minutes=2)).isoformat()}
        checked=[dict(p, _github_run_id=19)]
        def missing(*args):
            raise HTTPError("https://api.github.com",404,"missing",{},None)
        with patch("nba_totals_research.research_ledger.read_record",missing):
            with patch("nba_totals_research.research_ledger.create_only",fake):
                import_verified_artifact("org/repo","token",run,buf.getvalue(),checked,
                                         now=NOW+timedelta(hours=10))
        self.assertTrue(captured[0]["retrospective_import"])
        self.assertEqual(captured[0]["generated_at_host_utc"],NOW.isoformat())
        self.assertEqual(captured[0]["ledger_submitted_at_host_utc"],
                         (NOW+timedelta(hours=10)).isoformat())

    def test_archive_path_rejects_traversal(self):
        self.assertEqual(archive_path("forecasts", 9), "forecasts/9.json")
        for kind, run_id in [("../forecasts", 9), ("forecasts", -1), ("settlements", "1/2")]:
            with self.assertRaises(ValueError):
                archive_path(kind, run_id)

    def test_create_only_never_requires_sha(self):
        calls = []
        def fake(repo, token, method, path, body=None):
            calls.append((method, path, body))
            return {"commit":{"sha":"sample-commit"}}
        with patch("nba_totals_research.research_ledger.api", fake):
            out = create_only("org/repo","token","forecasts/33.json",{"a":1})
        self.assertEqual(out["status"], "CREATED")
        self.assertEqual(calls[0][0], "PUT")
        self.assertNotIn("sha", calls[0][2])
        self.assertEqual(calls[0][2]["branch"], "research-ledger")

    def test_archive_forecast_fails_after_tipoff(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            rows=[record()]
            source=canonical(rows[0])+b"\n"
            (root/"predictions.jsonl").write_bytes(source)
            (root/"manifest.json").write_bytes(canonical({
                "generated_at_host_utc": NOW.isoformat(),
                "predictions_sha256":digest(source),
                "n_forecasts":1,"source_sha256_by_day":{},
            }))
            with patch("nba_totals_research.research_ledger.create_only") as send:
                with self.assertRaises(ValueError):
                    archive_forecast("org/repo","token",2,root,
                                     now=NOW+timedelta(hours=9))
            send.assert_not_called()

    def test_archive_forecast_copies_only_derived_hashes(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            rows=[record()]
            source=canonical(rows[0])+b"\n"
            (root/"predictions.jsonl").write_bytes(source)
            (root/"manifest.json").write_bytes(canonical({
                "generated_at_host_utc":NOW.isoformat(),
                "predictions_sha256":digest(source),
                "n_forecasts":1,"source_sha256_by_day":{"2026-11-01":"abc"},
            }))
            captured=[]
            def fake(repo, token, path, envelope):
                captured.append(envelope)
                return {"status":"CREATED"}
            # Without a signed token, create-only archive MUST fail closed.
            with patch("nba_totals_research.research_ledger.create_only",fake):
                with self.assertRaisesRegex(ValueError,"RFC3161"):
                    archive_forecast("org/repo","token",2,root,
                                     now=NOW+timedelta(minutes=2))
            self.assertFalse(captured)

    def test_settlement_rejects_publication(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/"report.json").write_bytes(canonical({
                "gate_status":"NO_GO","publication_allowed":True}))
            with self.assertRaises(ValueError):
                archive_settlement("org/repo","token",3,root)

    def test_ledger_conflict_fails_closed(self):
        def conflict(*args,**kwargs):
            raise HTTPError("url",422,"already exists",{},None)
        with patch("nba_totals_research.research_ledger.api", conflict):
            with patch("nba_totals_research.research_ledger.read_record",return_value=({},b"wrong")):
                with self.assertRaises(ValueError):
                    create_only("org/repo","token","forecasts/3.json",{"a":1})

    def test_load_forecasts_checks_hashes(self):
        item={"schema":1,"kind":"FORECAST_RUN_RESEARCH_ONLY","run_id":2,
              "rows":[record()],"n_forecasts":1,"gate_status":"NO_GO",
              "publication_allowed":False}
        def fake_api(*args,**kwargs):
            return {"truncated":False,"tree":[{"path":"forecasts/2.json"}]}
        with patch("nba_totals_research.research_ledger.api",fake_api):
            with patch("nba_totals_research.research_ledger.read_record",
                       return_value=({},canonical(item))):
                result=load_forecasts("org/repo","token")
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]["_github_run_id"],2)

if __name__=="__main__":
    unittest.main()
