import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Vercel config is valid, routes to built SPA',()=>{
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.framework,'vite');
 assert.equal(config.outputDirectory,'dist');
 assert.ok(config.rewrites.some(x=>x.destination==='/index.html'));
});
test('entry document has a single HTML root and Vite mount',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.equal((html.match(/<html\b/g)||[]).length,1);
 assert.equal((html.match(/<body\b/g)||[]).length,1);
 assert.match(html,/src\/main\.tsx/);
 assert.match(html,/TotalsEngine/);
});
