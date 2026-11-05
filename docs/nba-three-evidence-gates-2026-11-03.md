> Scope: **RESEARCH CONTRACT / prototype scope**. Requirements apply to the named component. Old current-state, dependency and deployment observations are superseded.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# NBA source, ID mapping & pregame archival checks — 2026-11-03

## Implementation

`nba_totals_research/source_provenance_gates.py` adds three **local research-only** checks and no publishing side effects:

1. `source_receipt` verifies exact raw JSON SHA-256, HTTPS provider host, source schema, successful HTTP status and an offset-aware host retrieval time. It cannot independently authenticate HTTP provenance, provider publication time or data licenses.
2. `reconcile_game_ids` performs an exact, one-to-one ESPN ↔ BALLDONTLIE game match using separately supplied canonical team-code aliases, away/home, and **exact UTC scheduled tipoff**. It rejects duplicate IDs and ambiguous matches; unmatched games remain explicit. No fuzzy matches, invented IDs or inferred schedule tolerance.
3. `inspect_pregame_archive` verifies **original prediction bytes** against a claimed SHA-256, model version, linked ESPN game identity, host generation time and host archival time before the exact scheduled tipoff. It never promotes a host clock or Git branch to independent timestamp/immutable storage.

Tests: `python -m unittest tests_nba_totals.test_source_provenance_gates -v`. Fixtures are synthetic and do not prove a real provider connection.

## Evidence requirements before promotion

- **Source**: contractual NBA feed rights (access, retention, commercial publication), preserved original response, independently verifiable upstream publication timestamp and receipt. The ESPN public endpoint has **no verified redistribution grant**.
- **Mapping**: independently reviewed game/team-ID mapping with source receipts bound to the **same** ESPN and BALLDONTLIE records, full duplicate/ambiguity audit and tipoff reschedule handling. Current module is strict consistency only.
- **Pregame**: original forecast + input/model hash, authenticated source availability before feature cutoff, independently verified RFC3161 timestamp or audited equivalent, immutable WORM archive version/retention and independent verifier. `forward_pipeline.py` has an RFC3161/S3 design but no approved TSA CA/S3 WORM provisioned.
- **Outcome/metrics**: independently supported FINAL scores, game identity match, deduplication and cohort denominator before reporting real MAE/RMSE. No timestamped licensed market odds means **no EV/ROI**.

## Decision

**NO_GO**, verified prospective trial **0/100**, `evaluation_eligible=false`, `publication_allowed=false`; no bets, signals or claims. Research-ledger artifacts are not WORM and host timestamps are not independent TSA evidence.

Do not merge a success claim based solely on synthetic tests, an unverified team alias registry or a GitHub commit time. The previous SHA-checkout fix remains separately tracked in PR #21.
