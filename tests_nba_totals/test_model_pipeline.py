"""Model pipeline contracts: no live data, no publication."""
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from pathlib import Path
from uuid import uuid4
from nba_totals_research.model_pipeline import PipelineSpec, Dataset, ModelPrediction, artifact_manifest
from nba_totals_research.model_evaluation import EvaluationRow, evaluate
from nba_totals_research.core import Market, Quote, SCOPE

T = datetime(2025, 1, 1, tzinfo=timezone.utc)
H = "a"*64

class ModelPipelineTests(unittest.TestCase):
    def spec(self):
        return PipelineSpec("nba-v0.1", "licensed_dataset", "rights-review-pending",
                            T, T+timedelta(days=10), T+timedelta(days=10),
                            T+timedelta(days=20), ("pace", "rest_days"))

    def test_nonoverlapping_windows(self):
        self.spec().validate()
        s = self.spec()
        with self.assertRaises(ValueError):
            PipelineSpec(s.version,s.source,s.license_reference,s.training_start,
                         s.validation_start+timedelta(days=1),s.validation_start,
                         s.validation_end,s.features).validate()

    def test_lookahead_rejected(self):
        with self.assertRaises(ValueError):
            Dataset("source","rights",H,T,T+timedelta(days=1),str(uuid4())).validate(T)

    def test_manifest_content_hashes(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            paths = {}
            for name in ("model","training_data","validation_data","evaluation_report"):
                path = root / name
                path.write_bytes(name.encode())
                paths[name] = path
            result = artifact_manifest(self.spec(), paths, (H,))
            self.assertFalse(result["publication_allowed"])
            self.assertEqual(set(result["artifacts"]),set(paths))

    def test_same_book_and_game_required(self):
        game = str(uuid4())
        market = Market(game,Decimal("220.5"),"OVER")
        tip = T + timedelta(days=30)
        at = tip-timedelta(minutes=62)
        quote = Quote(market,"book1",Decimal("1.95"),tip,at,at,H,"q1")
        pred = ModelPrediction("nba-v0.1",market,"book1","q1",at,tip,
                               Decimal(".55"),Decimal("0"),Decimal(".45"),Decimal("222"),H)
        pred.validate(quote)
        other = Quote(Market(game,Decimal("220.5"),"UNDER"),"book2",
                      Decimal("1.95"),tip,at,at,H,"q2")
        with self.assertRaises(ValueError):
            evaluate((EvaluationRow(pred,quote,223,other),))

if __name__ == "__main__":
    unittest.main()
