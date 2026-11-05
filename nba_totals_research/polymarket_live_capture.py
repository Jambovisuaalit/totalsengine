"""One-shot Polymarket US pregame capture; research only, fail closed.

Only digest of transient provider response is retained without rights clearance.
RFC3161 timestamp attests the capture receipt (not vendor source clock or license).
No orders, forecasting, publication or automatic market selection.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE = "https://gateway.polymarket.us"
MAX_BYTES = 12_000_000


def utc(value: str) -> datetime:
    stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if stamp.tzinfo is None or stamp.utcoffset() is None:
        raise ValueError("timezone-aware timestamp required")
    return stamp.astimezone(timezone.utc)


def canonical(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def preflight(*, tipoff: datetime, now: datetime, min_lead_seconds: int = 90) -> None:
    if now.tzinfo is None or tipoff.tzinfo is None:
        raise ValueError("aware clocks required")
    if (tipoff - now).total_seconds() < min_lead_seconds:
        raise ValueError("too late for pregame capture / TSA verification")


def fetch_json(path: str) -> tuple[bytes, dict]:
    url = BASE + path
    req = Request(url, headers={"Accept": "application/json", "User-Agent": "TotalsEngineResearch/1.0"})
    with urlopen(req, timeout=12) as response:
        if response.geturl() != url or response.status != 200:
            raise ValueError("unexpected redirect or response status")
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError("provider response exceeds cap")
    return raw, json.loads(raw)


def capture(event_slug: str, market_slug: str, out: Path, *, clock=None) -> dict:
    if os.getenv("HALTED") != "1" or os.getenv("PUBLICATION_ALLOWED") != "false":
        raise ValueError("fail-closed research configuration required")
    if not (event_slug.startswith("nba-") and market_slug.startswith("tsc-nba-")):
        raise ValueError("NBA event and full game totals market slug required")
    event_path = "/v1/events/slug/" + quote(event_slug, safe="-")
    book_path = "/v1/markets/" + quote(market_slug, safe="-") + "/bbo"
    t0 = (clock or (lambda: datetime.now(timezone.utc)))()
    event_raw, payload = fetch_json(event_path)
    event = payload.get("event", payload)
    tipoff = utc(event["startTime"])
    preflight(tipoff=tipoff, now=t0)
    if event.get("slug") != event_slug or event.get("ended") or event.get("finishedTimestamp"):
        raise ValueError("event identity invalid or event already ended")
    markets = [m for m in event.get("markets", []) if m.get("slug") == market_slug]
    if len(markets) != 1:
        raise ValueError("market identity not uniquely found")
    market = markets[0]
    rules = market.get("description") or ""
    if (market.get("marketType") != "totals"
        or market.get("sportsMarketType") != "basketball_team_full_game_total"
        or "Overtime is included if played" not in rules
        or market.get("gameStartTime") != event.get("startTime")):
        raise ValueError("unverified full-game totals settlement rules")
    if market.get("line") is None or not market.get("id"):
        raise ValueError("missing market ID or line")
    quote_raw, book = fetch_json(book_path)
    t1 = (clock or (lambda: datetime.now(timezone.utc)))()
    preflight(tipoff=tipoff, now=t1)
    if t1 < t0:
        raise ValueError("host clock moved backwards")
    if not isinstance(book, dict) or not book:
        raise ValueError("empty BBO")
    receipt = {
        "schema": 1, "class": "LIVE_CAPTURE_PENDING_INDEPENDENT_ATTESTATION",
        "venue": "polymarket.us", "event_slug": event_slug, "event_id": str(event.get("id")),
        "market_slug": market_slug, "market_id": str(market["id"]),\n        "bbo_best_bid": str(market_data["bestBid"]["value"]),\n        "bbo_best_ask": str(market_data["bestAsk"]["value"]),
        "market_line": str(market["line"]), "market_type": "basketball_team_full_game_total",
        "event_api_path": event_path, "bbo_api_path": book_path,
        "event_raw_sha256": digest(event_raw), "bbo_raw_sha256": digest(quote_raw),
        "capture_start_host_utc": t0.astimezone(timezone.utc).isoformat(),
        "capture_end_host_utc": t1.astimezone(timezone.utc).isoformat(),
        "tipoff_utc": tipoff.isoformat(), "response_schema_keys": sorted(book.keys()),
        "source_rights_approved": False, "raw_retained": False,
        "rfc3161_verified": False, "immutable_worm_verified": False,
        "evaluation_eligible": False, "publication_allowed": False,
        "gate_status": "NO_GO",
    }
    out.mkdir(parents=True, exist_ok=True)
    target = out / "capture-receipt.json"
    with target.open("xb") as f:
        f.write(canonical(receipt))
        f.flush()
        os.fsync(f.fileno())
    # Timestamp the receipt digest after capture, only if approved trust roots work.
    from nba_totals_research.research_tsa_bundle import (
        CA_PIN, SIGNER_PIN, TSA_URL, pinned,
    )
    from nba_totals_research.rfc3161_timestamp import timestamp_digest
    from nba_totals_research.forward_pipeline import tsa_signed_time
    from tempfile import TemporaryDirectory
    with TemporaryDirectory(prefix="polymarket-tsa-") as td:
        temp = Path(td)
        ca = temp / "ca.pem"
        signer = temp / "signer.pem"
        ca.write_bytes(pinned("https://freetsa.org/files/cacert.pem", CA_PIN))
        signer.write_bytes(pinned("https://freetsa.org/files/tsa.crt", SIGNER_PIN))
        attested = timestamp_digest(digest(target.read_bytes()), temp / "tsa",
                                    tsa_url=TSA_URL, ca_file=ca, signer_file=signer)
        signed = tsa_signed_time((temp / "tsa" / "timestamp-audit.json").read_bytes())
        if (attested.get("rfc3161_verified") is not True
            or not t1.astimezone(timezone.utc).replace(microsecond=0) <= signed < tipoff):
            raise ValueError("RFC3161 signed time outside pregame window")
        import base64
        proof = {
            "schema": 1, "type": "LIVE_CAPTURE_RECEIPT_TIMESTAMP_NOT_WORM",
            "receipt_sha256": digest(target.read_bytes()),
            "signed_gen_time_utc": signed.isoformat(),
            "tsa_request_base64": base64.b64encode((temp/"tsa"/"request.tsq").read_bytes()).decode(),
            "tsa_response_base64": base64.b64encode((temp/"tsa"/"response.tsr").read_bytes()).decode(),
            "ca_sha256": CA_PIN, "signer_sha256": SIGNER_PIN,
            "rfc3161_signature_verified_at_capture": True,
            "source_rights_approved": False, "immutable_worm_verified": False,
            "evaluation_eligible": False, "publication_allowed": False, "gate_status": "NO_GO",
        }
        with (out / "tsa-proof.json").open("xb") as f:
            f.write(canonical(proof))
            f.flush()
            os.fsync(f.fileno())
    return {"status": "CAPTURE_RECEIPT_TIMESTAMPED_RESEARCH_ONLY",
            "receipt_sha256": proof["receipt_sha256"], "market_id": receipt["market_id"],
            "gate_status": "NO_GO"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event-slug", required=True)
    parser.add_argument("--market-slug", required=True)\n    parser.add_argument("--bbo-symbol", required=True, help="Verified instrument symbol from provider reference-data endpoint")
    parser.add_argument("--out", type=Path, required=True)
    a = parser.parse_args()
    print(json.dumps(capture(a.event_slug, a.market_slug, a.out), sort_keys=True))


if __name__ == "__main__":
    main()
