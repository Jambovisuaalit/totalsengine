import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
test('published sitemap, robots and archive metadata match the public release scope',()=>{
 const xml=read('sitemap.xml'),robots=read('robots.txt');
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.deepEqual(urls,['/','/research','/methodology','/privacy/telegram'].map(p=>'https://totalsengine.vercel.app'+p));
 assert.doesNotMatch(xml+robots,/doctore/i);
 assert.match(robots,/Sitemap: https:\/\/totalsengine\.vercel\.app\/sitemap\.xml/);
 assert.match(read('research-preview.html'),/<meta name="robots" content="noindex, follow">/);
});
