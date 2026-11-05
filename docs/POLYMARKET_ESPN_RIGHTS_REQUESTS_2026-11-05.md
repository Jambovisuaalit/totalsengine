# TotalsEngine — source-data rights request drafts (NOT SENT)

These are outreach drafts, not proof of license or contact with any provider. Send only after confirming the correct official rights/licensing channel and legal entity.

## Polymarket US — direct market data rights

Subject: Polymarket US market-data licensing — read-only analytics, derivatives and immutable audit retention

Hello Market Data Licensing team,

We are developing TotalsEngine, a read-only NBA prediction-research and B2B analytics service. We access market metadata and quotes through Polymarket **US** endpoints (`gateway.polymarket.us/v1/events/slug/...`, `/v1/markets/{slug}/bbo`, and `/v1/price-history`). We do not seek trading, execution, or client order-routing functionality.

Before extending use, please confirm which exchange/ISV terms govern direct use of these public API endpoints, and whether a separate agreement can authorize:
1. automated read-only observations and internal commercial research;
2. derived analytics, model-vs-market comparisons and paid SaaS output;
3. retention of exact raw JSON quote responses, accompanying timestamps/hashes and RFC3161 evidence in a COMPLIANCE-mode WORM audit archive for a negotiated period;
4. display of market names, lines, bid/ask and derived comparisons to customers (not resale of the original API feed);
5. attribution, jurisdictions, rate limits, corrections, retention after termination, and price/contract terms.

Please refer us to the correct data licensing counterparty and share a sample agreement or permission letter. Until clarified, our work remains noncommercial research with no raw provider response archive.

Thank you,
TotalsEngine project team

## ESPN / rights holder — NBA historical event data

Subject: NBA scoreboard data rights — predictive analytics, point-in-time evidence and controlled retention

Hello Data Licensing team,

We are evaluating licensing for NBA fixtures, historical final scores and event metadata as inputs to a predictive NBA totals analytics model. A research prototype has used ESPN-branded scoreboard data, but we do not assume publicly accessible endpoints confer commercialization rights.

Please direct us to the correct authorized licensor for machine-readable NBA historical schedules, game status, final scores and correction history, and clarify:
1. authorization for machine/API collection and historical model feature generation;
2. internal and SaaS commercial use of derived forecasts and performance statistics;
3. retention of original event payloads and provenance logs in restricted S3 Object Lock COMPLIANCE storage for audit;
4. timestamped availability/change logs enabling true point-in-time tests and independent outcome verification;
5. territories, attribution, sublicense/display limits, costs, update frequency, API access rights, contract termination and retained historical derivative rights.

We would welcome a commercial licensing proposal for a pilot with limited NBA-only scope.

Thank you,
TotalsEngine project team

## Alternative rights-first provider

SportsDataIO publicly states it offers commercial licenses covering NBA models, betting analytics, storage of API responses and derived outputs, dependent on specific plan and license: https://sportsdata.io/help/data-rights-and-licensing-questions . This is **a potential licensed replacement source**, not proof of point-in-time availability or permission for historical ESPN data already used. If bought, start a new independent prospective cohort using the approved provider only; do not retroactively re-label older ESPN-based forecasts.

## Decision rule

No response or ambiguous generic support reply = `HOLD`. Signed license or explicit documented authorized rights + owner/legal review + scope and expiry metadata = candidate for rights approval (never automatic WORM/evaluation approval). Preserve original written correspondence and license version under restricted access, not public GitHub.
