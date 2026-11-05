# NBA real-source intake: activation gate (no AWS)

The prior PR #31 proves GitHub OIDC/Sigstore can sign and verify a **synthetic** manifest. This change implements a fail-closed contract for real historical NBA source bytes. It **does not activate** any provider.

## Required input to `freeze_source`
- The original raw response bytes, never a freshly re-fetched approximation of a historical response.
- A canonical event and source record identifier; observed PRE_GAME state and its original response bytes.
- `fetched_at_utc <= collected_at_utc <= features_as_of_utc <= prediction_created_at_utc < scheduled_start_utc`.
- An independently reviewed, endpoint-scoped rights record with capture, raw retention and public digest-attestation permissions and a bounded validity interval.
- Exact SHA-256 + sizes of original bytes. The output remains `HOLD`, including `signature_verified=false` and `actual_start_verified=false`.

## Trust boundary
An application-supplied timestamp is **not** an independent timestamp. For an actual eligible historical-feature chain, the source needs to be fetched within the attested workflow and the bytes must remain available to reproduce the model features. Attest the digest of the original response and manifest with the successful GitHub OIDC/Sigstore path before feature use. A GitHub Actions artifact is deletable and provides no WORM retention guarantee. Provider first publication is not inferred from the scrape timestamp.

The existing scheduled ESPN collector explicitly labels source rights and source availability unverified and does not retain original response bytes. It must NOT be silently wired into this contract; no ESPN rights are approved by this PR. Odds providers, model OOS, authoritative actual kickoff, and market timestamps are separate approvals.

## Activation decision
No provider has been approved in the repository. Provider rights, allowed endpoints, raw retention policy, actual event-state source, and the immutable-or-risk-accepted raw-byte lifecycle must be independently reviewed. No provider is called, no real odds or NBA data is fetched, no bet is placed, and no +EV is produced by this change.

The new module is tested with synthetic test-only approval records; those records are not production licenses. PR stays draft until the required legal and technical evidence is available.
