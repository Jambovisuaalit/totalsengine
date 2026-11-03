# NBA provider rights and identity gate — 2026-11-03

Scope: NBA game totals; prospectively frozen pregame forecasts, authenticated source access and schedules, postgame FINAL including overtime, auditable records. **Research only until a separate independent admission verifier passes.** This document does not itself purchase a licence, perform a provider API call, or grant third-party rights.

## Decision

**Preferred low-cost integration candidate: BALLDONTLIE NBA Games API.** Its Terms of Service updated 2026-10-20 explicitly permit lawful personal and commercial uses, including paid apps, copying, caching, storage, archiving, models, redistribution and derivative works, without a fixed data-retention deadline (section 6). However section 11 disclaims clearance of third-party rights, and sections 8-9 explicitly do not warrant source provenance, accuracy, or timeliness. Section 2 says not to use BDL as the sole source for wager grading/settlement without independent verification. These are not equivalent to an independently verified official feed.

- Terms: https://www.balldontlie.io/terms.html (last updated 2026-10-20; review exact snapshot and account-specific agreement before production)
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
| Access | Authenticated provider API request with 200, original response bytes, request URI, captured UTC response time and hash | NOT_RUN |
| Exact game identity | BDL ID, original ESPN ID, UTC scheduled tipoff, teams and game status; non-ambiguous strict mapping and schedule change history | NOT_VERIFIED |
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
