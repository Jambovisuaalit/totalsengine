"""Replay original historical Actions ZIPs in GitHub CI, in memory only.

Only with the PR's read-only GITHUB_TOKEN. No raw ESPN source bytes or
unlicensed provider payloads are archived to a new location.
A successful replay fixes transport compatibility, NOT legal/source/WORM gates.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone

from .forward_settlement import github_json, github_archive, inspect_artifact

REPO = "Jambovisuaalit/totalsengine"
FIXTURES = (
    (41919795738, 13365429605,
     "b82c67f67a687cc5c032d2d34fd83ec6176be3d7c12d045f58cb618414834c6c",
     16),
    (41724518145, 13273368881,
     "e605bd7f8a82af589225e9138e03db706499a3067fb3915093a655551ad178c4",
     14),
    (41545696150, 13189290580,
     "0f8a541225f4ab1dcede08d50fc38ab8008b75961c529aeb34874498ef49d223",
     6),
)

def main() -> None:
    token = os.getenv("GITHUB_TOKEN", "")
    if (os.getenv("HALTED") != "1" or
            os.getenv("PUBLICATION_ALLOWED") != "false" or not token):
        raise SystemExit("Required research-only flags and read-only token missing")
    if os.getenv("GITHUB_REPOSITORY") != REPO:
        raise SystemExit("Cannot replay from another repository")
    results = []
    for run_id, artifact_id, expected_zip_sha, expected_count in FIXTURES:
        base = f"https://api.github.com/repos/{REPO}"
        run = github_json(f"{base}/actions/runs/{run_id}", token=token)
        listing = github_json(f"{base}/actions/runs/{run_id}/artifacts?per_page=100",
                              token=token)
        name = f"nba-paper-{run_id}"
        candidates = [a for a in listing.get("artifacts", [])
                      if a.get("id") == artifact_id and a.get("name") == name
                      and a.get("expired") is False]
        if len(candidates) != 1:
            raise ValueError(f"Original artifact unavailable or identity changed: {run_id}")
        artifact = candidates[0]
        if artifact.get("workflow_run", {}).get("id") not in (None, run_id):
            raise ValueError("Artifact does not belong to the claimed workflow run")
        raw = github_archive(artifact["archive_download_url"], token=token)
        sha = hashlib.sha256(raw).hexdigest()
        if sha != expected_zip_sha:
            raise ValueError(f"Original ZIP SHA-256 mismatch for {run_id}")
        rows = inspect_artifact(raw, run, artifact_name=name)
        if len(rows) != expected_count:
            raise ValueError(f"Original forecast count mismatch for {run_id}")
        if any(row.get("evaluation_eligible") is not False or
               row.get("publication_allowed") is not False for row in rows):
            raise ValueError("Unsafe forecast eligibility promotion")
        results.append({
            "run_id":run_id, "artifact_id":artifact_id,
            "sha256":sha, "forecasts_parsed":len(rows),
            "transport_compatibility":"PASS",
            "upstream_source_rights_verified":False,
            "worm_verified":False,
            "independently_verified":False,
        })
        # Explicitly drop original ZIP in-memory; do not create a workflow artifact.
        del raw
    print(json.dumps({"schema":1,"kind":"ORIGINAL_ACTIONS_ZIP_READ_ONLY_REPLAY",
        "status":"PASS","n_original_archives":len(results),
        "n_original_forecasts":sum(x["forecasts_parsed"] for x in results),
        "checks":results,
        "source_rights_verified":False,
        "immutable_worm_verified":False,
        "evaluation_eligible":False,
        "publication_allowed":False,
        "gate_status":"NO_GO"},sort_keys=True))

if __name__ == "__main__":
    main()
