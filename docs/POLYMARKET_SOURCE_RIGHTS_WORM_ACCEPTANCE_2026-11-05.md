# TotalsEngine — source rights and WORM acceptance register (2026-11-05)

**RESEARCH_ONLY / NO_GO.** This register does not grant any right, authorize third-party data retention, or approve an irreversible COMPLIANCE write.

## Source-rights findings (rights review required)

### ESPN scoreboard-derived historical features — RED
- Actual input: `site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard` (publicly reachable endpoint is not a license). In-use research records `ESPN_SCOREBOARD_UNVERIFIED`.
- Disney general Terms of Use encompass ESPN-branded products and limit business/commercial use, automated extraction and AI model development absent authorization, subject to supplemental/product-specific terms. See https://disneytermsofuse.com/english/ (section 2).
- **Unresolved**: exact party/license controlling that API, rights for machine collection, algorithm/model feature computation, internal commercial use, derived predictions, storage of original raw API bytes, timestamps, 2+ day retention, WORM retention, redistribution and jurisdiction, data corrections and contract termination.
- **Required evidence**: signed provider agreement/authorized data vendor license specifying each relevant permitted use, counsel review, dated captured contract URL/version, rights owner and approval expiry. No in-repo boolean or public endpoint proves rights.

### Polymarket US read-only market BBO and historical prices — RED
- Actual sources: `https://gateway.polymarket.us/v1/events/slug/...`, `/v1/markets/{slug}/bbo`, and `/v1/price-history`. Distinguish US exchange from global `polymarket.com`.
- Official read-only API guide: https://docs.polymarket.us/data-guide/overview ; describes access for vendors/research/analytics. **Documentation is not an unqualified commercial data license.**
- Official US app terms: https://polymarket.us/tos (linked published terms as of review, effective 2025-09-25), section 5: app-displayed market data licensed for personal noncommercial trading use and redistribution, resale, scraping, bulk download, commercialization of derivatives disallowed without express license. Whether the app ISV terms are the controlling license for direct public exchange gateway access is **unresolved**; seek explicit response from exchange or its authorized market-data licensor.
- **Unresolved**: automated read-only API collection permission, public gateway versus exchange feed license, prospective internal commercial model/price comparison, storage and WORM retention of original response JSON, showing prices/probabilities/derived deltas to paying customers, sublicensing/redistribution, audit logs, geographic restrictions, vendor attribution, and source corrections.
- **Required evidence**: provider/authorized venue written approval and license or a scoped legal determination; do not infer a right from a 200 API response.

### Separate retention decision
- Current GitHub evidence is **derived** research forecast bytes, source hashes, receipt metadata and genuine RFC3161 TSQ/TSR. It is not a legal license or WORM archive.
- Original ESPN source API bytes and Polymarket BBO body bytes were **not retained** in the live captures by deliberate rights restriction. SHA-256 digests cannot reconstruct those original responses.
- Do not fabricate retrospective source snapshots, authenticated source publication times or return an `evaluation_eligible=true` value based on historical API backfill.

## Rights questions to obtain in writing

1. Identify legal licensor and applicable API/venue terms.
2. Permit named legal entity to fetch ESPN NBA scoreboard or Polymarket US BBO/history automatically for prospective research and internal commercial analytics?
3. Permit creation of new prediction models or market-comparison analytics/derivatives using data, including paid SaaS use?
4. Permit retention of **unaltered raw response bytes** with UTC receipt times and hashes in immutable S3 Object Lock COMPLIANCE storage? Define minimum/maximum retention in days and termination/deletion exceptions.
5. Permit publication of game identities, market lines, quoted prices, model-vs-market deviations, historical performance, and/or sale to paying clients? Clarify attribution, territory and onward rights.
6. Specify API rate limits, replay/backfill rules, corrections, point-in-time provenance, timestamp semantics, rights approval evidence, and permitted audit approach.
7. Ask for a signed rider if standard terms lack these rights.

**Approval artifact** must identify provider, license reference, contracting legal entity, geographic scope, approved permitted uses and original-raw retention duration; legal/owner sign-off and expiry. Until then `ESPN_RIGHTS=HOLD`, `POLYMARKET_US_RIGHTS=HOLD`.

## WORM acceptance — synthetic bytes ONLY until rights cleared

Existing repo implementation:
- `nba_totals_research/worm_synthetic_smoke.py` synthetic nonce and explicit consent gate; CLI `--bucket --confirm-bucket --ack-immutable-write --retention-days 2..7`.
- `nba_totals_research/forward_pipeline.py::put_object_lock` writes in `COMPLIANCE`, checks exact `VersionId`, `get_object_retention`, and reads back a specific object version and compares SHA-256.
- Actual AWS COMPLIANCE writes **irreversibly lock that object version until retention expires**, including against root user. Only use an **owned isolated test bucket**, cost approved and explicitly approved irreversible write. Do not reuse an arbitrary bucket or run based on guessed credentials. AWS docs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html .

### Preconditions — do not run without all
- The user or AWS resource owner has identified the precise bucket and explicitly authorized writing a synthetic, irreversible two-day compliance object. Confirm costs, region, versioning and Object Lock enabled.
- Authorized IAM role has minimum required read/write/retention permissions; provide these via managed identity, not chat or logs.
- Test data contains zero ESPN, Polymarket or personal information.
- Use a unique test nonce and source code exact SHA with green CI and a documented test receipt destination.

### Synthetic-only execution (requires actual approved AWS bucket)
```sh
python -m nba_totals_research.worm_synthetic_smoke \
  --bucket "$APPROVED_TEST_BUCKET" \
  --confirm-bucket "$APPROVED_TEST_BUCKET" \
  --ack-immutable-write \
  --retention-days 2
```
Acceptance is **not** merely exit code 0: preserve output receipt, object key and VersionId, server-reported `Mode=COMPLIANCE` and retention until date, S3 version-specific byte hash match and exact AWS identity/region/bucket confirmation. Optional negative immutable-delete attempt requires separate authorization; do not perform now. Verify AWS billing/retention policy before any final-source WORM upload.

### Current result
- Synthetic unit/mock tests: available, not proof of a real S3 write.
- External approved AWS test bucket: **NOT IDENTIFIED**.
- Live S3 COMPLIANCE write, VersionId, retention readback, byte readback: **NOT RUN**.
- Original upstream source bytes: **NOT AVAILABLE FOR PERMITTED RETENTION**.
- Independent evaluation: **0/100**; `publication_allowed=false`, `evaluation_eligible=false`, `NO_GO`.

## Short-term decision
Retain the existing signed research-only evidence and code; freeze raw archival / commercial model comparisons until agreements are signed. Run only the synthetic WORM test after explicit immutable-write authorization and controlled AWS setup. Revisit source eligibility separately from cryptographic signing.
