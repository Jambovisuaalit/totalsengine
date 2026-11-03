import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, Clock3,
  Database, Fingerprint, LockKeyhole, Menu, ShieldCheck, Target, X
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#research", label: "Research" },
  { href: "#methodology", label: "Methodology" },
  { href: "#faq", label: "FAQ" },
];

const MODEL = [
  { name: "01 / DATA", title: "Start with the game", copy: "NBA matchup and recent completed-game results are collected into a repeatable research record." },
  { name: "02 / MODEL", title: "Estimate the total", copy: "A frozen rolling-baseline model produces a pregame total-points estimate. It is a research estimate, not a betting recommendation." },
  { name: "03 / OUTCOME", title: "Measure the error", copy: "Once the game is final, the estimated total is compared with the actual combined points. MAE and RMSE are calculated from matched observations." },
];

const FAQ = [
  {
    question: "Does TotalsEngine tell me what to bet?",
    answer: "No. The current system is a research pipeline for NBA game-total estimates. It does not publish verified betting edges, recommend stakes, or place bets.",
  },
  {
    question: "Are the predictions independently verified?",
    answer: "Not yet. Research runs and records can be inspected in GitHub, but their source availability and timestamps are not independently certified. The verified-performance gate remains closed.",
  },
  {
    question: "How are accuracy and profitability different?",
    answer: "MAE and RMSE measure how far a point-total estimate differs from the final score. Profitability requires authentic, timestamped market lines and prices, plus separate out-of-sample evaluation. A low prediction error alone does not establish a betting edge.",
  },
  {
    question: "Can I subscribe or get live picks?",
    answer: "There is no paid product or live picks subscription available. The interface preview illustrates the intended analysis flow while the prospective research study continues.",
  },
];

