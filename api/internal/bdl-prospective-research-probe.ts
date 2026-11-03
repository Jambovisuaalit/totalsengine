// Branch-only, read-only prospective BALLDONTLIE forecast. Must be removed after receipt.
import { createHash } from "node:crypto";
const digest=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
const json=(body:unknown,code=200)=>Response.json(body,{status:code,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"}});
const team=(s:string)=>({NY:"ny",NYK:"ny",GS:"gs",GSW:"gs",SA:"sa",SAS:"sa",NO:"no",NOP:"no",UTAH:"utah",UTA:"utah",WSH:"wsh",WAS:"wsh"} as Record<string,string>)[s]||s.toLowerCase();
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="audit/two-deliverables-2026-11-03")return json({error:"NOT_AVAILABLE"},404);
 const apiKey=process.env.BALLDONTLIE_API_KEY;
 if(!apiKey)return json({error:"NO_BDL_API_KEY"},503);
 const now=new Date();
 const date="2026-11-04";
 const requests=[`https://api.balldontlie.io/v1/games?dates[]=${date}&per_page=100`,
  "https://api.balldontlie.io/v1/games?start_date=2026-10-01&end_date=2026-11-02&per_page=100"];
 try{
  const captures:{uri:string,sha256:string,bytes:number,received_utc:string,data:any[],next_cursor:any}[]=[];
  for(const uri of requests){
   const res=await fetch(uri,{headers:{Authorization:apiKey,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(12000)});
   if(!res.ok)return json({error:"BDL_HTTP_"+res.status},502);
   const raw=Buffer.from(await res.arrayBuffer());
   if(raw.length>1000000)throw Error("OVERSIZE");
   const payload=JSON.parse(raw.toString("utf8"));
   if(!Array.isArray(payload.data))throw Error("BAD_RESPONSE");
   captures.push({uri,sha256:digest(raw),bytes:raw.length,received_utc:new Date().toISOString(),
     data:payload.data,next_cursor:payload.meta?.next_cursor??null});
  }
  // Fail-closed instead of using incomplete source history or improvising pagination.
  if(captures.some(x=>x.next_cursor!==null))return json({error:"PAGINATED_HISTORY_NOT_COMPLETE",response_digests:captures.map(x=>x.sha256)},409);
  const cutoff=new Date(now.getTime()-48*3600*1000);
  const finals=captures[1].data.filter(g=>
    g?.status_state==="final"&&g?.postponed===false&&
    Number.isInteger(g.home_team_score)&&Number.isInteger(g.visitor_team_score)&&
    new Date(g.datetime).getTime()<=cutoff.getTime()&&
    Number.isInteger(g.id));
  let opts=[];
  for(const game of captures[0].data){
    if(game?.postponed!==false||!Number.isInteger(game.id)||typeof game.datetime!=="string")continue;
    const kickoff=new Date(game.datetime);
    if(!Number.isFinite(kickoff.getTime())||kickoff<=now||kickoff.getTime()-now.getTime()>72*3600*1000)continue;
    if(game.status_state==="final"||game.status_state==="live")continue;
    const a=team(game.visitor_team?.abbreviation||""),h=team(game.home_team?.abbreviation||"");
    if(!a||!h||a===h)continue;
    const history:any={};const historyIds:any={};
    for(const t of [a,h]){
      const past=finals.filter(x=>[team(x.visitor_team?.abbreviation||""),team(x.home_team?.abbreviation||"")].includes(t))
        .sort((x,y)=>new Date(x.datetime).getTime()-new Date(y.datetime).getTime()||x.id-y.id).slice(-10);
      if(past.length<3){history[t]=null;break;}
      history[t]=past.reduce((s,x)=>s+x.home_team_score+x.visitor_team_score,0)/past.length;
      historyIds[t]=past.map(x=>x.id);
    }
    if(Object.values(history).some(x=>x===null))continue;
    const projected=Math.round(((history[a]+history[h])/2)*10000)/10000;
    opts.push({game_id:String(game.id),away:a,home:h,
      scheduled_tipoff:kickoff.toISOString(),expected_total:projected,
      history_source_game_ids:historyIds,
      source:"BALLDONTLIE_AUTHENTICATED_GAMES_ONLY",
      model_version:"bdl-rolling-team-total-v1",
      input_rights_review:"BDL_PUBLIC_TERMS_PERMISSIVE_THIRD_PARTY_OPEN",
      source_availability_verified:false,evaluation_eligible:false,
      publication_allowed:false,gate_status:"NO_GO"});
  }
  opts.sort((x,y)=>x.scheduled_tipoff.localeCompare(y.scheduled_tipoff)||x.game_id.localeCompare(y.game_id));
  return json({kind:"BDL_PROSPECTIVE_RESEARCH_ONLY",host_generated_at_utc:new Date().toISOString(),
    provider_receipts:captures.map(({uri,sha256,bytes,received_utc})=>({uri,sha256,bytes,received_utc})),
    options:opts.slice(0,12),options_count:opts.length,
    raw_provider_responses_archived:false,independent_publication_time_verified:false,
    legal_third_party_rights_approved:false,immutable_worm_verified:false,
    evaluation_eligible:false,publication_allowed:false,gate_status:"NO_GO"});
 }catch(e){return json({error:"SOURCE_PROBE_FAILED",kind:String(e instanceof Error?e.name:"UNKNOWN"),gate_status:"NO_GO"},502)}
}
