"""Offline fail-closed tests; fakes never count as external attestation."""
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from nba_totals_research.research_tsa_bundle import capture, validate_snapshot
from nba_totals_research.research_ledger import archive_forecast
from nba_totals_research.scheduled_paper_collector import canonical, digest

NOW=datetime(2026,11,3,16,tzinfo=timezone.utc)
def forecast():
    p={"source_game_id":"fixture-test","away":"bos","home":"ny",
       "scheduled_tipoff":(NOW+timedelta(hours=8)).isoformat(),
       "generated_at_host_utc":NOW.isoformat(),"model_version":"baseline",
       "expected_total":224.5,"evaluation_eligible":False,
       "publication_allowed":False,"gate_status":"NO_GO"}
    p["record_sha256"]=digest(canonical(p))
    return p

class TestTsaBundle(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir=Path(self.tmp.name)
        self.raw=canonical(forecast())+b"\n"
        (self.dir/"predictions.jsonl").write_bytes(self.raw)
        (self.dir/"manifest.json").write_bytes(canonical({
            "predictions_sha256":digest(self.raw),"n_forecasts":1,
            "generated_at_host_utc":NOW.isoformat(),"source_sha256_by_day":{}}))
    def test_snapshot_rejects_mutation_and_late_run(self):
        manifest=json.loads((self.dir/"manifest.json").read_text())
        self.assertEqual(len(validate_snapshot(self.raw,manifest,now=NOW)),1)
        with self.assertRaisesRegex(ValueError,"do not match"):
            validate_snapshot(self.raw+b" ",manifest,now=NOW)
        with self.assertRaisesRegex(ValueError,"after kickoff"):
            validate_snapshot(self.raw,manifest,now=NOW+timedelta(hours=9))
    def test_no_attestation_when_research_mode_is_not_halted(self):
        with patch.dict(os.environ,{"HALTED":"0","PUBLICATION_ALLOWED":"false"}):
            with self.assertRaisesRegex(ValueError,"research mode"):
                capture(self.dir,clock=lambda:NOW)
        self.assertFalse((self.dir/"timestamp-receipt.json").exists())
    def test_synthetic_stub_attests_bytes_only_and_remains_ineligible(self):
        def fake_attest(raw_hash,work,**kw):
            self.assertEqual(raw_hash,digest(self.raw))
            work.mkdir()
            (work/"request.tsq").write_bytes(b"synthetic request")
            (work/"response.tsr").write_bytes(b"synthetic response")
            (work/"timestamp-audit.json").write_bytes(json.dumps({
                "timestamp_response_text":"Status: Granted.\nTime stamp: Nov  3 16:01:00 2026 GMT"}).encode())
            return {"rfc3161_verified":True,"raw_sha256":raw_hash}
        with patch.dict(os.environ,{"HALTED":"1","PUBLICATION_ALLOWED":"false"}):
            result=capture(self.dir,clock=lambda:NOW,
                           attest=fake_attest,pin=lambda u,h:b"synthetic cert")
        self.assertEqual(result["status"],"PREGAME_RFC3161_TIMESTAMPED_RESEARCH_ONLY")
        receipt=json.loads((self.dir/"timestamp-receipt.json").read_bytes())
        self.assertFalse(receipt["evaluation_eligible"])
        self.assertFalse(receipt["immutable_worm_verified"])
        self.assertEqual(receipt["predictions_sha256"],digest(self.raw))
        self.assertEqual(receipt["signed_gen_time_utc"],(NOW+timedelta(minutes=1)).isoformat())
        # Stubs prove workflow integration, NOT cryptographic validity.
        with self.assertRaisesRegex(ValueError,"already exists"):
            with patch.dict(os.environ,{"HALTED":"1","PUBLICATION_ALLOWED":"false"}):
                capture(self.dir,clock=lambda:NOW,attest=fake_attest,pin=lambda u,h:b"x")
    def test_future_signed_date_is_rejected(self):
        def wrong(raw_hash,work,**kw):
            work.mkdir()
            (work/"request.tsq").write_bytes(b"q")
            (work/"response.tsr").write_bytes(b"r")
            (work/"timestamp-audit.json").write_bytes(json.dumps({
                "timestamp_response_text":"Time stamp: Nov  4 16:01:00 2026 GMT"}).encode())
            return {"rfc3161_verified":True,"raw_sha256":raw_hash}
        with patch.dict(os.environ,{"HALTED":"1","PUBLICATION_ALLOWED":"false"}):
            with self.assertRaisesRegex(ValueError,"after kickoff"):
                capture(self.dir,clock=lambda:NOW,attest=wrong,pin=lambda u,h:b"x")
        self.assertFalse((self.dir/"timestamp-receipt.json").exists())

if __name__=="__main__":
    unittest.main()
