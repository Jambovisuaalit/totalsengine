import { timingSafeEqual } from "node:crypto";

const msg = {
 start: "Welcome to TotalsEngine | NBA Analytics.\n\nNBA totals research with transparent validation.\n\n/start — Introduction\n/help — Commands\n/status — Current evidence status\n\nFixture lookup and model-based analysis will be enabled only after authenticated data and independent evidence checks pass. No betting recommendations are available.",
 help: "TotalsEngine commands:\n/start — Welcome\n/help — Help\n/status — Data and validation status\n/games — NBA slate (pending authenticated fixture integration)\n/analyze — NBA totals research (evidence gated)\n/methodology — Evidence requirements\n/performance — Independent validation status",
 status: "TotalsEngine status:\nFixture integration: under verification.\nPregame model prediction evidence: BLOCKED.\nLicensed timestamped market odds: BLOCKED.\nBetting recommendations: DISABLED.\nNo verified ROI or accuracy claims.",
 games: "NBA fixtures in Telegram are not available yet. The authenticated provider integration is awaiting a live acceptance test. No fixtures are fabricated.",
 analyze: "NBA totals predictions are unavailable until independently timestamped pregame records have been verified. NO PLAY / NO CLAIM.",
 methodology: "Evidence gates: authenticated fixtures, immutable pre-tipoff prediction and source snapshot, independent timestamp validation, realized totals for MAE/RMSE, then separately licensed timestamped odds. No claims before verification.",
 performance: "Model performance is not yet independently verified. MAE/RMSE and market ROI are withheld until genuine pregame predictions and evidence are matched to outcomes."
};
export function safeSecretMatch(actual, expected) {
 if (typeof actual !== "string" || typeof expected !== "string" || !expected || !actual) return false;
 const a=Buffer.from(actual,"utf8"),b=Buffer.from(expected,"utf8");
 return a.length===b.length && timingSafeEqual(a,b);
}
export function commandResponse(update) {
 const message=update?.message;
 if (!message || typeof message !== "object" || !Number.isSafeInteger(message.chat?.id) || typeof message.text !== "string") return null;
 const first=message.text.trim().split(/\s+/,1)[0];
 const m=/^\/([a-z]+)(?:@([a-z][a-z0-9_]{4,31}))?$/i.exec(first||"");
 if (!m) return null;
 if (m[2] && m[2].toLowerCase()!=="totalsengine_bot") return null;
 const key=m[1].toLowerCase();
 return {chat_id:message.chat.id, text:msg[key]||"Unknown command. Type /help for supported commands."};
}
export async function processTelegramUpdate(request, options) {
 const {secret,token,fetcher=fetch}=options;
 const json=(status,body)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 if(request.method!=="POST")return json(405,{error:"METHOD_NOT_ALLOWED"});
 if (!secret || !token) return json(503,{error:"TELEGRAM_NOT_CONFIGURED"});
 if (!safeSecretMatch(request.headers.get("x-telegram-bot-api-secret-token"),secret))
  return json(401,{error:"INVALID_WEBHOOK_SECRET"});
 const maxBytes=32_768;
 if (Number(request.headers.get("content-length")||0)>maxBytes)return json(413,{error:"PAYLOAD_TOO_LARGE"});
 let buffer;try{
  const reader=request.body?.getReader();if(!reader)return json(400,{error:"INVALID_BODY"});
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return json(413,{error:"PAYLOAD_TOO_LARGE"});}chunks.push(value);}
  buffer=Buffer.concat(chunks.map(x=>Buffer.from(x)));
 }catch{return json(400,{error:"INVALID_BODY"});}
 let update;try{update=JSON.parse(buffer.toString("utf8"));}catch{return json(400,{error:"INVALID_JSON"});}
 if (!Number.isSafeInteger(update?.update_id))return json(400,{error:"INVALID_UPDATE"});
 const answer=commandResponse(update);
 if(!answer)return json(200,{ok:true,ignored:true});
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6000);
  let res;
  try{
   res=await fetcher(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...answer,disable_web_page_preview:true}),signal:controller.signal,redirect:"error"
   });
  }finally{clearTimeout(timeout);}
  if(!res.ok)return json(502,{error:"TELEGRAM_SEND_FAILED"});
  const data=await res.json();
  if(data?.ok!==true)return json(502,{error:"TELEGRAM_SEND_FAILED"});
  return json(200,{ok:true,delivered:true});
 }catch{return json(502,{error:"TELEGRAM_SEND_FAILED"});}
}
