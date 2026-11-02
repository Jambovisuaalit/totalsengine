# Automatic NBA forward settlement (GitHub Actions only)

## Workflow

- Scheduled prediction capture: `.github/workflows/nba-forward-collection.yml` on default `main`, cron **16:15 UTC**. Stores `nba-paper-<run-id>` artifacts for 30 days.
- Scheduled final-result reconciliation: `.github/workflows/nba-forward-settlement.yml` on default `main`, cron **17:45 UTC**, with read-only `actions: read` token and no AWS, no new API key.
- Script: `python -m nba_totals_research.forward_settlement --output /tmp/nba-settlement` on the research branch.
- GitHub downloads only nonexpired `nba-paper-...` artifacts and verifies that each originates from a **successful, completed main-branch collection workflow**. The GitHub run must be completed before the game's scheduled tipoff, and the host-generated time must be consistent with run metadata.
- Verifies `manifest.json`, every original scoreboard snapshot SHA-256, all forecast row SHA-256 digests, exact run/artifact ID, and that the predictions are marked research-only.
- Fetches ESPN scoreboards for predicted game dates (including adjacent days for timezone consistency), matches **exact source game ID, teams, and scheduled tipoff**, requires final status and 6-hour post-start buffer, then scores full-game total including overtime.
- Earliest recorded valid forecast per source game/model wins; subsequent duplicates are counted but never scored again.
- Every report writes `report.json`, `scored_rows.jsonl` and exact downloaded outcome sources. Stores a `nba-settlement-<run-id>` Actions artifact (30 days).
- Reports `n_scored`, `n_pending`, `n_identity_mismatches`, `n_duplicates_discarded`, `mae`, `rmse`, `mean_error`.

## Important interpretation

Metrics are **provisional research-only forward results**, not independently certified performance. ESPN licensing/availability, GitHub run metadata and host clock do **not** constitute RFC3161 attestation. Fields remain `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`. Market prices/EV/ROI are **not** calculated.

When no eligible settled observations exist, MAE/RMSE are `null`, not fabricated zeroes. Network failures or inconsistent archival data fail the job closed.

## Known limits

- Actions artifacts expire after 30 days; this reports a **rolling available-archive window**, **not a lifetime 100-game ledger**.
- Public repository: artifacts should be treated as public-ish; no confidential data.
- A full end-to-end real scheduled execution is not yet verified. GitHub's scheduler can be delayed/disabled; monitor actual Actions runs.
- Collector uses an uncalibrated rolling baseline, **not the experimental calibrated Ridge**.
- Future improvement: append-only long-lived evidence ledger plus verified provider-time provenance, under explicitly approved data rights. Neither is necessary to begin provisional collection.

## View outputs

GitHub → Actions → **NBA forward paper settlement — research only** → run → `nba-settlement-...` artifact → `report.json`. Both workflows are also manually dispatchable in the Actions UI if enabled on the default branch.
