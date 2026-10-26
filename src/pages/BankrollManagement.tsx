import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const BankrollManagement = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Bankroll Management & Stake Sizing – Doctore AI"
        description="Learn how conservative stake sizing and fractional Kelly help reduce drawdowns and protect capital in betting."
        canonical="https://doctore.lovable.app/bankroll-management"
      />
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 border-b border-border/40">
          <div className="container max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
              Bankroll management and risk control
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Conservative stake sizing is the difference between surviving variance and going broke. Here's how we approach capital preservation.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <article className="prose prose-invert prose-sm max-w-none space-y-12">
              
              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Why bankroll management matters more than picks</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can have a genuine edge and still go broke. Overbetting destroys even profitable strategies through the mathematics of ruin.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  A 5% edge with 20% stakes per bet has a high probability of account destruction before variance evens out. The same 5% edge with 2% stakes survives drawdowns and compounds over time. Stake sizing determines whether your edge survives long enough to matter.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Kelly Criterion: concept and limitations</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Kelly Criterion is a formula for optimal bet sizing that maximizes long-term growth:
                </p>
                <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground mb-4">
                  Kelly % = Edge / (Odds - 1)
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For a 5% edge at 2.00 odds, Kelly suggests staking 5%: 0.05 / (2.00 - 1) = 0.05.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The problem: Kelly assumes perfect edge estimation. In reality, our edge estimates are uncertain. Overestimating edge by even 1% can turn optimal Kelly into a recipe for disaster.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Why Doctore uses fractional Kelly</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use 25% of the Kelly-suggested stake (quarter Kelly). This approach:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>Reduces volatility by approximately 75%</li>
                  <li>Captures about 50% of Kelly's long-term growth rate</li>
                  <li>Provides a buffer against edge estimation errors</li>
                  <li>Makes drawdowns survivable psychologically and financially</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  The tradeoff is slower growth, but we prioritize survival over speed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Hard caps and total exposure limits</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Beyond fractional Kelly, we enforce absolute limits:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li><strong className="text-foreground">2% maximum per bet:</strong> No single bet can exceed 2% of bankroll, regardless of calculated edge</li>
                  <li><strong className="text-foreground">5% total exposure:</strong> Combined open risk across all active bets cannot exceed 5%</li>
                  <li><strong className="text-foreground">Correlated bet adjustment:</strong> Multiple bets on the same game share exposure limits</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  These caps exist because edge estimates can be wrong and because bad days happen to everyone.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Why overbetting destroys edge</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The mathematics are unforgiving. A 50% drawdown requires a 100% gain to recover. A 75% drawdown requires a 300% gain.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Overbetting creates scenarios where:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>Normal losing streaks become account-threatening</li>
                  <li>Psychological pressure leads to worse decisions</li>
                  <li>Recovery becomes mathematically improbable</li>
                  <li>The edge never has time to manifest in results</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Practical example</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Consider an edge of 6% on odds of 2.20 with a $10,000 bankroll:
                </p>
                <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-xs text-muted-foreground space-y-2 mb-4">
                  <p>Full Kelly: 6% / 1.20 = 5.0% = $500</p>
                  <p>Quarter Kelly: 5.0% × 0.25 = 1.25% = $125</p>
                  <p>After 2% cap: $125 (under cap, so unchanged)</p>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The suggested stake is $125—small enough to weather a 10-bet losing streak without meaningful damage, large enough to compound meaningfully over hundreds of bets.
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
                Our Methodology →
              </Link>
              <Link to="/responsible-gaming" className="text-sm text-foreground hover:text-primary transition-colors">
                Responsible Gaming →
              </Link>
              <Link to="/blog/kelly-criterion" className="text-sm text-foreground hover:text-primary transition-colors">
                Blog: Kelly Criterion Explained →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default BankrollManagement;