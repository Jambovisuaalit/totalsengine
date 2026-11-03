# NBA provider rights and identity gate — 2026-11-03

Scope: NBA game totals; prospectively frozen pregame forecasts, authenticated source access and schedules, postgame FINAL including overtime, auditable records. **Research only until a separate independent admission verifier passes.** This document does not itself purchase a licence, perform a provider API call, or grant third-party rights.

## Decision

**Preferred low-cost integration candidate: BALLDONTLIE NBA Games API.** Its publicly visible Terms of Service dated 2026-08-04 (§6) grant broad rights for lawful commercial data use, copying, caching, storage, archiving, model development and derived products, but §6 ALSO prohibits using the Data to create/operate services competing with BALLDONTLIE and resale in original unmodified form. The introductory permission summary differs on competing products, so the operative §6 prohibition should control until clarified in writing. However section 11 disclaims clearance of third-party rights, and sections 8-9 explicitly do not warrant source provenance, accuracy, or timeliness. Section 2 says not to use BDL as the sole source for wager grading/settlement without independent verification. These are not equivalent to an independently verified official feed.

- Terms: https://www.balldontlie.io/terms.html (last updated 2026-08-04; review exact snapshot and account-specific agreement before production)
- NBA API: https://docs.balldontlie.io/ ; `GET /v1/games` and `GET /v1/games/{id}` return BDL game ID, status, date/datetime, home/away team identities, scores, overtime information.
- Pricing observed 2026-11-03: Free $0 / 5 req per min; All-Star $9.99 per month / 60 req per min; GOAT $39.99 per month / 600 req per min. Games endpoint included in Free. https://nba.balldontlie.io/
- Access requires a user's provider API key; **no authenticated live NBA fetch was performed** in this decision document.

## Secondary candidates

**Sportradar:** NBA Daily Schedule and Daily Change Log provide unique IDs, scheduled times and update timestamps. Stronger candidate for change-traceable second-source schedule/result comparison. Commercial processing, retention and downstream use MUST be confirmed contractually. Docs: https://developer.sportradar.com/basketball/reference/nba-daily-change-log and https://developer.sportradar.com/basketball/docs/nba-ig-schedules .

**SportsDataIO:** documents verified FINAL scores with OT and commercial client-specific licensing, distinct from personal-use Discovery Lab. Obtain a written quote and explicit data-retention permissions if selected. https://sportsdata.io/help/data-rights-and-licensing-questions and https://sportsdata.io/developers/coverages/nba .

## Required approval matrix (no inferred PASS)

| Gate | Requirement | Current disposition |
|---|---|---|
| Provider contractual scope | Confirm exact plan terms, commercial model evaluation/display, caching, retention/WORM and termination rights; third-party rights reviewed | TERMS_PERMISSIVE_BUT_NOT_FULLY_CLEARED |
| Access | Authenticated provider API HTTP 200, host UTC receipt, original response digest | PASS_FOR_HOST_RETRIEVAL_ONLY (2026-11-03; raw discarded) |
| Exact game identity | BDL ID, original ESPN ID, UTC scheduled tipoff, teams and game status; reschedule history | SIX_EXACT_STRUCTURAL_MATCHES; independent mapping and schedule history not verified |
| Independent upstream timing | Signed provider publication/availability timestamps or independently accepted provenance | NOT_VERIFIED |
| Outcome | Genuine FINAL score including OT, lawful source receipt and independent result-source corroboration | NOT_VERIFIED |
| Prediction evidence | Pre-tipoff original prediction/model/input hashes, RFC3161 signed reply verification, WORM version and retention/readback | NOT_VERIFIED |
| Eligibility | Independent verifier attests all gates; no cherry-picking | NO_GO: 0/100 |

## Next implementation sequence

1. Collect and archive the exact BDL Terms snapshot/relevant account contract for counsel review, including third-party rights and the intended paid analytics use. Avoid silently asserting rights in legacy ESPN data.
2. Use a provider API key only via a secret store (never a frontend/public Git commit); perform a read-only call for 2026-11-02 and one *future* game. Store only permitted receipts, each with SHA-256 and retrieval timestamp.
3. Strictly match original ESPN 401909907-401909921 to BDL IDs, requiring home/away, exact scheduled UTC kickoff, and event reschedule audit. Do not invent BDL IDs. If mismatch, keep unmapped.
4. Repeat for one future NBA game; freeze prediction bytes before tipoff. An independent signed timestamp and locked archive must be proven in a separate service, not inferred from GitHub timestamps.
5. Settle when genuinely FINAL, independently validate upstream result and all original rights/provenance, and only then increment the externally verified cohort.

## Explicit constraints

- A compliant BALLDONTLIE subscription alone cannot retroactively prove that existing ESPN historical inputs were licensed, originally available at forecast cutoff, or independently timestamped.
- New API records collected *after* a game cannot establish historical provider publication time or the original pregame feature availability.
- No EV, ROI, wagering publication or “verified” MAE from the six manually matched rows until the independent admission gate passes.
- Keep `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO` until all independent evidence exists.

## Live reconciliation addendum — 2026-11-03

