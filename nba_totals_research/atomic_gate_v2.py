"""Transactional OFFLINE dry-run gate for Evidence Collector v2.

No publish API, queue dispatcher, bookmaker API, model training or live network.
An SQLite BEGIN IMMEDIATE serializes kill switch, proof verification, replay
protection and a paper-only decision receipt. It is NOT a distributed atomic
transaction with provider/storage/publisher services.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Mapping

from .core import PaperAssessment, utc
from .verification_v2 import Authority, Envelope, V2Decision, assess_bundle

REQUEST = re.compile(r"^[a-zA-Z0-9_.-]{8,128}$")
STATES = ("HALTED", "BLOCKED_MISSING_EVIDENCE", "DRY_RUN_ELIGIBLE_NO_PUBLISH")


@dataclass(frozen=True)
class AtomicDryRunResult:
    request_id: str
    status: str
    checks: dict[str, bool]
    missing: tuple[str, ...]
    publication_allowed: bool = False
    actual_delivery_attempts: int = 0


class OfflineGate:
    """No credentials, no outbound channel, and no method to disable kill switch."""

    def __init__(self, database: Path):
        if not isinstance(database, Path) or database.is_symlink() or ".git" in database.parts:
            raise ValueError("Private SQLite database path required; symlinks/git forbidden")
        database.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.database = database
        with closing(self._connect()) as conn, conn:
            conn.execute("BEGIN IMMEDIATE")
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS policy_control (
                    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                    halted INTEGER NOT NULL CHECK (halted IN (0,1))
                );
                INSERT OR IGNORE INTO policy_control(singleton,halted) VALUES (1,1);
                CREATE TABLE IF NOT EXISTS dry_run_attempts (
                    request_id TEXT PRIMARY KEY,
                    paper_sha256 TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN (
                        'HALTED','BLOCKED_MISSING_EVIDENCE','DRY_RUN_ELIGIBLE_NO_PUBLISH'
                    )),
                    checks_json TEXT NOT NULL,
                    missing_json TEXT NOT NULL,
                    recorded_at TEXT NOT NULL,
                    publisher_calls INTEGER NOT NULL DEFAULT 0 CHECK (publisher_calls=0)
                );
            """)
            conn.commit()
        if self.database.exists():
            os.chmod(self.database, 0o600)

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database, timeout=10, isolation_level=None)
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    def activate_kill_switch(self) -> None:
        with closing(self._connect()) as conn, conn:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("UPDATE policy_control SET halted=1 WHERE singleton=1")
            conn.commit()

    def evaluate_and_record(
        self,
        *,
        request_id: str,
        evidence_dir: Path,
        receipt_file: Path,
        paper: PaperAssessment,
        envelopes: Mapping[str, Envelope],
        roots: Mapping[tuple[str, str], Authority],
        now: datetime,
        source_id: str,
        jurisdiction: str,
    ) -> AtomicDryRunResult:
        if not isinstance(request_id, str) or not REQUEST.fullmatch(request_id):
            raise ValueError("Invalid idempotency request ID")
        at = utc(now)
        with closing(self._connect()) as conn, conn:
            conn.execute("BEGIN IMMEDIATE")
            previous = conn.execute(
                "SELECT paper_sha256,status,checks_json,missing_json "
                "FROM dry_run_attempts WHERE request_id=?", (request_id,)).fetchone()
            halted = conn.execute(
                "SELECT halted FROM policy_control WHERE singleton=1").fetchone()
            if halted is None:
                raise ValueError("Missing kill switch state")
            # Re-evaluation occurs *inside* the single SQLite transaction.
            decision: V2Decision = assess_bundle(
                evidence_dir, receipt_file, paper, envelopes, roots,
                now=at, source_id=source_id, jurisdiction=jurisdiction)
            if halted[0] == 1:
                status = "HALTED"
            elif not decision.cryptographic_dry_run_eligible:
                status = "BLOCKED_MISSING_EVIDENCE"
            else:
                # Even if all synthetic proofs verify: no dispatch is possible.
                status = "DRY_RUN_ELIGIBLE_NO_PUBLISH"
            if previous is not None:
                if previous[0] != paper.evidence_sha256:
                    raise ValueError("Idempotency collision with different assessment")
                # Never re-use an older GO-like result after a new kill switch,
                # revoked key, expired proof, or corrupted local receipt.
                conn.commit()
                return AtomicDryRunResult(
                    request_id, status, decision.checks, decision.missing)
            conn.execute(
                "INSERT INTO dry_run_attempts "
                "(request_id,paper_sha256,status,checks_json,missing_json,recorded_at,publisher_calls) "
                "VALUES (?,?,?,?,?,?,0)",
                (request_id, paper.evidence_sha256, status,
                 json.dumps(decision.checks, sort_keys=True),
                 json.dumps(decision.missing), at.isoformat()))
            conn.commit()
            return AtomicDryRunResult(
                request_id, status, decision.checks, decision.missing)

    def audit(self) -> dict:
        with closing(self._connect()) as conn, conn:
            conn.execute("BEGIN IMMEDIATE")
            control = conn.execute(
                "SELECT halted FROM policy_control WHERE singleton=1").fetchone()
            if control is None:
                raise ValueError("Missing mandatory kill switch")
            rows = conn.execute(
                "SELECT status, COUNT(*), SUM(publisher_calls) "
                "FROM dry_run_attempts GROUP BY status").fetchall()
            counts = {s: 0 for s in STATES}
            calls = 0
            for status, count, publisher_calls in rows:
                if status not in counts or publisher_calls != 0:
                    raise ValueError("Unexpected publishing action or state")
                counts[status] = count
                calls += publisher_calls
            conn.commit()
            return {
                "status": "NO_GO_OFFLINE_ONLY",
                "kill_switch_active": control[0] == 1,
                "dry_run_attempts": sum(counts.values()),
                "dry_run_statuses": counts,
                "actual_delivery_attempts": calls,
                "published_signal_denominator": 0,
                "published_without_verified_evidence": 0,
                "verified_publish_compliance_rate": None,
                "publication_enabled": False,
                "distributed_atomic_send_implemented": False,
            }
