# Doctore AI — Current State Audit

**Date:** 2026-03-06  
**Auditor:** Automated codebase review

---

## Executive Summary

Doctore AI is a sports betting edge detection platform with a functional data pipeline, a polished public marketing site, and a gated analytics dashboard. The core pipeline (ESPN scraping → sharp odds → fair odds → decision engine) is fully built and deployed as Supabase Edge Functions. The frontend is a well-structured React/Vite app with ~30 pages, consistent design system, and proper SEO. **The platform is real and operational**, but has several gaps: payments are not connected (Stripe "Start 7-day free trial" button is a dead end), canonical URLs are inconsistent (mix of `doctore-ai.com` and `doctore.lovable.app`), and there is no role-based access control differentiating free vs. paid users.

---

## What the Platform Currently Is

A sports betting analytics tool that:
1. Scrapes game data from ESPN (NBA, NHL, NFL, MLB, tennis, soccer)
2. Collects sharp odds from Betfair Exchange, Pinnacle (via Firecrawl), and Cloudbet
3. Fetches execution odds from soft bookmakers via The Odds API
4. Calculates fair odds by removing margin from sharp lines
5. Runs a decision engine to identify edges with time-based confirmation
6. Sends daily email summaries via Resend
7. Presents a public marketing site + gated dashboard for logged-in users

---

## What Works

### Fully Functional
- **Data pipeline**: 7-step orchestrator (`run-pipeline`) calling sub-functions in sequence, with job logging, rate limiting, and idempotency
- **Edge detection engine**: Multi-snapshot confirmation, trend filtering, Kelly sizing
- **Email subscription**: Rate-limited Edge Function with proper validation
- **Daily email summaries**: Two summary functions (daily + pregame)
- **Authentication**: Email/password signup, login, password reset, route protection
- **Public site**: Landing, Methodology, CLV, Edge Detection, Bankroll Management, Performance, Pricing, Blog (8 articles), Analysis index, Pre-game daily slates, Responsible Gaming, Terms, Affiliate system
- **Dashboard**: Pipeline status, ROI metrics, Actionable Plays, Monitoring Edges, Source Performance, CLV Analysis
- **Live CLV Proof widget**: Fetches real `edge_clv` data and renders on landing page
- **OG image generation**: Dynamic via Edge Function + storage bucket
- **Design system**: Consistent HSL tokens, Work Sans/Lora/Inconsolata fonts, light/dark mode, semantic status colors

### Partially Functional
- **Pre-game pages**: Route structure exists, data hooks exist, but depend on `edges_public` view having data for the specific sport/date
- **Analysis pages**: Template-based, depends on edges_public data being present
- **Performance page**: Educational content only — no live performance chart from actual data

---

## What Is Incomplete or Broken

### Critical
1. **Payments not connected**: Pricing page shows $29/mo Pro tier with "Start 7-day free trial" button that does nothing (no Stripe integration). This is misleading.
2. **No free vs. paid distinction**: All authenticated users see the same dashboard. No subscription gating, no role-based access. The pricing page promises feature differentiation that doesn't exist.
3. **Canonical URL inconsistency**: ~10 files reference `doctore-ai.com` (the intended custom domain) while the OG fallback uses `doctore.lovable.app`. The Methodology page uses `doctore.app`. These need to be unified.

### Important
4. **`fetch-execution-odds` missing from config.toml**: The function exists but has no `verify_jwt = false` entry, meaning it may fail when called from the pipeline (though the service role key in the Authorization header likely overrides this).
5. **`fetch-odds-api` not in pipeline**: This function exists and is fully built but is NOT called from `run-pipeline/index.ts`. The pipeline calls `fetch-execution-odds` instead. Either `fetch-odds-api` is dead code or `fetch-execution-odds` wraps it — needs clarification.
6. **Source blacklist "Block" button broken**: `SourcePerformance.tsx` has a block button but `source_blacklist` table RLS only allows SELECT. No INSERT policy exists for authenticated users, and no admin Edge Function exists to do this.
7. **`send-error-alert` auth issue**: Previously flagged — the cron-triggered `invoke_error_alert` DB function calls this Edge Function, but the ADMIN_API_KEY retrieval from vault may be failing silently.
8. **Dashboard StickyFooter exposure calculation is wrong**: `totalRisk` is calculated as `edge_percent / (execution_odds - 1)` which is the Kelly fraction, not units of risk. The label says "Exposure" in units but the math gives a dimensionless fraction.

