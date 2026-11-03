# 2026-11-03: six-game result-source and identity reconciliation checkpoint

**Purpose:** Make the previous manual provisional settlement reproducible as a *candidate* comparison, not an admitted independent performance record. This is not an authorisation to fetch, cache, redistribute or publish third-party raw data.

## Original forecast source

- GitHub `research-ledger/forecasts/41429108933.json` (15 rows), created from run 41429108933 and timestamped by the **GitHub host**, not an independent TSA.
- Six earliest scheduled events, all model `rolling-team-total-v1`; GitHub forecast fields and source ESPN IDs below. Other nine not evaluated here.
- Original forecast records are left unchanged. First forecast per ESPN ID/model, never choose a later more favourable entry.
- Exact archive: https://github.com/Jambovisuaalit/totalsengine/blob/research-ledger/forecasts/41429108933.json

## Provisional outcome candidates (2026-11-02 US game date)

| ESPN ID (forecast claim) | Matchup | Scheduled UTC | Forecast total | Reported away-home | Actual total | ID evidence |
|---|---|---|---:|---|---:|---|
| 401909907 | OKC @ CLE | 2026-11-03T00:00:00Z | 227.65 | 117-112 | 229 | CANDIDATE_ONLY |
| 401909908 | DET @ CHA | 2026-11-03T00:30:00Z | 212.3 | 124-91 | 215 | CANDIDATE_ONLY |
| 401909909 | ATL @ IND | 2026-11-03T00:30:00Z | 235.85 | 108-104 | 212 | CANDIDATE_ONLY |
| 401909910 | BKN @ NYK | 2026-11-03T00:30:00Z | 228.7667 | 90-103 | 193 | CANDIDATE_ONLY |
| 401909911 | WAS @ ORL | 2026-11-03T00:30:00Z | 228.3389 | 103-94 | 197 | CANDIDATE_ONLY |
| 401909912 | CHI @ PHI | 2026-11-03T00:30:00Z | 230.8 | 107-126 | 233 | CANDIDATE_ONLY |

Independent published *score cross-checks* (not approved redistribution feeds, not API receipts):
- https://www.sportsstats.app/nba/scores (Nov 2 2026)
- https://infonews.ca/news/7969603/scores-and-sports-schedule-for-monday-nov-2-2026/ (Canadian Press, Nov 2 2026)
- https://keelstats.com/es/scores/2026-11-02

These establish reasonable **score-level agreement** for the six games, but do not include verifiable raw provider receipt bound to each claimed ESPN ID, independently authenticated source publication time or approved reuse rights. The association of an ESPN ID with the scoreboard row is **matchup/time inference**, not a verified external provider-ID mapping.

## Manual comparison (not official GitHub settlement)

- 6 candidate matches; nine other distinct original cohort forecasts intentionally not assessed.
- Candidate MAE **16.2009**; candidate RMSE **21.7721**; mean signed error **+14.1176** (predicted minus actual).
- No licensed source or authenticated event-ID receipt; no independent TSA/WORM chain.
- `report_type=PROVISIONAL_MANUAL_CROSS_SOURCE_SETTLEMENT`
- `independently_verified_count=0`, `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`.
- These 6 rows are **not imported as settled records into the research ledger**, nor mixed into any independently certified accuracy report.

## Source rights: hard blocker

The current https://www.nba.com/termsofuse (NBA Statistics section) restricts use of NBA.com statistics in gambling or other commercial products and comprehensive regularly updated databases without required consent. This is not a legal opinion on independently sourced scores, but it makes NBA.com **unsuitable as a presumed commercial data grant**. ESPN's public NBA endpoints likewise have no verified contractual rights for storage and commercial reuse in this project. Identify and contract a suitably licensed provider, retain contractual scope and retention rights, and independently verify source-record IDs and feature availability.

## Independent admission requirements

1. Obtain approved written access/processing/retention/reuse rights for **the exact upstream sources**.
2. Preserve lawful raw source receipts or equivalent provider-signed, exact-game results, with SHA-256, provider ID, UTC publication/availability timestamps and schedule revision mapping.
3. Deterministically reconcile original forecast ESPN ID to the licensed provider's exact game ID; reject ambiguities, postponements or non-identical tipoff without authorised signed correction history.
4. Validate one original pregame prediction digest, independently signed RFC3161 timestamp before tipoff, original input/model cutoffs and immutable readback-verified WORM retention.
5. Obtain independently sourced FINAL including OT, run fail-closed settlement + independent admission, and record evidence references/verified counts.

**Current decision:** None of these six are independently eligible. Do not promote them based on matching final scores or a successful Python/GitHub job.
