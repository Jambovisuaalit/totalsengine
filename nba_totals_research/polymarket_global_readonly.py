"""Polymarket.com public read-only integration smoke, no authentication or trading."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

VENUE = "polymarket.com"
WALLET = "0x43Bb0590A4F8F7944c5aCC3Ebcf8cC93b812a2F4"
ALLOWED = {
    "gamma_events": ("https://gamma-api.polymarket.com/events", {"limit": "1", "active": "true", "closed": "false"}),
    "gamma_profile": ("https://gamma-api.polymarket.com/public-profile", {"address": WALLET}),
    "clob_server_time": ("https://clob.polymarket.com/time", {}),
}
MAX_BYTES = 512_000


def validate_wallet(address: str) -> str:
    if not re.fullmatch(r"0x[a-fA-F0-9]{40}", address):
        raise ValueError("Invalid public wallet address")
    return address


def fetch_public(endpoint: str, *, opener=urlopen) -> dict:
    if endpoint not in ALLOWED:
        raise ValueError("Unapproved endpoint; read-only allowlist required")
    url, query = ALLOWED[endpoint]
    if query:
        url += "?" + urlencode(query)
    req = Request(url, headers={"Accept": "application/json",
                                "User-Agent": "TotalsEnginePublicReadResearch/1.0"}, method="GET")
    try:
        with opener(req, timeout=15) as response:
            if response.status != 200 or response.geturl() != url:
                raise ValueError("Unexpected HTTP status or redirect")
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise ValueError("Response too large")
        parsed = json.loads(raw)
        if endpoint == "gamma_events" and not isinstance(parsed, list):
            raise ValueError("Expected event list")
        if endpoint == "gamma_profile":
            if not isinstance(parsed, dict) or str(parsed.get("proxyWallet", "")).lower() != WALLET.lower():
                raise ValueError("Public profile wallet does not match")
        if endpoint == "clob_server_time" and not isinstance(parsed, int):
            raise ValueError("Expected integer CLOB server time")
        return {"endpoint": endpoint, "status": "PASS", "http": 200,
                "payload_sha256": hashlib.sha256(raw).hexdigest()}
    except (HTTPError, URLError) as exc:
        return {"endpoint": endpoint, "status": "HTTP_ERROR",
                "http": getattr(exc, "code", None), "reason": type(exc).__name__}


def run(*, opener=urlopen) -> dict:
    validate_wallet(WALLET)
    results = [fetch_public(name, opener=opener) for name in ALLOWED]
    return {"schema": 1, "venue": VENUE, "public_wallet": WALLET,
            "observed_at_host_utc": datetime.now(timezone.utc).isoformat(),
            "read_only": True, "authenticated": False, "private_key_used": False,
            "trading_enabled": False, "fund_transfers_enabled": False,
            "raw_payload_retained": False, "rights_verified": False,
            "immutable_worm_verified": False, "publication_allowed": False,
            "evaluation_eligible": False, "gate_status": "NO_GO",
            "results": results}


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--smoke", action="store_true", required=True)
    p.parse_args()
    print(json.dumps(run(), sort_keys=True))


if __name__ == "__main__":
    main()
