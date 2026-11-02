"""Versioned, offline NBA totals modeling contracts. No training or publication adapter."""
from __future__ import annotations
import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Mapping
from uuid import UUID
from .core import Market, Quote, SCOPE, utc

SHA = re.compile(r"^[0-9a-f]{64}$")
VERSION = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$")

def digest_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

@dataclass(frozen=True)
class Dataset:
    source: str
    license_reference: str
    sha256: str
    observed_at: datetime
    available_at: datetime
    game_id: str

    def validate(self, prediction_at: datetime) -> None:
        if str(UUID(self.game_id)) != self.game_id:
            raise ValueError("Canonical game identifier required")
        if not self.source or not self.license_reference or not SHA.fullmatch(self.sha256):
            raise ValueError("Source, license reference and dataset hash required")
        if utc(self.observed_at) > utc(self.available_at) or utc(self.available_at) > utc(prediction_at):
            raise ValueError("Look-ahead leakage: feature not available at prediction time")

@dataclass(frozen=True)
class PipelineSpec:
    version: str
    source: str
    license_reference: str
    training_start: datetime
    training_end: datetime
    validation_start: datetime
    validation_end: datetime
    features: tuple[str, ...]
    target: str = SCOPE

    def validate(self) -> None:
        if not VERSION.fullmatch(self.version) or not self.source or not self.license_reference:
            raise ValueError("Versioned source and license reference required")
        if not (utc(self.training_start) < utc(self.training_end) <=
                utc(self.validation_start) < utc(self.validation_end)):
            raise ValueError("Non-overlapping chronological train/validation windows required")
        if not self.features or len(set(self.features)) != len(self.features) or any(not f for f in self.features):
            raise ValueError("Unique named features required")
        if self.target != SCOPE:
            raise ValueError("Only NBA full-game including-OT totals supported")

@dataclass(frozen=True)
class ModelPrediction:
    version: str
    market: Market
    bookmaker: str
    quote_id: str
    predicted_at: datetime
    scheduled_tipoff: datetime
    p_win: Decimal
    p_push: Decimal
    p_lose: Decimal
    expected_total: Decimal
    evidence_sha256: str

    def validate(self, quote: Quote) -> None:
        self.market.validate()
        if not VERSION.fullmatch(self.version) or not SHA.fullmatch(self.evidence_sha256):
            raise ValueError("Version and evidence digest required")
        if (self.market != quote.market or self.bookmaker != quote.book or
                self.quote_id != quote.provider_quote_id or
                utc(self.scheduled_tipoff) != utc(quote.scheduled_tipoff)):
            raise ValueError("Exact game, line, side, OT scope, bookmaker and quote required")
        quote.validate(self.predicted_at)
        if not (utc(self.predicted_at) < utc(self.scheduled_tipoff)):
            raise ValueError("Expired market")
        probs = (self.p_win, self.p_push, self.p_lose)
        if any(not isinstance(p, Decimal) or not p.is_finite() or p < 0 or p > 1 for p in probs):
            raise ValueError("Invalid outcome probabilities")
        if (sum(probs) != Decimal("1") or not isinstance(self.expected_total, Decimal)
                or not self.expected_total.is_finite()):
            raise ValueError("Invalid probability mass or expected total")

def artifact_manifest(spec: PipelineSpec, paths: Mapping[str, Path],
                      evidence_references: tuple[str, ...]) -> dict:
    """Content-addressed local manifest; never claims external attestation."""
    spec.validate()
    required = {"model", "training_data", "validation_data", "evaluation_report"}
    if set(paths) != required or not evidence_references or any(not SHA.fullmatch(x) for x in evidence_references):
        raise ValueError("All four artifacts and SHA-256 evidence references required")
    artifacts = {key: {"path": str(paths[key]), "sha256": digest_file(paths[key])}
                 for key in sorted(required)}
    payload = {
        "schema_version": 1, "model_version": spec.version,
        "source": spec.source, "license_reference": spec.license_reference,
        "training_window": [utc(spec.training_start).isoformat(), utc(spec.training_end).isoformat()],
        "validation_window": [utc(spec.validation_start).isoformat(), utc(spec.validation_end).isoformat()],
        "features": list(spec.features), "target": spec.target,
        "artifacts": artifacts, "evidence_references": list(evidence_references),
        "externally_verified": False, "publication_allowed": False,
    }
    payload["manifest_sha256"] = hashlib.sha256(json.dumps(payload, sort_keys=True,
        separators=(",", ":")).encode()).hexdigest()
    return payload
