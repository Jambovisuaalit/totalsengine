import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const BlogExpectedValue = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Expected Value (EV) in Betting: The Only Number That Matters",
    description: "Expected value is the mathematical foundation of profitable betting. Learn how to calculate EV, why it matters more than win rate, and how it connects to long-term results.",
    author: {
      "@type": "Organization",
      name: "doctore",
    },
    datePublished: "2025-02-10",
    dateModified: "2025-02-10",
    publisher: {
      "@type": "Organization",
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Expected Value (EV) in Betting Explained | doctore</title>
        <meta name="description" content="Expected value is the mathematical foundation of profitable betting. Learn how to calculate EV, why it matters more than win rate, and how it connects to long-term results." />
        <link rel="canonical" href="https://doctore.app/blog/expected-value" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        <article className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <header className="mb-12">
              <p className="text-xs text-muted-foreground mb-4">February 2025 · 12 min read</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
                Expected Value (EV) in betting: the only number that matters
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Every betting decision reduces to one question: does this bet have positive expected value? Understanding EV is the difference between gambling and systematic risk-taking.
              </p>
            </header>

            <div className="prose prose-invert prose-sm max-w-none space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                Expected value is a concept borrowed from probability theory. It represents the average outcome of a bet if you could repeat it infinite times. Positive EV (+EV) means the bet is profitable over time. Negative EV (-EV) means the house wins in the long run.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every bet you've ever placed has an expected value—whether you calculated it or not. The difference between recreational bettors and professionals is that professionals never bet without knowing this number.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The formula</h2>
              <p className="text-muted-foreground leading-relaxed">
                For a simple two-outcome bet (like a moneyline), EV is:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                EV = (Probability of Winning × Net Profit) − (Probability of Losing × Stake)
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Or equivalently, using decimal odds:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                EV = (True Probability × Decimal Odds) − 1
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If EV &gt; 0, the bet is +EV. If EV &lt; 0, the bet is -EV. The larger the positive EV, the more valuable the opportunity.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">A concrete example</h2>
              <p className="text-muted-foreground leading-relaxed">
                Suppose you estimate a team has a 55% chance of winning. A sportsbook offers decimal odds of 2.00 (even money).
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4 space-y-1">
                <p>EV = (0.55 × 2.00) − 1</p>
                <p>EV = 1.10 − 1</p>
                <p>EV = +0.10 = +10%</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                For every $100 staked, you'd expect to profit $10 on average. This is a strong +EV bet. But note the critical assumption: you need an accurate estimate of the true probability. This is where the difficulty lies.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Why the bookmaker's odds aren't the true probability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sportsbook odds include a margin (vig). If the true probability of an event is 50%, the bookmaker won't offer 2.00—they'll offer 1.91 (implying 52.4%). The 2.4% excess is their profit margin.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This means almost every bet at standard retail odds is -EV. The bookmaker has built in a structural advantage. To find +EV, you need to either:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Have better probability estimates</strong> than the market (extremely hard)</li>
                <li><strong className="text-foreground">Find odds that exceed fair value</strong> at specific books (what edge detection does)</li>
                <li><strong className="text-foreground">Exploit promotions or bonuses</strong> that shift EV in your favor</li>
              </ul>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">EV vs win rate: why they diverge</h2>
              <p className="text-muted-foreground leading-relaxed">
                A bet can be +EV and still lose most of the time. Consider betting on a long shot at 10.00 odds when the true probability is 12%. The EV is +20%, but you'll lose 88% of these bets. Over 100 bets, you'd expect to win 12, profiting $900 each, and lose 88, losing $100 each. Net: +$2,000.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Conversely, a bet can be -EV and win most of the time. Betting on heavy favorites at 1.10 when the true probability is 88% gives -EV of about -3.2%. You win often but lose more than expected when you do lose.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This is why win rate is a misleading metric. Two bettors with identical 55% win rates can have wildly different EV depending on the odds they bet at.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The estimation problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                The entire challenge of profitable betting is accurate probability estimation. If you could perfectly estimate true probabilities, profitable betting would be trivial—just bet whenever odds exceed your estimate.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In reality, your probability estimates are uncertain. You think a team has a 55% chance, but it might really be 50% or 60%. This uncertainty is why:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li>You should require a meaningful edge threshold (not bet at 1-2% edges)</li>
                <li>Using sharp book consensus as a proxy for true probability is more reliable than personal estimates</li>
                <li>Fractional Kelly staking protects against overestimated edges</li>
                <li>Sample sizes of hundreds of bets are needed to validate your edge</li>
              </ul>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">How EV connects to CLV</h2>
              <p className="text-muted-foreground leading-relaxed">
                Closing Line Value is essentially a market-validated measure of EV. If you consistently bet at odds that are better than the closing line, you're finding +EV opportunities—because the closing line is the market's best probability estimate.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Positive CLV is evidence of positive EV. It's not proof (closing lines can be wrong), but over large samples, CLV and EV converge. This is why we track CLV as our primary performance metric at Doctore AI.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Common EV mistakes</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Confusing +EV with "will win":</strong> A +EV bet loses more often than people expect. This leads to abandoning sound strategies during normal losing streaks.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Ignoring the vig:</strong> Many bettors calculate EV against raw odds without accounting for the margin. A bet that looks +EV before vig may be -EV after it.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Using small samples to validate EV:</strong> "I've made money over 20 bets, so my method must be +EV." Twenty bets tells you almost nothing. Variance dominates completely at this sample size.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Assuming past EV persists:</strong> Market conditions change. An edge that existed six months ago may be gone today. Continuous monitoring and adaptation are essential.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The bottom line</h2>
              <p className="text-muted-foreground leading-relaxed">
                Expected value is the foundation of every rational betting decision. If you can't estimate the EV of a bet—even roughly—you shouldn't place it. This doesn't mean you need a spreadsheet for every wager, but you should have a clear thesis for why the odds exceed fair value.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Most recreational bettors bet based on opinion, intuition, or entertainment. Professional bettors bet based on EV. The math doesn't care about your feelings—it rewards those who respect it and punishes those who ignore it.
              </p>
            </div>

            <footer className="mt-16 pt-8 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">Related reading</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/blog/what-is-clv" className="text-sm text-foreground hover:text-primary transition-colors">
                  What Is CLV? →
                </Link>
                <Link to="/blog/kelly-criterion" className="text-sm text-foreground hover:text-primary transition-colors">
                  Kelly Criterion Explained →
                </Link>
                <Link to="/blog/line-shopping" className="text-sm text-foreground hover:text-primary transition-colors">
                  Why Line Shopping Matters →
                </Link>
                <Link to="/methodology" className="text-sm text-foreground hover:text-primary transition-colors">
                  Our Methodology →
                </Link>
              </div>
            </footer>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default BlogExpectedValue;