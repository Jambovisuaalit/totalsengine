# TotalsEngine — owner-reported data permission, 2026-11-05

**Declaration:** Project owner states: "Lupa saatu nyt merkitään ja edetään" ("Permission obtained; mark and proceed").

**Status: OWNER_REPORTED_PERMISSION / DOCUMENTARY_VERIFICATION_PENDING / NO_GO.** This is a record of a user-provided statement, not an externally verified licence or proof that any particular API feed is authorised.

## Unknown scope — do not invent
- Granting/licensing legal entity: **NOT IDENTIFIED**.
- Relevant source: **NOT IDENTIFIED** (ESPN vs SportsDataIO vs Polymarket US vs other).
- License/approval evidence reference and issue date: **NOT PROVIDED**.
- Contracted TotalsEngine operating legal entity: **NOT IDENTIFIED**.
- NBA sport/product/endpoint access scope: **NOT VERIFIED**.
- Model-training/derived B2B SaaS commercial rights: **NOT VERIFIED**.
- Rights to store original response JSON under S3 COMPLIANCE/WORM, retention duration and termination handling: **NOT VERIFIED**.
- Public price-display/redistribution rights and regional restrictions: **NOT VERIFIED**.

## Immediate effect
1. Update rights-review workflow from `NO_PERMISSION_REPORTED` to `OWNER_REPORTED_PERMISSION_PENDING_DOCUMENTATION`.
2. Do **not** set `forecast_source_rights_approved`, `market.source_rights_approved`, `source_availability_verified`, `publication_allowed`, `evaluation_eligible` or WORM status true merely because an owner reported permission.
3. The separate `safety/hold-unlicensed-espn-forward` PR #32 remains an unmerged draft. Do **not** disable it or merge it away based on an unidentified permission.
4. Keep all source-specific commercial admission gates `HOLD` until exact rights scope and original license record are reviewed.
5. Do not store full private contracts or contract secrets in this public repository; keep secure access and reference immutable digest and controlled document ID only.

## Next action
Obtain **which vendor granted permission**, the written grant or contract reference, permitted API endpoint/feed, commercial derived-use permission, raw archival rights and retention duration. Then attach an approval digest and scoped reviewer attestation, test a new licensed live feed, and run separate WORM synthetic smoke after owned bucket and irreversible write authorization.

**Verified cohort: 0/100. Publication and commercial evaluation: NO_GO.**
