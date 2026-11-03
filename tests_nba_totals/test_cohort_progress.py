"""Synthetic tests for provisional 100-game reporting."""
import unittest
from nba_totals_research.cohort_progress import cohort_progress


def report(*, raw=4, unique=3, duplicates=1, scored=1,
           pending=1, mismatched=1, mae=5.0, rmse=5.0):
    return {
        "n_input_forecasts": raw, "n_unique_forecasts": unique,
        "n_duplicates_discarded": duplicates, "n_scored": scored,
        "n_pending": pending, "n_identity_mismatches": mismatched,
        "scored_rows": [{}] * scored, "mae": mae, "rmse": rmse,
        "gate_status": "NO_GO", "publication_allowed": False,
    }


class PaperCohortTests(unittest.TestCase):
    def test_milestone_with_real_denominators(self):
        x = cohort_progress(report())
        self.assertEqual(x["n_unique_game_model_pairs"], 3)
        self.assertEqual(x["n_remaining_to_target"], 97)
        self.assertEqual(x["completion_pct"], 3.0)
        self.assertEqual(x["n_final_scored_after_delay"], 1)
        self.assertEqual(x["n_pending_result_or_six_hour_delay"], 1)
        self.assertEqual(x["n_duplicate_rows_discarded"], 1)
        self.assertEqual(x["n_identity_mismatches"], 1)
        self.assertEqual(x["provisional_mae"], 5.0)
        self.assertEqual(x["independently_verified_count"], 0)
        self.assertFalse(x["publication_allowed"])

    def test_empty_cohort_has_no_accuracy(self):
        x=cohort_progress(report(raw=0,unique=0,duplicates=0,
                                 scored=0,pending=0,mismatched=0,
                                 mae=None,rmse=None))
        self.assertEqual(x["n_remaining_to_target"],100)
        self.assertIsNone(x["provisional_rmse"])

    def test_duplicate_rows_do_not_inflate_100_target(self):
        x=cohort_progress(report(raw=103,unique=3,duplicates=100,
                                 scored=0,pending=3,mismatched=0,
                                 mae=None,rmse=None))
        self.assertEqual(x["n_remaining_to_target"],97)

    def test_denominator_mismatch_is_blocked(self):
        with self.assertRaises(ValueError):
            cohort_progress(report(unique=4))

    def test_metrics_without_scored_games_blocked(self):
        with self.assertRaises(ValueError):
            cohort_progress(report(raw=1,unique=1,duplicates=0,
                                   scored=0,pending=1,mismatched=0,
                                   mae=0.0,rmse=0.0))

    def test_publication_claim_blocked(self):
        x=report()
        x["publication_allowed"]=True
        with self.assertRaises(ValueError):
            cohort_progress(x)

    def test_100_target_is_not_an_external_verification(self):
        x=cohort_progress(report(raw=102,unique=100,duplicates=2,
                                 scored=100,pending=0,mismatched=0))
        self.assertEqual(x["completion_pct"],100)
        self.assertEqual(x["n_remaining_to_target"],0)
        self.assertEqual(x["independently_verified_count"],0)
        self.assertFalse(x["evaluation_eligible"])

if __name__=="__main__":
    unittest.main()
