/** Bound the entire HTTP exchange, including streamed JSON, not just headers. */
export async function fetchJson(
  url,
  init,
  { fetcher = fetch, timeoutMs = 6500, maxBytes = 2_000_000 } = {},
) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("HTTP_JSON_TIMEOUT"));
    }, timeoutMs);
  });
  const exchange = async () => {
    const response = await fetcher(url, {
      ...init,
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      return { response, data: null };
    }
    if (Number(response.headers?.get("content-length") || 0) > maxBytes) {
      controller.abort();
      throw new Error("HTTP_JSON_TOO_LARGE");
    }
    // Native fetch responses use the bounded stream. The fallback supports
    // transport test doubles; the same overall deadline still applies.
    if (!response.body?.getReader)
      return { response, data: await response.json() };
    const reader = response.body.getReader();
    const cancel = () => {
      void reader.cancel().catch(() => {});
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted) throw new Error("HTTP_JSON_TIMEOUT");
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          controller.abort();
          void reader.cancel().catch(() => {});
          throw new Error("HTTP_JSON_TOO_LARGE");
        }
        chunks.push(Buffer.from(value));
      }
      return {
        response,
        data: JSON.parse(Buffer.concat(chunks).toString("utf8")),
      };
    } finally {
      controller.signal.removeEventListener("abort", cancel);
      reader.releaseLock();
    }
  };
  try {
    return await Promise.race([exchange(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
