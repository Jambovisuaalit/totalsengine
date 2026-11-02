# Retrospective Ridge experiment: reproducibility checkpoint (2026-11-02)

Research-only. **No historical pre-game evidence or profitable market result implied.**

## Source and environment

- Dataset: Kaggle `cviaxmiwnptr/nba-betting-data-october-2007-to-june-2024`; filename `nba_2008-2026.csv`
- Input SHA-256: `729eb2ead85c14affbb81ae9a4c611fee9790b8dd3d1d7824e1ddba14410a8c4`
- Re-run environment observed: numpy 2.3.5; pandas 2.2.3; scikit-learn 1.8.0; scipy 1.17.0. These are environment observations, **not** a tested portable dependency lock.
- Input/source license and record-level historical availability: not independently verified.

## Re-execution

The previously supplied local research package includes:
- `nba_walkforward_research.py`
- `nba_ridge_calibration_experiment.py`

Run inside the same folder:

```sh
python nba_ridge_calibration_experiment.py --input nba_2008-2026.csv --output recheck
```

On the observed local rerun:
- `by_season_calibration.csv` SHA-256 `7d6126713ede7d81d16b3da453b63253fd3b7b6e7a727903708f016eae9a3e03` (identical)
- `calibration_report.json` SHA-256 `a00d89aa218c4535ba967814c3409bc06903e2c051ab12566a568f2026a42d46` (identical)
- `predictions_RETROSPECTIVE_CALIBRATION.csv` differed only at last printed floating-point digits in observed examples, so byte identity is not guaranteed across environments.
- 8,919 simulated forecast rows; calibrated Ridge overall MAE 14.9007, RMSE 18.8163. This result must not be described as a live or pre-recorded prediction cohort.

## Go/no-go

- Retro experiment can be used for candidate research; no market edge claim.
- Independent timestamp and WORM archival checks in prospective pipeline are separate.
- Do not count the 8,919 retrospective rows toward the prospective 100-case cohort.
- Prospective evidence admitted: **0**. Live inference automation: **not deployed**.
- `HALTED=1`, `PUBLICATION_ALLOWED=false`, `NO_GO`.
