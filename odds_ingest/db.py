"""Atomic PostgreSQL ingest. Requires psycopg 3; no connection until invoked."""
import hashlib
import json
import uuid
from pathlib import Path
from .ingest import parse

def import_file(connection, path, source):
    path = Path(path)
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    quotes = parse(raw, path.name)  # validate entire batch before DB transaction
    if not source or not source.strip():
        raise ValueError("source required")
    # psycopg connection.transaction() guarantees rollback on any failed statement.
    with connection.transaction():
        with connection.cursor() as cur:
            cur.execute(
                """INSERT INTO odds_import_batches
                   (id, source, filename, sha256, observed_at_utc, row_count)
                   VALUES (%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (source,sha256) DO NOTHING RETURNING id""",
                (str(uuid.uuid4()), source, path.name, digest,
                 max((q["observed_at_utc"] for q in quotes), default="1970-01-01T00:00:00Z"),
                 len(quotes)))
            inserted = cur.fetchone()
            if inserted is None:
                return {"status": "duplicate", "inserted": 0, "sha256": digest}
            batch_id = inserted[0]
            count = 0
            for quote in quotes:
                cur.execute(
                    """INSERT INTO odds_quotes
                    (batch_id,provider,event_id,sport,market,period,selection,line,
                     decimal_odds,max_stake,observed_at_utc,provider_updated_at_utc,
                     status,source_url,raw_quote,quote_sha256)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (batch_id,quote_sha256) DO NOTHING""",
                    (batch_id,quote["provider"],quote["event_id"],quote["sport"],
                     quote["market"],quote["period"],quote["selection"],quote["line"],
                     quote["decimal_odds"],quote["max_stake"],quote["observed_at_utc"],
                     quote["provider_updated_at_utc"],quote["status"],quote["source_url"],
                     json.dumps(quote["raw_quote"],ensure_ascii=False),quote["quote_sha256"]))
                count += cur.rowcount
            return {"status": "imported", "inserted": count, "sha256": digest}

def main():
    import argparse
    import os
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--source", required=True)
    args = ap.parse_args()
    import psycopg
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        ap.error("DATABASE_URL required")
    with psycopg.connect(dsn) as conn:
        print(json.dumps(import_file(conn,args.input,args.source)))

if __name__ == "__main__":
    main()
