# NBA Totals Engine — landing page (Swift-inspired redesign)
A standalone, responsive website built for the upcoming NBA totals research membership. This is an **original HTML/CSS implementation** inspired by the layout patterns of [Swift App's Framer demo](https://swift-template.framer.website/), not an export of the copyrighted Framer template. No template assets or copy are included.

## Branch structure
- \`landing/nba-totals\` is the source of the NBA Totals Engine website.
- \`migration/doctore-lovable\` contains a separate draft migration of the current DoctoreAI React/Vite site. **Do not merge this branch into the NBA landing**, which would replace the landing's content.
- \`main\` is not automatically updated by landing changes until the pull request is approved.

## Development
No build step, external libraries, or provider credentials required. Run \`python3 -m http.server 8080\` and visit \`http://localhost:8080\`.
Vercel's GitHub integration generates Preview deployments for branch updates.

## Current restrictions
- No real signals, statistics or track record are claimed. Phone mockups use explicitly labeled illustrative data.
- €49/month is a provisional price only. There is no active checkout and no collection of personal information.
- Stripe eligibility, legal business/operator information, privacy/terms, real evidence and authenticated Telegram access must be confirmed before live monetization.
- The existing \`doctore-ai.com\` domain, Lovable project and Supabase database are not modified by this landing.
- The Vercel team is currently on a Hobby plan; review commercial use requirements before production publication.

## Smoke checks
- All on-page \`href="#..."\` targets resolve.
- Mobile navigation responds to toggle, outside click, Escape and anchor navigation.
- FAQ uses semantic native \`details\` elements.
- Review visual appearance at 375px, 768px and 1440px, plus reduced-motion preference.
- Review deployment protection and published URL before sharing.

## Reference
Swift App — created by Yousef Osman, published on Framer Marketplace. Original design and assets remain theirs.
