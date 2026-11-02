"""RFC3161 independent timestamp verification for an already captured SHA-256 digest.

Research only. Requires a separately approved TSA URL and pinned CA bundle.
No proof is trusted until openssl ts -verify succeeds against that CA bundle.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def timestamp_digest(digest: str, workdir: Path, *, tsa_url: str, ca_file: Path, signer_file: Path | None = None) -> dict:
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("Invalid SHA256 digest")
    u = urlparse(tsa_url)
    if u.scheme != "https" or not u.hostname or u.username or u.password or u.fragment:
        raise ValueError("Approved HTTPS TSA URL required")
    if not ca_file.is_file():
        raise ValueError("Pinned TSA CA bundle required")
    workdir.mkdir(parents=True, exist_ok=True)
    request_file, response_file = workdir / "request.tsq", workdir / "response.tsr"
    subprocess.run(["openssl", "ts", "-query", "-digest", digest, "-sha256",
                    "-cert", "-out", str(request_file)], check=True, timeout=10,
                   capture_output=True)
    request = Request(tsa_url, data=request_file.read_bytes(),
                      headers={"Content-Type": "application/timestamp-query",
                               "Accept": "application/timestamp-reply"}, method="POST")
    with build_opener(NoRedirect()).open(request, timeout=10) as response:
        if response.status != 200 or response.geturl() != tsa_url:
            raise ValueError("TSA response rejected")
        reply = response.read(131073)
    if len(reply) > 131072 or not reply:
        raise ValueError("Invalid TSA reply size")
    response_file.write_bytes(reply)
    # OpenSSL parses the ASN.1 token; malformed responses must fail closed.
    verify = ["openssl", "ts", "-verify", "-queryfile", str(request_file),
              "-in", str(response_file), "-CAfile", str(ca_file)]
    if signer_file is not None:
        if not signer_file.is_file():
            raise ValueError("Pinned TSA signer certificate required")
        verify.extend(["-untrusted", str(signer_file)])
    subprocess.run(verify, check=True, timeout=10, capture_output=True)
    details = subprocess.run(["openssl", "ts", "-reply", "-in", str(response_file), "-text"],
                             check=True, timeout=10, capture_output=True, text=True).stdout
    # OpenSSL -queryfile binds the signed message imprint to the exact input digest.
    audit = {"schema_version": 1, "status": "EXTERNALLY_TIMESTAMP_VERIFIED_ONLY",
             "raw_sha256": digest, "request_sha256": hashlib.sha256(request_file.read_bytes()).hexdigest(),
             "response_sha256": hashlib.sha256(reply).hexdigest(),
             "ca_sha256": hashlib.sha256(ca_file.read_bytes()).hexdigest(),
             "signer_sha256": hashlib.sha256(signer_file.read_bytes()).hexdigest() if signer_file else None,
             "openssl_signature_and_chain_verified": True, "message_imprint_verified": True,
             "timestamp_response_text": details, "publication_allowed": False,
             "gate_status": "NO_GO"}
    audit_file = workdir / "timestamp-audit.json"
    with audit_file.open("x", encoding="utf-8") as stream:
        json.dump(audit, stream, indent=2, sort_keys=True)
    os.chmod(audit_file, 0o600)
    return {"rfc3161_verified": True, "raw_sha256": digest,
            "tsa_response_bytes": len(reply), "response_sha256": audit["response_sha256"],
            "publication_allowed": False, "gate_status": "NO_GO"}

if __name__ == "__main__":
    raise SystemExit("Library only: provide approved TSA URL, CA bundle, and digest explicitly")
