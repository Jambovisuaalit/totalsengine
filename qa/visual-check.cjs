"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs"), path = require("node:path");
const base = process.env.LANDING_BASE_URL || "http://127.0.0.1:8080";
const dest = path.join(__dirname, "results");
fs.mkdirSync(dest, { recursive: true });
const cases = [
  { label:"mobile-375", width:375, height:812 },
  { label:"mobile-390", width:390, height:844 },
  { label:"tablet-768", width:768, height:1024 },
  { label:"desktop-1440", width:1440, height:900 }
];
const checks = [];
let failed = 0;
function test(ok, label, description) {
  checks.push({ viewport:label, status:ok ? "PASS":"FAIL", check:description });
  if (!ok) failed++;
}
(async function () {
  const browser = await chromium.launch({headless:true});
  try {
    for (const c of cases) {
      const context = await browser.newContext({
        viewport:{width:c.width,height:c.height}, deviceScaleFactor:1, reducedMotion:"reduce"
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      const r = await page.goto(base,{waitUntil:"networkidle",timeout:45000});
      test(r && r.status() === 200,c.label,"HTTP 200");
      await page.screenshot({path:path.join(dest,c.label+".png"),fullPage:true});
      const m = await page.evaluate(() => {
        const e = x => document.querySelector(x);
        const s = x => e(x) ? getComputedStyle(e(x)) : null;
        const rectangle = x => e(x) ? e(x).getBoundingClientRect() : null;
        const badAnchors = [...document.querySelectorAll('a[href^="#"]')]
          .map(x=>x.getAttribute("href").slice(1)).filter(x=>!document.getElementById(x));
        return {
          width:innerWidth, scroll:document.documentElement.scrollWidth, body:document.body.scrollWidth,
          hero:rectangle(".hero h1"), button:rectangle(".hero-actions .btn"),
          columns:s(".feature-tiles").gridTemplateColumns.split(" ").length,
          tileCount:document.querySelectorAll(".feature-tiles .tile").length,
          cardBackground:s(".price-card").backgroundColor,
          phoneZ:[s(".device-left").zIndex,s(".device-main").zIndex,s(".device-right").zIndex],
          kpis:[...document.querySelectorAll(".proof-metrics small")].map(x=>x.textContent.trim()),
          kpiValues:[...document.querySelectorAll(".proof-metrics strong")].map(x=>x.textContent.trim()),
          badAnchors,
          disclosed:document.body.innerText.includes("ILLUSTRATIVE VALUES") && document.body.innerText.includes("NON-COMMERCIAL DEMO"),
          closed:document.body.innerText.includes("Non-commercial concept demo"),
          checkout:[...document.querySelectorAll("a")].filter(x=>/buy\.stripe\.com|checkout/i.test(x.href)).length
        };
      });
      test(m.scroll <= m.width+1 && m.body <= m.width+1,c.label,"No horizontal scrolling ("+m.scroll+"/"+m.width+"px)");
      test(m.hero.left>=-1 && m.hero.right<=m.width+1,c.label,"Hero heading fits viewport");
      test(m.button.height>=48 && m.button.left>=-1 && m.button.right<=m.width+1,c.label,"Hero CTA has >=48px touch target and fits viewport");
      test(m.tileCount===3 && m.columns===(c.width<=780?1:3),c.label,"Bento responsive columns");
      const channel=(m.cardBackground.match(/\d+/g)||[]).slice(0,3).map(Number);
      test(channel.length===3 && channel.every(x=>x>=235),c.label,"Research-demo card is high-contrast light");
      test(Number(m.phoneZ[1])>Number(m.phoneZ[0]) && Number(m.phoneZ[1])>Number(m.phoneZ[2]),c.label,"Center phone is in front");
      test(m.kpis.join("|")==="CLV avg|Win rate|Tracked ROI|Signals tracked" && m.kpiValues.every(x=>x==="—"),c.label,"Evidence has correct titles without invented ROI");
      test(m.badAnchors.length===0,c.label,"All page anchors resolve");
      test(m.disclosed && m.closed && m.checkout===0,c.label,"Non-commercial demo disclosed, payments disabled");
      test(errors.length===0,c.label,"No page errors: "+errors.join(","));
      if(c.width<=780){
        const toggle=page.locator("#menu-toggle");
        test(await toggle.isVisible(),c.label,"Mobile navigation toggle is visible");
        await toggle.click();
        test(await page.locator("#mobile-menu").isVisible(),c.label,"Mobile menu opens");
        await page.keyboard.press("Escape");
        test(await page.locator("#mobile-menu").isHidden(),c.label,"Escape closes mobile menu");
      } else {
        test(await page.locator(".nav-links").isVisible(),c.label,"Desktop navigation is visible");
      }
      await page.locator(".accordion details summary").first().click();
      test(await page.locator(".accordion details").first().getAttribute("open")!==null,c.label,"FAQ expansion works");
      await context.close();
    }
  } finally { await browser.close(); }
  const report={passed:checks.filter(x=>x.status==="PASS").length,failed,checks};
  fs.writeFileSync(path.join(dest,"report.json"),JSON.stringify(report,null,2));
  console.log("Visual smoke test: "+report.passed+" passed, "+failed+" failed.");
  for(const c of checks.filter(x=>x.status==="FAIL")) console.error("FAIL "+c.viewport+": "+c.check);
  if(failed)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exitCode=2;});