const GITHUB_DOC = "https://github.com/Jambovisuaalit/totalsengine/blob/main/docs/PROJECT_STATUS.md";

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#08090e] text-[#f7f5f2] selection:bg-[#ff9b65]/30 selection:text-white">
      <SEOHead
        title="TotalsEngine — NBA totals, tested against reality"
        description="NBA game-total prediction research. Explore the analysis workflow, pregame forecast logging, and transparent evaluation process. Research only; no verified betting edges."
      />

      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#08090e]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:h-[74px] sm:px-8">
          <Link to="/" className="inline-flex shrink-0 items-center gap-3" aria-label="TotalsEngine home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff9b65] text-[#16100d]"><BarChart3 className="h-5 w-5" strokeWidth={2.6}/></span>
            <span className="text-[17px] font-bold tracking-[-0.045em] text-white">TOTALS<span className="font-normal text-[#ff9b65]">ENGINE</span></span>
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => <a href={item.href} key={item.href} className="text-[13px] font-medium text-white/55 transition-colors hover:text-white">{item.label}</a>)}
          </nav>
          <div className="hidden md:block"><a href="/research-preview.html" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:border-[#ff9b65]/70 hover:text-[#ff9b65]">Explore demo <ArrowUpRight className="h-4 w-4" /></a></div>
          <button type="button" aria-expanded={menuOpen} aria-controls="totals-mobile-nav" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 md:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <nav id="totals-mobile-nav" aria-label="Mobile navigation" className="flex flex-col gap-1 border-t border-white/10 bg-[#0c0d12] p-4 md:hidden">
          {NAV.map((item) => <a key={item.href} onClick={() => setMenuOpen(false)} href={item.href} className="rounded-lg px-4 py-3 text-sm text-white/80 hover:bg-white/5">{item.label}</a>)}
          <a href="/research-preview.html" className="rounded-lg px-4 py-3 text-sm font-semibold text-[#ff9b65]">Explore demo</a>
        </nav>}
      </header>

      <main id="content">
        <section className="relative overflow-hidden border-b border-white/[0.08]" aria-labelledby="landing-title">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)", backgroundSize: "66px 66px", maskImage: "linear-gradient(to bottom,black,transparent 95%)" }}/>
          <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-[54%] h-[630px] w-[630px] rounded-full bg-[#9b4524]/[0.14] blur-[130px]" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-16 pt-14 sm:gap-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1fr_.91fr] lg:gap-16 lg:pb-28 lg:pt-28">
            <div>
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#ff9b65]/25 bg-[#ff9b65]/[0.08] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffb18a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff9b65]"/> NBA TOTALS / FORWARD RESEARCH
              </div>
              <h1 id="landing-title" className="max-w-[650px] text-[clamp(2.85rem,13vw,6.4rem)] font-semibold leading-[0.99] tracking-[-0.075em] text-white">
                Read the game.<br/><span className="text-[#ff9b65]">Measure the model.</span>
              </h1>
              <p className="mt-8 max-w-[550px] text-base leading-[1.85] text-[#a7a7b2] sm:text-lg">
                NBA totals analysis built around a simple principle: record the prediction before the game, measure it after the final buzzer, and let the evidence do the talking.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
                <a href="/research-preview.html" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#ff9b65] px-6 sm:justify-start text-sm font-bold text-[#160f0b] transition-colors hover:bg-[#ffb58c]">Explore the interface <ArrowUpRight className="h-4 w-4"/></a>
                <a href="#how-it-works" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-white/20 px-6 sm:justify-start text-sm font-semibold text-white transition-colors hover:bg-white/[.06]">How it works <ArrowRight className="h-4 w-4"/></a>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-white/40">Interface preview only. No live picks, odds, or verified betting edge.</p>
            </div>

            <div className="relative" aria-label="Illustrative NBA totals model research panel">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-5 rounded-[36px] bg-[#ff9b65]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.13] bg-[#101219] shadow-[0_28px_100px_rgba(0,0,0,.45)]">
                <div className="flex items-center justify-between border-b border-white/[0.09] px-5 py-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Model research / preview</span>
                  <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">Research only</span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-white/35"><span>Game totals / NBA</span><span>Illustrative layout</span></div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/10 pb-7 text-center">
                    <div><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#1e2430] text-xl font-bold text-white/80 mx-auto">A</div><p className="text-sm font-semibold text-white">Away</p><p className="text-[11px] text-white/40">Team</p></div>
                    <span className="text-xs text-white/30">VS</span>
                    <div><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#1e2430] text-xl font-bold text-white/80 mx-auto">H</div><p className="text-sm font-semibold text-white">Home</p><p className="text-[11px] text-white/40">Team</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-6">
                    <div className="rounded-xl border border-white/10 bg-[#171b23] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">Predicted total</p><div className="mt-3 h-5 w-24 rounded-md bg-white/10" aria-hidden="true"/><p className="mt-3 text-xs text-white/45">Pending actual data</p></div>
                    <div className="rounded-xl border border-white/10 bg-[#171b23] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">Model accuracy</p><div className="mt-3 h-5 w-20 rounded-md bg-white/10" aria-hidden="true"/><p className="mt-3 text-xs text-white/45">Prospective evaluation</p></div>
                  </div>
                  <div className="space-y-3 border-t border-white/10 pt-6">
                    {[["01", "Pregame estimate", "Recorded"], ["02", "Final score", "Pending"], ["03", "Error calculation", "Pending"]].map(([n, label, status]) => (
                      <div key={n} className="flex items-center justify-between gap-3 text-xs"><div className="flex items-center gap-3"><span className="font-mono text-[#ff9b65]/80">{n}</span><span className="text-white/75">{label}</span></div><span className={status === "Recorded" ? "text-[#b6d2be]" : "text-white/35"}>{status}</span></div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-white/[0.09] bg-white/[0.02] px-6 py-4 text-[11px] text-white/45"><LockKeyhole className="h-3.5 w-3.5" /> No hypothetical performance displayed as fact</div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Research principles" className="border-b border-white/[0.08] bg-[#0c0e14]">
          <div className="mx-auto grid max-w-[1200px] gap-5 px-5 py-8 sm:grid-cols-3 sm:gap-10 sm:px-8">
            {[["01", "One market", "NBA full-game point totals"],["02", "One workflow", "Predict → record → evaluate"],["03", "One standard", "Evidence before performance claims"]].map(([n,title,desc]) => (
              <div key={n} className="flex items-start gap-4"><span className="font-mono text-xs text-[#ff9b65]">{n}</span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs text-[#8b8d9b]">{desc}</p></div></div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 max-w-[670px]"><p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#ff9b65]">The process</p><h2 className="text-4xl font-semibold leading-[1.08] tracking-[-.055em] text-white sm:text-5xl">From pregame estimate<br/>to measurable error.</h2><p className="mt-5 text-base leading-relaxed text-[#989aa8]">A transparent research workflow, not a stream of unverified selections.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {MODEL.map((item) => <article key={item.name} className="rounded-2xl border border-white/10 bg-[#11131a] p-7 transition-colors hover:border-[#ff9b65]/30 sm:p-8">
                <p className="font-mono text-[11px] tracking-[.12em] text-[#ff9b65]">{item.name}</p><h3 className="mt-10 text-xl font-semibold tracking-tight text-white">{item.title}</h3><p className="mt-4 text-sm leading-[1.8] text-[#9b9eaa]">{item.copy}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section id="research" className="scroll-mt-24 border-y border-white/[0.08] bg-[#0f1118] px-5 py-24 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[.95fr_1fr] lg:gap-24">
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#ff9b65]">Development status</p>
              <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-.055em] text-white sm:text-5xl">Proof first.<br/>Product second.</h2>
              <p className="mt-6 max-w-[500px] text-base leading-[1.85] text-[#a3a5b0]">TotalsEngine is in prospective research. A fixed rolling-baseline model records NBA totals estimates before tipoff. Results are reconciled after games finish; the evidence chain and model performance are still being evaluated.</p>
              <a href={GITHUB_DOC} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#ffb18a] hover:text-white">Read the research log <ArrowUpRight className="h-4 w-4"/></a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151821] p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3"><h3 className="text-base font-semibold text-white">Research status</h3><span className="rounded-md bg-[#ff9b65]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#ffb18a]">Validation in progress</span></div>
              <div className="space-y-0">
                {[
                  { icon: Check, title: "Automated forecast collection", status: "Running", positive: true },
                  { icon: Check, title: "Result-matching pipeline", status: "Running", positive: true },
                  { icon: Check, title: "GitHub research ledger", status: "Running", positive: true },
                  { icon: Clock3, title: "Prospective accuracy assessment", status: "Collecting", positive: false },
                  { icon: Clock3, title: "Independently verified betting edge", status: "Not established", positive: false },
                ].map(({icon: Icon,title,status,positive}) => <div key={title} className="flex items-center justify-between gap-4 border-t border-white/10 py-4"><div className="flex items-center gap-3"><Icon className={"h-4 w-4 shrink-0 "+(positive?"text-[#a7c4ae]":"text-white/35")}/><span className="text-[13px] text-white/85">{title}</span></div><span className="shrink-0 text-[11px] text-white/40">{status}</span></div>)}
              </div>
              <div className="mt-5 rounded-xl border border-[#ff9b65]/15 bg-[#ff9b65]/[0.05] px-4 py-3 text-xs leading-relaxed text-[#b9a99f]">Research only. No verified ROI, EV, CLV or profitable betting record is claimed.</div>
            </div>
          </div>
        </section>

        <section id="methodology" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-[710px]"><p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#ff9b65]">Methodology</p><h2 className="text-4xl font-semibold leading-[1.08] tracking-[-.055em] text-white sm:text-5xl">A prediction is only as useful as its evidence.</h2><p className="mt-6 text-base leading-relaxed text-[#9ca0ad]">We separate how accurately the model predicts NBA scores from whether any market opportunity exists. Those are different questions and require different data.</p></div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-[#11131a] p-7 sm:p-8"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff9b65]/10 text-[#ff9b65]"><Target className="h-5 w-5"/></div><h3 className="text-xl font-semibold text-white">Prediction accuracy</h3><p className="mt-4 text-sm leading-[1.8] text-[#a3a4ae]">Compare predicted points with the final combined score. Track mean absolute error (MAE), root mean squared error (RMSE), bias, sample size and pending games. No score, no metric.</p></article>
              <article className="rounded-2xl border border-white/10 bg-[#11131a] p-7 sm:p-8"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff9b65]/10 text-[#ff9b65]"><ShieldCheck className="h-5 w-5"/></div><h3 className="text-xl font-semibold text-white">Market evidence</h3><p className="mt-4 text-sm leading-[1.8] text-[#a3a4ae]">A betting edge would require authentic bookmaker lines, executable prices, precise timestamps and a separate validation process. That evidence has not been established and no edge is shown.</p></article>
              <article className="rounded-2xl border border-white/10 bg-[#11131a] p-7 sm:p-8"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff9b65]/10 text-[#ff9b65]"><Database className="h-5 w-5"/></div><h3 className="text-xl font-semibold text-white">Traceable records</h3><p className="mt-4 text-sm leading-[1.8] text-[#a3a4ae]">Research artifacts include model version, NBA source game ID, generation time and content hashes. GitHub records support auditability but are not independently certified timestamps or immutable storage.</p></article>
              <article className="rounded-2xl border border-white/10 bg-[#11131a] p-7 sm:p-8"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff9b65]/10 text-[#ff9b65]"><Fingerprint className="h-5 w-5"/></div><h3 className="text-xl font-semibold text-white">Frozen model, honest comparison</h3><p className="mt-4 text-sm leading-[1.8] text-[#a3a4ae]">The live research collector uses rolling-team-total-v1. Experimental Ridge results remain retrospective and are not being promoted as live forward performance.</p></article>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.08] bg-[#0e1016] px-5 py-20 sm:px-8">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#ff9b65]">Explore the concept</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-.05em] text-white sm:text-4xl">See how a transparent totals analysis interface could work.</h2><p className="mt-4 text-sm text-[#9fa0ac]">Illustrative screens, not a live recommendations product.</p></div>
            <a href="/research-preview.html" className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-[#ff9b65] px-6 py-4 text-sm font-bold text-[#160f0b] hover:bg-[#ffb58c]">Open research preview <ArrowUpRight className="h-4 w-4"/></a>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[.8fr_1fr] md:gap-20">
            <div><p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#ff9b65]">FAQ</p><h2 className="text-4xl font-semibold tracking-[-.055em] text-white">Questions worth asking.</h2><p className="mt-5 text-sm leading-relaxed text-[#a1a3b0]">What the research can show today — and what it cannot.</p></div>
            <div className="divide-y divide-white/10 border-t border-white/10">
              {FAQ.map((item,i)=><div key={item.question}><button type="button" aria-expanded={openFaq === i} aria-controls={"te-faq-"+i} onClick={()=>setOpenFaq(openFaq===i?null:i)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium text-white"><span>{item.question}</span><ChevronDown className={"h-4 w-4 shrink-0 text-[#ff9b65] transition-transform "+(openFaq===i?"rotate-180":"")}/></button>{openFaq===i && <p id={"te-faq-"+i} className="pb-6 pr-8 text-sm leading-[1.8] text-[#a6a8b2]">{item.answer}</p>}</div>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#090b10] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><Link to="/" className="text-lg font-bold tracking-[-.055em] text-white">TOTALS<span className="font-normal text-[#ff9b65]">ENGINE</span></Link><p className="mt-3 max-w-md text-xs leading-relaxed text-white/45">An evidence-led NBA totals research project. No betting advice, no guaranteed outcomes and no paid picks.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/55"><a href="#how-it-works" className="hover:text-white">Process</a><a href="#research" className="hover:text-white">Status</a><a href="#methodology" className="hover:text-white">Methodology</a><a href={GITHUB_DOC} target="_blank" rel="noreferrer" className="hover:text-white">Research log</a><a href="#faq" className="hover:text-white">FAQ</a></div>
        </div>
        <div className="mx-auto mt-9 max-w-[1200px] border-t border-white/10 pt-5 text-[11px] text-white/35">© {new Date().getFullYear()} TotalsEngine. Research interface preview. Not a live betting service.</div>
      </footer>
    </div>
  );
};

export default Landing;
