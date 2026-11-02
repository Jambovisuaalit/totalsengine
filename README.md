# DoctoreAI

Design the main dashboard page for DoctoreAI.




UI principles:
- Extreme clarity
- No marketing language
- No charts unless necessary
- Designed for fast betting decisions




Dashboard layout (mobile-first):
- Header: "DoctoreAI — Active Plays"
- For each bet:
  - League
  - Match (Home vs Away)
  - Market (e.g. 1X2 / Moneyline / Total)
  - Selection
  - Market odds
  - Fair odds
  - Edge %
  - Recommended stake (units)
  - Start time (local time)
- Highlight edge > 5% in green
- Grey out bets starting in <10 minutes
- Sticky footer showing:
  - Total open risk (sum of units)




No fake data.
Use real Supabase responses.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://doctore.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/02d26369-655d-42eb-92de-59bbe9ff4086).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
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
