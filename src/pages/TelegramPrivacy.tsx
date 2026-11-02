import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
export default function TelegramPrivacy(){
 return <main className="min-h-screen bg-background text-foreground">
  <Helmet><title>Telegram Privacy Notice | TotalsEngine</title><meta name="description" content="How TotalsEngine processes Telegram bot messages and identifiers." /></Helmet>
  <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
   <Link to="/" className="text-sm text-primary hover:underline">TotalsEngine / Home</Link>
   <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">Telegram Bot Privacy Notice</h1>
   <p className="mt-3 text-sm text-muted-foreground">Interim disclosure · Last updated 2 November 2026</p>
   <p className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">This interim notice describes the current Telegram bot implementation. Some provider-level retention and controller address details are still being verified. It is not a final compliance approval.</p>
   <section className="mt-10 space-y-3"><h2 className="text-xl font-semibold">1. Data controller and contact</h2>
    <p>Temporary data controller: <strong>Jami Harju (individual)</strong>. Privacy inquiries: <a className="text-primary underline" href="mailto:hello@ghoulhouse.fi">hello@ghoulhouse.fi</a>. Postal address is pending verification.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">2. Information received</h2>
    <p>Telegram may send a numeric chat ID, chat type, update ID, command and message metadata, and sender identifiers such as numeric user ID, username and display name. The reviewed bot reads command text and chat identifiers to route responses and restrict commands to an approved group. The code does not intentionally store Telegram updates in its own application database.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">3. Purposes and legal basis</h2>
    <p>We process the information to answer requests, restrict group access, protect the webhook and troubleshoot errors. The anticipated legal basis is legitimate interests under GDPR Article 6(1)(f); a documented balancing assessment is still pending. No targeted advertising or automated personal profiling is implemented in this bot.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">4. Service providers</h2>
    <p>Telegram transports commands and replies. Vercel runs server functions and processes operational request metadata. BALLDONTLIE receives NBA game identifiers for fixture lookups, not Telegram user IDs as part of the reviewed integration. Provider contracts and any international transfers require further review.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">5. Storage and retention</h2>
    <p>Bot message data is processed in server function memory for the request; the reviewed implementation does not intentionally write it to a persistent application database. However, infrastructure request logs and Telegram's own storage remain separate.</p>
    <p>Vercel documents plan-dependent runtime log retention: Hobby 1 hour, Pro 1 day, and Enterprise 3 days, with some enhanced plans providing longer retention. TotalsEngine's actual plan and applicable log retention have not been independently confirmed, so no fixed period is claimed. There were no Vercel Log Drains configured when checked on 2 November 2026. Telegram independently controls the retention of its chat history.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">6. Your rights</h2>
    <p>Depending on applicable law, you may request access, correction, erasure, restriction or portability, object to certain processing, and complain to a competent data protection authority. Contact <a href="mailto:hello@ghoulhouse.fi" className="text-primary underline">hello@ghoulhouse.fi</a>. Requests involving Telegram-held chat history may also require using Telegram's own controls.</p>
   </section>
   <section className="mt-9 space-y-3"><h2 className="text-xl font-semibold">7. Security and updates</h2>
    <p>The bot verifies a secret header and only answers explicitly addressed commands from an approved group. This notice will be revised once the controller address, provider retention terms and operational security review are complete.</p>
   </section>
   <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground"><Link className="hover:underline" to="/">TotalsEngine</Link> · <a className="underline" href="mailto:hello@ghoulhouse.fi">Privacy contact</a></footer>
  </div>
 </main>;
}