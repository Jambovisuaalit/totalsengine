import test from "node:test";
import assert from "node:assert/strict";
import {reconcile,probe} from "../scripts/check-bdl-six-games.mjs";
const row=(id,a,h,t)=>({id,date:"2026-11-02",datetime:t,postponed:false,
  visitor_team:{abbreviation:a},home_team:{abbreviation:h}});
const timestamp="2026-11-03T00:00:00.000Z";
test("exact ID from BDL is a structural match only",()=>{
 assert.deepEqual(reconcile(["401909907","OKC","CLE",timestamp],
 [row(159,"OKC","CLE",timestamp)]),
 {status:"EXACT_STRUCTURAL_MATCH_NOT_INDEPENDENTLY_VERIFIED",bdl_game_id:"159"});
});
test("reject wrong tipoff and ambiguity",()=>{
 assert.equal(reconcile(["401909907","OKC","CLE",timestamp],
 [row(1,"OKC","CLE","2026-11-03T01:00:00.000Z")]).status,"UNMATCHED");
 assert.equal(reconcile(["401909907","OKC","CLE",timestamp],
 [row(1,"OKC","CLE",timestamp),row(2,"OKC","CLE",timestamp)]).status,"AMBIGUOUS");
});
test("never claim independent provenance on successful fixture fetch",async()=>{
 const payload={data:[row(1,"OKC","CLE",timestamp)],meta:{next_cursor:null}};
 const receipt=await probe({apiKey:"dummy",fetcher:async()=>({
   ok:true,status:200,arrayBuffer:async()=>Buffer.from(JSON.stringify(payload))
 }),clock:()=>new Date("2026-11-03T09:00:00Z")});
 assert.equal(receipt.match_count,1);
 assert.equal(receipt.rows[0].bdl_game_id,"1");
 assert.equal(receipt.evaluation_eligible,false);
 assert.equal(receipt.original_response_archived,false);
 assert.match(receipt.original_response_sha256,/^[0-9a-f]{64}$/);
});
test("no key or pagination blocks the probe",async()=>{
 await assert.rejects(probe({apiKey:""}),/not available/);
 await assert.rejects(probe({apiKey:"dummy",fetcher:async()=>({
  ok:true,status:200,arrayBuffer:async()=>Buffer.from(JSON.stringify({data:[],meta:{next_cursor:42}}))
 })}),/paginated/);
});
