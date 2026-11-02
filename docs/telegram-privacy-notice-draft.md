# TotalsEngine Telegram Privacy Notice — publication draft (2 November 2026)

**INTERIM REVIEW — not yet legally approved.** The user has identified Jami Harju as the temporary data controller and hello@ghoulhouse.fi as privacy contact. The controller's service address, Vercel tier and data retention criteria still require verification.

## Data controller
Data controller (individual, interim): **Jami Harju**
Contact for privacy requests: **hello@ghoulhouse.fi**
Postal/service address and jurisdiction: **[PENDING VERIFICATION]**

## Data handled
When a person sends a Telegram command to @TotalsEngine_bot, Telegram can include the chat ID, chat type, update ID, command, sender user ID, username, display name and message metadata. TotalsEngine's reviewed server-side webhook code reads the chat ID and command text, checks group authorization, requests NBA fixture data, and sends a response. It contains no explicit database write or custom logging of Telegram messages. Telegram itself retains information under its own privacy rules.

## Purposes and legal basis
Respond to requested commands, enforce group access restrictions, secure the service and diagnose failures. Proposed GDPR legal basis: legitimate interests (Article 6(1)(f)), subject to controller assessment. No targeted advertising or profiling is in the reviewed Telegram webhook functionality.

## Service providers
Telegram supplies incoming updates and delivers replies. Vercel hosts functions and captures infrastructure-level metadata. BALLDONTLIE supplies NBA game details based on provider game IDs, not Telegram user identifiers. International transfers and contractual safeguards must be reviewed before publication.

## Retention
**Application memory:** Telegram update data is handled during the invocation and is not deliberately persisted by reviewed application code. This does not exclude platform-generated logs or external provider storage.

**Vercel logs:** according to Vercel's runtime logs documentation, the published plan-dependent retention is Hobby 1 hour, Pro 1 day, Enterprise 3 days, or up to 30 days with Observability Plus. TotalsEngine's actual subscription tier remains unverified; do not state a particular period as confirmed. The Vercel team's list of log drains returned none on 2 November 2026. Source: https://vercel.com/docs/logs/runtime

**Telegram:** messages and updates may be retained by Telegram under its own policies; the project does not control that platform's retention.

**Privacy requests:** separate record retention and deletion workflows remain to be specified. Data is otherwise to be limited to what is needed for operation and documented legal obligations. GDPR imposes storage limitation but no universal fixed period.

## Your rights
Where applicable, individuals can request access, correction, deletion, restriction and portability, object to processing and complain to their competent data protection authority. Use hello@ghoulhouse.fi for requests.

## Security
The application validates a secret Telegram webhook header and permits group commands only in an explicitly configured group. Ordinary group chat messages are not intentionally answered. Review of platform logging, access controls, rate limits and idempotency is pending.

## Conditions for publication
- [x] Temporary controller name provided: Jami Harju.
- [x] Privacy email provided: hello@ghoulhouse.fi (mailbox deliverability not independently tested).
- [ ] Confirm postal/service address and jurisdiction.
- [ ] Verify actual Vercel plan, runtime log retention and any additional processors.
- [ ] Confirm international transfers and security measures.
- [ ] Confirm the legal basis and privacy-rights workflow.
- [ ] Publish at an HTTPS URL, then set it in BotFather.

This draft is intentionally not a final GDPR notice while mandatory facts remain unverified.
