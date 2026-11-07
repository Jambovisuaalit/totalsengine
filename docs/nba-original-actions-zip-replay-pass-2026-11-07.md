# Original GitHub Actions ZIP replay acceptance — 2026-11-07

**PASS — read-only GitHub Actions replay using real source archives, code at commit `ef4405c5d35f5c49f3cd1920997817e117a889cf`.**

- Live workflow: https://github.com/Jambovisuaalit/totalsengine/actions/runs/42315805654
- Successful job `original-archives`, GitHub job ID `128227974393`.
- Source: three historical original GitHub Actions archive IDs, downloaded by read-only `GITHUB_TOKEN` from GitHub in GitHub Actions and processed entirely in memory using `nba_totals_research.forward_settlement.inspect_artifact`.
- **`41919795738` / `13365429605`**: original ZIP SHA-256 `b82c67f67a687cc5c032d2d34fd83ec6176be3d7c12d045f58cb618414834c6c`, **16** validated forecast rows, PASS.
- **`41724518145` / `13273368881`**: original ZIP SHA-256 `e605bd7f8a82af589225e9138e03db706499a3067fb3915093a655551ad178c4`, **14** validated forecast rows, PASS.
- **`41545696150` / `13189290580`**: original ZIP SHA-256 `0f8a541225f4ab1dcede08d50fc38ab8008b75961c529aeb34874498ef49d223`, **6** validated forecast rows, PASS.
- **Total: 3 original archives, 36 original forecast rows, no unexpected ZIP rejects, no forecast hash mismatch.**
- Test code: `nba_totals_research/original_zip_replay.py`. Workflow: `.github/workflows/nba-original-zip-replay.yml` with read-only `contents:read` and `actions:read`.
- The original archival ZIP files are NOT uploaded into the repository, or another artifact, by the replay job. The older artifact includes provider source raw bytes; rights and retention must be separately reviewed.

## Gate distinctions

This is **evidence of successful archive-reader transport compatibility** on an independent hosted GitHub CI runner, not a claim of a repaired production settlement execution. A post-merge `main`-branch scheduled/manual **full** settlement job must still pass end-to-end before closing that separate gate.

The schema check for `timestamp-receipt.json` matches SHA-256 and signed-time structural claims, but the main ZIP reader is **not** by itself a cryptographic RFC3161 verifier; the frozen 14 cohort was separately verified through the pinned OpenSSL validation. Full material source-rights, WORM, point-in-time feature availability, and independent certified admission remain blocked.

**Safety:** `report_type=PROVISIONAL_FORWARD_PAPER_ONLY`, `source_rights_verified=false`, `worm_verified=false`, `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`, **0/100 independently accepted**.
