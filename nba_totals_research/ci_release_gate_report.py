"""CI-only NBA release report. This does not replace the existing release_gate module."""
from __future__ import annotations
import json
from pathlib import Path


def evaluate(*, head_sha: str, ci: dict, rights: dict,
             synthetic_receipt: dict | None = None,
             source_evidence: dict | None = None) -> dict:
    if not isinstance(head_sha, str) or len(head_sha) != 40:
        raise ValueError("Expected full commit SHA")
    names = ("Root CI", "NBA research regression and evidence contracts",
             "NBA totals evidence core (synthetic)")
    checks = {name: ci.get(name) == "success" for name in names}
    checks["synthetic_sigstore"] = bool(
        synthetic_receipt and synthetic_receipt.get("verification_status") == "PASS_SYNTHETIC_ONLY")
    checks["rights"] = rights.get("review_status") == "APPROVED" and (
        rights.get("allow_capture") is True and rights.get("allow_raw_retention") is True)
    checks["real_source_attested"] = bool(source_evidence and
        source_evidence.get("sigstore_verified") is True)
    checks["source_pit"] = bool(source_evidence and
        source_evidence.get("source_availability_verified") is True)
    checks["actual_start"] = bool(source_evidence and
        source_evidence.get("actual_start_verified") is True)
    checks["independent_oos"] = bool(source_evidence and
        source_evidence.get("independent_oos_verified") is True)
    checks["odds_provenance"] = bool(source_evidence and
        source_evidence.get("odds_provenance_verified") is True)
    return {
        "schema": 1, "head_sha": head_sha, "checks": checks,
        "synthetic_acceptance": "PASS" if all(checks[n] for n in
            (*names, "synthetic_sigstore")) else "HOLD",
        "production_release": "HOLD", "prediction_publication": "HOLD",
        "market_comparison": "HOLD", "ev_signals": "HOLD",
        "automatic_bet_placement": "DISABLED",
        "missing": sorted(k for k, v in checks.items() if not v),
        "manual_approval_required": True,
    }
