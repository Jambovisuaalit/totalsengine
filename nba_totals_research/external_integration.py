"""Fail-closed boundary for external evidence integration testing.

This module deliberately has no networking, bookmaker, or publisher interface.
External evidence must be obtained out-of-band by separately authorized issuers.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

from .verification_v2 import Authority, Envelope, ROLES


@dataclass(frozen=True)
class IntegrationBoundary:
    environment: str = "isolated_test"
    halted: bool = True
    publication_allowed: bool = False
    bookmaker_wagers_allowed: bool = False

    def assert_safe(self) -> None:
        if (self.environment != "isolated_test" or not self.halted
                or self.publication_allowed or self.bookmaker_wagers_allowed):
            raise ValueError("External integration requires HALTED isolated test mode")


def validate_external_inputs(
    roots: Mapping[tuple[str, str], Authority],
    envelopes: Mapping[str, Envelope],
    *,
    boundary: IntegrationBoundary = IntegrationBoundary(),
) -> tuple[str, ...]:
    """Preflight only. Never promotes a signed claim into external independence."""
    boundary.assert_safe()
    missing = []
    for role in ROLES:
        envelope = envelopes.get(role)
        if envelope is None:
            missing.append(role)
            continue
        root = roots.get((role, envelope.key_id))
        if (root is None or root.revoked or root.role != role
                or not root.issuer or not root.subject):
            missing.append(role)
    issuers = [roots[(role, envelopes[role].key_id)].issuer
               for role in ROLES if role not in missing]
    if len(issuers) != len(set(issuers)):
        raise ValueError("External issuers must be independent")
    return tuple(missing)
