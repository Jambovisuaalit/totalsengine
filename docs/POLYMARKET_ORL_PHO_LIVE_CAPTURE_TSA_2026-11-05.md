# ORL @ PHO — Polymarket US prospective BBO + RFC3161 (2026-11-05)

**STATUS: LIVE_CAPTURE_RECEIPT_TIMESTAMPED_RESEARCH_ONLY / NO_GO.**

## Original prospective live read
- Event: ORL Magic at PHO Suns, Polymarket US event ID `178002`, slug `nba-orl-pho-2026-11-05`.
- Venue full game total: market ID `2173110`, slug `tsc-nba-orl-pho-2026-11-05-219pt5`; Over **219.5**, overtime included. Scheduled tipoff `2026-11-06T02:00:00Z`.
- Public provider API responses fetched *live*: `GET /v1/events/slug/nba-orl-pho-2026-11-05` followed by `GET /v1/markets/tsc-nba-orl-pho-2026-11-05-219pt5/bbo`.
- Capture started `2026-11-05T03:40:10.225160Z`; concluded `2026-11-05T03:40:10.381117Z`.
- Read quote: **YES bid 0.5000, ask 0.9900**, open market. The spread is **0.4900**, disqualifying the sample as a meaningful precise fair-value proxy. Do not infer EV, expected liquidity or executable size.
- Hashes of exact *transient* original provider API response bytes (source rights unresolved; raw payload not retained): event `ce9cbeb66886b2692f5813c872cd34c1ab845dfa26d637b2b077ea67ca5f4973`, market BBO `a7ef4e2019749951783420f034673fd413fa614a9bc8699da85dca82eaf9da4d`.

## Signed evidence
- Original capture-receipt: `docs/evidence/polymarket-orl-pho-2026-11-05/capture-receipt.json`, SHA-256 `0835fa3e46466e3593437550bef643d390fa68eaa2dc8cc0927db2929648a8ca`.
- Original TSA proof: `docs/evidence/polymarket-orl-pho-2026-11-05/tsa-proof.json`, SHA-256 as measured at origin `d83e0f2a659eeaeb21bee7ce4a2a780ca453cc781ba295e8a41c7de8db50060a`.
- Genuine FreeTSA RFC3161 response signed time: **`2026-11-05T03:40:11Z`**, before game start. Existing pinned trust-chain and imprint verifier returned `rfc3161_signature_verified_at_capture=true`. The signed digest is of the capture receipt and receipt records the provider raw-response hashes.
- The files were uploaded as exact UTF-8 text to the draft research branch. Subsequently the GitHub connector retrieved both files (sizes 1018 and 6876 bytes) and confirmed the expected quoted fields and signed time. **A second independent OpenSSL re-verification of the GitHub-readback bytes was not yet completed**; don't assert it passed.
- Six local capture preflight tests passed. An initial syntax error and subsequently a missing marketData extraction were repaired; permanent GitHub source fix commit `771c290d23bd676de357cd0d0931ced4fe1ae821` in PR #28. The live run used the equivalent repaired sandbox working tree. Full PR CI is not yet verified.

## Matched model forecast
- Same scheduled game source ID `401909936`, `ORL` away / `PHX` home.
- Earlier pregame model expected total **227.95 points** with batch genuine RFC3161 signed genTime `2026-11-05T03:32:24Z`.
- Research forecast batch original and TSA response stored under `docs/evidence/polymarket-orl-pho-2026-11-05/`; signed forecast batch digest `cc5ff67683c3c138a2c8bd8d5b9232cd89e78b316cb1cb916e57a67de8d5a580`.
- Model expected total is not an Over 219.5 probability, so no EV/calibration inference.

## Outstanding blockers
- ESPN historical feature availability rights and point-in-time provenance **UNVERIFIED**.
- Polymarket US commercial data retention/use rights **UNVERIFIED**; exact raw API responses not archived.
- No independently verified WORM COMPLIANCE object-retention readback or VersionId.
- No independently authenticated market-event vs ESPN event ID mapping beyond candidate matching teams/start/settlement terms.
- No settled independently sourced FINAL for this future game yet.
- Original receipt field `rfc3161_verified=false` is deliberately immutable pre-attestation. The separate signed TSA-proof contains `rfc3161_signature_verified_at_capture=true`.
- Do not merge/deploy/publish or increment independent cohort `0/100`. **NO_GO.**
