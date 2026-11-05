import json
import tempfile
import unittest
from pathlib import Path
from nhl_evidence.single_event import capture_one_event

START = "2026-11-06T00:00:00Z"
RECEIPT = "2026-11-05T20:00:00Z"

def fixture():
    return json.dumps({"id":"odds-1","commence_time":START,
        "home_team":"Dallas Stars","away_team":"Columbus Blue Jackets",
        "bookmakers":[{"last_update":"2026-11-05T19:50:00Z",
            "markets":[{"last_update":"2026-11-05T19:51:00Z",
                "key":"totals","outcomes":[{"name":"Over","point":5.5,"price":-110}]}]}]}).encode()

def kwargs(folder):
    return dict(raw_odds=fixture(),fetched_at_utc=RECEIPT,
        canonical_event_id="nhl-1",odds_event_id="odds-1",
        home_team="Dallas Stars",away_team="Columbus Blue Jackets",
        commence_time=START,goalies={"home":{"status":"UNCONFIRMED"},
        "away":{"status":"UNCONFIRMED"}},prediction=None,archive_dir=folder)

class EvidenceTests(unittest.TestCase):
    def test_archive_and_readback(self):
        with tempfile.TemporaryDirectory() as d:
            result=capture_one_event(**kwargs(d))
            self.assertEqual(result["decision"],"HOLD")
            self.assertEqual(result["archive_type"],"LOCAL_NOT_WORM")
            self.assertEqual(len(list(Path(d).glob("*.json"))),2)
    def test_reject_future_receipt(self):
        with tempfile.TemporaryDirectory() as d:
            args=kwargs(d); args["fetched_at_utc"]=START
            with self.assertRaises(ValueError): capture_one_event(**args)
    def test_reject_wrong_team_order(self):
        with tempfile.TemporaryDirectory() as d:
            args=kwargs(d); args["home_team"]="Columbus Blue Jackets"
            with self.assertRaises(ValueError): capture_one_event(**args)
    def test_reject_duplicate_write(self):
        with tempfile.TemporaryDirectory() as d:
            capture_one_event(**kwargs(d))
            with self.assertRaises(FileExistsError): capture_one_event(**kwargs(d))
    def test_reject_future_market_timestamp(self):
        with tempfile.TemporaryDirectory() as d:
            args=kwargs(d)
            raw=json.loads(args["raw_odds"])
            raw["bookmakers"][0]["markets"][0]["last_update"]=START
            args["raw_odds"]=json.dumps(raw).encode()
            with self.assertRaises(ValueError): capture_one_event(**args)
    def test_reject_unproven_confirmation(self):
        with tempfile.TemporaryDirectory() as d:
            args=kwargs(d);args["goalies"]["home"]={"status":"CONFIRMED","player_id":"x"}
            with self.assertRaises(ValueError): capture_one_event(**args)

if __name__=="__main__": unittest.main()
