"""Offline synthetic regression tests for scheduled NBA forecast collection."""
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from nba_totals_research.scheduled_paper_collector import forecast, extract, run, team_code

NOW = datetime(2026, 11, 2, 16, tzinfo=timezone.utc)

def game(gid, away, home, start, status="FINAL", points=100):
    item = {"source_game_id": gid, "away": away, "home": home,
            "scheduled_tipoff": start.isoformat(), "status": status}
    if status == "FINAL":
        item.update(score_away=points, score_home=points)
    return item

class TestCollector(unittest.TestCase):
    def test_team_aliases(self):
        self.assertEqual(team_code("GSW"), "gs")
        self.assertEqual(team_code("WAS"), "wsh")
        with self.assertRaises(ValueError):
            team_code("UNKNOWN")

    def test_forward_prediction_from_completed_games(self):
        games = [
            game(str(i), team, "bos", NOW-timedelta(days=10-i), points=110+i)
            for team in ["gs","ny"] for i in range(3)
        ]
        games.append(game("future", "gs", "ny", NOW+timedelta(hours=8), "SCHEDULED"))
        output = forecast(games, at=NOW)
        self.assertEqual(len(output), 1)
        self.assertEqual(output[0]["expected_total"], 222.0)
        self.assertFalse(output[0]["evaluation_eligible"])
        self.assertFalse(output[0]["publication_allowed"])

    def test_insufficient_history_is_skipped(self):
        games = [game("future", "gs", "ny", NOW+timedelta(hours=8), "SCHEDULED")]
        self.assertEqual(forecast(games, at=NOW), [])

    def test_in_game_cannot_be_predicted(self):
        games = [game("now", "gs", "ny", NOW+timedelta(hours=8), "LIVE")]
        self.assertEqual(forecast(games, at=NOW), [])

    def test_final_within_48_hours_excluded(self):
        games = [
            game(str(i), team, "bos", NOW-timedelta(days=3-i), points=100)
            for team in ["gs", "ny"] for i in range(3)
        ]
        games.append(game("future", "gs", "ny", NOW+timedelta(hours=8), "SCHEDULED"))
        self.assertEqual(forecast(games, at=NOW), [])

    def test_source_conflict_fails_closed(self):
        def event(start):
            return {"events":[{"id":"x","date":start.isoformat(),"status":{"type":{"state":"pre","completed":False}},
               "competitions":[{"competitors":[
                  {"homeAway":"home","team":{"abbreviation":"NYK"}},
                  {"homeAway":"away","team":{"abbreviation":"GSW"}}]}]}]}
        raw1 = json.dumps(event(NOW+timedelta(hours=8))).encode()
        raw2 = json.dumps(event(NOW+timedelta(hours=9))).encode()
        with self.assertRaises(ValueError):
            extract({"day1":raw1,"day2":raw2})

    def test_run_writes_source_manifest_and_hashes(self):
        payload = json.dumps({"events":[]}).encode()
        with tempfile.TemporaryDirectory() as tmp:
            result = run(Path(tmp), now=NOW, fetch=lambda day: payload)
            self.assertEqual(result["n_forecasts"],0)
            self.assertEqual(result["n_source_days"],38)
            self.assertEqual(len(list((Path(tmp)/"source_snapshots").glob("*.json"))),38)
            self.assertFalse(result["publication_allowed"])

if __name__ == "__main__":
    unittest.main()
