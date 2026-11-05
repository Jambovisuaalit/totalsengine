# Polymarket.com public-wallet read-only smoke — 2026-11-05

**Public API access: PASS. Authorization, commercial source licensing, WORM and release admission: NOT VERIFIED / NO_GO.**

- Public API wallet identifier: `0x43Bb0590A4F8F7944c5aCC3Ebcf8cC93b812a2F4` (owner-reported; public profile matched; not a signature proof of ownership). **NEVER send funds to this address**.
- Explicit venue: `polymarket.com` GLOBAL. This is NOT `gateway.polymarket.us`; do not re-label prior US BBO evidence.
- Tested anonymous GET:
  - `https://gamma-api.polymarket.com/events?limit=1&active=true&closed=false`: HTTP 200, sha256 `f483e74a27db75539a4f53c74330d3e50f7d72944c61fcfab3e3e340dab7e7cd`.
  - `https://gamma-api.polymarket.com/public-profile?address=<PUBLIC_WALLET>`: HTTP 200, `proxyWallet` exactly matched case-insensitively; sha256 `b9164586ec9594d7f1bfd26eaa837da269feb46827b92f5cea2c0c690ebcc663`.
  - `https://clob.polymarket.com/time`: HTTP 200; sha256 `cf6bd07935a8a40e1370c948b321b874716d8a9e6edfcf80835aecb7b04e6acc`.
- Executed in Vercel research Sandbox `totalsengine-polymarket-public-read-20261105` at `2026-11-05T08:08:49.775381Z`, research source SHA `b02f0a609b0f9954f8950b7c32e6cddb9651c01b`.
- Four standalone unit tests passed: strict GET allowlist, no auth, global-only, wallet format and fail-closed output.
- First informal `https://data-api.polymarket.com/positions?user=<PUBLIC_WALLET>&limit=1` request returned HTTP 410 Gone. This optional address-specific profile/position endpoint is **not needed for market-data research**, is excluded from the approved integration and isn't evidence of a failed Gamma/CLOB public read.
- **No private key, seed phrase, signing credentials, builder API keys or order/withdrawal requests were used.**
- No original vendor response bytes retained. No signed RFC3161 market capture on Polymarket global venue yet. The three above SHA-256 hashes are only transient response identity checks, not independently timestamped market odds.
- The public `proxyWallet` match does not verify control of private keys and does not give authentication to private endpoints.

## How to run
```bash
python3 -m unittest tests_nba_totals.test_polymarket_global_readonly -v
python3 -m nba_totals_research.polymarket_global_readonly --smoke
```

## Acceptance and next action
1. Obtain documented data rights covering Polymarket.com public API commercial analytics and immutable raw response storage; no license claims from wallet or docs.
2. Add one real NBA relevant Gamma event/market discovery, independently verify event mapping and rules, obtain CLOB order book using the actual `clobTokenId`, and timestamp exact captured receipt with RFC3161 **before game start**.
3. Preserve approved original API response bytes in S3 COMPLIANCE WORM only after written retention rights and approved bucket ownership.
4. Keep all trading, order creation and funds transfers **disabled**.
5. Retain NBA feature-source provenance rights and independent result verification separately.

**Independent full chain: 0/100, NO_GO, publication_allowed=false.**
