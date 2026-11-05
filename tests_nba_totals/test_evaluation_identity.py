"""Regression: frozen point forecasts are not weighted by repeated markets."""
import unittest
from dataclasses import replace
from datetime import datetime, timezone, timedelta
from decimal import Decimal as D
from nba_totals_research.core import Market, Quote
from nba_totals_research.model_pipeline import ModelPrediction
from nba_totals_research.model_evaluation import EvaluationRow, evaluate

T = datetime(2025, 1, 1, tzinfo=timezone.utc)
H = 'a' * 64
G = '11111111-1111-4111-8111-111111111111'


def row(game=G, side='OVER', expected='222', actual=223, book='book1', quote_id='q1', line='220.5'):
    market = Market(game, D(line), side)
    tip = T + timedelta(minutes=62)
    quote = Quote(market, book, D('1.95'), tip, T, T, H, quote_id)
    opposite = replace(quote, market=replace(market, side='UNDER' if side == 'OVER' else 'OVER'), provider_quote_id=quote_id+'-opposite')
    pred = ModelPrediction('v1', market, book, quote_id, T, tip, D('.55'), D('0'), D('.45'), D(expected), H)
    return EvaluationRow(pred, quote, actual, opposite)


class EvaluationIdentityTests(unittest.TestCase):
    def test_identical_rows_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            evaluate((row(), row()))

    def test_conflicting_result_rejected_even_across_models(self):
        other = row(side='UNDER', actual=240)
        other = replace(other, prediction=replace(other.prediction, version='v2'))
        with self.assertRaisesRegex(ValueError, 'Conflicting settled'):
            evaluate((row(), other))

    def test_point_mae_is_not_weighted_by_number_of_bookmakers_or_sides(self):
        another = row(game='22222222-2222-4222-8222-222222222222', expected='210', actual=220)
        result = evaluate((row(), row(side='UNDER'), row(book='book2'), another))
        self.assertEqual(result['n_input'], 4)
        self.assertEqual(result['n_scored'], 4)
        self.assertEqual(result['n_total_errors'], 2)
        self.assertEqual(result['n_unique_game_model_pairs'], 2)
        self.assertEqual(result['mae'], 5.5)

    def test_different_frozen_total_or_time_rejected(self):
        for other in (row(side='UNDER', expected='225'),):
            with self.assertRaisesRegex(ValueError, 'Conflicting frozen'):
                evaluate((row(), other))
        other = row(side='UNDER')
        other = replace(other, prediction=replace(other.prediction, predicted_at=T+timedelta(seconds=1)))
        with self.assertRaisesRegex(ValueError, 'Conflicting frozen'):
            evaluate((row(), other))

    def test_push_counts_once_for_points_but_not_binary_metrics(self):
        push = row(line='223', actual=223)
        result = evaluate((push, row(game='22222222-2222-4222-8222-222222222222')))
        self.assertEqual(result['n_total_errors'], 2)
        self.assertEqual(result['n_scored'], 1)
