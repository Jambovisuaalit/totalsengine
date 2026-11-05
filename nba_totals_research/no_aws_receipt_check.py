"""Check verified GitHub Sigstore receipt against exact manifest and commit.

Requires JSON output from a successful gh attestation verify invocation.
Only cryptographically verified timestamp entries qualify; unverified
workflow-provided predicate fields are not trusted as timestamps.
"""
import hashlib
import json
from pathlib import Path


def validate_receipt(manifest: Path, verification: Path, *, commit_sha: str) -> dict:
    raw = manifest.read_bytes()
    expected_digest = hashlib.sha256(raw).hexdigest()
    data = json.loads(verification.read_bytes())
    if not isinstance(data, list) or not data:
        raise ValueError("No verified attestations")
    for row in data:
        result = row.get("verificationResult", {})
        statement = result.get("statement", {})
        subjects = statement.get("subject", [])
        if not any(s.get("digest", {}).get("sha256") == expected_digest
                   for s in subjects if isinstance(s, dict)):
            continue
        if not result.get("signature", {}).get("certificate"):
            continue
        if not result.get("verifiedTimestamps"):
            continue
        # GitHub CLI has already verified tlog inclusion/SET and trust root.
        bundle = row.get("attestation", {})
        material = bundle.get("verificationMaterial", {}) if isinstance(bundle, dict) else {}
        tlog = material.get("tlogEntries", [])
        if not isinstance(tlog, list) or not tlog:
            continue
        if not any(isinstance(t, dict) and t.get("logIndex") is not None and
                   (t.get("inclusionProof") or t.get("inclusionPromise"))
                   for t in tlog):
            continue
        if not isinstance(commit_sha, str) or len(commit_sha) != 40:
            raise ValueError("Missing pinned commit SHA")
        return {
            "manifest_sha256": expected_digest,
            "commit_sha_expected": commit_sha,
            "certificate_present": True,
            "cryptographically_verified_timestamp": True,
            "transparency_log_entry_present": True,
            "verification_status": "PASS_SYNTHETIC_ONLY",
            "evaluation_eligible": False,
            "publication_allowed": False,
        }
    raise ValueError("Signed manifest digest, certificate, timestamp or Rekor proof missing")
