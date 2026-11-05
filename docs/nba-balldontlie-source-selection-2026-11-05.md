# Approved NBA provider selection — BALLDONTLIE Games v1 (2026-11-05)

**Decision:** Select BALLDONTLIE Games v1 as first-party API *adapter target*, not as an already authenticated or fully cleared production data source.

## Source-backed permissions and limitations
Provider Terms of Service, last updated 2026-10-20:
https://www.balldontlie.io/terms.html
Section 6 explicitly permits copying, caching, storing, archiving, analysis, backtesting, commercial application use, and permitted redistribution of **lawfully obtained data**, without a separate case-by-case vendor approval. Section 11 does not grant rights held by third parties. Their API requires a personal key and plan access. Public NBA Games data is included in the free tier: https://docs.balldontlie.io/.

By contrast NBA.com Terms of Use section 9 explicitly restricts NBA statistics in connection with gambling and commercial uses. It is **not** silently approved as an alternative: https://api-hub.nba.com/termsofuse

## Implementation
- `balldontlie_games_adapter.py` reads original authenticated `/v1/games?dates[]=YYYY-MM-DD&per_page=100` response bytes and fails closed on missing keys, non-200 HTTP responses, oversize data, missing or duplicated event, and incomplete pagination.
- `capture_bdl_pre_forecast.py` freezes the exact raw bytes and a SHA-256/host capture manifest. Only a provider-confirmed PRE_GAME snapshot before scheduled tipoff is eligible for capture. Provider state is not an independent actual-start source.
- `.github/workflows/nba-bdl-source-evidence.yml` is an opt-in, automatically schedulable capture → manifest → GitHub OIDC/Sigstore attestation → `gh attestation verify` → short-term raw artifact archive. **Attestation precedes any prediction job**. No prediction job is enabled by this workflow.
- `config/nba_balldontlie_rights_policy.json` is intentionally PENDING and denies capture and public artifact retention. The job is also disabled unless repository variable `NBA_SOURCE_CAPTURE_ENABLED=true` and a secret `BALLDONTLIE_API_KEY` exist.
- Never store credentials, authorization headers, secret values or provider's unverified first-publication timestamps in the archived artifact. Artifacts are deletable, not WORM storage.

## Required acceptance before real data capture
1. Confirm actual account access and Games endpoint tier; do not create/purchase an account or bypass provider authentication.
2. Review the intended retention/redistribution scope and third-party rights. In a **public** GitHub repo, raw artifacts are potentially retrievable by others; explicit `allow_public_artifact_raw=true` approval is required. If unavailable, use private storage or public manifest-only attestation; do not expose protected raw response.
3. Only after reviewed permission, set policy `APPROVED` with a named reviewer, source/endpoint scope, effective dates and specific approval reference.
4. Require a real successful source-capture Sigstore receipt with SHA-256, OIDC signer identity, Rekor inclusion, original bytes and a before-forecast server timestamp. GitHub runner clock alone is not independent pre-forecast proof.
5. Independently verify event mapping, actual tipoff, first FINAL availability, model feature PIT history, and OOS policy. Keep production/evaluation/+EV **HOLD** until every gate passes.

**No live BALLDONTLIE API calls or real-event observations were made by this PR.**
