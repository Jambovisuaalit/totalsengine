"""FreeTSA one-shot RFC3161 research validation with pinned certificates."""
import hashlib
import json
import os
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from nba_totals_research.rfc3161_timestamp import timestamp_digest

CA_SHA256 = "2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438"
SIGNER_SHA256 = "8bfb0305bb64e2571ca507552ef3245cb1c2fee8728e0ff8689225081ea13467"
def pinned(url, digest):
    with urlopen(Request(url, headers={"User-Agent": "TotalsEngineResearch/2.0"}), timeout=10) as response:
        if response.status != 200 or response.geturl() != url:
            raise RuntimeError("Certificate source rejected")
        data = response.read(32769)
    if len(data) > 32768 or hashlib.sha256(data).hexdigest() != digest:
        raise RuntimeError("FreeTSA certificate pin mismatch: abort")
    return data

if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
    raise SystemExit("HALTED research-only mode required")
digest = os.environ["OBSERVATION_SHA256"]
with TemporaryDirectory(prefix="tsa-verify-") as directory:
    root = Path(directory)
    ca = root / "cacert.pem"
    signer = root / "tsa.crt"
    ca.write_bytes(pinned("https://freetsa.org/files/cacert.pem", CA_SHA256))
    signer.write_bytes(pinned("https://freetsa.org/files/tsa.crt", SIGNER_SHA256))
    result = timestamp_digest(digest, root, tsa_url="https://freetsa.org/tsr", ca_file=ca, signer_file=signer)
    output = os.environ.get("TSA_AUDIT_OUTPUT")
    if output:
        dest = Path(output)
        dest.mkdir(parents=True, exist_ok=True, mode=0o700)
        for name in ("request.tsq", "response.tsr", "timestamp-audit.json"):
            shutil.copyfile(root / name, dest / name)
            (dest / name).chmod(0o600)
        for name, source in (("cacert.pem", ca), ("tsa.crt", signer)):
            shutil.copyfile(source, dest / name)
            (dest / name).chmod(0o600)
    print(json.dumps({**result, "tsa": "FreeTSA", "ca_sha256": CA_SHA256,
                      "signer_sha256": SIGNER_SHA256}, sort_keys=True))
