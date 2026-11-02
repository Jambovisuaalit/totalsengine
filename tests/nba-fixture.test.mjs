import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFixture, fetchNbaFixture, FixtureError } from "../server/nba-fixture.mjs";
import { inspectPredictionEvidence } from "../server/prediction-evidence.mjs";
const raw = {id:15907925,date:"2025-01-05",datetime:"2025-01-05T23:00:00.000Z",status:"Final",postponed:false,home_team:{id:6,full_name:"Cleveland Cavaliers",abbreviation:"CLE"},visitor_team:{id:4,full_name:"Charlotte Hornets",abbreviation:"CHA"},home_team_score:115,visitor_team_score:105};
test("normalize authenticated provider fixture and omit scores",()=>{
 const f=normalizeFixture(raw,"15907925","2025-01-04T00:00:00.000Z");
 assert.equal(f.home.abbreviation,"CLE");assert.equal(f.scheduled_tipoff_utc,raw.datetime);
 assert.equal("home_team_score" in f,false);
});
test("reject mismatch or nonexistent tipoff",()=>{
 assert.throws(()=>normalizeFixture(raw,"9","2025-01-04T00:00:00.000Z"),/FIXTURE_ID_MISMATCH/);
 assert.throws(()=>normalizeFixture({...raw,datetime:null},"15907925","2025-01-04T00:00:00.000Z"),/UNVERIFIED_TIPOFF/);
});
test("server-only Authorization header and URL",async()=>{
 let call;
 const f=await fetchNbaFixture("15907925","test-only-secret",{fetcher:async (url,opts)=>{call={url,opts};return {ok:true,status:200,json:async()=>({data:raw})};},now:()=>new Date("2025-01-04T00:00:00.000Z")});
 assert.equal(f.provider,"BALLDONTLIE");
 assert.equal(call.url,"https://api.balldontlie.io/v1/games/15907925");
 assert.equal(call.opts.headers.Authorization,"test-only-secret");
});
test("provider errors never silently generate fake fixtures",async()=>{
 await assert.rejects(fetchNbaFixture("15907925","test",{fetcher:async()=>({ok:false,status:401})}), e=>e instanceof FixtureError && e.code==="FIXTURE_PROVIDER_UNAUTHORIZED");
});
test("prediction structure alone is never verified provenance",()=>{
 const f=normalizeFixture(raw,"15907925","2025-01-04T00:00:00.000Z");
 assert.equal(inspectPredictionEvidence(null,f).status,"BLOCKED");
 const record={game_id:"15907925",prediction_timestamp_utc:"2025-01-05T20:00:00Z",data_cutoff_utc:"2025-01-05T19:00:00Z",predicted_total:221.2,model_version:"ridge-v2",artifact_sha256:"a".repeat(64),source_snapshot_sha256:"b".repeat(64)};
 assert.equal(inspectPredictionEvidence(record,f).status,"STRUCTURE_ONLY");
 assert.equal(inspectPredictionEvidence({...record,prediction_timestamp_utc:"2025-01-06T00:00:00Z"},f).status,"BLOCKED");
});
