# Ridge calibration / prospective evidence status — 2026-11-02

## Retrospective experiment (NOT pre-recorded live forecasts)

Source CSV SHA-256: `729eb2ead85c14affbb81ae9a4c611fee9790b8dd3d1d7824e1ddba14410a8c4`.
8,919 NBA games across test seasons 2020–2026. Training uses only earlier seasons. Same-day game outcomes are not used until the full day's feature construction has finished.

Added team historical total standard deviation (5/10), recent scoring trend (5 vs 10), and home/away-specific totals average (last 5 at venue). A seasonal correction subtracts **the immediately preceding test season's observed Ridge residual mean**, never the target test season's own residual.

| Experiment | MAE | RMSE | Bias |
|---|---:|---:|---:|
| Original Ridge | 14.9483 | 18.8675 | +1.4280 |
| Extended Ridge | 14.9338 | 18.8536 | +1.3973 |
| Extended + previous-season calibration | 14.9007 | 18.8163 | -0.0198 |
| CSV `total` (untimed, non-executable) | 14.3376 | 18.0896 | -0.4461 |

Research-only delta: +0.0476 MAE improvement vs original Ridge. Exploratory bootstrap of game-date blocks (2,000 resamples) estimated 95% CI improvement +0.0081 to +0.0874; **not** adjusted for experiment selection. Season 2025 worsened by 0.1058 MAE points. Data release times, licensing and historical market line timestamps remain unverified. No claim of betting edge.

Experimental script, full output and per-season files are in the separately delivered local research package. They are **not** committed to this repository by this documentation change.

## Forward paper test

Local preflight confirmed source CSV SHA-256 and OpenSSL; **BLOCKED** on independent source rights, schedule/game mapping, current-season point-in-time features, model artifact, approved TSA/CA, S3 Object Lock COMPLIANCE credentials and bucket, scheduling, and original final-game settlement provenance.

The existing `nba_totals_research/forward_pipeline.py` implements a one-shot rolling-total baseline inference, RFC3161 validation and locked S3 storage **as code**; no successful real live TSA + Object Lock chain was verified in this investigation.

**Do not mark a forecast admitted merely because it has a host timestamp or a signed TSA response.** Re-verify original signed token, its time and imprint, archived S3 version and hash, game ID, feature-source availability and source rights independently. Only those externally admitted records qualify for prospective MAE/RMSE.

Target: first single independently verified prediction → settlement chain, then 100 forward cases with zero evidence/lookahead violations.

Status: `HALTED=1`, `PUBLICATION_ALLOWED=false`, `NO_GO`.
