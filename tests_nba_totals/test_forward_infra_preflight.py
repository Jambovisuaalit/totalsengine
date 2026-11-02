import tempfile
import unittest
from pathlib import Path
from nba_totals_research.forward_infra_preflight import check

class FakeS3:
    def get_object_lock_configuration(self, Bucket):
        return {"ObjectLockConfiguration": {"ObjectLockEnabled": "Enabled"}}

class TestInfraPreflight(unittest.TestCase):
    def test_empty_config_blocks(self):
        report = check({})
        self.assertEqual(report["status"], "BLOCKED")
        self.assertEqual(report["gate_status"], "NO_GO")
        self.assertFalse(report["publication_allowed"])
    def test_s3_presence_is_not_independent_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "ca.pem"
            p.write_text("not-an-approved-ca")
            cfg = {"tsa_url": "https://tsa.example.test", "tsa_ca_file": str(p),
                   "s3_bucket": "research-archive"}
            report = check(cfg, s3_client=FakeS3())
            self.assertEqual(report["status"], "BLOCKED")
            self.assertEqual(report["independently_verified_prediction_count"], 0)
            self.assertIn("PASS_CONFIG", [x["status"] for x in report["checks"]])
    def test_unsafe_tsa_url_blocks(self):
        report = check({"tsa_url": "http://tsa.test", "tsa_ca_file": "/none"})
        self.assertEqual(report["status"], "BLOCKED")

if __name__ == "__main__":
    unittest.main()
