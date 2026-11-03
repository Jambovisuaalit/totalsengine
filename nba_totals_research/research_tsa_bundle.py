"""Live RFC3161 attestation for exact derived forecast JSONL bytes, research-only.

No source raw JSON is archived here. GitHub remains mutable, NOT WORM.
No external attestation is claimed if the TSA or certificate checks fail.
"""
from __future__ import annotations
import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen

from .rfc3161_timestamp import timestamp_digest
from .forward_pipeline import tsa_signed_time
from .scheduled_paper_collector import canonical, iso, digest

CA_PIN = "2151b61137ffa86bf664691ba67e7da0b19f98c758e3d228d5d8ebf27e044438"
SIGNER_PIN = "8bfb0305bb64e2571ca507552ef3245cb1c2fee8728e0ff8689225081ea13467"
TSA_URL = "https://freetsa.org/tsr"

def pinned(url: str, expected: str) -> bytes:
    with urlopen(Request(url, headers={"User-Agent":"TotalsEngineResearch/2.0"}), timeout=10) as r:
        if r.status != 200 or r.geturl() != url:
            raise ValueError("TSA trust material redirect or status refused")
        raw = r.read(32769)
    if len(raw) > 32768 or hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError("TSA certificate pin mismatch")
    return raw

def validate_snapshot(raw: bytes, manifest: dict, *, now: datetime) -> list[dict]:
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Timezone-aware host clock required")
    if digest(raw) != manifest.get("predictions_sha256"):
        raise ValueError("Prediction bytes do not match collector manifest")
    rows=[json.loads(line) for line in raw.splitlines() if line.strip()]
    if len(rows) != manifest.get("n_forecasts"):
        raise ValueError("Prediction count mismatch")
    from .research_ledger import validate_rows
    validate_rows(rows)
    if not rows:
        return []
    for row in rows:
        if iso(row["generated_at_host_utc"]) > now.astimezone(timezone.utc):
            raise ValueError("Forecast generation in future")
        if not iso(row["generated_at_host_utc"]) < iso(row["scheduled_tipoff"]):
            raise ValueError("Forecast generated too late")
        if now.astimezone(timezone.utc) >= iso(row["scheduled_tipoff"]):
            raise ValueError("TSA capture attempted after kickoff")
    return rows

def capture(directory: Path, *, clock=None, attest=timestamp_digest,
            pin=pinned) -> dict:
    if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
        raise ValueError("Fail-closed research mode required")
    now=(clock or (lambda: datetime.now(timezone.utc)))()
    raw=(directory/"predictions.jsonl").read_bytes()
    manifest=json.loads((directory/"manifest.json").read_bytes())
    rows=validate_snapshot(raw, manifest, now=now)
    if not rows:
        return {"status":"NO_FORECASTS_NO_TSA_REQUEST","n_forecasts":0}
    target=directory/"timestamp-receipt.json"
    if target.exists():
        raise ValueError("Timestamp receipt already exists; never replace evidence")
    with TemporaryDirectory(prefix="totalsengine-tsa-") as tmp:
        work=Path(tmp)
        ca=work/"ca.pem"; signer=work/"signer.pem"
        ca.write_bytes(pin("https://freetsa.org/files/cacert.pem",CA_PIN))
        signer.write_bytes(pin("https://freetsa.org/files/tsa.crt",SIGNER_PIN))
        tsdir=work/"token"
        result=attest(digest(raw),tsdir,tsa_url=TSA_URL,ca_file=ca,signer_file=signer)
        if result.get("rfc3161_verified") is not True or result.get("raw_sha256") != digest(raw):
            raise ValueError("Real RFC3161 validation failed")
        query=(tsdir/"request.tsq").read_bytes()
        reply=(tsdir/"response.tsr").read_bytes()
        audit=(tsdir/"timestamp-audit.json").read_bytes()
        signed=tsa_signed_time(audit)
        earliest=min(iso(row["scheduled_tipoff"]) for row in rows)
        if not now.astimezone(timezone.utc).replace(microsecond=0) <= signed < earliest:
            raise ValueError("Signed TSA time is before host capture or after kickoff")
        receipt={"schema":1,"kind":"PREGAME_RESEARCH_TSA_NOT_WORM",
            "predictions_sha256":digest(raw),"n_forecasts":len(rows),
            "received_at_host_utc":now.astimezone(timezone.utc).isoformat(),
            "signed_gen_time_utc":signed.isoformat(),
            "rfc3161_verified_at_capture":True,
            "request_tsq_base64":base64.b64encode(query).decode("ascii"),
            "response_tsr_base64":base64.b64encode(reply).decode("ascii"),
            "ca_sha256":CA_PIN,"signer_sha256":SIGNER_PIN,
            "request_sha256":digest(query),"response_sha256":digest(reply),
            "audit_sha256":digest(audit),"timestamp_response_text":json.loads(audit)["timestamp_response_text"],
            "source_availability_verified":False,
            "immutable_worm_verified":False,
            "evaluation_eligible":False,"publication_allowed":False,"gate_status":"NO_GO"}
        # Content-addressed provenance binding: exact JSONL -> TSA query -> signed time.
        with target.open("xb") as stream:
            stream.write(canonical(receipt))
            stream.flush()
            os.fsync(stream.fileno())
        return {"status":"PREGAME_RFC3161_TIMESTAMPED_RESEARCH_ONLY",
                "n_forecasts":len(rows),"predictions_sha256":digest(raw),
                "signed_gen_time_utc":signed.isoformat(),
                "receipt_sha256":digest(target.read_bytes()),
                "evaluation_eligible":False,"gate_status":"NO_GO"}

def main():
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("--directory", type=Path, required=True)
    a=p.parse_args()
    print(json.dumps(capture(a.directory), sort_keys=True))
if __name__=="__main__":
    main()
