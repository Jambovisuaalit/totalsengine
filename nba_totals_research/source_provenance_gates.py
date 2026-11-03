"""Fail-closed LOCAL NBA evidence checks; never promotes research to verified."""
import hashlib
import json
import math
import re
from datetime import datetime, timezone

class EvidenceError(ValueError):
    pass

def _utc(value):
    if not isinstance(value, str):
        raise EvidenceError("Timestamp required")
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise EvidenceError("Invalid date") from exc
    if date.tzinfo is None or date.utcoffset() is None:
        raise EvidenceError("Timezone required")
    return date.astimezone(timezone.utc)

def _sha(raw):
    return hashlib.sha256(raw).hexdigest()

def source_receipt(source, raw, retrieved_at, expected_sha, endpoint, http_status=200):
    if source not in ("ESPN", "BALLDONTLIE") or type(raw) is not bytes or not raw or len(raw) > 2000000:
        raise EvidenceError("Invalid provider or source bytes")
    prefixes = {"ESPN":"https://site.api.espn.com/",
                "BALLDONTLIE":"https://api.balldontlie.io/"}
    if not isinstance(endpoint, str) or not endpoint.startswith(prefixes[source]):
        raise EvidenceError("Unexpected endpoint")
    if http_status != 200 or not isinstance(expected_sha, str) or not re.fullmatch("[0-9a-f]{64}", expected_sha) or _sha(raw) != expected_sha:
        raise EvidenceError("Source delivery/integrity failure")
    try:
        body = json.loads(raw)
    except (ValueError, UnicodeError) as exc:
        raise EvidenceError("Invalid source JSON") from exc
    key = "events" if source == "ESPN" else "data"
    if not isinstance(body, dict) or not isinstance(body.get(key), list):
        raise EvidenceError("Unexpected source schema")
    return {"source":source,"source_sha256":expected_sha,
            "retrieved_at_host_utc":_utc(retrieved_at).isoformat(),
            "source_publication_verified":False,"licensed_use_verified":False,
            "status":"LOCAL_INTEGRITY_ONLY","evaluation_eligible":False,
            "publication_allowed":False,"gate_status":"NO_GO"}

def _game(row, provider):
    if not isinstance(row, dict):
        raise EvidenceError("Invalid game record")
    if provider == "ESPN":
        game_id, away, home, tipoff = [row.get(k) for k in
            ("source_game_id", "away", "home", "scheduled_tipoff")]
    else:
        game_id, tipoff = row.get("provider_game_id"), row.get("scheduled_tipoff_utc")
        away = row.get("away",{}).get("abbreviation") if isinstance(row.get("away"),dict) else None
        home = row.get("home",{}).get("abbreviation") if isinstance(row.get("home"),dict) else None
    if not isinstance(game_id,str) or not game_id.isdecimal() or not isinstance(away,str) or not isinstance(home,str) or away == home:
        raise EvidenceError("Invalid provider game identity")
    return game_id,away,home,_utc(tipoff)

def reconcile_game_ids(espn_games, balldontlie_games, espn_receipt, balldontlie_receipt, team_registry):
    if (espn_receipt.get("source") != "ESPN" or balldontlie_receipt.get("source") != "BALLDONTLIE"
        or any(r.get("status") != "LOCAL_INTEGRITY_ONLY" for r in (espn_receipt,balldontlie_receipt))):
        raise EvidenceError("Missing exact source receipts")
    if not isinstance(team_registry,dict) or len(set(team_registry.values())) != len(team_registry):
        raise EvidenceError("Ambiguous team registry")
    def index(rows, provider):
        identities, by_key = {}, {}
        for row in rows:
            game_id,away,home,tip = _game(row,provider)
            key = (away,home,tip)
            if game_id in identities or key in by_key:
                raise EvidenceError("Duplicate or ambiguous provider identity")
            identities[game_id]=(away,home,tip)
            by_key[key]=game_id
        return identities,by_key
    espn_ids,_ = index(espn_games,"ESPN")
    bdl_ids,bdl_by_match = index(balldontlie_games,"BALLDONTLIE")
    matched, unmatched, used = [], [], set()
    for espn_id,(away,home,tip) in sorted(espn_ids.items()):
        if away not in team_registry or home not in team_registry:
            unmatched.append(espn_id)
            continue
        bdl_id=bdl_by_match.get((team_registry[away],team_registry[home],tip))
        if bdl_id is None:
            unmatched.append(espn_id)
            continue
        if any(_utc(receipt["retrieved_at_host_utc"]) >= tip for receipt in (espn_receipt,balldontlie_receipt)):
            raise EvidenceError("Mapping receipts not pregame")
        used.add(bdl_id)
        matched.append({"espn_game_id":espn_id,"balldontlie_game_id":bdl_id,
                        "espn_away":away,"espn_home":home,
                        "scheduled_tipoff_utc":tip.isoformat(),
                        "espn_snapshot_sha256":espn_receipt["source_sha256"],
                        "balldontlie_snapshot_sha256":balldontlie_receipt["source_sha256"],
                        "status":"LOCAL_EXACT_MATCH_ONLY","independently_verified":False,
                        "evaluation_eligible":False,"publication_allowed":False,"gate_status":"NO_GO"})
    return {"matches":matched,"unmatched_espn_ids":unmatched,
            "unmatched_balldontlie_ids":sorted(set(bdl_ids)-used),
            "status":"LOCAL_MATCHES_UNATTESTED",
            "evaluation_eligible":False,"publication_allowed":False,"gate_status":"NO_GO"}

def inspect_pregame_archive(record, original_bytes, archive_sha256, archived_at_host_utc, mapping):
    if not isinstance(record,dict) or mapping.get("status") != "LOCAL_EXACT_MATCH_ONLY":
        raise EvidenceError("Prediction or exact mapping missing")
    if type(original_bytes) is not bytes or _sha(original_bytes) != archive_sha256:
        raise EvidenceError("Original archived bytes hash mismatch")
    try:
        if json.loads(original_bytes) != record:
            raise EvidenceError("Archived record differs from original")
    except (ValueError, UnicodeError) as exc:
        raise EvidenceError("Invalid archived JSON") from exc
    if (str(record.get("source_game_id")) != mapping["espn_game_id"]
        or record.get("away") != mapping["espn_away"]
        or record.get("home") != mapping["espn_home"]):
        raise EvidenceError("Prediction game identity mismatch")
    value = record.get("expected_total")
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):
        raise EvidenceError("Invalid forecast")
    if not isinstance(record.get("model_version"),str) or not record["model_version"]:
        raise EvidenceError("Missing model version")
    pred, archived, tipoff = (_utc(record.get("generated_at_host_utc")),
        _utc(archived_at_host_utc),_utc(mapping["scheduled_tipoff_utc"]))
    if _utc(record.get("scheduled_tipoff")) != tipoff or not pred <= archived < tipoff:
        raise EvidenceError("Prediction/host archive is not pregame")
    if record.get("publication_allowed") is not False or record.get("gate_status") != "NO_GO":
        raise EvidenceError("Missing research safety gates")
    return {"espn_game_id":mapping["espn_game_id"],"balldontlie_game_id":mapping["balldontlie_game_id"],
            "prediction_sha256":archive_sha256,"model_version":record["model_version"],
            "predicted_at_host_utc":pred.isoformat(),"archived_at_host_utc":archived.isoformat(),
            "status":"LOCAL_PREGAME_ARCHIVE_ONLY",
            "independent_timestamp_verified":False,"source_publication_verified":False,
            "immutable_retention_verified":False,"evaluation_eligible":False,
            "publication_allowed":False,"gate_status":"NO_GO"}
