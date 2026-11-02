"""Research-only scoring of NBA full-game point predictions; no odds required.

This module deliberately cannot score a bookmaker market or infer profitability.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import sqrt, isfinite
from statistics import mean


def _utc(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Timezone-aware timestamp required")
    return value.astimezone(timezone.utc)


@dataclass(frozen=True)
class TotalPredictionRow:
    game_id: str
    model_version: str
    predicted_at: datetime
    scheduled_tipoff: datetime
    expected_total: float
    actual_total: int
    prediction_evidence_sha256: str

    def validate(self) -> None:
        import re
        if not self.game_id or not self.model_version:
            raise ValueError("Game and model identifiers required")
        if not re.fullmatch(r"[0-9a-f]{64}", self.prediction_evidence_sha256):
            raise ValueError("Prediction evidence SHA256 required")
        if _utc(self.predicted_at) >= _utc(self.scheduled_tipoff):
            raise ValueError("Prediction must precede tipoff")
        if isinstance(self.actual_total, bool) or not isinstance(self.actual_total, int) or self.actual_total < 0:
            raise ValueError("Invalid full-game including-OT settled total")
        if isinstance(self.expected_total, bool) or not isinstance(self.expected_total, (int, float)) or not isfinite(self.expected_total):
            raise ValueError("Finite expected total required")


def evaluate_point_totals(rows: tuple[TotalPredictionRow, ...]) -> dict:
    """Score point forecasts only; no market comparison, EV, or ROI."""
    if not rows:
        raise ValueError("At least one prediction required")
    seen = set()
    errors = []
    for row in rows:
        row.validate()
        key = (row.game_id, row.model_version)
        if key in seen:
            raise ValueError("Duplicate game/model prediction")
        seen.add(key)
        errors.append(float(row.expected_total) - row.actual_total)
    return {
        "schema_version": 1,
        "evaluation_type": "model_point_total_only",
        "n_games": len(errors),
        "mae": mean(abs(e) for e in errors),
        "rmse": sqrt(mean(e * e for e in errors)),
        "mean_error": mean(errors),
        "market_comparison": "NOT_EVALUATED",
        "quote_data_verified": False,
        "externally_verified": False,
        "publication_allowed": False,
        "gate_status": "NO_GO",
    }