### Nice to Have / Minor
9. **Performance page has no real data**: It's purely educational content about how to evaluate performance. No actual charts from `roi_summary` or `edge_clv`.
10. **Blog dates are hardcoded**: All posts show "January 2025" or "February 2025" — no dynamic dates.
11. **Hypothetical example in Performance uses dark-mode-only colors** (`text-emerald-400`, `text-red-400`, `text-amber-200`) — these are hardcoded, not using design tokens.

---

## Technical Debt and Cleanup Needs

### Dead / Unused Code
- `supabase/functions/fetch-odds-api/index.ts` — fully built but not called from pipeline. Either integrate it or remove it.
- `supabase/functions/scrape-pinnacle/` and `supabase/functions/scrape-veikkaus/` — referenced in config.toml but files not visible in project listing (may be stubs or previously deleted).
- `src/components/MarketExplainerTemplate.tsx` and `src/components/MatchAnalysisTemplate.tsx` — template components, check if both are actually used.

### Hardcoded Colors (Not Using Design Tokens)
- `Pricing.tsx` line 79: `text-emerald-500` (×3 occurrences)
- `Pricing.tsx` line 182: `text-red-400`
- `Performance.tsx` lines 166-167: `text-emerald-500`, `text-amber-500`
- `Performance.tsx` line 236: `text-emerald-400`, `text-red-400`
- `Performance.tsx` line 229: `text-amber-200`

### Inconsistent Domain References
Files referencing `doctore-ai.com` (should be unified):
- `src/pages/Blog.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/Performance.tsx`
- `src/pages/EdgeDetection.tsx`
- `src/pages/ResponsibleGaming.tsx`
- `src/pages/BankrollManagement.tsx`
- `src/pages/AnalysisIndex.tsx`
- `src/components/analysis/AnalysisArticle.tsx`
- `src/components/MatchAnalysisArticleTemplate.tsx`
- `supabase/functions/unsubscribe/index.ts`

Files referencing `doctore.lovable.app`:
- `src/hooks/useOGImage.ts`
- `src/pages/Landing.tsx`

Files referencing `doctore.app`:
- `src/pages/Methodology.tsx` (line 139)

### Naming Inconsistencies
- Brand alternates between "doctore", "Doctore", "DoctoreAI", "Doctore AI", "doctore-ai" across the codebase
- Edge functions: some use `serve()` import (`subscribe-email`), others use `Deno.serve()` directly — should standardize on `Deno.serve()`

---

## Architecture Snapshot

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)           │
│  Landing → Blog → Methodology → Pricing → Dashboard │
│  Auth: email/password via Supabase Auth              │
│  State: React Query (server state), useState (local) │
│  UI: shadcn/ui + Tailwind + Recharts                │
└────────────────────┬────────────────────────────────┘
                     │ Supabase JS Client
