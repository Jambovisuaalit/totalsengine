"""Strict historical result/prediction join. Research-only, no odds or ROI."""
import csv
import hashlib
import json
from datetime import datetime, timezone
from math import sqrt, isfinite
from pathlib import Path

def _utc(value):
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Timezone-aware timestamp required")
    return dt.astimezone(timezone.utc)

def _digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def evaluate_historical_predictions(results_csv, predictions_jsonl, *,
                                    expected_results_sha256, evidence_registry):
    """Join by exact date/away/home; registry assertions require external verification.

    Predictions JSONL: date, away, home, model_version, expected_total,
    predicted_at, scheduled_tipoff, prediction_evidence_sha256.
    Registry keyed by SHA: verified, source_record_id, recorded_at, feature_cutoff.
    This function checks assertions but cannot authenticate registry provenance.
    """
    if _digest(results_csv) != expected_results_sha256:
        raise ValueError("Results file hash mismatch")
    with open(results_csv, newline="", encoding="utf-8-sig") as f:
        results = list(csv.DictReader(f))
    keys = [(r["date"], r["away"].strip().lower(), r["home"].strip().lower()) for r in results]
    if len(keys) != len(set(keys)):
        raise ValueError("Ambiguous game keys")
    lookup = dict(zip(keys, results))
    seen, matched = set(), []
    with open(predictions_jsonl, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            p = json.loads(line)
            key = (p["date"], p["away"].strip().lower(), p["home"].strip().lower())
            if key not in lookup:
                raise ValueError("Unmatched game")
            identity = (key, p["model_version"])
            if identity in seen:
                raise ValueError("Duplicate game/model prediction")
            seen.add(identity)
            sha = p["prediction_evidence_sha256"]
            if len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha):
                raise ValueError("Invalid evidence hash")
            proof = evidence_registry.get(sha)
            if not proof or proof.get("verified") is not True or not proof.get("source_record_id"):
                raise ValueError("Missing verified evidence registry entry")
            predicted, tipoff = _utc(p["predicted_at"]), _utc(p["scheduled_tipoff"])
            if not (predicted < tipoff and _utc(proof["recorded_at"]) <= predicted
                    and _utc(proof["feature_cutoff"]) <= predicted):
                raise ValueError("Prediction or feature timing invalid")
            expected = float(p["expected_total"])
            if not isfinite(expected):
                raise ValueError("Non-finite prediction")
            actual = int(lookup[key]["score_away"]) + int(lookup[key]["score_home"])
            matched.append({"game_key": key, "model_version": p["model_version"],
                            "expected_total": expected, "actual_total": actual,
                            "evidence_sha256": sha})
    if not matched:
        raise ValueError("No verified predictions")
    errors = [r["expected_total"] - r["actual_total"] for r in matched]
    return {"evaluation_type": "point_total_only", "n_games": len(errors),
            "mae": sum(map(abs, errors)) / len(errors),
            "rmse": sqrt(sum(e*e for e in errors) / len(errors)),
            "market_comparison": "NOT_EVALUATED",
            "externally_verified": False, "publication_allowed": False,
            "gate_status": "NO_GO", "results_sha256": expected_results_sha256}
