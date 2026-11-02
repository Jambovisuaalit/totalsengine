# Evidence Collector v1 — isolated research-only receipt pipeline

**Branch:** `research/nba-totals-evidence-core-v0` · **Draft PR #3**  
**Runtime:** Python 3 standard library; macOS/Linux `fcntl.flock`.  
**Live network:** none. **Provider API keys:** none. **Sales/public signals:** none.

## What v1 DOES

Accept a small locally provided normalized quote JSON, or create a
fully synthetic fixture with `--demo`. It:

1. Samples **the local host UTC clock** at input handling, without trusting
   a timestamp supplied as the capture time.
2. Parses the canonical market: NBA game UUID, full-game including-OT
   settlement rule, exact point line, OVER/UNDER, provider bookmaker ID,
   decimal odds, claimed original provider publication time, purported
   provider quote ID, offered and in-play flags.
3. Validates strict scheduled T−65–T−60, source publication at most
   120 seconds old, not live/closed, correct odds and market structure.
4. Records **every attempt**, including rejected input or repeat
   payloads. Replayed exact payloads are marked
   `DUPLICATE_PAYLOAD`, never an independent market observation.
5. Appends a SHA-256-addressed, consecutively numbered receipt with a
   `previous_receipt_sha256` link, private mode 0600 and a local
   advisory file lock (flock). Before appending, verifies all existing
   local receipts and links. The raw input body and credentials are
   **not** saved in the ledger.
6. Can verify local file integrity and chain ordering offline.
   Successful local receipts have
   `SCHEMA_AND_LOCAL_TIME_VALID_ONLY`, **not** a trusted
   publication or confirmed executable price.

**CRITICAL LIMIT:** A local hash chain is neither independent UTC
timestamp attestation nor tamper-proof/WORM storage. Without an
external immutable anchor, an adversary can delete the tail or replace
the entire chain. The provider timestamp remains a user-supplied
claim; the collector cannot establish when the provider really
published it or whether a bookmaker would accept the offered stake.
The receipt records `independently_attested=false`,
`executable_status=NOT_VERIFIED`,
`provider_rights_verified=false`,
`publication_allowed=false`, and `training_eligible=false`.
No model probabilities, EV rankings, stakes or ROI are published.

## Commands (synthetic only recommended until source rights approved)

From the repo checkout:

```bash
OUT="$HOME/.local/share/totalsengine/evidence-research"
python3 -m nba_totals_research.collector --demo --output "$OUT"
python3 -m nba_totals_research.collector --verify --output "$OUT"
python3 -m unittest discover -s tests_nba_totals -p 'test_*.py' -v
```

Optional offline input, strictly **unverified** (no API calls; no
live data sourcing is included):

```bash
python3 -m nba_totals_research.collector --input /path/to/local-normalized.json --output "$OUT"
```

Exact JSON fields: `game_id`, `line` (decimal string), `side` ("OVER"
or "UNDER"), `scope` ("NBA_FULL_GAME_TOTAL_INCLUDING_OT"), `book`,
`odds` (decimal string), `scheduled_tipoff` (timezone-aware ISO-8601),
`provider_published_at` (timezone-aware ISO-8601),
`provider_quote_id`, `offered` (boolean), `live` (boolean).
No extra fields accepted, particularly no client-supplied
`executable`, `trusted`, `capture_timestamp` or `license_approved`
fields. Ingestion failures are recorded under `REJECTED`; the CLI
returns exit code 2 for rejected input.

Receipts should remain **outside Git**; `data/evaluation` is ignored
in this repo but the recommended directory is outside the checkout.
Running from the current repository does not deploy Vercel, modify
the DoctoreAI Supabase project, run training or touch BetDoctore's
separate immutable 363-game evaluation sample.

## Required v2 release gates

- Written NBA/odds source rights and betting-model/commercial use approval.
- **Server-controlled** ingress timestamps with synchronised UTC,
  and external signed timestamp or trusted append-only object store,
  independently anchored receipt hashes.
- Authentic provider HTTP response, verified provider event ID,
  timestamp, market status, and source rights; no unapproved scraping.
- Actual bookmaker accepted stake/price/settlement confirmations with
  provider-side identifiers; quote availability alone is insufficient.
- Independent as-of/pregame model validation vs no-vig market baseline;
  prospective publication of both candidate and PASS decisions.
- OT-adjusted full-game total distribution and independently
  audited settlement, push accounting, CLV and real net ROI.

Until these gates pass: internal synthetic/offline research only.
