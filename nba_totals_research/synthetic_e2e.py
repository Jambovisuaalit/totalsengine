"""Synthetic end-to-end chain: original bytes -> manifest -> features -> forecast.

Only signed digest verification in GitHub Actions can close the synthetic
attestation gate. This module never claims an actual provider or model edge.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from .real_source_evidence import canonical, sha256


def produce(out: Path, *, commit: str, run_id: str) -> dict:
    out.mkdir(parents=True, exist_ok=False)
    original = canonical({
        "data": [{"id": 424242, "status": "Final", "period": 4,
                  "home_team_score": 112, "visitor_team_score": 105,
                  "datetime": "2026-11-05T02:00:00Z"}],
        "meta": {"next_cursor": None},
        "fixture": "SYNTHETIC_DO_NOT_USE_FOR_MODEL"})
    (out / "original.json").write_bytes(original)
    # Feature lineage is deterministic and refers to the *original* bytes.
    source_sha = sha256(original)
    feature = {"schema": 1, "source_sha256": source_sha,
               "event_id": "synthetic:424242", "total_points": 217,
               "feature_cutoff_utc": "2026-11-06T00:00:00Z"}
    feature_bytes = canonical(feature)
    (out / "features.json").write_bytes(feature_bytes)
    forecast = {"schema": 1, "kind": "SYNTHETIC_FORECAST_NOT_OOS",
                "features_sha256": sha256(feature_bytes),
                "prediction": 217.0, "model": "synthetic_identity_fixture",
                "evaluation_eligible": False, "publication_allowed": False}
    forecast_bytes = canonical(forecast)
    (out / "forecast.json").write_bytes(forecast_bytes)
    manifest = {
        "schema": 1, "kind": "SYNTHETIC_E2E_PRE_FORECAST",
        "runner_commit_sha": commit, "run_id": run_id,
        "files": {name: sha256((out / name).read_bytes())
                  for name in ("original.json", "features.json", "forecast.json")},
        "source_rights_verified": False, "source_availability_verified": False,
        "sigstore_verified": False, "worm_retention_verified": False,
        "evaluation_eligible": False, "publication_allowed": False,
        "gate": "HOLD"}
    (out / "manifest.json").write_bytes(canonical(manifest))
    return verify(out)


def verify(out: Path) -> dict:
    m = json.loads((out / "manifest.json").read_bytes())
    if m["kind"] != "SYNTHETIC_E2E_PRE_FORECAST" or m["gate"] != "HOLD":
        raise ValueError("Unexpected synthetic evidence identity")
    for name, expected in m["files"].items():
        if name not in ("original.json", "features.json", "forecast.json"):
            raise ValueError("Unexpected file in manifest")
        if sha256((out / name).read_bytes()) != expected:
            raise ValueError("Original evidence changed")
    source = json.loads((out / "original.json").read_bytes())
    feature = json.loads((out / "features.json").read_bytes())
    forecast = json.loads((out / "forecast.json").read_bytes())
    if feature["source_sha256"] != sha256((out / "original.json").read_bytes()):
        raise ValueError("Feature lineage mismatch")
    if forecast["features_sha256"] != sha256((out / "features.json").read_bytes()):
        raise ValueError("Forecast lineage mismatch")
    if source["data"][0]["home_team_score"] + source["data"][0]["visitor_team_score"] != feature["total_points"]:
        raise ValueError("Synthetic fixture not deterministic")
    if any(m.get(k) is not False for k in (
            "source_rights_verified", "source_availability_verified",
            "sigstore_verified", "worm_retention_verified",
            "evaluation_eligible", "publication_allowed")):
        raise ValueError("Synthetic artifact illegally promoted")
    if forecast["evaluation_eligible"] is not False or forecast["publication_allowed"] is not False:
        raise ValueError("Synthetic forecast illegally promoted")
    return {"local_integrity_verified": True,
            "manifest_sha256": sha256((out / "manifest.json").read_bytes()),
            "source_sha256": feature["source_sha256"],
            "forecast_sha256": sha256((out / "forecast.json").read_bytes()),
            "gate": "HOLD"}
