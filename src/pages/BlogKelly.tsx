import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const BlogKelly = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Kelly Criterion Explained Without Hype",
    description: "A practical guide to the Kelly Criterion for bet sizing. Learn what it is, why it matters, and why most bettors should use a fraction of it.",
    author: {
      "@type": "Organization",
      name: "doctore",
    },
    datePublished: "2025-01-12",
    dateModified: "2025-01-12",
    publisher: {
      "@type": "Organization",
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Kelly Criterion Explained Without Hype | doctore</title>
        <meta name="description" content="A practical guide to the Kelly Criterion for bet sizing. Learn what it is, why it matters, and why most bettors should use a fraction of it." />
        <link rel="canonical" href="https://doctore.app/blog/kelly-criterion" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        <article className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <header className="mb-12">
              <p className="text-xs text-muted-foreground mb-4">January 2025 · 12 min read</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
                Kelly Criterion explained without hype
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The Kelly Criterion is a formula for optimal bet sizing. It's mathematically elegant and practically dangerous—unless you understand its limitations.
              </p>
            </header>

            <div className="prose prose-invert prose-sm max-w-none space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                In 1956, John Kelly Jr., a researcher at Bell Labs, published a paper on information theory that inadvertently revolutionized gambling mathematics. His formula answered a simple question: given a known edge, how much should you bet to maximize long-term growth?
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The formula</h2>
              <p className="text-muted-foreground leading-relaxed">
                For sports betting with decimal odds, the Kelly formula is:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                Kelly % = Edge / (Odds - 1)
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you have a 5% edge on odds of 2.00:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4">
                Kelly % = 0.05 / (2.00 - 1) = 0.05 = 5%
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Kelly says you should stake 5% of your bankroll on this bet.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">What Kelly optimizes for</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kelly maximizes the geometric growth rate of your bankroll. Over infinite bets, a Kelly bettor will end up with more money than anyone using any other fixed staking strategy. This is mathematically provable.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But there's a catch buried in "infinite bets."
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The volatility problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                Full Kelly is extremely volatile. Drawdowns of 50% or more are not just possible but expected over reasonable timeframes. For most people, this is psychologically and practically unbearable.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Imagine you have a $10,000 bankroll and hit a bad run. Under full Kelly, you might see your account drop to $5,000, then $4,000, then $3,000. Mathematically, you should keep betting your percentage. Psychologically, you'll probably panic and make bad decisions.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The estimation error problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kelly assumes you know your exact edge. You don't. Ever. Your edge is an estimate based on imperfect models and incomplete information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you overestimate your edge by even 1-2%, full Kelly can be catastrophic. The formula is highly sensitive to edge accuracy. Betting full Kelly on an overestimated edge is a recipe for ruin.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Fractional Kelly: the practical solution</h2>
              <p className="text-muted-foreground leading-relaxed">
                Most serious bettors use a fraction of the Kelly-suggested stake—typically 25% to 50%. This is called "fractional Kelly" or "quarter/half Kelly."
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The tradeoffs:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Quarter Kelly:</strong> 75% reduction in volatility, ~50% of Kelly's growth rate</li>
                <li><strong className="text-foreground">Half Kelly:</strong> 50% reduction in volatility, ~75% of Kelly's growth rate</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                At Doctore AI, we use quarter Kelly. The reduced volatility is worth the reduced growth rate, especially given uncertainty in our edge estimates.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Hard caps on top</h2>
              <p className="text-muted-foreground leading-relaxed">
                Even fractional Kelly can suggest large stakes when edges appear large. We add hard caps: no single bet exceeds 2% of bankroll, regardless of calculated Kelly stake. This protects against edge estimation outliers and correlated losses.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The bottom line</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kelly is the theoretically optimal staking strategy, but theory and practice diverge. Use fractional Kelly, add hard caps, and remember that surviving long enough for your edge to manifest is more important than maximizing growth rate.
              </p>
            </div>

            <footer className="mt-16 pt-8 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">Related reading</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/bankroll-management" className="text-sm text-foreground hover:text-primary transition-colors">
                  Bankroll Management →
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

export default BlogKelly;