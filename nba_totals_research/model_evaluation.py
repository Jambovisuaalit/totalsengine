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
    market_opposite_odds: float
    opposite_book: str

def evaluate(rows: tuple[EvaluationRow, ...], *, bins: int = 10) -> dict:
    if not rows or bins < 2:
        raise ValueError("Nonempty evaluation and at least two bins required")
    errors, brier, market_brier, logloss, market_logloss = [], [], [], [], []
    bucket = [[] for _ in range(bins)]
    for row in rows:
        p, q = row.prediction, row.quote
        p.validate(q)
        if row.opposite_book != q.book or row.market_opposite_odds <= 1:
            raise ValueError("Same-bookmaker opposing price required")
        if type(row.actual_total) is not int or row.actual_total < 0:
            raise ValueError("Invalid settled full-game total")
        if p.market.side == "OVER":
            outcome = int(row.actual_total > p.market.line)
            push = row.actual_total == p.market.line
        else:
            outcome = int(row.actual_total < p.market.line)
            push = row.actual_total == p.market.line
        if push:
            # Pushes are excluded from binary conditional win/lose scoring.
            continue
        win = float(p.p_win)
        lose = float(p.p_lose)
        if win + lose <= 0:
            raise ValueError("No conditional win/lose mass")
        prob = win / (win + lose)
        # Two-sided proportional de-vig using prices for the identical market.
        implied = 1.0 / float(q.odds)
        opposite = 1.0 / row.market_opposite_odds
        market = implied / (implied + opposite)
        if not 0 < market < 1:
            raise ValueError("Invalid market implied probability")
        e = float(p.expected_total) - row.actual_total
        errors.append(e)
        brier.append((prob - outcome) ** 2)
        market_brier.append((market - outcome) ** 2)
        eps = 1e-15
        prob = min(max(prob, eps), 1-eps)
        market = min(max(market, eps), 1-eps)
        logloss.append(-outcome*log(prob)-(1-outcome)*log(1-prob))
        market_logloss.append(-outcome*log(market)-(1-outcome)*log(1-market))
        bucket[min(int(prob * bins), bins-1)].append((prob, outcome))
    if not errors:
        raise ValueError("No non-push settled observations")
    calibration = [
        {"bin": i, "count": len(values), "mean_predicted": mean(x for x,_ in values),
         "observed_rate": mean(y for _,y in values)}
        for i, values in enumerate(bucket) if values
    ]
    return {
        "schema_version": 1, "n_scored": len(errors), "n_input": len(rows),
        "mae": mean(abs(x) for x in errors),
        "rmse": sqrt(mean(x*x for x in errors)),
        "brier": mean(brier), "market_brier": mean(market_brier),
        "log_loss": mean(logloss), "market_log_loss": mean(market_logloss),
        "brier_skill_vs_market": 1 - mean(brier)/mean(market_brier) if mean(market_brier) else None,
        "calibration": calibration, "baseline_method": "same_book_two_way_proportional_devig",
        "probability_basis": "conditional_non_push",
        "externally_verified": False, "publication_allowed": False,
    }
