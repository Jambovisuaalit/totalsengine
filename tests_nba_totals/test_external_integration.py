"""Offline integration boundary regression tests; no network or publishing."""
import unittest

from nba_totals_research.external_integration import (
    IntegrationBoundary, validate_external_inputs,
)
from nba_totals_research.verification_v2 import ROLES


class ExternalIntegrationBoundaryTests(unittest.TestCase):
    def test_default_is_halted(self):
        boundary = IntegrationBoundary()
        boundary.assert_safe()
        self.assertFalse(boundary.publication_allowed)
        self.assertFalse(boundary.bookmaker_wagers_allowed)

    def test_all_unsafe_modes_rejected(self):
        unsafe = (
            IntegrationBoundary(halted=False),
            IntegrationBoundary(publication_allowed=True),
            IntegrationBoundary(bookmaker_wagers_allowed=True),
            IntegrationBoundary(environment="production"),
        )
        for boundary in unsafe:
            with self.subTest(boundary=boundary):
                with self.assertRaises(ValueError):
                    boundary.assert_safe()

    def test_missing_external_evidence_never_passes(self):
        self.assertEqual(validate_external_inputs({}, {}), ROLES)

    def test_preflight_refuses_unhalted_environment(self):
        with self.assertRaises(ValueError):
            validate_external_inputs({}, {}, boundary=IntegrationBoundary(halted=False))


if __name__ == "__main__":
    unittest.main()
