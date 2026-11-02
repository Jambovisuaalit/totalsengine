# Telegram webhook MVP

Bot: @TotalsEngine_bot. Webhook handler: POST /api/telegram/webhook. Uses Vercel Node function and Telegram Bot API sendMessage.

## Secrets

Store TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET as Vercel **Sensitive** server-side environment variables. Neither is VITE-prefixed. The webhook secret is sent to Telegram's setWebhook API as secret_token and is required in each incoming request's X-Telegram-Bot-Api-Secret-Token header. Missing or incorrect secret fails closed before parsing updates. Never log tokens, headers or message text.

## Register webhook (manual restricted step)

Do not register a preview deployment protected by Vercel Authentication: Telegram cannot POST through the authentication wall. When the webhook is deployed to a reachable HTTPS hostname and reviewed, register via Telegram Bot API with token in server-side environment:

`POST https://api.telegram.org/bot<TOKEN>/setWebhook`

JSON body:
`{"url":"https://<approved-host>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>","allowed_updates":["message"],"drop_pending_updates":false}`

Do not leak token in shell history, code, logs or URLs displayed to users. Confirm identity with getMe, then check getWebhookInfo for URL, last_error_message, pending_update_count. Test an actual private-chat /start and confirm a Telegram sendMessage response. BotFather menu configuration alone does not register the webhook.

## Current supported commands

/start, /help, /status, /methodology, /performance return honest information. /games and /analyze explicitly state that fixture/forecast evidence remains pending; they do not invent data or predictions. Full fixture integration must be independently accepted before these commands are unlocked.

## Acceptance gates

1. GitHub CI: lint, Node tests including webhook unit tests, build and research tests.
2. Preview deployment READY.
3. Endpoint returns 401 for missing/invalid webhook header (from authenticated deployment test path).
4. Telegram setWebhook, getWebhookInfo, and a real /start sendMessage verified. Keep unmerged if blocked.
5. Before public launch: add persistent update_id deduplication, abuse/rate controls, monitoring and retention/privacy policy; prevent open group spam.

This MVP intentionally omits stored user data and does not claim historical prediction accuracy.
