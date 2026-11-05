"""Historical feature provenance for prospective NBA forecast bundles.

A local row cannot prove when ESPN first published a result. This module
validates exact source bytes and chronology; independent archive/provider
authentication remains a separate admission gate.
"""
import json
from datetime import timedelta
from .prospective_market_bundle import utc, sha


def verify_history(predictions, history, blobs, now):
    if not isinstance(history, list) or not history:
        raise ValueError("Historical evidence missing")
    used = {}
    for row in history:
        event_id = str(row["source_game_id"])
        if event_id in used:
            raise ValueError("Duplicate historical event evidence")
        key = row["raw_artifact_key"]
        if key not in blobs or sha(blobs[key]) != row["raw_sha256"]:
            raise ValueError("Missing or altered original history response")
        observed = utc(row["fetched_at_utc"])
        first_final = utc(row["first_final_observed_at_utc"])
        if not first_final <= observed <= utc(now):
            raise ValueError("Invalid FINAL observation chronology")
        ref = row.get("immutable_archive_ref")
        if not isinstance(ref, dict) or not all(ref.get(k) for k in
                ("bucket", "key", "version_id", "sha256", "stored_at_server_utc")):
            raise ValueError("Missing version-specific archive reference")
        if ref["sha256"] != row["raw_sha256"]:
            raise ValueError("Archived history hash mismatch")
        if not observed <= utc(ref["stored_at_server_utc"]) <= utc(now):
            raise ValueError("Archive receipt before fetch or after capture")
        doc = json.loads(blobs[key])
        events = doc.get("events")
        if not isinstance(events, list):
            raise ValueError("Invalid ESPN history response")
        matches = [x for x in events if str(x.get("id")) == event_id]
        if len(matches) != 1 or matches[0].get("status", {}).get("type", {}).get("completed") is not True:
            raise ValueError("Historical event not FINAL in original bytes")
        comps = matches[0].get("competitions", [])
        if len(comps) != 1 or len(comps[0].get("competitors", [])) != 2:
            raise ValueError("Invalid historical competitors")
        scores = [c.get("score") for c in comps[0]["competitors"]]
        if any(not str(s).isdigit() for s in scores):
            raise ValueError("Missing historical final scores")
        if str(row["source_game_id"]) != event_id:
            raise ValueError("Inconsistent history identifier")
        used[event_id] = row
    for prediction in predictions:
        lineage = prediction.get("history_source_game_ids")
        if not isinstance(lineage, dict) or len(lineage) != 2:
            raise ValueError("Two team history lists required")
        feature_at = utc(prediction["features_as_of_utc"])
        predicted_at = utc(prediction["prediction_created_at_utc"])
        if not feature_at <= predicted_at:
            raise ValueError("Feature cutoff after forecast")
        for team, game_ids in lineage.items():
            if not team or not isinstance(game_ids, list) or not 3 <= len(game_ids) <= 10:
                raise ValueError("Baseline requires 3..10 games per team")
            if len(set(str(x) for x in game_ids)) != len(game_ids):
                raise ValueError("Duplicate history game for team")
            for event_id in game_ids:
                evidence = used.get(str(event_id))
                if evidence is None:
                    raise ValueError("Selected historical game missing evidence")
                observed = utc(evidence["fetched_at_utc"])
                first_final = utc(evidence["first_final_observed_at_utc"])
                if not first_final <= observed <= feature_at:
                    raise ValueError("Historical result not observed before features cutoff")
                # Same 48h scheduling guard as the original collector.
                event = next(x for x in json.loads(blobs[evidence["raw_artifact_key"]])["events"]
                             if str(x["id"]) == str(event_id))
                if utc(event["date"]) + timedelta(days=2) > feature_at:
                    raise ValueError("Historical game inside conservative 48h exclusion")
    referenced = {str(gid) for p in predictions
                  for ids in p["history_source_game_ids"].values() for gid in ids}
    if referenced != set(used):
        raise ValueError("Unreferenced or missing historical evidence")
    return {"history_count": len(used), "source_availability_verified": False}


def verify_history_archive(history, blobs, predictions, client, now):
    """Read historical object versions back before issuing completion.

    Server LastModified provides a verifiable latest-availability bound,
    not ESPN's original publication time or a proof of the first ever FINAL.
    """
    cutoffs = {}
    for pred in predictions:
        for ids in pred["history_source_game_ids"].values():
            for gid in ids:
                cutoffs[str(gid)] = min(cutoffs.get(str(gid), utc(pred["features_as_of_utc"])),
                                        utc(pred["features_as_of_utc"]))
    for row in history:
        gid = str(row["source_game_id"])
        ref = row["immutable_archive_ref"]
        kwargs = {"Bucket": ref["bucket"], "Key": ref["key"], "VersionId": ref["version_id"]}
        head = client.head_object(**kwargs)
        stored = utc(head["LastModified"])
        # Caller-provided receipt must match independently obtained server metadata.
        if stored != utc(ref["stored_at_server_utc"]):
            raise ValueError("Historical archive timestamp mismatch")
        if not utc(row["fetched_at_utc"]) <= stored <= cutoffs[gid]:
            raise ValueError("Historical source archived after feature cutoff")
        retention = client.get_object_retention(**kwargs)["Retention"]
        if retention.get("Mode") != "COMPLIANCE" or utc(retention["RetainUntilDate"]) <= utc(now):
            raise ValueError("Historical immutable retention missing or expired")
        actual = client.get_object(**kwargs)["Body"].read()
        if actual != blobs[row["raw_artifact_key"]] or sha(actual) != ref["sha256"]:
            raise ValueError("Historical version bytes differ from source")
    return False  # Source provider first-publication availability remains unverified.


def capture_first_final_source(*, raw, source_game_id, fetched_at_utc, client,
                               bucket, retain_until):
    """Archive a first *observed* FINAL response before feature construction.

    Call this on the first FINAL observation from the live collector. Its
    receipt is not evidence of ESPN's first publication time. Never backdate.
    Re-observations must retain the original receipt in an external ledger.
    """
    from datetime import datetime, timezone
    from .forward_pipeline import put_object_lock
    observed = utc(fetched_at_utc)
    if observed > datetime.now(timezone.utc):
        raise ValueError("Observation clock is in the future")
    if not isinstance(raw, bytes) or not raw:
        raise ValueError("Original source response bytes required")
    doc = json.loads(raw)
    matches = [e for e in doc.get("events", [])
               if str(e.get("id")) == str(source_game_id)]
    if len(matches) != 1 or matches[0].get("status", {}).get("type", {}).get("completed") is not True:
        raise ValueError("Source event not FINAL")
    # The content hash is stable; object version ID is the immutable identity.
    digest = sha(raw)
    key = f"nba-history-first-final/{source_game_id}/{digest}"
    pointer = put_object_lock(client, bucket=bucket, key=key, raw=raw,
                              retain_until=retain_until)
    head = client.head_object(Bucket=bucket, Key=key, VersionId=pointer["version_id"])
    server_at = utc(head["LastModified"])
    if server_at < observed:
        raise ValueError("Archive server timestamp predates fetch")
    return {"source_game_id": str(source_game_id),
            "fetched_at_utc": observed.isoformat(),
            "first_final_observed_at_utc": observed.isoformat(),
            "raw_sha256": digest,
            "immutable_archive_ref": {**pointer,
                "stored_at_server_utc": server_at.isoformat()}}
