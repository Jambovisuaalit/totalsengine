import test from "node:test";
import assert from "node:assert/strict";
import { fetchJson } from "../server/http-json.mjs";
import { generateFixtureReply } from "../server/telegram-webhook.mjs";

test("deadline covers a body that stalls after successful headers", async () => {
  let aborted = false,
    canceled = false;
  const fetcher = async (_url, { signal }) => {
    signal.addEventListener("abort", () => {
      aborted = true;
    });
    return new Response(
      new ReadableStream({
        cancel() {
          canceled = true;
        },
      }),
    );
  };
  await assert.rejects(
    fetchJson("https://example.invalid", {}, { fetcher, timeoutMs: 20 }),
    /TIMEOUT/,
  );
  assert.equal(aborted, true);
  assert.equal(canceled, true);
});

test("streamed JSON is bounded even without content-length", async () => {
  const fetcher = async () =>
    new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode("123456789"));
          c.close();
        },
      }),
    );
  await assert.rejects(
    fetchJson("https://example.invalid", {}, { fetcher, maxBytes: 8 }),
    /TOO_LARGE/,
  );
});

test("valid chunked JSON and non-OK provider responses", async () => {
  const { data } = await fetchJson(
    "https://example.invalid",
    {},
    { fetcher: async () => Response.json({ ok: true }) },
  );
  assert.equal(data.ok, true);
  const failed = await fetchJson(
    "https://example.invalid",
    {},
    { fetcher: async () => new Response("", { status: 429 }) },
  );
  assert.equal(failed.response.status, 429);
});

test("/games returns a controlled unavailable response for a stalled JSON body", async () => {
  const text = await generateFixtureReply("games", "", {
    nbaApiKey: "test",
    nbaTimeoutMs: 20,
    nbaFetcher: async () => new Response(new ReadableStream({})),
  });
  assert.match(text, /temporarily unavailable/);
});
