"""Regression tests for point-in-time source mapping and quote evidence bindings."""
import tempfile
import unittest
from dataclasses import replace
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from nba_totals_research.historical_evidence import GameMapping, SourceAvailability, bind_assessment, write_binding
from nba_totals_research.historical_quotes import Rights, parse_quote
from nba_totals_research.core import Market, PaperAssessment
from tests_nba_totals.test_historical_quotes import AT, GAME, H, HistoricalQuoteTests

class HistoricalEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.fixture = HistoricalQuoteTests()
        self.quote = self.fixture.quote()
        self.rights = self.fixture.rights()
        self.paper = PaperAssessment(
            Market(GAME,Decimal("220.5"),"OVER"),"synthetic_book",
            Decimal("1.95"),Decimal(".55"),Decimal("0"),Decimal(".45"),
            Decimal(".0725"),"synthetic-model",AT,"synthetic-001",H,H,"PAPER_CANDIDATE")
        self.mapping = GameMapping("synthetic_fixture","provider-game-001",GAME,H,"test-only",AT-timedelta(minutes=1))
        self.availability = SourceAvailability("synthetic_fixture","synthetic-001",AT-timedelta(seconds=20),H)

    def test_local_binding_is_not_external_evidence(self):
        result = bind_assessment(self.quote,self.paper,self.rights,self.mapping,self.availability)
        self.assertEqual(result["status"],"LOCAL_BINDING_ONLY")
        self.assertFalse(result["training_eligible"])
        self.assertFalse(result["publication_allowed"])
        with tempfile.TemporaryDirectory() as t:
            path = write_binding(result,Path(t))
            self.assertTrue(path.is_file())

    def test_mapping_wrong_game_rejected(self):
        with self.assertRaises(ValueError):
            bind_assessment(self.quote,self.paper,self.rights,
                            replace(self.mapping,canonical_game_id="123e4567-e89b-42d3-a456-426614174001"),
                            self.availability)

    def test_mapping_verified_after_prediction_rejected(self):
        with self.assertRaises(ValueError):
            bind_assessment(self.quote,self.paper,self.rights,
                            replace(self.mapping,verified_at=AT+timedelta(seconds=1)),
                            self.availability)

    def test_source_available_after_prediction_rejected(self):
        with self.assertRaises(ValueError):
            bind_assessment(self.quote,self.paper,self.rights,self.mapping,
                            replace(self.availability,available_at=AT+timedelta(seconds=1)))

    def test_source_available_before_provider_publication_rejected(self):
        with self.assertRaises(ValueError):
            bind_assessment(self.quote,self.paper,self.rights,self.mapping,
                            replace(self.availability,available_at=AT-timedelta(minutes=5)))

    def test_wrong_quote_id_rejected(self):
        with self.assertRaises(ValueError):
            bind_assessment(self.quote,self.paper,self.rights,self.mapping,
                            replace(self.availability,record_id="different"))

if __name__ == "__main__":
    unittest.main()
