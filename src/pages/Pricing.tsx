import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check,
  X,
  Clock,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";

const Pricing = () => {
  const freeFeatures = [
    { included: true, text: "Daily summary email" },
    { included: true, text: "Edge count and market status" },
    { included: true, text: "Aggregate CLV updates" },
    { included: false, text: "Specific game/market details" },
    { included: false, text: "Exact odds and stake sizes" },
    { included: false, text: "Historical performance data" },
  ];

  const proFeatures = [
    { included: true, text: "Everything in Free" },
    { included: true, text: "Full actionable edge details" },
    { included: true, text: "Game, market, odds, stake size" },
    { included: true, text: "Pre-game alerts" },
    { included: true, text: "Historical CLV data" },
    { included: true, text: "Dashboard access" },
  ];

  const proIsFor = [
    "Bettors who already have a process",
    "People who value time over subscription cost",
    "Those who understand variance",
  ];

  const proIsNotFor = [
    "Beginners without bankroll management",
    "Anyone looking for \"guaranteed winners\"",
    "Recreational bettors betting for entertainment",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Pricing – Doctore AI"
        description="Simple pricing with a genuine free tier. Start with the daily summary, upgrade only if the discipline and time savings justify it."
        canonical="https://doctore.lovable.app/pricing"
      />
      
      <SiteHeader />

      <main className="flex-1">

      {/* Pricing Cards */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="container max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Free Tier */}
            <Card className="border-border relative">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Free</CardTitle>
                <div className="mt-3 sm:mt-4">
                  <span className="text-3xl sm:text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2 text-sm">/ month</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Daily summary, without specific actionable details.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 sm:mt-8">
                  <EmailSubscribeForm buttonText="Start free" variant="outline" />
                </div>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary/50 relative">
              <div className="absolute -top-3 left-4">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Full access
                </span>
              </div>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Pro</CardTitle>
                <div className="mt-3 sm:mt-4">
                  <span className="text-3xl sm:text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground ml-2 text-sm">/ month</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Complete actionable intelligence and alerts.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full h-12 sm:h-11 mt-6 sm:mt-8 text-sm">
                  Start 7-day free trial
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  No credit card required. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-10 sm:py-12 md:py-16 bg-card/50 border-y border-border">
        <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-6 text-center">What you're paying for</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 rounded-lg border border-border bg-card">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Time saved</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hours of daily research condensed into one summary. Focus on execution, not research.
              </p>
            </div>
            
            <div className="p-4 sm:p-6 rounded-lg border border-border bg-card">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Discipline enforced</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pre-calculated stakes and exposure caps remove emotion from the process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Pro Is For */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                Pro is for you if...
              </h2>
              <ul className="space-y-3 sm:space-y-4">
                {proIsFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-primary font-mono">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                Pro is NOT for you if...
              </h2>
              <ul className="space-y-3 sm:space-y-4">
                {proIsNotFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-red-400 font-mono">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tier Emphasis */}
      <section className="py-10 sm:py-12 md:py-16 bg-card/50 border-y border-border">
        <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">The free tier is real.</h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed">
            You'll receive a genuine daily summary with market status, edge counts, and CLV updates. It's not a teaser—it's useful information, forever free.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Many users stay on Free. Upgrade only if additional detail makes sense.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="container max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">Common questions</h2>
          
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Can I cancel anytime?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Yes. No contracts, no fees. Cancel from settings and retain access until period ends.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">What if the system has a bad month?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bad months happen—that's variance. Read Performance before subscribing. If you'll panic, Pro isn't for you yet.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Do you offer refunds?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We offer a 7-day free trial. After that, no refunds—but cancel anytime to prevent future charges.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Is payment secure?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Payments are processed by Stripe. We never see or store your card details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
        <section className="py-10 sm:py-12 md:py-16 border-t border-border/40">
          <div className="container max-w-xs sm:max-w-md text-center">
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">
              Start with the free summary
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm">
              No credit card. No commitment. See if the approach resonates.
            </p>
            
            <EmailSubscribeForm buttonText="Start free" variant="secondary" />
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4">
              <Link to="/methodology" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Read the methodology first
              </Link>
              <span className="hidden sm:inline text-muted-foreground/40">·</span>
              <Link to="/dashboard" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Pricing;