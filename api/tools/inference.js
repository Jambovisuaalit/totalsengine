import { timingSafeEqual } from "node:crypto";
import { fetchNhlOdds } from "./nhl-odds.js";

function authorized(req) {
  const expected = process.env.TOTALSENGINE_TOOLS_TOKEN;
  const supplied = req.headers.authorization?.replace(/^Bearer /i,"");
  if (!expected || !supplied) return false;
  const a=Buffer.from(expected), b=Buffer.from(supplied);
  return a.length===b.length && timingSafeEqual(a,b);
}
const NHL_TOOL = {
  type:"function", name:"get_nhl_odds",
  description:"Fetch current NHL totals odds with provider raw response bytes and receipt timestamp; does not verify archival or model edge.",
  parameters:{type:"object",properties:{event_id:{type:["string","null"],description:"Optional The Odds API event ID; null returns all upcoming NHL events"}},required:["event_id"],additionalProperties:false},
  strict:true
};
export default async function handler(req,res) {
  if (req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  if (!authorized(req)) return res.status(401).json({error:"unauthorized"});
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({error:"OPENAI_API_KEY_missing"});
  const prompt = req.body?.prompt;
  if (typeof prompt!=="string" || !prompt.trim() || prompt.length>4000) return res.status(400).json({error:"invalid_prompt"});
  const tools = [{type:"web_search"},NHL_TOOL];
  if (process.env.DUNKAPI_MCP_URL) {
    const url = new URL(process.env.DUNKAPI_MCP_URL);
    if (url.protocol!=="https:") return res.status(503).json({error:"invalid_mcp_url"});
    tools.push({type:"mcp",server_label:"dunkapi",server_url:url.toString(),require_approval:"always"});
  }
  const call = async payload => {
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",signal:AbortSignal.timeout(45000),
      headers:{"authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"content-type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data=await r.json();
    if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}: ${data.error?.type||"request_failed"}`);
    return data;
  };
  try {
    const base={model:process.env.OPENAI_MODEL||"gpt-5.1",tools,tool_choice:"auto",
      instructions:"Research assistant only. Never claim archival, verified edge, or pregame evidence without independently validated source records. Do not approve MCP actions automatically."};
    let result=await call({...base,input:prompt});
    for(let i=0;i<3;i++){
      const functions=(result.output||[]).filter(o=>o.type==="function_call"&&o.name==="get_nhl_odds");
      if(!functions.length) break;
      const outputs=[];
      for(const fn of functions){
        let data;
        try {
          const args=JSON.parse(fn.arguments||"{}");
          data=await fetchNhlOdds({event_id:args.event_id??undefined});
          // Never forward raw provider bytes into model context.
          delete data.raw_response_base64;
        } catch(e){data={error:e.message};}
        outputs.push({type:"function_call_output",call_id:fn.call_id,output:JSON.stringify(data)});
      }
      result=await call({...base,previous_response_id:result.id,input:outputs});
    }
    // Do not auto-approve MCP calls: return pending approval to the trusted client.
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({response_id:result.id,output:result.output,output_text:result.output_text||null,
      pending_mcp_approval:(result.output||[]).some(o=>o.type==="mcp_approval_request")});
  }catch(e){return res.status(502).json({error:"inference_failed",message:e.message});}
}
