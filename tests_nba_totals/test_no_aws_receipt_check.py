import hashlib
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from nba_totals_research.no_aws_receipt_check import validate_receipt


class ReceiptChecks(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        d = Path(self.tmp.name)
        self.manifest = d / "manifest.json"
        self.report = d / "verified.json"
        self.manifest.write_bytes(b'{"synthetic":true}')
        h = hashlib.sha256(self.manifest.read_bytes()).hexdigest()
        self.record = [{
            "verificationResult": {
                "statement": {"subject": [{"name": "manifest.json",
                    "digest": {"sha256": h}}]},
                "signature": {"certificate": {"issuer": "github"}},
                "verifiedTimestamps": [{"type": "transparencyLog", "timestamp": "2026-11-05T01:00:00Z"}]
            },
            "attestation": {"verificationMaterial": {"tlogEntries": [{
                "logIndex": "7", "inclusionProof": {"checkpoint": "synthetic"}
            }]}}
        }]

    def check(self):
        self.report.write_text(json.dumps(self.record))
        return validate_receipt(self.manifest, self.report, commit_sha="a"*40)

    def test_full_receipt_passes_synthetic_structure(self):
        self.assertEqual(self.check()["verification_status"], "PASS_SYNTHETIC_ONLY")

    def test_reject_wrong_digest(self):
        self.record[0]["verificationResult"]["statement"]["subject"][0]["digest"]["sha256"] = "0"*64
        with self.assertRaises(ValueError): self.check()

    def test_reject_missing_transparency_log(self):
        self.record[0]["attestation"]["verificationMaterial"]["tlogEntries"] = []
        with self.assertRaises(ValueError): self.check()

    def test_reject_unsigned_timestamp(self):
        self.record[0]["verificationResult"]["verifiedTimestamps"] = []
        with self.assertRaises(ValueError): self.check()

    def test_reject_missing_certificate(self):
        self.record[0]["verificationResult"]["signature"]["certificate"] = None
        with self.assertRaises(ValueError): self.check()


if __name__ == "__main__":
    unittest.main()
