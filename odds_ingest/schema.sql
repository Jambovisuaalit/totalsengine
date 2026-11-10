-- Apply in PostgreSQL/Neon using a migration runner.
CREATE TABLE IF NOT EXISTS odds_import_batches (
  id uuid PRIMARY KEY,
  source text NOT NULL,
  filename text NOT NULL,
  sha256 char(64) NOT NULL,
  observed_at_utc timestamptz NOT NULL,
  imported_at_utc timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL CHECK (row_count >= 0),
  UNIQUE(source, sha256)
);
CREATE TABLE IF NOT EXISTS odds_quotes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES odds_import_batches(id),
  provider text NOT NULL,
  event_id text NOT NULL,
  sport text NOT NULL,
  market text NOT NULL,
  period integer NOT NULL DEFAULT 0,
  selection text NOT NULL,
  line numeric,
  decimal_odds numeric(12,5) NOT NULL CHECK (decimal_odds > 1),
  max_stake numeric CHECK (max_stake >= 0),
  observed_at_utc timestamptz NOT NULL,
  provider_updated_at_utc timestamptz,
  status text NOT NULL DEFAULT 'available',
  source_url text,
  raw_quote jsonb NOT NULL,
  quote_sha256 char(64) NOT NULL,
  UNIQUE(batch_id, quote_sha256)
);
CREATE INDEX IF NOT EXISTS odds_quotes_event_time_idx ON odds_quotes(provider,event_id,observed_at_utc DESC);
CREATE INDEX IF NOT EXISTS odds_quotes_market_idx ON odds_quotes(provider,event_id,market,period,selection,observed_at_utc DESC);
