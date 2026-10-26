import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MatchAnalysisTemplate } from "@/components/MatchAnalysisTemplate";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BlogMatchAnalysisExample = () => {
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

        <MatchAnalysisTemplate
          teamA="Boston Bruins"
          teamB="Toronto Maple Leafs"
          marketContext="Moneyline liquidity divergence"
          publishDate="2026-01-07"
          intro="The Bruins-Leafs matchup presents an interesting case study in market behavior. 
            Sharp books have tightened their lines while recreational books maintain wider spreads, 
            creating observable pricing inefficiencies worth examining."
          marketOverview={
            <>
              <p className="mb-4">
                This divisional rivalry typically attracts significant betting volume, resulting in 
                efficient pricing across most markets. However, recent line movements suggest 
                disagreement between sharp and recreational bookmakers.
              </p>
              <p>
                Pinnacle opened Boston at -125, while softer books posted -135. This 10-cent 
                differential is notable for a high-liquidity NHL matchup and warrants closer 
                examination of the underlying factors.
              </p>
            </>
          }
          oddsComparison={
            <>
              <p className="mb-4">
                Using margin-removed consensus pricing, the fair moneyline for Boston calculates 
                to approximately -122, implying a 55.0% win probability. Current execution odds 
                at select books offer -115, representing a potential 2.1% edge.
              </p>
              <p>
                It's important to note that fair odds calculations carry inherent uncertainty. 
                The consensus methodology assumes efficient markets at sharp books, which may 
                not always hold true for games with injury uncertainty or late-breaking news.
              </p>
            </>
          }
          edgeAnalysis={
            <>
              <p className="mb-4">
                The observed pricing discrepancy appears to stem from differing injury 
                assessments. Toronto's starting goaltender status remains uncertain, and 
                recreational books have been slower to adjust their lines to reflect this 
                uncertainty.
              </p>
              <p>
                Sharp books incorporate injury probability distributions into their pricing 
                models, while softer books often wait for official confirmations. This 
                information asymmetry creates temporary mispricings.
              </p>
            </>
          }
          riskUncertainty={
            <>
              <p className="mb-4">
                Several factors contribute to uncertainty in this analysis:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Goaltender confirmation could shift lines significantly</li>
                <li>Back-to-back scheduling effects are difficult to quantify</li>
                <li>Small sample of recent head-to-head matchups</li>
                <li>Potential for late lineup changes</li>
              </ul>
              <p>
                The observed edge may disappear entirely once injury news is confirmed, 
                and execution at current prices may not be available by game time.
              </p>
            </>
          }
          invalidationFactors={
            <>
              <p className="mb-4">
                This analysis would be invalidated by:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Confirmation of Toronto's starting goaltender playing</li>
                <li>Line movement at soft books to match sharp pricing</li>
                <li>Additional Boston injuries announced</li>
                <li>Significant public betting volume shifting consensus</li>
              </ul>
            </>
          }
          faqs={[
            {
              question: "What is a margin-removed fair price?",
              answer:
                "A margin-removed fair price removes the bookmaker's built-in profit margin (vig) to estimate the 'true' probability implied by the odds. This is calculated by dividing each side's implied probability by the total overround.",
            },
            {
              question: "Why do different bookmakers have different odds?",
              answer:
                "Bookmakers set odds based on their risk exposure, customer base, and pricing models. Sharp books (like Pinnacle) price based on market efficiency, while recreational books factor in customer betting patterns and may be slower to adjust to new information.",
            },
            {
              question: "Does an edge guarantee profit?",
              answer:
                "No. An edge represents a positive expected value over many bets, but individual outcomes are highly variable. Even with a genuine edge, short-term losses are common and expected.",
            },
          ]}
        />
      </main>

      <SiteFooter />
    </div>
  );
};

export default BlogMatchAnalysisExample;