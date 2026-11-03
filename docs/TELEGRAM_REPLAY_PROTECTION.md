# Telegram replay protection — deployment runbook

Status: implemented in this branch, **not provisioned or live-tested here**.

## Configuration

Use a durable Upstash Redis database with eviction disabled and capacity/expiry
monitoring. Set server-only `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` alongside the existing bot token/webhook secret.
Do not prefix credentials with VITE_. Never share the replay keyspace with
untrusted writers. Use a write-capable token scoped to the database; configure
its platform permissions outside Git. These settings are required for outgoing
bot commands: missing/unavailable storage returns 503 before any provider send.
No ephemeral/free trial database is suitable for production deduplication.

The endpoint must be the HTTPS root of an upstash.io host. The REST command
array, SET NX PX, and a single atomic Lua compare-and-set implement the store.
Reference: https://upstash.com/docs/redis/features/restapi

## States and tradeoff

1. After authentication, validation and group authorization, atomically reserve
   a bot-scoped opaque update key for 30 seconds with a random owner token.
2. Fetch fixture details if requested. Before Telegram send, compare the owner
   token and atomically replace the reservation with `dispatching`, seven-day TTL.
   An expired owner cannot send even if its network request resumes later.
3. Only an acknowledged successful Telegram response changes state to `delivered`.
4. Replays of `delivered` are acknowledged without sending. In-flight processing
   returns 503 for a later retry; abandoned pre-send leases can expire/recover.
5. Once `dispatching` is recorded, transport/storage ambiguity is **held**.
   The first failing request returns 502; subsequent replays acknowledge
   `delivery=UNKNOWN_SUPPRESSED` without re-sending. This may suppress a reply
   that never reached Telegram, but avoids duplicating a potentially accepted
   message. It is not exactly-once delivery or a guarantee of eventual delivery.
   Even a known provider failure is held for review in this conservative version.

Deduplication is bounded to seven days and the current bot-token-derived
namespace. Expired markers, token rotation, database deletion, eviction or lost
writes can remove this protection. Use one shared store across all instances.
Do not automatically delete uncertain dispatch markers or rotate the namespace
while deliveries are in flight. Operational monitoring must distinguish delivered,
busy, failed and uncertain states; HTTP 200 on a suppressed replay is not delivery.

## Data and retention

Keys are HMAC-SHA256(bot token, update ID); values contain only processing owner
or dispatch/delivery state. No message bodies, chat IDs, username or token are
stored. Processing leases expire after 30 seconds, dispatch/delivery markers
expire after seven days. This is still operational metadata; the privacy draft
and interim page now describe Upstash and require processor/transfer review.
No credentials or endpoint values are committed.

## Activation checks

- Provision/configure the durable store and server-only envs; verify no eviction.
- Verify the REST adapter against the actual service in staging, including two
  separate function instances sharing a reservation. Unit tests use doubles.
- Confirm a missing/unauthorized store produces 503 and zero sends.
- Confirm a repeated update is suppressed; test lost ownership and uncertain send
  using a controlled transport. Do not create real customer messages for smoke.
- Confirm privacy facts and platform retention before activating the deployment.
- Alert on 503 storage failures and UNKNOWN_HELD / UNKNOWN_SUPPRESSED responses.

The code change does not set production environment variables, create an external
account or send Telegram messages. Configure and review staging before promotion.
