# Frozen 14 NBA pregame forecasts — provisional FINAL matching checkpoint (2026-11-03)

## Original independent-timestamp evidence

- Freeze path: `docs/evidence/nba-forward-original-2026-11-03/`.
- 14 original genuine forward forecasts; model: `rolling-team-total-v1`, source: `ESPN_SCOREBOARD_UNVERIFIED`.
- Exact original JSONL SHA-256: `fca6fc731ca185ffd62c01fa90c7205be8a7a1d3b1bcafc7ffd53952f1745ccf`.
- Signed FreeTSA RFC3161 UTC time: `2026-11-03T09:39:15Z`. The original earlier report separately confirmed this signature against the pinned CA chain.
- Earliest scheduled match: **2026-11-05 00:00 UTC**; earliest acceptable 6h delayed outcome check for any game: **2026-11-05 06:00 UTC**.
- Zero independently admitted evaluation records (`0/100`).

## Executed now, before any game

On 2026-11-03T09:56:42Z the new `nba_totals_research.frozen_nov03_settlement` checked the exact original bytes and 14 rows and emitted an actual research-only report:
```json
{
  "report_type": "PROVISIONAL_FORWARD_PAPER_ONLY",
  "n_input_forecasts": 14,
  "n_unique_forecasts": 14,
  "n_duplicates_discarded": 0,
  "n_scored": 0,
  "n_pending": 14,
  "n_identity_mismatches": 0,
  "mae": null,
  "rmse": null,
  "mean_error": null,
  "independently_verified_count": 0,
  "outcome_source_rights_verified": false,
  "independent_game_id_cross_provider_verified": false,
  "worm_verified": false,
  "evaluation_eligible": false,
  "publication_allowed": false,
  "gate_status": "NO_GO"
}
```
No result-service network calls were made because no original game had reached its finalization threshold.

## Later manually runnable evaluation (not deployed)

```bash
HALTED=1 PUBLICATION_ALLOWED=false PYTHONPATH=. python3 -m \
  nba_totals_research.frozen_nov03_settlement \
  --output /secure/research-provisional-2026-11-05 \
  --verify-tsa
```

The optional `--verify-tsa` re-fetches pinned FreeTSA trust certificates and performs an independent OpenSSL signature/imprint verification. The endpoint fetches ESPN date-scoped results into memory (exact ESPN game ID plus home, away, original UTC tipoff; no invented BDL IDs). It refuses conflicting identity, rejects missing or non-FINAL games, requires >=6h from kickoff, and reports only scored denominator, pending and mismatched counts, MAE/RMSE when genuine final rows actually exist. Original forecast bytes are never rewritten and original provider result JSON is not archived. Because the use rights and source timing are unresolved, this is *provisional research*, not a licensed official outcome or independently accepted model accuracy.

**Important identity distinction:** ESPN→ESPN exact-game matching is implemented and synthetically tested. ESPN→BALLDONTLIE matching for these specific 14 games is **NOT VERIFIED** (BDL API is credentialed and this specific mapping has not been queried). The six previously verified ESPN↔BDL IDs are *different games* and do not establish these 14 IDs.

## Regression evidence

- Six offline tests in `tests_nba_totals/test_frozen_nov03_settlement.py` PASS locally in an isolated Vercel Python 3.13 Sandbox: exact 14, 14/14 pending before start, missing final remains pending, one synthetic final produces mechanical provisional arithmetic, changed tipoff excluded, altered original JSONL fails.
- Vercel Sandbox's entire unrelated Python test suite may not run because its Python 3.13 image lacks the `_sqlite3` extension; GitHub CI's Python environment is the authoritative complete-suite gate.
- This is draft PR #26; no unattended job or production workflow activated, and no future result is claimed before the games.

**Policy:** No external official settlement, no wagering, no publication, no verified MAE claims, no WORM. `PROVISIONAL_FORWARD_PAPER_ONLY` and `NO_GO` until explicit independent acceptance.
