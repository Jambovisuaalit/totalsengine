# ORL–PHO market RFC3161 independent GitHub-readback verification — 2026-11-05

**Proof status: PASS for receipt signature and timestamp; NO_GO for commercial/evaluation admission.**

## Independent readback run
- GitHub head inspected: `95ff04ef945f108cf0d855206bd3073404151184`, research PR #28.
- Separate newly created Vercel Sandbox: `totalsengine-tsa-readback-20261105`; session `sbx_HAopUyNPZEcf5xL6T8pD7Ph1HdmT`.
- Source files: `docs/evidence/polymarket-orl-pho-2026-11-05/capture-receipt.json` and `tsa-proof.json` checked out from the referenced commit.
- Recomputed exact receipt SHA-256: `0835fa3e46466e3593437550bef643d390fa68eaa2dc8cc0927db2929648a8ca` matching the TSA proof reference.
- Recomputed exact TSA-proof SHA-256: `d83e0f2a659eeaeb21bee7ce4a2a780ca453cc781ba295e8a41c7de8db50060a`.
- Decoded the *stored* `tsa_request_base64` and `tsa_response_base64` into TSQ/TSR bytes.
- Downloaded FreeTSA trust material and checked pinned `CA_PIN` and `SIGNER_PIN` using the existing research code.
- OpenSSL command: `openssl ts -verify -queryfile request.tsq -in response.tsr -CAfile ca.pem -untrusted signer.pem`.
- Returned **`OPENSSL_EXIT 0` and `Verification: OK`**. OpenSSL parsed **`Time stamp: Nov  5 03:40:11 2026 GMT`**.
- Event scheduled start: `2026-11-06T02:00:00Z`; signed receipt predates tipoff.
- This **closes the second OpenSSL readback verification gap**, not the independent source/retention admission gates.

## Rights/provenance decision

- The official Polymarket US data guide is oriented to read-only data vendors, research teams and analytics: https://docs.polymarket.us/data-guide/overview . Its existence is **not** a license grant for derived commercial resale or unrestricted raw retention.
- Polymarket Institute distinguishes the US exchange and the separate global exchange APIs: https://institute.polymarket.com/data .
- ESPN terms reference: https://support.espn.com/hc/en-us/articles/360035445091-Terms-of-Use . A public ESPN scoreboard response does not supply an authenticated historical data publication time nor a commercial archival license.
- There is no written license/rights approval recorded for either original ESPN input or Polymarket US payload. Keep both `source_rights_approved=false`.
- Capture receipt contains hashes of provider responses; **raw bytes themselves were not retained**. Hashes alone cannot reproduce the vendor response and are insufficient to certify content retrospectively.
- No live S3 COMPLIANCE Object Lock VersionId, retention inspection, byte-identical object readback or legal retention basis available.
- The same-game expected total forecast (227.95) is independently timestamped as a research forecast batch, but historical feature point-in-time correctness is not established; no probability/EV inference.
- The independently confirmed game result must be checked after actual FINAL; do not fill it prematurely.
- **NO_GO**, `evaluation_eligible=false`, `publication_allowed=false`, independently certified cohort **0/100**.
