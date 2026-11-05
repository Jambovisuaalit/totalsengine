# Polymarket vendor clarification — 2026-11-05

**Owner identifies "Polymarket" and links https://docs.polymarket.com/api-reference/predictions/overview as basis for reported permission.**

## Identity resolution
The linked official Predictions API **documents the global Polymarket.com stack**, specifically:
- Gamma API: `https://gamma-api.polymarket.com`
- CLOB: `https://clob.polymarket.com`
- Data API: `https://data-api.polymarket.com`
- Real-time WebSocket services.

This is **not the Polymarket US exchange gateway** `https://gateway.polymarket.us` used in the 2026-11-05 ORL-PHO prospective BBO capture; different API, identifiers and potential legal/licensing counterparties. An authorisation for global Polymarket.com must not be transposed to US data. Source: https://docs.polymarket.com/api-reference/predictions/overview .

## Legal scope
Official Polymarket.com terms (effective 2026-08-11) explicitly apply when users access APIs and warn that the information is provided without guarantee; users must avoid harvesting for unauthorised purposes. Source: https://polymarket.com/tos . Public documentation and working read endpoints do **not** independently prove rights for commercial paid SaaS, resale/redistribution, original API response retention or irreversible WORM archival.

**Owner-reported source name:** Polymarket (global documentation supplied).
**Documented license/grant:** NOT PRESENT.
**Verified permission to use global predictions data commercially:** HOLD.
**Verified permission to retain raw API bytes in COMPLIANCE WORM:** HOLD.
**Verified rights for Polymarket US exchange quotes:** HOLD / SEPARATE.
**NBA historical game features (ESPN or licensed alternate):** HOLD / SEPARATE.

## Engineering separation
- Preserve `venue=polymarket.us` on US market receipts; NEVER rewrite it to `polymarket.com`.
- Any future global `polymarket.com` adapter must use distinct `venue`, `provider_api_family`, canonical event/market identity, source licence record and separate pregame RFC3161 capture.
- Keep `safety/hold-unlicensed-espn-forward` draft PR #32 until NBA source licence independently checked; this Polymarket documentation does not grant ESPN rights.
- Do not change market source licence boolean or `evaluation_eligible` based on URL alone.
- Private contracts/permission letters should be stored outside public GitHub, with their verified document hash and approval register reference here.

**Required next evidence:** Polymarket counterparty's actual license or written communication with authorised grant for `polymarket.com`, legal-entity scope, paid analytics, API automated collection, original payload storage, permitted retention period and any regional obligations. 

**Status: OWNER_REPORTED_POLYMARKET / OFFICIAL_API_DOCS_VERIFIED / LICENSE_SCOPE_PENDING / NO_GO, cohort 0/100.**
