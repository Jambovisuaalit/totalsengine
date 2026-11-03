> Scope: **DATED SNAPSHOT / historical observation**. Counts, execution status and deployment observations apply only to the stated snapshot.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# NBA paper research ledger — operational verification (2026-11-02)

## Result

Working **without AWS or external accounts**. Real GitHub Actions jobs successfully:
1. Collected 15 NBA point-total forecasts and source snapshots (run [41431069408](https://github.com/Jambovisuaalit/totalsengine/actions/runs/41431069408)).
2. Archived derived forecasts and SHA-256 metadata to persistent Git branch `research-ledger` at `forecasts/41431069408.json`, Git commit `c1e1a2b2bf499f21607e787f19627e19502f9218`.
3. Reconciled forecast artifacts **and** ledger records (run [41431541066](https://github.com/Jambovisuaalit/totalsengine/actions/runs/41431541066)). Output: 60 source records -> **15 unique forecasts**, 45 duplicate records discarded, 0 game-identity mismatches, 15 pending outcomes and 0 scored. `mae=null`, `rmse=null`.
4. Archived the original pre-ledger run [41429108933](https://github.com/Jambovisuaalit/totalsengine/actions/runs/41429108933) as `forecasts/41429108933.json` with `retrospective_import=true`, retaining the distinction between original forecast-run time and later Git ledger commit time.
5. Archived settlement run `41431541066` at `settlements/41431541066.json`, commit `2a0ebb2ce8e449ec385341f1c2b4627af6832d25`.

## Daily schedule

- Collector: `main/.github/workflows/nba-forward-collection.yml`, 16:15 UTC.
- Settlement: `main/.github/workflows/nba-forward-settlement.yml`, 17:45 UTC.
- Both workflows have `contents: write` for create-only ledger records. Settlement also has `actions: read`.
- Each writes a GitHub Actions artifact (30-day retention) *and* a derived research record to Git branch `research-ledger`.
- Ledger archive code: `nba_totals_research/research_ledger.py`. It uses GitHub Contents API create-only semantics. Re-runs may confirm exact matching content; conflicting existing bytes fail closed.
- Existing verified artifacts are backfilled automatically into long-term branch; import time is never misrepresented as prediction time.

## Limitations

- Repository and ledger branch are **public**. Only **derived research forecast and settlement metadata** is committed; raw ESPN source responses stay in temporary Actions artifacts. **This is not private storage**.
- A Git branch is retained until deleted or rewritten. It is **not immutable WORM**, not a cryptographic external TSA, and not a guaranteed backup against administrator deletion. For a stronger retention guarantee, branch protection and independent backup would be needed.
- ESPN source licensing and real source publication timestamps remain unverified. Forecast research metrics are provisional.
- Reports currently recompute all available forecast-source game results; as the historical cohort grows, introduce an incremental settlement cache to cap external requests.
- Runs may be delayed by GitHub's scheduler. There is no guarantee a game will have a valid pre-tipoff forecast.
- MAE and RMSE are `null` until a genuine finalized matching game is observed.
- The 100 independently verified game trial remains at **0/100**, `HALTED=1`, `PUBLICATION_ALLOWED=false`, `NO_GO`.
