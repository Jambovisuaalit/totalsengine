"""Offline out-of-sample scoring; matched same-bookmaker market baseline."""
from __future__ import annotations
from dataclasses import dataclass
from math import sqrt, log
from statistics import mean
from .model_pipeline import ModelPrediction
from .core import Quote

@dataclass(frozen=True)
class EvaluationRow:
    prediction: ModelPrediction
    quote: Quote
    actual_total: int
    opposite_quote: Quote

def evaluate(rows: tuple[EvaluationRow, ...], *, bins: int = 10) -> dict:
    if not rows or bins < 2:
        raise ValueError("Nonempty evaluation and at least two bins required")
    errors, brier, market_brier, logloss, market_logloss = [], [], [], [], []
    bucket = [[] for _ in range(bins)]
    market_observations, game_results, point_forecasts = set(), {}, {}
    for row in rows:
        p, q = row.prediction, row.quote
        p.validate(q)
        other = row.opposite_quote
        other.validate(p.predicted_at)
        if (other.book != q.book or other.market.game_id != q.market.game_id or
                other.market.line != q.market.line or other.market.scope != q.market.scope or
                other.market.side == q.market.side or
                other.scheduled_tipoff != q.scheduled_tipoff):
            raise ValueError("Exact opposite same-bookmaker market required")
        if type(row.actual_total) is not int or row.actual_total < 0:
            raise ValueError("Invalid settled full-game total")
        game = p.market.game_id
        if game in game_results and game_results[game] != row.actual_total:
            raise ValueError("Conflicting settled total for game")
        game_results[game] = row.actual_total
        observation = (game, p.version, p.bookmaker, p.quote_id, p.market.line, p.market.side)
        if observation in market_observations:
            raise ValueError("Duplicate market prediction")
        market_observations.add(observation)
        point_key = (game, p.version)
        frozen = (p.expected_total, p.predicted_at)
        if point_key in point_forecasts and point_forecasts[point_key] != frozen:
            raise ValueError("Conflicting frozen game/model point forecast")
        if point_key not in point_forecasts:
            errors.append(float(p.expected_total) - row.actual_total)
            point_forecasts[point_key] = frozen
        if p.market.side == "OVER":
            outcome = int(row.actual_total > p.market.line)
            push = row.actual_total == p.market.line
        else:
            outcome = int(row.actual_total < p.market.line)
            push = row.actual_total == p.market.line
        if push:
            # Pushes count for total-point error, not binary outcome scoring.
            continue
        win = float(p.p_win)
        lose = float(p.p_lose)
        if win + lose <= 0:
            raise ValueError("No conditional win/lose mass")
        prob = win / (win + lose)
        # Two-sided proportional de-vig using prices for the identical market.
        implied = 1.0 / float(q.odds)
        opposite = 1.0 / float(other.odds)
        market = implied / (implied + opposite)
        if not 0 < market < 1:
            raise ValueError("Invalid market implied probability")
        brier.append((prob - outcome) ** 2)
        market_brier.append((market - outcome) ** 2)
        eps = 1e-15
        prob = min(max(prob, eps), 1-eps)
        market = min(max(market, eps), 1-eps)
        logloss.append(-outcome*log(prob)-(1-outcome)*log(1-prob))
        market_logloss.append(-outcome*log(market)-(1-outcome)*log(1-market))
        bucket[min(int(prob * bins), bins-1)].append((prob, outcome))
    if not brier:
        raise ValueError("No non-push settled observations")
    calibration = [
        {"bin": i, "count": len(values), "mean_predicted": mean(x for x,_ in values),
         "observed_rate": mean(y for _,y in values)}
        for i, values in enumerate(bucket) if values
    ]
    return {
        "schema_version": 2, "n_scored": len(brier), "n_total_errors": len(errors), "n_input": len(rows),
        "n_unique_game_model_pairs": len(point_forecasts),
        "point_error_basis": "one_frozen_forecast_per_game_model",
        "binary_score_basis": "unique_market_prediction_non_push",
        "mae": mean(abs(x) for x in errors),
        "rmse": sqrt(mean(x*x for x in errors)),
        "brier": mean(brier), "market_brier": mean(market_brier),
        "log_loss": mean(logloss), "market_log_loss": mean(market_logloss),
        "brier_skill_vs_market": 1 - mean(brier)/mean(market_brier) if mean(market_brier) else None,
        "calibration": calibration, "baseline_method": "same_book_two_way_proportional_devig",
        "probability_basis": "conditional_non_push",
        "externally_verified": False, "publication_allowed": False,
    }
