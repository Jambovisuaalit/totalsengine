# AWS S3 Object Lock synthetic smoke — execution gate (2026-11-03)

**Code:** `nba_totals_research/worm_synthetic_smoke.py`; **synthetic mock tests:** `tests_nba_totals/test_worm_synthetic_smoke.py`.

## Approval gate

No AWS account or bucket connection is available to this ChatGPT session. The availability of an S3-*compatible* object store (e.g. Railway) does not establish support for **AWS S3 Object Lock COMPLIANCE**, bucket versioning or irreversible per-version retention. **Do not substitute compatibility for a real AWS acceptance receipt.** No bucket is created and no object is written by authoring this document.

AWS Object Lock COMPLIANCE is immutable during the lock period, including to AWS account root. A bucket must have Object Lock enabled and versioning; irreversible retention requires account owner approval and cost/retention confirmation. Run the following ONLY in an owner-confirmed **dedicated synthetic testing bucket**, with a least-privilege AWS role and billing alert.

## Real live execution (once approved)

```bash
# dry synthetic mock tests first:
python3 -m unittest tests_nba_totals.test_worm_synthetic_smoke -v

# In AWS environment with an approved ephemeral role:
# IMPORTANT: this call PERMANENTLY locks a new random test object version
# until the specified time (minimum 2 days in this smoke).
python3 -m nba_totals_research.worm_synthetic_smoke \
  --bucket YOUR_APPROVED_TEST_BUCKET \
  --confirm-bucket YOUR_APPROVED_TEST_BUCKET \
  --ack-immutable-write \
  --retention-days 2
```

No API keys are written into the repository. The program obtains AWS credentials through the normal boto3 credential chain; use a scoped role or workload identity, not hardcoded keys. Do not pass source datasets or user data. The object body is literal synthetic data plus a cryptographically random nonce. The object key starts with `totalsengine-worm-synthetic-smoke/`.

### Required IAM actions for the scoped test role

Allow only target testing bucket and prefix as appropriate: `s3:GetBucketObjectLockConfiguration`, `s3:GetBucketVersioning`, `s3:PutObject`, `s3:PutObjectRetention`, `s3:GetObjectRetention`, `s3:GetObjectVersion`; region and account should be fixed. Deny any production bucket and other key prefixes. Verify actual AWS IAM policy against the desired API actions before issuing the role.

### Expected receipt and limitations

- Exact bucket name, synthetic key and returned `VersionId`.
- Server-reported `ObjectLockMode=COMPLIANCE` and `RetainUntilDate` at least equal to the requested two-day retention.
- Readback of the exact version's original bytes with matching SHA-256.
- Confirmed bucket Object Lock and versioning settings.
- No delete or bypass attempt.
- `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`.

The current helper `put_object_lock()` returns the requested retention in its call, but does not include the server-observed retention value separately in its receipt; the live raw AWS API result must also be preserved in a restricted evidence register if independent review requires server-side retention evidence. This test itself is **not a full NBA forecast→FINAL provenance check** and never upgrades the cohort from `0/100`.

### Source rights

The BDL account's usage and storage permission, third-party rights, and the original ESPN historical-input rights are not independently approved. Do **not** put those real source bytes into COMPLIANCE storage while the rights review is pending. The synthetic WORM smoke can be assessed separately.
