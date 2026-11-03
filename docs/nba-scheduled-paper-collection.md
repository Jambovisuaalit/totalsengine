> Scope: **DATED SNAPSHOT / historical observation**. Counts, execution status and deployment observations apply only to the stated snapshot.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# Automated NBA paper-forecast collection (no AWS)

## Active configuration
- Workflow: `.github/workflows/nba-forward-collection.yml` **on `main`**, the GitHub Actions schedule-eligible default branch.
- Scheduled daily at **16:15 UTC** (cron `15 16 * * *`).
- Uses the read-only collector on `research/nba-v2-external-evidence-integration`.
- Existing GitHub Actions are sufficient; **no AWS account, AWS key, or separate paid service**.
- Each run fetches ESPN NBA scoreboards for the previous 35 days through 2 days ahead; only prior completed games at least 48 hours old are features.
- For each scheduled game 2–36 hours ahead, compute a rolling total-point baseline from each team's latest 3–10 recorded completed games.
- Output: `predictions.jsonl`, exact source scoreboard snapshots and `manifest.json` with SHA-256 digests.
- Persist as GitHub Actions artifact `nba-paper-<run-id>`, with **30-day retention**.
- A missing day, malformed source, or API failure makes the whole run fail: no synthetic substitutes.

## Limitations and safety
- This is a baseline, not the calibrated Ridge model. Its raw feature source is **ESPN**, not the Kaggle historical CSV.
- Repo `Jambovisuaalit/totalsengine` is **PUBLIC**. Actions artifacts on a public repo are not a private forecast vault and expire. Do not treat this as confidential or permanent evidence storage.
- GitHub timestamps are host/service-side audit evidence, **not independently cryptographically verified capture times**. Output records are `evaluation_eligible=false` and `publication_allowed=false`.
- We do not calculate EV or ROI, retrieve bookmaker odds, place bets or call any publisher adapter.
- Source use/redistribution rights and point-in-time data provenance are not independently authenticated. Do not market these forecasts as verified.
- ESPN IDs are stored as `source_game_id`; there is no fabricated canonical cross-source mapping.
- Schedule run may be delayed by GitHub and the collector may skip games without sufficient pregame lead time or complete team history.
- **No successful live scheduled run has been observed at writing time.**
- Target **100 independently verified games** is not advanced by this pipeline alone. This first objective is only real prospective data collection.

## View outputs
1. GitHub repository → Actions → **NBA forward paper forecast — research only**.
2. Open a successful run and download the `nba-paper-...` artifact.
3. Inspect `manifest.json` and `predictions.jsonl`. Hash the original source snapshots to audit the unverified input record.
4. Retain copies outside Actions before the artifact expires, with appropriate rights checks.

## Next implementation
- Independently verified settlement and append-only cohort ledger.
- Pin dependencies and stable code revision for every run; scheduled workflow currently checks out the moving research branch.
- Enable stronger source-time verification if / when necessary, without requiring AWS.
