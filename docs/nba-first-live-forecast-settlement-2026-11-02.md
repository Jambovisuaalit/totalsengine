> Scope: **DATED SNAPSHOT / historical observation**. Counts, execution status and deployment observations apply only to the stated snapshot.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# First real GitHub Actions forward paper run — 2026-11-02

**Status:** actual GitHub Actions collection and reconciliation workflows executed successfully; **no game has settled yet**.

## Forecast collection

- GitHub Actions run: https://github.com/Jambovisuaalit/totalsengine/actions/runs/41429108933
- Branch: main, push smoke-test event.
- Start of host-generated forecast manifest: 2026-11-02T10:28:43.956612+00:00.
- Source: live ESPN scoreboard REST responses (rights/availability not independently authenticated).
- 38 source-day snapshots, 187 parsed recognized NBA games, 15 rolling-total point forecasts.
- SHA-256 of `predictions.jsonl`: `4793f76f1d05509eb0eb1ac831b801c3933a541653f748c2d209ae3ba5e11e83`.
- Artifact: `nba-paper-41429108933` (ID 13132568594), 372,564 bytes, non-expired at verification, expiration 2026-12-02T10:28:49Z.
- The initial live attempt 41428860223 failed on ESPN team abbreviation LON. Research code was fixed to exclude non-NBA participants without inventing mappings, then CI passed and the new run succeeded.

## Settlement verification

- GitHub Actions run: https://github.com/Jambovisuaalit/totalsengine/actions/runs/41429505527
- Branch: main, push smoke-test event.
- 15 forecast rows read; 15 unique; 0 duplicate; 0 result identity mismatches.
- 0 scored, 15 pending (games had not finished as of 2026-11-02T10:31:54.199809+00:00).
- `mae=null`, `rmse=null` (correct, no result can be fabricated).
- Artifact: `nba-settlement-41429505527` (ID 13132394629), 666 bytes, non-expired at verification, expiration 2026-12-02T10:31:56Z.
- The initial settlement run 41429246378 failed with HTTP 401 due to forwarding GitHub bearer authentication to signed blob redirect. Fixed by using authenticated GitHub API only for redirect and a second unauthenticated signed-URL request; CI passed then live run succeeded.

## Ongoing collection

- Default-branch workflows scheduled at 16:15 UTC (forecast), 17:45 UTC (settlement); both have manual `workflow_dispatch`.
- Temporary `push` smoke-test triggers removed after the successful runs.
- No AWS, separate account, bookmaker credentials, trades, EV or ROI.
- GitHub artifact retention is 30 days: **not permanent, immutable, or independently TSA-verified**.
- `HALTED=1`; `PUBLICATION_ALLOWED=false`; independently verified count **0/100**; `NO_GO`.
