import test from "node:test";
import assert from "node:assert/strict";
import { safeSecretMatch,commandResponse,processTelegramUpdate } from "../server/telegram-webhook.mjs";
const secret="telegram_test_secret";
const update=(text,chatId=412)=>({update_id:100,message:{text,chat:{id:chatId,type:"private"}}});
function req(body, header=secret, options={}) {return new Request("https://example.com/api/telegram/webhook",{method:"POST",headers:{"content-type":"application/json",...(header?{"x-telegram-bot-api-secret-token":header}:{}),...(options.headers||{})},body:JSON.stringify(body)});}
test("strict webhook secret checks",()=>{
 assert.equal(safeSecretMatch(secret,secret),true);
 assert.equal(safeSecretMatch(secret+"x",secret),false);
 assert.equal(safeSecretMatch("",secret),false);
});
test("start command supported with bot mention and no invented metrics",()=>{
 const a=commandResponse(update("/start@TotalsEngine_bot"));
 assert.equal(a.chat_id,412);
 assert.match(a.text,/Welcome to TotalsEngine/);
 assert.match(a.text,/independent evidence/);
 assert.equal(commandResponse(update("/start@AnotherBot")),null);
 assert.equal(commandResponse(update("ordinary text")),null);
});
test("missing configuration and invalid secret never call Telegram",async()=>{
 let called=0;const fetcher=async()=>{called++;return {ok:true,json:async()=>({ok:true})}};
 assert.equal((await processTelegramUpdate(req(update("/start"),"wrong"),{secret,token:"dummy",fetcher})).status,401);
 assert.equal((await processTelegramUpdate(req(update("/start")),{secret:"",token:"dummy",fetcher})).status,503);
 assert.equal(called,0);
});
test("real /start workflow calls Telegram sendMessage and acknowledges only success",async()=>{
 let call;
 const fetcher=async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({ok:true})}};
 const r=await processTelegramUpdate(req(update("/start")),{secret,token:"dummy",fetcher});
 assert.equal(r.status,200);assert.equal((await r.json()).delivered,true);
 assert.equal(call.url,"https://api.telegram.org/botdummy/sendMessage");
 const payload=JSON.parse(call.opts.body);assert.equal(payload.chat_id,412);assert.match(payload.text,/Welcome to TotalsEngine/);
});
test("Telegram transport failure is never acknowledged as success",async()=>{
 const r=await processTelegramUpdate(req(update("/start")),{secret,token:"dummy",fetcher:async()=>({ok:false,status:429})});
 assert.equal(r.status,502);
});
test("unrecognized updates acknowledged without outgoing messages",async()=>{
 let calls=0;const r=await processTelegramUpdate(req({update_id:101,edited_message:{text:"hello"}}),{secret,token:"dummy",fetcher:async()=>{calls++;throw Error("unexpected")}});
 assert.equal(r.status,200);assert.equal(calls,0);
});
test("payload bounds and malformed update",async()=>{
 const huge="/start "+"a".repeat(33_000);
 assert.equal((await processTelegramUpdate(req(update(huge)),{secret,token:"dummy"})).status,413);
 assert.equal((await processTelegramUpdate(req({message:{text:"/start"}}),{secret,token:"dummy"})).status,400);
});
