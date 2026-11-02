"""Offline synthetic historical quote contract regression tests."""
import json
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from nba_totals_research.historical_quotes import Rights, parse_quote, ingest_file, exact_match, settle
from nba_totals_research.core import PaperAssessment, Market

FIXTURE = Path(__file__).parent / "fixtures" / "historical_quotes_synthetic.json"
AT = datetime(2026,1,1,17,58,30,tzinfo=timezone.utc)
GAME = "123e4567-e89b-42d3-a456-426614174000"
H = "a"*64

class HistoricalQuoteTests(unittest.TestCase):
    def rights(self, **overrides):
        return replace(Rights("synthetic_fixture","synthetic-only-license",True,
                              AT+timedelta(days=1),"test-only"),**overrides)

    def item(self):
        return json.loads(FIXTURE.read_text())[0]

    def quote(self):
        return parse_quote(self.item())

    def test_synthetic_ingest(self):
        result = ingest_file(FIXTURE,self.rights(),AT,expected_game_id=GAME,
                             expected_line=Decimal("220.5"),expected_selection="OVER",
                             expected_bookmaker_id="synthetic_book")
        self.assertEqual(result["quote_count"],1)
        self.assertFalse(result["publication_allowed"])

    def test_half_point_never_pushes(self):
        self.assertEqual(settle("OVER",Decimal("220.5"),221),"WIN")
        self.assertEqual(settle("OVER",Decimal("220.5"),220),"LOSE")

    def test_integer_push(self):
        self.assertEqual(settle("UNDER",Decimal("220"),220),"PUSH")

    def test_overtime_settlement(self):
        self.assertEqual(settle("OVER",Decimal("220.5"),225),"WIN")

    def test_unlicensed_source_rejected(self):
        with self.assertRaises(ValueError):
            self.quote().validate(self.rights(historical_analysis_allowed=False),AT)

    def test_expired_rights_rejected(self):
        with self.assertRaises(ValueError):
            self.quote().validate(self.rights(expires_at=AT),AT)

    def test_stale_quote_rejected(self):
        with self.assertRaises(ValueError):
            replace(self.quote(),observed_at=AT-timedelta(minutes=3)).validate(self.rights(),AT)

    def test_naive_timezone_rejected(self):
        with self.assertRaises(ValueError):
            replace(self.quote(),observed_at=AT.replace(tzinfo=None)).validate(self.rights(),AT)

    def test_wrong_game_and_line_rejected(self):
        for overrides in ({"game_id":"123e4567-e89b-42d3-a456-426614174001"},
                          {"line":Decimal("221.5")}):
            with tempfile.TemporaryDirectory() as t:
                obj=self.item()
                obj.update({k:str(v) for k,v in overrides.items()})
                path=Path(t)/"quotes.json"
                path.write_text(json.dumps([obj]))
                with self.assertRaises(ValueError):
                    ingest_file(path,self.rights(),AT,expected_game_id=GAME,
                                expected_line=Decimal("220.5"),expected_selection="OVER",
                                expected_bookmaker_id="synthetic_book")

    def test_duplicate_records_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            path=Path(t)/"quotes.json"
            path.write_text(json.dumps([self.item(),self.item()]))
            with self.assertRaises(ValueError):
                ingest_file(path,self.rights(),AT,expected_game_id=GAME,
                            expected_line=Decimal("220.5"),expected_selection="OVER",
                            expected_bookmaker_id="synthetic_book")

    def test_exact_match_assessment(self):
        q=self.quote()
        paper=PaperAssessment(Market(GAME,Decimal("220.5"),"OVER"),"synthetic_book",
            Decimal("1.95"),Decimal(".55"),Decimal("0"),Decimal(".45"),Decimal(".0725"),
            "synthetic-model",AT,"synthetic-001",H,H,"PAPER_CANDIDATE")
        self.assertTrue(exact_match(q,paper,self.rights()))
        self.assertFalse(exact_match(q,replace(paper,bookmaker="other_book"),self.rights()))
        self.assertFalse(exact_match(q,replace(paper,decimal_odds=Decimal("1.90")),self.rights()))

if __name__ == "__main__":
    unittest.main()
