# NBA evidence admission: four gates (2026-11-05)

## Current decision

HOLD. Original forecast bytes are recoverable and their RFC3161 signatures verify; that does not establish point-in-time source correctness, immutable retention, canonical cross-provider identity or OOS admission.

| Gate | Finding | Admission |
|---|---|---|
| Source leakage / availability | 3 Nov target forecasts reference 58 team-game history inputs; 4 Nov targets reference 59. None has retained original source bytes plus authenticated pre-feature-cutoff availability proof in the recovered bundles. These are lineage references, not independent games. | 0/58 and 0/59 proven; POINT_IN_TIME_NOT_PROVEN |
| Forecast versions | Both batches remain intact. No historical primary version is chosen. Future policy is externally timestamped and stored under docs/evidence/version-policy-2026-11-05. | Future only; runtime integration pending |
| Real archive test | No AWS credential/profile, target bucket or boto3 is configured in this execution environment. No live storage test was performed. | REAL_ARCHIVE_TEST_NOT_RUN |
| Event identity | Canonical registry lookup is by provider + source event ID. Participant display order is ignored; explicit home/away conflicts and ambiguous mappings reject. | Real cross-provider mapping still needs source evidence |

## Source-history audit

`history_leakage_audit.json` records each required team/source-game lineage reference for both original target cohorts. Original generation timestamps are used only as a generous upper audit bound: the collector did not retain a precise features_as_of timestamp for these rows. Missing provenance is not proof of observed leakage. A 48-hour lag, current download, reconstructed response, model source hash or forecast TSA token cannot prove what the historical provider served before feature creation. Re-fetching the ESPN endpoint now is not accepted as the original response.

`admission_protocol.history_audit` requires every used source version's exact original bytes/hash, source ID, fetched time, completion time, immutable version reference and authenticated external time proof no later than the feature cutoff. A trusted verifier must independently verify those references and semantic bindings. Row booleans are not proof. This function only reports history completeness and never grants OOS or publication eligibility.

## Predeclared future version policy

- Policy ID: nba-forward-version-v1.
- Applies to scheduled starts on/after 2026-11-06T00:00:00Z (6 Nov 02:00 Helsinki).
- Freeze each event's first recorded scheduled start and an absolute selection cutoff **60 minutes before it** in a prospectively attested event record.
- Choose the latest originally created prediction that has verified acceptance evidence strictly before that frozen cutoff. Both creation and attestation must precede acceptance and cutoff.
- Missing accepted versions produce no selection. Equal latest creation times across different predictions reject. Conflicting duplicate prediction IDs reject.
- Schedule changes do not move the frozen cutoff retrospectively. Early-start conflicts quarantine the observation. Actual kickoff, OOS, source rights and archive evidence remain separate admission requirements.
- Historical 5 Nov games cannot use this rule retrospectively. Do not select the best fitting version after seeing outcomes. All versions remain preserved.

Exact policy SHA-256: `6203c712d1b16af065976d1be981686923242d628d2480db86454467a3a25060`.

RFC3161 signed genTime: `2026-11-05T03:12:24Z` (05:12:24 Helsinki). The signature was independently reverified directly against exact policy bytes with pinned FreeTSA trust hashes. This precommits the policy bytes; it is not a WORM-storage claim or activation of the scheduled collector. `select_version` still requires separately verified policy, per-event cutoff and per-prediction acceptance proofs. The verifier callback must validate actual cryptographic/retention receipts; it must not copy self-reported `verified=true` fields.

## Canonical event identity

The following crosswalk is a **candidate**, not authenticated mapping admission. It is retained to identify exactly what source evidence must be verified. A matching date/team label is not enough to approve it.

| Canonical candidate | NBA ID | ESPN ID | Pinnacle ID | Away | Home |
|---|---|---|---|---|---|
| nba:0022600184 | 0022600184 | 401909933 | 1639488937 | DAL | SAS |
| nba:0022600185 | 0022600185 | 401909934 | 1639482768 | LAL | SAC |
| nba:0022600186 | 0022600186 | 401909935 | 1639482788 | MIA | LAC |

Display-first never means home. `canonical_market_key` verifies registry evidence, provider-specific event IDs, canonical identity and participant membership. A reversed display list is allowed; conflicting explicit roles reject. Cross-provider registry entries sharing a canonical ID must agree on home/away IDs. Join key includes canonical event ID, period, market type, subject team ID, selection and exact decimal line. Spread selections require team IDs, not indices. Unsupported markets, ambiguous mappings, duplicate keys and mismatched periods/lines cannot silently join. Current historical crosswalk remains unapproved until authenticated mapping source bytes are available.

## Real archive acceptance test

Current preflight found no AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, AWS_PROFILE, NBA_EVIDENCE_BUCKET, S3_BUCKET or ODDS_API_KEY in this runtime, and no boto3. This does not prove credentials are absent from every deployment; no remote credentials were enumerated or modified.

Use an existing owned test bucket with versioning + Object Lock enabled and a configured SDK/identity. Run the existing `worm_synthetic_smoke` CLI against the exact confirmed bucket. The payload may be a clearly labeled synthetic marker; the **S3 call, server receipt, retention check and byte read-back must be real**. Required evidence: bucket/key/version ID, UTC write receipt/LastModified, COMPLIANCE retention horizon, original bytes SHA-256 and matching bytes read back by exact version ID. Record test time, storage account/region and approved destination configuration without exposing credentials. A mock receipt cannot pass this gate. No deletion, policy relaxation or new credential grants are needed for the test.

Command after the existing destination/identity is configured:

```bash
python -m nba_totals_research.worm_synthetic_smoke \
  --bucket <confirmed-test-bucket> \
  --confirm-bucket <confirmed-test-bucket> \
  --ack-immutable-write --retention-days 2
```

An immutable COMPLIANCE write cannot be removed before expiry. No bucket was selected, no write was performed and no irreversible retention was imposed in this run. The actual target must be supplied before the command can be executed. Production acceptance additionally requires a real future-event bundle capture and authenticated actual-start verification; storage smoke alone never grants source/OOS eligibility.

## Implementation and validation

PR #29 adds admission_protocol.py and 11 targeted tests alongside the earlier capture/archive module. 36 available local tests pass (11 new admission tests, 21 capture/archive tests and 4 storage-smoke tests). The new tests exercise missing/late/revised source observations, retrospective policies, frozen cutoff mutation, original-metadata substitution, ambiguous latest versions, order-independent canonical joins, wrong IDs/roles and exact line/period separation. External proof callbacks in unit tests are explicitly synthetic. The existing scheduled collector is not wired to these new gates, and no new market collection is claimed. CI results for the final commit are recorded in the PR.
