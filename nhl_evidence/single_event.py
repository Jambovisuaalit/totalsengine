"""Offline NHL single-event evidence gate. No network calls or betting execution."""
from __future__ import annotations
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

def parse_utc(value: str) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("UTC timestamp must end in Z")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.utcoffset().total_seconds() != 0:
        raise ValueError("timestamp must be UTC")
    return dt

def capture_one_event(*, raw_odds: bytes, fetched_at_utc: str,
                      canonical_event_id: str, odds_event_id: str,
                      home_team: str, away_team: str, commence_time: str,
                      goalies: dict, prediction: dict | None,
                      archive_dir: str) -> dict:
    """Fail closed; preserve original bytes and create an immutable-by-convention manifest.

    Caller supplies raw provider response bytes and an independently recorded receipt
    timestamp. Filesystem immutability is NOT WORM/Object Lock.
    """
    receipt = parse_utc(fetched_at_utc)
    start = parse_utc(commence_time)
    if receipt >= start:
        raise ValueError("odds fetched at/after game start")
    if not all(isinstance(v, str) and v.strip() for v in
               (canonical_event_id, odds_event_id, home_team, away_team)):
        raise ValueError("missing canonical identity")
    if home_team == away_team:
        raise ValueError("same home/away team")
    data = json.loads(raw_odds)
    events = data if isinstance(data, list) else [data]
    matches = [e for e in events if isinstance(e, dict) and e.get("id") == odds_event_id]
    if len(matches) != 1:
        raise ValueError("odds event id missing or ambiguous")
    event = matches[0]
    if event.get("commence_time") != commence_time:
        raise ValueError("start time mismatch")
    if event.get("home_team") != home_team or event.get("away_team") != away_team:
        raise ValueError("home/away mismatch")
    for book in event.get("bookmakers", []):
        if parse_utc(book["last_update"]) > receipt:
            raise ValueError("bookmaker timestamp after receipt")
        for market in book.get("markets", []):
            if parse_utc(market["last_update"]) > receipt:
                raise ValueError("market timestamp after receipt")
    if set(goalies) != {"home", "away"}:
        raise ValueError("goalies must contain home and away")
    for side in ("home", "away"):
        g = goalies[side]
        if g.get("status") not in ("CONFIRMED", "UNCONFIRMED"):
            raise ValueError("invalid goalie status")
        if g["status"] == "CONFIRMED":
            if not g.get("source_url") or not g.get("observed_at_utc") or not g.get("player_id"):
                raise ValueError("confirmed goalie lacks provenance")
            if parse_utc(g["observed_at_utc"]) > receipt:
                raise ValueError("goalie confirmation after receipt")
    if prediction is not None:
        if not prediction.get("model_version") or not prediction.get("created_at_utc"):
            raise ValueError("prediction lacks version/time")
        if parse_utc(prediction["created_at_utc"]) > receipt:
            raise ValueError("prediction created after evidence receipt")
        if parse_utc(prediction["created_at_utc"]) >= start:
            raise ValueError("prediction after start")
    digest = hashlib.sha256(raw_odds).hexdigest()
    manifest = {
        "canonical_event_id": canonical_event_id, "odds_event_id": odds_event_id,
        "home_team": home_team, "away_team": away_team,
        "commence_time": commence_time, "fetched_at_utc": fetched_at_utc,
        "raw_odds_sha256": digest, "goalies": goalies, "prediction": prediction,
        "decision": "HOLD", "archive_type": "LOCAL_NOT_WORM"
    }
    root = Path(archive_dir)
    root.mkdir(parents=True, exist_ok=True)
    raw_path = root / (digest + ".json")
    manifest_path = root / (digest + ".manifest.json")
    # Exclusive create: never overwrite earlier evidence.
    with raw_path.open("xb") as f:
        f.write(raw_odds)
    try:
        with manifest_path.open("x", encoding="utf-8") as f:
            json.dump(manifest, f, sort_keys=True, indent=2)
        if hashlib.sha256(raw_path.read_bytes()).hexdigest() != digest:
            raise IOError("raw evidence readback mismatch")
    except Exception:
        manifest_path.unlink(missing_ok=True)
        raw_path.unlink(missing_ok=True)
        raise
    return manifest
