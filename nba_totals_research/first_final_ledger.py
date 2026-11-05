"""Atomic first-observed FINAL registry.

Create-only, version-specific COMPLIANCE Object Lock evidence. A caller's
timestamp is metadata, not proof of original source publication. The S3 server
LastModified of the winning object is the conservative availability bound.
"""
from __future__ import annotations
import base64
import json
from datetime import datetime, timezone
from .prospective_market_bundle import utc, sha, canonical


def _validate(raw: bytes, game_id: str):
    if not isinstance(raw, bytes) or not raw or not game_id.isdecimal():
        raise ValueError("Original bytes and numeric ESPN game ID required")
    doc = json.loads(raw)
    events = [e for e in doc.get("events", []) if str(e.get("id")) == game_id]
    if len(events) != 1 or events[0].get("status", {}).get("type", {}).get("completed") is not True:
        raise ValueError("Exact source game must be FINAL")
    competitors = events[0].get("competitions", [])
    if len(competitors) != 1 or len(competitors[0].get("competitors", [])) != 2:
        raise ValueError("Invalid FINAL competitors")
    if any(not str(p.get("score", "")).isdigit() for p in competitors[0]["competitors"]):
        raise ValueError("Missing FINAL score")


def _code(error):
    response = getattr(error, "response", {})
    return str(response.get("Error", {}).get("Code", ""))


def register_first_final(*, client, bucket: str, game_id: str, raw: bytes,
                         fetched_at_utc, retain_until, source_url: str):
    """Return original winning immutable record under concurrent captures.

    No caller can overwrite first.json. Existing data MUST be read by its
    explicit version and validated. Does not enable evaluation or publication.
    """
    game_id = str(game_id)
    _validate(raw, game_id)
    observed = utc(fetched_at_utc)
    if observed > datetime.now(timezone.utc):
        raise ValueError("Fetch time in future")
    if not source_url.startswith("https://"):
        raise ValueError("HTTPS source URL required")
    if not bucket:
        raise ValueError("Bucket required")
    from .forward_pipeline import put_object_lock
    payload = canonical({
        "schema": 1,
        "source_game_id": game_id,
        "source_url": source_url,
        "fetched_at_utc": observed.isoformat(),
        "raw_sha256": sha(raw),
        "raw_b64": base64.b64encode(raw).decode("ascii"),
        "source_first_published_at_utc": None,
    })
    key = f"nba-history-first-final/{game_id}/first.json"
    try:
        pointer = put_object_lock(client, bucket=bucket, key=key, raw=payload,
                                  retain_until=retain_until)
    except Exception as exc:
        if _code(exc) not in {"PreconditionFailed", "412", "ConditionalRequestConflict"}:
            raise
        # Resolve a concurrent winner; never overwrite or backdate.
        head_current = client.head_object(Bucket=bucket, Key=key)
        version = head_current.get("VersionId")
        if not version:
            raise ValueError("First-observation winner has no version ID") from exc
        pointer = {"bucket": bucket, "key": key, "version_id": version,
                   "sha256": None}
    kwargs = {"Bucket": bucket, "Key": key, "VersionId": pointer["version_id"]}
    head = client.head_object(**kwargs)
    server_time = utc(head["LastModified"])
    locked = client.get_object_retention(**kwargs)["Retention"]
    if locked.get("Mode") != "COMPLIANCE" or utc(locked["RetainUntilDate"]) < utc(retain_until):
        raise ValueError("First observation not in valid COMPLIANCE retention")
    winner = client.get_object(**kwargs)["Body"].read()
    winner_obj = json.loads(winner)
    first_raw = base64.b64decode(winner_obj["raw_b64"], validate=True)
    _validate(first_raw, game_id)
    if (winner_obj["source_game_id"] != game_id or
        winner_obj["raw_sha256"] != sha(first_raw) or
        winner_obj["source_url"] != source_url or
        server_time < utc(winner_obj["fetched_at_utc"])):
        raise ValueError("First-observation ledger corrupted or mismatched")
    return {
        "source_game_id": game_id,
        "first_final_observed_at_utc": server_time.isoformat(),
        "first_fetched_at_utc": winner_obj["fetched_at_utc"],
        "original_raw_sha256": sha(first_raw),
        "immutable_first_final_ref": {
            "bucket": bucket, "key": key,
            "version_id": pointer["version_id"], "sha256": sha(winner),
            "stored_at_server_utc": server_time.isoformat()
        },
        "source_availability_verified": False,
        "evaluation_eligible": False,
    }


def verify_first_final_ref(*, client, row, original_raw: bytes, feature_at, now):
    """Verify that a selected FINAL version was in immutable storage pre-cutoff."""
    ref = row.get("immutable_first_final_ref")
    if not isinstance(ref, dict) or not all(ref.get(k) for k in
            ("bucket", "key", "version_id", "sha256", "stored_at_server_utc")):
        raise ValueError("Missing first FINAL registry version")
    game_id = str(row["source_game_id"])
    if ref["key"] != f"nba-history-first-final/{game_id}/first.json":
        raise ValueError("First FINAL ledger key mismatch")
    kwargs = {"Bucket": ref["bucket"], "Key": ref["key"],
              "VersionId": ref["version_id"]}
    head = client.head_object(**kwargs)
    observed = utc(head["LastModified"])
    if (observed != utc(ref["stored_at_server_utc"]) or
        observed > utc(feature_at) or observed > utc(now) or
        observed != utc(row["first_final_observed_at_utc"])):
        raise ValueError("First FINAL evidence later than feature cutoff")
    retention = client.get_object_retention(**kwargs)["Retention"]
    if retention.get("Mode") != "COMPLIANCE" or utc(retention["RetainUntilDate"]) <= utc(now):
        raise ValueError("First FINAL registry not immutable")
    ledger_raw = client.get_object(**kwargs)["Body"].read()
    if sha(ledger_raw) != ref["sha256"]:
        raise ValueError("First FINAL registry digest mismatch")
    ledger = json.loads(ledger_raw)
    source_raw = base64.b64decode(ledger["raw_b64"], validate=True)
    if source_raw != original_raw or ledger["raw_sha256"] != sha(original_raw):
        raise ValueError("First FINAL bytes disagree with historical features")
    _validate(source_raw, game_id)
    if (ledger["source_game_id"] != game_id or
        utc(ledger["fetched_at_utc"]) > observed):
        raise ValueError("First FINAL registry chronology mismatch")
    return True
