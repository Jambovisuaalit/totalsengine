# 2026-11-03: first REAL pre-tipoff NBA research forecast bytes + FreeTSA token (NO_GO)

## Attested event and artifacts

**Source:** Existing ESPN scoreboard-based baseline collector, executed in isolated Vercel Sandbox from branch `audit/two-deliverables-2026-11-03` code `f7295d966e2c565e389c0ee7f435fe3f94864165` (the actual source cloned was `5e28cfa526ad070ad31e98b7723e7e2098b2e169`, which includes the same research Python implementation). This is **not** BDL-derived; an attempted separate BDL preview deployment returned HTTP 402 (`api-deployments-free-per-day` limit) and that transient route was removed. Do not infer BDL licensing for this ESPN-based cohort.

**Method:** Existing real `download_day` + `extract` + `forecast` with 38 dated public ESPN NBA scoreboard observations, min history 3, last up to 10 team totals, 48h prospective maximum lead-time (one-off sandbox argument; the scheduled production default remains 36h). Source responses were used in-memory only, not uploaded. `source_availability_verified=false`.

- Frozen host calculation time: **2026-11-03T09:39:08.601802Z**
- Original exact `predictions.jsonl`: **14 genuine future NBA candidate total forecasts**, SHA-256 **`fca6fc731ca185ffd62c01fa90c7205be8a7a1d3b1bcafc7ffd53952f1745ccf`**.
- Signed external FreeTSA RFC 3161 `genTime`: **2026-11-03T09:39:15Z**, BEFORE every claimed scheduled tipoff (first 2026-11-05T00:00Z).
- Exact raw original TSA reply SHA-256 **`116b555f6a37aab0b0feffbecf9051bc18a032f7d695fc94b51ac17fa075a456`**.
- RFC3161 cryptographic re-verification: **PASS** after retrieving each original artifact from this GitHub PR and re-running pinned FreeTSA CA/signer checks and OpenSSL `ts -verify`, parsing signed time and binding to the original JSONL digest.
- Forecast counts: 38 source days, 189 source game rows, 14 future forecasts. No market odds or bets.
- Actual settled score evidence: **NOT YET AVAILABLE/NOT PROCESSED** for these future games.

## Original append-only-intent evidence on PR #26

- `docs/evidence/nba-forward-original-2026-11-03/predictions.jsonl` — ORIGINAL 11,398 forecast JSONL bytes.
- `docs/evidence/nba-forward-original-2026-11-03/manifest.json` — ORIGINAL 3,444-byte source hashes and process metadata; ESPN raw JSON not included.
- `docs/evidence/nba-forward-original-2026-11-03/timestamp-receipt.json` — ORIGINAL 7,944-byte signed timestamp request/reply base64 and audit assertions, hashbound to JSONL.

These files are ordinary GitHub commits, **not WORM**, not independently authenticated provider publication timestamps, and not a rights license. The original source-code branch was not merged to `main`. The original inputs to the model may have been processed before proven upstream availability. GitHub create-only conventions do not prevent privileged history rewriting or deletion.

## Example three future forecasts

| ESPN research ID | Game | Tipoff UTC | Predicted total |
|---|---|---|---|
| 401909922 | PHI @ DET | 2026-11-05T00:00Z | 220.4000 |
| 401909923 | ATL @ WAS | 2026-11-05T00:00Z | 227.8000 |
| 401909924 | MIL @ BOS | 2026-11-05T00:30Z | 235.1222 |

All 14 are stored in original JSONL; selection is not driven by outcomes. Do not import them to a certified cohort or substitute the forecast with later revisions.

## Remaining gates

1. **ESPN source license and availability:** No approved commercial or retention permission, no original upstream publication time for historical features. BDL's separate permissive terms do not transfer to ESPN. A digest alone without raw bytes does not prove what the provider served.
2. **WORM storage:** Not available; signed TSA proof establishes no later than signed time for exact forecast bytes, but GitHub retention/editability is not independent immutable storage.
3. **Independent game-ID and outcome source:** The ESPN fixture IDs have not been independently mapped for these 14 future games to a licensed provider; no independently verified FINAL.
4. **Independent accuracy:** MAE/RMSE on these actual games is **not available** before results; subsequently any calculation based on unresolved rights/evidence remains `PROVISIONAL_FORWARD_PAPER_ONLY`.

**Decision:** `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`. Independent approved cohort remains **0/100**. Temporal forecast-digest attestation succeeded for 14 genuine candidates, but that is **one** attribute and not independent evaluation admission.
