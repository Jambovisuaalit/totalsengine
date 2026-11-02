"""One-shot isolated ESPN probe; local evidence deleted at process exit."""
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import os

from nba_totals_research.schedule_observer import observe_espn_nba_schedule
from nba_totals_research.external_integration import IntegrationBoundary

IntegrationBoundary().assert_safe()
if os.environ.get("HALTED") != "1" or os.environ.get("PUBLICATION_ALLOWED") != "false":
    raise RuntimeError("Fail closed: explicit CI halt required")

today = datetime.now(timezone.utc).date()
with TemporaryDirectory(prefix="nba-research-") as directory:
    raw_path = Path(directory) / "espn-scoreboard.json"
    observation = observe_espn_nba_schedule(today, raw_output=raw_path)
    raw = raw_path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != observation.raw_sha256:
        raise RuntimeError("Raw evidence digest mismatch")
    if len(raw) != observation.raw_bytes:
        raise RuntimeError("Raw evidence size mismatch")
    if observation.publication_allowed or observation.independently_attested or observation.bookmaker_quote_verified:
        raise RuntimeError("Unsafe external observation state")
    print(json.dumps({
        "observation_date_utc": today.isoformat(),
        "source": observation.source,
        "fetched_at_utc": observation.fetched_at_utc,
        "raw_sha256": observation.raw_sha256,
        "raw_bytes": observation.raw_bytes,
        "events": observation.events,
        "raw_evidence_retention": "ephemeral_runner_only_deleted_at_exit",
        "publication_allowed": False,
        "independently_attested": False,
        "bookmaker_quote_verified": False,
        "gate_status": "NO_GO",
    }, sort_keys=True))
