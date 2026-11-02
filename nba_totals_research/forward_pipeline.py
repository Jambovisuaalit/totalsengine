"""Research-only one-shot NBA point-total inference + TSA + S3 Object Lock archive.

No publishing, betting, or market comparison. External verification is fail-closed.
Requires prior independent validation of schedule and historical-data rights.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

from .forward_paper_test import capture_prediction
from .rfc3161_timestamp import timestamp_digest


def _utc(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError("Timezone-aware timestamp required")
    return dt.astimezone(timezone.utc)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def infer_rolling_team_total(csv_path: Path, *, away: str, home: str,
                             cutoff: datetime, n_games: int = 10) -> dict:
    """Deterministic baseline. Past game results admitted only after 24h.

    This is genuine computation, not a trained proprietary predictive model.
    The 24h lag is conservative but is NOT proof of upstream publication time.
    """
    if away == home or not away or not home or not 2 <= n_games <= 30:
        raise ValueError("Invalid matchup or history window")
    cutoff = cutoff.astimezone(timezone.utc)
    raw = csv_path.read_bytes()
    from io import StringIO
    rows = csv.DictReader(StringIO(raw.decode("utf-8-sig")))
    required = {"date", "away", "home", "score_away", "score_home"}
    if not required.issubset(set(rows.fieldnames or ())):
        raise ValueError("Missing required game fields")
    histories = {away.lower(): [], home.lower(): []}
    seen = set()
    for row in rows:
        game_date = datetime.fromisoformat(row["date"]).replace(tzinfo=timezone.utc)
        # Source has dates, not finalization timestamps; omit previous day too.
        if game_date + timedelta(days=2) > cutoff:
            continue
        a, h = row["away"].strip().lower(), row["home"].strip().lower()
        key = (row["date"], a, h)
        if key in seen:
            raise ValueError("Duplicate game in historical input")
        seen.add(key)
        a_score, h_score = int(row["score_away"]), int(row["score_home"])
        if min(a_score, h_score) < 0:
            raise ValueError("Invalid source scores")
        for team in histories:
            if a == team:
                histories[team].append((game_date, a_score + h_score))
            if h == team:
                histories[team].append((game_date, a_score + h_score))
    selected = {}
    for team, games in histories.items():
        games.sort(key=lambda item: item[0])
        if len(games) < n_games:
            raise ValueError("Insufficient completed history")
        selected[team] = [score for _, score in games[-n_games:]]
    projection = (sum(selected[away.lower()]) / n_games +
                  sum(selected[home.lower()]) / n_games) / 2
    # Hash exact data and deterministic specification, not invented model weights.
    spec = {"algorithm": "two_team_rolling_total_mean", "n_games": n_games,
            "source_policy": "game_date_plus_48h", "version": "baseline-v1"}
    return {"expected_total": f"{projection:.4f}",
            "input_sha256": _sha(raw),
            "model_sha256": _sha(json.dumps(spec, sort_keys=True).encode()),
            "model_version": f"baseline-v1-n{n_games}",
            "assumed_availability_only": True,
            "eligible_for_verified_evaluation": False}


def tsa_signed_time(audit_raw: bytes) -> datetime:
    """Extract TSA-signed genTime from OpenSSL's verified reply display."""
    text = json.loads(audit_raw)["timestamp_response_text"]
    stamps = [line.split("Time stamp:", 1)[1].strip()
              for line in text.splitlines() if "Time stamp:" in line]
    if len(stamps) != 1:
        raise ValueError("Missing or ambiguous TSA signed time")
    try:
        dt = datetime.strptime(stamps[0], "%b %d %H:%M:%S %Y GMT")
    except ValueError as exc:
        raise ValueError("Unexpected signed timestamp format") from exc
    return dt.replace(tzinfo=timezone.utc)


def put_object_lock(client, *, bucket: str, key: str, raw: bytes,
                    retain_until: datetime) -> dict:
    """S3 Object Lock COMPLIANCE mode, with server-side retention verification."""
    if not bucket or not key or not raw:
        raise ValueError("Invalid archive object")
    if retain_until.tzinfo is None or retain_until < datetime.now(timezone.utc) + timedelta(days=1):
        raise ValueError("Retention horizon too short")
    result = client.put_object(
        Bucket=bucket, Key=key, Body=raw,
        ContentType="application/octet-stream",
        IfNoneMatch="*",
        ChecksumAlgorithm="SHA256",
        ObjectLockMode="COMPLIANCE",
        ObjectLockRetainUntilDate=retain_until,
    )
    version = result.get("VersionId")
    if not version:
        raise ValueError("Object version ID missing: archive not verified")
    retention = client.get_object_retention(Bucket=bucket, Key=key, VersionId=version)["Retention"]
    if (retention.get("Mode") != "COMPLIANCE" or
            retention.get("RetainUntilDate") < retain_until):
        raise ValueError("Object Lock retention not confirmed")
    # Verify uploaded bytes, not only opaque ETags (multipart/KMS).
    obj = client.get_object(Bucket=bucket, Key=key, VersionId=version)
    if _sha(obj["Body"].read()) != _sha(raw):
        raise ValueError("Archive bytes mismatch")
    return {"bucket": bucket, "key": key, "version_id": version, "sha256": _sha(raw)}


