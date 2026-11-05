import { createHash, timingSafeEqual } from "node:crypto";

const allowedOrigin = "https://api.the-odds-api.com";
const sport = "icehockey_nhl";
const MAX_BYTES = 2_000_000;
function authorized(request) {
  const secret = process.env.TOTALSENGINE_TOOLS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!secret || !supplied) return false;
  const a = Buffer.from(secret), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a,b);
}
export async function fetchNhlOdds({ event_id } = {}) {
  const key = process.env.THE_ODDS_API_KEY;
  if (!key) throw new Error("THE_ODDS_API_KEY not configured");
  if (event_id !== undefined && !/^[a-zA-Z0-9_-]{6,128}$/.test(event_id)) throw new Error("invalid event_id");
  const url = new URL(`/v4/sports/${sport}/odds/`, allowedOrigin);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "us,eu");
  url.searchParams.set("markets", "totals");
  url.searchParams.set("oddsFormat", "decimal");
  const response = await fetch(url, {signal: AbortSignal.timeout(12000), headers: {"accept":"application/json"}, cache:"no-store"});
  if (!response.ok) throw new Error(`Odds provider HTTP ${response.status}`);
  const raw = Buffer.from(await response.arrayBuffer());
  if (raw.length > MAX_BYTES) throw new Error("provider response exceeds size limit");
  const fetched_at_utc = new Date().toISOString();
  const quota = {};
  for (const key of ["x-requests-remaining", "x-requests-used", "x-requests-last"]) {
    const value = response.headers.get(key);
    if (value !== null) {
      if (!/^\d+$/.test(value)) throw new Error(`invalid provider quota header: ${key}`);
      quota[key.replace("x-requests-", "")] = Number(value);
    }
  }
  const events = JSON.parse(raw.toString("utf8"));
  if (!Array.isArray(events)) throw new Error("unexpected odds response");
  const selected = event_id ? events.filter(e => e.id === event_id) : events;
  if (event_id && selected.length !== 1) throw new Error("requested event_id not uniquely present in provider response");
  return {
    source: "the-odds-api", sport, fetched_at_utc, provider_quota: quota,
    raw_response_sha256: createHash("sha256").update(raw).digest("hex"),
    raw_response_base64: raw.toString("base64"),
    events: selected.map(e => ({id:e.id, home_team:e.home_team, away_team:e.away_team, commence_time:e.commence_time,
      bookmakers:(e.bookmakers||[]).map(b=>({key:b.key,last_update:b.last_update,markets:(b.markets||[]).filter(m=>m.key==="totals")}))})),
    evidence_status: "UNARCHIVED_NOT_WORM",
    note: "Hash and raw bytes are returned to the trusted caller. Durable independent archival and NHL canonical join are not performed by this endpoint."
  };
}
export default async function handler(req,res) {
  if (req.method !== "POST") return res.status(405).json({error:"method_not_allowed"});
  if (!authorized({headers:{get:(k)=>req.headers[k]}})) return res.status(401).json({error:"unauthorized"});
  try {
    const result = await fetchNhlOdds(req.body || {});
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json(result);
  } catch(e) {
    return res.status(502).json({error:"provider_error",message:e.message});
  }
}
