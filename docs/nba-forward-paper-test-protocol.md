> Scope: **RESEARCH CONTRACT / prototype scope**. Requirements apply to the named component. Old current-state, dependency and deployment observations are superseded.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# NBA forward paper test — research-only protocol

## Target
First prospective cohort: 100 **independently verified** NBA full-game (including OT) forecasts, with zero timestamp, duplicate, or look-ahead violations.

Do not label locally captured records independently verified. Do not treat this target as a claim of current progress.

## Required workflow

1. Before each scheduled tipoff, build a deterministic, versioned feature snapshot and retain its raw input, provenance, SHA-256, and verified source availability timestamps.
2. Use a **genuine** model artifact with a recorded training cutoff. Its training dataset must exclude the future game and any unavailable feature. Generate a total-point forecast, snapshot the model hash, and capture with `capture_prediction`.
3. Immediately submit the captured prediction-file SHA-256 to a **separately approved and trusted RFC 3161 TSA**; save the original signed response, CA/signer chain, query, and verification transcript in durable independent storage. Existing `rfc3161_timestamp.timestamp_digest` is a possible verifier, not a deployed scheduled service. Verification must be repeated during admission.
4. Keep predictions private and append-only. Use durable off-host object retention with write-once controls; local `xb` alone is **not** immutable against a privileged operator.
5. After the game is final, obtain a reliable source score including overtime; archive original result source and map its authoritative game ID to the prediction's canonical game ID. Call `settle_prediction`; never modify the forecast.
6. Independently verify the signature and time, prediction hash, model artifact and training cutoff, feature-source availability, game identity, and result provenance. The local `audit_pair` performs **only** internal link integrity and is NOT admission proof.
7. Build `TotalPredictionRow` only from admitted records and calculate MAE, RMSE and mean error using `evaluate_point_totals`. Include sample size, missing/mismatched observations, per-season/segment breakdown, and a rolling-average benchmark.

## Hard gates

- Exactly one frozen prediction per (game ID, model version) in the **predeclared** evaluation cohort; no cherry-picked outcomes.
- Captured, externally timestamped record **before tipoff** and before result availability.
- Model training ends before the game; feature inputs demonstrably available at the cutoff.
- Authoritative game-ID match and full-game settlement including OT.
- No unverified entries included in independently verified metric reports.
- Research-only: `HALTED=1`, `PUBLICATION_ALLOWED=false`, `NO_GO`.

## Current state

The repository contains local recording/settlement primitives and synthetic regression tests, **not** a running predictor, actual TSA enrollment, immutable remote store, verified inference, or a cohort of 100 games. No historical or prospective genuine MAE/RMSE is established. A Kaggle result dataset is **not** a record of prospective predictions. A local host clock is **not** independent timestamp evidence.

## Market separation

No bookmaker market baseline, EV, CLV, staking, or ROI without genuinely timestamped, rights-cleared, exact-market bookmaker odds.
