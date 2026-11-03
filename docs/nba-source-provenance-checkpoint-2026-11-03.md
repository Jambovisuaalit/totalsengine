# NBA forward pipeline — provenance checkpoint (2026-11-03)

## Scope delivered

- Scheduled research collector and settlement now check out the exact GitHub Actions triggering revision on `main` rather than a separately moving research branch.
- Both refuse execution if `git rev-parse HEAD` differs from `GITHUB_SHA`, or the event is not on `main`.
- Safety flags remain `HALTED=1` and `PUBLICATION_ALLOWED=false`.
- Regression coverage: `python -m unittest tests_nba_totals.test_workflow_source_identity`.

## Existing components (not newly validated)

- `api/nba/game.ts` fetches BALLDONTLIE fixtures via server-side API key. A configured key alone does not prove upstream rights, game identity mapping, or a production request succeeded.
- The research collector captures real ESPN scoreboard snapshots, a rolling-baseline forecast, source SHA-256 hashes and an Actions-host timestamp.
- The settlement job matches ESPN game IDs, scores and scheduled tipoff, records duplicates and provisional MAE/RMSE only for finished games.
- The research-ledger branch is a public Git ledger, **not** WORM retention or an independent timestamp authority.

## Next gates (still blocked)

| Gate | Proof to accept | Current decision |
| --- | --- | --- |
| Source data | Rights/license terms for ESPN/BALLDONTLIE, independent source publication timestamp, actual fetched fixture/score receipt | HOLD |
| Canonical game join | Evidence-bound ESPN ↔ BALLDONTLIE game-ID mapping, exact home/away and scheduled tipoff, independent reviewer | HOLD |
| Pregame prediction | Original prediction/model SHA, immutable pre-tipoff capture, independent RFC3161/equivalent proof and verifiable feature cutoff | HOLD |
| Outcome | Final score linked to the same canonical game, auditable source receipt and time | HOLD |
| Accuracy | MAE/RMSE only for independent eligible matched forecast/outcome pairs; report n and missing/duplicate counts | HOLD |
| Market | Licensed timestamped lines and independent matching, separately from point accuracy | HOLD |

`evaluation_eligible=false`, independently verified cohort `0/100`, `NO_GO` and no market ROI / EV / betting recommendations remain unchanged. Local regression tests and GitHub CI are not evidence of independently authorized game data or pre-tipoff provenance.

## Operational check

After merge, confirm the next real collector and settlement Actions runs report the SHA from `main` and that outputs are published **only** to the research ledger. Do not declare gates passed from synthetic tests or timestamps supplied by the runner host.
