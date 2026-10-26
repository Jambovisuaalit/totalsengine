import { Link } from "react-router-dom";
import { Sigma, Gauge, Filter, Scale, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEOHead } from "@/components/SEOHead";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";
import { LiveCLVProof } from "@/components/LiveCLVProof";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Doctore AI — Decision Intelligence for Betting Markets"
        description="Doctore AI filters negative-EV decisions and applies fractional Kelly sizing. A decision system built on probability, risk, and elimination."
        canonical="https://doctore.lovable.app"
      />
      <SiteHeader />

      {/* Hero banner 1 — Mathematical Edge */}
      <section className="relative overflow-hidden bg-[#0B0B0B] text-[#F5F5F5] border-b border-white/5">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#F5F5F5 1px, transparent 1px), linear-gradient(90deg, #F5F5F5 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#00E676]/10 blur-3xl" />
        </div>

        <div className="relative container max-w-4xl py-20 sm:py-28 md:py-32">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#00E676]/80 mb-6 animate-fade-in">
            <Sigma className="h-3.5 w-3.5" />
            <span>01 — Mathematical Edge</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6 max-w-3xl animate-fade-in [animation-delay:80ms]">
            Probability before opinion.
          </h1>

          <p className="text-base sm:text-lg text-[#F5F5F5]/70 leading-relaxed max-w-2xl mb-8 animate-fade-in [animation-delay:160ms]">
            Doctore AI estimates fair odds from sharp markets, removes the bookmaker margin,
            and compares the result against execution prices. Decisions with negative expected
            value are filtered out before they reach the user.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md animate-fade-in [animation-delay:240ms]">
            <div className="flex-1">
              <EmailSubscribeForm buttonText="Get access" variant="secondary" />
            </div>
          </div>
        </div>
      </section>

      {/* Hero banner 2 — Institutional Speed */}
      <section className="relative overflow-hidden bg-[#0B0B0B] text-[#F5F5F5]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#F5F5F5 1px, transparent 1px), linear-gradient(90deg, #F5F5F5 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] translate-x-1/4 translate-y-1/4 rounded-full bg-[#00E676]/8 blur-3xl" />
        </div>

        <div className="relative container max-w-4xl py-20 sm:py-28 md:py-32">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#00E676]/80 mb-6 animate-fade-in">
            <Gauge className="h-3.5 w-3.5" />
            <span>02 — Institutional Speed</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6 max-w-3xl animate-fade-in [animation-delay:80ms]">
            Markets monitored continuously.
          </h2>

          <p className="text-base sm:text-lg text-[#F5F5F5]/70 leading-relaxed max-w-2xl mb-8 animate-fade-in [animation-delay:160ms]">
            Sharp and soft lines are tracked across bookmakers in near real time. Each edge
            must persist across multiple snapshots before it becomes actionable. Closing Line
            Value is recorded on every decision and reported transparently.
          </p>

          <Link
            to="/methodology"
            className="inline-flex items-center gap-2 text-sm text-[#F5F5F5]/80 hover:text-[#00E676] transition-colors animate-fade-in [animation-delay:240ms]"
          >
            Read the methodology
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* PRO / SHARP — product tiers */}
      <section className="py-16 sm:py-24" id="tiers">
        <div className="container max-w-5xl">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Product tiers
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Two layers of decision support
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Doctore AI is delivered as two complementary layers. PRO governs which
              decisions are permitted. SHARP governs how capital is allocated across the
              decisions that remain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* PRO */}
            <article className="rounded-lg border border-border/60 bg-card/30 p-6 sm:p-8 transition-colors hover:border-border hover:bg-card/50">
              <div className="flex items-center gap-2 mb-5">
                <Filter className="h-4 w-4 text-foreground/70" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">PRO</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
                Decision filtering
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                PRO identifies positive expected-value opportunities and rejects negative-EV
                decisions before they enter the user's workflow.
              </p>
              <ul className="space-y-3 text-sm text-foreground/85">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Fair-odds modelling from sharp market consensus</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Margin removal and execution-odds comparison</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Edge stability confirmation across multiple snapshots</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Closing Line Value recorded per decision</span>
                </li>
              </ul>
            </article>

            {/* SHARP */}
            <article className="rounded-lg border border-border/60 bg-card/30 p-6 sm:p-8 transition-colors hover:border-border hover:bg-card/50">
              <div className="flex items-center gap-2 mb-5">
                <Scale className="h-4 w-4 text-foreground/70" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">SHARP</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
                Capital allocation
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                SHARP extends PRO with a stake-sizing layer. Allocation is derived from
                fractional Kelly with hard caps, applied across the active portfolio.
              </p>
              <ul className="space-y-3 text-sm text-foreground/85">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Fractional Kelly sizing with per-decision caps</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Portfolio-level exposure limits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Correlation-aware allocation across markets</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground/60 mt-1">→</span>
                  <span>Drawdown protection rules</span>
                </li>
              </ul>
            </article>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              Compare tiers and pricing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container max-w-5xl px-6">
        <div className="h-px bg-border/40" />
      </div>

      {/* Live CLV Proof */}
      <LiveCLVProof />

      {/* Divider */}
      <div className="container max-w-4xl px-6">
        <div className="h-px bg-border/40" />
      </div>

      {/* How edges are validated */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="container max-w-3xl">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-center mb-8 sm:mb-10 md:mb-14 text-foreground px-2">
            How edges are validated
          </h2>

          <div className="space-y-6 sm:space-y-8">
            {[
              { step: "01", title: "Continuous monitoring", description: "Sharp and soft lines tracked across markets." },
              { step: "02", title: "Edge lifecycle tracking", description: "Each edge is observed over time before it becomes actionable." },
              { step: "03", title: "Conservative sizing", description: "Fractional Kelly with per-decision and portfolio caps." },
              { step: "04", title: "Daily summary", description: "One email with actionable opportunities and CLV signals." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 sm:gap-6 md:gap-8 items-start py-1 sm:py-2">
                <span className="font-mono text-xs text-muted-foreground/60 mt-0.5 sm:mt-1 shrink-0">{item.step}</span>
                <div>
                  <h3 className="font-medium text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container max-w-4xl px-6">
        <div className="h-px bg-border/40" />
      </div>

      {/* Methodology principles */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28" id="methodology">
        <div className="container max-w-3xl">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-center mb-3 sm:mb-4 text-foreground">
            Not a tipster service.
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-14 max-w-xs sm:max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            An analytical system, documented and verifiable.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="p-4 sm:p-5 rounded border border-border/60 bg-card/30 transition-colors hover:border-border hover:bg-card/50">
              <h3 className="font-medium text-foreground mb-1 sm:mb-2 text-sm">Documented method</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Models, thresholds, and validation rules are published.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded border border-border/60 bg-card/30 transition-colors hover:border-border hover:bg-card/50">
              <h3 className="font-medium text-foreground mb-1 sm:mb-2 text-sm">Verifiable CLV</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Closing Line Value tracked per decision and reported publicly.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded border border-border/60 bg-card/30 transition-colors hover:border-border hover:bg-card/50">
              <h3 className="font-medium text-foreground mb-1 sm:mb-2 text-sm">Low frequency</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A small number of decisions per day. Some days, none.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container max-w-xl px-6">
        <div className="h-px bg-border/40" />
      </div>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="container max-w-md text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4 text-foreground">
            Daily summary
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 md:mb-10 text-xs sm:text-sm leading-relaxed">
            One email each morning with confirmed edges and CLV signals.
          </p>

          <EmailSubscribeForm buttonText="Subscribe" variant="secondary" />

          <Link to="/methodology" className="inline-block mt-5 sm:mt-6 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
            See methodology
          </Link>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-10 sm:py-14 border-t border-border/40">
        <div className="container max-w-3xl">
          <h2 className="text-xs font-medium mb-4 sm:mb-6 text-center text-muted-foreground/70 uppercase tracking-wider">
            Important disclaimers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-8 sm:gap-y-3 text-xs text-muted-foreground/60 leading-relaxed text-center sm:text-left">
            <p>This is an informational and analytical tool. It is not financial or betting advice.</p>
            <p>Past CLV performance does not guarantee future results.</p>
            <p>Betting involves risk. Only wager what you can afford to lose.</p>
            <p>Please gamble responsibly. If you need help: 1-800-GAMBLER.</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Landing;