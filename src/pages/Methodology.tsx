import { Helmet } from "react-helmet-async";
import { 
  Radio, 
  Calculator, 
  Search, 
  Clock, 
  Filter, 
  PieChart,
  Mail,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";

const Methodology = () => {

  const steps = [
    {
      number: "01",
      icon: Radio,
      title: "Odds ingestion",
      subtitle: "Sharp vs. soft books",
      content: [
        "We collect odds from sharp books (like Pinnacle) and soft books (retail sportsbooks).",
        "Sharp book odds reflect the closest thing to \"true\" probability. Soft books often lag behind.",
      ],
      rejection: null
    },
    {
      number: "02",
      icon: Calculator,
      title: "Fair odds estimation",
      subtitle: "Removing the house edge",
      content: [
        "We strip out the margin from sharp book odds to arrive at \"fair odds\"—our best estimate of true probability.",
      ],
      rejection: null
    },
    {
      number: "03",
      icon: Search,
      title: "Edge detection",
      subtitle: "Finding the gap",
      content: [
        "An \"edge\" exists when a soft book offers odds higher than our calculated fair odds.",
        "Most edges are noise—detection is only the first filter.",
      ],
      rejection: "Edges below 3% threshold, outside acceptable odds range, or from poor-performing sources are discarded."
    },
    {
      number: "04",
      icon: Clock,
      title: "Confirmation over time",
      subtitle: "Patience as a filter",
      content: [
        "Every edge is tracked across multiple snapshots. We require persistence for 30+ minutes across at least 3 checks.",
        "Real mispricings tend to stick around. Noise disappears within minutes.",
      ],
      rejection: "Edges that vanish, appear only once, or fluctuate wildly are rejected."
    },
    {
      number: "05",
      icon: Filter,
      title: "Trend filtering",
      subtitle: "Ignoring the noise band",
      content: [
        "We look at how the edge has moved. Edges that are deteriorating are deprioritized.",
        "Small fluctuations within ±0.5% are ignored.",
      ],
      rejection: "An edge that was 5% but is now 2.8% and falling will not become actionable."
    },
    {
      number: "06",
      icon: PieChart,
      title: "Stake sizing",
      subtitle: "Conservative by design",
      content: [
        "We use 25% Kelly with a 2% cap per bet and 5% total exposure limit.",
      ],
      rejection: null
    },
    {
      number: "07",
      icon: Mail,
      title: "Output delivery",
      subtitle: "One email, no noise",
      content: [
        "Each morning, subscribers receive a single email with actionable edges or a status update.",
      ],
      rejection: null
    }
  ];

  const faqs = [
    {
      question: "Why do most edges get rejected?",
      answer: "Most \"edges\" aren't real. Our multi-stage filtering separates genuine mispricings from noise. Capital preservation is the priority."
    },
    {
      question: "How do you know if the system is working?",
      answer: "We track Closing Line Value (CLV). Positive CLV over time is the best leading indicator of long-term profitability."
    },
    {
      question: "Why only 0–3 bets per day?",
      answer: "Genuine edges are rare. We refuse to manufacture volume. Some days have zero actionable edges—that's the system working correctly."
    },
    {
      question: "What happens with multiple edges on the same game?",
      answer: "Correlated bets share risk. Our exposure caps prevent overconcentration regardless of how many edges appear."
    }
  ];

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
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Methodology – How Betting Edges Are Validated | doctore</title>
        <meta name="description" content="Learn how doctore detects, validates, and filters betting edges using time-based confirmation and CLV analysis." />
        <link rel="canonical" href="https://doctore.lovable.app/methodology" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-10 sm:py-12 md:py-16 lg:py-24 border-b border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3 sm:mb-4 text-foreground leading-tight">
              Our analytical methodology
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              A transparent look at the edge detection process—from raw odds to your inbox.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-8 sm:py-10 md:py-12">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl space-y-8 sm:space-y-10 md:space-y-16">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-card border border-border/60 flex items-center justify-center">
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex-1 pb-4 sm:pb-6 md:pb-8">
                    <div className="flex items-baseline gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <span className="font-mono text-xs text-muted-foreground/60">{step.number}</span>
                      <h2 className="text-base sm:text-lg md:text-xl font-medium text-foreground">{step.title}</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{step.subtitle}</p>
                    
                    <div className="space-y-2 sm:space-y-3">
                      {step.content.map((paragraph, i) => (
                        <p key={i} className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    {step.rejection && (
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-card/50 border border-border/40">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Rejection: </span>
                          {step.rejection}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary callout */}
        <section className="py-8 sm:py-10 md:py-12 bg-card/30 border-y border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <div className="p-4 sm:p-6 rounded-lg border border-border/60 bg-card/50">
              <h3 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base">The rejection rate is the point.</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                A typical day: 50+ potential edges → 5–10 after time confirmation → 1–3 after filtering → sometimes zero actionable. This is deliberate.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-6 sm:mb-8">Frequently asked questions</h2>
            
            <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="border border-border/60 rounded-lg px-4 sm:px-6 data-[state=open]:bg-card/50"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                    <span className="font-medium text-xs sm:text-sm text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3 sm:pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Technical Appendix */}
        <section className="py-8 sm:py-10 md:py-12 border-t border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                Technical appendix (formulas)
              </summary>
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-lg bg-card/50 border border-border/60 font-mono text-xs space-y-3 sm:space-y-4 overflow-x-auto">
                <div>
                  <p className="text-muted-foreground mb-1 sm:mb-2">Fair odds:</p>
                  <code className="text-foreground">fair_odds = raw_odds / (1 + margin)</code>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 sm:mb-2">Edge %:</p>
                  <code className="text-foreground">edge = (exec_odds / fair_odds) - 1</code>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 sm:mb-2">Kelly stake:</p>
                  <code className="text-foreground">stake = (edge / (odds - 1)) × 0.25</code>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 sm:mb-2">CLV:</p>
                  <code className="text-foreground">clv = (close_odds / bet_odds) - 1</code>
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-12 md:py-16 border-t border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl text-center">
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">
              Subscribe to the daily summary
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm">
              One email each morning. Actionable edges (if any), exposure status, and CLV signals.
            </p>
            
            <EmailSubscribeForm buttonText="Get the daily summary" />
          </div>
        </section>

        {/* Related Links */}
        <section className="py-8 sm:py-10 md:py-12 border-t border-border/40">
          <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">Related</h3>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link to="/clv" className="text-sm text-foreground hover:text-primary transition-colors">
                CLV Explained →
              </Link>
              <Link to="/edge-detection" className="text-sm text-foreground hover:text-primary transition-colors">
                Edge Detection →
              </Link>
              <Link to="/bankroll-management" className="text-sm text-foreground hover:text-primary transition-colors">
                Bankroll Management →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Methodology;