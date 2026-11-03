"""GitHub-only long-term paper-study ledger.

Contents API writes are create-only; replays require byte-for-byte equality.
Public Git history is durable in normal operation but NOT WORM or independent TSA.
Only derived forecast records, report rows and hashes are persisted; never
ESPN raw responses or secrets. No wagering or publisher integration.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .scheduled_paper_collector import canonical, digest, iso

BRANCH = "research-ledger"
SAFE_REPO = re.compile(r"^[\w.-]+/[\w.-]+$")
SAFE_ID = re.compile(r"^[0-9]{1,24}$")
UTC = timezone.utc


def api(repo: str, token: str, method: str, endpoint: str, body=None):
    if not SAFE_REPO.fullmatch(repo) or not token:
        raise ValueError("Repository and Actions token required")
    if not endpoint.startswith("/") or "//" in endpoint:
        raise ValueError("Invalid GitHub endpoint")
    url = f"https://api.github.com/repos/{repo}{endpoint}"
    payload = canonical(body) if body is not None else None
    req = Request(url, data=payload, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "TotalsEngineResearch/1.0"})
    with urlopen(req, timeout=25) as response:
        raw = response.read(5_000_001)
        if len(raw) > 5_000_000:
            raise ValueError("Oversize API response")
    return json.loads(raw)


def archive_path(kind: str, run_id: int) -> str:
    if kind not in {"forecasts", "settlements"} or not SAFE_ID.fullmatch(str(run_id)):
        raise ValueError("Invalid ledger key")
    return f"{kind}/{run_id}.json"


def read_record(repo: str, token: str, path: str) -> tuple[dict, bytes]:
    info = api(repo, token, "GET", f"/contents/{path}?ref={BRANCH}")
    if info.get("type") != "file" or info.get("encoding") != "base64":
        raise ValueError("Unexpected GitHub ledger content")
    raw = base64.b64decode(info["content"])
    return info, raw


def create_only(repo: str, token: str, path: str, obj: dict) -> dict:
    raw = canonical(obj)
    try:
        result = api(repo, token, "PUT", f"/contents/{path}", {
            "message": "research paper ledger: " + path,
            "branch": BRANCH,
            "content": base64.b64encode(raw).decode("ascii")})
        return {"status": "CREATED", "path": path,
                "commit": result["commit"]["sha"], "sha256": digest(raw)}
    except HTTPError as exc:
        if exc.code not in (409, 422):
            raise
        # Refuse silent replacement or conflicting replay.
        _, existing = read_record(repo, token, path)
        if existing != raw:
            raise ValueError("Ledger path exists with conflicting content") from exc
        return {"status": "ALREADY_IDENTICAL", "path": path, "sha256": digest(raw)}


def validate_rows(rows: list[dict]) -> None:
    from .scheduled_paper_collector import canonical as c
    from .scheduled_paper_collector import digest as d
    if not isinstance(rows, list):
        raise ValueError("Forecasts must be array")
    for record in rows:
        if not isinstance(record, dict):
            raise ValueError("Bad forecast record")
        claim = record.get("record_sha256")
        unsealed = {k: v for k, v in record.items() if k != "record_sha256"}
        if (not isinstance(claim, str) or claim != d(c(unsealed))
                or record.get("publication_allowed") is not False
                or record.get("evaluation_eligible") is not False
                or record.get("gate_status") != "NO_GO"):
            raise ValueError("Unsafe or modified forecast")


def archive_forecast(repo: str, token: str, run_id: int, directory: Path,
                     *, now: datetime | None = None) -> dict:
    manifest_raw = (directory / "manifest.json").read_bytes()
    manifest = json.loads(manifest_raw)
    prediction_raw = (directory / "predictions.jsonl").read_bytes()
    if digest(prediction_raw) != manifest["predictions_sha256"]:
        raise ValueError("Forecast manifest digest mismatch")
    rows = [json.loads(line) for line in prediction_raw.splitlines() if line.strip()]
    if len(rows) != manifest["n_forecasts"]:
        raise ValueError("Forecast count mismatch")
    validate_rows(rows)
    current = (now or datetime.now(UTC)).astimezone(UTC)
    generated = iso(manifest["generated_at_host_utc"])
    if generated > current:
        raise ValueError("Future-dated host timestamp")
    workflow_sha = os.getenv("GITHUB_SHA")
    manifest_sha = manifest.get("runner_commit_sha")
    if manifest_sha is not None:
        if not isinstance(manifest_sha, str) or not re.fullmatch(r"[0-9a-f]{40}", manifest_sha):
            raise ValueError("Malformed source commit SHA")
        if os.getenv("GITHUB_ACTIONS") == "true" and manifest_sha != workflow_sha:
            raise ValueError("Collection checkout and archive SHA mismatch")
    for record in rows:
        if iso(record["generated_at_host_utc"]) != generated:
            raise ValueError("Forecast/manifest timestamp mismatch")
        # GitHub ledger writes must finish BEFORE kickoff. Be conservative.
        if current >= iso(record["scheduled_tipoff"]):
            raise ValueError("Attempted to archive after scheduled kickoff")
    envelope = {
        "schema": 1, "kind": "FORECAST_RUN_RESEARCH_ONLY",
        "run_id": run_id, "generated_at_host_utc": generated.isoformat(),
        "ledger_submitted_at_host_utc": current.isoformat(),
        "predictions_sha256": digest(prediction_raw),
        "manifest_sha256": digest(manifest_raw),
        "runner_commit_sha": manifest_sha,
        "source_snapshot_hashes": manifest["source_sha256_by_day"],
        "rows": rows, "n_forecasts": len(rows),
        "independently_timestamped": False,
        "source_availability_verified": False,
        "publication_allowed": False, "evaluation_eligible": False,
        "gate_status": "NO_GO",
    }
    return create_only(repo, token, archive_path("forecasts", run_id), envelope)


def archive_settlement(repo: str, token: str, run_id: int, directory: Path) -> dict:
    raw = (directory / "report.json").read_bytes()
    report = json.loads(raw)
    if report.get("gate_status") != "NO_GO" or report.get("publication_allowed") is not False:
        raise ValueError("Unsafe settlement report")
    envelope = {"schema": 1, "kind": "SETTLEMENT_RESEARCH_ONLY",
                "run_id": run_id, "report_sha256": digest(raw),
                "report": report, "independently_timestamped": False,
                "publication_allowed": False, "gate_status": "NO_GO"}
    return create_only(repo, token, archive_path("settlements", run_id), envelope)


def import_verified_artifact(repo: str, token: str, run: dict,
                             zip_raw: bytes, checked_rows: list[dict],
                             *, now: datetime | None = None) -> dict:
    """Preserve historic Actions forecasts, explicitly marking late imports.

    Called only AFTER forward_settlement.inspect_artifact checked original hashes
    and run completion. Never changes original generated_at or pretends that
    ledger commit occurred at the pregame prediction time.
    """
    from io import BytesIO
    from zipfile import ZipFile
    run_id = int(run["id"])
    path = archive_path("forecasts", run_id)
    rows = [{k: v for k, v in p.items() if not k.startswith("_")}
            for p in checked_rows]
    validate_rows(rows)
    if any(p.get("_github_run_id") != run_id for p in checked_rows):
        raise ValueError("Cross-run artifact import")
    with ZipFile(BytesIO(zip_raw)) as z:
        manifest_raw = z.read("manifest.json")
        predictions_raw = z.read("predictions.jsonl")
        manifest = json.loads(manifest_raw)
    manifest_sha = manifest.get("runner_commit_sha")
    if manifest_sha is not None:
        if (not isinstance(manifest_sha, str)
                or not re.fullmatch(r"[0-9a-f]{40}", manifest_sha)
                or manifest_sha != run.get("head_sha")):
            raise ValueError("Imported forecast commit SHA differs from origin run")
    if manifest["predictions_sha256"] != digest(predictions_raw):
        raise ValueError("Import manifest is corrupt")
    # The original capture completed before each tipoff (verified earlier).
    # This new Git commit may be later and is not represented as pregame.
    existing = None
    try:
        _, raw = read_record(repo, token, path)
        existing = json.loads(raw)
    except HTTPError as exc:
        if exc.code != 404:
            raise
    if existing is not None:
        if (existing.get("run_id") != run_id
                or existing.get("rows") != rows
                or existing.get("predictions_sha256") != digest(predictions_raw)):
            raise ValueError("Existing ledger record conflicts with imported artifact")
        return {"status": "ALREADY_ARCHIVED", "path": path}
    submitted = (now or datetime.now(UTC)).astimezone(UTC)
    env = {
        "schema": 1, "kind": "FORECAST_RUN_RESEARCH_ONLY",
        "run_id": run_id,
        "generated_at_host_utc": manifest["generated_at_host_utc"],
        "ledger_submitted_at_host_utc": submitted.isoformat(),
        "retrospective_import": True,
        "origin_run_completed_at_utc": run["updated_at"],
        "predictions_sha256": digest(predictions_raw),
        "manifest_sha256": digest(manifest_raw),
        "runner_commit_sha": manifest_sha,
        "source_snapshot_hashes": manifest["source_sha256_by_day"],
        "rows": rows, "n_forecasts": len(rows),
        "independently_timestamped": False,
        "source_availability_verified": False,
        "publication_allowed": False,
        "evaluation_eligible": False,
        "gate_status": "NO_GO"}
    return create_only(repo, token, path, env)


def load_forecasts(repo: str, token: str) -> list[dict]:
    """Read all retained forecast runs; fail closed on tree truncation/conflicts."""
    listing = api(repo, token, "GET", f"/git/trees/{BRANCH}?recursive=1")
    if listing.get("truncated"):
        raise ValueError("GitHub archive tree truncated")
    paths = sorted(x["path"] for x in listing["tree"]
                   if re.fullmatch(r"forecasts/[0-9]+\.json", x["path"]))
    result = []
    for path in paths:
        _, raw = read_record(repo, token, path)
        body = json.loads(raw)
        if (body.get("kind") != "FORECAST_RUN_RESEARCH_ONLY"
                or body.get("gate_status") != "NO_GO"
                or body.get("publication_allowed") is not False
                or body.get("n_forecasts") != len(body.get("rows", []))):
            raise ValueError("Invalid archived forecast envelope")
        validate_rows(body["rows"])
        run_id = body["run_id"]
        if path != archive_path("forecasts", run_id):
            raise ValueError("Forecast archive ID mismatch")
        for row in body["rows"]:
            p = dict(row)
            p["_github_run_id"] = run_id
            p["_ledger_origin"] = True
            p["_runner_commit_sha"] = body.get("runner_commit_sha")
            result.append(p)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("forecasts", "settlements"))
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--run-id", type=int, required=True)
    args = parser.parse_args()
    if os.getenv("HALTED") != "1" or os.getenv("PUBLICATION_ALLOWED") != "false":
        raise SystemExit("Research safety gates required")
    repo, token = os.getenv("GITHUB_REPOSITORY", ""), os.getenv("GH_TOKEN", "")
    if args.action == "forecasts":
        result = archive_forecast(repo, token, args.run_id, args.directory)
    else:
        result = archive_settlement(repo, token, args.run_id, args.directory)
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
