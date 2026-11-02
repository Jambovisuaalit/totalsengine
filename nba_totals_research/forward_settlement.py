"""Research-only rolling NBA forecast settlement from prior Actions artifacts.

No AWS, odds, bets, external proof assertions or publication. The score metrics
here are *provisional* (GitHub-host timestamp, ESPN unverified data rights).
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import math
import os
import re
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from .scheduled_paper_collector import canonical, digest, download_day, extract, iso

UTC = timezone.utc
MAX_ARTIFACT = 12_000_000
MAX_ARCHIVES = 150


def github_json(url: str, *, token: str) -> dict:
    if not token:
        raise ValueError("GITHUB_TOKEN missing")
    request = Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "TotalsEngineResearch/1.0",
    })
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise ValueError("GitHub metadata HTTP failure")
        raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError("GitHub response too large")
    return json.loads(raw)


def github_archive(url: str, *, token: str) -> bytes:
    request = Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "TotalsEngineResearch/1.0",
    })
    with urlopen(request, timeout=30) as response:
        data = response.read(MAX_ARTIFACT + 1)
        if len(data) > MAX_ARTIFACT:
            raise ValueError("Oversized Actions artifact")
    return data


def inspect_artifact(raw_zip: bytes, run: dict, *, artifact_name: str) -> list[dict]:
    """Verify snapshot hashes and per-row digest against archived collection manifest."""
    if (run.get("path") != ".github/workflows/nba-forward-collection.yml"\n            or run.get("head_branch") != "main"):\n        raise ValueError("Artifact is not from the approved main-branch forecast workflow")\n    if run.get("status") != "completed" or run.get("conclusion") != "success":
        raise ValueError("Only successful completed runs qualify")
    created, completed = iso(run["created_at"]), iso(run["updated_at"])
    if completed < created:
        raise ValueError("Invalid GitHub run dates")
    if not artifact_name.startswith("nba-paper-") or artifact_name != "nba-paper-" + str(run["id"]):
        raise ValueError("Artifact must reference exact run ID")
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as archive:
        names = archive.namelist()
        if len(names) > 100 or len(set(names)) != len(names):
            raise ValueError("Unexpected ZIP entries")
        files = {}
        for info in archive.infolist():
            name = info.filename
            if (info.is_dir() or name.startswith("/") or ".." in Path(name).parts
                    or not (name in {"manifest.json", "predictions.jsonl"}
                            or re.fullmatch(r"source_snapshots/\d{4}-\d{2}-\d{2}\.json", name))
                    or info.file_size > 2_000_000):
                raise ValueError("Unsafe or unexpected Actions archive entry")
            files[name] = archive.read(name)
        manifest = json.loads(files["manifest.json"])
        predictions = files["predictions.jsonl"]
        if (manifest["predictions_sha256"] != digest(predictions)
                or manifest["gate_status"] != "NO_GO"
                or manifest["publication_allowed"] is not False):
            raise ValueError("Invalid prediction manifest")
        if (len(manifest["source_sha256_by_day"]) != manifest["n_source_days"]
                or manifest["n_source_days"] > 40):
            raise ValueError("Invalid source snapshot manifest")
        for day, sha in manifest["source_sha256_by_day"].items():
            if digest(files[f"source_snapshots/{day}.json"]) != sha:
                raise ValueError("Source snapshot SHA mismatch")
        if set(files) != ({"manifest.json", "predictions.jsonl"} |
                         {f"source_snapshots/{day}.json"
                          for day in manifest["source_sha256_by_day"]}):
            raise ValueError("Manifest does not enumerate all archive files")
        generated = iso(manifest["generated_at_host_utc"])
        # GitHub run was created first and finished before the forecasted game.
        if not created - timedelta(minutes=1) <= generated <= completed + timedelta(minutes=1):
            raise ValueError("Prediction host time conflicts with GitHub run metadata")
        rows = [json.loads(line) for line in predictions.splitlines() if line.strip()]
        if len(rows) != manifest["n_forecasts"]:
            raise ValueError("Forecast row count mismatch")
        result = []
        for row in rows:
            claim = row.pop("record_sha256")
            if claim != digest(canonical(row)):
                raise ValueError("Tampered forecast row")
            if (row["model_version"] != "rolling-team-total-v1"
                    or row["source"] != "ESPN_SCOREBOARD_UNVERIFIED"
                    or row["gate_status"] != "NO_GO"
                    or row["publication_allowed"] is not False
                    or row["evaluation_eligible"] is not False):
                raise ValueError("Unsupported forecast provenance")
            tipoff = iso(row["scheduled_tipoff"])
            recorded = iso(row["generated_at_host_utc"])
            if (recorded != generated or completed >= tipoff
                    or (tipoff - recorded).total_seconds() < 7200):
                raise ValueError("Prediction was not securely logged before tipoff")
            val = row["expected_total"]
            if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
                raise ValueError("Invalid predicted total")
            row["record_sha256"] = claim
            row["_github_run_id"] = run["id"]
            row["_github_completed_utc"] = completed.isoformat()
            result.append(row)
        return result


def score_forecasts(predictions: list[dict], final_games: list[dict], *, at: datetime) -> dict:
    """Deterministic dedup; never fabricate scores or silently match team/date."""
    finals = {}
    for g in final_games:
        sid = str(g["source_game_id"])
        if sid in finals and finals[sid] != g:
            raise ValueError("Conflicting final results for source game")
        finals[sid] = g
    unique = {}
    duplicates = 0
    for row in sorted(predictions, key=lambda r: (
            iso(r["generated_at_host_utc"]), r["_github_run_id"], r["record_sha256"])):
        key = (row["source_game_id"], row["model_version"])
        if key in unique:
            duplicates += 1
            continue
        unique[key] = row
    scored, pending, mismatched = [], [], []
    for (sid, version), p in unique.items():
        result = finals.get(str(sid))
        if result is None or result.get("status") != "FINAL":
            pending.append(sid)
            continue
        if (result["away"] != p["away"] or result["home"] != p["home"]
                or result["scheduled_tipoff"] != p["scheduled_tipoff"]):
            mismatched.append(sid)
            continue
        # Score only after a conservative finalization delay.
        if at < iso(result["scheduled_tipoff"]) + timedelta(hours=6):
            pending.append(sid)
            continue
        actual = result["score_away"] + result["score_home"]
        error = float(p["expected_total"]) - actual
        scored.append({
            "source_game_id": sid, "model_version": version,
            "away": p["away"], "home": p["home"],
            "tipoff": p["scheduled_tipoff"], "predicted_total": p["expected_total"],
            "actual_total": actual, "error": error,
            "absolute_error": abs(error),
            "record_sha256": p["record_sha256"],
            "github_run_id": p["_github_run_id"],
        })
    # A mismatched result is an audit blocker, never a scored row.
    errors = [r["error"] for r in scored]
    return {
        "report_type": "PROVISIONAL_FORWARD_PAPER_ONLY",
        "n_input_forecasts": len(predictions),
        "n_unique_forecasts": len(unique),
        "n_duplicates_discarded": duplicates,
        "n_scored": len(scored),
        "n_pending": len(pending),
        "n_identity_mismatches": len(mismatched),
        "mae": sum(abs(e) for e in errors) / len(errors) if errors else None,
        "rmse": math.sqrt(sum(e*e for e in errors) / len(errors)) if errors else None,
        "mean_error": sum(errors) / len(errors) if errors else None,
        "scored_rows": scored, "pending_ids": pending,
        "mismatched_ids": mismatched,
        "source_rights_verified": False,
        "external_timestamp_verified": False,
        "independently_verified_count": 0,
        "market_comparison": "NOT_EVALUATED",
        "evaluation_eligible": False, "publication_allowed": False,
        "gate_status": "NO_GO",
    }


def collect_from_github(repo: str, token: str, *, max_runs: int = MAX_ARCHIVES) -> list[dict]:
    base = f"https://api.github.com/repos/{repo}"
    result = []
    fetched = 0
    for page in range(1, 5):
        listing = github_json(f"{base}/actions/artifacts?per_page=100&page={page}", token=token)
        artifacts = listing.get("artifacts", [])
        if not artifacts:
            break
        for artifact in artifacts:
            name = artifact.get("name", "")
            if artifact.get("expired") or not re.fullmatch(r"nba-paper-\d+", name):
                continue
            run_id = int(name.split("-")[-1])
            if run_id != artifact.get("workflow_run", {}).get("id"):
                raise ValueError("Artifact workflow-run mismatch")
            run = github_json(f"{base}/actions/runs/{run_id}", token=token)
            zipped = github_archive(artifact["archive_download_url"], token=token)
            result.extend(inspect_artifact(zipped, run, artifact_name=name))
            fetched += 1
            if fetched >= max_runs:
                return result
    return result


def run_report(repo: str, token: str, output: Path, *, at: datetime | None = None,
               predictions: list[dict] | None = None, fetch=download_day) -> dict:
    at = (at or datetime.now(UTC)).astimezone(UTC)
    forecasts = predictions if predictions is not None else collect_from_github(repo, token)
    if not forecasts:
        finals = []
        source_raw = {}
    else:
        dates = sorted({iso(p["scheduled_tipoff"]).date() + timedelta(days=delta)
                        for p in forecasts for delta in (-1, 0, 1)
                        if iso(p["scheduled_tipoff"]) < at})
        source_raw = {d.isoformat(): fetch(d) for d in dates}
        finals = extract(source_raw)
    report = score_forecasts(forecasts, finals, at=at)
    report["generated_at_utc"] = at.isoformat()
    report["source_snapshot_sha256"] = {day: digest(raw) for day,raw in source_raw.items()}
    output.mkdir(parents=True, exist_ok=True)
    (output / "report.json").write_bytes(canonical(report))
    with (output / "scored_rows.jsonl").open("wb") as f:
        for row in report["scored_rows"]:
            f.write(canonical(row) + b"\n")
    source_dir = output / "result_sources"
    source_dir.mkdir(exist_ok=True)
    for day, raw in source_raw.items():
        (source_dir / f"{day}.json").write_bytes(raw)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
        raise SystemExit("Fail-closed safety flags required")
    repo, token = os.environ.get("GITHUB_REPOSITORY", ""), os.environ.get("GH_TOKEN", "")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo) or not token:
        raise SystemExit("GitHub repository or read-only Actions token missing")
    result = run_report(repo, token, args.output)
    print(json.dumps({k:v for k,v in result.items()
                      if k not in ("scored_rows", "pending_ids", "mismatched_ids")},
                     sort_keys=True))

if __name__ == "__main__":
    main()
