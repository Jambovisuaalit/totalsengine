import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

interface MatchAnalysisProps {
  teamA: string;
  teamB: string;
  marketContext: string;
  publishDate: string;
  author?: string;
  intro: string;
  marketOverview: React.ReactNode;
  oddsComparison: React.ReactNode;
  edgeAnalysis: React.ReactNode;
  riskUncertainty: React.ReactNode;
  invalidationFactors: React.ReactNode;
  faqs?: FAQItem[];
}

export function MatchAnalysisTemplate({
  teamA,
  teamB,
  marketContext,
  publishDate,
  author = "doctore analytics",
  intro,
  marketOverview,
  oddsComparison,
  edgeAnalysis,
  riskUncertainty,
  invalidationFactors,
  faqs = [],
}: MatchAnalysisProps) {
  const title = `Match Analysis: ${teamA} vs ${teamB} — ${marketContext}`;
  const description = `Analytical breakdown of the ${teamA} vs ${teamB} matchup. Market context, odds comparison, and risk factors explored.`;

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
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      <Helmet>
        <title>{title} | doctore</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* H1 Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
          Match Analysis: {teamA} vs {teamB}
          <span className="block text-lg sm:text-xl font-normal text-muted-foreground mt-2">
            {marketContext}
          </span>
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
        </div>

        {/* Intro */}
        <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
          {intro}
        </div>

        {/* Market Overview */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Market Overview
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {marketOverview}
          </div>
        </section>

        {/* Odds vs Fair Price Comparison */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Odds vs Fair Price Comparison
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {oddsComparison}
          </div>
        </section>

        {/* Where the Edge Comes From */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Where the Edge Comes From
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {edgeAnalysis}
          </div>
        </section>

        {/* Risk & Uncertainty */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Risk & Uncertainty
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {riskUncertainty}
          </div>
        </section>

        {/* What Would Invalidate This View */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            What Would Invalidate This View
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {invalidationFactors}
          </div>
        </section>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-l-2 border-border pl-4">
                  <h3 className="text-base font-medium text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <footer className="mt-12 pt-6 border-t border-border not-prose">
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            This analysis is informational and not betting advice.
          </p>
        </footer>
      </article>
    </>
  );
}