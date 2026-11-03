/** Read-only, fail-closed cross-provider NBA identity receipt probe.
 * NEVER uploads API keys, raw provider responses or declared rights approvals.
 * Usage: BALLDONTLIE_API_KEY=... node scripts/check-bdl-six-games.mjs
 */
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

const games = [
  ["401909907","OKC","CLE","2026-11-03T00:00:00.000Z"],
  ["401909908","DET","CHA","2026-11-03T00:30:00.000Z"],
  ["401909909","ATL","IND","2026-11-03T00:30:00.000Z"],
  ["401909910","BKN","NYK","2026-11-03T00:30:00.000Z"],
  ["401909911","WAS","ORL","2026-11-03T00:30:00.000Z"],
  ["401909912","CHI","PHI","2026-11-03T00:30:00.000Z"],
];
const sha = (raw) => createHash("sha256").update(raw).digest("hex");
const team = (code) => ({"NYK":"NY","GSW":"GS","SAS":"SA","NOP":"NO","UTA":"UTAH","WAS":"WSH","PHI":"PHI","BKN":"BKN"}[code] || code).toUpperCase();
export function reconcile(espn, providerRows) {
  const same = providerRows.filter(x => x && String(x.date) === "2026-11-02" &&
      team(x.visitor_team?.abbreviation) === team(espn[1]) &&
      team(x.home_team?.abbreviation) === team(espn[2]) &&
      typeof x.datetime === "string" && Number.isFinite(Date.parse(x.datetime)) &&
      new Date(x.datetime).toISOString() === espn[3] && x.postponed === false &&
      Number.isSafeInteger(x.id));
  return same.length === 1
    ? {status:"EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED",bdl_game_id:String(same[0].id)}
    : {status:same.length > 1 ? "AMBIGUOUS" : "UNMATCHED",bdl_game_id:null};
}
export async function probe({apiKey,fetcher=fetch, clock=()=>new Date(), write=writeFile}={}) {
  if (!apiKey) throw Error("BALLDONTLIE_API_KEY not available; no API call made");
  const url = "https://api.balldontlie.io/v1/games?dates[]=2026-11-02&per_page=100";
  let body, retrieved, httpStatus;
  const ctrl=new AbortController();
  const timeout=setTimeout(()=>ctrl.abort(),10000);
  try {
    const res=await fetcher(url,{method:"GET",redirect:"error",signal:ctrl.signal,
      headers:{Authorization:apiKey,Accept:"application/json"}});
    httpStatus=res.status;
    if (!res.ok) throw Error("BALLDONTLIE HTTP status "+res.status);
    const bytes=Buffer.from(await res.arrayBuffer());
    if(bytes.byteLength>1000000) throw Error("Oversized BDL response");
    body=bytes;
    retrieved=clock().toISOString();
  } finally {clearTimeout(timeout)}
  const payload=JSON.parse(body.toString("utf8"));
  if(!Array.isArray(payload.data)) throw Error("Malformed BDL response");
  // Do not silently accept pagination/partial days.
  if(payload.meta?.next_cursor != null) throw Error("BDL response paginated: incomplete day");
  const mappings=games.map(g=>({espn_game_id:g[0],away:g[1],home:g[2],
    expected_tipoff_utc:g[3],...reconcile(g,payload.data),
    provider_id_evidence:"BDL_RESPONSE_HOST_RETRIEVED_ONLY"}));
  const ids=mappings.filter(x=>x.bdl_game_id).map(x=>x.bdl_game_id);
  if(new Set(ids).size!==ids.length) throw Error("Two ESPN game IDs map to one BDL ID");
  const receipt={
    schema:1,kind:"BDL_SIX_GAME_RESEARCH_PROBE_ONLY",
    request_url:url,response_status:httpStatus,retrieved_at_host_utc:retrieved,
    original_response_sha256:sha(body),original_response_bytes:body.length,
    original_response_archived:false,source_rights_verified:false,
    upstream_publication_time_verified:false,independent_timestamp_verified:false,
    match_count:ids.length,expected_count:games.length,rows:mappings,
    evaluation_eligible:false,publication_allowed:false,gate_status:"NO_GO"
  };
  if(process.env.BDL_PROBE_OUTPUT) await write(process.env.BDL_PROBE_OUTPUT,JSON.stringify(receipt,null,2)+"\n",{flag:"wx",mode:0o600});
  return receipt;
}
if(import.meta.url===`file://${process.argv[1]}`){
  probe({apiKey:process.env.BALLDONTLIE_API_KEY}).then(x=>{
    process.stdout.write(JSON.stringify(x,null,2)+"\n");
    if(x.match_count!==6)process.exitCode=2;
  }).catch(e=>{console.error("BDL probe BLOCKED:",e.message);process.exitCode=2});
}
