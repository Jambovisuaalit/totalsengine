"""Prevent forecast/settlement Actions from executing a moving research branch.

This checks workflow source configuration only, not real data provenance.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ".github/workflows/nba-forward-collection.yml",
    ".github/workflows/nba-forward-settlement.yml",
]

class TestWorkflowSourceIdentity(unittest.TestCase):
    def test_research_jobs_use_triggering_main_sha(self):
        for name in FILES:
            with self.subTest(workflow=name):
                content = (ROOT / name).read_text(encoding="utf-8")
                self.assertIn("persist-credentials: false", content)
                self.assertNotIn("ref: research/nba-v2-external-evidence-integration", content)
                self.assertIn('test "$GITHUB_REF" = "refs/heads/main"', content)
                self.assertIn('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"', content)
                self.assertIn('HALTED: "1"', content)
                self.assertIn('PUBLICATION_ALLOWED: "false"', content)
                self.assertIn("workflow_dispatch:", content)
                if name.endswith("nba-forward-collection.yml"):
                    # Rights hold: no scheduled or manual collection until licensed source.
                    self.assertNotIn("schedule:", content)
                    self.assertIn("if: ${{ false }}", content)
                else:
                    self.assertIn("schedule:", content)

if __name__ == "__main__":
    unittest.main()
