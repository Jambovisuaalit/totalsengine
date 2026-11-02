"""Fail-closed publication policy for isolated NBA totals research.

This module never publishes signals or upgrades a local/claimed verification
status into an independent attestation. No provider/API/database integration.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

from .collector import RECEIPT_NAME, _hash, verify_ledger
from .core import PaperAssessment, T60, utc

REQUIRED_GATES = (
    "PRE_TIPOFF_ATTESTED",
    "EXACT_MARKET_MATCH",
    "DATA_RIGHTS_APPROVED",
    "EXECUTION_VERIFIED",
    "INDEPENDENT_MODEL_VALIDATED",
    "PUBLISHER_AUTHORIZED",
)
MAX_ASSESSMENT_LAG = timedelta(seconds=120)


@dataclass(frozen=True)
class ReleaseGateReport:
    verdict: str
    checks: dict[str, bool]
    reasons: tuple[str, ...]
    receipt_sha256: str | None
    ledger_head_sha256: str
    paper_assessment_sha256: str | None
    publication_allowed: bool = False
    kpi_verified_publish_rate: None = None
    """No signal publication exists, so measured release compliance is undefined."""


def _same_market(receipt: dict, paper: PaperAssessment | None) -> bool:
    """Structural match only; not proof that the quote truly existed at source."""
    if paper is None or paper.publication_allowed is not False:
        return False
    if paper.status not in ("PAPER_CANDIDATE", "PASS"):
        return False
    item = receipt.get("quote")
    if not isinstance(item, dict):
        return False
    try:
        if (item["game_id"] != paper.market.game_id
                or item["side"] != paper.market.side
                or item["settlement_scope"] != paper.market.scope
                or item["book"] != paper.bookmaker
                or item["provider_quote_id"] != paper.selected_quote_id
                or receipt["payload_sha256"] != paper.raw_response_sha256
                or Decimal(item["line"]) != paper.market.line
                or Decimal(item["decimal_odds"]) != paper.decimal_odds):
            return False
        recorded = datetime.fromisoformat(receipt["local_host_received_at_utc"])
        tipoff = datetime.fromisoformat(item["scheduled_tipoff_utc"])
        assessed = utc(paper.assessed_at)
        if not (utc(recorded) <= assessed <= utc(tipoff) - T60):
            return False
        if assessed - utc(recorded) > MAX_ASSESSMENT_LAG:
            return False
        paper.market.validate()
    except (ValueError, TypeError, KeyError, AttributeError, OverflowError):
        return False
    return True


def evaluate_release(
    evidence_dir: Path,
    receipt_path: Path,
    *,
    paper: PaperAssessment | None = None,
) -> ReleaseGateReport:
    """Audit one receipt and optional paper candidate, but never authorize.

    Rights, execution, publication and independent attestation must be verified
    by services with separately managed trust roots. None exists here. Do not
    trust caller-supplied booleans, hash strings, or self-signed claims.
    """
    state = verify_ledger(evidence_dir)  # Reject any corrupted local chain.
    if evidence_dir.is_symlink() or receipt_path.is_symlink():
        raise ValueError("Symlinked evidence is not accepted")
    if receipt_path.parent.resolve() != evidence_dir.resolve():
        raise ValueError("Receipt must belong to this verified ledger")
    match = RECEIPT_NAME.fullmatch(receipt_path.name)
    if not match or not receipt_path.is_file():
        raise ValueError("Expected hashed, numbered evidence receipt")
    raw = receipt_path.read_bytes()
    if _hash(raw) != match.group(2):
        raise ValueError("Receipt content digest mismatch")
    receipt = json.loads(raw)
    if int(match.group(1)) > state["receipt_count"]:
        raise ValueError("Receipt missing from verified ledger")
    local_valid = receipt.get("status") == "SCHEMA_AND_LOCAL_TIME_VALID_ONLY"
    exact_market = local_valid and _same_market(receipt, paper)

    # The local collector explicitly records untrusted host time and unverified
    # execution. A local JSON "true" cannot promote any external proof gate.
    checks = {
        "PRE_TIPOFF_ATTESTED": False,
        "EXACT_MARKET_MATCH": bool(exact_market),
        "DATA_RIGHTS_APPROVED": False,
        "EXECUTION_VERIFIED": False,
        "INDEPENDENT_MODEL_VALIDATED": False,
        "PUBLISHER_AUTHORIZED": False,
    }
    reasons = []
    if not local_valid:
        reasons.append("RECEIPT_NOT_ELIGIBLE_OR_REPLAYED")
    if paper is None:
        reasons.append("NO_LINKED_PAPER_ASSESSMENT")
    if paper is not None and paper.status == "PASS":
        reasons.append("MODEL_DECISION_PASS")
    for gate in REQUIRED_GATES:
        if not checks[gate]:
            reasons.append("MISSING_" + gate)
    return ReleaseGateReport(
        verdict="NO_GO",
        checks=checks,
        reasons=tuple(reasons),
        receipt_sha256=match.group(2),
        ledger_head_sha256=state["head_sha256"],
        paper_assessment_sha256=paper.evidence_sha256 if paper else None,
    )


def audit_release_kpi(evidence_dir: Path) -> dict:
    """Measure local receipt hygiene, NOT publication compliance.

    Empty denominator has no 100%-pass interpretation. No publish service or
    real approved attestations exist in this codebase.
    """
    chain = verify_ledger(evidence_dir)
    counts = {"SCHEMA_AND_LOCAL_TIME_VALID_ONLY": 0, "REJECTED": 0,
              "DUPLICATE_PAYLOAD": 0}
    for path in sorted(evidence_dir.glob("*.evidence.json")) if evidence_dir.exists() else ():
        receipt = json.loads(path.read_bytes())
        status = receipt.get("status")
        if status not in counts:
            raise ValueError("Unknown evidence status; fail closed")
        counts[status] += 1
    if sum(counts.values()) != chain["receipt_count"]:
        raise ValueError("Receipt inventory mismatch")
    return {
        "schema_version": 1,
        "decision": "NO_GO",
        "required_verified_publish_compliance": "100%",
        "published_signals_observed": 0,
        "published_signal_denominator": 0,
        "verified_publish_compliance_rate": None,
        "kpi_state": "NOT_MEASURABLE_NO_PUBLICATION_PATH",
        "receipt_count": chain["receipt_count"],
        "receipt_counts": counts,
        "local_chain_status": chain["status"],
        "local_chain_head_sha256": chain["head_sha256"],
        "external_timestamp_attestation_available": False,
        "bookmaker_acceptance_verification_available": False,
        "independent_model_validation_available": False,
        "verified_rights_registry_available": False,
        "publication_allowed": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-ledger", type=Path, required=True,
                        help="Existing local Evidence Collector directory")
    args = parser.parse_args()
    try:
        print(json.dumps(audit_release_kpi(args.audit_ledger),
                         sort_keys=True, indent=2))
    except (ValueError, OSError) as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
