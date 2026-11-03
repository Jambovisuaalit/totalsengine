# TotalsEngine — canonical delivery gates (2026-11-03)

**Authority:** This file is the current decision register for NBA research and release readiness. Historic Doctore AI audits (including `docs/CURRENT_STATE_AUDIT.md`) are legacy context, **not** TotalsEngine deployment or commercial proof. This document supersedes conflicting status claims, but does not override source rights or technical evidence requirements.

## Scope and current source of truth

- Code base: React/Vite frontend, legacy Doctore modules, independent Python `nba_totals_research/` (not a live inference API).
- Research: 8,919-match Ridge calibration comparison is **retrospective only** (reported MAE 14.9007; comparison CSV totals 14.3376); the CSV line is not an authenticated contemporaneous quote.
- Forward paper: GitHub-host timestamped baseline forecasts and provisional settlements exist. Research ledger's 15 unique game/model pairs (as documented 2026-11-03) **do not** qualify for independent evaluation.
- Verified prospective cohort: **0/100**; `evaluation_eligible=false`, `publication_allowed=false`, `NO_GO`.
- Product / Telegram: interface/demo and Telegram send test are not a fully verified production signal pipeline.
- All five findings mentioned in the cross-reference code review are to be individually reconciled with their original evidence; the summary alone does not identify exact files or prove fixes.

## Delivery A — code and documentation alignment

1. Retain this document as the canonical CURRENT state and refer to historic audits as legacy.
2. Map each review finding to a source file, reproducer, severity, patch, regression test, CI run, and final SHA before closing it.
3. **Rights-retention contradiction (P0):** `docs/espn-source-rights-review.md` allows no raw ESPN retention past the isolated process; the scheduled collector writes `source_snapshots/*.json`, and `.github/workflows/nba-forward-collection.yml` uploads them for 30 days. This is a *documented contradiction*, not approved rights. New branch patch removes writing raw ESPN source snapshots into future Actions outputs and settlement outputs; historical Actions archives remain a separate retention-review item. Freeze raw-data archival until explicit counsel/provider clearance. A successful GitHub job does not constitute permission.
4. Maintain `HALTED=1` and `PUBLICATION_ALLOWED=false`. Do not rename the retrospective or provisional paper-study outputs as verified forecasts.
5. Keep model performance, source licensing, market odds, website deployment, and Telegram delivery as separate acceptance gates.

**Acceptance:** CI green on an exact branch SHA; P0 issues closed with regression evidence; rights/retention policy reconciled and implemented; no false prospective/ROI claims. **Current: BLOCKED**.

## Delivery B — first externally verifiable NBA forecast → result

1. Choose an *upcoming real* NBA game whose identity, home/away, UTC tipoff and schedule changes are independently verified. Freeze its canonical mapping before prediction.
2. Obtain a documented right to access/use/retain the source data and archive source availability evidence. Existing public ESPN endpoint access is NOT a licence.
3. Freeze a baseline model spec, complete source snapshot hash, pregame feature cutoff and generated prediction bytes. Enforce timezone-aware UTC and cutoff < generation < tipoff.
4. Submit exact prediction digest to approved RFC 3161 TSA; independently validate reply signature, chain and signed `genTime` **before tipoff**.
5. Archive original prediction, source evidence, signed timestamp request/response, model spec, and completion manifest in independently verified S3 Object Lock COMPLIANCE versions; verify readback bytes, VersionId and retention. A GitHub artifact or branch is NOT WORM.
6. After true FINAL, obtain an independently supportable exact-game score (including overtime), retain authorised result provenance, and join without replacing the frozen forecast.
7. Run an independent admission verifier on rights, source time, tipoff, timestamp signature, storage and identities. Only then count **1/1**; later aim for 100.

**Blocking now:** approved source usage and storage rights, independent schedule/provenance, approved TSA roots, configured WORM archive and live end-to-end run. Existing `forward_pipeline.py` deliberately returns `evaluation_eligible=false` even if TSA and S3 succeed, because upstream source availability is unverified. Never change this to true merely to reach a KPI.

**Acceptance:** 1 real game, one original pre-tipoff prediction, verified independent time and immutable source/prediction chain, independently checked FINAL outcome, independent verifier PASS; only then advance from 0/100. **Current: BLOCKED**.

## Operating rules

- Research exports: `PROVISIONAL_FORWARD_PAPER_ONLY`, no market EV, CLV, ROI or bets.
- No source-rights approvals may be inferred from GitHub settings, a synthetic unit test, a public endpoint, or a chat assertion.
- Never assert any external service was configured, exercised or licensed without a verifiable receipt.
- Release decision: **NO_GO** until both delivery gates pass. Follow the exact immutable proof chain rather than the number of green unit tests.

## References

`README.md`; `docs/nba-three-evidence-gates-2026-11-03.md`; `docs/nba-source-provenance-checkpoint-2026-11-03.md`; `docs/nba-aws-free-forward-operational-2026-11-03.md`; `docs/espn-source-rights-review.md`; `docs/nba-forward-paper-test-protocol.md`; `nba_totals_research/forward_pipeline.py`.

## Verification update (PR #26)

The failed TSA workflow run 41591119203 was a `push` event on a `workflow_dispatch`-only workflow and contained **zero jobs**; it did not exercise an external RFC3161 TSA, so the failure should not be called a failed TSA cryptographic verification. The branch moves the `runner.temp` reference from job-level to step-level environment, pending workflow registration validation and a deliberately dispatched, authorised test. Source retention patch prevents new collector/settlement output directories from containing raw ESPN snapshots. Until CI and real external receipts are confirmed, the verified count remains 0/100.


## November 3, 2026: external synthetic TSA and rights checkpoint

- A **real FreeTSA RFC 3161 request** was executed from an isolated Vercel Sandbox against a **synthetic** SHA-256 test input; the pinned CA and signer certificate checks passed. The remote timestamp token's signed time was `2026-11-03T09:06:25Z`, SHA-256 `03082ca35ba949ef4b37405b1155762ce2b316391f233b64e0dd04f5cadf8f7d`, 4643 bytes; OpenSSL signature, chain and message imprint verified. Full synthetic request/response bytes and audit are recorded in `docs/evidence/rfc3161-synthetic-verification-2026-11-03.json` for independent re-verification.
- This is **TSA_INFRA_SYNTHETIC_PASS** only. It is **NOT** a true pregame NBA forecast, not a qualified EU trusted timestamp assertion, not signed data-source availability, and not WORM storage.
- BALLDONTLIE published ToS page currently says **Last Updated: August 4, 2026**, not October 20. §6 permits broad lawful commercial use, **but prohibits competing services and unmodified original-data resale**; §11 does not clear third-party rights. The BDL terms cannot validate legacy ESPN source rights. Account-specific terms and third-party clearance remain pending.
- **WORM_S3_TEST_NOT_RUN**: no authenticated AWS Object Lock bucket, retention, VersionId and readback evidence was verified in this execution. No COMPLIANCE-mode uploads should be attempted until test-bucket ownership, retention and cost are confirmed.
- **NBA_FORWARD_0/100**, `evaluation_eligible=false`, `publication_allowed=false`, `NO_GO`. PR #26 remains draft; no production rollout.
