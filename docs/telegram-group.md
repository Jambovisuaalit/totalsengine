# Telegram group integration — security gate

This branch enables group commands only for an explicitly configured Telegram group.

## Configuration

Server-only Vercel environment variable: `TELEGRAM_ALLOWED_GROUP_ID` = **numeric negative Telegram group chat ID**, e.g. `-1001234567890` (example, not the user's ID). The invite link does **not** reveal this ID. Never derive it from the invite hash or assume an ID.

Add `@TotalsEngine_bot` to the intended Telegram group via Telegram client. Do not promote it to admin unless an admin-only function is needed. Retain Telegram privacy mode so ordinary chat messages are not forwarded to the bot.

After the webhook is registered on a publicly reachable, accepted deployment, obtain the actual chat ID through a controlled Telegram test update or another verified Telegram API mechanism. Configure the allowlist and redeploy. Before the ID is configured, all group commands fail closed.

## Group commands

Use `/start@TotalsEngine_bot`, `/games@TotalsEngine_bot` or `/analyze@TotalsEngine_bot <provider_game_id>`. Commands without explicit bot username and all commands in other groups are silently ignored. Private-chat commands continue working.

Fixture data is source-verified; model predictions and bookmaker odds remain BLOCKED. The Telegram webhook remains protected by its secret header. No real group operation is claimed before a live acceptance test.

## Acceptance checks

- Reject missing/wrong webhook secret.
- Reject unknown group, absent group allowlist, wrong bot mention, and ordinary chat text.
- Allow the exact group ID to send one explicit `/start@TotalsEngine_bot` command.
- Verify production webhook reachability, Telegram `getWebhookInfo`, a real `/start` response and provider-backed `/games`.
- Before public-scale launch: persistent update-id deduplication and per-chat/per-user rate limiting (serverless memory-only controls are insufficient), operational monitoring, published privacy policy.

Do not register Telegram `setWebhook` to a Vercel-Authentication-protected Preview URL.
