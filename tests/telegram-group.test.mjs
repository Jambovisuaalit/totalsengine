import test from 'node:test';
import assert from 'node:assert/strict';
import { processTelegramUpdate, commandResponse } from '../server/telegram-webhook.mjs';
const secret='test_secret', token='test_token';
const allowed='-1001234567890', other='-1009999999999';
function update(chatId, text, type='supergroup') {
 return {update_id:42,message:{chat:{id:Number(chatId),type},text}};
}
function request(payload) {
 return new Request('https://example.invalid/api/telegram/webhook',{
  method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':secret},
  body:JSON.stringify(payload)
 });
}
const config=(allowedGroupId, send)=>( {
 secret,token,allowedGroupId,
 fetcher: async (url,opts)=>{send.push({url,opts});return {ok:true,json:async()=>({ok:true})};}
});
test('group messages fail closed when allowlist is not configured',async()=>{
 const sent=[];let response=await processTelegramUpdate(request(update(allowed,'/start@TotalsEngine_bot')),config(undefined,sent));
 assert.equal(response.status,200);assert.equal((await response.json()).ignored,true);assert.equal(sent.length,0);
});
test('nonallowlisted groups receive no reply, including explicit bot commands',async()=>{
 const sent=[];await processTelegramUpdate(request(update(other,'/games@TotalsEngine_bot')),config(allowed,sent));
 assert.equal(sent.length,0);
});
test('group bot responds only to explicitly addressed commands',async()=>{
 const sent=[];await processTelegramUpdate(request(update(allowed,'/start')),config(allowed,sent));
 await processTelegramUpdate(request(update(allowed,'/start@OtherBot')),config(allowed,sent));
 await processTelegramUpdate(request(update(allowed,'random text')),config(allowed,sent));
 assert.equal(sent.length,0);
 const r=await processTelegramUpdate(request(update(allowed,'/start@TotalsEngine_bot')),config(allowed,sent));
 assert.equal(r.status,200);assert.equal(sent.length,1);
 const body=JSON.parse(sent[0].opts.body);assert.equal(body.chat_id,Number(allowed));
 assert.match(body.text,/Welcome to TotalsEngine/);
 assert.equal('updateId' in body,false);
 assert.equal('chatType' in body,false);
});
test('private chats continue working without group allowlist',async()=>{
 const sent=[];const r=await processTelegramUpdate(request(update('12345','/start','private')),config(undefined,sent));
 assert.equal(r.status,200);assert.equal(sent.length,1);
});
test('group analyze stays evidence-gated when no provider key',async()=>{
 const sent=[];await processTelegramUpdate(request(update(allowed,'/analyze@TotalsEngine_bot 1')),config(allowed,sent));
 assert.equal(sent.length,1);assert.match(JSON.parse(sent[0].opts.body).text,/source unavailable/);
});
test('invalid allowlist values cannot authorize group responses',async()=>{
 for(const val of ['0','123','-1','-1001, -1002','-1001234567890 ']){
  const sent=[];await processTelegramUpdate(request(update(allowed,'/start@TotalsEngine_bot')),config(val,sent));
  assert.equal(sent.length,0);
 }
});
