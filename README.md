# TotalsEngine

**Current status and release scope:** [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).
**Document scopes:** [docs/DOCUMENT_INDEX.md](docs/DOCUMENT_INDEX.md).

**TotalsEngine** is an NBA game-totals research and analysis product. Its intended core workflow is **Analyze Game → Review Prediction → Evaluate Market Edge**. Forecasting, accuracy validation and bookmaker-market evaluation are separate evidence gates. There is no verified prospective performance or live betting-edge claim.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | React + TypeScript + Vite web app (currently contains legacy DoctoreAI UI/content requiring product migration) |
| `index.html` | Single valid Vite entry document |
| `public/research-preview.html` | Archived standalone TotalsEngine concept landing; illustrative, not a live data product |
| `nba_totals_research/` | **Independent Python research module**: offline evidence contracts plus scheduled paper collection/settlement; not imported by the Vite app |
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
npm run typecheck
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

`nba_totals_research/` is a standalone Python research module: offline evidence/audit primitives and separate network-backed provisional collection/settlement workflows. It is **not** a FastAPI backend, not called from the browser, not packaged into the Vite bundle, and its presence alone is not proof of a successful deployed forecast run. Its dependencies and tests are managed separately.

```bash
python3 -m pip install "cryptography==46.0.4"
python3 -m unittest discover -s tests_nba_totals -p 'test_*.py' -v
```

Do not run research scripts with real provider feeds or publish calculated market edges unless licensing, timestamp provenance, model artifact integrity, independent evidence archiving, and verification gates are satisfied. Retrospective simulations must be labeled as such.

## CI

`.github/workflows/root-ci.yml` runs npm clean install, environment checks, ESLint, explicit TypeScript check, Node tests and Vite production build. A separate Python test job validates the isolated research module. Existing specialized research and visual-QA workflows remain independent. Any pre-existing lint errors will block CI instead of being silently suppressed.

## Status

- Web release: explicit TotalsEngine research routes; legacy UI retained in source but unmounted
- Root configuration/verification: build and regression checks implemented; require same-commit CI and staging smoke before release
- Historical accuracy: retrospective research only; independently evidenced prospective results **not yet available**
- Market comparison and production betting: **NO-GO** pending genuine timestamped odds and forward evidence.

## Telegram webhook deployment

Outgoing commands require a durable shared replay store. See
[TELEGRAM_REPLAY_PROTECTION.md](docs/TELEGRAM_REPLAY_PROTECTION.md) for server-only
environment variables, staging checks and uncertain-send handling. This branch
does not provision that store or activate a production deployment.
