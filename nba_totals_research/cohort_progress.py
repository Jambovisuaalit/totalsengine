"""Research-only 100-game forward cohort checkpoint.

Never upgrades GitHub-host timestamps to independent provenance or
provisional MAE/RMSE to externally verified performance.
"""
from __future__ import annotations
import math


def cohort_progress(report: dict, *, target: int = 100) -> dict:
    """Calculate milestones from the existing, deduplicated settlement report.

    Score and identity validation must occur upstream in score_forecasts.
    """
    if type(target) is not int or target < 1:
        raise ValueError("Invalid paper cohort target")
    keys = ("n_input_forecasts", "n_unique_forecasts", "n_duplicates_discarded",
            "n_scored", "n_pending", "n_identity_mismatches")
    if any(type(report.get(k)) is not int or report[k] < 0 for k in keys):
        raise ValueError("Invalid cohort counts")
    raw, unique, duplicates, scored, pending, mismatched = (report[k] for k in keys)
    if (raw != unique + duplicates
            or unique != scored + pending + mismatched
            or scored != len(report.get("scored_rows", []))):
        raise ValueError("Inconsistent settlement denominators")
    if report.get("gate_status") != "NO_GO" or report.get("publication_allowed") is not False:
        raise ValueError("Research safety gates absent")
    mae, rmse = report.get("mae"), report.get("rmse")
    if scored == 0:
        if mae is not None or rmse is not None:
            raise ValueError("Accuracy without settled games")
    elif (type(mae) not in (float, int) or type(rmse) not in (float, int)
          or not math.isfinite(mae) or not math.isfinite(rmse)
          or mae < 0 or rmse < mae):
        raise ValueError("Non-finite or inconsistent accuracy")
    return {
        "cohort_type": "PROVISIONAL_FORWARD_PAPER_ONLY",
        "target_unique_game_model_pairs": target,
        "n_input_forecast_rows": raw,
        "n_unique_game_model_pairs": unique,
        "n_remaining_to_target": max(0, target - unique),
        "completion_pct": round(100 * min(unique, target) / target, 2),
        "n_duplicate_rows_discarded": duplicates,
        "n_final_scored_after_delay": scored,
        "n_pending_result_or_six_hour_delay": pending,
        "n_identity_mismatches": mismatched,
        "provisional_mae": mae,
        "provisional_rmse": rmse,
        "independently_verified_count": 0,
        "independent_timestamp_verified": False,
        "evaluation_eligible": False,
        "publication_allowed": False,
        "gate_status": "NO_GO",
    }
