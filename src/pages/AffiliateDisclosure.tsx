import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ExternalLink, Shield, AlertTriangle } from "lucide-react";

const AffiliateDisclosure = () => {
  return (
    <>
      <SEOHead
        title="Affiliate Disclosure – Doctore"
        description="Learn about our affiliate partnerships and how we earn commissions from sportsbook referrals. Your price is never affected."
        canonical="/affiliate-disclosure"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        
        <main className="flex-1">
          <section className="py-12 md:py-16 border-b border-border/40">
            <div className="container max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Affiliate Disclosure</h1>
              <p className="text-lg text-muted-foreground">
                Transparency about our business relationships and how we earn revenue.
              </p>
            </div>
          </section>

          <section className="py-10 md:py-12">
            <div className="container max-w-3xl prose prose-neutral dark:prose-invert">
              
              {/* How We Earn */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold m-0">How We Earn</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Doctore participates in affiliate programs with licensed sportsbooks and betting platforms. 
                  When you click on certain links on our site and sign up or place a wager, we may receive 
                  a commission from the sportsbook.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This commission comes from the sportsbook's marketing budget—<strong>it does not 
                  affect the odds or prices you receive</strong>. You pay exactly what you would pay 
                  if you visited the sportsbook directly.
                </p>
              </div>

              {/* What This Means For You */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold m-0">What This Means For You</h2>
                </div>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>No extra cost:</strong> Your betting odds and potential winnings are never affected by our affiliate relationship.</li>
                  <li><strong>Honest analysis:</strong> Our edge detection and analysis are based on mathematical models, not affiliate incentives.</li>
                  <li><strong>Selective partnerships:</strong> We only partner with licensed, reputable operators that we would use ourselves.</li>
                  <li><strong>Transparency:</strong> Affiliate links are clearly marked or use our /go/ redirect system.</li>
                </ul>
              </div>

              {/* Responsible Gaming */}
              <div className="mb-10 p-6 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-semibold m-0">Responsible Gaming</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Gambling involves risk and should be approached responsibly. Never bet more than 
                  you can afford to lose. If you or someone you know has a gambling problem, help 
                  is available.
                </p>
                <ul className="text-muted-foreground space-y-1 mb-4">
                  <li>• You must be 18+ (or legal gambling age in your jurisdiction)</li>
                  <li>• Gambling is not available in all jurisdictions</li>
                  <li>• Past performance does not guarantee future results</li>
                </ul>
                <Link 
                  to="/responsible-gaming" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Read our Responsible Gaming policy →
                </Link>
              </div>

              {/* Our Commitment */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Our Commitment</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our primary goal is to provide accurate, data-driven analysis. While affiliate 
                  revenue helps support our operations, it never influences which edges we identify 
                  or how we present our analysis. The mathematical model drives our recommendations, 
                  not commercial relationships.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  If you have questions about our affiliate relationships, please contact us.
                </p>
              </div>

            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
};

export default AffiliateDisclosure;