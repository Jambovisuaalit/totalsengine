"""Real PostgreSQL E2E tests: set TEST_DATABASE_URL to a disposable database."""
import json
import os
import tempfile
import unittest
from pathlib import Path

try:
    import psycopg
except ImportError:
    psycopg = None

from odds_ingest.db import import_file

@unittest.skipUnless(psycopg is not None and os.environ.get("TEST_DATABASE_URL"),
                     "requires psycopg and disposable TEST_DATABASE_URL")
class OddsDatabaseE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.conn = psycopg.connect(os.environ["TEST_DATABASE_URL"])
        cls.conn.autocommit = True
        schema = Path(__file__).resolve().parents[1] / "odds_ingest" / "schema.sql"
        cls.conn.execute(schema.read_text())

    @classmethod
    def tearDownClass(cls):
        cls.conn.close()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.file = Path(self.temp.name) / "quotes.json"
        self.source = "test-" + __import__("uuid").uuid4().hex
        self.row = {"provider":"manual","event_id":"e1","sport":"basketball",
                    "market":"total","selection":"over","line":220.5,
                    "decimal_odds":1.91,"observed_at_utc":"2026-11-10T14:00:00Z"}

    def write(self, rows):
        self.file.write_text(json.dumps(rows))

    def test_atomic_idempotent_import(self):
        self.write([self.row, {**self.row,"selection":"under"}])
        first = import_file(self.conn,self.file,self.source)
        second = import_file(self.conn,self.file,self.source)
        self.assertEqual(first["inserted"],2)
        self.assertEqual(second["status"],"duplicate")
        self.assertEqual(self.conn.execute(
            "SELECT count(*) FROM odds_quotes q JOIN odds_import_batches b ON b.id=q.batch_id WHERE b.source=%s",
            (self.source,)).fetchone()[0],2)

    def test_invalid_batch_does_not_write(self):
        self.write([self.row,{**self.row,"decimal_odds":0}])
        with self.assertRaises(ValueError):
            import_file(self.conn,self.file,self.source)
        self.assertEqual(self.conn.execute(
            "SELECT count(*) FROM odds_import_batches WHERE source=%s",
            (self.source,)).fetchone()[0],0)

    def test_transaction_rollback_on_database_error(self):
        self.write([self.row,{**self.row,"selection":"under","period":-999999999999999999999}])
        with self.assertRaises(Exception):
            import_file(self.conn,self.file,self.source)
        self.assertEqual(self.conn.execute(
            "SELECT count(*) FROM odds_import_batches WHERE source=%s",
            (self.source,)).fetchone()[0],0)
