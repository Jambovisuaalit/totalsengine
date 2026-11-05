# AWS-free evidence: GitHub OIDC + Sigstore

## Decision
Use existing **public** GitHub Actions + short-lived OIDC and `actions/attest@v4`.
The public Sigstore transparency log anchors the attested **digest**; there is no AWS
account, secret, new SaaS account or manual CLI procedure.

### Automatic branch canary
The `.github/workflows/nba-no-aws-sigstore.yml` workflow is triggered by push
to `feat/no-aws-sigstore-evidence-*`. It generates synthetic FINAL-like source
bytes, writes a content-addressed JSON manifest, verifies the local hash chain,
requests keyless Sigstore attestation, verifies it using
`gh attestation verify`, then uploads an artifact with seven-day retention.
The job fails if attestation or verification fails.

Expected acceptance evidence: workflow ID + commit SHA, the exact manifest SHA,
Sigstore verification success and transparency-log inclusion proof/bundle.
No attestation-success claim is valid before this workflow finishes successfully.

### Boundaries
- **Not WORM**: GitHub workflow artifacts can expire or be deleted. Public
  Sigstore transparency proves a signed assertion about a hash existed, but
  cannot restore deleted raw bytes.
- **Not original-source availability evidence**: this canary uses only synthetic
  bytes and does not ingest ESPN or odds. Only raw bytes actually captured
  before feature cutoff can be proven. User-provided reconstructed timestamps
  never qualify.
- **Not production activation**: prospective real NBA collector remains
  disabled until source rights, canonical mapping, original source timestamps,
  independent actual kickoff, retention risk and a model/OOS policy pass.
- **No private data in transparency logs**: public manifests should expose
  only safe digests; identifiers/metadata may leak information if included.

### Future real-event architecture (separate gated change)
Freeze original authorized source bytes, create a manifest of SHA-256 hashes,
attest only the manifest using the public GitHub OIDC identity, and keep
private bytes in a retention-appropriate system. On every use, require
original bytes + verified attestation + cutoff chronology + authoritative
event state. Do not call GitHub Actions artifacts immutable storage.

### Existing AWS acceptance path
Supersedes the operational need for PR #30, which is closed unmerged.
This is a narrower cryptographic proof of existence, not equivalent to
S3 COMPLIANCE Object Lock.
