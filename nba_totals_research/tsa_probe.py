"""One-shot TSA verification for a previously captured digest (no ESPN call)."""
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from nba_totals_research.rfc3161_timestamp import timestamp_digest

digest = os.environ["OBSERVATION_SHA256"]
tsa_url = os.environ["TSA_URL"]
ca_pem = os.environ["TSA_CA_PEM"]
if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
    raise SystemExit("HALTED research-only mode required")
with TemporaryDirectory(prefix="tsa-verify-") as directory:
    root = Path(directory)
    ca = root / "trusted-tsa-ca.pem"
    ca.write_text(ca_pem)
    ca.chmod(0o600)
    result = timestamp_digest(digest, root, tsa_url=tsa_url, ca_file=ca)
    print(json.dumps(result, sort_keys=True))
