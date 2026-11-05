# Polymarket US prospective capture — operational checkpoint 2026-11-05

**Status: CODE_PREPARED / LIVE_TSA_NOT_EXECUTED / NO_GO.** Research-only draft PR #28. Never treat a retrospective backfill as live proof.

## Official documented origin of past history
Official public API documentation: https://docs.polymarket.us/api-reference/price-history/get-price-history.md
- `GET /v1/price-history` accepts market slug in `symbol`.
- Custom range uses `timestamp.startTimestamp`, `timestamp.endTimestamp`, `fidelity=1`.
- API explicitly calls timestamps **observation time in Unix seconds**, and describes returned points as **stored observations** that may be irregular or more frequent than 1/min.
- `longPrice` is YES display price typically from best ask, `shortPrice` NO display price typically from 1 minus best bid. Not trades or historic depth.
- This is **provider documentation**, not an independent signed source-clock attestation. External attestation of historic origin remains **UNVERIFIED**.

## Chosen next prospective NBA candidate
- Event: Orlando Magic (ORL) @ Phoenix Suns (PHO), Polymarket US event slug `nba-orl-pho-2026-11-05`.
- Provider start time `2026-11-06T02:00:00Z`; independently verify schedule and odds prior to execution.
- Totals: market ID `2173110`, slug `tsc-nba-orl-pho-2026-11-05-219pt5`, full-game total **Over 219.5**, explicitly overtime-inclusive in provider contract rules.
- Official provider discovery: `GET https://gateway.polymarket.us/v1/events/slug/nba-orl-pho-2026-11-05`.
- Public BBO endpoint: `GET https://gateway.polymarket.us/v1/markets/tsc-nba-orl-pho-2026-11-05-219pt5/bbo`, documented at https://docs.polymarket.us/api-reference/markets/get-market-bbo.md
- Sample successful BBO read during this review: best bid **0.5000**, best ask **0.9900**, MARKET_STATE_OPEN. **This sample was not independently timestamped and has no retained raw receipt; NOT an accepted LIVE_CAPTURE.** Wide spread; reject as commercial EV evidence. Orderbook liquidity is low/uneven (bidDepth=5, askDepth=1 in that sample).

## Prepared prospective capture
`nba_totals_research/polymarket_live_capture.py`
- Rejects absent research safety flags, unknown event/market, wrong settlement conditions, closed/ended events, late capture, invalid BBO or mismatched market slug.
- Host capture start/end UTC; SHA256 of event JSON and BBO JSON computed from exact API response bytes (not stored without rights clearance).
- Derives small receipt with market identifiers, observed bid/ask, UTC times, source paths and hashes.
- Reuses pinned FreeTSA RFC3161 verifier; keeps request/response verification bytes, signed timestamp and receipt digest. Signed genTime must be after host receipt capture (at second precision) and **strictly before tipoff**.
- Does not claim vendor source clock, provider signature, independent archival immutability or data usage authorization. Every output remains `evaluation_eligible=false`, `publication_allowed=false`, `NO_GO`.
- Output receipt persists only if capture passes; if TSA fails, no signed proof. GitHub artifact of successful run is **not WORM**.
- Research workflow: `.github/workflows/polymarket-live-research.yml` is **manual dispatch**, no schedule; likely not triggerable until GitHub registers workflow on default branch. No job has been dispatched or verified from this work.

### Safe manual invocation (environment with internet)
```sh
HALTED=1 PUBLICATION_ALLOWED=false \
python -m nba_totals_research.polymarket_live_capture \
  --event-slug nba-orl-pho-2026-11-05 \
  --market-slug tsc-nba-orl-pho-2026-11-05-219pt5 \
  --out /tmp/totalsengine-polymarket-live-unique
```
**Only run at least 90 seconds before tipoff**, while event and quote are live, after review of source conditions. Check actual venue, lineup and game schedule as provider event information is not immutable. This is a time-limited candidate; after tipoff switch to another upcoming game.

## Go/no-go before a verified joined prediction/outcome
1. Code QA and the exact SHA's GitHub CI: **NOT VERIFIED**.
2. Real before-tipoff execution and independently validated TSA token: **NOT EXECUTED**.
3. Durable WORM object lock readback with version/retention and lawful source rights: **NOT VERIFIED**.
4. Independent prospective TotalsEngine forecast for SAME game, recorded before tipoff: **NOT IDENTIFIED**.
5. Exact-game final result from authorized independent source: **FUTURE**.
6. Commercial publish/EV permission: **NO_GO**, verified cohort **0/100**.

Do not merge PR #28 or deploy this workflow without distinct source-rights and CI approvals. The design never archives vendor raw payload by default, so while it hashes original bytes it cannot later *reproduce* them without an authorized independently immutable raw capture.
