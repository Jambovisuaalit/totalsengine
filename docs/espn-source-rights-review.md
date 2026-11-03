> Scope: **DATED SNAPSHOT / historical observation**. Counts, execution status and deployment observations apply only to the stated snapshot.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# ESPN read-only research source: rights and evidence status

Status: **RIGHTS REVIEW REQUIRED — NO COMMERCIAL USE APPROVED**.

- Source: ESPN public NBA scoreboard endpoint, accessed by one unauthenticated GET.
- Observed: 2026-11-02, 15 event records; observation digest recorded in GitHub Actions #41408758528.
- Permission to access an endpoint does **not** imply permission to retain, redistribute, publish, or commercialize its contents.
- No ESPN licensing agreement, authorized data feed, terms approval, or redistribution grant has been verified.
- Research probe stores the raw JSON in a temporary private runner directory for immediate digest verification only, deletes it before job completion, and never uploads it as an artifact or commits it.
- Only minimal provenance metadata (digest, timestamp, byte count, event count) is logged.
- RFC3161 verifier is **implemented but not activated**: an independently approved TSA endpoint and pinned trust bundle are required; no independent timestamp evidence is claimed.
- None of these observations satisfies source, rights, execution, model, or publisher authorization gates. Publication and wagers remain halted.

Before expanding storage or use: review ESPN's applicable API/site terms with counsel, establish contractual scope (access, retention, redistribution, jurisdiction), document lawful basis and retention, and enroll an approved independent TSA trust root. Until then, retain no raw provider responses beyond the single isolated process lifetime.
