import test from "node:test";
import assert from "node:assert/strict";
import {generateFixtureReply,commandResponse} from "../server/telegram-webhook.mjs";
const game={id:1,date:"2018-10-16",datetime:"2018-10-17T00:00:00.000Z",status:"Final",postponed:false,home_team:{id:2,full_name:"Boston Celtics",abbreviation:"BOS"},visitor_team:{id:23,full_name:"Philadelphia 76ers",abbreviation:"PHI"}};
test("analyze returns only provider-sourced fixture, blocked prediction",async()=>{
 const reply=await generateFixtureReply("analyze","1",{nbaApiKey:"test",now:()=>new Date("2018-10-16T08:00:00Z"),nbaFetcher:async()=>({ok:true,status:200,json:async()=>({data:game})})});
 assert.match(reply,/Philadelphia 76ers @ Boston Celtics/);assert.match(reply,/BLOCKED/);assert.doesNotMatch(reply,/predicted.*[0-9]{3}/i);
});
test("invalid analyze ID does not call provider",async()=>{
 let called=0;const reply=await generateFixtureReply("analyze","abc",{nbaApiKey:"test",nbaFetcher:async()=>{called++;throw Error("not reached")}});
 assert.match(reply,/Usage:/);assert.equal(called,0);
});
test("games lists only future source-confirmed fixtures; no fabricated odds",async()=>{
 const g1={...game,id:2,date:"2026-11-02",datetime:"2026-11-03T00:00:00.000Z",status:"7:00 pm ET"};
 const g2={...g1,id:3,datetime:"2026-11-01T00:00:00.000Z"};
 let url;
 const reply=await generateFixtureReply("games","",{nbaApiKey:"test",now:()=>new Date("2026-11-02T12:00:00Z"),nbaFetcher:async(u)=>{url=u;return {ok:true,json:async()=>({data:[g2,g1]})};}});
 assert.match(url,/start_date=2026-11-02/);assert.match(reply,/ID 2/);assert.doesNotMatch(reply,/ID 3/);assert.match(reply,/BLOCKED/);
});
test("games fails closed on provider failure",async()=>{
 const reply=await generateFixtureReply("games","",{nbaApiKey:"test",nbaFetcher:async()=>({ok:false,status:429})});
 assert.match(reply,/unavailable/);
});
test("only private chat may execute commands",()=>{
 const x={update_id:12,message:{chat:{id:-100123,type:"supergroup"},text:"/start"}};
 assert.equal(commandResponse(x).private,false);
});
