# BALLDONTLIE six-game read-only API probe — operator protocol

Code: `scripts/check-bdl-six-games.mjs`; regression: `tests/bdl-six-game-probe.test.mjs`.
This is deliberately **not** official settlement nor independent source admission.

## Secret and invocation

A `BALLDONTLIE_API_KEY` environment variable exists in the project's Vercel Production and Preview configuration, **but presence is not proof of connectivity or permissions**. Vercel env variables are not automatically accessible to this ChatGPT runtime or GitHub Actions. Never paste the key into a GitHub file, log, issue, PR, or frontend code.

In an authorised server-side runtime with the secret injected, run:

```sh
node --test tests/bdl-six-game-probe.test.mjs
BALLDONTLIE_API_KEY="$BALLDONTLIE_API_KEY" BDL_PROBE_OUTPUT=/secure/location/receipt.json node scripts/check-bdl-six-games.mjs
```

Pre-create a private evidence directory and ensure `/secure/location/receipt.json` does not exist (`wx` create only). Never publish this receipt if account terms or identity evidence have not been reviewed. The probe can operate without `BDL_PROBE_OUTPUT` and prints a redacted-information receipt only.

Probe: exact HTTPS `GET https://api.balldontlie.io/v1/games?dates[]=2026-11-02&per_page=100`, authenticated server-side. Reject non-200, JSON errors, oversized responses, pagination, ambiguous matching, duplicate BDL IDs and source data not matching exact ESPN forecast team identities + UTC tipoff. No fallback fuzzy matching. Six game IDs are from frozen GitHub research ledger `forecasts/41429108933.json`. Original predictions remain unchanged.

The digest-only receipt reports original response SHA-256, bytes, **host** retrieval time and mapped BDL IDs, but deliberately discards raw BDL response bytes. Therefore it cannot establish authentic third-party provenance after the fact. If counsel approves retaining originals, use an independently verified immutable source archive, with its own digest/time receipt, and add provider publication timestamps or audited equivalence. Do not retroactively represent today's BDL fetch as pregame evidence for games already finished.

## Acceptance states

- `SCRIPT_READY`: source and synthetic tests exist; no provider response proven.
- `API_ACCESS_CHECKED`: real authenticated provider response checked (with secret kept private), receipt captured.
- `MATCH_CANDIDATES`: six unique exact structural matches, no inference or fabricated IDs.
- `SOURCE_APPROVED`: contractual rights, third-party rights, publication/availability timing and valid evidence chain independently cleared.
- `INDEPENDENT_SETTLEMENT`: forecast pre-tipoff TSA/WORM + approved result receipts, external verifier passes.

The **only** currently justified state is `SCRIPT_READY`. Continue `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`; 0/100 independent cohort.
