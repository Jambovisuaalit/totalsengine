import io
import json
import unittest
from nba_totals_research.polymarket_global_readonly import (
    ALLOWED, WALLET, fetch_public, run, validate_wallet
)


class FakeResponse:
    status = 200
    def __init__(self, request, body):
        self.url = request.full_url
        self.data = json.dumps(body).encode()
    def geturl(self):
        return self.url
    def read(self, n):
        return self.data[:n]
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False


def fake_open(request, timeout=15):
    assert request.get_method() == "GET"
    assert not request.has_header("Authorization")
    assert "polymarket.us" not in request.full_url
    if "/public-profile" in request.full_url:
        body = {"proxyWallet": WALLET}
    elif "/events" in request.full_url:
        body = [{"id": "sample"}]
    else:
        body = 1793866000
    return FakeResponse(request, body)


class ReadonlyGlobalTests(unittest.TestCase):
    def test_public_wallet_address(self):
        self.assertEqual(validate_wallet(WALLET), WALLET)
        with self.assertRaises(ValueError):
            validate_wallet("secret-or-invalid")

    def test_allowlisted_only(self):
        with self.assertRaises(ValueError):
            fetch_public("post_order", opener=fake_open)

    def test_all_public_endpoints_without_secrets(self):
        report = run(opener=fake_open)
        self.assertEqual(len(report["results"]), 3)
        self.assertTrue(all(v["status"] == "PASS" for v in report["results"]))
        self.assertEqual(report["gate_status"], "NO_GO")
        self.assertFalse(report["authenticated"])
        self.assertFalse(report["rights_verified"])
        self.assertFalse(report["trading_enabled"])
        self.assertFalse(report["raw_payload_retained"])

    def test_global_only(self):
        self.assertEqual(set(ALLOWED), {"gamma_events", "gamma_profile", "clob_server_time"})


if __name__ == "__main__":
    unittest.main()
