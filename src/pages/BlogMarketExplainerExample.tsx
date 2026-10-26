import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketExplainerTemplate } from "@/components/MarketExplainerTemplate";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BlogMarketExplainerExample = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-8 sm:py-12 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <MarketExplainerTemplate
          concept="The Vig (Vigorish)"
          publishDate="2026-01-07"
          intro="The vig—also called juice, margin, or overround—is the fee built into betting odds that ensures bookmakers profit regardless of the outcome. Understanding how it works is fundamental to evaluating any betting market."
          whatItIs={
            <>
              <p className="mb-4">
                The vig is the difference between the true probability of outcomes and the 
                implied probability in the offered odds. When you add up the implied probabilities 
                of all outcomes in a market, they exceed 100%. That excess is the vig.
              </p>
              <p>
                For example, in a coin flip, fair odds would be +100 on both sides (50% each, 
                totaling 100%). But a bookmaker might offer -110 on both sides, implying 52.4% 
                per outcome—a total of 104.8%. The 4.8% excess is the vig.
              </p>
            </>
          }
          whyItExists={
            <>
              <p className="mb-4">
                Bookmakers are businesses that need to generate revenue. The vig serves as 
                their primary income source, ensuring they profit over the long run regardless 
                of which side wins any individual bet.
              </p>
              <p className="mb-4">
                Unlike casinos with fixed house edges, bookmakers face the challenge of 
                balancing action on both sides of a market. The vig provides a buffer that 
                allows them to operate profitably even when their book isn't perfectly balanced.
              </p>
              <p>
                Sharp bookmakers (like Pinnacle) typically offer lower vig because they rely 
                on high volume and efficient pricing. Recreational books charge higher vig 
                because they cater to less price-sensitive customers.
              </p>
            </>
          }
          howItAffectsOdds={
            <>
              <p className="mb-4">
                The vig directly reduces the payout you receive for winning bets. Even if 
                you're correct 50% of the time on fair coin-flip propositions, standard 
                -110/-110 odds mean you'd lose money over time.
              </p>
              <p className="mb-4">
                To break even at -110 odds, you need to win approximately 52.4% of your bets. 
                This creates a hurdle that all bettors must overcome before achieving profitability.
              </p>
              <p>
                The vig varies by sport, market type, and bookmaker. NFL spreads typically 
                carry 4-5% vig at recreational books, while obscure props might carry 10% or more.
              </p>
            </>
          }
          examples={[
            {
              scenario: "Standard NFL spread: Team A -3 (-110) vs Team B +3 (-110)",
              explanation:
                "Each side implies 52.4% probability. Total: 104.8%. The 4.8% overround is the vig. A $110 bet wins $100, but losing costs the full $110—the asymmetry is how the book profits.",
            },
            {
              scenario: "Sharp book pricing: Team A -3 (-105) vs Team B +3 (-105)",
              explanation:
                "Each side implies 51.2%. Total: 102.4%. Lower vig means better value for bettors, which is why sharp bettors seek out reduced-juice books.",
            },
            {
              scenario: "Three-way soccer market: Home +150, Draw +230, Away +180",
              explanation:
                "Implied probabilities: 40% + 30.3% + 35.7% = 106%. The 6% vig is distributed across all three outcomes, making it harder to identify where fair value lies.",
            },
          ]}
          commonMisunderstandings={
            <>
              <p className="mb-4">
                <strong className="text-foreground">Misconception: Lower odds always mean higher vig.</strong>
                <br />
                Reality: Vig is about the total overround, not individual prices. A -200 
                favorite with a +180 underdog has lower vig than -200/+160.
              </p>
              <p className="mb-4">
                <strong className="text-foreground">Misconception: The vig is the same across all markets.</strong>
                <br />
                Reality: Main markets (spreads, totals) typically have lower vig than props 
                or exotic bets. Bookmakers charge more where bettors are less price-sensitive.
              </p>
              <p>
                <strong className="text-foreground">Misconception: You can ignore the vig if you pick winners.</strong>
                <br />
                Reality: The vig is a constant drag on returns. Even skilled bettors factor 
                vig into every decision because it directly impacts expected value.
              </p>
            </>
          }
          howProfessionalsThink={
            <>
              <p className="mb-4">
                Professional bettors obsess over finding the lowest vig. They maintain 
                accounts at multiple books specifically to access better prices, knowing 
                that even small vig reductions compound significantly over thousands of bets.
              </p>
              <p className="mb-4">
                When evaluating a potential bet, pros calculate the "no-vig" or "fair" 
                price first, then compare it to available odds. A bet only has positive 
                expected value if the offered odds exceed the fair price by enough to 
                overcome the vig.
              </p>
              <p>
                Sophisticated bettors also understand that vig varies by time—lines often 
                tighten closer to game time as books compete for action, sometimes reducing 
                vig significantly from opening prices.
              </p>
            </>
          }
          faqs={[
            {
              question: "What's a typical vig for major sports?",
              answer:
                "NFL and NBA spreads typically carry 4-5% vig at recreational books, 2-3% at sharp books. Soccer and hockey often run slightly higher. Player props and exotic markets can exceed 10%.",
            },
            {
              question: "How do I calculate the vig on any market?",
              answer:
                "Convert each outcome's odds to implied probability (for American odds: if negative, divide the odds by odds minus 100; if positive, divide 100 by odds plus 100). Sum all probabilities. Subtract 100% to get the vig percentage.",
            },
            {
              question: "Does betting exchanges eliminate the vig?",
              answer:
                "Exchanges replace traditional vig with commission on winning bets (typically 2-5%). The effective cost depends on your win rate, but for most bettors, sharp-book pricing offers comparable or better value.",
            },
            {
              question: "Why do some books have higher vig than others?",
              answer:
                "Recreational books target casual bettors who prioritize convenience over price. Sharp books compete on margins to attract high-volume bettors. Business model differences drive vig differences.",
            },
            {
              question: "Can the vig ever work in my favor?",
              answer:
                "Rarely. Promotional pricing, line shopping across books, or finding stale lines can occasionally let you bet at odds better than fair value. But the vig structurally favors the book in virtually all standard situations.",
            },
          ]}
        />
      </main>

      <SiteFooter />
    </div>
  );
};

export default BlogMarketExplainerExample;