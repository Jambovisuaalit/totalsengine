import { processTelegramUpdate } from "../../server/telegram-webhook.mjs";
export async function POST(request: Request) {
 return processTelegramUpdate(request,{
  secret:process.env.TELEGRAM_WEBHOOK_SECRET,
  token:process.env.TELEGRAM_BOT_TOKEN
 });
}
export function GET() {
 return Response.json({error:"METHOD_NOT_ALLOWED"}, {status:405,headers:{"Cache-Control":"no-store"}});
}
