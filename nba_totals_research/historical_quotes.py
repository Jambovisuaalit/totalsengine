"""Canonical offline historical NBA totals quote ingestion. Never implies a licensed feed."""
from __future__ import annotations
import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Iterable
from uuid import UUID
from .core import Market, Quote, PaperAssessment, SCOPE, utc
from .release_gate import _same_market

SHA = re.compile(r"^[0-9a-f]{64}$")
ID = re.compile(r"^[a-z0-9][a-z0-9_.:-]{1,127}$")
MAX_BYTES = 8_000_000

@dataclass(frozen=True)
class Rights:
    source_id: str
    license_id: str
    historical_analysis_allowed: bool
    expires_at: datetime
    approved_by: str
    def validate(self, at: datetime) -> None:
        if not self.source_id or not self.license_id or not self.approved_by:
            raise ValueError("Explicit source, license and approving authority required")
        if not self.historical_analysis_allowed or utc(self.expires_at) <= utc(at):
            raise ValueError("Historical research rights missing or expired")

@dataclass(frozen=True)
class HistoricalQuote:
    bookmaker_id: str
    market_id: str
    game_id: str
    line: Decimal
    selection: str
    settlement_scope: str
    observed_at: datetime
    provider_published_at: datetime
    scheduled_tipoff: datetime
    expires_at: datetime
    odds: Decimal
    source_id: str
    source_record_id: str
    raw_sha256: str
    offered: bool = True
    live: bool = False

    def identity(self) -> tuple:
        return (self.bookmaker_id, self.market_id, self.game_id, self.line,
                self.selection, self.settlement_scope, self.source_record_id)

    def validate(self, rights: Rights, assessment_at: datetime) -> Quote:
        rights.validate(assessment_at)
        if self.source_id != rights.source_id or not ID.fullmatch(self.market_id) or not ID.fullmatch(self.source_record_id):
            raise ValueError("Invalid source or canonical market/record identifier")
        if not SHA.fullmatch(self.raw_sha256):
            raise ValueError("Raw response SHA256 required")
        if utc(self.expires_at) <= utc(assessment_at) or utc(self.expires_at) > utc(self.scheduled_tipoff):
            raise ValueError("Expired or invalid market lifetime")
        if utc(self.observed_at) > utc(assessment_at):
            raise ValueError("Look-ahead observation")
        market = Market(self.game_id, self.line, self.selection, self.settlement_scope)
        quote = Quote(market, self.bookmaker_id, self.odds, self.scheduled_tipoff,
                      self.observed_at, self.provider_published_at, self.raw_sha256,
                      self.source_record_id, self.offered, self.live)
        quote.validate(assessment_at)
        return quote

def parse_quote(item: dict) -> HistoricalQuote:
    """Strict schema: timestamps must include timezone; decimals must be strings."""
    keys = set(HistoricalQuote.__dataclass_fields__)
    required = keys - {"offered", "live"}
    if not isinstance(item, dict) or not required <= set(item) <= keys:
        raise ValueError("Invalid historical quote schema")
    if not all(isinstance(item[k], str) for k in ("line", "odds")):
        raise ValueError("Line and odds must be decimal strings")
    def stamp(name):
        value = item[name]
        if not isinstance(value, str):
            raise ValueError("ISO8601 timestamp required")
        return utc(datetime.fromisoformat(value))
    return HistoricalQuote(
        bookmaker_id=item["bookmaker_id"], market_id=item["market_id"],
        game_id=item["game_id"], line=Decimal(item["line"]),
        selection=item["selection"], settlement_scope=item["settlement_scope"],
        observed_at=stamp("observed_at"), provider_published_at=stamp("provider_published_at"),
        scheduled_tipoff=stamp("scheduled_tipoff"), expires_at=stamp("expires_at"),
        odds=Decimal(item["odds"]), source_id=item["source_id"],
        source_record_id=item["source_record_id"], raw_sha256=item["raw_sha256"],
        offered=item.get("offered", True), live=item.get("live", False))

def ingest_file(path: Path, rights: Rights, assessment_at: datetime, *,
                expected_game_id: str, expected_line: Decimal,
                expected_selection: str, expected_bookmaker_id: str) -> dict:
    """All-or-nothing offline ingest; no unlicensed row is returned as usable."""
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Invalid historical data file")
    raw = path.read_bytes()
    if len(raw) > MAX_BYTES:
        raise ValueError("Historical data exceeds limit")
    records = json.loads(raw)
    if not isinstance(records, list) or not records:
        raise ValueError("Nonempty quote array required")
    seen = set()
    accepted = []
    for item in records:
        q = parse_quote(item)
        if (q.game_id != expected_game_id or q.line != expected_line or
                q.selection != expected_selection or q.bookmaker_id != expected_bookmaker_id):
            raise ValueError("Mismatched game, line, selection or bookmaker")
        if q.identity() in seen:
            raise ValueError("Duplicate historical quote")
        seen.add(q.identity())
        q.validate(rights, assessment_at)
        accepted.append(q)
    return {"schema_version": 1, "status": "LOCAL_HISTORICAL_QUOTES_VALID_ONLY",
            "file_sha256": hashlib.sha256(raw).hexdigest(), "quote_count": len(accepted),
            "quotes": tuple(accepted), "externally_verified": False,
            "publication_allowed": False}

def exact_match(quote: HistoricalQuote, paper: PaperAssessment, rights: Rights) -> bool:
    """Exact paper comparison; local equality is not external attestation."""
    try:
        quote.validate(rights, paper.assessed_at)
        return bool(
            paper.publication_allowed is False and paper.market.game_id == quote.game_id
            and paper.market.line == quote.line and paper.market.side == quote.selection
            and paper.market.scope == quote.settlement_scope
            and paper.bookmaker == quote.bookmaker_id
            and paper.selected_quote_id == quote.source_record_id
            and paper.raw_response_sha256 == quote.raw_sha256
            and paper.decimal_odds == quote.odds
            and utc(paper.assessed_at) < utc(quote.expires_at)
        )
    except (ValueError, TypeError, KeyError):
        return False

def settle(selection: str, line: Decimal, actual_total_including_ot: int) -> str:
    Market("123e4567-e89b-42d3-a456-426614174000", line, selection, SCOPE).validate()
    if type(actual_total_including_ot) is not int or actual_total_including_ot < 0:
        raise ValueError("Invalid final including-OT total")
    if Decimal(actual_total_including_ot) == line:
        return "PUSH"
    return "WIN" if ((actual_total_including_ot > line) == (selection == "OVER")) else "LOSE"
