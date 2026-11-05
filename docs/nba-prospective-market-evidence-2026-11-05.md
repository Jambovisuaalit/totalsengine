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



## Historical FINAL feature-lineage gate (2026-11-05)

`history_evidence.py` now contains `capture_first_final_source`, `verify_history`, and `verify_history_archive`. The capture function writes the **original ESPN response bytes** to a **versioned S3 COMPLIANCE Object Lock** object when the ingestion process first observes the selected event as `FINAL`. It returns `fetched_at_utc`, `first_final_observed_at_utc`, SHA-256 and `immutable_archive_ref` (bucket/key/version/hash/server LastModified). An external event ledger must persist the *first* receipt and reuse it on subsequent sightings; this helper does not implement a distributed first-observation ledger or guarantee ESPN's actual publication time.

`prepare_bundle(..., history_evidence=...)` is fail-closed: every selected historical ID in `history_source_game_ids` must have a matching original `FINAL` response and hash-bound archive reference. The historical source game must precede feature cutoff by at least 48 hours, and the observation must be no later than feature cutoff. Missing/altered/future evidence blocks bundle preparation. `archive_bundle` reads each historical Object Lock version back, validates original bytes, server LastModified and COMPLIANCE retention, and refuses completion if any source was archived after its corresponding feature cutoff.

Core chronological conditions for each selected historical game and forecast:

```
first_final_observed_at_utc <= fetched_at_utc <= archived_at_server_utc
archived_at_server_utc <= features_as_of_utc
features_as_of_utc <= prediction_created_at_utc < scheduled_start_utc
prediction_created_at_utc < actual_start_utc    # only after authoritative kickoff verification
```

This is **proof of possession at archived server time**, not proof of ESPN's first publication time, upstream licensing, or source authenticity. Unverified provider metadata, event mapping, actual kickoff, feature derivation, and OOS validation remain HOLD. Baseline source adapters must expose genuine `history_source_game_ids` and retain selected original bytes; no reconstruction of the November 3–4 inputs is allowed. Collector activation is not part of this PR. Synthetic CI does not certify a real remote Object Lock write.

## First-FINAL atomic registry

The opt-in `first_final_ledger.register_first_final` creates a **single** fixed key per ESPN event: `nba-history-first-final/<numeric ESPN game ID>/first.json`. The immutable COMPLIANCE object contains the exact original ESPN response as base64 plus its SHA-256, the collector-supplied fetch time and source URL. The winning object version, independently read-back S3 `LastModified`, retention and raw bytes are verified. A `PreconditionFailed` from create-only upload resolves the existing winner instead of replacing it; unrelated storage failures are propagated. This eliminates a *local overwrite* race but does not prove cross-provider publication time or configure production scheduling.

`verify_history_archive` additionally requires the versioned `immutable_first_final_ref`, checks server time is strictly no later than features cutoff, and re-verifies its original response matches the historical source bytes. Source provider licensing, first published timestamp and independently verified kickoff remain unavailable and cannot be inferred.

**Deployment boundary:** No new external provider integration, IAM credentials, bucket or scheduled runner have been configured. Real S3 concurrency, readback, and retention checks must be independently tested before activation. A prospective forecast must be generated from the archived history versions, not re-created retrospectively from the latest scoreboard.

## Real Object Lock acceptance procedure — NOT YET EXECUTED

The opt-in module `nba_totals_research.worm_real_acceptance` uses **only synthetic bytes**. Before execution, confirm a user-owned, cost-approved S3 test bucket with versioning and Object Lock enabled, an approved AWS credential role, and the immutable 2-day test retention. The test attempts a version-specific delete; IAM must allow `s3:DeleteObjectVersion` on the test prefix for the denial to be attributable to COMPLIANCE. If the role lacks that permission, a denied delete does NOT independently prove the retention mechanism; record it as inconclusive.

The test writes a unique synthetic key and cannot remove the winning version during retention. AWS S3 Object Lock protects versions, not key names; a normal unconditioned PutObject can create a *new version*, so application-level `IfNoneMatch="*"` is required for the first-observation ledger.

Execute manually from an authorized environment, **only after explicit exact-bucket approval**. Install `boto3` (and its `botocore` dependency) in the approved Python environment; configure a least-privilege AWS role outside this repository. Do not commit credentials. Confirm the role is intentionally permitted to attempt version deletion in the synthetic test prefix so a denied deletion meaningfully tests retention rather than missing IAM permissions:

```bash
python -m nba_totals_research.worm_real_acceptance \
  --bucket YOUR_APPROVED_TEST_BUCKET \
  --confirm-bucket YOUR_APPROVED_TEST_BUCKET \
  --ack-immutable-write \
  --retention-days 2
```

Collect original JSON stdout, AWS account/role ARN, request IDs / CloudTrail, bucket configuration, version ID, head LastModified, GetObjectRetention and read-back SHA-256. Confirm two concurrent writers yield one CREATED, one CONFLICT, and the winning object remains current. Confirm subsequent conditional PUT is refused. Confirm `DeleteObject(VersionId=...)` is denied and the exact version still reads identical bytes. The result does not prove source authenticity, an NBA model edge, nor real collector activation. Do not attempt to shorten retention or destroy protected versions. Do not change AWS permissions through this PR.
