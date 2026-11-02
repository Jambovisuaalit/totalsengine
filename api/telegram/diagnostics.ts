// Temporary read-only, authenticated-Preview-only Telegram diagnostic.
const json=(status,body)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
async function callBot(token,method,body={}){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),4500);
 try{
  const r=await fetch("https://api.telegram.org/bot"+token+"/"+method,{
   method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   redirect:"error",signal:c.signal
  });
  const data=await r.json().catch(()=>null);
  return r.ok&&data?.ok?{ok:true,result:data.result}:{ok:false,status:r.status};
 }catch{return {ok:false,status:0};}finally{clearTimeout(t);}
}
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview"||process.env.TELEGRAM_DIAGNOSTICS_ENABLED!=="true")
  return json(404,{error:"NOT_FOUND"});
 const token=process.env.TELEGRAM_BOT_TOKEN;
 const id=process.env.TELEGRAM_GROUP_WEB_ID;
 if(!token||!/^-[0-9]{3,20}$/.test(id||""))return json(503,{error:"NOT_CONFIGURED"});
 const me=await callBot(token,"getMe");
 const webhook=await callBot(token,"getWebhookInfo");
 const expectedBotId=process.env.TELEGRAM_EXPECTED_BOT_ID;
 const candidates=[id,"-100"+id.slice(1)];
 const group=[];
 for(const candidate of [...new Set(candidates)]){
  const r=await callBot(token,"getChat",{chat_id:candidate});
  group.push(r.ok?{candidate,verified:true,chat_id:String(r.result.id),type:r.result.type,title:r.result.title||null}:{candidate,verified:false,status:r.status});
 }
 return json(200,{bot:me.ok?{verified:String(me.result.id)===expectedBotId && me.result.username==="TotalsEngine_bot",bot_id:String(me.result.id),username:me.result.username}:{verified:false},
  webhook:webhook.ok?{verified:true,url:webhook.result.url||"",pending_updates:webhook.result.pending_update_count,last_error:webhook.result.last_error_message||null}:{verified:false},
  group});
}
