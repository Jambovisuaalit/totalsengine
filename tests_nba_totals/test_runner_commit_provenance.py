"""Synthetic regression tests for Actions code identity and pregame ledger provenance."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from nba_totals_research.scheduled_paper_collector import canonical, digest, run
from nba_totals_research.research_ledger import archive_forecast
from nba_totals_research.forward_settlement import collect_long_term_forecasts

NOW = datetime(2026, 11, 3, 16, tzinfo=timezone.utc)
SHA = "a" * 40
OTHER = "b" * 40

def forecast_row():
    row = {"source_game_id":"100", "away":"bos", "home":"ny",
           "scheduled_tipoff":(NOW+timedelta(hours=8)).isoformat(),
           "generated_at_host_utc":NOW.isoformat(),
           "model_version":"rolling-team-total-v1", "expected_total":220.0,
           "evaluation_eligible":False, "publication_allowed":False, "gate_status":"NO_GO"}
    row["record_sha256"] = digest(canonical(row))
    return row

class TestCodeCommitProvenance(unittest.TestCase):
    def test_collector_manifest_binds_triggering_commit(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.dict("os.environ", {"GITHUB_SHA": SHA}):
                report=run(Path(temp),now=NOW,fetch=lambda _:b'{"events":[]}')
            self.assertEqual(report["runner_commit_sha"],SHA)
            self.assertEqual(json.loads((Path(temp)/"manifest.json").read_text())["runner_commit_sha"],SHA)

    def test_wrong_action_sha_rejects_before_ledger_write(self):
        with tempfile.TemporaryDirectory() as temp:
            p=Path(temp)
            row=forecast_row()
            raw=canonical(row)+b"\n"
            (p/"predictions.jsonl").write_bytes(raw)
            (p/"manifest.json").write_bytes(canonical({
                "generated_at_host_utc":NOW.isoformat(),
                "runner_commit_sha":OTHER,
                "predictions_sha256":digest(raw),"n_forecasts":1,
                "source_sha256_by_day":{},
            }))
            with patch.dict("os.environ", {"GITHUB_ACTIONS":"true","GITHUB_SHA":SHA}):
                with patch("nba_totals_research.research_ledger.create_only") as save:
                    with self.assertRaisesRegex(ValueError,"SHA mismatch"):
                        archive_forecast("org/repo","token",7,p,now=NOW+timedelta(minutes=2))
                    save.assert_not_called()

    def test_archive_keeps_commit_identity_and_no_go(self):
        with tempfile.TemporaryDirectory() as temp:
            p=Path(temp)
            row=forecast_row()
            raw=canonical(row)+b"\n"
            (p/"predictions.jsonl").write_bytes(raw)
            (p/"manifest.json").write_bytes(canonical({
                "generated_at_host_utc":NOW.isoformat(),
                "runner_commit_sha":SHA,
                "predictions_sha256":digest(raw),"n_forecasts":1,
                "source_sha256_by_day":{"2026-11-03":"c"*64},
            }))
            observed=[]
            def fake(*args):
                observed.append(args[-1])
                return {"status":"CREATED"}
            with patch.dict("os.environ", {"GITHUB_ACTIONS":"true","GITHUB_SHA":SHA}):
                with patch("nba_totals_research.research_ledger.create_only",fake):
                    archive_forecast("org/repo","token",7,p,now=NOW+timedelta(minutes=2))
            self.assertEqual(observed[0]["runner_commit_sha"],SHA)
            self.assertFalse(observed[0]["publication_allowed"])
            self.assertFalse(observed[0]["evaluation_eligible"])

    def test_settlement_rejects_origin_commit_mismatch(self):
        item=dict(forecast_row(),_github_run_id=7,_runner_commit_sha=SHA)
        origin={"id":7,"status":"completed","conclusion":"success","head_sha":OTHER,
                "head_branch":"main","path":".github/workflows/nba-forward-collection.yml",
                "created_at":(NOW-timedelta(minutes=2)).isoformat(),
                "updated_at":(NOW+timedelta(minutes=2)).isoformat()}
        with patch("nba_totals_research.forward_settlement.load_forecasts",return_value=[item]):
            with patch("nba_totals_research.forward_settlement.github_json",return_value=origin):
                with self.assertRaisesRegex(ValueError,"code SHA"):
                    collect_long_term_forecasts("org/repo","token")

if __name__=="__main__":
    unittest.main()
