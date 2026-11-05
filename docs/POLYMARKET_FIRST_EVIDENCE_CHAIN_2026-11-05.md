# Polymarket × TotalsEngine: first single-game evidence chain (2026-11-05)

**Status: BLOCKED / RESEARCH ONLY / NO_GO.** This is a candidate mapping, not a verified price comparison or claim of independent model performance. No trading or production release is authorized.

## Candidate forecast (existing immutable-in-repo research record, not WORM)

- Forecast: `docs/evidence/nba-forward-original-2026-11-03/predictions.jsonl`, first row.
- Away: Philadelphia 76ers (`phi`); home: Detroit Pistons (`det`).
- Source-game ID: `401909922` (ESPN-origin identifier, external mapping still required).
- Forecast of full-game combined points: **220.4**. This is an **expected total**, not an Over/Under probability for a specific line.
- Generation: `2026-11-03T09:39:08.601802Z`. Scheduled tipoff: `2026-11-05T00:00:00Z`.
- Record SHA-256 field: `c138a7eef9c33dab086bd818d7f63cfc18694f1323ee0efe7ae5ff21dc2a6713`.
- Existing batch timestamp receipt is described in `docs/TOTALSENGINE_CANONICAL_STATUS_2026-11-03.md`, but a GitHub record is **not** independently immutable WORM evidence and source rights remain unapproved. Keep `evaluation_eligible=false`.

## Candidate prediction-market reference

A **Polymarket US** event was publicly listed for **PHI @ DET, Nov 4, 2026, 7 PM ET** with Full Game Totals lines including 219.5 and 220.5:
- https://polymarket.us/sports/nba/nba-phi-det-2026-11-04
- NBA schedule: https://www.nba.com/game/0022600173
- Data source distinction: https://institute.polymarket.com/data

**Important:** `polymarket.us` is a different venue, data stack, and API from the international `polymarket.com` Gamma/CLOB APIs. Do NOT assume a US market is discoverable through `gamma-api.polymarket.com`. The public webpage is evidence that a candidate *market exists*, not proof of an executable price at a historical pre-tipoff instant. Web search snippets and changing rendered prices are not timestamp-verified archived quotes.

## Missing acceptance evidence

1. Obtain authoritative Polymarket US market ID, explicit Full Game **including overtime** contract terms, line, outcome side, and independently validated event-to-game mapping.
2. Find original market bid/ask **captured before 2026-11-05T00:00:00Z**, with origin, raw response hash, UTC collection time and independently verified capture-time evidence. A backfilled current page does NOT satisfy this gate. If unavailable, do not substitute a post-tipoff quote; choose the next upcoming comparable game.
3. Obtain an independently verifiable **FINAL** score from an authorized source with complete home/away identity and overtime handling; do not use an in-progress score or a preview page.
4. Reconcile rights for original ESPN forecast data and Polymarket US usage/retention separately, plus verified immutable storage and signed timestamp provenance.
5. Run `python scripts/verify_polymarket_chain.py <chain.json>` with a complete evidence document. **Do not set verification flags true unless linked to independently auditable receipts.** A local script PASS on self-asserted booleans is not independent external certification.
6. Only after a compliant single-game join, compare the correct *probability* at an identical totals line against the observed result. `expected_total=220.4` alone cannot be converted to an Over 219.5 probability without an independently validated predictive distribution.

**NO_GO:** no pregame Polymarket US orderbook snapshot, verified final, rights clearance, or complete immutable admission proof is present in this branch. Verified independent prospective cohort remains **0/100**.

## Scope and safe integration

The new verifier is intentionally fail-closed when any required segment is missing. Keep it research-only until provenance and numeric validation tests are independently executed. Do not add quote data scraped after tipoff, declare ROI, increment the verified cohort, automatically merge this draft, or deploy.


## Historical-price endpoint discovery — 2026-11-05

Polymarket US official documentation **does** list `Get Price History` under `/api-reference/price-history/get-price-history`. The US public gateway exposes `GET https://gateway.polymarket.us/v1/price-history`, with a **market slug** passed as `symbol`. It returns **book-derived Yes/No display prices** (rather than the international Polymarket CLOB token price history). See:
- https://docs.polymarket.us/llms.txt
- https://docs.polymarket.us/api-reference/price-history/get-price-history
- https://docs.polymarket.us/api-reference/markets/get-market-by-slug

**Critical distinction:** A retrieved historical display-price point with a time preceding tipoff can support a *retrospective historical quoted-price comparison* if original source timestamp, resolution, market identity, source integrity and vendor history semantics are confirmed. It is **not equivalent** to independent proof that our own system observed the exact price live before tipoff, nor necessarily proof of full historical L2 size/liquidity. Do not mislabel history backfill as contemporaneously collected market snapshot. The existing `snapshot_proof_verified` gate cannot be satisfied merely by setting a Boolean on historical data.

**Next retrieval attempt (not yet succeeded in this investigation):**
1. Resolve the **Polymarket US** event via its official US event endpoint, enumerate its totals market slugs and check regulation vs overtime.
2. Request a narrow window around **2026-11-04T23:00:00Z → 2026-11-05T00:00:00Z** for a verified 219.5 or 221.5 full-game totals market. Preserve the raw response and response metadata only once usage/retention rights are approved.
3. Separately label `HISTORICAL_BACKFILL` versus `LIVE_CAPTURE`; verify timestamps are observation timestamps rather than merely bucket boundaries, and confirm whether longPrice is ask-derived / shortPrice bid-derived.
4. Do not use any historical observation after `2026-11-05T00:00:00Z` as pre-tipoff.
5. If API cannot be reached or origin documentation is incomplete, report `HISTORY_UNVERIFIED`, not an estimated odds number.

**Execution limitation:** Public web discovery found the API but no successful response containing the specific historic market's original timestamps and bid/ask evidence was acquired; direct API invocation was inaccessible in the current execution environment. This preserves NO_GO.
