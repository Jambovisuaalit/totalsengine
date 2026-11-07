"""Frozen 14-game 2026-11-03 real pregame paper cohort -> later FINAL outcomes.

Exact original bytes and RFC3161 receipt are frozen in docs/evidence. This is
PROVISIONAL_FORWARD_PAPER_ONLY, NEVER bookmaker-grade or independently admitted.
The source rights and WORM archive remain unverified. No raw provider payload
is retained, only response hashes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .scheduled_paper_collector import canonical, digest, extract, download_day, iso
from .forward_settlement import score_forecasts

ROOT = Path(__file__).resolve().parents[1] / "docs/evidence/nba-forward-original-2026-11-03"
FROZEN_SHA256 = "fca6fc731ca185ffd62c01fa90c7205be8a7a1d3b1bcafc7ffd53952f1745ccf"
FROZEN_COUNT = 14
FIRST_TIPOFF = "2026-11-05T00:00:00+00:00"


def load_frozen(root: Path = ROOT, *, verify_tsa: bool = False) -> tuple[list[dict], dict]:
    """Check exact forecast bytes, hashes and all rows; optional live TSA recheck."""
    raw = (root / "predictions.jsonl").read_bytes()
    manifest = json.loads((root / "manifest.json").read_bytes())
    receipt = json.loads((root / "timestamp-receipt.json").read_bytes())
    if not (digest(raw) == FROZEN_SHA256 == manifest.get("predictions_sha256")
            == receipt.get("predictions_sha256")):
        raise ValueError("Frozen cohort SHA-256 mismatch")
    if manifest.get("n_forecasts") != FROZEN_COUNT or receipt.get("n_forecasts") != FROZEN_COUNT:
        raise ValueError("Frozen cohort denominator mismatch")
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
    if len(rows) != FROZEN_COUNT or len({(p["source_game_id"], p["model_version"]) for p in rows}) != FROZEN_COUNT:
        raise ValueError("Duplicate or incomplete original cohort")
    from .research_ledger import validate_rows
    validate_rows(rows)
    timestamp = iso(receipt["signed_gen_time_utc"])
    generated = iso(manifest["generated_at_host_utc"])
    if not generated < timestamp < min(iso(p["scheduled_tipoff"]) for p in rows):
        raise ValueError("Pregame timestamp sequence invalid")
    if min(p["scheduled_tipoff"] for p in rows) != FIRST_TIPOFF:
        raise ValueError("Frozen fixture schedule changed")
    if any(iso(p["generated_at_host_utc"]) != generated or
           p.get("source") != "ESPN_SCOREBOARD_UNVERIFIED" for p in rows):
        raise ValueError("Original forecast source/generation mismatch")
    if receipt.get("immutable_worm_verified") is not False:
        raise ValueError("Unsupported immutable source claim")
    if verify_tsa:
        import base64
        from .research_tsa_verify import verify_envelope
        envelope = {"kind":"FORECAST_RUN_RESEARCH_ONLY", "rows":rows,
                    "n_forecasts":len(rows),"predictions_sha256":digest(raw),
                    "original_predictions_jsonl_base64":base64.b64encode(raw).decode("ascii"),
                    "rfc3161_receipt":receipt,"evaluation_eligible":False,
                    "publication_allowed":False,"gate_status":"NO_GO"}
        check = verify_envelope(envelope)
        if check.get("rfc3161_signature_verified") is not True:
            raise ValueError("Independent TSA signature re-verification rejected")
    return rows, {"predictions_sha256":FROZEN_SHA256,
                  "signed_gen_time_utc":timestamp.isoformat(),
                  "rfc3161_verified_in_this_execution":verify_tsa,
                  "n_original":len(rows)}


def run(*, root: Path = ROOT, now: datetime | None = None,
        fetch=download_day, verify_tsa: bool = False) -> dict:
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Aware observation time required")
    now = now.astimezone(timezone.utc)
    rows, proof = load_frozen(root, verify_tsa=verify_tsa)
    prepared = [dict(p, _github_run_id=0) for p in rows]
    # Do not contact the result feed before a conservative 6-hour post-tipoff delay.
    eligible = [p for p in rows if now >= iso(p["scheduled_tipoff"]) + timedelta(hours=6)]
    if eligible:
        days = sorted({(iso(p["scheduled_tipoff"]) + timedelta(days=offset)).date()
                       for p in eligible for offset in (-1,0,1)})
        source_raw = {str(day): fetch(day) for day in days}
        finals = extract(source_raw)
    else:
        source_raw, finals = {}, []
    # Existing deterministic scorer requires exact ID/home/away/scheduled UTC.
    report = score_forecasts(prepared, finals, at=now)
    if report["n_input_forecasts"] != FROZEN_COUNT or report["n_unique_forecasts"] != FROZEN_COUNT:
        raise ValueError("Frozen cohort coverage altered")
    # No scoring without the six-hour threshold; delayed FINAL alone is insufficient.
    if any(now < iso(row["tipoff"]) + timedelta(hours=6) for row in report["scored_rows"]):
        raise ValueError("Premature score")
    report.update({
        "cohort":"REAL_ESPN_PREGAME_2026_11_03_FROZEN_14",
        "original_evidence":proof,
        "generated_at_utc":now.isoformat(),
        "outcome_provider":"ESPN_SCOREBOARD_UNVERIFIED",
        "outcome_response_sha256_by_day":{day:digest(raw) for day,raw in source_raw.items()},
        "outcome_source_rights_verified":False,
        "independent_game_id_cross_provider_verified":False,
        "worm_verified":False,
        "external_timestamp_verified":proof["rfc3161_verified_in_this_execution"],
        "n_unverified":FROZEN_COUNT,
        "report_type":"PROVISIONAL_FORWARD_PAPER_ONLY",
        "evaluation_eligible":False,"publication_allowed":False,
        "gate_status":"NO_GO","independently_verified_count":0,
    })
    return report


def main() -> None:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--verify-tsa",action="store_true",
                   help="Revalidate RFC3161 cryptography against pinned certs")
    a=p.parse_args()
    if os.getenv("HALTED")!="1" or os.getenv("PUBLICATION_ALLOWED")!="false":
        raise SystemExit("Research-only fail-closed environment required")
    report=run(verify_tsa=a.verify_tsa)
    a.output.mkdir(parents=True,exist_ok=True)
    dest=a.output/"report.json"
    with dest.open("xb") as s:
        s.write(canonical(report))
    print(json.dumps({k:v for k,v in report.items() if k not in ("scored_rows","pending_ids","mismatched_ids")},sort_keys=True))

if __name__=="__main__":
    main()
