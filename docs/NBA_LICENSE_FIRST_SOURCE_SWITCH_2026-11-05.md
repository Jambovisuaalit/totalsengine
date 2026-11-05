# TotalsEngine — new source acquisition decision, 2026-11-05

**Decision: LICENSE_FIRST / NO_UNAPPROVED_NEW_PROSPECTIVE_FORECASTS / NO_GO**

## Licensed data vendor priority

1. **SportsDataIO** — primary NBA schedules, game status, final results, historical features and point-in-time availability enquiry. Official commercial licensing FAQ: https://sportsdata.io/help/data-rights-and-licensing-questions . The provider states its commercial licences *can* permit response storage, model inputs and displaying derived outputs, subject to precise feeds and contract. This does not establish an agreed licence. Submit the official business licensing form at https://sportsdata.io/contact-us . Request narrow NBA-only pilot pricing, allowable WORM retention duration, complete source-change timestamps, permitted derived SaaS uses and reliable canonical event IDs.
2. **Polymarket US** — market benchmarking requires a **separate** written rights grant even with a licensed NBA game feed. Official US exchange regulatory page lists `data@polymarket.us`: https://polymarketexchange.com/regulatory.html . Request read-only live BBO/history commercial analytics, derivative-display, original JSON retention, RFC3161 hash attestation and redistribution boundaries. Do not confuse global Polymarket exchange rights with the US venue.
3. **Sportradar** — fallback NBA feed for commercial coverage and update provenance: https://developer.sportradar.com/basketball/docs/nba-ig-api-basics ; confirm a license explicitly permits model training/derived B2B outputs and immutable original-source storage.

## License admission contract

Source approval requires independently reviewable evidence, not a manual boolean:
- legal counterparty, legal entity using the data, applicable terms version, signed written licence / authorised grant;
- feed/API host and sport, authorized commercial analytics/model training/derived display, historical/real-time scope, geography;
- rate limits and access obligations, timestamp availability and revision/correction semantics;
- right to retain *unaltered raw bytes* for a specified period in S3 Object Lock COMPLIANCE (or a compatible compliance alternative);
- any WORM deletion incompatibility with termination obligations resolved explicitly;
- counsel/owner review, expiry and revocation procedure.
Without this evidence, `license_status = HOLD`, `source_availability_verified = false`, `evaluation_eligible = false`.

## Legacy ESPN collector freeze — research branch only

- Branch `research/polymarket-first-evidence-chain` changes `nba_totals_research/scheduled_paper_collector.py` CLI entry point to **fail closed** before a network request.
- The same branch removes the cron entry from `.github/workflows/nba-forward-collection.yml` and gives the workflow job a permanently false condition. Preserves old derived research evidence as-is.
- **Important**: these changes are draft branch changes and **DO NOT disable the existing main-branch schedule yet**. Do not claim the production source is frozen until an approved merge and verification of the main workflow state. Direct Python imports of `run()` from legacy code remain technically possible; separate API-level source guard is required for a stronger invariant.
- No approved licensed NBA adapter has been installed. Do not relabel ESPN research history as SportsDataIO/Sportradar-derived data or use it as independently verified source provenance.
- Retain current forecast and Polymarket US TSA proofs as research-only; that signing itself does not grant retention/commercial rights.

## Delivery acceptance

1. Commercial licence evidence confirmed, retained securely, approved for named product and region.
2. Real authorised vendor response captured before feature cutoff; hash, acquisition moment and ideally signed availability/correction provenance preserved.
3. Independently signed prospective prediction and corresponding independently signed **lawfully retained** market quote.
4. Authorized exact-match result including settlement terms; independent final/OT check.
5. S3 COMPLIANCE WORM original payload, `VersionId`, retention and version-specific byte readback confirmed.
6. Independent verifier PASS, code/CI approval and main-branch deployment review.

**Until all gates pass: NO_GO, 0/100 independently admitted.**
