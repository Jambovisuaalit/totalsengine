# NBA forward research — AWS-free deployment and provenance (2026-11-03)

## Production architecture
- Every day at **16:15 UTC**, GitHub Actions collects live ESPN NBA scoreboard snapshots and calculates deterministic rolling point-total paper forecasts, if enough historical games exist and the scheduled tipoff is 2–36 hours away. Zero predictions is a valid result.
- Predictions, SHA-256 source snapshot hashes, model version and generated-at host time are stored with the action's `GITHUB_SHA` in a manifest. A source hash is not an independently verifiable original source receipt after raw bytes are discarded. **New** collector artifacts intentionally contain only forecast records, manifest metadata and SHA-256 digests, not ESPN raw responses. Historical previously retained Actions artifacts can still contain raw ESPN responses and require a separate retention/remediation review; the long-term `research-ledger` contains only derived records and digests.
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


## Research-only FreeTSA capture added on PR #26 (2026-11-03)

**Revised AWS-free proof transport:** Existing NBA forward collector still uses ESPN-derived research observations with **unresolved commercial/source and temporal availability rights**. Do not attribute licensing, WORM immutability, source-availability verification, official settlement, ROI or publication to this workflow.

1. After the collector has produced `predictions.jsonl` and `manifest.json`, `nba_totals_research.research_tsa_bundle` checks original record hashes, forecast timing, exact SHA-256 of the **unaltered JSONL bytes** and row count before invoking any TSA.
2. On **nonempty** prospective forecast cohorts it fetches the pinned FreeTSA CA and signer certificates, submits the exact JSONL digest to `https://freetsa.org/tsr`, executes `openssl ts -verify`, and demands signed `genTime` at or after this capture's host time but before the earliest scheduled tipoff. Any missing/late/invalid token fails the workflow without ledger persistence. Zero forecasts cause zero timestamp requests.
3. The receipt binds exact request.tsq and response.tsr bytes (base64), their hashes, signed time, certificate pins and original JSONL digest, stored beside the derived forecast. It never archives ESPN raw source responses.
4. `research_ledger.archive_forecast` requires this receipt before recording any **new** nonempty forecast run on the **create-only research-ledger** branch. It stores `original_predictions_jsonl_base64` and `rfc3161_receipt` with the original rows. Past records and imported backfills remain unverified legacy observations rather than being retroactively stamped.
5. `nba_totals_research.research_tsa_verify` can independently download the ledger envelope and re-run OpenSSL against the pinned trust chain. The collector and archive always retain `evaluation_eligible=false`, `publication_allowed=false` and `NO_GO`; signed timestamp is a **partial research provenance attribute**, not blanket independent evaluation eligibility.

**Non-goals and warnings:** GitHub files, refs and Actions artifacts are changeable/deletable by sufficiently privileged parties; create-only REST writes are policy-level controls **not WORM**. FreeTSA timestamps establish that specified forecast bytes existed by the TSA's time, not that the preceding ESPN historical-source bytes were lawful, published before the cutoff, unmodified or independently validated. Signed proof bytes are stored in the public research-ledger and contain only derived forecasting data, no provider raw data or API secrets. The authorized-data-rights review and source scheduling remain separate blockers.

**Execution status:** Changes are confined to draft PR #26; not on the live `main` collector unless separately merged following CI, source handling and release review. Historical verified cohort remains **0/100**.
