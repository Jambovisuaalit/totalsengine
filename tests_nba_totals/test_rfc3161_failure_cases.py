"""Fail-closed RFC3161 cases with deterministic OpenSSL/network mocks."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from nba_totals_research.rfc3161_timestamp import timestamp_digest

D = "a" * 64

class TimestampFailureCases(unittest.TestCase):
    def exercise(self, failure):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            ca = root / "ca.pem"
            ca.write_text("test CA")
            class Response:
                status = 200
                def geturl(self): return "https://tsa.example"
                def read(self, n): return b"malformed" if failure == "malformed" else b"mocked-token"
                def __enter__(self): return self
                def __exit__(self, *a): return False
            class Opener:
                def open(self, req, timeout): return Response()
            def run(args, **kwargs):
                if "-query" in args:
                    (root / "request.tsq").write_bytes(b"mocked-request")
                    return subprocess.CompletedProcess(args, 0)
                if "-verify" in args:
                    raise subprocess.CalledProcessError(1, args, stderr=(failure + " certificate or token").encode())
                raise AssertionError("Verification must fail before metadata extraction")
            with patch("nba_totals_research.rfc3161_timestamp.subprocess.run", side_effect=run), patch(
                "nba_totals_research.rfc3161_timestamp.build_opener", return_value=Opener()
            ):
                with self.assertRaises(subprocess.CalledProcessError):
                    timestamp_digest(D, root, tsa_url="https://tsa.example", ca_file=ca)
            self.assertFalse((root / "timestamp-audit.json").exists())

    def test_expired_certificate_rejected(self): self.exercise("expired")
    def test_ca_mismatch_rejected(self): self.exercise("CA mismatch")
    def test_malformed_response_rejected(self): self.exercise("malformed")
    def test_wrong_digest_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):
                timestamp_digest("bad", Path(t), tsa_url="https://tsa.example", ca_file=Path(t)/"ca.pem")

if __name__ == "__main__":
    unittest.main()
