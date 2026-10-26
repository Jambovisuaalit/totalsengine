import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const EdgeDetection = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Betting Edge Detection – How Doctore AI Identifies Signals"
        description="An explanation of how betting edges are detected, filtered, and validated using market data and time-based analysis."
        canonical="https://doctore.lovable.app/edge-detection"
      />
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 border-b border-border/40">
          <div className="container max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
              How betting edges are detected
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Edge detection is the process of identifying odds discrepancies between sharp and soft markets. Most detected edges are noise—the challenge is separating signal from randomness.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <article className="prose prose-invert prose-sm max-w-none space-y-12">
              
              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">What constitutes an edge</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  An edge exists when available odds exceed the true probability of an outcome. Since true probability is unknowable, we use sharp market consensus as a proxy.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  When a retail sportsbook offers 2.20 on a selection that sharp books price at 2.00 (after margin removal), that's a potential 10% edge. The question is whether this discrepancy reflects a genuine mispricing or temporary market noise.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Market inefficiencies vs noise</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Not all odds discrepancies are exploitable:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong className="text-foreground">Temporary delays:</strong> Retail books often lag sharp market movements by minutes. These "edges" disappear before you can act.</li>
                  <li><strong className="text-foreground">Data errors:</strong> Incorrect odds display, feed issues, and technical glitches create false signals.</li>
                  <li><strong className="text-foreground">Market manipulation:</strong> Steam moves and coordinated action can create temporary mispricings that reverse.</li>
                  <li><strong className="text-foreground">Genuine inefficiencies:</strong> Real edges where retail books have genuinely mispriced a market.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  The vast majority of detected discrepancies fall into the first three categories. Distinguishing the fourth requires patience.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Odds ranges and quality filters</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We apply filters before edges enter the validation pipeline:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong className="text-foreground">Minimum edge threshold (3%):</strong> Edges below this are too small to overcome transaction costs and estimation error.</li>
                  <li><strong className="text-foreground">Odds range (1.40–4.00):</strong> Very short or very long odds have different characteristics and require different handling.</li>
                  <li><strong className="text-foreground">Market type:</strong> Some markets (props, live betting) are noisier and less reliable.</li>
                  <li><strong className="text-foreground">Book reputation:</strong> Historical CLV performance by book and market combination.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Why most "edges" disappear quickly</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The half-life of a typical odds discrepancy is measured in minutes. Here's what happens:
                </p>
                <ol className="text-muted-foreground leading-relaxed space-y-2 list-decimal list-inside">
                  <li>Sharp bettors identify the discrepancy</li>
                  <li>They bet the soft book, triggering line movement</li>
                  <li>The soft book adjusts odds toward the sharp line</li>
                  <li>The edge closes or reverses</li>
                </ol>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  This process typically completes in 5–30 minutes. Edges that survive longer suggest the soft book either disagrees with the sharp line or hasn't received enough action to move.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Stability and trend analysis</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Surviving edges are monitored for stability. We track:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong className="text-foreground">Persistence:</strong> Has the edge appeared in 3+ consecutive snapshots?</li>
                  <li><strong className="text-foreground">Direction:</strong> Is the edge growing, stable, or shrinking?</li>
                  <li><strong className="text-foreground">Volatility:</strong> Is it bouncing erratically or holding steady?</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  An edge that was 6% an hour ago and is now 4% tells a different story than one holding steady at 5%. Trend matters.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">When an edge becomes actionable</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  An edge becomes actionable when it meets all criteria:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>Passed minimum threshold (3%+)</li>
                  <li>Persisted for 30+ minutes</li>
                  <li>Appeared in 3+ consecutive snapshots</li>
                  <li>Trend is stable or improving (not deteriorating)</li>
                  <li>Within total exposure limits</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Even then, many potential edges never become actionable. This rejection rate is intentional—we'd rather miss some real edges than act on false ones.
                </p>
              </section>

            </article>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-12 border-t border-border/40">
          <div className="container max-w-3xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Related</h3>
            <div className="flex flex-wrap gap-4">
              <Link to="/methodology" className="text-sm text-foreground hover:text-primary transition-colors">
                Full Methodology →
              </Link>
              <Link to="/clv" className="text-sm text-foreground hover:text-primary transition-colors">
                CLV Explained →
              </Link>
              <Link to="/bankroll-management" className="text-sm text-foreground hover:text-primary transition-colors">
                Bankroll Management →
              </Link>
              <Link to="/analysis" className="text-sm text-foreground hover:text-primary transition-colors">
                View Live Edges →
              </Link>
              <Link to="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default EdgeDetection;