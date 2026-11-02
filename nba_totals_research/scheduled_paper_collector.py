"""Scheduled, research-only NBA forward forecast collector.

Uses the public ESPN scoreboard (unverified source/rights). Records are
UNATTESTED, UNLICENSED-FOR-REDISTRIBUTION and never eligible for publication or
market claims. No bets, odds, or publisher adapters.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

UTC = timezone.utc
ALIASES = {
    "GSW": "gs", "GS": "gs", "NYK": "ny", "NY": "ny",
    "SAS": "sa", "SA": "sa", "NOP": "no", "NO": "no",
    "UTA": "utah", "UTAH": "utah", "WAS": "wsh", "WSH": "wsh",
    "PHI": "phi", "PHL": "phi", "BKN": "bkn", "BRK": "bkn",
    "CHA": "cha", "CHO": "cha",
}
KNOWN = {"atl","bkn","bos","cha","chi","cle","dal","den","det","gs",
         "hou","ind","lac","lal","mem","mia","mil","min","no","ny",
         "okc","orl","phi","phx","por","sa","sac","tor","utah","wsh"}


def iso(value: str) -> datetime:
    value = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Timezone-aware timestamp required")
    return dt.astimezone(UTC)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: dict) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      allow_nan=False).encode("utf-8")


def team_code(value: str) -> str:
    code = value.upper().strip()
    normalized = ALIASES.get(code, code.lower())
    if normalized not in KNOWN:
        raise ValueError("Unknown NBA team: " + value)
    return normalized


def download_day(day: date) -> bytes:
    url = ("https://site.api.espn.com/apis/site/v2/sports/"
           f"basketball/nba/scoreboard?dates={day:%Y%m%d}&limit=100")
    req = Request(url, headers={"Accept": "application/json",
                 "User-Agent": "TotalsEngineResearch/1.0"}, method="GET")
    with urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise ValueError("Source HTTP error")
        payload = response.read(2_000_001)
        if len(payload) > 2_000_000:
            raise ValueError("Source response too large")
    return payload


def extract(day_payloads: dict[str, bytes]) -> list[dict]:
    games = {}
    for key, raw in sorted(day_payloads.items()):
        doc = json.loads(raw)
        if not isinstance(doc.get("events"), list):
            raise ValueError("Malformed NBA scoreboard")
        for event in doc["events"]:
            comps = event["competitions"]
            if len(comps) != 1 or len(comps[0]["competitors"]) != 2:
                raise ValueError("Unsupported game structure")
            participants = {}
            for c in comps[0]["competitors"]:
                side = c["homeAway"]
                if side not in {"home", "away"} or side in participants:
                    raise ValueError("Invalid team matchup")
                participants[side] = c
            if set(participants) != {"home","away"}:
                raise ValueError("Invalid matchup")
            status = event["status"]["type"]
            state = "FINAL" if status.get("completed") is True else (
                "SCHEDULED" if status.get("state") == "pre" else "LIVE")
            # ESPN occasionally includes exhibition or non-NBA teams in this feed.
            # Never manufacture an NBA ID for an unrecognized participant.
            try:
                away = team_code(participants["away"]["team"]["abbreviation"])
                home = team_code(participants["home"]["team"]["abbreviation"])
            except ValueError as exc:
                if str(exc).startswith("Unknown NBA team: "):
                    continue
                raise
            row = {"source_game_id": str(event["id"]),
                   "scheduled_tipoff": iso(event["date"]).isoformat(),
                   "away": away,
                   "home": home,
                   "status": state}
            if state == "FINAL":
                row["score_away"] = int(participants["away"]["score"])
                row["score_home"] = int(participants["home"]["score"])
                if min(row["score_away"], row["score_home"]) < 0:
                    raise ValueError("Bad score")
            old = games.get(row["source_game_id"])
            if old is not None and old != row:
                raise ValueError("Conflicting source game versions across dates")
            games[row["source_game_id"]] = row
    return list(games.values())


def forecast(games: list[dict], *, at: datetime, min_history=3,
             max_history=10, min_lead_hours=2, max_lead_hours=36) -> list[dict]:
    at = at.astimezone(UTC)
    if not 2 <= min_history <= max_history <= 30:
        raise ValueError("Invalid history limits")
    previous = [g for g in games if g["status"] == "FINAL" and
                iso(g["scheduled_tipoff"]) + timedelta(days=2) <= at]
    result = []
    by_id = set()
    for g in sorted(games, key=lambda row: (row["scheduled_tipoff"], row["source_game_id"])):
        if g["status"] != "SCHEDULED":
            continue
        tipoff = iso(g["scheduled_tipoff"])
        lead = (tipoff - at).total_seconds() / 3600
        if not min_lead_hours <= lead <= max_lead_hours:
            continue
        histories = {}
        source_ids = {}
        for t in (g["away"], g["home"]):
            records = [x for x in previous if t in (x["away"], x["home"])]
            records.sort(key=lambda x: (x["scheduled_tipoff"], x["source_game_id"]))
            chosen = records[-max_history:]
            if len(chosen) < min_history:
                histories = {}
                break
            histories[t] = sum(x["score_away"] + x["score_home"] for x in chosen) / len(chosen)
            source_ids[t] = [x["source_game_id"] for x in chosen]
        if not histories:
            continue
        if g["source_game_id"] in by_id:
            raise ValueError("Duplicate source game ID")
        by_id.add(g["source_game_id"])
        predicted = (histories[g["away"]] + histories[g["home"]]) / 2
        record = {
            "schema_version": 1, "research_only": True,
            "source": "ESPN_SCOREBOARD_UNVERIFIED",
            "source_game_id": g["source_game_id"], "away": g["away"],
            "home": g["home"], "scheduled_tipoff": g["scheduled_tipoff"],
            "model_version": "rolling-team-total-v1",
            "expected_total": round(predicted, 4),
            "generated_at_host_utc": at.isoformat(),
            "history_source_game_ids": source_ids,
            "source_availability_verified": False,
            "independently_timestamped": False,
            "evaluation_eligible": False,
            "publication_allowed": False, "gate_status": "NO_GO",
        }
        record["record_sha256"] = digest(canonical(record))
        result.append(record)
    return result


def run(output_dir: Path, *, now: datetime | None = None,
        fetch=download_day) -> dict:
    now = (now or datetime.now(UTC)).astimezone(UTC)
    output_dir.mkdir(parents=True, exist_ok=True)
    days = [(now - timedelta(days=35) + timedelta(days=n)).date()
            for n in range(38)]
    raw = {d.isoformat(): fetch(d) for d in days}
    games = extract(raw)
    predictions = forecast(games, at=now)
    # Archive every raw source used in the run, never fabricate a missing day.
    raw_dir = output_dir / "source_snapshots"
    raw_dir.mkdir(exist_ok=True)
    snapshots = {}
    for day, payload in raw.items():
        (raw_dir / f"{day}.json").write_bytes(payload)
        snapshots[day] = digest(payload)
    lines = b"".join(canonical(p) + bytes([10]) for p in predictions)
    (output_dir / "predictions.jsonl").write_bytes(lines)
    report = {
        "generated_at_host_utc": now.isoformat(), "n_source_days": len(raw),
        "n_games": len(games), "n_forecasts": len(predictions),
        "predictions_sha256": digest(lines), "source_sha256_by_day": snapshots,
        "timestamp_trust": "GITHUB_ACTIONS_HOST_CLOCK_UNATTESTED",
        "source_rights_verified": False, "external_attestation": False,
        "evaluation_eligible": False, "publication_allowed": False,
        "gate_status": "NO_GO",
    }
    (output_dir / "manifest.json").write_bytes(canonical(report))
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
        raise SystemExit("Unsafe environment: HALTED=1 and PUBLICATION_ALLOWED=false required")
    report = run(args.output)
    print(json.dumps({k: v for k, v in report.items() if k != "source_sha256_by_day"},
                     sort_keys=True))


if __name__ == "__main__":
    main()
