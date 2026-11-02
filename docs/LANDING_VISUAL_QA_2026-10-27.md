# NBA Totals Engine — visual QA acceptance report
Date: 2026-10-27 (Helsinki)
Scope: static NBA Totals Engine landing on `landing/nba-totals`, separate from DoctoreAI.

## Automated verification
GitHub Actions run: https://github.com/Jambovisuaalit/totalsengine/actions/runs/40427925667

**Result: 58 PASSED / 0 FAILED.**

Head commit tested: `db321c3417b706953e912f9b7ceae46c81f113a1`.
Local Chromium loads the exact branch's site via a Python static server (not the access-protected Vercel Preview).
Snapshots and JSON test report are attached as the `landing-visual-qa` workflow artifact.

Viewport matrix:
- 375 × 812 (mobile)
- 390 × 844 (mobile)
- 768 × 1024 (tablet)
- 1440 × 900 (desktop)

Automated assertions: HTTP status, no page/document horizontal overflow, visible hero heading within viewport, >=48 px hero CTA, adaptive Bento columns, light pricing card, center phone layering, 4 empty KPI fields, functioning anchors and FAQ, functioning mobile menu, no JavaScript exceptions, no live checkout or fabricated statistics.

## Human screenshot review
Reviewed full-page Chromium screenshots of the tested branch.
- Desktop hero and 3 Bento tiles follow the requested Swift-inspired look: soft copper halo, bold heading, layered dark mockups and restrained borders.
- Tablet shows a prominent center phone with dimmed cropped side phones, stacked feature cards and no horizontal overflow.
- Mobile has legible headings and full-width pill CTAs, stacked features, alternating product preview / Telegram sample, a 2×2 empty KPI grid, a light €49 price card, usable FAQ spacing, and no detected cut-off content.
- Mockup copy and synthetic totals remain explicitly identified as illustrative.
- Areas needing eventual content, not visual fixes: legal operator identity, privacy/terms, validated performance samples and provider approval.

## Release gates — NOT yet cleared
- Vercel Preview uses SSO; browser access to the hosted page as an unauthenticated visitor remains blocked.
- PR #2 is Draft. The `main` branch and production alias have not been updated.
- Commercial hosting plan suitability must be verified.
- The product's operator details, legal pages and payment eligibility are unresolved.
- No live Stripe checkout, user collection, subscription automation or Telegram distribution is enabled.
- DoctoreAI's Lovable application, database and `doctore-ai.com` DNS remain unchanged.

## Recommendation
Visual design is acceptable for staging. Do not merge/publish commercially until legal and operational gates are verified. Keep DoctoreAI migration PR #1 separate; never merge it into the Totals Engine landing.
