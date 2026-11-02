"""Read-only NBA schedule observation; never a verified bookmaker quote.

This ESPN public scoreboard endpoint is an exploratory external source only.
Access, terms, availability, and redistribution rights require separate review.
It cannot satisfy any V2 evidence gate or produce a publication decision.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from urllib.request import HTTPRedirectHandler, Request, build_opener


@dataclass(frozen=True)
class ScheduleObservation:
    source: str
    fetched_at_utc: str
    raw_sha256: str
    raw_bytes: int
    events: int
    independently_attested: bool = False
    bookmaker_quote_verified: bool = False
    publication_allowed: bool = False


def observe_espn_nba_schedule(day: date, *, timeout: float = 8.0) -> ScheduleObservation:
    """GET-only, no credentials, no wagering, no storage, no publisher."""
    if type(day) is not date or not (0 < timeout <= 15):
        raise ValueError("Invalid observation parameters")
    url = ("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/"
           f"scoreboard?dates={day:%Y%m%d}")
    request = Request(url, headers={"Accept": "application/json",
                                    "User-Agent": "TotalsEngineResearch/2.0"},
                      method="GET")
    class NoRedirect(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
        if response.geturl() != url:
            raise ValueError("Redirect forbidden")
        if response.status != 200:
            raise ValueError("Source response not successful")
        length = response.headers.get("Content-Length")
        if length and int(length) > 2_000_000:
            raise ValueError("Oversize external payload")
        raw = response.read(2_000_001)
    if len(raw) > 2_000_000:
        raise ValueError("Oversize external payload")
    payload = json.loads(raw)
    if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
        raise ValueError("Unexpected external schema")
    return ScheduleObservation(
        source="ESPN_NBA_SCOREBOARD_UNVERIFIED",
        fetched_at_utc=datetime.now(timezone.utc).isoformat(),
        raw_sha256=hashlib.sha256(raw).hexdigest(),
        raw_bytes=len(raw),
        events=len(payload["events"]),
    )
