"""Evidence Collector v2: VERIFY signed third-party claims, never issue them.

Ed25519 envelopes use role-scoped, *operator-provisioned* public roots.
This is NOT an RFC3161 TSA parser, external WORM store, live provider,
betting integration, or signal publisher. Without enrolled real issuers,
all checks fail closed. Test keys must never count as production authority.
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Mapping

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from .collector import RECEIPT_NAME, verify_ledger
from .core import PaperAssessment, T60, utc
from .release_gate import _same_market

DOMAIN = b"TOTALS_ENGINE_V2_ED25519_ENVELOPE\x00"
ROLES = ("timestamp", "source", "rights", "execution", "model", "publisher")
REQUIRED = ("PRE_TIPOFF_ATTESTED", "EXACT_MARKET_MATCH", "DATA_RIGHTS_APPROVED",
            "EXECUTION_VERIFIED", "INDEPENDENT_MODEL_VALIDATED", "PUBLISHER_AUTHORIZED")
SHA = re.compile(r"^[0-9a-f]{64}$")
MAX_ENVELOPE = 16_384
MAX_CLOCK_SKEW = timedelta(seconds=10)
MAX_EXECUTION_AGE = timedelta(seconds=60)
SCOPE = "NBA_FULL_GAME_TOTAL_INCLUDING_OT"
POLICY = "TOTALS_V2_RESEARCH_ONLY"


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode()


def sha(obj: object) -> str:
    return hashlib.sha256(canonical(obj)).hexdigest()


def when(raw: object) -> datetime:
    if not isinstance(raw, str) or len(raw) > 40:
        raise ValueError("Expected explicit timezone-aware ISO timestamp")
    return utc(datetime.fromisoformat(raw))


def _decimal(raw: object) -> str:
    from decimal import Decimal
    if not isinstance(raw, str):
        raise ValueError("Decimal string required")
    n = Decimal(raw)
    if not n.is_finite():
        raise ValueError("Finite decimal required")
    return str(n.normalize())


@dataclass(frozen=True)
class Authority:
    """Provision from a separately controlled, reviewed operator registry.

    Never accept this registry from the untrusted attestation itself.
    """
    role: str
    key_id: str
    issuer: str
    subject: str
    public_key_raw: bytes
    valid_from: datetime
    valid_until: datetime
    revoked: bool = False


@dataclass(frozen=True)
class Envelope:
    role: str
    key_id: str
    claims: Mapping[str, object]
    signature_b64: str

    def signed_bytes(self) -> bytes:
        return DOMAIN + canonical({"schema_version": 2, "role": self.role,
                                   "key_id": self.key_id, "claims": self.claims})


@dataclass(frozen=True)
class V2Decision:
    verdict: str
    checks: dict[str, bool]
    missing: tuple[str, ...]
    receipt_sha256: str
    local_chain_head: str
    bundle_hash: str
    cryptographic_dry_run_eligible: bool
    publication_allowed: bool = False
    externally_anchored_storage_verified: bool = False


def verify_envelope(
    item: Envelope | None, role: str,
    roots: Mapping[tuple[str, str], Authority],
    *, now: datetime,
) -> tuple[bool, Mapping[str, object]]:
    """Check role, fixed key, Ed25519 signature and issuer validity, not claims meaning."""
    try:
        if item is None or item.role != role or item.key_id == "" or len(item.key_id) > 100:
            return False, {}
        root = roots.get((role, item.key_id))
        if root is None or root.revoked or root.role != role or not root.issuer or not root.subject:
            return False, {}
        if len(root.public_key_raw) != 32 or root.valid_from.utcoffset() is None:
            return False, {}
        claims = item.claims
        if not isinstance(claims, dict) or len(item.signed_bytes()) > MAX_ENVELOPE:
            return False, {}
        issued, expires = when(claims.get("issued_at")), when(claims.get("expires_at"))
        now = utc(now)
        if not (utc(root.valid_from) <= issued <= now + MAX_CLOCK_SKEW
                and issued <= now <= expires <= utc(root.valid_until)):
            return False, {}
        sig = base64.b64decode(item.signature_b64, validate=True)
        if len(sig) != 64:
            return False, {}
        Ed25519PublicKey.from_public_bytes(root.public_key_raw).verify(sig, item.signed_bytes())
        return True, claims
    except (InvalidSignature, ValueError, TypeError, KeyError, OverflowError):
        return False, {}


def _record(ledger_dir: Path, receipt_file: Path) -> tuple[dict, str, str]:
    state = verify_ledger(ledger_dir)
    if (ledger_dir.is_symlink() or receipt_file.is_symlink()
            or receipt_file.parent.resolve() != ledger_dir.resolve()):
        raise ValueError("Receipt must be located in verified local ledger")
    m = RECEIPT_NAME.fullmatch(receipt_file.name)
    if not m or not receipt_file.is_file():
        raise ValueError("Invalid receipt filename")
    raw = receipt_file.read_bytes()
    if hashlib.sha256(raw).hexdigest() != m.group(2):
        raise ValueError("Receipt digest mismatch")
    record = json.loads(raw)
    if (record.get("status") != "SCHEMA_AND_LOCAL_TIME_VALID_ONLY"
            or record.get("independently_attested") is not False
            or record.get("publication_allowed") is not False):
        raise ValueError("Only original untrusted non-replayed local receipts are valid inputs")
    return record, m.group(2), state["head_sha256"]


def assess_bundle(
    ledger_dir: Path, receipt_file: Path, paper: PaperAssessment,
    envelopes: Mapping[str, Envelope],
    roots: Mapping[tuple[str, str], Authority],
    *,
    now: datetime,
    source_id: str,
    jurisdiction: str,
    minimum_stake: str = "1",
) -> V2Decision:
    """Return cryptographic DRY-RUN evidence checks; no publication adapter exists.

    Source/time, rights, bookmaker acceptance and validation signers must be
    separately enrolled. This API cannot grant real external independence
    merely because synthetic test signatures verify.
    """
    now = utc(now)
    record, receipt_sha, chain_head = _record(ledger_dir, receipt_file)
    quote = record["quote"]
    tip = when(quote["scheduled_tipoff_utc"])
    local = when(record["local_host_received_at_utc"])
    original = when(quote["claimed_provider_published_at_utc"])
    fp = sha({"receipt": receipt_sha, "payload": record["payload_sha256"],
              "quote": quote})
    checks = {k: False for k in REQUIRED}
    market_match = bool(_same_market(record, paper)
                        and paper.status == "PAPER_CANDIDATE"
                        and paper.ev_per_unit > 0
                        and paper.publication_allowed is False
                        and now <= tip - T60
                        and now >= local)
    checks["EXACT_MARKET_MATCH"] = market_match
    verified: dict[str, Mapping[str, object]] = {}
    issuers: list[str] = []
    for role in ROLES:
        envelope = envelopes.get(role)
        good, claims = verify_envelope(envelope, role, roots, now=now)
        if not good or claims.get("fingerprint_sha256") != fp:
            continue
        issuer = roots[(role, envelope.key_id)]
        if issuer.issuer in issuers:
            continue   # Roles must not be controlled by one issuer.
        issuers.append(issuer.issuer)
        verified[role] = claims

    try:
        ts, source = verified["timestamp"], verified["source"]
        observed, ts_issued = when(ts["attested_at"]), when(ts["issued_at"])
        provider_claimed = when(source["provider_published_at"])
        checks["PRE_TIPOFF_ATTESTED"] = (
            ts["receipt_sha256"] == receipt_sha
            and ts["raw_response_sha256"] == record["payload_sha256"]
            and ts["anchor_id"] not in ("", None)
            and ts_issued == observed
            and local <= observed <= now <= tip - T60
            and observed >= tip - timedelta(minutes=65)
            and original == provider_claimed
            and source["source_id"] == source_id
            and source["provider_quote_id"] == quote["provider_quote_id"]
            and source["raw_response_sha256"] == record["payload_sha256"]
            and roots[("source", envelopes["source"].key_id)].subject == source_id
            and original <= observed
            and observed - original <= timedelta(seconds=120)
        )
    except (ValueError, TypeError, KeyError, AttributeError):
        pass

    try:
        rights = verified["rights"]
        checks["DATA_RIGHTS_APPROVED"] = (
            rights["source_id"] == source_id
            and rights["book"] == quote["book"]
            and rights["jurisdiction"] == jurisdiction
            and rights["use"] == "COMMERCIAL_BETTING_SIGNALS"
            and rights["retention_allowed"] is True
            and rights["redistribution_allowed"] is True
            and bool(rights["contract_id"])
            and roots[("rights", envelopes["rights"].key_id)].subject == jurisdiction
        )
    except (ValueError, TypeError, KeyError):
        pass

    try:
        execution = verified["execution"]
        accept = when(execution["accepted_at"])
        amount = _decimal(execution["accepted_stake"])
        min_amount = _decimal(minimum_stake)
        price = _decimal(execution["accepted_odds"])
        checks["EXECUTION_VERIFIED"] = (
            execution["acceptance_status"] == "ACCEPTED"
            and execution["book"] == quote["book"]
            and execution["provider_quote_id"] == quote["provider_quote_id"]
            and execution["confirmation_id"] not in ("", None)
            and roots[("execution", envelopes["execution"].key_id)].subject == quote["book"]
            and amount is not None and float(amount) >= float(min_amount) > 0
            and price == _decimal(quote["decimal_odds"])
            and local <= accept <= now <= tip - T60
            and now - accept <= MAX_EXECUTION_AGE
        )
    except (ValueError, TypeError, KeyError, OverflowError):
        pass

    try:
        model = verified["model"]
        checks["INDEPENDENT_MODEL_VALIDATED"] = (
            model["model_version"] == paper.model_version
            and model["paper_sha256"] == paper.evidence_sha256
            and re.fullmatch(SHA, str(model["report_sha256"])) is not None
            and model["out_of_sample"] is True
            and model["no_lookahead"] is True
            and model["calibration_vs_market_pass"] is True
        )
    except (ValueError, TypeError, KeyError):
        pass

    try:
        publisher = verified["publisher"]
        checks["PUBLISHER_AUTHORIZED"] = (
            publisher["authorized"] is True
            and publisher["policy"] == POLICY
            and publisher["jurisdiction"] == jurisdiction
            and bool(publisher["publisher_id"])
        )
    except (ValueError, TypeError, KeyError):
        pass

    missing = tuple(k for k in REQUIRED if not checks[k])
    bundle_hash = sha({
        "receipt_sha256": receipt_sha, "paper_sha256": paper.evidence_sha256,
        "fingerprint": fp,
        "proofs": {k: v.signature_b64 for k, v in sorted(envelopes.items())
                   if isinstance(v, Envelope)},
    })
    return V2Decision(
        "NO_GO", checks, missing, receipt_sha, chain_head, bundle_hash,
        cryptographic_dry_run_eligible=not missing,
    )
