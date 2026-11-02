"""Synthetic regression tests for odds-independent point-total evaluation."""
import unittest
from datetime import datetime, timezone, timedelta
from nba_totals_research.point_total_evaluation import TotalPredictionRow, evaluate_point_totals

TIP = datetime(2025, 1, 1, 20, tzinfo=timezone.utc)
SHA = "a" * 64

def row(game, expected, actual, at=None):
    return TotalPredictionRow(game, "v1", at or TIP - timedelta(hours=1),
                              TIP, expected, actual, SHA)

class TestPointTotalEvaluation(unittest.TestCase):
    def test_mae_rmse(self):
        result = evaluate_point_totals((row("a", 210.0, 200), row("b", 230.0, 230)))
        self.assertEqual(result["mae"], 5)
        self.assertAlmostEqual(result["rmse"], 7.0710678118654755)
        self.assertEqual(result["market_comparison"], "NOT_EVALUATED")
        self.assertFalse(result["publication_allowed"])

    def test_missing_predictions(self):
        with self.assertRaises(ValueError):
            evaluate_point_totals(())

    def test_lookahead(self):
        with self.assertRaises(ValueError):
            evaluate_point_totals((row("a", 210, 200, TIP),))

    def test_duplicates(self):
        with self.assertRaises(ValueError):
            evaluate_point_totals((row("a", 210, 200), row("a", 220, 200)))

    def test_invalid_evidence(self):
        from dataclasses import replace
        with self.assertRaises(ValueError):
            evaluate_point_totals((replace(row("a", 210, 200), prediction_evidence_sha256="unknown"),))

    def test_invalid_total(self):
        with self.assertRaises(ValueError):
            evaluate_point_totals((row("a", float("nan"), 200),))
        with self.assertRaises(ValueError):
            evaluate_point_totals((row("a", 210, -1),))

if __name__ == "__main__":
    unittest.main()
