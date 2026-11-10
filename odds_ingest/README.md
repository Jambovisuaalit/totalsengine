# Offline odds ingest (CSV/JSON)
No bookmaker API, credentials, scraping, or network calls.

Run: `python3 -m odds_ingest.ingest input.csv --output normalized.json`
Or: `python3 odds_ingest/ingest.py input.json --output normalized.json`

JSON input is an array of quotes or an object with `quotes` array. CSV headers use the same keys.
Required: provider, event_id, sport, market, selection, decimal_odds, observed_at_utc.
Optional: period, line, max_stake, provider_updated_at_utc, status, source_url.
All timestamps must include a timezone. Decimal odds must be >1.
Raw quotes and SHA-256 hashes are preserved in normalized output.
Database schema: `odds_ingest/schema.sql` (PostgreSQL / Neon).
This phase provides validated offline import and DDL, **not** database insertion, a production API, or a live feed.
Tests: `python3 -m unittest tests_nba_totals.test_odds_ingest -v`.
