import { fetchJson } from "./http-json.mjs";
export class FixtureError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
const safeText = (s) =>
  typeof s === "string" && s.length > 0 && s.length <= 150;
function team(value) {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isSafeInteger(value.id) ||
    !safeText(value.full_name) ||
    !safeText(value.abbreviation)
  ) {
    throw new FixtureError("INVALID_PROVIDER_TEAM", 502);
  }
  return {
    id: value.id,
    name: value.full_name,
    abbreviation: value.abbreviation,
  };
}
export function normalizeFixture(data, requestedId, retrievedAt) {
  if (
    !data ||
    !Number.isSafeInteger(data.id) ||
    String(data.id) !== String(requestedId)
  )
    throw new FixtureError("FIXTURE_ID_MISMATCH", 502);
  const tipoff = Date.parse(data.datetime);
  if (
    typeof data.datetime !== "string" ||
    !Number.isFinite(tipoff) ||
    !data.datetime.endsWith("Z")
  )
    throw new FixtureError("UNVERIFIED_TIPOFF", 502);
  if (!safeText(data.status) || typeof data.postponed !== "boolean")
    throw new FixtureError("INVALID_PROVIDER_STATUS", 502);
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date))
    throw new FixtureError("INVALID_PROVIDER_DATE", 502);
  return {
    provider: "BALLDONTLIE",
    provider_game_id: String(data.id),
    league: "NBA",
    game_date: data.date,
    scheduled_tipoff_utc: new Date(tipoff).toISOString(),
    status: data.status,
    postponed: data.postponed,
    home: team(data.home_team),
    away: team(data.visitor_team),
    retrieved_at_utc: retrievedAt,
    // Scores are intentionally omitted from pre-game analysis responses.
  };
}
export async function fetchNbaFixture(id, apiKey, options = {}) {
  if (!/^\d{1,12}$/.test(String(id)))
    throw new FixtureError("INVALID_GAME_ID", 400);
  if (!apiKey || typeof apiKey !== "string")
    throw new FixtureError("FIXTURE_PROVIDER_NOT_CONFIGURED", 503);
  const fetcher = options.fetcher || fetch;
  const now = options.now || (() => new Date());
  try {
    const { response, data: payload } = await fetchJson(
      `https://api.balldontlie.io/v1/games/${id}`,
      {
        method: "GET",
        headers: { Authorization: apiKey, Accept: "application/json" },
        redirect: "error",
      },
      { fetcher, timeoutMs: options.timeoutMs ?? 6500 },
    );
    if (response.status === 404)
      throw new FixtureError("FIXTURE_NOT_FOUND", 404);
    if (response.status === 401 || response.status === 403)
      throw new FixtureError("FIXTURE_PROVIDER_UNAUTHORIZED", 503);
    if (response.status === 429)
      throw new FixtureError("FIXTURE_PROVIDER_RATE_LIMIT", 503);
    if (!response.ok)
      throw new FixtureError("FIXTURE_PROVIDER_UNAVAILABLE", 502);
    return normalizeFixture(payload?.data, id, now().toISOString());
  } catch (e) {
    if (e instanceof FixtureError) throw e;
    throw new FixtureError("FIXTURE_PROVIDER_UNAVAILABLE", 502);
  }
}
