import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const CLV = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Closing Line Value (CLV) Explained",
    description: "Understand what Closing Line Value is, why it matters, and how CLV serves as the primary performance signal for serious bettors.",
    author: {
      "@type": "Organization",
      name: "doctore",
    },
    datePublished: "2025-01-01",
    dateModified: "2025-01-07",
    publisher: {
      "@type": "Organization",
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Closing Line Value (CLV) Explained | doctore</title>
        <meta name="description" content="Understand what Closing Line Value is, why it matters, and how doctore uses CLV as its primary performance signal." />
        <link rel="canonical" href="https://doctore.app/clv" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-10 sm:py-12 md:py-16 lg:py-24 border-b border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4 sm:mb-6 text-foreground leading-tight">
              Closing Line Value (CLV) explained
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              CLV is the difference between the odds you bet at and the final odds at market close. It's the most reliable indicator of betting skill over time.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <article className="space-y-8 sm:space-y-10 md:space-y-12">
              
              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">What is CLV in betting?</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  Closing Line Value measures whether you consistently beat the closing line—the final odds offered before a game starts. The closing line represents the market's most accurate probability estimate.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  If you bet on a team at 2.10 and the line closes at 1.95, you captured positive CLV. If the line closed at 2.25, you had negative CLV.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">Why CLV matters more than win rate</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  Short-term results in betting are dominated by variance. A bettor can win 60% of their bets over a month through pure luck.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  CLV cuts through this noise. Bettors with positive CLV are profitable over the long term, regardless of short-term win rates.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  This makes CLV a leading indicator. You can assess decision quality within weeks, not years.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">CLV vs short-term profit</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  Positive CLV with short-term losses means variance is working against you temporarily.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Negative CLV with short-term profits means variance is masking poor decisions. Over thousands of bets, results converge toward CLV-implied outcomes.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">How Doctore AI measures CLV</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  We track two key metrics:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside text-sm sm:text-base">
                  <li><strong className="text-foreground">CLV per bet:</strong> The percentage difference between our bet odds and closing odds</li>
                  <li><strong className="text-foreground">Hit rate:</strong> The percentage of bets with positive CLV</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3 sm:mt-4 text-sm sm:text-base">
                  Our target is a positive CLV hit rate above 55% with an average CLV above +2%.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">Interpreting positive vs negative CLV</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  <strong className="text-foreground">Positive CLV (+):</strong> You bet at better odds than the closing line. The market confirmed your edge.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  <strong className="text-foreground">Negative CLV (-):</strong> You bet at worse odds than closing. Either you bet too late, or sharp action moved against you.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">What CLV does not guarantee</h2>
                <p className="text-muted-foreground leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  CLV is the best available metric, but not perfect:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside text-sm sm:text-base">
                  <li>Closing lines can be wrong</li>
                  <li>Small samples produce unreliable CLV</li>
                  <li>Different markets have different efficiency</li>
                  <li>CLV doesn't account for execution issues</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3 sm:mt-4 text-sm sm:text-base">
                  We use CLV as a primary signal while acknowledging its limitations.
                </p>
              </section>

            </article>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-8 sm:py-10 md:py-12 border-t border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">Related</h3>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link to="/methodology" className="text-sm text-foreground hover:text-primary transition-colors">
                Our Methodology →
              </Link>
              <Link to="/edge-detection" className="text-sm text-foreground hover:text-primary transition-colors">
                Edge Detection →
              </Link>
              <Link to="/blog/what-is-clv" className="text-sm text-foreground hover:text-primary transition-colors">
                Blog: What Is CLV? →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CLV;