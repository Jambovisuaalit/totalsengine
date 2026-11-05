# ORL @ PHO — independently signed forward research forecast, 2026-11-05

**Status: EXTERNAL_RFC3161_TIMESTAMP_VERIFIED / RESEARCH_ONLY / EVALUATION_NOT_ELIGIBLE / NO_GO**

## Live execution receipt

- Execution: Vercel Sandbox `totalsengine-orl-pho-forecast-20261105`, session `sbx_rMpqSToKK3IbYA7hutF17mNGN206`, working directory from source SHA `0fc85aff147c155a4ed87d44477a51bf056cc4d0` (main at sandbox clone).
- Model: `nba_totals_research.scheduled_paper_collector`, `rolling-team-total-v1`, data source `ESPN_SCOREBOARD_UNVERIFIED`.
- Collection: `2026-11-05T03:31:58.718702Z`; 38 scoreboard-day responses processed in memory (205 parsed games, two forecasts). No raw ESPN payload uploaded here.
- Game source ID: `401909936`, away `orl`, home `phx`, tipoff `2026-11-06T02:00:00Z`.
- **Expected total: 227.95 points**.
- Exact record `record_sha256`: `2662d9f0ed925670e2f5de39a3a76ffe6d1e9e0e4a8d7cdce7727b410035b9bb`.
- Original **two-record** JSONL SHA256: `cc5ff67683c3c138a2c8bd8d5b9232cd89e78b316cb1cb916e57a67de8d5a580`.
- FreeTSA RFC3161 `signed_gen_time_utc`: **`2026-11-05T03:32:24Z`**, earlier than tipoff. Token binds the **batch** SHA256, NOT the single row in isolation.
- Original signed receipt SHA256: `e60fb7d47d68cd0574bdd0a160eaf8f4461a8d8a3e0d992516d4ce202df7265d`.
- Files copied without modification into this draft branch:
  - `docs/evidence/polymarket-orl-pho-2026-11-05/predictions.jsonl`
  - `docs/evidence/polymarket-orl-pho-2026-11-05/manifest.json`
  - `docs/evidence/polymarket-orl-pho-2026-11-05/timestamp-receipt.json`
- After GitHub upload, a separate readback `cmp` verified **byte-for-byte equality** of all three files against original sandbox originals; readback SHA256s: JSONL `cc5ff676...`, manifest `b4e15ac948086cb1e5475ef296ca881d8e62d9cb9ef10de1c6e87bf3fc001ec7`, receipt `e60fb7d47d68cd0574bdd0a160eaf8f4461a8d8a3e0d992516d4ce202df7265d`.
- Reconstructed RFC3161 TSQ and TSR from **GitHub-readback** JSON, fetched trust certificates with pinned SHA256, and executed `openssl ts -verify -queryfile request.tsq -in response.tsr -CAfile ca.pem -untrusted signer.pem`. Result: **`Verification: OK`**. Parsed token `genTime` matched `2026-11-05T03:32:24Z`.

## Restrictions

- A real externally signed **forecast-batch** timestamp has now been verified; earlier assertion that no ORL–PHO forecast existed is superseded for this new run.
- ESPN access is NOT a right to commercial use or long-term data retention; original feature-source publication timestamps are unverified. Derived forecast evidence cannot cure that gap.
- No WORM Object Lock archive or independently authenticated source scheduling has been verified. GitHub is NOT immutable WORM.
- Polymarket US live BBO for this same game was inspected previously but **NOT independently pregame TSA timestamped**. Need a separate exact-market LIVE_CAPTURE receipt before tipoff; historical backfill cannot fill this gap.
- No out-of-sample probability distribution or EV has been validated. No bet, no deployment, no commercial claim.
- `evaluation_eligible=false`, `publication_allowed=false`, independently verified cohort remains **0/100**, project **NO_GO**.
