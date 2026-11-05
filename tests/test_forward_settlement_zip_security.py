"""Regression checks for fail-closed GitHub Actions ZIP entry validation."""
import io
import unittest
import zipfile
from datetime import datetime, timedelta, timezone

from nba_totals_research.forward_settlement import inspect_artifact


def archive_with(name, *, directory=False, mode=None):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as z:
        entry = zipfile.ZipInfo(name)
        if mode is not None:
            entry.create_system = 3
            entry.external_attr = mode << 16
        z.writestr(entry, b"" if directory else b"x")
    return stream.getvalue()


def run():
    now = datetime.now(timezone.utc)
    return {
        "path": ".github/workflows/nba-forward-collection.yml",
        "head_branch": "main",
        "status": "completed", "conclusion": "success",
        "created_at": (now - timedelta(minutes=3)).isoformat(),
        "updated_at": now.isoformat(), "id": 123,
    }


class SafeZipEntryTests(unittest.TestCase):
    def test_known_empty_directory_passes_entry_gate(self):
        # Missing manifest should be the next error, not an unsafe ZIP entry.
        with self.assertRaises(KeyError):
            inspect_artifact(archive_with("source_snapshots/", directory=True),
                             run(), artifact_name="nba-paper-123")

    def test_unknown_directory_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsafe or unexpected"):
            inspect_artifact(archive_with("other/", directory=True),
                             run(), artifact_name="nba-paper-123")

    def test_path_traversal_is_rejected(self):
        for name in ("../manifest.json", "/manifest.json",
                     "source_snapshots/../../manifest.json",
                     "source_snapshots\\2026-11-05.json"):
            with self.subTest(name=name):
                with self.assertRaisesRegex(ValueError, "Unsafe or unexpected"):
                    inspect_artifact(archive_with(name), run(),
                                     artifact_name="nba-paper-123")

    def test_symlink_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsafe or unexpected"):
            inspect_artifact(archive_with("manifest.json", mode=0o120777),
                             run(), artifact_name="nba-paper-123")

    def test_unexpected_file_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsafe or unexpected"):
            inspect_artifact(archive_with("unexpected.json"), run(),
                             artifact_name="nba-paper-123")


if __name__ == "__main__":
    unittest.main()