After this original decision was authored, an authenticated BALLDONTLIE HTTP 200 response for games on 2026-11-02 was fetched via a tightly branch-limited Vercel Preview Function. All 6 requested games matched exactly on team identities, date and scheduled UTC tipoff. Details, exact IDs and response digest are at `docs/nba-bdl-six-game-authenticated-receipt-2026-11-03.md`. The raw HTTP response was **not** archived. The temporary function was removed before the PR's last recorded passing CI. This is real live API evidence at the time of retrieval; it is not an independent pregame availability or rights certificate.

### Formal gate decisions, distinct from generic provider terms

- **BDL data processing rights (provider permission):** Terms updated 2026-08-04, section 6 expressly permits lawful commercial use, storage, archiving, model training/evaluation/backtesting and resulting applications, including lawful wagering-related products. Confirm any account-specific agreement and intended implementation. Source: https://www.balldontlie.io/terms.html .
- **Third-party clearance:** NOT VERIFIED. BDL section 11 disclaims clearing third-party rights and section 8 disclaims authenticity and reliability. The provider's broad permission alone does not certify all NBA/ESPN-derived upstream data rights.
- **Historic ESPN input:** NOT VERIFIED. Retrospective BDL game matches do not authorise the original ESPN history used in the model, nor prove its upstream publication time at prediction cutoff.
- **Production archival:** NOT VERIFIED. Current Vercel env-name listing shows `BALLDONTLIE_API_KEY`, not AWS/S3 or TSA config; absence in Vercel is not evidence of absence outside Vercel. No live signed timestamp, S3 Object Lock COMPLIANCE version/retention/readback was submitted to independent review.
- **Independent forward observation:** BLOCKED. Do not set `evaluation_eligible=true` based on API connectivity or simulated/offline tests.

### Acceptance sequence for first future match

1. Record the provider terms version and any account-specific agreement, and obtain a documented third-party rights assessment for actual use/storage including historic training records; keep unapproved raw sources out of locked storage (COMPLIANCE-mode retention cannot be undone).
2. Independently confirm NBA fixture tipoff and changes in the licensed source; capture exact BDL game ID and a verified provider-to-provider mapping.
3. Prove TSA root/signer trust, make a real RFC 3161 request, verify signed response and signed `genTime`; a timestamp of a *postgame* digest proves only this later timestamp, not pregame provenance.
4. Verify S3 bucket Object Lock was enabled on creation, versioning and retention, upload a harmless **synthetic test** object, read back exact bytes and retention with VersionId; no historical ESPN or unapproved third-party content in this test.
5. Only when rights, input/source provenance and archive infra are approved, run one original future pre-tipoff prediction through `execute_once`. Its current implementation deliberately sets `source_availability_verified=false` and `evaluation_eligible=false`, so independent validation and eligibility promotion are **not implemented merely by a successful run**.
6. After the real FINAL, independently verify result provenance, model identity, schedule, sign time and WORM evidence before considering `1/1` acceptance.

Current release gate: **NO_GO, verified 0/100**.

## Tested external RFC 3161 infrastructure — 2026-11-03

FreeTSA was exercised from a Vercel Sandbox using a **synthetic-only** SHA-256 input. The pinned certificates matched their expected SHA-256 hashes, external response signature and chain verification passed, and the signed `genTime` was `2026-11-03T09:06:25Z`. Exact request bytes, full TSR and timestamp audit are archived as base64 chunks at `docs/evidence/rfc3161-synthetic-verification-2026-11-03.json`. SHA-256 of TSR is `03082ca35ba949ef4b37405b1155762ce2b316391f233b64e0dd04f5cadf8f7d`. This is a **PASS for synthetic TSA test only**, NOT an NBA prediction timestamp, WORM archive, qualified EU eIDAS timestamp, approved production SLA, or source-rights certificate.

FreeTSA publicly permits commercial use with a one-request-per-second/IP limit but provides no SLA (https://www.freetsa.org/freetsa.html). It is not presumed to be an eIDAS-qualified provider. Production security and legal use still require separate acceptance.

**Important:** rights for the existing ESPN-dependent 2026-11-02 forecasts remain unresolved; the independent forward cohort remains 0/100.


## Live ToS recheck 2026-11-03 — correction of prior conflicting addendum

The live https://www.balldontlie.io/terms.html currently states **Last Updated: October 20, 2026**. Section 6 expressly allows lawful competing analytics products including statistical projections and commercial model evaluation. The prohibited competitor category is **a substitute sports-data API or equivalent feed** supplied to third parties, not independent analytics products in general. Previously written remarks that the terms were dated August 4, 2026 and broadly prohibited all competing products are superseded by this correction. The section 11 third-party rights disclaimer remains, as do sections 8-9 data freshness/provenance disclaimers. Preserve exact URL and retrieval date, and recheck plan-specific terms before commercial release.

**Operational decision:** Research-only BDL-derived prospective observations may be generated with protected account API credentials, preserving derived metrics and raw-response digests rather than raw upstream bytes; no blanket rights clearance or eligibility upgrade for original ESPN-derived historic inputs. Source availability, independent WORM, authorized third-party IP and settlement remain separate **NO_GO** gates.
