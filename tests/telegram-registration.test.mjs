import test from "node:test";import assert from "node:assert/strict";import { createHash } from "node:crypto";
import {activationAuthorized,activateTelegramWebhook} from "../server/telegram-registration.mjs";
const token="unit-test-activation-token-"+"A".repeat(42),digest=createHash("sha256").update(token).digest("hex");
const options={authorizationHash:digest,vercelEnv:"production",botToken:"123456789:"+"a".repeat(35),secret:"correct-webhook-secret",allowedGroupId:"-1003842138351"};
const request=(value=token,method="POST")=>new Request("https://totalsengine.vercel.app/api/telegram/activate",{method,headers:value?{"x-totalsengine-activation-token":value}:{}});
test("admin route rejects all unauthenticated requests without API call",async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw new Error("must never call")};
 assert.equal(activationAuthorized(token,digest),true);
 assert.equal(activationAuthorized("not-authenticated",digest),false);
 for(const value of [null,"bad-token",""]){const res=await activateTelegramWebhook(request(value),{...options,fetcher});assert.equal(res.status,401);}
 assert.equal(calls,0);
});
test("preview route never registers",async()=>{assert.equal((await activateTelegramWebhook(request(),{...options,vercelEnv:"preview"})).status,404)});
test("wrong group or invalid secrets never register",async()=>{assert.equal((await activateTelegramWebhook(request(),{...options,allowedGroupId:"-1000000000000"})).status,503);assert.equal((await activateTelegramWebhook(request(),{...options,secret:"bad token"})).status,503)});
test("valid admin request registers fixed endpoint without dropping pending updates",async()=>{
 let call;const res=await activateTelegramWebhook(request(),{...options,fetcher:async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({ok:true,result:true})}}});
 assert.equal(res.status,200);const params=call.opts.body;
 assert.equal(params.get("url"),"https://totalsengine.vercel.app/api/telegram/webhook");
 assert.equal(params.get("secret_token"),options.secret);assert.equal(params.get("drop_pending_updates"),"false");
 assert.deepEqual(JSON.parse(params.get("allowed_updates")),["message"]);
 assert.equal(call.opts.redirect,"error");
 assert.equal((await res.json()).ok,true);
});
test("Telegram registration failure remains non-success",async()=>{
 const res=await activateTelegramWebhook(request(),{...options,fetcher:async()=>({ok:false,status:500})});
 assert.equal(res.status,502);
});
