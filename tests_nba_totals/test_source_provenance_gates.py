"""Synthetic offline regression tests: research claims remain NO_GO."""
import json
import unittest
from nba_totals_research.source_provenance_gates import (
    EvidenceError, source_receipt, reconcile_game_ids, inspect_pregame_archive, _sha
)
TIP="2026-11-05T01:00:00Z"
EARLY="2026-11-04T18:00:00Z"

def source(name):
    raw = b'{"events":[]}' if name == "ESPN" else b'{"data":[]}'
    host = "https://site.api.espn.com/scoreboard" if name == "ESPN" else "https://api.balldontlie.io/v1/games"
    return source_receipt(name,raw,EARLY,_sha(raw),host)

def matches(away="GSW",home="NYK",tip=TIP,duplicate=False):
    e={"source_game_id":"421","away":"gs","home":"ny","scheduled_tipoff":TIP}
    b={"provider_game_id":"89","away":{"abbreviation":away},"home":{"abbreviation":home},
       "scheduled_tipoff_utc":tip}
    return reconcile_game_ids([e,e] if duplicate else [e],[b],source("ESPN"),
                              source("BALLDONTLIE"),{"gs":"GSW","ny":"NYK"})

def record():
    return {"source_game_id":"421","away":"gs","home":"ny","scheduled_tipoff":TIP,
            "generated_at_host_utc":"2026-11-04T19:00:00Z",
            "model_version":"rolling-team-total-v1","expected_total":221.4,
            "publication_allowed":False,"gate_status":"NO_GO"}

class TestSourceProvenance(unittest.TestCase):
    def test_real_bytes_hash_consistency_without_rights_claim(self):
        result=source("ESPN")
        self.assertEqual(result["status"],"LOCAL_INTEGRITY_ONLY")
        self.assertFalse(result["licensed_use_verified"])
        with self.assertRaises(EvidenceError):
            source_receipt("ESPN",b'{"events":[]}',EARLY,"a"*64,"https://site.api.espn.com/scoreboard")
    def test_balldontlie_single_game_payload(self):
        raw=b'{"data":{"id":89}}'
        receipt=source_receipt("BALLDONTLIE",raw,EARLY,_sha(raw),
                               "https://api.balldontlie.io/v1/games/89")
        self.assertEqual(receipt["status"],"LOCAL_INTEGRITY_ONLY")
        self.assertFalse(receipt["source_publication_verified"])

    def test_valid_local_identity_is_not_independent_proof(self):
        outcome=matches()
        self.assertEqual(outcome["matches"][0]["balldontlie_game_id"],"89")
        self.assertFalse(outcome["matches"][0]["evaluation_eligible"])
    def test_wrong_home_away_is_unmatched(self):
        self.assertEqual(matches(away="NYK",home="GSW")["unmatched_espn_ids"],["421"])
    def test_changed_tipoff_is_unmatched(self):
        self.assertEqual(matches(tip="2026-11-05T01:01:00Z")["unmatched_espn_ids"],["421"])
    def test_duplicate_provider_identity_fails(self):
        with self.assertRaises(EvidenceError):matches(duplicate=True)
    def test_original_forecast_archive_is_only_local(self):
        p=record();raw=json.dumps(p).encode()
        result=inspect_pregame_archive(p,raw,_sha(raw),"2026-11-04T19:01:00Z",matches()["matches"][0])
        self.assertEqual(result["status"],"LOCAL_PREGAME_ARCHIVE_ONLY")
        self.assertFalse(result["independent_timestamp_verified"])
        self.assertFalse(result["immutable_retention_verified"])
    def test_late_archive_fails(self):
        p=record();raw=json.dumps(p).encode()
        with self.assertRaises(EvidenceError):
            inspect_pregame_archive(p,raw,_sha(raw),"2026-11-05T01:05:00Z",matches()["matches"][0])
    def test_tampered_archive_fails(self):
        p=record();raw=json.dumps(p).encode()
        with self.assertRaises(EvidenceError):
            inspect_pregame_archive(p,raw,"a"*64,"2026-11-04T19:01:00Z",matches()["matches"][0])
    def test_wrong_prediction_identity_fails(self):
        p=record();p["away"]="ny";raw=json.dumps(p).encode()
        with self.assertRaises(EvidenceError):
            inspect_pregame_archive(p,raw,_sha(raw),"2026-11-04T19:01:00Z",matches()["matches"][0])

if __name__=="__main__":unittest.main()
