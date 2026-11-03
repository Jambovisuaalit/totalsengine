"""Explicit opt-in AWS S3 Object Lock COMPLIANCE smoke test; SYNTHETIC bytes only.

CRITICAL: a COMPLIANCE object version cannot be deleted until retention expires,
even by the account root user. Run solely in an owned, cost-approved test bucket.
No user-source/ESPN/BDL payloads are accepted.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from .forward_pipeline import put_object_lock

PREFIX = "totalsengine-worm-synthetic-smoke/"
SYNTHETIC_PREFIX = b"TotalsEngine synthetic S3 WORM test v1: "


def run_smoke(*, client, bucket: str, confirmed_bucket: str,
              acknowledge_immutable: bool, retention_days: int = 2,
              now: datetime | None = None, nonce: str | None = None) -> dict:
    """Call real S3 only after explicit name match + irreversible-write consent.

    Returned receipt is metadata only and not independent NBA provenance.
    """
    if (not bucket or not confirmed_bucket or bucket != confirmed_bucket or
            not acknowledge_immutable):
        raise ValueError("Exact bucket confirmation and immutable-write acknowledgement required")
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", bucket):
        raise ValueError("Invalid bucket")
    if not isinstance(retention_days, int) or not 2 <= retention_days <= 7:
        raise ValueError("Test retention must be 2-7 days; immutable retention cannot be shortened")
    dt = now or datetime.now(timezone.utc)
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Timezone-aware clock required")
    dt = dt.astimezone(timezone.utc)
    objlock = client.get_object_lock_configuration(Bucket=bucket)
    if objlock.get("ObjectLockConfiguration", {}).get("ObjectLockEnabled") != "Enabled":
        raise ValueError("Bucket Object Lock is not enabled")
    versioning = client.get_bucket_versioning(Bucket=bucket)
    if versioning.get("Status") != "Enabled":
        raise ValueError("Bucket versioning is not enabled")
    token = nonce or secrets.token_hex(16)
    if not re.fullmatch(r"[0-9a-f]{32}", token):
        raise ValueError("Invalid synthetic nonce")
    raw = SYNTHETIC_PREFIX + token.encode("ascii")
    key = PREFIX + token + ".bin"
    retain_until = dt + timedelta(days=retention_days)
    result = put_object_lock(client, bucket=bucket, key=key, raw=raw,
                             retain_until=retain_until)
    if result["sha256"] != hashlib.sha256(raw).hexdigest() or not result["version_id"]:
        raise ValueError("Object Lock receipt incomplete")
    return {
        "schema": 1, "type": "SYNTHETIC_WORM_COMPLIANCE_TEST_ONLY",
        "bucket": bucket, "key": key,
        "version_id": result["version_id"],
        "sha256": result["sha256"],
        "retain_until_requested_utc": retain_until.isoformat(),
        "object_lock_configuration": "Enabled",
        "bucket_versioning": "Enabled",
        "mode_readback_verified": "COMPLIANCE",
        "bytes_readback_verified": True,
        "test_payload_only": True,
        "deletion_not_attempted": True,
        "independent_nba_provenance": False,
        "evaluation_eligible": False,
        "publication_allowed": False,
        "gate_status": "NO_GO",
    }


def main() -> None:
    p = argparse.ArgumentParser(description="Explicit, irreversible synthetic S3 WORM smoke")
    p.add_argument("--bucket", required=True)
    p.add_argument("--confirm-bucket", required=True)
    p.add_argument("--ack-immutable-write", action="store_true")
    p.add_argument("--retention-days", type=int, default=2)
    args = p.parse_args()
    # Fail closed BEFORE resolving credentials or attempting an S3 call.
    if args.bucket != args.confirm_bucket or not args.ack_immutable_write:
        p.error("Exact bucket confirmation and --ack-immutable-write required")
    if not 2 <= args.retention_days <= 7:
        p.error("Test retention must be 2-7 days")
    import boto3
    receipt = run_smoke(
        client=boto3.client("s3"), bucket=args.bucket,
        confirmed_bucket=args.confirm_bucket,
        acknowledge_immutable=args.ack_immutable_write,
        retention_days=args.retention_days)
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
