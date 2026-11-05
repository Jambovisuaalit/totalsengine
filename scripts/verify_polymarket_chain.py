"""Fail-closed verification for a TotalsEngine/Polymarket single-game research join.

Usage: python scripts/verify_polymarket_chain.py chain.json
No network calls, no odds derivation from expected_total, no publish eligibility.
"""
import datetime as dt
import json
import math
import sys
from pathlib import Path

UTC = dt.timezone.utc

def timestamp(value):
    if not isinstance(value, str):
        raise ValueError("missing timestamp")
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("naive timestamp")
    return parsed.astimezone(UTC)

def check(record):
    issues = []
    forecast = record.get("forecast") or {}
    market = record.get("market") or {}
    result = record.get("result") or {}
    required = {
        "forecast": ["source_game_id", "home", "away", "scheduled_tipoff", "generated_at_host_utc", "expected_total", "record_sha256"],
        "market": ["venue", "event_id", "market_id", "line", "side", "captured_at_utc", "source_url", "raw_payload_sha256", "bid", "ask", "resolution_rules"],
        "result": ["source_game_id", "status", "home_score", "away_score", "source_url", "captured_at_utc"],
    }
    for section, keys in required.items():
        value = {"forecast": forecast, "market": market, "result": result}[section]
        issues += [f"{section}.{key}: missing" for key in keys if value.get(key) is None]
    if issues:
        return {"status": "BLOCKED", "issues": issues, "evaluation_eligible": False}
    try:
        ftime = timestamp(forecast["generated_at_host_utc"])
        tip = timestamp(forecast["scheduled_tipoff"])
        mtime = timestamp(market["captured_at_utc"])
        rtime = timestamp(result["captured_at_utc"])
        if not (ftime < tip and mtime < tip):
            issues.append("forecast and market must be captured strictly before tipoff")
        if rtime <= tip:
            issues.append("result captured before tipoff")
        if str(forecast["source_game_id"]) != str(result["source_game_id"]):
            issues.append("result game identity mismatch")
        if market.get("capture_mode") != "LIVE_CAPTURE":
            issues.append("historical backfill is not proof of contemporaneous live market capture")
        if market["venue"] not in {"polymarket.com", "polymarket.us"}:
            issues.append("unsupported venue")
        if market["side"] not in {"OVER", "UNDER"}:
            issues.append("unsupported market side")
        if market.get("game_id") != str(forecast["source_game_id"]):
            issues.append("market game identity not explicitly mapped")
        if market.get("period") != "FULL_GAME_INCLUDING_OT":
            issues.append("market period/rules mismatch")
        if not market.get("identity_verified"):
            issues.append("independent game and market identity verification missing")
        if not market.get("source_rights_approved"):
            issues.append("market source retention/use rights not approved")
        if not market.get("snapshot_proof_verified"):
            issues.append("market historical snapshot provenance not verified")
        if not market.get("resolution_rules_verified"):
            issues.append("resolution rules not verified")
        if result["status"] != "FINAL":
            issues.append("result is not FINAL")
        if not result.get("independently_verified"):
            issues.append("result provenance not independently verified")
        for key in ("expected_total",):
            if not math.isfinite(float(forecast[key])):
                issues.append("non-finite forecast")
        line = float(market["line"])
        bid, ask = float(market["bid"]), float(market["ask"])
        if not (0 < bid <= ask < 1):
            issues.append("invalid or crossed bid/ask")
        if not math.isfinite(line):
            issues.append("non-finite total line")
        scores = [int(result["home_score"]), int(result["away_score"])]
        if min(scores) < 0:
            issues.append("invalid scores")
        if not record.get("forecast_source_rights_approved"):
            issues.append("forecast upstream source rights not approved")
        if not record.get("forecast_timestamp_proof_verified"):
            issues.append("forecast timestamp evidence not independently verified")
        if not record.get("immutable_archive_verified"):
            issues.append("immutable archive not independently verified")
        if not record.get("independent_admission_pass"):
            issues.append("independent admission verifier has not passed")
    except (TypeError, ValueError, OverflowError, KeyError) as exc:
        issues.append(f"invalid data: {exc}")
    return {"status": "PASS" if not issues else "BLOCKED", "issues": issues,
            "evaluation_eligible": not issues}

def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: python scripts/verify_polymarket_chain.py chain.json")
    report = check(json.loads(Path(sys.argv[1]).read_text()))
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "PASS" else 1

if __name__ == "__main__":
    sys.exit(main())