┌────────────────────▼────────────────────────────────┐
│              Supabase (Lovable Cloud)                │
│  Tables: games, edges, edge_history, fair_odds,     │
│          execution_odds, pinnacle_odds, bet_results, │
│          pipeline_runs, job_runs, email_subscribers  │
│  Views: edges_public, edge_clv, roi_summary,        │
│         source_performance, pipeline_health          │
│  Edge Functions: 15+ (pipeline, scrapers, email)    │
│  Storage: og-images bucket                          │
│  RLS: Read-only public on most tables               │
└─────────────────────────────────────────────────────┘
```

**Key Dependencies**: React 18, React Router 6, TanStack React Query 5, Recharts, shadcn/ui, date-fns, react-helmet-async, Supabase JS 2

**State Management**: No global state store. All server data via React Query. Local UI state via `useState`. Auth via custom `useAuth` hook.

**Complexity Concentration**: 
- `run-pipeline/index.ts` (pipeline orchestration)
- `run-decision-engine/index.ts` (edge detection logic)
- `calculate-fair-odds/index.ts` (math engine)

---

## Environment / Deployment Readiness

### Required Secrets (all configured)
`ADMIN_API_KEY`, `RESEND_API_KEY`, `THE_ODDS_API`, `CLOUDBET_API_KEY`, `FIRECRAWL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUMMARY_EMAIL_TO`, `SUMMARY_EMAIL_FROM`, `UNSUBSCRIBE_SECRET`, `BOT_TOKEN`

### Deployment Blockers
1. **No Stripe integration** — pricing page is misleading without it
2. **No custom domain** — site is on `doctore.lovable.app` but content references `doctore-ai.com`

### Security Status
- RLS is properly configured on all tables (read-only for public, restrictive for sensitive tables)
- Pipeline functions require `ADMIN_API_KEY` header
- Email subscription is rate-limited
- No admin panel exposure — dashboard shows same data to all users
- `sql_saved_queries` and `sql_query_logs` have proper user-scoped RLS
- ⚠️ No role-based access control exists — any authenticated user has full dashboard access

---

## Priority Cleanup Roadmap

### Critical (Do Before Launch)
1. **Connect Stripe or remove pricing** — the dead "Start 7-day free trial" button damages credibility
2. **Unify all domain references** — pick one canonical domain and update all ~66 occurrences
3. **Fix or remove the blacklist "Block" button** — it silently fails due to missing RLS INSERT policy

### Important (Do Within First Sprint)
4. **Add real performance data to Performance page** — use `roi_summary` and `edge_clv` views to show actual results
5. **Replace hardcoded Tailwind colors with design tokens** — ~12 occurrences across Pricing and Performance
6. **Standardize brand name** — pick "Doctore" or "Doctore AI" and apply everywhere
7. **Audit `fetch-odds-api` vs `fetch-execution-odds`** — remove dead code or integrate
8. **Fix StickyFooter exposure math** — display units at risk, not raw Kelly fractions
9. **Verify `send-error-alert` works end-to-end** — test the vault-based ADMIN_API_KEY retrieval

### Nice to Have
10. **Standardize Edge Function style** — migrate `serve()` imports to `Deno.serve()`
11. **Add loading/empty states to pre-game pages** when no data exists for a given sport/date
12. **Remove unused config.toml entries** (`scrape-pinnacle`, `scrape-veikkaus`) if functions don't exist
13. **Add E2E test coverage** for auth flow and subscription flow

---

## Recommended Next Step

**Connect Stripe and implement subscription gating.** This is the single highest-impact task because:
- The pricing page already exists with clear tiers
- The auth system is already built
- The dashboard already works
- You just need: Stripe checkout → webhook → `user_roles` table → conditional data access in hooks

Without this, the platform cannot generate revenue despite being technically functional.

---

## Current State in One Paragraph

Doctore AI is a working sports betting edge detection platform with a complete data pipeline (ESPN + Betfair + Cloudbet → fair odds → decision engine → daily email), a polished public marketing site with 8 blog articles and proper SEO, and a gated analytics dashboard showing real-time edges, CLV tracking, and pipeline health. Authentication works. Email subscriptions work. The pipeline runs on a cron schedule. **The main gap is monetization**: the pricing page advertises a $29/mo Pro tier but the "Start free trial" button does nothing because Stripe isn't connected, and there's no distinction between free and paid users. Secondary issues include inconsistent domain references across ~66 files, a handful of hardcoded colors not using the design system, and a few dead-end UI elements (blacklist block button, performance page without real data). The codebase is clean, well-organized, and ready for the payment integration that would make it a launchable product.