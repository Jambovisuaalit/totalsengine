"""Independent re-verification of RFC3161 signed research forecast receipts.

Takes downloaded create-only research ledger envelope, verifies exact persisted
forecast JSONL bytes and signed token with pinned FreeTSA trust certificates.
This proves external timestamp, NOT immutable WORM, source rights or eligibility.
"""
from __future__ import annotations
import base64
import json
import hashlib
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

from .research_tsa_bundle import CA_PIN, SIGNER_PIN, pinned
from .scheduled_paper_collector import digest, iso
from .research_ledger import validate_rows

def verify_envelope(envelope: dict, *, certificate_fetch=pinned, subprocess_run=subprocess.run) -> dict:
    if (envelope.get("kind") != "FORECAST_RUN_RESEARCH_ONLY"
            or envelope.get("evaluation_eligible") is not False
            or envelope.get("publication_allowed") is not False
            or envelope.get("gate_status") != "NO_GO"):
        raise ValueError("Envelope is not an ineligible research record")
    receipt=envelope.get("rfc3161_receipt")
    if not isinstance(receipt,dict) or receipt.get("kind") != "PREGAME_RESEARCH_TSA_NOT_WORM":
        raise ValueError("Signed RFC3161 receipt missing")
    raw=base64.b64decode(envelope["original_predictions_jsonl_base64"],validate=True)
    if digest(raw)!=envelope.get("predictions_sha256") or digest(raw)!=receipt.get("predictions_sha256"):
        raise ValueError("Original forecast bytes are corrupted")
    rows=[json.loads(line) for line in raw.splitlines() if line.strip()]
    validate_rows(rows)
    if rows!=envelope["rows"] or len(rows)!=envelope["n_forecasts"] or len(rows)!=receipt["n_forecasts"]:
        raise ValueError("Forecast rows do not match original bytes")
    query=base64.b64decode(receipt["request_tsq_base64"],validate=True)
    reply=base64.b64decode(receipt["response_tsr_base64"],validate=True)
    if digest(query)!=receipt["request_sha256"] or digest(reply)!=receipt["response_sha256"]:
        raise ValueError("RFC3161 token checksum mismatch")
    if receipt.get("ca_sha256")!=CA_PIN or receipt.get("signer_sha256")!=SIGNER_PIN:
        raise ValueError("Unapproved pinned TSA certificate claims")
    with TemporaryDirectory() as tmp:
        p=Path(tmp)
        q=p/"q.tsq"; q.write_bytes(query)
        t=p/"r.tsr"; t.write_bytes(reply)
        ca=p/"ca.pem"; ca.write_bytes(certificate_fetch("https://freetsa.org/files/cacert.pem",CA_PIN))
        signer=p/"signer.pem"; signer.write_bytes(certificate_fetch("https://freetsa.org/files/tsa.crt",SIGNER_PIN))
        if digest(ca.read_bytes())!=CA_PIN or digest(signer.read_bytes())!=SIGNER_PIN:
            raise ValueError("TSA trust certificates differ from pins")
        process=subprocess_run(["openssl","ts","-verify","-queryfile",str(q),
            "-in",str(t),"-CAfile",str(ca),"-untrusted",str(signer)],
            capture_output=True,timeout=15,check=False)
        if process.returncode:
            raise ValueError("OpenSSL RFC3161 signature+message-imprint verification failed")
        details=subprocess_run(["openssl","ts","-reply","-in",str(t),"-text"],
            capture_output=True,text=True,timeout=15,check=False)
        if details.returncode:
            raise ValueError("Unable to parse signed TSA time")
        from .forward_pipeline import tsa_signed_time
        signed=tsa_signed_time(json.dumps({"timestamp_response_text":details.stdout}).encode())
    if signed != iso(receipt["signed_gen_time_utc"]):
        raise ValueError("Signed time does not equal receipt time")
    if signed>=min(iso(row["scheduled_tipoff"]) for row in rows):
        raise ValueError("TSA signature is not pregame")
    return {"status":"SIGNED_PREGAME_RESEARCH_RECORD_ONLY","n_forecasts":len(rows),
        "original_predictions_sha256":digest(raw),
        "signed_gen_time_utc":signed.isoformat(),
        "rfc3161_signature_verified":True,"worm_verified":False,
        "source_rights_verified":False,
        "evaluation_eligible":False,"publication_allowed":False,"gate_status":"NO_GO"}

def main():
    import argparse
    a=argparse.ArgumentParser()
    a.add_argument("--envelope",type=Path,required=True)
    cfg=a.parse_args()
    print(json.dumps(verify_envelope(json.loads(cfg.envelope.read_bytes())),sort_keys=True))

if __name__=="__main__":
    main()
