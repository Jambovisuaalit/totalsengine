# PHI @ DET — Polymarket US historical backfill checkpoint (2026-11-05)

**Classification: HISTORICAL_BACKFILL / RESEARCH_ONLY / NO_GO.**
**No assertion of contemporaneous live capture, independent provider timestamp attestation, approved licensing, WORM storage, model EV, or evaluation eligibility.**

## Original forecast

- Source: `docs/evidence/nba-forward-original-2026-11-03/predictions.jsonl`, game ID `401909922`, home `det`, away `phi`.
- Forecast generated `2026-11-03T09:39:08.601802Z`, expected total **220.4**.
- Source originally ESPN-derived, research-only, upstream source rights and immutable-retention gates remain unresolved.

## Official Polymarket US event metadata (retrieved after game)

- API: `GET https://gateway.polymarket.us/v1/events/slug/nba-phi-det-2026-11-04`
- Event ID `175488`; venue **Polymarket US**, not international Polymarket CLOB.
- Game start `2026-11-05T00:00:00Z`.
- Event response: `score=112-106`, `period=FT`, finished timestamp `2026-11-05T02:57:29Z`.
- Totals full-game (including overtime) contracts:
  - **Over 219.5** — market ID `2118079`; slug `tsc-nba-phi-det-2026-11-04-219pt5`; side IDs `4235616` (Over) / `4235617` (Under); created `2026-11-03T04:15:35Z`.
  - **Over 221.5** — market ID `2118094`; slug `tsc-nba-phi-det-2026-11-04-221pt5`; side IDs `4235646` (Over) / `4235647` (Under); created `2026-11-03T04:15:43Z`.
- Provider rules explicitly include overtime. Team identity, date, venue, period, line and side match source game; external event-ID mapping needs auditable record.

## Historical provider API retrieval

API template:
`GET https://gateway.polymarket.us/v1/price-history?symbol={MARKET_SLUG}&timestamp.startTimestamp=1793815200&timestamp.endTimestamp=1793836800&fidelity=1`

Provider documentation: https://docs.polymarket.us/api-reference/price-history/get-price-history

The exact pretipoff window is **2026-11-04 18:00:00Z to 2026-11-05 00:00:00Z**. The interval's **endpoint at 00:00:00Z must be excluded** because tipoff is at exactly that time; timestamps *strictly less* are the candidate pregame points.

For each market the API returned **361** one-minute points including the forbidden endpoint. Therefore **360 timestamped points strictly before scheduled tipoff** were returned in the requested interval per contract, subject to origin verification:

| Contract | First point 18:00Z | Last admissible timestamp 23:59Z | Retrospective longPrice / shortPrice |
|---|---|---|---|
| Over 219.5 | 0.50 / 0.51 | 23:59:00Z | 0.50 / 0.51 |
| Over 221.5 | 0.45 / 0.56 | 23:59:00Z | 0.45 / 0.56 |

The two 6-hour series had constant quoted prices throughout that window; an earlier **2026-11-03 15:00–16:00Z** test on the 219.5 contract returned 61 points with changing prices (e.g. 0.46/0.56 at 15:00 and 0.52/0.55 at 16:00). This **does not independently authenticate** bucket timestamps. Verify provider storage semantics and ask/size provenance before interpreting the series as executable odds.

Provider docs state `longPrice` is generally book-derived YES display price (normally best ask); `shortPrice` generally book-derived NO display price (normally 1-best bid). **They are not fill records.** No depth, transaction volume, request-origin signed digest, independent TSA or legally cleared raw payload retention was captured in this check.

## Final-result cross-check (retrieved after game)

- Provider event: displayed score `112-106` in PHI (away) / DET (home) order, period `FT`.
- Independent source read: `GET https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909922`
- ESPN status `STATUS_FINAL`, home DET **106**, away PHI **112**, total **218**.
- Consequence: Over 219.5 = **NO**, Over 221.5 = **NO**, assuming verified full-game contract rules. Observed expected-total absolute error `abs(220.4-218)=2.4` points (single provisional research example; not a valid model performance evaluation).
- Do not archive or republish ESPN raw data without rights clearance.

## Evidence / promotion restrictions

1. Historical API backfill exists with source-declared pre-tipoff timestamps. **This does not prove that TotalsEngine captured the quote before tipoff.**
2. Confirm provider history semantics, underlying observation timestamps, availability, rights/retention and preferably an independent archival attestation. If unavailable, keep quote class `HISTORICAL_BACKFILL_UNVERIFIED`.
3. Preserve `evaluation_eligible=false`, `publication_allowed=false`, cohort `0/100`, and PR in draft.
4. Current fail-closed verifier `scripts/verify_polymarket_chain.py` requires independently verified snapshot proof. Do **not** bypass with `snapshot_proof_verified=true` based on this historical API response.
5. Expected total 220.4 is **not** a probability of Over/Under 219.5 or 221.5. No EV or ROI can be estimated without a validated predictive distribution.

**Outcome: the historical-data retrieval subtask succeeded; independently timestamped live capture, source rights, market-depth proof and verified evaluation gate remain blocked.**
