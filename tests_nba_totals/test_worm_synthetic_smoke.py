"""Mock tests cannot substitute for live AWS Object Lock smoke evidence."""
import hashlib
import unittest
from datetime import datetime, timezone, timedelta
from nba_totals_research.worm_synthetic_smoke import run_smoke, SYNTHETIC_PREFIX

NOW = datetime(2026,11,3,12,tzinfo=timezone.utc)

class Body:
    def __init__(self, data): self.data=data
    def read(self): return self.data

class FakeS3:
    def __init__(self, *, locked=True, versioned=True, tamper=False):
        self.locked=locked; self.versioned=versioned; self.tamper=tamper; self.writes=0
    def get_object_lock_configuration(self, **kwargs):
        return {"ObjectLockConfiguration":{"ObjectLockEnabled":"Enabled" if self.locked else "Disabled"}}
    def get_bucket_versioning(self, **kwargs):
        return {"Status":"Enabled" if self.versioned else "Suspended"}
    def put_object(self, **kwargs):
        self.writes+=1
        assert kwargs["ObjectLockMode"]=="COMPLIANCE"
        assert kwargs["IfNoneMatch"]=="*"
        assert kwargs["Body"].startswith(SYNTHETIC_PREFIX)
        self.upload=kwargs
        return {"VersionId":"immutable-test-version-1"}
    def get_object_retention(self, **kwargs):
        return {"Retention":{"Mode":"COMPLIANCE","RetainUntilDate":self.upload["ObjectLockRetainUntilDate"]}}
    def get_object(self, **kwargs):
        return {"Body":Body(b"tampered" if self.tamper else self.upload["Body"])}

class SmokeTests(unittest.TestCase):
    def kwargs(self, client):
        return dict(client=client, bucket="totalsengine-test-bucket",
                    confirmed_bucket="totalsengine-test-bucket",acknowledge_immutable=True,
                    retention_days=2,now=NOW,nonce="a"*32)
    def test_mock_compliance_receipt_is_explicitly_not_nba_evidence(self):
        c=FakeS3()
        r=run_smoke(**self.kwargs(c))
        self.assertEqual(c.writes,1)
        self.assertEqual(r["version_id"],"immutable-test-version-1")
        self.assertEqual(r["mode_readback_verified"],"COMPLIANCE")
        self.assertEqual(r["retain_until_requested_utc"],(NOW+timedelta(days=2)).isoformat())
        self.assertFalse(r["evaluation_eligible"])
        self.assertFalse(r["publication_allowed"])
        self.assertEqual(r["gate_status"],"NO_GO")
    def test_never_write_without_confirmation(self):
        c=FakeS3()
        for patch in ({"acknowledge_immutable":False},
                      {"confirmed_bucket":"other-test-bucket"},
                      {"retention_days":30}):
            kw=self.kwargs(c); kw.update(patch)
            with self.assertRaises(ValueError):run_smoke(**kw)
        self.assertEqual(c.writes,0)
    def test_object_lock_and_versioning_required(self):
        for c in (FakeS3(locked=False),FakeS3(versioned=False)):
            with self.assertRaises(ValueError):run_smoke(**self.kwargs(c))
            self.assertEqual(c.writes,0)
    def test_corrupted_readback_rejected(self):
        c=FakeS3(tamper=True)
        with self.assertRaises(ValueError):run_smoke(**self.kwargs(c))
        self.assertEqual(c.writes,1)

if __name__=="__main__":
    unittest.main()
