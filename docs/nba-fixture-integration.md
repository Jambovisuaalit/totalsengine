# NBA fixture connector and prediction-evidence gate

## Current state

The React `/analysis` route requests `GET /api/nba/game?id=<BALLDONTLIE_ID>`. This Vercel Node function uses the server-only `BALLDONTLIE_API_KEY` secret to request `https://api.balldontlie.io/v1/games/<ID>`.

Provider response is schema-checked. The normalized response contains game ID, date, UTC tipoff, teams, status, provider and retrieval timestamp; it intentionally omits scores. A valid provider response is evidence of a **fixture lookup**, not historical provenance or independently authenticated model predictions.

Configure `BALLDONTLIE_API_KEY` only as a **server** Vercel environment secret after obtaining lawful access. Never prefix it with `VITE_`, commit it, or print it. Missing key returns HTTP 503 and `FIXTURE_PROVIDER_NOT_CONFIGURED`. Unauthorized and rate-limited provider responses fail closed; no local synthetic fallback.

Provider docs: https://docs.balldontlie.io/
Terms checked: https://www.balldontlie.io/terms.html (2026-10-20)
Commercial and downstream-use compliance remains an operating responsibility. A provider-supplied fixture is not a guarantee that later changes to start time cannot occur.

## Prediction evidence status

The independent research code is still not connected to a real production prediction archive. `server/prediction-evidence.mjs` checks structural pregame constraints for a future prediction envelope, including UTC timestamp ordering and SHA-256-form artifact references.

**Structural validity is not cryptographic proof.** It always returns `STRUCTURE_ONLY` (or `BLOCKED`) and never `VERIFIED`. Real verification must validate external trusted timestamp tokens, immutable artifact retention, source snapshots, event matching and model identity before the UI may display accuracy claims. Do not infer a prediction from outcome or closing odds.

## Acceptance tests

- Unit tests use only synthetic/official-documentation example fixtures; no live provider access.
- Real connector acceptance: configure server key, receive an HTTP 200 game with independently checked ID and kickoff, verify the key is absent from browser network output.
- Evidence acceptance: obtain one independently verified pre-tipoff forecast → game result record (1/1), then start the prospective sample counter.
- Until these gates pass, no market edge, ROI or prediction is displayed.

This endpoint is intended for Vercel Functions, not the plain Vite development server. For local end-to-end testing, use a configured Vercel development environment rather than assuming `vite` proxies `/api`.

Rate limits, bot protection and caching should be reviewed before exposing a high-volume public lookup endpoint.
