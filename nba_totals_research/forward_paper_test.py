"""Forward paper-test capture and settlement. Offline, fail-closed, no wagers.

Local timestamps and immutable files are NOT independently attested. A verified
RFC3161 token must be stored and checked separately before an observation can
be classified as independently timestamped.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

SHA = re.compile(r"^[0-9a-f]{64}$")
ID = re.compile(r"^[A-Za-z0-9_.:-]{1,120}$")


def _utc(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Aware UTC-compatible timestamp required")
    return dt.astimezone(timezone.utc)


def _canonical(record: dict) -> bytes:
    return json.dumps(record, sort_keys=True, separators=(",", ":"),
                      allow_nan=False).encode("utf-8")


def _write_once(directory: Path, filename: str, raw: bytes) -> Path:
    if directory.is_symlink():
        raise ValueError("Symlink directory forbidden")
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    target = directory / filename
    if target.is_symlink():
        raise ValueError("Symlink target forbidden")
    with target.open("xb") as stream:
        os.chmod(target, 0o600)
        stream.write(raw)
        stream.flush()
        os.fsync(stream.fileno())
    return target


def capture_prediction(directory: Path, *, game_id: str, model_version: str,
                       scheduled_tipoff: str, feature_cutoff: str,
                       input_sha256: str, model_sha256: str,
                       expected_total: str, generated_at: str,
                       clock=None) -> dict:
    """Capture one prediction before tipoff, with host-clock guards.

    Caller-supplied feature_cutoff is only an assertion until source availability
    has been verified. No automatic TSA request or 'verified' claim is made.
    """
    now = (clock or (lambda: datetime.now(timezone.utc)))()
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Aware host clock required")
    if not ID.fullmatch(game_id) or not ID.fullmatch(model_version):
        raise ValueError("Invalid identifiers")
    if not SHA.fullmatch(input_sha256) or not SHA.fullmatch(model_sha256):
        raise ValueError("Content hashes required")
    try:
        value = Decimal(expected_total)
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Invalid expected total") from exc
    if not value.is_finite() or not 0 < value < 500:
        raise ValueError("Expected total outside admissible range")
    generated = _utc(generated_at)
    tipoff = _utc(scheduled_tipoff)
    cutoff = _utc(feature_cutoff)
    if not cutoff <= generated <= now.astimezone(timezone.utc) < tipoff:
        raise ValueError("Invalid feature, generation or capture timing")
    record = {
        "schema_version": 1, "type": "NBA_POINT_TOTAL_FORECAST",
        "game_id": game_id, "model_version": model_version,
        "model_sha256": model_sha256, "input_sha256": input_sha256,
        "generated_at": generated.isoformat(), "captured_at_host": now.astimezone(timezone.utc).isoformat(),
        "feature_cutoff": cutoff.isoformat(), "scheduled_tipoff": tipoff.isoformat(),
        "expected_total": str(value),
        "timestamp_trust": "LOCAL_HOST_UNATTESTED",
        "source_availability_verified": False,
        "external_timestamp_verified": False, "publication_allowed": False,
    }
    raw = _canonical(record)
    digest = hashlib.sha256(raw).hexdigest()
    path = _write_once(Path(directory) / "predictions", f"{game_id}--{model_version}.json", raw)
    return {"prediction_sha256": digest, "path": str(path),
            "external_timestamp_verified": False, "gate_status": "NO_GO"}


def settle_prediction(directory: Path, *, game_id: str, model_version: str,
                      score_home: int, score_away: int, result_source_sha256: str,
                      result_observed_at: str, clock=None) -> dict:
    """Record settled scores separately: never mutate the original prediction."""
    if not ID.fullmatch(game_id) or not ID.fullmatch(model_version):
        raise ValueError("Invalid identifiers")
    if any(type(x) is not int or x < 0 for x in (score_home, score_away)):
        raise ValueError("Invalid scores")
    if not SHA.fullmatch(result_source_sha256):
        raise ValueError("Result source digest required")
    path = Path(directory) / "predictions" / f"{game_id}--{model_version}.json"
    raw = path.read_bytes()
    item = json.loads(raw)
    if item["game_id"] != game_id or item["model_version"] != model_version:
        raise ValueError("Prediction identity mismatch")
    now = (clock or (lambda: datetime.now(timezone.utc)))()
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Aware clock required")
    observed = _utc(result_observed_at)
    if not _utc(item["scheduled_tipoff"]) < observed <= now.astimezone(timezone.utc):
        raise ValueError("Invalid result timing")
    result = {
        "schema_version": 1, "type": "NBA_SETTLED_POINT_TOTAL",
        "game_id": game_id, "model_version": model_version,
        "prediction_sha256": hashlib.sha256(raw).hexdigest(),
        "score_home": score_home, "score_away": score_away,
        "actual_total": score_home + score_away,
        "result_observed_at": observed.isoformat(),
        "result_source_sha256": result_source_sha256,
        "result_source_independently_verified": False,
        "publication_allowed": False,
    }
    output = _write_once(Path(directory) / "settlements",
                         f"{game_id}--{model_version}.json", _canonical(result))
    return {"path": str(output), "actual_total": result["actual_total"],
            "gate_status": "NO_GO"}


def audit_pair(directory: Path, *, game_id: str, model_version: str) -> dict:
    """Verify local hashes/links only; report a hold until external proofs exist."""
    root = Path(directory)
    p = root / "predictions" / f"{game_id}--{model_version}.json"
    s = root / "settlements" / f"{game_id}--{model_version}.json"
    raw = p.read_bytes()
    prediction = json.loads(raw)
    settlement = json.loads(s.read_bytes())
    if settlement["prediction_sha256"] != hashlib.sha256(raw).hexdigest():
        raise ValueError("Settlement references altered prediction")
    if (prediction["game_id"], prediction["model_version"]) != (game_id, model_version):
        raise ValueError("Prediction identity mismatch")
    if (settlement["game_id"], settlement["model_version"]) != (game_id, model_version):
        raise ValueError("Settlement identity mismatch")
    predicted = Decimal(prediction["expected_total"])
    actual = settlement["actual_total"]
    return {"game_id": game_id, "model_version": model_version,
            "absolute_error": str(abs(predicted - actual)),
            "prediction_sha256": settlement["prediction_sha256"],
            "local_integrity_valid": True, "external_timestamp_verified": False,
            "source_availability_verified": False,
            "evaluation_eligible": False, "gate_status": "NO_GO",
            "publication_allowed": False}
