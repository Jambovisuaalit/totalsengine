# BALLDONTLIE authenticated six-game identity probe — 2026-11-03

**Execution:** Vercel Preview Function, project `prj_gMkLueZ0GUoWSVhYmf9P6TGSMsAJ`, branch `audit/two-deliverables-2026-11-03`, deployed SHA `42dbb04920959d015b368192ca9429f886690753`; request through authenticated Vercel deployment fetch, HTTP 200. This document records the provider API receipt fields returned by the probe; raw provider response is **not archived**.

- Provider query: `GET https://api.balldontlie.io/v1/games?dates[]=2026-11-02&per_page=100`.
- Provider response: HTTP `200`, 13,290 bytes.
- Retrieved at Vercel host UTC: `2026-11-03T08:54:37.673Z` (host time only, **not a provider-signed availability timestamp**).
- Raw response SHA-256: `a6159a9fa5a8ea2089a6e336ffbb33084b8e8c30b3a8702879fd35bf0ed18027`.
- Results: **six of six exact structural matches**, no duplicates, all on game date 2026-11-02.

| Claimed ESPN ID | Away @ home | Expected scheduled UTC | Actual BDL ID | Status |
|---|---|---|---|---|
| 401909907 | OKC @ CLE | 2026-11-03 00:00Z | 21718012 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |
| 401909908 | DET @ CHA | 2026-11-03 00:30Z | 21718013 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |
| 401909909 | ATL @ IND | 2026-11-03 00:30Z | 21718014 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |
| 401909910 | BKN @ NYK | 2026-11-03 00:30Z | 21718015 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |
| 401909911 | WAS @ ORL | 2026-11-03 00:30Z | 21718016 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |
| 401909912 | CHI @ PHI | 2026-11-03 00:30Z | 21718017 | EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED |

**Evidence classification:** Authenticated API query and structurally exact cross-provider identity mapping verified at **retrieval time**. Response bytes intentionally discarded to avoid unresolved raw-data retention scope; digest cannot prove later content without original bytes or signed provider record. No provider signature, original upstream publication timestamp, independent TSA signature, immutable WORM archival proof, or independently approved FINAL settlement verified.

**Admission:** `source_rights_verified=false`, `upstream_publication_time_verified=false`, `independent_timestamp_verified=false`, `original_response_archived=false`, `evaluation_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`, independently verified cohort `0/100`.

A temporary branch-limited diagnostic endpoint `api/internal/bdl-six-game-probe.ts` was used for this one execution. Remove it from the PR head after recording the receipt, and avoid merging it to main. Historical pregame evidentiary deficiencies cannot be retroactively corrected by this postgame source retrieval.
