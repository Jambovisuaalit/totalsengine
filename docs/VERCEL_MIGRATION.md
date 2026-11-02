# Lovable to Vercel — staging notes

- Source snapshot: Lovable DoctoreAI, project 02d26369-655d-42eb-92de-59bbe9ff4086; compare to its revision at migration time.
- Git branch: `migration/doctore-lovable`; do not modify the existing domain DNS before staging passes.
- Stack: Vite/React SPA, Supabase Auth/Postgres/Edge Functions remain at the original Supabase project.
- Vercel environment variables: VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY. Assign via Vercel Settings, not in Git.
- .env and private configuration were deliberately excluded. Existing database migrations excluded from this initial frontend migration: use isolated migrations for backend changes.
- Raster assets not migratable via Lovable's text file reader: `public/favicon.ico`, `public/favicon.png`, `public/og-image.png`, `public/og/analysis.png`. Restore actual binary files from the original GitHub/Lovable checkout before public launch. Existing index favicon uses externally hosted image.
- DNS for doctore-ai.com and www.doctore-ai.com remains unchanged at 185.158.133.1.
- Before cutover: build/test routes and login; update Supabase redirect URL allow-list, verify background workers, test image URLs, SEO/canonical and link targets, inspect RLS; only then stage and switch DNS after user approval.
- Repository is public: change visibility to private before storing proprietary code or raw SQL migrations. No hardcoded credentials should be committed.
