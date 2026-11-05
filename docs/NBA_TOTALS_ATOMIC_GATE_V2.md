> Scope: **RESEARCH CONTRACT / prototype scope**. Requirements apply to the named component. Old current-state, dependency and deployment observations are superseded.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# Evidence Collector v2 — transactional final gate (OFFLINE ONLY)

The `atomic_gate_v2.py` component is an **SQLite dry-run audit**, not a
public signal publisher, bookmaker order sender, remote verifiable
event-log service or full distributed transaction.

- Opens `BEGIN IMMEDIATE` to serialize local kill switch read,
  fresh Ed25519 proof validation, idempotency check and audit insert.
- Initial `policy_control.halted=1`, fail-closed. The API exposes
  `activate_kill_switch()`, **never an unhalt method**.
- When a local operator forcibly clears the kill flag (only done
  inside synthetic tests), invalid or absent signed evidence still
  yields `BLOCKED_MISSING_EVIDENCE`.
- Even if externally anchored signed proofs *would* pass a synthetic
  dry-run, the only possible status is
  `DRY_RUN_ELIGIBLE_NO_PUBLISH`. **No outgoing HTTP, email,
  Telegram, webhook, bet placement or customer alert exists.**
- Uses request-id idempotency to prevent duplicate local audit records;
  different paper assessment with same ID is rejected.
- Missing or corrupted receipt integrity causes a rejected transaction;
  no unchecked path to status `PUBLISHED` exists.
- Local DB restricts file mode 0600. This is NOT a production DB,
  remote WORM archive or secure append-only third-party attestation.

The audit never claims 100% publishing compliance when no signals
were actually published: denominator=0, rate=null. The metric
`published_without_verified_evidence=0` is currently a safety
invariant of a **disabled publisher**, not evidence of real-world
release readiness.

## Production transition requires separate work

A real publisher requires: authorized/well-scoped provider grants,
external immutable timestamp/receipt anchors, independently provisioned
trust roots with revocation, signed bookmaker-accepted stakes and odds,
independent OOS model validation, a remotely enforced kill switch,
and atomic DB state + outbox insertion. The external dispatch worker
must revalidate the final proofs immediately before send, record
actual sends and settlements, and halt on missing/revoked evidence.
No such service or approvals exist in this repository.

The two remaining V2 requirements that cannot be simulated into
real existence are provider-side legal rights and bookmaker acceptance.
Do not claim licensed collection or bet-execution confirmation from
test keys. Do not merge this Draft PR into current broken Vercel main.
