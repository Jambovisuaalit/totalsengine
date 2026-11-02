import { fetchNbaFixture, FixtureError } from "../../server/nba-fixture.mjs";
const json = (data: unknown, status: number) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^\d{1,12}$/.test(id)) return json({ error: "INVALID_GAME_ID" }, 400);
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) return json({ error: "FIXTURE_PROVIDER_NOT_CONFIGURED" }, 503);
  try {
    const fixture = await fetchNbaFixture(id, apiKey);
    return json({
      fixture,
      prediction: null,
      prediction_evidence: { status: "BLOCKED", reason: "NO_INDEPENDENTLY_VERIFIED_PREGAME_RECORD" },
      market: null,
      market_evidence: { status: "BLOCKED", reason: "NO_TIMESTAMPED_LICENSED_ODDS" },
    }, 200);
  } catch (error) {
    if (error instanceof FixtureError) return json({error: error.code}, error.status);
    return json({error: "FIXTURE_PROVIDER_UNAVAILABLE"}, 502);
  }
}
