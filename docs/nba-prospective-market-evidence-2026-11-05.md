# Prospective prediction and quote evidence bundle

This draft adds `nba_totals_research.prospective_market_bundle` beside the existing research collector. It is **not wired into the scheduled workflow**. The current collector attests forecasts only and does not collect bookmaker odds. Publication and evaluation remain disabled.

## Historical recovery (2026-11-05)

Original GitHub Actions run [41919795738](https://github.com/Jambovisuaalit/totalsengine/actions/runs/41919795738) completed collection on 2026-11-04. Artifact 13365429605 ZIP SHA-256: `b82c67f67a687cc5c032d2d34fd83ec6176be3d7c12d045f58cb618414834c6c`. Exact prediction JSONL SHA-256: `0483d2ebdcc4ba65f6a4d30667293784bce116004a511bb404068af86cf6d629`. External RFC3161 genTime: 2026-11-04T21:50:36Z. Original bytes match the research-ledger commit `a185cf927aa18cbf28fc09fdad4fed49698ab6ce`, path `forecasts/41919795738.json`.

The 16-row run contains DAL@SA 227.1, LAL@SAC 229.3, MIA@LAC 232.7944. Preserve all runs and revisions; do not choose a forecast using outcomes. An earlier 14-row run is also present in `docs/evidence/nba-forward-original-2026-11-03`; its original JSONL digest and RFC3161 signature were rechecked independently during recovery. These are original rolling-team baseline computations, not reconstructed pregame predictions or trained proprietary model weights. Exact model source is pinned by runner commit for the Actions run. Raw provider responses and point-in-time feature availability remain unresolved.

## Capture interface

`prepare_bundle(event=..., predictions=..., quotes=..., blobs=..., now=...)` freezes original artifact bytes, normalized records and a content-addressed manifest. Required blobs: model (a baseline specification is acceptable only when identified as such), training_manifest, features, event_state_raw, mapping, plus each source artifact referenced by prediction/quote records. Do not invent trained weights or a training run for a deterministic baseline.

Event metadata: game_id, scheduled_start_utc, actual_start_utc=null, state=PRE_GAME, state_observed_at_utc and raw_retention_approved. Prediction metadata includes original prediction_created_at_utc, features_as_of_utc, model_sha256, source_url, source_record_id, raw_artifact_key, raw_sha256, exact period/market/selection/line and p_win/p_push/p_loss. Quote metadata includes original fetched_at_utc, bookmaker_last_update_utc, market_last_update_utc, decimal_odds and the same source/artifact and market identity fields. Missing original values are rejected, never backfilled from a later run.

Default maximum quote/state age is 120 seconds, configurable only within 1..300 seconds. This is a capture policy, not evidence of executability. The provider adapter must validate normalized fields against the actual raw response, source identity, cross-provider game mapping, atomic quote response, settlement rules and approved use/retention rights. The module binds bytes; it cannot certify the truth of caller-supplied semantics.

`archive_bundle(...)` uses existing cryptographic RFC3161 and S3 COMPLIANCE Object Lock adapters. Manifest digest is attested; all artifact bytes, TSA request/reply and audit are archived under versioned object references. Each upload is verified by byte read-back, retention mode and server LastModified. Completion is written last and server time checked. Partial failure cannot return a successful completion. A locally prepared hash is never WORM evidence.

Actual kickoff is not known prospectively: capture is conservatively closed at the published schedule, while final admission stays pending until an authenticated actual-start/state source proves every signed/server timestamp precedes actual start. A live or already-started event is rejected. An event that started early cannot become eligible merely because capture preceded the schedule.

## Activation requirements

An approved odds adapter/feed, retained original response timestamps, authenticated event-state/mapping evidence, verified model/training/feature provenance, pinned TSA trust material and an existing configured Object Lock destination are required. No such destination or feed is configured by this change. Do not create security access or paid integrations implicitly. Wire the collector only after those inputs exist, then perform a real future-event smoke capture and verify version-specific retention and all hashes. A later results-only verifier must resolve actual kickoff and OOS provenance before evaluation admission.

## Validation

21 local unittest checks cover stale/update/fetch ordering, capture after start, feature leakage, hash/model changes, duplicate selections, integer push mass, unsafe artifact paths, upload failure, wrong TSA digest, late server receipts and completion-last behavior. Remote archive lifecycle tests use explicitly synthetic adapters. Original historical RFC3161 tokens were independently verified with OpenSSL and pinned certificate hashes. No production Object Lock capture, full CI, new live-market collection or +EV computation is claimed.

