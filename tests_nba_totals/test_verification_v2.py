"""Synthetic v2 Ed25519 checks; private keys exist only inside ephemeral tests."""
import base64
import json
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from nba_totals_research.collector import _synthetic, capture
from nba_totals_research.core import ConditionalModel, assess
from nba_totals_research.verification_v2 import (
    Authority, Envelope, REQUIRED, POLICY, assess_bundle, sha, verify_envelope,
)

NOW = datetime(2026, 11, 2, 10, tzinfo=timezone.utc)
RECEIVED = NOW
T = NOW + timedelta(seconds=1)


class V2VerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / "evidence"
        self.raw = _synthetic(NOW)
        self.written = capture(self.raw, self.root, source_mode="SYNTHETIC",
                               clock=lambda: NOW)
        self.receipt = Path(self.written["private_receipt"])
        self.r = json.loads(self.receipt.read_bytes())
        self.q = self.r["quote"]
        self.p = __import__("nba_totals_research.collector", fromlist=["_parse_quote"])._parse_quote(self.raw, NOW)
        model = ConditionalModel("test-synthetic-no-real-validation", Decimal("0.1"),
                                 {220: Decimal("0.8"), 230: Decimal("0.2")},
                                 {240: Decimal("1")})
        # Original synthetic quote @1.93 may be negative EV; use an artificial
        # model with enough Over probability to produce a synthetic paper candidate.
        model = replace(model, p_total_no_overtime={220: Decimal("0.2"), 230: Decimal("0.8")})
        self.paper = assess((self.p,), model, assessed_at=NOW)
        self.assertEqual(self.paper.status, "PAPER_CANDIDATE")
        self.keys = {}
        self.roots = {}
        subjects = {"timestamp": "external-witness", "source": "licensed-feed",
                    "rights": "FI", "execution": self.q["book"],
                    "model": "validator", "publisher": "research-org"}
        for role, subject in subjects.items():
            private = Ed25519PrivateKey.generate()
            self.keys[role] = private
            self.roots[(role, role+"-testkey")] = Authority(
                role=role, key_id=role+"-testkey", issuer="distinct-"+role,
                subject=subject, public_key_raw=private.public_key().public_bytes(
                    Encoding.Raw, PublicFormat.Raw),
                valid_from=NOW-timedelta(days=1), valid_until=NOW+timedelta(days=1))
        self.fingerprint = sha({"receipt": self.written["receipt_sha256"],
                                "payload": self.r["payload_sha256"], "quote": self.q})
        self.claims = self._claims()

    def tearDown(self):
        self.temp.cleanup()

    def _claims(self):
        common = {"fingerprint_sha256": self.fingerprint,
                  "issued_at": T.isoformat(),
                  "expires_at": (NOW+timedelta(minutes=1)).isoformat()}
        return {
            "timestamp": dict(common, attested_at=T.isoformat(),
                              anchor_id="synthetic-witness-1",
                              receipt_sha256=self.written["receipt_sha256"],
                              raw_response_sha256=self.r["payload_sha256"]),
            "source": dict(common, source_id="licensed-feed",
                           provider_quote_id=self.q["provider_quote_id"],
                           raw_response_sha256=self.r["payload_sha256"],
                           provider_published_at=self.q["claimed_provider_published_at_utc"]),
            "rights": dict(common, source_id="licensed-feed", book=self.q["book"],
                           jurisdiction="FI", use="COMMERCIAL_BETTING_SIGNALS",
                           retention_allowed=True, redistribution_allowed=True,
                           contract_id="synthetic-test-contract"),
            "execution": dict(common, acceptance_status="ACCEPTED",
                              book=self.q["book"], provider_quote_id=self.q["provider_quote_id"],
                              accepted_at=T.isoformat(), accepted_stake="25",
                              accepted_odds=self.q["decimal_odds"],
                              confirmation_id="synthetic-test-acceptance"),
            "model": dict(common, model_version=self.paper.model_version,
                          paper_sha256=self.paper.evidence_sha256,
                          report_sha256="b"*64, out_of_sample=True, no_lookahead=True,
                          calibration_vs_market_pass=True),
            "publisher": dict(common, authorized=True, policy=POLICY,
                              jurisdiction="FI", publisher_id="offline-test"),
        }

    def sign(self, role, claims=None):
        claims = claims if claims is not None else self.claims[role]
        envelope = Envelope(role, role+"-testkey", claims, "")
        sig = self.keys[role].sign(envelope.signed_bytes())
        return replace(envelope, signature_b64=base64.b64encode(sig).decode())

    def all_proofs(self):
        return {role: self.sign(role) for role in self.keys}

    def check(self, proofs=None, *, roots=None, now=T):
        return assess_bundle(
            self.root, self.receipt, self.paper, proofs or self.all_proofs(),
            self.roots if roots is None else roots,
            now=now, source_id="licensed-feed", jurisdiction="FI")

    def test_all_synthetic_signed_roles_would_validate_but_no_publish(self):
        result = self.check()
        self.assertTrue(all(result.checks.values()), result.missing)
        self.assertTrue(result.cryptographic_dry_run_eligible)
        self.assertEqual(result.verdict, "NO_GO")
        self.assertFalse(result.publication_allowed)
        self.assertFalse(result.externally_anchored_storage_verified)

    def test_no_roots_fail_all_external_evidence(self):
        r = self.check(roots={})
        self.assertFalse(r.cryptographic_dry_run_eligible)
        self.assertEqual(r.verdict, "NO_GO")
        self.assertFalse(r.checks["PRE_TIPOFF_ATTESTED"])

    def test_missing_one_proof_fails_its_gate(self):
        for role in self.keys:
            with self.subTest(role=role):
                proofs = self.all_proofs()
                proofs.pop(role)
                r = self.check(proofs)
                self.assertFalse(r.cryptographic_dry_run_eligible)

    def test_tampered_signature_fails(self):
        proofs = self.all_proofs()
        proofs["rights"] = replace(proofs["rights"], signature_b64="AAAA")
        r = self.check(proofs)
        self.assertFalse(r.checks["DATA_RIGHTS_APPROVED"])

    def test_unsigned_rights_claim_change_fails(self):
        proofs = self.all_proofs()
        old = proofs["rights"]
        proofs["rights"] = replace(
            old, claims=dict(old.claims, redistribution_allowed=True,
                             contract_id="changed-without-resign"))
        self.assertFalse(self.check(proofs).checks["DATA_RIGHTS_APPROVED"])

    def test_wrong_role_key_fails(self):
        proofs = self.all_proofs()
        proofs["rights"] = replace(proofs["source"], role="rights")
        self.assertFalse(self.check(proofs).checks["DATA_RIGHTS_APPROVED"])

    def test_revoked_key_fails(self):
        root = self.roots[("timestamp", "timestamp-testkey")]
        roots = dict(self.roots, **{}) 
        roots[("timestamp", "timestamp-testkey")] = replace(root, revoked=True)
        self.assertFalse(self.check(roots=roots).checks["PRE_TIPOFF_ATTESTED"])

    def test_fake_nonindependent_shared_issuer_rejected(self):
        roots = dict(self.roots)
        src = roots[("source", "source-testkey")]
        roots[("source", "source-testkey")] = replace(src, issuer="distinct-timestamp")
        self.assertFalse(self.check(roots=roots).checks["PRE_TIPOFF_ATTESTED"])

    def test_licensing_must_cover_jurisdiction_and_redistribution(self):
        for k, value in [("jurisdiction", "UK"), ("redistribution_allowed", False),
                         ("retention_allowed", False), ("use", "PERSONAL_ONLY")]:
            with self.subTest(key=k):
                proofs = self.all_proofs()
                proofs["rights"] = self.sign("rights", dict(self.claims["rights"], **{k:value}))
                self.assertFalse(self.check(proofs).checks["DATA_RIGHTS_APPROVED"])

    def test_no_accepted_price_or_stake_cannot_pass(self):
        for k, value in [("accepted_odds", "1.91"), ("accepted_stake", "0"),
                         ("acceptance_status", "AVAILABLE"), ("confirmation_id", "")]:
            with self.subTest(key=k):
                proofs = self.all_proofs()
                proofs["execution"] = self.sign("execution", dict(self.claims["execution"], **{k:value}))
                self.assertFalse(self.check(proofs).checks["EXECUTION_VERIFIED"])

    def test_outdated_accepted_execution_fails(self):
        proofs = self.all_proofs()
        proofs["execution"] = self.sign("execution", dict(
            self.claims["execution"], accepted_at=(NOW-timedelta(seconds=70)).isoformat()))
        self.assertFalse(self.check(proofs).checks["EXECUTION_VERIFIED"])

    def test_no_calibration_or_lookahead_check_fails(self):
        for k in ("calibration_vs_market_pass", "no_lookahead", "out_of_sample"):
            with self.subTest(key=k):
                proofs = self.all_proofs()
                proofs["model"] = self.sign("model", dict(self.claims["model"], **{k:False}))
                self.assertFalse(self.check(proofs).checks["INDEPENDENT_MODEL_VALIDATED"])

    def test_expired_attestation_fails(self):
        proofs = self.all_proofs()
        proofs["rights"] = self.sign("rights", dict(
            self.claims["rights"], expires_at=(NOW-timedelta(seconds=1)).isoformat()))
        self.assertFalse(self.check(proofs).checks["DATA_RIGHTS_APPROVED"])

    def test_attestation_for_other_quote_fails(self):
        proofs = self.all_proofs()
        proofs["execution"] = self.sign("execution", dict(
            self.claims["execution"], fingerprint_sha256="c"*64))
        self.assertFalse(self.check(proofs).checks["EXECUTION_VERIFIED"])

    def test_late_now_blocks_market(self):
        r = self.check(now=NOW+timedelta(minutes=3))
        self.assertFalse(r.checks["EXACT_MARKET_MATCH"])
        self.assertFalse(r.cryptographic_dry_run_eligible)


if __name__ == "__main__":
    unittest.main()
