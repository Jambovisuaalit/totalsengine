/* Local built-SPA smoke. No real fixtures, accounts, Redis or Telegram sends. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4179",
    "--strictPort",
  ],
  { cwd: require("node:path").resolve(__dirname, ".."), stdio: "ignore" },
);
const origin = "http://127.0.0.1:4179";
(async () => {
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(origin)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(ready, "preview must start");
    browser = await chromium.launch({ headless: true });
    let checks = 0;
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const paths = [
        "/",
        "/research",
        "/methodology",
        "/privacy/telegram",
        "/analysis",
        "/analysis/example",
        "/performance",
        "/pricing",
        "/dashboard",
        "/login",
        "/blog",
        "/go/example",
        "/missing",
      ];
      for (const path of paths) {
        await page.goto(origin + path);
        await page.waitForFunction(() =>
          document.querySelector('link[rel="canonical"]'),
        );
        assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute("href"),
          origin + path,
        );
        assert.match(await page.title(), /TotalsEngine/);
        assert.equal(
          await page
            .locator("body")
            .innerText()
            .then((s) => /doctore\.lovable\.app|Doctore AI/.test(s)),
          false,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        const publicRoute = paths.slice(0, 4).includes(path);
        if (!publicRoute) {
          assert.equal(
            await page.locator("h1").innerText(),
            "Page unavailable",
          );
          assert.equal(
            await page.locator('meta[name="robots"]').getAttribute("content"),
            "noindex, follow",
          );
          await page.getByRole("link", { name: "TotalsEngine / Home" }).click();
          await page.waitForURL(origin + "/");
          await page.waitForFunction(
            () =>
              document.querySelector('link[rel="canonical"]').href ===
              location.origin + "/",
          );
          assert.equal(
            await page.locator('meta[name="robots"]').getAttribute("content"),
            "index, follow",
          );
        }
        checks++;
      }
      await page.goto(origin);
      if (viewport.width < 500) {
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("button", { name: "Close menu", exact: true })
            .getAttribute("aria-expanded"),
          "true",
        );
        checks++;
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      JSON.stringify({
        status: "PASS",
        route_viewport_checks: checks,
        viewports: 2,
        external_service_tests: false,
      }),
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