def execute_once(*, data_csv: Path, workdir: Path, game_id: str, away: str,
                 home: str, tipoff: str, feature_cutoff: str, source_rights_approved: bool,
                 schedule_verified: bool, tsa_url: str, tsa_ca: Path, s3_client,
                 s3_bucket: str, retain_until: datetime,
                 n_games: int = 10, clock=None) -> dict:
    """Full one-shot inference & evidence. No completed status unless all checks pass."""
    if not (source_rights_approved and schedule_verified):
        raise ValueError("Documented data rights and independently verified schedule required")
    now = (clock or (lambda: datetime.now(timezone.utc)))()
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Trusted timezone-aware host clock required")
    cutoff = _utc(feature_cutoff)
    kickoff = _utc(tipoff)
    if not cutoff <= now.astimezone(timezone.utc) < kickoff:
        raise ValueError("Outside pregame prediction window")
    inferred = infer_rolling_team_total(data_csv, away=away, home=home,
                                        cutoff=cutoff, n_games=n_games)
    # Model source's publication time is unverified: this is still only a
    # preliminary research capture, regardless of TSA success.
    with TemporaryDirectory(dir=workdir) as temp:
        tempdir = Path(temp)
        local = capture_prediction(
            tempdir, game_id=game_id, model_version=inferred["model_version"],
            scheduled_tipoff=tipoff, feature_cutoff=feature_cutoff,
            input_sha256=inferred["input_sha256"],
            model_sha256=inferred["model_sha256"],
            expected_total=inferred["expected_total"],
            generated_at=now.isoformat(), clock=lambda: now)
        raw = Path(local["path"]).read_bytes()
        if _sha(raw) != local["prediction_sha256"]:
            raise ValueError("Prediction digest mismatch")
        attested = timestamp_digest(local["prediction_sha256"], tempdir / "tsa",
                                    tsa_url=tsa_url, ca_file=tsa_ca)
        if not attested["rfc3161_verified"] or attested["raw_sha256"] != _sha(raw):
            raise ValueError("Independent timestamp verification failed")
        audit_raw = (tempdir / "tsa" / "timestamp-audit.json").read_bytes()
        signed_at = tsa_signed_time(audit_raw)
        if not now.astimezone(timezone.utc) - timedelta(minutes=1) <= signed_at < kickoff:
            raise ValueError("TSA signed time outside prediction window")
        artifacts = {
            "prediction.json": raw,
            "historical-source.csv": data_csv.read_bytes(),
            "request.tsq": (tempdir / "tsa" / "request.tsq").read_bytes(),
            "response.tsr": (tempdir / "tsa" / "response.tsr").read_bytes(),
            "timestamp-audit.json": audit_raw,
        }
        if _sha(artifacts["historical-source.csv"]) != inferred["input_sha256"]:
            raise ValueError("Historical source changed during inference")
        prefix = f"nba-paper-v1/{game_id}/{inferred['model_version']}/{_sha(raw)}"
        archived = {}
        for name, data in artifacts.items():
            archived[name] = put_object_lock(
                s3_client, bucket=s3_bucket, key=f"{prefix}/{name}",
                raw=data, retain_until=retain_until)
        # A separately locked completion manifest is written LAST. If any
        # preceding upload fails there is no completed archive checkpoint.
        manifest = {"schema_version": 1, "type": "PROSPECTIVE_ARCHIVE_COMPLETION",
                    "game_id": game_id, "model_version": inferred["model_version"],
                    "prediction_sha256": _sha(raw), "tsa_signed_at": signed_at.isoformat(),
                    "artifacts": archived, "external_timestamp_verified": True,
                    "source_availability_verified": False,
                    "evaluation_eligible": False, "publication_allowed": False}
        completion = put_object_lock(
            s3_client, bucket=s3_bucket, key=f"{prefix}/completion-manifest.json",
            raw=json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode(),
            retain_until=retain_until)
        return {"status": "CAPTURED_ARCHIVED_TIMESTAMPED_RESEARCH_ONLY",
                "completion_manifest": completion,
                "prediction_sha256": _sha(raw),
                "predicted_total": inferred["expected_total"],
                "archive": archived, "tsa_verified": True,
                "source_availability_verified": False,
                "evaluation_eligible": False, "publication_allowed": False,
                "gate_status": "NO_GO"}


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Prospective research capture; no wagering")
    parser.add_argument("--data-csv", type=Path, required=True)
    parser.add_argument("--workdir", type=Path, required=True)
    parser.add_argument("--game-id", required=True)
    parser.add_argument("--away", required=True)
    parser.add_argument("--home", required=True)
    parser.add_argument("--tipoff", required=True)
    parser.add_argument("--feature-cutoff", required=True)
    parser.add_argument("--rights-reviewed", action="store_true")
    parser.add_argument("--schedule-reviewed", action="store_true")
    parser.add_argument("--tsa-url", required=True)
    parser.add_argument("--tsa-ca", type=Path, required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--retention-days", type=int, default=365)
    args = parser.parse_args()
    if args.retention_days < 30:
        parser.error("Minimum retention is 30 days")
    args.workdir.mkdir(parents=True, exist_ok=True)
    try:
        import boto3
    except ImportError as exc:
        parser.error("Install boto3 in the controlled execution environment")
    result = execute_once(
        data_csv=args.data_csv, workdir=args.workdir,
        game_id=args.game_id, away=args.away, home=args.home,
        tipoff=args.tipoff, feature_cutoff=args.feature_cutoff,
        source_rights_approved=args.rights_reviewed,
        schedule_verified=args.schedule_reviewed,
        tsa_url=args.tsa_url, tsa_ca=args.tsa_ca,
        s3_client=boto3.client("s3"), s3_bucket=args.bucket,
        retain_until=datetime.now(timezone.utc) + timedelta(days=args.retention_days))
    print(json.dumps(result, sort_keys=True))

if __name__ == "__main__":
    main()
