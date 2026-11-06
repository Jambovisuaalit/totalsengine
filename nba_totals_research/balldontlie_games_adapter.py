"""BALLDONTLIE NBA Games API adapter. No network calls on import.

Only official authenticated /v1/games interface. Rights and access are separate:
this adapter NEVER marks third-party licensing or actual kickoff as verified.
No API keys or complete HTTP headers are stored in artifacts.
"""
from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://api.balldontlie.io/v1/games"
SOURCE_ID = "balldontlie-nba"
ENDPOINT_ID = "games-v1"


@dataclass(frozen=True)
class CapturedResponse:
    raw: bytes
    url: str
    fetched_at_utc: str
    received_at_utc: str
    http_date: str | None
    source_sha256: str
    games: tuple[dict, ...]


def utc_iso(dt: datetime) -> str:
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Timezone-aware capture clock required")
    return dt.astimezone(timezone.utc).isoformat()


def fetch_games(*, day: str, api_key: str | None = None,
                opener=urlopen, clock=None, timeout=15) -> CapturedResponse:
    """Fetch one day and retain *exact* response bytes; fail closed on auth/errors.

    The source's HTTP Date is optional metadata, NOT a first-publication time.
    Free tier allows Games, but API access requires a user-owned credential.
    """
    from datetime import date
    date.fromisoformat(day)
    key = api_key if api_key is not None else os.environ.get("BALLDONTLIE_API_KEY")
    if not key or not key.strip():
        raise ValueError("BALLDONTLIE_API_KEY is missing; no data fetched")
    if not isinstance(timeout, (int, float)) or not 1 <= timeout <= 30:
        raise ValueError("Invalid timeout")
    now = clock or (lambda: datetime.now(timezone.utc))
    url = BASE_URL + "?" + urlencode({"dates[]": day, "per_page": 100})
    request = Request(url, headers={"Authorization": key, "Accept": "application/json",
                                    "User-Agent": "TotalsEngine-Research/1.0"}, method="GET")
    sent = now()
    utc_iso(sent)
    with opener(request, timeout=timeout) as response:
        if response.status != 200:
            raise ValueError("BALLDONTLIE Games API request unsuccessful")
        raw = response.read(2_000_001)
        http_date = response.headers.get("Date")
    received = now()
    if len(raw) > 2_000_000 or not raw:
        raise ValueError("Empty or oversized BALLDONTLIE response")
    if (received - sent).total_seconds() < 0:
        raise ValueError("Capture clock moved backward")
    obj = json.loads(raw)
    games = obj.get("data")
    if not isinstance(games, list) or not all(isinstance(game, dict) for game in games):
        raise ValueError("Invalid Games API response")
    if not isinstance(obj.get("meta", {}), dict):
        raise ValueError("Invalid pagination metadata")
    if obj.get("meta", {}).get("next_cursor") is not None:
        raise ValueError("Games page incomplete: pagination required before use")
    return CapturedResponse(
        raw=raw, url=url, fetched_at_utc=utc_iso(sent),
        received_at_utc=utc_iso(received), http_date=http_date,
        source_sha256=hashlib.sha256(raw).hexdigest(), games=tuple(games))


def select_event(capture: CapturedResponse, game_id: str) -> tuple[dict, str]:
    matches = [game for game in capture.games if str(game.get("id")) == str(game_id)]
    if len(matches) != 1:
        raise ValueError("Missing or duplicated BALLDONTLIE canonical event")
    game = matches[0]
    status = str(game.get("status", "")).strip().lower()
    period = game.get("period")
    scores = (game.get("home_team_score"), game.get("visitor_team_score"))
    if status in {"final", "completed"}:
        if any(not isinstance(x, int) or isinstance(x, bool) or x < 0 for x in scores):
            raise ValueError("FINAL game lacks authoritative final scores")
        return game, "FINAL"
    # Provider commonly represents scheduled games by an ISO-8601 status
    # timestamp. Require a matching canonical tipoff and a zero period.
    if period in (None, 0):
        scheduled = game.get("datetime")
        if isinstance(scheduled, str) and scheduled:
            try:
                from datetime import datetime
                tipoff = datetime.fromisoformat(scheduled.replace("Z", "+00:00"))
                status_dt = datetime.fromisoformat(status.replace("z", "+00:00"))
                if (tipoff.tzinfo is not None and status_dt.tzinfo is not None
                        and tipoff == status_dt):
                    return game, "PRE_GAME"
            except ValueError:
                pass
        if status in {"scheduled", "not started"}:
            return game, "PRE_GAME"
    # Unknown and underway are never silently promoted to PRE_GAME.
    return game, "UNKNOWN_OR_LIVE"
