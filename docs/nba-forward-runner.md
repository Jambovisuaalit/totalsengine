# Forward paper-test runner — configuration and status

## What exists

`python -m nba_totals_research.forward_pipeline` performs an actual deterministic
rolling-NBA-total baseline inference from historical completed games (not random
or invented forecasts). It captures the output before tipoff; requests/verifies
a trusted RFC 3161 timestamp; then uploads the prediction, original historical
CSV, TSA query/response and audit file to an S3 bucket with **Object Lock
COMPLIANCE** retention. Reads the stored object back to verify exact SHA-256.
Any failed dependency aborts and cannot claim eligibility.

This is **research-only**. `evaluation_eligible=false` remains false even
after a technically successful timestamp/archive, because dates alone do not
prove upstream feature publication time or an independently verified mapping.

## One-time requirements

- Python 3.12+, cryptography (repository tests), `boto3`, OpenSSL CLI.
- Historical dataset on runner disk with documented permission to use and
  archive the exact file; confirm terms before S3 upload.
- Canonical game identity and schedule/start time independently verified.
- Approved independent TSA endpoint and explicitly vetted, pinned CA bundle.
- S3 bucket created **with Object Lock enabled and versioning**, adequate IAM
  permissions for PutObject, GetObject, GetObjectRetention; retention policy
  allowing COMPLIANCE for at least 30 days.
- Protected runtime with UTC synchronization and immutable monitoring.
- No betting or publishing credentials.

## Run (illustrative configuration only)

```bash
python -m pip install boto3
export HALTED=1 PUBLICATION_ALLOWED=false
python -m nba_totals_research.forward_pipeline \
  --data-csv /protected/nba_2008-2026.csv \
  --workdir /private/nba-capture \
  --game-id VERIFIED_CANONICAL_GAME_ID \
  --away VERIFIED_AWAY_CODE --home VERIFIED_HOME_CODE \
  --tipoff 2026-11-05T00:00:00+00:00 \
  --feature-cutoff 2026-11-04T22:55:00+00:00 \
  --rights-reviewed --schedule-reviewed \
  --tsa-url https://APPROVED-TSA-ENDPOINT \
  --tsa-ca /protected/pinned-tsa-ca.pem \
  --bucket CONFIGURED_COMPLIANCE_OBJECT_LOCK_BUCKET \
  --retention-days 365
```

**Replace all example values with independently verified values.** CLI flags
are operator assertions, not cryptographic provenance. Dates above are an
illustrative command, not a verified NBA scheduled game.

## Existing blockers

1. No approved TSA URL / pinned CA configured, and legacy TSA workflow has
   failed in observed runs.
2. No access to a verified S3 Object Lock bucket or runner AWS credentials.
3. No independent scheduled-game ID mapping / tipoff source wired to runner.
4. Historical CSV has date-only scores. Source result publication timestamps
   and rights confirmation are not independently verifiable from the CSV.
5. No scheduled job or deployed inference service. Invoke manually only until
   gates can be independently checked.
6. Baseline is simple rolling-total regression, not a validated trained ML
   artifact. No market EV or ROI claims.

## Success classifications

- `CAPTURED_ARCHIVED_TIMESTAMPED_RESEARCH_ONLY`: valid local inference,
  actual RFC 3161 verification, signed generation time before tipoff, confirmed
  S3 COMPLIANCE retention, preserved raw bytes. **Still not evaluation-eligible.**
- `NO_GO`: any invalid or missing dependency, failed signature, wrong timing,
  archive lock unavailable, data rights not authorized or score source not
  verified. Do not automatically retry with synthetic evidence.

## Acceptance target

100 prospective independently verified game predictions; no duplicates,
look-ahead incidents, signature failures, or timestamp violations. Only
admitted and settled predictions qualify for MAE/RMSE. A full admission
verifier using the actual S3 version, TSA token, canonical game mapping,
feature-source availability and score evidence is still needed.

Existing `tests_nba_totals/test_forward_pipeline.py` use synthetic data and
fake S3 only. They do not verify deployed cloud infrastructure.
