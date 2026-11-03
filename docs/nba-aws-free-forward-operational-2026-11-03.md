> Scope: **DATED SNAPSHOT / historical observation**. Counts, execution status and deployment observations apply only to the stated snapshot.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# NBA forward research — AWS-free deployment and provenance (2026-11-03)

## Production architecture
- Every day at **16:15 UTC**, GitHub Actions collects live ESPN NBA scoreboard snapshots and calculates deterministic rolling point-total paper forecasts, if enough historical games exist and the scheduled tipoff is 2–36 hours away. Zero predictions is a valid result.
- Predictions, SHA-256 source snapshot hashes, model version and generated-at host time are stored with the action's `GITHUB_SHA` in a manifest. Original source snapshots are held temporarily as **30-day GitHub Actions artifacts**; the long-term `research-ledger` contains only derived records and digests.
- The collector and settlement Actions now check out the triggering **main** SHA, not a mutable research branch (PR #21).
- The collector rejects any manifest whose `runner_commit_sha` differs from the invoking `GITHUB_SHA`; the create-only ledger persists that SHA and refuses inconsistent host-run provenance.
- Every day at **17:45 UTC**, settlement reads the forward forecasts (artifact and ledger) and retrieves ESPN final scores. It joins on ESPN game ID, exact home and away teams, scheduled UTC tipoff and model version, deduplicates, and applies a six-hour post-tipoff finalization delay. Origin code SHA is compared to the original GitHub run when available.
- Reports mark any MAE/RMSE **PROVISIONAL_FORWARD_PAPER_ONLY**, preserve denominators and unmatched/duplicate counts, and expose no odds, EV, ROI or betting recommendations.

## Acceptance gates — strictly distinct

**Research transport:** A completed green collector and settlement run, persisted forecast envelopes, and actual predicted-vs-final rows. This is measurable but **not independently verified**.

**Independent prospective provenance:** Upstream publication time and authorized data rights; independent RFC3161 or equivalent time attestation plus immutable retention; independent schedule mapping; feature cutoff; original prediction and model artifacts; independently supported settlement. Without these, verified cohort stays **0/100** and `evaluation_eligible=false`.

## Operator checks
1. Confirm latest schedule collector Actions run uses main SHA, succeeds, and prints `n_forecasts`; no forecasts must be invented.
2. Inspect `research-ledger/forecasts/<run-id>.json` for `runner_commit_sha`, `generated_at_host_utc`, `source_snapshot_hashes`, `rows[].record_sha256` and `gate_status=NO_GO`.
3. Confirm first successful settlement run after the earliest game becomes final. Inspect `research-ledger/settlements/<run-id>.json` and report `n_scored`, `n_pending`, `n_duplicates_discarded`, `n_identity_mismatches`, provisional `mae` and `rmse` (nullable).
4. Confirm failed source requests, ambiguous game IDs, inconsistent Git SHA, late predictions and missing final scores never create an eligible record.

## Hard limits
- GitHub is **not** an immutable WORM archive, independent TSA or guarantee of pre-tipoff public availability; commits and admin permissions are mutable.
- ESPN right to access an endpoint does not itself confer redistribution/commercial rights. Do not publish raw data or claim licensed data.
- A paper forecast is an actual generated output, not a betting recommendation. No accuracy, ROI, or probabilistic edge claims should be published until the relevant evidence gates have passed.
