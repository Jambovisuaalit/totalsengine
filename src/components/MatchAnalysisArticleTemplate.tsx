import { Helmet } from "react-helmet-async";

interface MatchAnalysisArticleProps {
  teamA: string;
  teamB: string;
  league: string;
  market: string;
  bookOdds: string;
  fairOdds: string;
  edgePercent: number;
  snapshotCount: number;
  spanHours: number;
  bookmaker: string;
  publishDate: string;
  author?: string;
}

export function MatchAnalysisArticleTemplate({
  teamA,
  teamB,
  league,
  market,
  bookOdds,
  fairOdds,
  edgePercent,
  snapshotCount,
  spanHours,
  bookmaker,
  publishDate,
  author = "doctore analytics",
}: MatchAnalysisArticleProps) {
  const title = `Match Analysis – ${teamA} @ ${teamB}`;
  const description = `Analytical breakdown of ${teamA} vs ${teamB} in ${league}. Comparing bookmaker odds to model-derived fair odds for educational purposes.`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: {
      "@type": "Organization",
      name: author,
    },
    datePublished: publishDate,
    publisher: {
      "@type": "Organization",
      name: "Doctore",
      url: "https://doctore.lovable.app",
    },
  };

  return (
    <>
      <Helmet>
        <title>{title} | doctore-ai</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* H1 Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
          Match Analysis – {teamA} @ {teamB}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8 not-prose">
          <time dateTime={publishDate}>
            {new Date(publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{author}</span>
          <span>·</span>
          <span>{league}</span>
        </div>

        {/* Intro */}
        <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
          <p>
            This article provides an analytical breakdown comparing bookmaker-offered odds 
            against model-derived fair odds for the {market} market in the upcoming {teamA} vs {teamB} matchup. 
            The analysis examines pricing differences, confirmation patterns, and relevant risk factors 
            for educational purposes only.
          </p>
        </div>

        {/* Section 1: Market Context */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Market Context
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed space-y-4">
            <p>
              The <strong className="text-foreground">{market}</strong> market represents 
              a straightforward proposition in sports betting where outcomes are binary 
              (win/lose) or ternary (with a draw option in some sports).
            </p>
            <p>
              This market type typically exhibits moderate variance. Unlike spread or 
              totals markets where margins can be thin, moneyline outcomes are 
              inherently all-or-nothing, which contributes to higher short-term 
              volatility in results even when edges are present.
            </p>
            <p>
              The risk profile for {market} wagers depends heavily on the implied 
              probability. Favorites carry lower variance but require larger stakes 
              for equivalent returns, while underdogs exhibit higher variance with 
              smaller stake requirements.
            </p>
          </div>
        </section>

        {/* Section 2: Price vs Fair Value */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Price vs Fair Value
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed space-y-4">
            <p>
              The current bookmaker price of <strong className="text-foreground">{bookOdds}</strong> is 
              being compared against a model-derived fair price of <strong className="text-foreground">{fairOdds}</strong>.
            </p>
            <p>
              Fair odds represent an estimate of the "true" probability of an outcome, 
              calculated by removing the bookmaker's margin (vigorish) from sharp market 
              prices. When fair odds are derived from high-liquidity, low-margin books, 
              they serve as a reasonable proxy for market-efficient pricing.
            </p>
            <p>
              The concept of "edge" refers to the percentage difference between the implied 
              probability of the offered odds and the implied probability of the fair odds. 
              In this case, the calculated edge is <strong className="text-foreground">{edgePercent.toFixed(2)}%</strong>.
            </p>
            <p>
              A positive edge suggests that the offered price may be more favorable than 
              what the underlying probability warrants. However, edge calculations carry 
              inherent uncertainty—they depend on the accuracy of the fair odds model, 
              which itself is an estimate.
            </p>
          </div>
        </section>

        {/* Section 3: Confirmation and Stability */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Confirmation and Stability
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed space-y-4">
            <p>
              This pricing discrepancy has been observed across <strong className="text-foreground">{snapshotCount} snapshots</strong> over 
              approximately <strong className="text-foreground">{spanHours} hours</strong>.
            </p>
            <p>
              Time-based confirmation is a methodological approach to filtering noise 
              from genuine pricing inefficiencies. Markets occasionally exhibit 
              temporary dislocations due to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Delayed line updates following news</li>
              <li>Technical issues or stale pricing</li>
              <li>Low-liquidity periods with wider spreads</li>
              <li>Arbitrage activity temporarily distorting prices</li>
            </ul>
            <p>
              By requiring an edge to persist across multiple independent observations 
              over an extended time window, the methodology aims to distinguish between 
              transient fluctuations and more stable pricing patterns. However, 
              persistence does not guarantee validity—markets can remain mispriced for 
              various reasons unrelated to edge quality.
            </p>
          </div>
        </section>

        {/* Section 4: Risk Considerations */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Risk Considerations
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed space-y-4">
            <p>
              Several risk factors warrant consideration:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Variance:</strong> Even with a genuine edge, 
                individual outcomes are highly uncertain. A 55% win probability still 
                means 45% of outcomes result in losses.
              </li>
              <li>
                <strong className="text-foreground">Model uncertainty:</strong> Fair odds 
                calculations depend on assumptions about market efficiency and the 
                quality of reference prices. Errors in these assumptions propagate 
                through to edge estimates.
              </li>
              <li>
                <strong className="text-foreground">Execution risk:</strong> Displayed 
                odds may not be available at time of execution, or stake limits may 
                apply.
              </li>
              <li>
                <strong className="text-foreground">Information asymmetry:</strong> Late-breaking 
                news (injuries, lineup changes) can invalidate any analysis based on 
                earlier data.
              </li>
            </ul>
            <p>
              Proper bankroll management principles suggest that stake sizing should 
              account for edge uncertainty and the high variance inherent in single-event 
              outcomes. Overexposure to any single event, regardless of perceived edge 
              quality, increases ruin risk.
            </p>
          </div>
        </section>

        {/* Section 5: Where Odds Are Sourced */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Where Odds Are Sourced
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            <p>
              Odds referenced in this analysis are available at <strong className="text-foreground">{bookmaker}</strong>. 
              Fair odds are derived from margin-removed pricing at sharp reference books. 
              All prices are subject to change and may differ at time of viewing.
            </p>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="mb-10 p-6 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Disclaimer
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              This analysis is provided for informational and educational purposes only. 
              It does not constitute betting advice, investment advice, or a recommendation 
              to engage in any wagering activity.
            </p>
            <p>
              Past performance and historical edge data do not guarantee future results. 
              Sports betting involves substantial risk of financial loss. Only wager with 
              funds you can afford to lose.
            </p>
            <p>
              The authors and publishers of this content are not responsible for any 
              decisions made based on this information.
            </p>
          </div>
        </section>

        {/* Final Closing Statement */}
        <footer className="mt-12 pt-6 border-t border-border not-prose">
          <p className="text-sm text-muted-foreground italic text-center">
            This analysis is informational only and does not constitute betting advice.
          </p>
        </footer>
      </article>
    </>
  );
}