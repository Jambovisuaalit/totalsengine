import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

interface ExampleItem {
  scenario: string;
  explanation: string;
}

interface MarketExplainerProps {
  concept: string;
  publishDate: string;
  author?: string;
  intro: string;
  whatItIs: React.ReactNode;
  whyItExists: React.ReactNode;
  howItAffectsOdds: React.ReactNode;
  commonMisunderstandings: React.ReactNode;
  howProfessionalsThink: React.ReactNode;
  examples?: ExampleItem[];
  faqs: FAQItem[];
}

export function MarketExplainerTemplate({
  concept,
  publishDate,
  author = "doctore analytics",
  intro,
  whatItIs,
  whyItExists,
  howItAffectsOdds,
  commonMisunderstandings,
  howProfessionalsThink,
  examples = [],
  faqs,
}: MarketExplainerProps) {
  const title = `${concept} Explained`;
  const description = `A neutral, educational breakdown of ${concept.toLowerCase()}. What it is, why it exists, and how it affects betting markets.`;

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
    articleSection: "Education",
  };

  const faqSchema = {
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
  };

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
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* H1 Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
          {concept} Explained
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
        <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 border-l-2 border-border pl-4">
          {intro}
        </div>

        {/* What It Is */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            What It Is
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {whatItIs}
          </div>
        </section>

        {/* Why It Exists */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Why It Exists
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {whyItExists}
          </div>
        </section>

        {/* How It Affects Odds */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            How It Affects Odds
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {howItAffectsOdds}
          </div>
        </section>

        {/* Examples */}
        {examples.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              Hypothetical Examples
            </h2>
            <div className="space-y-4 not-prose">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="bg-muted/50 border border-border rounded-lg p-4"
                >
                  <p className="text-sm font-medium text-foreground mb-2">
                    {example.scenario}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {example.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Common Misunderstandings */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Common Misunderstandings
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {commonMisunderstandings}
          </div>
        </section>

        {/* How Professionals Think About It */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            How Professionals Think About It
          </h2>
          <div className="text-base text-muted-foreground leading-relaxed">
            {howProfessionalsThink}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 not-prose">
            {faqs.map((faq, index) => (
              <div key={index} className="border-l-2 border-border pl-4">
                <h3 className="text-base font-medium text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Note */}
        <footer className="mt-12 pt-6 border-t border-border not-prose">
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            This article is for educational purposes only and does not constitute financial or betting advice.
          </p>
        </footer>
      </article>
    </>
  );
}