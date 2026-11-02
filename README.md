# TotalsEngine

**TotalsEngine** is an NBA game-totals research and analysis product. Its intended core workflow is **Analyze Game → Review Prediction → Evaluate Market Edge**. Forecasting, accuracy validation and bookmaker-market evaluation are separate evidence gates. There is no verified prospective performance or live betting-edge claim.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | React + TypeScript + Vite web app (currently contains legacy DoctoreAI UI/content requiring product migration) |
| `index.html` | Single valid Vite entry document |
| `public/research-preview.html` | Archived standalone TotalsEngine concept landing; illustrative, not a live data product |
| `nba_totals_research/` | **Independent Python offline evidence/verification module**, not imported by or deployed as the Vite app |
| `tests_nba_totals/` | Python research tests |
| `tests/` | Root configuration/CI tests |
| `docs/` | Research notes and evidence protocol |
| `qa/` | Optional Playwright visual QA tools |

**Important:** The React UI originates from a different DoctoreAI implementation; changing repository metadata does **not** mean that all React screens, routes, copy, or integrations have been migrated to TotalsEngine. Audit/replace those separately before advertising the app as a finished TotalsEngine experience. Do not treat the legacy DoctoreAI URL as a TotalsEngine production deployment.

## Local web app

Requires Node.js 22 and npm. Vite is the production build system (not a no-build static site).

```bash
npm ci
cp .env.example .env.local
# Set valid public Supabase URL and publishable key in .env.local
npm run dev
npm run lint
npm test
npm run build
```

Required public environment variables:
- `VITE_SUPABASE_URL` — HTTPS URL of the selected Supabase project.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — client-safe publishable/anon key.

`VITE_SUPABASE_PROJECT_ID` is optional metadata. Never use a Supabase service-role key in the frontend. The web app validates at startup, and the Vite build fails fast if required values are missing or malformed. Values for deployment must be provided in Vercel project settings. CI uses **non-production placeholders** solely to verify compilation; this does not test live Supabase connectivity.

## Deployment

The root `vercel.json` configures the Vite build to `dist/` and sends SPA routes to `index.html`; static assets are served directly. The optional static preview remains in `public/research-preview.html`. Do not claim a green deployment until Vercel actually completes the build and smoke checks.

## Research boundary

`nba_totals_research/` is a standalone Python module for offline NBA totals evidence, audit gates and synthetic paper evaluation. It is **not** a FastAPI backend, not called from the browser, not packaged into the Vite bundle, and not evidence of live forecasts. Its dependencies and tests are managed separately.

```bash
python3 -m pip install "cryptography==46.0.4"
python3 -m unittest discover -s tests_nba_totals -p 'test_*.py' -v
```

Do not run research scripts with real provider feeds or publish calculated market edges unless licensing, timestamp provenance, model artifact integrity, independent evidence archiving, and verification gates are satisfied. Retrospective simulations must be labeled as such.

## CI

`.github/workflows/root-ci.yml` runs npm clean install, environment checks, ESLint, Node tests and Vite production build. A separate Python test job validates the isolated research module. Existing specialized research and visual-QA workflows remain independent. Any pre-existing lint errors will block CI instead of being silently suppressed.

## Status

- Web repository: mixed legacy UI, **not yet product-migrated**
- Root configuration/verification: implemented in this PR; check CI run before merge
- Historical accuracy: retrospective research only; independently evidenced prospective results **not yet available**
- Market comparison and production betting: **NO-GO** pending genuine timestamped odds and forward evidence.
