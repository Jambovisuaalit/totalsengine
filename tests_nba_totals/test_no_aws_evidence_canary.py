import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from nba_totals_research.no_aws_evidence_canary import create, verify


class NoAwsCanaryTests(unittest.TestCase):
    def test_fresh_bytes_verify_and_replay(self):
        with TemporaryDirectory() as root:
            p = Path(root) / "original"
            create(p, "42", "deadbeef")
            first = verify(p)
            self.assertTrue(first["local_integrity_verified"])
            self.assertEqual(first["gate"], "HOLD")
            self.assertFalse(first["sigstore_verified"])
            self.assertFalse(first["worm_storage"])

    def test_altered_bytes_or_manifest_fail_closed(self):
        with TemporaryDirectory() as root:
            p = Path(root) / "original"
            create(p, "42", "deadbeef")
            (p / "source.json").write_bytes(b"tampered")
            with self.assertRaises(ValueError):
                verify(p)

    def test_cannot_claim_external_evidence(self):
        with TemporaryDirectory() as root:
            p = Path(root) / "original"
            create(p, "42", "deadbeef")
            manifest = json.loads((p / "manifest.json").read_bytes())
            manifest["worm_retention_verified"] = True
            (p / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaises(ValueError):
                verify(p)

    def test_no_existing_directory_overwrite(self):
        with TemporaryDirectory() as root:
            p = Path(root) / "original"
            create(p, "42", "deadbeef")
            with self.assertRaises(FileExistsError):
                create(p, "43", "cafebabe")


if __name__ == "__main__":
    unittest.main()
