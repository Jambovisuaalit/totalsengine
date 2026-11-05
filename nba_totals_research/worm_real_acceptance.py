"""Real AWS S3 Object Lock concurrency and retention acceptance test.

Synthetic bytes only. Requires explicit opted-in bucket and irreversible write
acknowledgment. Does NOT configure AWS or activate data collection.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import secrets
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from botocore.exceptions import ClientError


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _code(exc: ClientError) -> str:
    return str(exc.response.get("Error", {}).get("Code", ""))


def run(*, client, bucket: str, confirmed_bucket: str, acknowledged: bool,
        retention_days: int = 2, test_id: str | None = None) -> dict:
    if not bucket or bucket != confirmed_bucket or acknowledged is not True:
        raise ValueError("Exact bucket confirmation and immutable-write acknowledgement required")
    if not isinstance(retention_days, int) or not 2 <= retention_days <= 7:
        raise ValueError("Retention must be 2..7 days")
    cfg = client.get_object_lock_configuration(Bucket=bucket)["ObjectLockConfiguration"]
    if cfg.get("ObjectLockEnabled") != "Enabled":
        raise ValueError("Object Lock is not enabled")
    if client.get_bucket_versioning(Bucket=bucket).get("Status") != "Enabled":
        raise ValueError("Versioning must be enabled")
    token = test_id or secrets.token_hex(16)
    if len(token) != 32 or any(x not in "0123456789abcdef" for x in token):
        raise ValueError("Invalid 32-character hex test ID")
    key = f"totalsengine-worm-real-acceptance/{token}/first.json"
    retain_until = datetime.now(timezone.utc) + timedelta(days=retention_days)
    barrier = Barrier(2)
    bodies = [b"synthetic-first-final-candidate-A-" + token.encode(),
              b"synthetic-first-final-candidate-B-" + token.encode()]

    def attempt(body):
        barrier.wait(timeout=15)
        try:
            resp = client.put_object(
                Bucket=bucket, Key=key, Body=body,
                ContentType="application/json",
                IfNoneMatch="*", ChecksumAlgorithm="SHA256",
                ObjectLockMode="COMPLIANCE",
                ObjectLockRetainUntilDate=retain_until)
            version = resp.get("VersionId")
            if not version:
                raise ValueError("Successful PUT missing version ID")
            return {"outcome": "CREATED", "version": version, "body_sha": sha256(body)}
        except ClientError as exc:
            if _code(exc) not in {"PreconditionFailed", "412", "ConditionalRequestConflict", "409"}:
                raise
            return {"outcome": "CONFLICT", "error_code": _code(exc)}

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(attempt, body) for body in bodies]
        attempts = [f.result() for f in futures]
    created = [x for x in attempts if x["outcome"] == "CREATED"]
    conflicts = [x for x in attempts if x["outcome"] == "CONFLICT"]
    if len(created) != 1 or len(conflicts) != 1:
        raise ValueError(f"Atomic first-write contract failed: {attempts!r}")

    version = created[0]["version"]
    current = client.head_object(Bucket=bucket, Key=key)
    if current.get("VersionId") != version:
        raise ValueError("First-write winner is not the current object version")
    # Ensure a later conditional overwrite cannot create a new version.
    try:
        client.put_object(Bucket=bucket, Key=key, Body=b"synthetic-later-writer",
                          IfNoneMatch="*", ObjectLockMode="COMPLIANCE",
                          ObjectLockRetainUntilDate=retain_until)
    except ClientError as exc:
        if _code(exc) not in {"PreconditionFailed", "412"}:
            raise
        later_write_rejected = True
    else:
        raise ValueError("Atomic first-write key allowed a later overwrite")
    kwargs = {"Bucket": bucket, "Key": key, "VersionId": version}
    head = client.head_object(**kwargs)
    returned = client.get_object(**kwargs)["Body"].read()
    if sha256(returned) != created[0]["body_sha"]:
        raise ValueError("Versioned byte read-back mismatch")
    if returned not in bodies:
        raise ValueError("Unexpected archive source bytes")
    retention = client.get_object_retention(**kwargs)["Retention"]
    if (retention.get("Mode") != "COMPLIANCE"
            or retention.get("RetainUntilDate") < retain_until):
        raise ValueError("COMPLIANCE retention was not verified")
    # A direct delete of this exact version must be denied before expiry.
    try:
        client.delete_object(**kwargs)
    except ClientError as exc:
        if _code(exc) not in {"AccessDenied", "403"}:
            raise
        delete_denied = True
    else:
        raise ValueError("CRITICAL: retained object version was deletable")
    # Re-read after the denial to ensure original immutable bytes survived.
    after = client.get_object(**kwargs)["Body"].read()
    if after != returned:
        raise ValueError("Object changed after denied delete")
    return {
        "schema": 1,
        "test": "REAL_S3_OBJECT_LOCK_ACCEPTANCE_SYNTHETIC",
        "bucket": bucket, "key": key, "version_id": version,
        "created": len(created), "conflicts": len(conflicts),
        "later_conditional_write_rejected": later_write_rejected,
        "readback_sha256": sha256(returned),
        "byte_exact_readback": True,
        "lock_mode": retention["Mode"],
        "retention_until_utc": retention["RetainUntilDate"].isoformat(),
        "head_last_modified_utc": head["LastModified"].isoformat(),
        "version_delete_denied": delete_denied,
        "post_delete_readback_verified": True,
        "credentials_prove_lock_denial": False,
        "external_source_provenance": False,
        "evaluation_eligible": False,
        "publication_allowed": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--confirm-bucket", required=True)
    parser.add_argument("--ack-immutable-write", action="store_true")
    parser.add_argument("--retention-days", type=int, default=2)
    args = parser.parse_args()
    if args.bucket != args.confirm_bucket or not args.ack_immutable_write:
        parser.error("Explicit exact-name confirmation and irreversible-write acknowledgement required")
    import boto3
    result = run(client=boto3.client("s3"), bucket=args.bucket,
                 confirmed_bucket=args.confirm_bucket,
                 acknowledged=args.ack_immutable_write,
                 retention_days=args.retention_days)
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
