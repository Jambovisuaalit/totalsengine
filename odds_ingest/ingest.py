"""Offline CSV/JSON validation and normalized JSONL export; no bookmaker API dependency."""
import argparse
import csv
import hashlib
import io
import json
import math
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

REQUIRED = ("provider", "event_id", "sport", "market", "selection", "decimal_odds", "observed_at_utc")

def utc(value):
    if not isinstance(value, str):
        raise ValueError("timestamp must be a string")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("timezone required")
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

def decimal(value, name, minimum=None, strict=False):
    if value is None or value == "":
        return None
    try:
        d = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f"invalid {name}") from None
    if not d.is_finite() or (minimum is not None and (d <= minimum if strict else d < minimum)):
        raise ValueError(f"out-of-range {name}")
    return str(d)

def normalize(row):
    if not isinstance(row, dict):
        raise ValueError("row must be object")
    for key in REQUIRED:
        if row.get(key) is None or str(row[key]).strip() == "":
            raise ValueError(f"missing {key}")
    out = {k: str(row[k]).strip() for k in ("provider", "event_id", "sport", "market", "selection")}
    out["observed_at_utc"] = utc(row["observed_at_utc"])
    out["provider_updated_at_utc"] = utc(row["provider_updated_at_utc"]) if row.get("provider_updated_at_utc") else None
    out["decimal_odds"] = decimal(row["decimal_odds"], "decimal_odds", Decimal(1), True)
    out["line"] = decimal(row.get("line"), "line")
    out["max_stake"] = decimal(row.get("max_stake"), "max_stake", Decimal(0))
    try:
        out["period"] = int(row.get("period") or 0)
    except (ValueError, TypeError):
        raise ValueError("invalid period") from None
    out["status"] = str(row.get("status") or "available")
    out["source_url"] = row.get("source_url") or None
    out["raw_quote"] = row
    canonical = json.dumps(out, sort_keys=True, ensure_ascii=False, default=str, separators=(",", ":")).encode()
    out["quote_sha256"] = hashlib.sha256(canonical).hexdigest()
    return out

def parse(data, filename):
    text = data.decode("utf-8-sig")
    if filename.lower().endswith(".csv"):
        rows = list(csv.DictReader(io.StringIO(text)))
    elif filename.lower().endswith(".json"):
        parsed = json.loads(text)
        rows = parsed if isinstance(parsed, list) else parsed.get("quotes") if isinstance(parsed, dict) else None
        if not isinstance(rows, list):
            raise ValueError("JSON must be an array or object with quotes array")
    else:
        raise ValueError("only .csv and .json accepted")
    return [normalize(row) for row in rows]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    raw = args.input.read_bytes()
    quotes = parse(raw, args.input.name)
    batch = {"filename": args.input.name, "sha256": hashlib.sha256(raw).hexdigest(),
             "row_count": len(quotes), "quotes": quotes}
    args.output.write_text(json.dumps(batch, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"validated {len(quotes)} quotes; sha256={batch['sha256']}")

if __name__ == "__main__":
    main()
