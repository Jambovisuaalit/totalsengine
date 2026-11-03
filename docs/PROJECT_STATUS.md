# TotalsEngine — current project status

Updated: 2026-11-03. This is the canonical current-state entry point. Historical
notes describe their dated snapshot only; they are not deployment approval.
The branch containing this document proposes review fixes, not a production release.

## Product and release scope

NBA full-game point-total research, including overtime. Intended workflow:
Analyze Game → Review Prediction → Evaluate Market Edge. The market step is
blocked until separately licensed, timestamped and matched odds exist.

The public React release mounts only `/`, `/research`, `/methodology` and
`/privacy/telegram`. Other routes render an unavailable/noindex page. Legacy
Doctore pages and integrations remain in source, unmounted, for a separate
migration. No subscription, legacy dashboard, paid checkout or market feed is
exposed by this router. Static `/research-preview.html` is an illustrative archive.
Client-rendered canonical URLs use the current origin and route; the actual
production domain and deployed pages still require preview/production smoke.

## Three distinct research tracks

| Track | Implementation | What it establishes | Eligibility |
|---|---|---|---|
| Retrospective Ridge | Separate research package; dated summaries in this repo | Historical experiment only, not recorded live forecasts | Not prospective |
| Provisional forward baseline | scheduled_paper_collector + forward_settlement + research-ledger | Host-recorded forecast, exact ESPN identity/result join, provisional point errors | Not independently verified |
| Independent prospective chain | forward_pipeline RFC3161/S3 prototype + local evidence checks | Requires original bytes, trusted timestamp, immutable archive, source rights/availability, game mapping and final score | No accepted chain demonstrated |

Keep three denominators separate: unique collected game/model pairs, settled
provisional pairs, and independently admitted/settled pairs. The first two do
not advance the third. No evidence found in this review supports increasing
the independently verified cohort above **0/100**. See
[the evidence audit](INDEPENDENT_CHAIN_AUDIT_2026-11-03.md).

## Automation and storage

- Collector workflow: daily 16:15 UTC (18:15 Helsinki on 3 November 2026).
- Settlement workflow: daily 17:45 UTC (19:45 Helsinki on 3 November 2026).
- Both check out the triggering main revision and assert HEAD = GITHUB_SHA.
- Collector records source SHA, host UTC and runner commit; failed dependencies
  do not produce synthetic replacements. GitHub scheduling may be delayed.
- Settlement selects the earliest valid record per ESPN game ID/model version,
  matches teams and exact scheduled tipoff, and requires FINAL + six-hour delay.
- `paper_100_cohort` reports collected, duplicate, scored, pending and mismatch
  counts separately. MAE/RMSE remain null without settled rows.
- Workflows have contents:write for create-only derived ledger records;
  settlement also has actions:read. The token is not read-only overall.
- Raw collection/result snapshots: GitHub Actions artifacts, configured 30 days.
- Derived forecasts/settlements and hashes: public research-ledger Git branch.
  Git is neither WORM nor guaranteed permanent retention against administrators.
  After raw artifact expiry, a hash cannot reconstruct original source bytes.

### Source retention decision — unresolved

The old ESPN probe policy forbids raw retention beyond one process. Later
workflows actually retain snapshots for 30 days. The probe restriction must
not be described as the current implementation's storage behavior. No
independent rights/retention approval was supplied to this review. The
implemented retention is **not an approved license policy**. A documented,
source-specific decision is required before expanding retention, collection
scale, redistribution or commercial use. No data is deleted by this change.

## Review fixes in this branch

1. `model_evaluation.evaluate`: reject duplicate market rows and conflicting
   outcomes; require a frozen game/model point forecast and count its MAE/RMSE
   once. Binary market scores retain their own explicit denominator (schema v2).
2. Legacy analysis filters: all four selections apply together, UTC date label.
   This page remains unmounted pending migration.
3. HTTP deadlines and byte limits include response-body reads, including fixture
   and Telegram responses.
4. Shared Redis update ownership fences duplicate/retried Telegram sends. Missing
   storage fails closed. See [the deployment runbook](TELEGRAM_REPLAY_PROTECTION.md).
5. Public route allowlist, consolidated Helmet metadata and removal of the hidden
   static landing from the Vite entry; no public Doctore canonical route remains.

CI now includes an explicit frontend TypeScript check. Local checks do not
prove deployed Redis, live fixtures, Vercel preview or external timestamp trust.

## Release decisions

| Gate | Required acceptance | Status |
|---|---|---|
| Code fixes | Regression checks + review + same-SHA CI | Branch implementation; await CI/review |
| Web deployment | Same-SHA preview smoke and intended route inventory | Not verified here |
| Telegram replay protection | Durable non-evicting shared store configured, live adapter smoke, processor review | Not configured/verified in this workspace |
| Independent point accuracy | One fully admitted forecast/outcome chain before scaling to 100 | Blocked; audit records missing evidence |
| Betting/market publication | Licensed timed exact-market odds, predictive validation and separate publisher authorization | NO_GO |

`HALTED=1`, `PUBLICATION_ALLOWED=false`, `evaluation_eligible=false` remain.
There is no approval here to claim validated accuracy, EV, CLV, ROI or place bets.

## Document index

[DOCUMENT_INDEX.md](DOCUMENT_INDEX.md) classifies every document by scope and
supersession. Use this page for current operational decisions; retain dated
notes as historical evidence rather than silently rewriting their observations.
