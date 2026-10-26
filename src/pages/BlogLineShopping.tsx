import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const BlogLineShopping = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Line Shopping: The Easiest Edge Most Bettors Ignore",
    description: "Line shopping—comparing odds across multiple sportsbooks—is the simplest way to improve your betting results. Learn why even half a point matters.",
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
        <title>Line Shopping: The Easiest Edge Most Bettors Ignore | doctore</title>
        <meta name="description" content="Line shopping—comparing odds across multiple sportsbooks—is the simplest way to improve your betting results. Learn why even half a point matters." />
        <link rel="canonical" href="https://doctore.app/blog/line-shopping" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        <article className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <header className="mb-12">
              <p className="text-xs text-muted-foreground mb-4">February 2025 · 10 min read</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
                Line shopping: the easiest edge most bettors ignore
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Comparing odds across multiple sportsbooks before placing a bet is the simplest, most effective way to improve your long-term results. Yet most bettors bet wherever is most convenient.
              </p>
            </header>

            <div className="prose prose-invert prose-sm max-w-none space-y-8">
              <p className="text-muted-foreground leading-relaxed">
                If you bet on sports and don't compare odds across multiple books, you're leaving money on the table every single bet. Not sometimes—every time. The difference between the best and worst available odds on any given market regularly exceeds 3-5%, which over hundreds of bets compounds into a massive impact on your bottom line.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">What is line shopping?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Line shopping is the practice of checking odds at multiple sportsbooks before placing a bet and taking the best available price. It's the betting equivalent of comparing prices before buying a car—obvious in theory, ignored in practice.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Different sportsbooks set their own odds based on their exposure, risk models, and customer base. This means the same event can have meaningfully different prices across books at the same time.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Why odds differ between bookmakers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Several factors create price discrepancies:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Different customer bases:</strong> A book with heavy action on one side will adjust their line, while a book with balanced action won't.</li>
                <li><strong className="text-foreground">Varying margins:</strong> Sharp books (Pinnacle) run tighter margins than recreational books (most US sportsbooks).</li>
                <li><strong className="text-foreground">Information timing:</strong> Some books adjust to news (injuries, weather) faster than others.</li>
                <li><strong className="text-foreground">Market focus:</strong> A book specializing in NFL may price those markets more efficiently than their NBA lines.</li>
                <li><strong className="text-foreground">Promotional pricing:</strong> Books sometimes offer enhanced odds on specific events to attract customers.</li>
              </ul>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The math: why small differences matter enormously</h2>
              <p className="text-muted-foreground leading-relaxed">
                Let's say you bet $100 per game, 500 times per year. If line shopping improves your average odds by just 2%:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 font-mono text-sm text-foreground my-4 space-y-1">
                <p>Without shopping: 500 bets × $100 × 0% improvement = $0</p>
                <p>With shopping: 500 bets × $100 × 2% improvement = $1,000</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                That's $1,000 in additional expected profit per year from doing nothing more than checking a few extra apps before clicking "place bet." Over five years, that's $5,000. Over a decade, with compounding, significantly more.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For someone betting $500 per game, the numbers multiply accordingly. And 2% is conservative—on many markets, the gap between best and worst available odds exceeds 5%.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Real-world example</h2>
              <p className="text-muted-foreground leading-relaxed">
                Consider a typical NBA moneyline market:
              </p>
              <div className="bg-card/50 border border-border/40 rounded p-4 text-sm my-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Book A:</span><span className="text-foreground font-mono">Lakers -150</span>
                  <span>Book B:</span><span className="text-foreground font-mono">Lakers -145</span>
                  <span>Book C:</span><span className="text-foreground font-mono">Lakers -140</span>
                  <span>Book D:</span><span className="text-foreground font-mono">Lakers -135</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The difference between -150 and -135 is significant. At -150, you risk $150 to win $100. At -135, you risk $135 to win $100. On a $100 profit target, that's $15 less at risk. Over hundreds of bets, this difference in price quality separates profitable bettors from break-even ones.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Sharp books vs soft books</h2>
              <p className="text-muted-foreground leading-relaxed">
                Not all bookmakers are equal. Sharp books like Pinnacle:
              </p>
              <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li>Accept high limits without restricting winners</li>
                <li>Set efficient lines that reflect true probabilities</li>
                <li>Run lower margins (tighter vig)</li>
                <li>Serve as the benchmark for "fair" odds</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Soft books (most retail sportsbooks) cater to recreational bettors and may have wider margins, slower line adjustments, and limited tolerance for winning accounts. The price differences between sharp and soft books are where most exploitable edges originate.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">How line shopping connects to edge detection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Doctore AI's edge detection system is fundamentally an automated line shopper. We compare odds across multiple bookmakers in real time, identify when soft books are offering prices significantly better than sharp-book fair value, and flag those discrepancies.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The difference is scale and speed. Manually checking odds across 10 books for 50 markets takes hours. Automated systems do it every 15 minutes across all available markets.
              </p>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">Practical tips for line shopping</h2>
              <div className="space-y-4 my-6">
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">01</span>
                  <div>
                    <h4 className="font-semibold mb-1">Maintain accounts at multiple books</h4>
                    <p className="text-sm text-muted-foreground">The more options you have, the better your average odds will be. Aim for at least 3-5 sportsbooks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">02</span>
                  <div>
                    <h4 className="font-semibold mb-1">Check odds immediately before betting</h4>
                    <p className="text-sm text-muted-foreground">Lines move constantly. The best price an hour ago may not be the best price now.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">03</span>
                  <div>
                    <h4 className="font-semibold mb-1">Don't loyalty-bet</h4>
                    <p className="text-sm text-muted-foreground">Betting at one book out of habit costs you money every time a better price exists elsewhere.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">04</span>
                  <div>
                    <h4 className="font-semibold mb-1">Track which books consistently offer best prices</h4>
                    <p className="text-sm text-muted-foreground">Over time, you'll notice patterns. Some books are consistently better for certain sports or market types.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">05</span>
                  <div>
                    <h4 className="font-semibold mb-1">Factor in the vig</h4>
                    <p className="text-sm text-muted-foreground">A nominally higher price at a high-vig book may be worse than a slightly lower price at a low-vig book. Compare the no-vig implied probabilities.</p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-medium text-foreground mt-12 mb-4">The bottom line</h2>
              <p className="text-muted-foreground leading-relaxed">
                Line shopping requires no skill, no model, and no sophisticated analysis. It's pure discipline: take 30 extra seconds to check prices before every bet. Over a lifetime of betting, this single habit will save you more money than almost any other improvement to your process.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It's not glamorous. It won't make you feel like a sharp. But it's the highest-ROI habit in all of sports betting, and it's available to everyone.
              </p>
            </div>

            <footer className="mt-16 pt-8 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">Related reading</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/blog/expected-value" className="text-sm text-foreground hover:text-primary transition-colors">
                  Expected Value Explained →
                </Link>
                <Link to="/blog/vig-explained" className="text-sm text-foreground hover:text-primary transition-colors">
                  The Vig Explained →
                </Link>
                <Link to="/edge-detection" className="text-sm text-foreground hover:text-primary transition-colors">
                  Edge Detection →
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

export default BlogLineShopping;