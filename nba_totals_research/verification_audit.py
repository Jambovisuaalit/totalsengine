"""Structured fail-closed evidence decision audit. Never authorizes publication."""
from __future__ import annotations
import hashlib
import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Mapping

from .core import PaperAssessment
from .verification_v2 import Authority, Envelope, ROLES, assess_bundle, verify_envelope

def audit_bundle(ledger_dir: Path, receipt_file: Path, paper: PaperAssessment,
                 envelopes: Mapping[str, Envelope], roots: Mapping[tuple[str, str], Authority],
                 *, now: datetime, source_id: str, jurisdiction: str) -> dict:
    """Read-only audit. An absent/revoked/invalid role never becomes external proof."""
    decision = assess_bundle(ledger_dir, receipt_file, paper, envelopes, roots,
                             now=now, source_id=source_id, jurisdiction=jurisdiction)
    roles = {}
    for role in ROLES:
        item = envelopes.get(role)
        root = roots.get((role, item.key_id)) if isinstance(item, Envelope) else None
        roles[role] = {
            "proof_present": isinstance(item, Envelope),
            "key_id": item.key_id if isinstance(item, Envelope) else None,
            "authority_enrolled": root is not None,
            "authority_revoked": root.revoked if root is not None else None,
            "role_matches": bool(root and root.role == role),
            "signature_b64_sha256": hashlib.sha256(item.signature_b64.encode()).hexdigest()
                if isinstance(item, Envelope) else None,
            "signature_and_claims_verified": verify_envelope(item, role, roots, now=now)[0],
        }
    # Gate success requires successful signed-role verification inside assess_bundle.
    # Do not imply a gate success proves every subclaim without independent validation.
    audit = {
        "schema_version": 1,
        "evidence_level": "EXTERNAL_GATE_EVALUATED" if not decision.missing
                          else "LOCAL_RECEIPT_WITH_UNVERIFIED_EXTERNAL_GATES",
        "receipt_sha256": decision.receipt_sha256,
        "local_chain_head_sha256": decision.local_chain_head,
        "paper_sha256": paper.evidence_sha256,
        "bundle_sha256": decision.bundle_hash,
        "roles": roles,
        "gates": dict(decision.checks),
        "missing_gates": list(decision.missing),
        "timestamp_gate_valid": decision.checks["PRE_TIPOFF_ATTESTED"],
        "publication_allowed": False,
        "decision": "NO_GO",
    }
    return audit

def write_audit(audit: dict, output: Path) -> Path:
    if audit.get("publication_allowed") is not False or audit.get("decision") != "NO_GO":
        raise ValueError("Only fail-closed audit output supported")
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with output.open("x", encoding="utf-8") as stream:
        json.dump(audit, stream, indent=2, sort_keys=True)
    output.chmod(0o600)
    return output
