"""Point-in-time NBA source intake with rights and pregame gates.

Does NOT download data, assert source licensing, or certify host timestamps.
Only exact bytes first collected during an approved workflow are eligible
for subsequent independent Sigstore and chronological verification.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def utc(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Timezone-aware datetime required")
    return value.astimezone(timezone.utc)


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def assert_rights(policy: dict, *, source_id: str, endpoint_id: str, captured_at):
    """Approve only a separately curated, time-bound grant, not source claims."""
    if not isinstance(policy, dict) or policy.get("schema") != 1:
        raise ValueError("Validated rights registry required")
    if policy.get("review_status") != "APPROVED":
        raise ValueError("Provider rights not approved")
    if policy.get("source_id") != source_id or policy.get("endpoint_id") != endpoint_id:
        raise ValueError("Rights scope mismatch")
    if (policy.get("allow_capture") is not True
            or policy.get("allow_raw_retention") is not True
            or policy.get("allow_sigstore_digest") is not True
            or not policy.get("review_reference")
            or not policy.get("reviewed_by")):
        raise ValueError("Missing evidence-backed source rights")
    start, end = utc(policy["valid_from_utc"]), utc(policy["valid_until_utc"])
    if not start <= utc(captured_at) < end:
        raise ValueError("Source license outside validity window")
    return True


def freeze_source(*, source_raw: bytes, source_id: str, endpoint_id: str,
                  source_record_id: str, fetched_at_utc, collected_at_utc,
                  event_id: str, scheduled_start_utc,
                  event_state_raw: bytes, observed_state: str,
                  event_state_observed_at_utc, policy: dict,
                  feature_as_of_utc, prediction_created_at_utc,
                  max_clock_skew_seconds=10) -> tuple[dict, dict[str, bytes]]:
    """Prepare provenance before prediction; proof is pending Sigstore verification.

    Caller must supply raw bytes acquired in this run. Provider assertion and
    availability are NOT inferred from a source's public URL.
    """
    import math
    if not source_raw or not isinstance(source_raw, bytes):
        raise ValueError("Raw original bytes required")
    if not event_state_raw or not isinstance(event_state_raw, bytes):
        raise ValueError("Original pregame state response required")
    if any(not isinstance(v, str) or not v for v in
           (source_id, endpoint_id, source_record_id, event_id)):
        raise ValueError("Missing canonical source and event identifiers")
    fetch, collected = utc(fetched_at_utc), utc(collected_at_utc)
    schedule = utc(scheduled_start_utc)
    state_at = utc(event_state_observed_at_utc)
    features_at = utc(feature_as_of_utc)
    predicted_at = utc(prediction_created_at_utc)
    if not isinstance(max_clock_skew_seconds, int) or not 0 <= max_clock_skew_seconds <= 30:
        raise ValueError("Invalid clock policy")
    if not (fetch <= collected <= features_at <= predicted_at < schedule):
        raise ValueError("Source, features or prediction did not precede scheduled start")
    if (collected - fetch).total_seconds() > max_clock_skew_seconds:
        raise ValueError("Source captured too far from evidence collection")
    if observed_state != "PRE_GAME" or not state_at <= collected:
        raise ValueError("Pregame state unverified")
    if (collected - state_at).total_seconds() > 120:
        raise ValueError("Stale pregame state")
    assert_rights(policy, source_id=source_id, endpoint_id=endpoint_id,
                  captured_at=fetch)
    blobs = {"source_original.json": source_raw,
             "event_state_original.json": event_state_raw}
    manifest = {
        "schema": 1,
        "kind": "REAL_SOURCE_CAPTURE_PENDING_EXTERNAL_VERIFICATION",
        "source_id": source_id,
        "endpoint_id": endpoint_id,
        "source_record_id": source_record_id,
        "event_id": event_id,
        "scheduled_start_utc": schedule.isoformat(),
        "fetched_at_utc": fetch.isoformat(),
        "collected_at_utc": collected.isoformat(),
        "features_as_of_utc": features_at.isoformat(),
        "prediction_created_at_utc": predicted_at.isoformat(),
        "event_state_observed_at_utc": state_at.isoformat(),
        "event_state": observed_state,
        "rights_review_reference": policy["review_reference"],
        "rights_policy_sha256": sha256(canonical(policy)),
        "artifacts": {name: {"sha256": sha256(raw), "size": len(raw)}
                      for name, raw in sorted(blobs.items())},
        "actual_start_utc": None,
        "actual_start_verified": False,
        "signature_verified": False,
        "source_availability_verified": False,
        "evaluation_eligible": False,
        "publication_allowed": False,
        "gate": "HOLD",
    }
    return manifest, blobs


def validate_local(manifest: dict, blobs: dict[str, bytes]) -> bool:
    if manifest.get("gate") != "HOLD" or manifest.get("evaluation_eligible") is not False:
        raise ValueError("Unapproved evaluation promotion")
    if manifest.get("publication_allowed") is not False or manifest.get("signature_verified") is not False:
        raise ValueError("Unapproved publication/signature promotion")
    if set(manifest["artifacts"]) != set(blobs):
        raise ValueError("Incomplete evidence")
    for name, info in manifest["artifacts"].items():
        if len(blobs[name]) != info["size"] or sha256(blobs[name]) != info["sha256"]:
            raise ValueError("Original data tampered")
    if utc(manifest["prediction_created_at_utc"]) >= utc(manifest["scheduled_start_utc"]):
        raise ValueError("Prediction was not pre-schedule")
    return True
