"""Prospective BALLDONTLIE source-capture stage for GitHub OIDC attestation.

No prediction is generated in this stage. Hash the source bytes, attest the
manifest *before* any downstream model execution. No archived data is published
as a GitHub artifact without a source-specific retention approval.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from .balldontlie_games_adapter import fetch_games, select_event, SOURCE_ID, ENDPOINT_ID
from .real_source_evidence import assert_rights, canonical, sha256, utc


def capture(*, day: str, game_id: str, policy: dict, api_key: str,
            out: Path, clock=None, opener=None) -> dict:
    """Capture first-stage data. Does not attest, predict, or admit evaluation."""
    now = clock or (lambda: datetime.now(timezone.utc))
    captured = fetch_games(day=day, api_key=api_key, clock=now,
                           **({"opener": opener} if opener is not None else {}))
    assert_rights(policy, source_id=SOURCE_ID, endpoint_id=ENDPOINT_ID,
                  captured_at=captured.fetched_at_utc)
    if game_id == "auto":
        upcoming = []
        for candidate in captured.games:
            if not candidate.get("datetime"):
                continue
            try:
                tipoff = utc(candidate["datetime"])
            except (ValueError, TypeError):
                continue
            if tipoff <= utc(captured.received_at_utc):
                continue
            _, candidate_state = select_event(captured, str(candidate["id"]))
            if candidate_state == "PRE_GAME":
                upcoming.append((tipoff, str(candidate["id"])))
        if not upcoming:
            raise ValueError("No source-confirmed PRE_GAME events to capture")
        game_id = min(upcoming)[1]
    game, state = select_event(captured, game_id)
    if state != "PRE_GAME":
        raise ValueError("Actual source does not prove PRE_GAME; no prospective capture")
    if not game.get("datetime"):
        raise ValueError("Source lacks full ISO-8601 scheduled tipoff")
    if not utc(captured.received_at_utc) < utc(game["datetime"]):
        raise ValueError("Source capture after scheduled tipoff")
    if not isinstance(game.get("id"), int):
        raise ValueError("Source event ID must be numeric")
    if out.exists():
        raise FileExistsError("Immutable local capture directory already exists")
    out.mkdir(parents=True)
    source_path = out / "source-original.json"
    source_path.write_bytes(captured.raw)
    manifest = {
        "schema": 1,
        "kind": "NBA_BDL_PREGAME_RAW_CAPTURE_PRE_FORECAST",
        "source_id": SOURCE_ID,
        "endpoint_id": ENDPOINT_ID,
        "event_id_bdl": str(game["id"]),
        "event_mapping_nba_verified": False,
        "source_url": captured.url,
        "fetched_at_host_utc": captured.fetched_at_utc,
        "received_at_host_utc": captured.received_at_utc,
        "source_http_date_unverified": captured.http_date,
        "scheduled_start_utc": utc(game["datetime"]).isoformat(),
        "source_state": state,
        "raw_sha256": captured.source_sha256,
        "raw_size_bytes": len(captured.raw),
        "rights_review_reference": policy["review_reference"],
        "rights_policy_sha256": sha256(canonical(policy)),
        "source_first_published_at_utc": None,
        "sigstore_attested": False,
        "actual_start_verified": False,
        "source_availability_verified": False,
        "evaluation_eligible": False,
        "publication_allowed": False,
        "gate": "HOLD",
    }
    (out / "manifest.json").write_bytes(canonical(manifest))
    return manifest


def main():
    p = argparse.ArgumentParser(description="Approved-source only; pre-forecast capture")
    p.add_argument("--day", required=True)
    p.add_argument("--game-id", default="auto")
    p.add_argument("--rights-policy", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    key = os.environ.get("BALLDONTLIE_API_KEY")
    if not key:
        p.error("Missing BALLDONTLIE_API_KEY. No source access attempted.")
    policy = json.loads(args.rights_policy.read_bytes())
    # Fail before accessing API if the local policy has no valid approval.
    assert_rights(policy, source_id=SOURCE_ID, endpoint_id=ENDPOINT_ID,
                  captured_at=datetime.now(timezone.utc))
    result = capture(day=args.day, game_id=args.game_id, policy=policy,
                     api_key=key, out=args.out)
    print(json.dumps({"gate": result["gate"],
                      "manifest_sha256": sha256((args.out / "manifest.json").read_bytes()),
                      "raw_sha256": result["raw_sha256"]}, sort_keys=True))


if __name__ == "__main__":
    main()
