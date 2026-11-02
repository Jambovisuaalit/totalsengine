"""Read-only forward infrastructure preflight. No secrets printed and no writes.

Checks: presence of signed rights/schedule evidence is NOT independently
verified by this tool. A successful result never admits a prediction.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


def check(config: dict, *, s3_client=None) -> dict:
    checks = []
    def add(name, passed, reason):
        checks.append({"check": name, "status": "PASS_CONFIG" if passed else "BLOCKED",
                       "detail": reason})
    tsa_url = config.get("tsa_url", "")
    parsed = urlparse(tsa_url)
    ca = Path(config.get("tsa_ca_file") or "/nonexistent")
    tsa_ok = (parsed.scheme == "https" and bool(parsed.hostname)
              and not parsed.username and not parsed.password
              and not parsed.fragment and ca.is_file())
    add("tsa_ca_and_endpoint", tsa_ok, "Configured, but trust not independently assessed"
        if tsa_ok else "Approved HTTPS TSA endpoint and pinned CA file needed")
    openssl = shutil.which("openssl")
    add("openssl", bool(openssl), "Installed" if openssl else "Missing")
    if openssl:
        proc = subprocess.run([openssl, "version"], capture_output=True, text=True,
                              timeout=5, check=False)
        add("openssl_works", proc.returncode == 0, "Binary executed" if proc.returncode == 0 else "Binary failed")
    bucket = config.get("s3_bucket")
    if bucket and s3_client is not None:
        try:
            status = s3_client.get_object_lock_configuration(Bucket=bucket)
            enabled = status.get("ObjectLockConfiguration", {}).get("ObjectLockEnabled") == "Enabled"
            add("s3_object_lock", enabled, "Bucket Object Lock enabled (write/read test pending)"
                if enabled else "Bucket Object Lock disabled")
        except Exception as exc:
            add("s3_object_lock", False, "Cannot confirm Object Lock: " + type(exc).__name__)
    else:
        add("s3_object_lock", False, "S3 client or bucket not configured")
    for name in ("licensed_source_evidence", "schedule_mapping_evidence",
                 "feature_availability_evidence", "model_artifact_evidence"):
        p = config.get(name)
        exists = bool(p and Path(p).is_file())
        add(name, exists, "File found, contents and provenance NOT verified" if exists
            else "Required evidence missing")
    ready = all(x["status"] == "PASS_CONFIG" for x in checks)
    return {"status": "CONFIG_PRESENT_NOT_ADMITTED" if ready else "BLOCKED",
            "checks": checks, "independently_verified_prediction_count": 0,
            "publication_allowed": False, "gate_status": "NO_GO",
            "generated_at_utc": datetime.now(timezone.utc).isoformat()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    config = json.loads(args.config.read_text())
    client = None
    if config.get("s3_bucket"):
        try:
            import boto3
            client = boto3.client("s3")
        except ImportError:
            pass
    report = check(config, s3_client=client)
    print(json.dumps(report, indent=2, sort_keys=True))
    if report["status"] == "BLOCKED":
        raise SystemExit(2)

if __name__ == "__main__":
    main()
