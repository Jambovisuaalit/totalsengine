"""No-AWS synthetic evidence canary. No third-party data or wagering.

GitHub Actions signs the manifest digest with Sigstore; this script only
constructs and validates the deterministic local byte/hash chain.
GitHub artifacts are deletable; this is NOT Object Lock or durable WORM storage.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import secrets
from pathlib import Path


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(data: dict) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def create(out: Path, run_id: str, commit_sha: str) -> dict:
    out.mkdir(parents=True, exist_ok=False)
    if not run_id or not commit_sha:
        raise ValueError("Run and commit identities required")
    # Synthetic first FINAL observation only. No ESPN content or real betting data.
    sample = canonical({"event_id": "synthetic-0001",
                        "state": "FINAL", "home": 112, "away": 107,
                        "source": "SYNTHETIC_NO_PROVIDER",
                        "nonce": secrets.token_hex(16)})
    (out / "source.json").write_bytes(sample)
    evidence = {"schema": 1,
                "kind": "SYNTHETIC_GITHUB_SIGSTORE_CANARY",
                "source_sha256": digest(sample),
                "source_size": len(sample),
                "source_file": "source.json",
                "runner_commit_sha": commit_sha,
                "github_run_id": run_id,
                "upstream_first_published_at_utc": None,
                "external_timestamp_verified": False,
                "worm_retention_verified": False,
                "real_sports_source": False,
                "evaluation_eligible": False,
                "publication_allowed": False,
                "gate": "HOLD"}
    (out / "manifest.json").write_bytes(canonical(evidence))
    return evidence


def verify(out: Path) -> dict:
    manifest = json.loads((out / "manifest.json").read_bytes())
    src = (out / "source.json").read_bytes()
    if manifest["kind"] != "SYNTHETIC_GITHUB_SIGSTORE_CANARY":
        raise ValueError("Wrong evidence kind")
    if digest(src) != manifest["source_sha256"] or len(src) != manifest["source_size"]:
        raise ValueError("Evidence source mismatch")
    if any(manifest.get(key) is not False for key in
           ("external_timestamp_verified", "worm_retention_verified",
            "real_sports_source", "evaluation_eligible", "publication_allowed")):
        raise ValueError("Illegal synthetic promotion")
    if manifest.get("gate") != "HOLD":
        raise ValueError("Illegal gate promotion")
    return {"local_integrity_verified": True,
            "manifest_sha256": digest((out / "manifest.json").read_bytes()),
            "source_sha256": digest(src),
            "sigstore_verified": False,
            "worm_storage": False,
            "gate": "HOLD"}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True, type=Path)
    p.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    p.add_argument("--commit", default=os.environ.get("GITHUB_SHA", ""))
    args = p.parse_args()
    result = create(args.out, args.run_id, args.commit)
    verified = verify(args.out)
    print(json.dumps({"generated": result["kind"], **verified}, sort_keys=True))


if __name__ == "__main__":
    main()
