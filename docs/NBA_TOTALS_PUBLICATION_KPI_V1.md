# Publication release KPI — 100% evidence required (NO-GO v1)

**Target:** 100% of *published* NBA totals signals must have all four
independently supported properties: (1) attested pre-tipoff observation,
(2) exact NBA game/line/side/settlement/book quote match, (3) valid
data-use and betting-model/redistribution rights, and (4) an explicit
verified-executable quote/accepted-stake status. Additionally, an
independently validated predictive model and an authorized publisher
are required before this service can operate.

**Current delivery:** `nba_totals_research/release_gate.py` is a
**read-only audit and fail-closed policy**, not a publisher. The
collector is offline and has no independent trust roots. Accordingly
its evaluation **always returns NO_GO**; an ordinary JSON boolean,
hash or local-clock timestamp cannot cause any missing gate to pass.

## Explicit release blockers

| Gate | Evidence required | Current implementation |
| --- | --- | --- |
| PRE_TIPOFF_ATTESTED | Server-side source receipt plus trusted external UTC timestamp, immutable original source version, verified chronological pre-tipoff and provider publication | Not available: local host clock only |
| EXACT_MARKET_MATCH | Valid canonical NBA game UUID, full game including OT, total point line, Over/Under, book, quote ID, price, source digest, correct assessment timing | Structurally checked against linked collector receipt, but independently untrusted |
| DATA_RIGHTS_APPROVED | Independently reviewed signed/recorded product, territory, retention, redistribution and betting-use authorizations covering all provider feeds | Not available |
| EXECUTION_VERIFIED | Valid independently verified bookmaker acceptance/limit/odds and stake evidence tied to the exact quote, assessed at the actual executable moment | Not available; only unverified quote data |
| INDEPENDENT_MODEL_VALIDATED | Separate out-of-sample model calibration, no lookahead leakage, comparison to no-vig totals market baseline | Not available |
| PUBLISHER_AUTHORIZED | Authenticated and audited server-side publishing adapter with policy enforcement, deny-by-default and kill switch | Not built |

The code distinguishes **local structure and timestamp checks** from
real attestation, and does not accept caller-supplied trust flags.

## KPI measurement

The denominator is **actual independently audited published signals**.
No publish adapter exists, so denominator = 0 and verified publication
compliance rate = `null` (not 100%). Local synthetic receipts are
diagnostic data, not published signals. An eventual release should
maintain immutable counts of attempted, blocked, and published signals,
each with a verifiable gate decision; any published unverified signal
must trigger an alert and an immediate publisher kill switch.

**Target for live integration:** `published_without_all_valid_gates=0`
and `verified_published / total_published = 1.00` whenever
`total_published > 0`, backed by an independent audit, not just
dashboard aggregation. No evidence of compliance can be claimed from
a zero-signal denominator.

## Run safely (offline, no provider calls)

```bash
OUT="$HOME/.local/share/totalsengine/evidence-research"
python3 -m nba_totals_research.collector --demo --output "$OUT"
python3 -m nba_totals_research.release_gate --audit-ledger "$OUT"
python3 -m unittest discover -s tests_nba_totals -p 'test_*.py' -v
```

`--audit-ledger` reports local integrity, accepted-for-local-schema
vs rejected vs duplicate counts, current NO_GO and undefined
publication rate. It cannot publish. It does not read BetDoctore's
separately frozen 363-game sample or access DoctoreAI Supabase.
No data providers are contacted or trained.

## Acceptance plan

Before adding any externally accessible publishing interface:
- Revoke previously exposed NBA API keys; obtain authorized data rights
  and independent source receipt/UTC provenance.
- Implement a trustworthy verification service with externally
  pinned verification keys / authorization registry and negative
  integrity tests. Keep trust roots separate from the producer.
- Record executable quote acceptance or independently verifiable
  availability limits; do not confuse screenshot/HTTP200 with execution.
- Validate NBA full-game total model independently; assess calibration,
  total-score distributions, over/under/push probability and ROI
  uncertainty against a no-vig market baseline.
- Create guarded, auditable signal publication transaction and
  kill switch with final atomic gate evaluation immediately before send.
- Add release CI tests demonstrating no unchecked path to publication.

**Do not merge the Draft PR or deploy the merged main app** merely
because synthetic tests pass: current Vercel main deployment error
and DoctoreAI/Totals architecture boundary remain unresolved.
