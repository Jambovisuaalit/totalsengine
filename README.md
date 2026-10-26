# NBA Totals Engine — standalone landing page

Independent static landing for an upcoming NBA over/under research membership. This is separate from the DoctoreAI migration branch.

## Deployment

- Hosting: Vercel, linked to `Jambovisuaalit/totalsengine` (`main`).
- No build tools or environmental variables required.
- Main HTML: `index.html`; styles: `styles.css`; accessible mobile navigation: `app.js`.
- No Stripe checkout, Telegram invites, Supabase storage, forms, or private credentials are included.
- Planned price is indicative; enrollment remains disabled until provider eligibility, complete legal pages, and honest evidence layer are verified.
- All sample visuals are clearly identified as illustrative, and no verified performance record is claimed.

## Separate applications

- `main`: NBA Totals Engine landing.
- `migration/doctore-lovable`: staged port of current DoctoreAI React/Vite app. Do not merge over the standalone landing; use a separate repository/project if continuing the DoctoreAI migration.

## Local test

Serve from repository root, e.g. `python3 -m http.server 8080`, then open http://localhost:8080. Verify desktop and mobile views, anchors, accessible menu and FAQ.

## Launch checklist

- Confirm hosting plan permits intended commercial use before public monetization.
- Confirm legal business identity, privacy/terms, payment provider eligibility and actual price/currency.
- Publish audited track record before stating ROI or CLV statistics.
- Do not add purchase link or Telegram invitation until the checkout-to-access integration is validated.
