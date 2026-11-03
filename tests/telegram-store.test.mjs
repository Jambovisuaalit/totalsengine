import test from "node:test";
import assert from "node:assert/strict";
import { createTelegramUpdateStore } from "../server/telegram-update-store.mjs";

// REST contract double: executes the SET/GET/CAS semantics, not a live Redis test.
function redisContract() {
  const rows = new Map(),
    commands = [];
  let now = 0;
  const fetcher = async (_url, init) => {
    const args = JSON.parse(init.body);
    commands.push(args);
    const [cmd, ...a] = args;
    const k = cmd === "EVAL" ? a[2] : a[0];
    if (rows.get(k)?.expires <= now) rows.delete(k);
    let result;
    if (cmd === "SET") {
      assert.deepEqual(a.slice(2, 5), ["NX", "PX", 30000]);
      if (rows.has(k)) result = null;
      else {
        rows.set(k, { value: a[1], expires: now + a[4] });
        result = "OK";
      }
    } else if (cmd === "GET") result = rows.get(k)?.value ?? null;
    else if (cmd === "EVAL") {
      assert.match(a[0], /redis.call\('GET', KEYS\[1\]\) ~= ARGV\[1\]/);
      assert.equal(a[1], 1);
      if (rows.get(k)?.value !== a[3]) result = 0;
      else {
        rows.set(k, { value: a[4], expires: now + a[5] });
        result = 1;
      }
    } else throw Error("unexpected command");
    return Response.json({ result });
  };
  return {
    fetcher,
    commands,
    advance: (ms) => {
      now += ms;
    },
  };
}
const make = (r) =>
  createTelegramUpdateStore({
    url: "https://test.upstash.io",
    token: "test-rest-token",
    botToken: "test-bot-token",
    fetcher: r.fetcher,
  });

test("separate adapters share atomic owner state, delivered retention, and opaque keys", async () => {
  const r = redisContract(),
    a = make(r),
    b = make(r);
  const owner = await a.claim(42);
  assert.equal((await b.claim(42)).status, "busy");
  assert.equal(await b.beginDispatch(42, "wrong"), false);
  assert.equal(await a.beginDispatch(42, owner.owner), true);
  assert.equal((await b.claim(42)).status, "uncertain");
  await a.delivered(42);
  assert.equal((await b.claim(42)).status, "delivered");
  assert.equal(
    r.commands
      .filter((c) => c[0] === "EVAL")
      .at(-1)
      .at(-1),
    604800000,
  );
  const key = r.commands[0][1];
  assert.match(key, /^totalsengine:telegram:[a-f0-9]{64}$/);
  assert.ok(!key.includes("test-bot-token"));
});

test("expired processing lease is reclaimable, but former owner is fenced out", async () => {
  const r = redisContract(),
    a = make(r),
    b = make(r);
  const old = await a.claim(42);
  r.advance(30001);
  const current = await b.claim(42);
  assert.equal(current.status, "claimed");
  assert.equal(await a.beginDispatch(42, old.owner), false);
  assert.equal(await b.beginDispatch(42, current.owner), true);
});

test("missing, malformed and unauthorized storage fail closed", async () => {
  assert.equal(createTelegramUpdateStore({}), null);
  for (const url of [
    "http://test.upstash.io",
    "https://evil.invalid",
    "https://test.upstash.io/path",
  ]) {
    assert.throws(
      () => createTelegramUpdateStore({ url, token: "x", botToken: "y" }),
      /INVALID/,
    );
  }
  const a = createTelegramUpdateStore({
    url: "https://test.upstash.io",
    token: "x",
    botToken: "y",
    fetcher: async () => new Response("", { status: 401 }),
  });
  await assert.rejects(a.claim(42), /UNAVAILABLE/);
});
