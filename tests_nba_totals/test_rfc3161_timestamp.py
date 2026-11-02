"""Fail-closed tests: no external TSA request or provider data needed."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from nba_totals_research.rfc3161_timestamp import timestamp_digest

D = "a" * 64

class RFC3161Tests(unittest.TestCase):
    def test_invalid_digest_rejected_before_network(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):
                timestamp_digest("not-a-sha", Path(t), tsa_url="https://tsa.example", ca_file=Path(t) / "ca.pem")

    def test_non_https_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):
                timestamp_digest(D, Path(t), tsa_url="http://tsa.example", ca_file=Path(t) / "ca.pem")

    def test_missing_ca_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):
                timestamp_digest(D, Path(t), tsa_url="https://tsa.example", ca_file=Path(t) / "ca.pem")

    def test_failed_verification_never_returns_verified(self):
        import subprocess
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            ca = root / "ca.pem"
            ca.write_text("TEST ONLY")
            def fake_run(args, **kwargs):
                if "-query" in args:
                    (root / "request.tsq").write_bytes(b"request")
                    return None
                raise subprocess.CalledProcessError(1, args)
            class FakeResponse:
                status = 200
                def geturl(self): return "https://tsa.example"
                def read(self, n): return b"invalid-timestamp-response"
                def __enter__(self): return self
                def __exit__(self, *args): return False
            class FakeOpener:
                def open(self, request, timeout): return FakeResponse()
            with patch("nba_totals_research.rfc3161_timestamp.subprocess.run", side_effect=fake_run), patch("nba_totals_research.rfc3161_timestamp.build_opener", return_value=FakeOpener()):
                with self.assertRaises(subprocess.CalledProcessError):
                    timestamp_digest(D, root, tsa_url="https://tsa.example", ca_file=ca)

if __name__ == "__main__":
    unittest.main()
