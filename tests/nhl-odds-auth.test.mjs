import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/tools/nhl-odds.js";

function invoke({method="POST",authorization,body={}}={}) {
  const req={method,headers:authorization?{authorization}:{},body};
  let status=200,payload;
  const res={status(n){status=n;return this;},json(x){payload=x;return this;},setHeader(){return this;}};
  return Promise.resolve(handler(req,res)).then(()=>({status,payload}));
}
test("POST without Authorization returns application 401 without provider request",async()=>{
  const old=process.env.TOTALSENGINE_TOOLS_TOKEN;
  process.env.TOTALSENGINE_TOOLS_TOKEN="test-only-secret";
  try {
    const r=await invoke();
    assert.equal(r.status,401);
    assert.deepEqual(r.payload,{error:"unauthorized"});
  } finally {
    if(old===undefined) delete process.env.TOTALSENGINE_TOOLS_TOKEN;
    else process.env.TOTALSENGINE_TOOLS_TOKEN=old;
  }
});
test("POST with invalid Bearer returns application 401",async()=>{
  const old=process.env.TOTALSENGINE_TOOLS_TOKEN;
  process.env.TOTALSENGINE_TOOLS_TOKEN="test-only-secret";
  try {
    const r=await invoke({authorization:"Bearer wrong-token"});
    assert.equal(r.status,401);
    assert.deepEqual(r.payload,{error:"unauthorized"});
  } finally {
    if(old===undefined) delete process.env.TOTALSENGINE_TOOLS_TOKEN;
    else process.env.TOTALSENGINE_TOOLS_TOKEN=old;
  }
});
test("GET returns 405",async()=>{
  const r=await invoke({method:"GET"});
  assert.equal(r.status,405);
});
