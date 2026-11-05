# Server-side tool calling (pilot, not production-approved)

Vercel Node functions:
- `POST /api/tools/inference` with JSON `{"prompt":"..."}` and `Authorization: Bearer <TOTALSENGINE_TOOLS_TOKEN>`
- `POST /api/tools/nhl-odds` with JSON `{"event_id":"..."}` (optional) and the same authorization.

Required server-only environment variables: `TOTALSENGINE_TOOLS_TOKEN`, `OPENAI_API_KEY`, `THE_ODDS_API_KEY`. Optional: `DUNKAPI_MCP_URL` (official HTTPS MCP URL from provider), `OPENAI_MODEL`.

Do not use `VITE_` prefixes for secrets. Never call these endpoints directly from a public browser or expose the bearer token in a client bundle. The endpoint currently has a shared service token, not per-user authentication, quotas, or audit logs. Restrict deployment access and add per-tenant auth and rate limiting before public exposure.

Inference tools: OpenAI built-in web search, DunkAPI remote MCP (only if URL configured, approval always), The Odds API NHL totals function. MCP approvals are returned to caller and not automatically executed.

The odds endpoint fetches original response bytes, records receipt time and SHA-256, and returns the bytes base64 encoded to an authorized caller. It does NOT persist bytes to an independent WORM archive, prove upstream receipt timestamps, validate NHL canonical identity, or establish historical point-in-time correctness. `UNARCHIVED_NOT_WORM` must remain HOLD until evidence is stored and independently verified. Odds responses can be absent for past events.

This backend is separate from the legacy Vite frontend and from the Python NHL/NBA research modules. Do not treat it as a deployed or approved production betting pipeline.
