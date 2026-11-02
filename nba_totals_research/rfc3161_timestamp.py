"""RFC3161 independent timestamp verification for an already captured SHA-256 digest.

Research only. Requires a separately approved TSA URL and pinned CA bundle.
No proof is trusted until openssl ts -verify succeeds against that CA bundle.
"""
from __future__ import annotations
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
    verify = ["openssl", "ts", "-verify", "-queryfile", str(request_file),
              "-in", str(response_file), "-CAfile", str(ca_file)]
    if signer_file is not None:
        if not signer_file.is_file():
            raise ValueError("Pinned TSA signer certificate required")
        verify.extend(["-untrusted", str(signer_file)])
    subprocess.run(verify, check=True, timeout=10, capture_output=True)
    return {"rfc3161_verified": True, "raw_sha256": digest,
            "tsa_response_bytes": len(reply), "publication_allowed": False}

if __name__ == "__main__":
    raise SystemExit("Library only: provide approved TSA URL, CA bundle, and digest explicitly")
