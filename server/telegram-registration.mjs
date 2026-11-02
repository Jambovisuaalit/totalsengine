import { createHash, timingSafeEqual } from "node:crypto";
const ENDPOINT = "https://totalsengine.vercel.app/api/telegram/webhook";
export function activationAuthorized(actual, storedDigest) {
 if (typeof actual !== "string" || actual.length < 40 || actual.length > 128 || typeof storedDigest !== "string" || !/^[a-f0-9]{64}$/.test(storedDigest)) return false;
 const digest=createHash("sha256").update(actual).digest();
 const expected=Buffer.from(storedDigest,"hex");
 return timingSafeEqual(digest,expected);
}
export async function activateTelegramWebhook(request, options={}) {
 const reply=(status,body)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 if(request.method!=="POST")return reply(405,{error:"METHOD_NOT_ALLOWED"});
 if(options.vercelEnv!=="production")return reply(404,{error:"NOT_FOUND"});
 if(!activationAuthorized(request.headers.get("x-totalsengine-activation-token"),options.authorizationHash))return reply(401,{error:"UNAUTHORIZED"});
 const {botToken,secret,allowedGroupId,fetcher=fetch}=options;
 if(typeof botToken!=="string" || !/^\d+:[A-Za-z0-9_-]{25,}$/.test(botToken) || typeof secret!=="string" || !/^[A-Za-z0-9_-]{1,256}$/.test(secret) || allowedGroupId!=="-1003842138351")return reply(503,{error:"CONFIGURATION_INVALID"});
 try {
  const params=new URLSearchParams({url:ENDPOINT,secret_token:secret,allowed_updates:JSON.stringify(["message"]),drop_pending_updates:"false"});
  const response=await fetcher("https://api.telegram.org/bot"+botToken+"/setWebhook",{method:"POST",body:params,redirect:"error",signal:AbortSignal.timeout(7500)});
  if(!response.ok)return reply(502,{error:"TELEGRAM_REGISTRATION_FAILED"});
  const data=await response.json();
  if(data?.ok!==true)return reply(502,{error:"TELEGRAM_REGISTRATION_FAILED"});
  return reply(200,{ok:true,registered_url:ENDPOINT,description:"Telegram accepted setWebhook; delivery still requires separate verification"});
 }catch{return reply(502,{error:"TELEGRAM_REGISTRATION_FAILED"});}
}
