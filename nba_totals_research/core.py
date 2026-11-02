"""Pure offline NBA totals research; no provider calls or publish path."""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Mapping
from uuid import UUID

D = Decimal
ZERO, ONE = D("0"), D("1")
SCOPE = "NBA_FULL_GAME_TOTAL_INCLUDING_OT"
HASH = re.compile(r"^[0-9a-f]{64}$")
BOOK = re.compile(r"^[a-z0-9_-]{2,64}$")
T65, T60 = timedelta(minutes=65), timedelta(minutes=60)
MAX_QUOTE_AGE = timedelta(seconds=120)


def utc(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Timezone-aware timestamp required")
    return value.astimezone(timezone.utc)


@dataclass(frozen=True)
class Market:
    game_id: str
    line: Decimal
    side: str
    scope: str = SCOPE

    def validate(self) -> None:
        try:
            parsed = UUID(self.game_id)
        except (ValueError, TypeError, AttributeError) as exc:
            raise ValueError("Invalid game UUID") from exc
        if str(parsed) != self.game_id or self.scope != SCOPE:
            raise ValueError("Canonical game and NBA full-game including-OT market required")
        if self.side not in ("OVER", "UNDER"):
            raise ValueError("Exact OVER/UNDER side required")
        if not isinstance(self.line, Decimal) or not self.line.is_finite():
            raise ValueError("Invalid Decimal point line")
        if not D("100") <= self.line <= D("400") or self.line * 2 != (self.line * 2).to_integral_value():
            raise ValueError("NBA total must be whole or half point in bounded range")


@dataclass(frozen=True)
class Quote:
    market: Market
    book: str
    odds: Decimal
    scheduled_tipoff: datetime
    observed_at: datetime
    provider_published_at: datetime
    raw_response_sha256: str
    provider_quote_id: str
    offered: bool = True
    live: bool = False

    def validate(self, assessment_at: datetime) -> None:
        self.market.validate()
        if not isinstance(self.book, str) or not BOOK.fullmatch(self.book):
            raise ValueError("Canonical bookmaker ID required")
        if not self.provider_quote_id or len(self.provider_quote_id) > 128:
            raise ValueError("Provider quote identifier required")
        if not isinstance(self.raw_response_sha256, str) or not HASH.fullmatch(self.raw_response_sha256):
            raise ValueError("Raw provider response SHA-256 required")
        if not isinstance(self.odds, Decimal) or not self.odds.is_finite() or not ONE < self.odds <= D("100"):
            raise ValueError("Invalid decimal odds")
        if not self.offered or self.live:
            raise ValueError("Non-offered or in-play market rejected")
        tip, seen, published, now = map(utc, (self.scheduled_tipoff, self.observed_at,
                                              self.provider_published_at, assessment_at))
        if not (tip - T65 <= seen <= now <= tip - T60):
            raise ValueError("Outside pregame T-65 to T-60 evidence window")
        if not (published <= seen and seen - published <= MAX_QUOTE_AGE):
            raise ValueError("Unverifiable/stale provider published timestamp")
        if now - seen > MAX_QUOTE_AGE:
            raise ValueError("Quote stale at assessment")
        # Local timestamps and hashes do not independently attest original provider history.


@dataclass(frozen=True)
class ConditionalModel:
    """Both PMFs are conditional FULL-GAME totals including OT when applicable."""
    version: str
    p_overtime: Decimal
    p_total_no_overtime: Mapping[int, Decimal]
    p_total_given_overtime: Mapping[int, Decimal]
    validation_report_sha256: str | None = None

    def validate(self) -> None:
        if not self.version or len(self.version) > 100:
            raise ValueError("Model version required")
        if not isinstance(self.p_overtime, Decimal) or not self.p_overtime.is_finite() or not ZERO <= self.p_overtime <= ONE:
            raise ValueError("Invalid overtime probability")
        for pmf in (self.p_total_no_overtime, self.p_total_given_overtime):
            if not pmf or len(pmf) > 501:
                raise ValueError("Invalid conditional distribution size")
            if not all(type(k) is int and 0 <= k <= 500 and
                       isinstance(p, Decimal) and p.is_finite() and p >= ZERO
                       for k, p in pmf.items()):
                raise ValueError("Invalid conditional distribution entry")
            if sum(pmf.values(), ZERO) != ONE:
                raise ValueError("Conditional probabilities must sum exactly to 1")
        if self.validation_report_sha256 is not None and not HASH.fullmatch(self.validation_report_sha256):
            raise ValueError("Invalid model report digest")

    def outcomes(self, market: Market) -> tuple[Decimal, Decimal, Decimal]:
        self.validate()
        market.validate()
        mixed: dict[int, Decimal] = {}
        for total, p in self.p_total_no_overtime.items():
            mixed[total] = mixed.get(total, ZERO) + (ONE - self.p_overtime) * p
        for total, p in self.p_total_given_overtime.items():
            mixed[total] = mixed.get(total, ZERO) + self.p_overtime * p
        if market.side == "OVER":
            win = sum((p for t, p in mixed.items() if D(t) > market.line), ZERO)
            lose = sum((p for t, p in mixed.items() if D(t) < market.line), ZERO)
        else:
            win = sum((p for t, p in mixed.items() if D(t) < market.line), ZERO)
            lose = sum((p for t, p in mixed.items() if D(t) > market.line), ZERO)
        push = sum((p for t, p in mixed.items() if D(t) == market.line), ZERO)
        if win + push + lose != ONE:
            raise ValueError("Inconsistent outcome probability mass")
        return win, push, lose


BLOCKERS = (
    "NO_INDEPENDENT_MODEL_ATTESTATION",
    "NO_BOOKMAKER_EXECUTION_CONFIRMATION",
    "NO_TRUSTED_ORIGINAL_TIMESTAMP_ATTESTATION",
    "DATA_RIGHTS_AND_BETTING_USE_NOT_APPROVED",
)


@dataclass(frozen=True)
class PaperAssessment:
    market: Market
    bookmaker: str
    decimal_odds: Decimal
    p_win: Decimal
    p_push: Decimal
    p_lose: Decimal
    ev_per_unit: Decimal
    model_version: str
    assessed_at: datetime
    selected_quote_id: str
    raw_response_sha256: str
    evidence_sha256: str
    status: str
    publication_allowed: bool = False
    blockers: tuple[str, ...] = BLOCKERS


def assess(quotes: tuple[Quote, ...], model: ConditionalModel, *,
           assessed_at: datetime, min_paper_ev: Decimal = D("0.02")) -> PaperAssessment:
    """Exact-market line shopping and push-aware EV; always PAPER ONLY."""
    if not 1 <= len(quotes) <= 10:
        raise ValueError("Between one and ten quotes required")
    at = utc(assessed_at)
    if not isinstance(min_paper_ev, Decimal) or not min_paper_ev.is_finite():
        raise ValueError("Invalid EV threshold")
    identity, tipoff, seen_books = quotes[0].market, utc(quotes[0].scheduled_tipoff), set()
    for q in quotes:
        q.validate(at)
        if q.market != identity or utc(q.scheduled_tipoff) != tipoff:
            raise ValueError("Mismatched game, total line, side, settlement rules or tipoff")
        if q.book in seen_books:
            raise ValueError("Duplicated bookmaker quotation")
        seen_books.add(q.book)
    best = sorted(quotes, key=lambda q: (-q.odds, q.book))[0]
    pw, pp, pl = model.outcomes(identity)
    ev = pw * (best.odds - ONE) - pl
    payload = {
        "market": asdict(identity),
        "quotes": sorted((q.book, q.provider_quote_id, q.raw_response_sha256) for q in quotes),
        "model_version": model.version,
        "unverified_model_report": model.validation_report_sha256,
        "p_win_push_lose": [str(pw), str(pp), str(pl)],
        "ev": str(ev), "assessment_at": at.isoformat(),
    }
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()
    return PaperAssessment(identity, best.book, best.odds, pw, pp, pl, ev, model.version,
                           at, best.provider_quote_id, best.raw_response_sha256, fingerprint,
                           "PAPER_CANDIDATE" if ev >= min_paper_ev else "PASS")


def write_private_receipt(result: PaperAssessment, directory: Path) -> Path:
    """Exclusively create one private checksum-named receipt; never publish."""
    if result.publication_allowed:
        raise ValueError("Publishing is unsupported")
    raw = json.dumps({"schema_version": 1, **asdict(result)}, default=str,
                     sort_keys=True, indent=2).encode()
    name = hashlib.sha256(raw).hexdigest() + ".nba-totals-paper.json"
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    dest = directory / name
    with dest.open("xb") as f:
        f.write(raw)
    dest.chmod(0o600)
    return dest
