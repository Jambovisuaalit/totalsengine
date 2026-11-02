"""One-shot, fail-closed external ESPN observation. Run in isolated CI only."""
from datetime import datetime, timezone
import json
from nba_totals_research.schedule_observer import observe_espn_nba_schedule
from nba_totals_research.external_integration import IntegrationBoundary

IntegrationBoundary().assert_safe()
today = datetime.now(timezone.utc).date()
observation = observe_espn_nba_schedule(today)
assert observation.raw_bytes > 0
assert not observation.publication_allowed
assert not observation.independently_attested
assert not observation.bookmaker_quote_verified
print(json.dumps({
    "observation_date_utc": today.isoformat(),
    "source": observation.source,
    "fetched_at_utc": observation.fetched_at_utc,
    "raw_sha256": observation.raw_sha256,
    "raw_bytes": observation.raw_bytes,
    "events": observation.events,
    "publication_allowed": False,
    "independently_attested": False,
    "bookmaker_quote_verified": False,
    "gate_status": "NO_GO",
}, sort_keys=True))
