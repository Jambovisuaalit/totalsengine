import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const BlogCLV = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What Is Closing Line Value (CLV)?",
    description: "A comprehensive guide to Closing Line Value, the most reliable indicator of betting skill. Learn what CLV is, why it matters, and how to measure it.",
    author: {
      "@type": "Organization",
      name: "doctore",
    },
    datePublished: "2025-01-10",
    dateModified: "2025-01-10",
    publisher: {
      "@type": "Organization",
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>What Is Closing Line Value (CLV)? | doctore</title>
        <meta name="description" content="A comprehensive guide to Closing Line Value, the most reliable indicator of betting skill. Learn what CLV is, why it matters, and how to measure it." />
        <link rel="canonical" href="https://doctore.app/blog/what-is-clv" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        <article className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <header className="mb-12">
              <p className="text-xs text-muted-foreground mb-4">January 2025 · 10 min read</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
                What is Closing Line Value (CLV)?
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                CLV is the difference between the odds you bet at and the final odds at market close. It's the most reliable leading indicator of long-term betting success.
              </p>
            </header>

            <div className="prose prose-invert prose-sm max-w-none space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                If you've spent any time in serious betting circles, you've encountered CLV. It's often described as "the only metric that matters"—and while that's an oversimplification, it's not far off.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                CLV measures something simple: did you bet at better odds than the closing line? The closing line is the final odds offered by sharp sportsbooks before a game starts. It represents the market's most accurate probability estimate, refined by millions of dollars of sharp action.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The basic concept</h2>
              <p className="text-muted-foreground leading-relaxed">
                Suppose you bet on Team A at 2.10 odds. The game starts, and you check what the closing line was—2.00. You got better odds than the close. That's positive CLV of about 5%.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Conversely, if you bet at 2.10 and the line closed at 2.20, you got worse odds than the market settled on. That's negative CLV.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Why CLV matters more than win rate</h2>
              <p className="text-muted-foreground leading-relaxed">
                Here's the counterintuitive truth: win rate tells you very little about betting skill, especially over small samples. You can win 55% of your bets through luck. You can lose 55% through bad variance despite excellent decisions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                CLV cuts through this noise. If you consistently beat the closing line, you're consistently betting at better prices than the market's final assessment. This is what profitable bettors do. The correlation between positive CLV and long-term profit is robust across decades of data.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The math behind it</h2>
              <p className="text-muted-foreground leading-relaxed">
                CLV is calculated as:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                CLV = (Your Odds / Closing Odds) - 1
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you bet at 2.10 and the line closed at 2.00:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                CLV = (2.10 / 2.00) - 1 = 0.05 = +5%
              </div>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Interpreting your CLV</h2>
              <p className="text-muted-foreground leading-relaxed">
                Positive CLV doesn't guarantee you'll win any particular bet. The team you bet on can still lose. But over hundreds or thousands of bets, positive CLV bettors are profitable. The math forces convergence.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                A typical target for sharp bettors is average CLV of +2% to +3% across all bets. This might sound small, but compounded over thousands of bets, it represents significant edge.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Limitations of CLV</h2>
              <p className="text-muted-foreground leading-relaxed">
                CLV isn't perfect. Closing lines can be wrong—the market is efficient, not omniscient. Some markets close less efficiently than others. And CLV measurement requires significant sample sizes to be meaningful; a few dozen bets tells you almost nothing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But with these caveats understood, CLV remains the best available tool for assessing betting decision quality before results converge.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Practical application</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tracking your CLV requires recording the exact odds you bet at and the closing odds for each bet. Many bettors don't do this systematically, which makes it impossible to assess whether they have genuine skill or have been lucky.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                At Doctore AI, CLV tracking is built into our system. Every edge we identify is measured against the closing line, and our performance metrics prioritize CLV over raw profit. This keeps us honest about whether our methodology actually works.
              </p>
            </div>

            <footer className="mt-16 pt-8 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">Related reading</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/clv" className="text-sm text-foreground hover:text-primary transition-colors">
                  CLV Explained (Full Guide) →
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

export default BlogCLV;