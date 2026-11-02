import { activateTelegramWebhook } from "../../server/telegram-registration.mjs";
export async function POST(request: Request) {
 return activateTelegramWebhook(request,{
  authorizationHash:"64230ae18a6a514658d439d9942f2d07b1e6921631fd6cb45924bbc91eb9f9c6",
  vercelEnv:process.env.VERCEL_ENV,
  botToken:process.env.TELEGRAM_BOT_TOKEN,
  secret:process.env.TELEGRAM_WEBHOOK_SECRET,
  allowedGroupId:process.env.TELEGRAM_ALLOWED_GROUP_ID
 });
}
export function GET() { return new Response(null,{status:405,headers:{"Cache-Control":"no-store"}}); }
