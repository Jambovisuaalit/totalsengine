"""Point-in-time source identity and evidence binding for offline historical research."""
from __future__ import annotations
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from uuid import UUID
from .core import PaperAssessment, utc
from .historical_quotes import HistoricalQuote, Rights, exact_match

@dataclass(frozen=True)
class GameMapping:
    source_id: str
    source_game_id: str
    canonical_game_id: str
    mapping_evidence_sha256: str
    verified_by: str
    verified_at: datetime
    def validate(self, quote: HistoricalQuote, prediction_at: datetime) -> None:
        if (self.source_id != quote.source_id or not self.source_game_id or
            str(UUID(self.canonical_game_id)) != self.canonical_game_id or
            self.canonical_game_id != quote.game_id or not self.verified_by or
            len(self.mapping_evidence_sha256) != 64 or
            any(c not in "0123456789abcdef" for c in self.mapping_evidence_sha256)):
            raise ValueError("Missing or inconsistent game ID mapping evidence")
        if utc(self.verified_at) > utc(prediction_at):
            raise ValueError("Game ID mapping not verified before prediction")

@dataclass(frozen=True)
class SourceAvailability:
    source_id: str
    record_id: str
    available_at: datetime
    availability_evidence_sha256: str
    def validate(self, quote: HistoricalQuote, prediction_at: datetime) -> None:
        if (self.source_id != quote.source_id or self.record_id != quote.source_record_id or
            len(self.availability_evidence_sha256) != 64 or
            any(c not in "0123456789abcdef" for c in self.availability_evidence_sha256)):
            raise ValueError("Missing source availability evidence")
        if utc(self.available_at) > utc(prediction_at):
            raise ValueError("Look-ahead: record unavailable at prediction time")
        if utc(self.available_at) < utc(quote.provider_published_at):
            raise ValueError("Availability predates provider publication")

def bind_assessment(quote: HistoricalQuote, paper: PaperAssessment, rights: Rights,
                    mapping: GameMapping, availability: SourceAvailability) -> dict:
    """Return an auditable LOCAL binding, never an external verification claim."""
    if not exact_match(quote, paper, rights):
        raise ValueError("Historical quote and assessment are not exact matches")
    mapping.validate(quote, paper.assessed_at)
    availability.validate(quote, paper.assessed_at)
    record = {
        "schema_version": 1,
        "status": "LOCAL_BINDING_ONLY",
        "assessment_sha256": paper.evidence_sha256,
        "quote_sha256": quote.raw_sha256,
        "game_id": quote.game_id,
        "source_game_id": mapping.source_game_id,
        "market_id": quote.market_id,
        "source_record_id": quote.source_record_id,
        "bookmaker_id": quote.bookmaker_id,
        "mapping_evidence_sha256": mapping.mapping_evidence_sha256,
        "availability_evidence_sha256": availability.availability_evidence_sha256,
        "license_id": rights.license_id,
        "model_version": paper.model_version,
        "assessed_at": utc(paper.assessed_at).isoformat(),
        "available_at": utc(availability.available_at).isoformat(),
        "externally_verified": False,
        "training_eligible": False,
        "publication_allowed": False,
        "gate_status": "NO_GO",
    }
    record["binding_sha256"] = hashlib.sha256(json.dumps(
        record, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return record

def write_binding(record: dict, directory: Path) -> Path:
    if (record.get("gate_status") != "NO_GO" or record.get("publication_allowed") is not False or
        record.get("status") != "LOCAL_BINDING_ONLY"):
        raise ValueError("Only blocked local bindings may be persisted")
    if directory.is_symlink() or ".git" in directory.parts:
        raise ValueError("Private non-repository directory required")
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    destination = directory / (record["binding_sha256"] + ".historical-binding.json")
    with destination.open("x", encoding="utf-8") as stream:
        json.dump(record, stream, sort_keys=True, indent=2)
    destination.chmod(0o600)
    return destination
