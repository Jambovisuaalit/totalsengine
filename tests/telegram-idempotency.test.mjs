import test from "node:test";
import assert from "node:assert/strict";
import { processTelegramUpdate } from "../server/telegram-webhook.mjs";
import { TestUpdateStore } from "./helpers/update-store.mjs";
const req = () =>
  new Request("https://example.invalid", {
    method: "POST",
    headers: { "x-telegram-bot-api-secret-token": "test" },
    body: JSON.stringify({
      update_id: 42,
      message: { chat: { id: 1, type: "private" }, text: "/start" },
    }),
  });
const config = (store, fetcher) => ({
  secret: "test",
  token: "test",
  updateStore: store,
  fetcher,
});

test("sequential and concurrent retries have only one send", async () => {
  const store = new TestUpdateStore();
  let sent = 0;
  const opts = config(store, async () => {
    sent++;
    return Response.json({ ok: true });
  });
  const responses = await Promise.all(
    Array.from({ length: 20 }, () => processTelegramUpdate(req(), opts)),
  );
  assert.equal(sent, 1);
  assert.ok(responses.some((r) => r.status === 200));
  const duplicate = await (await processTelegramUpdate(req(), opts)).json();
  assert.equal(duplicate.duplicate, true);
  assert.equal(sent, 1);
});

test("missing or failed shared store never calls an outgoing provider", async () => {
  let sent = 0;
  const fetcher = async () => {
    sent++;
    return Response.json({ ok: true });
  };
  assert.equal(
    (await processTelegramUpdate(req(), config(null, fetcher))).status,
    503,
  );
  const store = {
    claim: async () => {
      throw Error("unavailable");
    },
  };
  assert.equal(
    (await processTelegramUpdate(req(), config(store, fetcher))).status,
    503,
  );
  assert.equal(sent, 0);
});

test("expired owner cannot send and a pre-dispatch storage failure cannot send", async () => {
  let sent = 0;
  const fetcher = async () => {
    sent++;
    return Response.json({ ok: true });
  };
  for (const beginDispatch of [
    async () => false,
    async () => {
      throw Error("unavailable");
    },
  ]) {
    const store = {
      claim: async () => ({ status: "claimed", owner: "old" }),
      beginDispatch,
    };
    assert.equal(
      (await processTelegramUpdate(req(), config(store, fetcher))).status,
      503,
    );
  }
  assert.equal(sent, 0);
});

test("uncertain send outcome is held instead of resent on retry", async () => {
  const store = new TestUpdateStore();
  let sent = 0;
  const opts = config(store, async () => {
    sent++;
    throw Error("lost response");
  });
  assert.equal((await processTelegramUpdate(req(), opts)).status, 502);
  const replay = await (await processTelegramUpdate(req(), opts)).json();
  assert.equal(replay.delivery, "UNKNOWN_SUPPRESSED");
  assert.equal(sent, 1);
});

test("stalled Telegram response body reaches deadline and is not resent", async () => {
  const store = new TestUpdateStore();
  let sent = 0;
  const opts = {
    ...config(store, async () => {
      sent++;
      return new Response(new ReadableStream({}));
    }),
    telegramTimeoutMs: 20,
  };
  assert.equal((await processTelegramUpdate(req(), opts)).status, 502);
  assert.equal(
    (await (await processTelegramUpdate(req(), opts)).json()).delivery,
    "UNKNOWN_SUPPRESSED",
  );
  assert.equal(sent, 1);
});

test("delivered reply with failed storage receipt is held, never claimed delivered", async () => {
  const store = new TestUpdateStore();
  store.delivered = async () => {
    throw Error("lost receipt");
  };
  let sent = 0;
  const opts = config(store, async () => {
    sent++;
    return Response.json({ ok: true });
  });
  const first = await processTelegramUpdate(req(), opts);
  assert.equal(first.status, 502);
  assert.notEqual((await first.json()).delivered, true);
  assert.equal(
    (await (await processTelegramUpdate(req(), opts)).json()).delivery,
    "UNKNOWN_SUPPRESSED",
  );
  assert.equal(sent, 1);
});
