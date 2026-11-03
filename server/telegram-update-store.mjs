import { createHmac, randomUUID } from "node:crypto";
import { fetchJson } from "./http-json.mjs";

const LEASE_MS = 30_000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
// One atomic compare-and-set. An expired owner can never dispatch a reply.
const TRANSITION = `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
return 1`;

/** Shared Redis store: no chat IDs, message text or raw updates are persisted. */
export function createTelegramUpdateStore({
  url,
  token,
  botToken,
  fetcher = fetch,
}) {
  if (!url || !token || !botToken) return null;
  const endpoint = new URL(url);
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".upstash.io") ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== "/" ||
    endpoint.port
  )
    throw new Error("INVALID_UPDATE_STORE_URL");
  const command = async (args) => {
    const { response, data } = await fetchJson(
      endpoint.href,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      },
      { fetcher, timeoutMs: 3000, maxBytes: 16_384 },
    );
    if (!response.ok || !data || data.error || !("result" in data)) {
      throw new Error("UPDATE_STORE_UNAVAILABLE");
    }
    return data.result;
  };
  // Derive bot-scoped opaque keys without putting credentials in the keyspace.
  const key = (id) =>
    "totalsengine:telegram:" +
    createHmac("sha256", botToken).update(String(id)).digest("hex");
  return {
    async claim(id) {
      const owner = `processing:${randomUUID()}`;
      if (
        (await command(["SET", key(id), owner, "NX", "PX", LEASE_MS])) === "OK"
      ) {
        return { status: "claimed", owner };
      }
      const state = await command(["GET", key(id)]);
      if (state === "delivered") return { status: "delivered" };
      if (state === "dispatching") return { status: "uncertain" };
      if (typeof state === "string" && state.startsWith("processing:"))
        return { status: "busy" };
      throw new Error("UPDATE_STORE_STATE_UNKNOWN");
    },
    async beginDispatch(id, owner) {
      return (
        (await command([
          "EVAL",
          TRANSITION,
          1,
          key(id),
          owner,
          "dispatching",
          RETENTION_MS,
        ])) === 1
      );
    },
    async delivered(id) {
      if (
        (await command([
          "EVAL",
          TRANSITION,
          1,
          key(id),
          "dispatching",
          "delivered",
          RETENTION_MS,
        ])) !== 1
      ) {
        throw new Error("UPDATE_STORE_STATE_UNKNOWN");
      }
    },
  };
}
