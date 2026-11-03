import { createTelegramUpdateStore } from "../../server/telegram-update-store.mjs";
import { processTelegramUpdate } from "../../server/telegram-webhook.mjs";
export async function POST(request: Request) {
  let updateStore;
  try {
    updateStore = createTelegramUpdateStore({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
    });
  } catch {
    return Response.json(
      { error: "INVALID_UPDATE_STORE_CONFIGURATION" },
      { status: 503 },
    );
  }
  return processTelegramUpdate(request, {
    updateStore,
    secret: process.env.TELEGRAM_WEBHOOK_SECRET,
    token: process.env.TELEGRAM_BOT_TOKEN,
    nbaApiKey: process.env.BALLDONTLIE_API_KEY,
    allowedGroupId: process.env.TELEGRAM_ALLOWED_GROUP_ID,
  });
}
export function GET() {
  return Response.json(
    { error: "METHOD_NOT_ALLOWED" },
    { status: 405, headers: { "Cache-Control": "no-store" } },
  );
}
