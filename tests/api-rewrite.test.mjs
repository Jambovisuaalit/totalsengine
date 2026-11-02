import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
test("API paths survive Vite SPA rewrite",()=>{
const x=JSON.parse(readFileSync(new URL("../vercel.json",import.meta.url),"utf8"));
assert.deepEqual(x.rewrites[0],{source:"/api/:path*",destination:"/api/:path*"});
assert.equal(x.rewrites.at(-1).destination,"/index.html");
});
