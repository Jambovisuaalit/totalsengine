import { createHash } from "node:crypto";
export async function GET() {
 const response=(x:unknown,status=200)=>Response.json(x,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="audit/two-deliverables-2026-11-03")
  return response({error:"PREVIEW_ONLY"},404);
 const key=process.env.BALLDONTLIE_API_KEY;
 if(!key)return response({error:"PROVIDER_KEY_NOT_CONFIGURED"},503);
 const uri="https://api.balldontlie.io/v1/games?dates[]=2026-11-04&per_page=100";
 try {
  const r=await fetch(uri,{headers:{Authorization:key,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(14000)});
  if(!r.ok)return response({error:"PROVIDER_HTTP_"+r.status},502);
  const raw=Buffer.from(await r.arrayBuffer());
  if(raw.length>1000000)return response({error:"OVERSIZE"},502);
  const body=JSON.parse(raw.toString("utf8"));
  if(!Array.isArray(body.data)||body.meta?.next_cursor!=null)return response({error:"INVALID_OR_PAGINATED_RESPONSE"},409);
  const expected=[
    ["401909922","PHI","DET","2026-11-05T00:00:00.000Z",112,106],
    ["401909923","ATL","WAS","2026-11-05T00:00:00.000Z",120,105],
    ["401909924","MIL","BOS","2026-11-05T00:30:00.000Z",102,109],
    ["401909925","CHA","BKN","2026-11-05T00:30:00.000Z",104,114],
    ["401909926","CHI","NYK","2026-11-05T00:30:00.000Z",105,135],
    ["401909927","IND","MEM","2026-11-05T01:00:00.000Z",107,103],
    ["401909928","UTA","NOP","2026-11-05T01:00:00.000Z",113,120],
    ["401909929","CLE","OKC","2026-11-05T01:00:00.000Z",116,124],
    ["401909930","MIN","HOU","2026-11-05T01:30:00.000Z",117,107],
    ["401909931","TOR","DEN","2026-11-05T02:00:00.000Z",109,128],
    ["401909932","POR","PHX","2026-11-05T02:00:00.000Z",132,119],
    ["401909933","DAL","SAS","2026-11-05T02:30:00.000Z",111,112],
    ["401909934","LAL","SAC","2026-11-05T03:00:00.000Z",116,103],
    ["401909935","MIA","LAC","2026-11-05T03:30:00.000Z",117,116],
  ] as const;
  const n=(x:string)=>({NY:"NYK",GS:"GSW",SA:"SAS",NO:"NOP",UTAH:"UTA",WSH:"WAS"} as Record<string,string>)[x]||x;
  const matches=expected.map(([espn,away,home,tipoff,awayScore,homeScore])=>{
    const x=body.data.filter((g:any)=>g&&
       n(String(g.visitor_team?.abbreviation||"").toUpperCase())===away &&
       n(String(g.home_team?.abbreviation||"").toUpperCase())===home &&
       new Date(g.datetime).toISOString()===tipoff &&
       g.visitor_team_score===awayScore && g.home_team_score===homeScore &&
       g.postponed===false && Number.isSafeInteger(g.id));
    return {espn_game_id:espn,bdl_game_id:x.length===1?String(x[0].id):null,match_count:x.length,
      status:x.length===1?"EXACT_STRUCTURAL_MATCH_PROVIDER_NOT_LEGALLY_CLEARED":x.length===0?"UNMATCHED":"AMBIGUOUS"};
  });
  return response({kind:"BDL_GAMES_14_REAL_AUTHENTICATED_LOOKUP",retrieved_at_host_utc:new Date().toISOString(),
    api_response_sha256:createHash("sha256").update(raw).digest("hex"),response_bytes:raw.length,
    response_raw_archived:false,provider_count:body.data.length,
    matches,matched:matches.filter(x=>x.match_count===1).length,
    rights_verified:false,worm_verified:false,evaluation_eligible:false,publication_allowed:false,gate_status:"NO_GO"});
 }catch(e){return response({error:"PROBE_FAILED",category:e instanceof Error?e.name:"UNKNOWN"},502)}
}
