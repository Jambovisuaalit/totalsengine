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
