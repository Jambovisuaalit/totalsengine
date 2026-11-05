import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {fetchNhlOdds} from "../api/tools/nhl-odds.js";

const fixture=[{id:"nhl_event_123",home_team:"Home",away_team:"Away",commence_time:"2026-11-06T23:00:00Z",bookmakers:[{key:"book",last_update:"2026-11-05T20:00:00Z",markets:[{key:"totals",last_update:"2026-11-05T20:00:00Z",outcomes:[]}]}]}];

test("NHL evidence retains exact raw bytes, SHA-256, receipt timestamp, and provider quota", async t=>{
  const oldFetch=globalThis.fetch, oldKey=process.env.THE_ODDS_API_KEY;
  const raw=Buffer.from(JSON.stringify(fixture));
  process.env.THE_ODDS_API_KEY="fixture-only-key";
  globalThis.fetch=async url=>{
    const u=new URL(url);
    assert.equal(u.origin,"https://api.the-odds-api.com");
    assert.equal(u.pathname,"/v4/sports/icehockey_nhl/odds/");
    assert.equal(u.searchParams.get("markets"),"totals");
    return new Response(raw,{status:200,headers:{"x-requests-remaining":"490","x-requests-used":"10","x-requests-last":"1"}});
  };
  t.after(()=>{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.THE_ODDS_API_KEY;else process.env.THE_ODDS_API_KEY=oldKey;});
  const before=Date.now();
  const result=await fetchNhlOdds({event_id:"nhl_event_123"});
  const after=Date.now();
  assert.deepEqual(Buffer.from(result.raw_response_base64,"base64"),raw);
  assert.equal(result.raw_response_sha256,createHash("sha256").update(raw).digest("hex"));
  assert.ok(Date.parse(result.fetched_at_utc)>=before && Date.parse(result.fetched_at_utc)<=after);
  assert.deepEqual(result.provider_quota,{remaining:490,used:10,last:1});
  assert.equal(result.events.length,1);
  assert.equal(result.events[0].id,"nhl_event_123");
  assert.equal(result.evidence_status,"UNARCHIVED_NOT_WORM");
});

test("NHL evidence rejects requested event not present; no misleading empty-event acceptance",async t=>{
  const oldFetch=globalThis.fetch, oldKey=process.env.THE_ODDS_API_KEY;
  process.env.THE_ODDS_API_KEY="fixture-only-key";
  globalThis.fetch=async()=>new Response(JSON.stringify(fixture),{status:200});
  t.after(()=>{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.THE_ODDS_API_KEY;else process.env.THE_ODDS_API_KEY=oldKey;});
  await assert.rejects(fetchNhlOdds({event_id:"missing_event_123"}),/not uniquely present/);
});
