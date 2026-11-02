"""Evidence Collector v1: offline-only, local-clock-unattested paper receipts.

Consumes one locally supplied canonical quote envelope; NO HTTP, credentials,
provider polling, wagering, prediction training, or publication capabilities.
Write-once hash-linked receipts detect corruption relative to a known anchor,
but cannot provide independent timestamp or tamper-proof storage.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Callable

from .core import Market, Quote, SCOPE, utc

UTC = timezone.utc
MAX_INPUT_BYTES = 32_768
MAX_RECEIPTS = 100_000
ZERO_HASH = "0" * 64
RECEIPT_NAME = re.compile(r"^([0-9]{8})-([0-9a-f]{64})\.evidence\.json$")
SOURCE_MODES = frozenset({"SYNTHETIC", "LOCAL_FILE_UNVERIFIED"})
EXPECTED_KEYS = frozenset({
    "game_id", "line", "side", "scope", "book", "odds",
    "scheduled_tipoff", "provider_published_at", "provider_quote_id",
    "offered", "live",
})


def _hash(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("utf-8")


def _timestamp(value: object) -> datetime:
    if not isinstance(value, str) or len(value) > 40:
        raise ValueError("Timestamp must be an ISO-8601 string")
    try:
        return utc(datetime.fromisoformat(value))
    except ValueError as exc:
        raise ValueError("Invalid aware timestamp") from exc


def _number(value: object) -> Decimal:
    if not isinstance(value, str) or not re.fullmatch(r"[0-9]{1,3}(?:\.[0-9]{1,5})?", value):
        raise ValueError("Canonical Decimal string required")
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise ValueError("Invalid decimal number") from exc


def _parse_quote(raw: bytes, received_at: datetime) -> Quote:
    if len(raw) > MAX_INPUT_BYTES:
        raise ValueError("Input exceeds size bound")
    try:
        item = json.loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("Invalid JSON") from exc
    if not isinstance(item, dict) or set(item) != EXPECTED_KEYS:
        raise ValueError("Unexpected or missing canonical quote fields")
    if type(item["offered"]) is not bool or type(item["live"]) is not bool:
        raise ValueError("Quote trading flags must be true booleans")
    market = Market(
        game_id=item["game_id"], line=_number(item["line"]),
        side=item["side"], scope=item["scope"],
    )
    return Quote(
        market=market, book=item["book"], odds=_number(item["odds"]),
        scheduled_tipoff=_timestamp(item["scheduled_tipoff"]),
        observed_at=received_at,
        provider_published_at=_timestamp(item["provider_published_at"]),
        raw_response_sha256=_hash(raw),
        provider_quote_id=item["provider_quote_id"],
        offered=item["offered"], live=item["live"],
    )


def _private_dir(directory: Path) -> None:
    if ".git" in directory.parts or directory.is_symlink():
        raise ValueError("Ledger path cannot be a git directory or symlink")
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(directory, 0o700)


def verify_ledger(directory: Path) -> dict:
    """Detect local corruption relative to this chain; NOT independent notarization."""
    if directory.is_symlink():
        raise ValueError("Symlinked evidence directory")
    if not directory.exists():
        return {"status": "EMPTY", "receipt_count": 0,
                "head_sha256": ZERO_HASH, "independently_attested": False}
    entries = sorted(directory.glob("*.evidence.json"))
    if len(entries) > MAX_RECEIPTS:
        raise ValueError("Ledger exceeds bounded record budget")
    prior = ZERO_HASH
    for index, path in enumerate(entries, 1):
        match = RECEIPT_NAME.fullmatch(path.name)
        if not match or path.is_symlink() or int(match.group(1)) != index:
            raise ValueError("Invalid ledger filename, ordering, or symlink")
        raw = path.read_bytes()
        if len(raw) > MAX_INPUT_BYTES or _hash(raw) != match.group(2):
            raise ValueError("Tampered or oversized receipt")
        try:
            record = json.loads(raw)
        except ValueError as exc:
            raise ValueError("Unreadable receipt") from exc
        if (not isinstance(record, dict) or
            record.get("schema_version") != 1 or
            record.get("sequence") != index or
            record.get("previous_receipt_sha256") != prior or
            record.get("publication_allowed") is not False or
            record.get("independently_attested") is not False):
            raise ValueError("Broken hash link or receipt safety fields")
        prior = match.group(2)
    return {"status": "LOCAL_HASH_CHAIN_VALID", "receipt_count": len(entries),
            "head_sha256": prior, "independently_attested": False}


def capture(
    raw: bytes,
    directory: Path,
    *,
    source_mode: str,
    clock: Callable[[], datetime] = lambda: datetime.now(UTC),
) -> dict:
    """Record all attempts, including rejected and repeated quote payloads.

    A successful local validation is explicitly *not* a verified provider
    observation, bookmaker execution receipt, or permission to publish.
    """
    if source_mode not in SOURCE_MODES:
        raise ValueError("Unrecognized evidence source mode")
    if not isinstance(raw, bytes):
        raise TypeError("Raw evidence must be bytes")
    received = utc(clock())  # Host clock; not a trusted timestamp authority.
    payload_sha = _hash(raw)
    status = "SCHEMA_AND_LOCAL_TIME_VALID_ONLY"
    reason_code = None
    market_details = None
    try:
        quote = _parse_quote(raw, received)
        quote.validate(received)
        market_details = {
            "game_id": quote.market.game_id,
            "line": str(quote.market.line.normalize()),
            "side": quote.market.side,
            "settlement_scope": quote.market.scope,
            "book": quote.book,
            "decimal_odds": str(quote.odds),
            "scheduled_tipoff_utc": utc(quote.scheduled_tipoff).isoformat(),
            "claimed_provider_published_at_utc":
                utc(quote.provider_published_at).isoformat(),
            "provider_quote_id": quote.provider_quote_id,
        }
    except (ValueError, TypeError, KeyError, AttributeError) as exc:
        status = "REJECTED"
        if len(raw) > MAX_INPUT_BYTES:
            reason_code = "OVERSIZE"
        elif isinstance(exc, KeyError):
            reason_code = "INVALID_SCHEMA"
        else:
            reason_code = "SCHEMA_OR_TIME_VALIDATION_FAILED"

    _private_dir(directory)
    lock_path = directory / ".evidence.lock"
    if lock_path.is_symlink():
        raise ValueError("Symlinked evidence lock")
    with lock_path.open("a+b") as lock:
        os.chmod(lock_path, 0o600)
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            state = verify_ledger(directory)
            if state["receipt_count"] >= MAX_RECEIPTS:
                raise ValueError("Ledger capacity exceeded")
            if status != "REJECTED":
                for path in directory.glob("*.evidence.json"):
                    prev = json.loads(path.read_bytes())
                    if (prev.get("payload_sha256") == payload_sha and
                            prev.get("status") in (
                                "SCHEMA_AND_LOCAL_TIME_VALID_ONLY", "DUPLICATE_PAYLOAD")):
                        status = "DUPLICATE_PAYLOAD"
                        reason_code = "REPLAY_NOT_INDEPENDENT_SNAPSHOT"
                        break
            receipt = {
                "schema_version": 1,
                "sequence": state["receipt_count"] + 1,
                "previous_receipt_sha256": state["head_sha256"],
                "source_mode": source_mode,
                "capture_transport": "LOCAL_OFFLINE",
                "local_host_received_at_utc": received.isoformat(),
                "timestamp_trust": "LOCAL_HOST_CLOCK_UNATTESTED",
                "provider_publication_trust": "USER_SUPPLIED_UNATTESTED",
                "payload_sha256": payload_sha,
                "payload_size_bytes": len(raw),
                "quote": market_details if status != "REJECTED" else None,
                "status": status,
                "reason_code": reason_code,
                "executable_status": "NOT_VERIFIED",
                "provider_rights_verified": False,
                "model_validation_verified": False,
                "independently_attested": False,
                "publication_allowed": False,
                "training_eligible": False,
            }
            content = _canonical(receipt)
            file_sha = _hash(content)
            name = f"{receipt['sequence']:08d}-{file_sha}.evidence.json"
            destination = directory / name
            # O_EXCL is an additional safeguard; concurrent writers are flock-serialized.
            with destination.open("xb") as f:
                os.chmod(destination, 0o600)
                f.write(content)
                f.flush()
                os.fsync(f.fileno())
            return {"status": status, "reason_code": reason_code,
                    "sequence": receipt["sequence"],
                    "receipt_sha256": file_sha, "private_receipt": str(destination),
                    "network_calls": 0, "independently_attested": False,
                    "executable_status": "NOT_VERIFIED",
                    "publication_allowed": False, "training_eligible": False}
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def _synthetic(at: datetime) -> bytes:
    tipoff = at + timedelta(minutes=62)
    return _canonical({
        "game_id": "123e4567-e89b-42d3-a456-426614174000",
        "line": "228.5", "side": "OVER", "scope": SCOPE,
        "book": "synthetic_book_a", "odds": "1.93",
        "scheduled_tipoff": tipoff.isoformat(),
        "provider_published_at": (at - timedelta(seconds=10)).isoformat(),
        "provider_quote_id": "synthetic-only-001",
        "offered": True, "live": False,
    })


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    operation = parser.add_mutually_exclusive_group(required=True)
    operation.add_argument("--demo", action="store_true",
                           help="Generate synthetic quote, no network")
    operation.add_argument("--input", type=Path,
                           help="Read small local quote JSON, unverified only")
    operation.add_argument("--verify", action="store_true",
                           help="Verify local hash chain only; not an independent anchor")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.verify:
            print(json.dumps(verify_ledger(args.output), indent=2))
            return
        if args.demo:
            raw, source = _synthetic(datetime.now(UTC)), "SYNTHETIC"
        else:
            if args.input.is_symlink() or args.input.stat().st_size > MAX_INPUT_BYTES:
                parser.error("Input cannot be symlinked or exceed size bound")
            raw, source = args.input.read_bytes(), "LOCAL_FILE_UNVERIFIED"
        report = capture(raw, args.output, source_mode=source)
        print(json.dumps(report, indent=2))
        if report["status"] == "REJECTED":
            parser.exit(status=2)
    except (ValueError, OSError) as exc:
        # The error contains no supplied data, token or raw provider response.
        parser.error(str(exc))


if __name__ == "__main__":
    main()
