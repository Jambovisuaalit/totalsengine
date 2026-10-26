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