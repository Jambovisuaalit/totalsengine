# 100 forward paper forecasts — 2026-11-03

## Measurement unit and acceptance

The milestone unit is one **NBA ESPN game ID + baseline model version** (not one API call or duplicate forecast row). The original pregame forecast must precede scheduled tipoff; the Actions archive is host-timestamped only, not independently attested. A historical or synthetic row never qualifies for an externally verified accuracy claim.

The daily settlement now includes `paper_100_cohort` derived from the same deduplicated, identity-checked predictions and final scores used for provisional point-total MAE/RMSE.

Metrics:
- `n_input_forecast_rows`: all validated source forecast rows, including repeated reads of Actions artifacts and Research Ledger.
- `n_unique_game_model_pairs`: first pregame forecast per (game ID, model version).
- `n_duplicate_rows_discarded`: remaining copies.
- `n_final_scored_after_delay`: finished games with correct identity after the six-hour delay.
- `n_pending_result_or_six_hour_delay`: not yet final or still within conservative delay.
- `n_identity_mismatches`: mismatched score/matchup; excluded from metrics.
- `provisional_mae` and `provisional_rmse`: only scored unique games; null if none.
- `n_remaining_to_target`: max(0, 100 - unique game/model pairs).

All rows remain `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`; the verified prospective cohort remains **0/100** until independent source availability, immutable timestamp and data rights are established.

## Observed starting state

Research Ledger has three forecast archives (run IDs 41429108933, 41431069408, 41545696150) with **36 stored rows, 15 unique game/model pairs, 21 duplicates** across the ledger itself. This is not the same numerator as the settlement's `n_input_forecasts`, which may also include same-run Actions artifacts (and therefore has additional duplicates).

On 2026-11-03 at approximately 05:51 UTC, direct read-only ESPN scoreboard lookup for US NBA date 2026-11-02 yielded **13 FINAL** and **2 not-final** records among those 15 game IDs. None yet satisfied the six-hour scheduled-tipoff settlement delay. The prior persisted settlement reported `n_scored=0`, `mae=null`, `rmse=null`. These are time-stamped observations, not a new persisted settlement.

## Daily verification

- Confirm GitHub Actions collection and settlement succeed at 16:15 and 17:45 UTC respectively, although scheduling delays are possible.
- Read `research-ledger/forecasts/{run-id}.json` and `research-ledger/settlements/{run-id}.json`. Check digest, recorded source commit, generated host time, first scheduled tipoff, and zero contradictions.
- Read `report.paper_100_cohort` in the most recent settlement ledger envelope.
- Do **not** claim 100 predictions until 100 separate game/model IDs are actually archived.
- Do **not** claim independently certified MAE/RMSE or betting value from provisional paper metrics.
