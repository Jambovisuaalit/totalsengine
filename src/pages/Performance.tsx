import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  TrendingUp, 
  BarChart3, 
  Hash,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";

const Performance = () => {

  const metrics = [
    {
      icon: TrendingUp,
      title: "Closing Line Value (CLV)",
      description: "The primary success indicator. CLV measures whether the edges we identify are real—did the market move in the expected direction after we flagged the opportunity?",
      detail: "Positive CLV over time means we're consistently identifying genuine inefficiencies. Importantly, CLV doesn't require bet outcomes to validate—it's measurable on every bet, win or lose."
    },
    {
      icon: BarChart3,
      title: "Drawdown and Volatility",
      description: "The maximum peak-to-trough decline in bankroll during any period. Drawdowns are expected with any legitimate betting approach.",
      detail: "With our conservative sizing (2% max stakes, fractional Kelly), drawdowns should stay manageable. A 20% drawdown is uncomfortable but not alarming with this approach."
    },
    {
      icon: Hash,
      title: "Bet Count and Selectivity",
      description: "Fewer bets means a higher bar for qualification. Days with zero bets are not failures—they're the filter working correctly.",
      detail: "Quality over quantity. Volume is not a feature. If you see 10+ bets per day from any system, something is likely wrong with their filtering."
    }
  ];

  const realityChecks = [
    "A 10-bet losing streak is statistically expected even with strong edges.",
    "Positive ROI after 30 bets could be entirely luck. Negative ROI could be entirely variance.",
    "The market closes in your favor (CLV) more often than your bets win. This is expected."
  ];

  const evaluationSteps = [
    {
      step: "Track CLV over 100+ bets",
      detail: "The earliest reliable signal. Your rolling CLV should trend positive if edges are genuine."
    },
    {
      step: "Monitor drawdown relative to expectations",
      detail: "With 2% max stakes and fractional Kelly, drawdowns should stay within predictable bounds."
    },
    {
      step: "Ignore win streaks and losing streaks",
      detail: "Both are noise. Focus on process metrics, not outcomes over small samples."
    },
    {
      step: "Compare selectivity to volume",
      detail: "If output suddenly spikes to 10+ bets/day, the filter has broken. Low volume is a feature."
    },
    {
      step: "Give it time",
      detail: "Minimum 3-6 months before drawing conclusions. Ideally 12+ months for full seasonal cycles."
    }
  ];

  const faqs = [
    {
      question: "How long before I can tell if this is working?",
      answer: "At least 3-6 months and 200+ bets to draw preliminary conclusions. For statistical confidence, 500+ bets over 12+ months. Anything less is noise. We know this is frustrating, but there's no shortcut to reliable evaluation."
    },
    {
      question: "What's a 'good' CLV number?",
      answer: "Sustained positive CLV of 1-3% is excellent in today's efficient markets. Anything above 0% over large samples suggests genuine edge identification. Be skeptical of any system claiming 5%+ CLV consistently."
    },
    {
      question: "Why track CLV instead of just ROI?",
      answer: "ROI is the lagging indicator—it tells you what happened, contaminated by variance. CLV is the leading indicator—it tells you whether your process is sound. Positive CLV eventually converts to positive ROI; negative CLV will eventually catch up with you."
    }
  ];

  const hypotheticalMonths = [
    { month: "Month 1", result: "+3.2 units", note: "Hot start—likely variance" },
    { month: "Month 2", result: "-2.8 units", note: "Expected pullback" },
    { month: "Month 3", result: "-1.1 units", note: "Flat, boring—this is normal" },
    { month: "Month 4", result: "+4.5 units", note: "Edges paying off" },
    { month: "Month 5", result: "-0.5 units", note: "Churn" },
    { month: "Month 6", result: "+2.1 units", note: "Steady" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Performance Evaluation – Doctore AI"
        description="How to evaluate betting performance correctly. Learn why CLV matters more than short-term ROI and how to assess any betting system."
        canonical="https://doctore.lovable.app/performance"
      />
      
      <SiteHeader />

      <main className="flex-1">

      {/* Metrics That Matter */}
      <section className="py-10 sm:py-16">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">The metrics that matter</h2>
          
          <div className="space-y-4 sm:space-y-6">
            {metrics.map((metric) => (
              <Card key={metric.title} className="border-border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <metric.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{metric.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{metric.description}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 hidden sm:block">{metric.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Size Philosophy */}
      <section className="py-10 sm:py-16 bg-card/50 border-y border-border">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Why sample size matters more than recent results</h2>
          
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>Any small sample of bets tells you almost nothing. Even with a genuine 5% edge, short-term variance dominates.</p>
            <p><strong className="text-foreground">500+ bets minimum</strong> to draw meaningful conclusions about edge quality.</p>
          </div>
          
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-xs sm:text-sm text-foreground">
              <strong>The uncomfortable truth:</strong> You cannot reliably distinguish skill from luck in small samples. That's why we focus on CLV.
            </p>
          </div>
        </div>
      </section>

      {/* Rolling CLV Explained */}
      <section className="py-10 sm:py-16">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Rolling CLV: The leading indicator</h2>
          
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>CLV is calculated for every edge, win or lose. Rolling CLV tracks the average over your last 50-100 bets.</p>
            <p><strong className="text-foreground">Positive rolling CLV</strong> = consistently identifying value before the market corrects.</p>
          </div>
          
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-medium">Positive CLV, bet loses</span>
              </div>
              <p className="text-xs text-muted-foreground">You identified value. The outcome just didn't hit.</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium">Negative CLV, bet wins</span>
              </div>
              <p className="text-xs text-muted-foreground">You got lucky. The market moved against you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ROI Fluctuates */}
      <section className="py-10 sm:py-16 bg-card/50 border-y border-border">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Short-term ROI is not a scoreboard</h2>
          
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 sm:mb-8">
            <p>Even with a verified 3% edge, you can easily be down after 100 bets.</p>
            <p><strong className="text-foreground">Never evaluate on weekly or monthly P&L.</strong></p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {realityChecks.map((check, index) => (
              <div key={index} className="p-3 sm:p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground">{check}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Evaluate */}
      <section className="py-10 sm:py-16">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">How to evaluate any system</h2>
          
          <div className="space-y-3 sm:space-y-4">
            {evaluationSteps.map((item, index) => (
              <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-card/50 transition-colors">
                <span className="font-mono text-xs sm:text-sm text-primary font-semibold">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">{item.step}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hypothetical Scenario */}
      <section className="py-10 sm:py-16 bg-card/50 border-y border-border">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Hypothetical example</h2>
          
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <p className="text-xs sm:text-sm text-amber-200">
              <strong>Disclaimer:</strong> Hypothetical illustration only.
            </p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {hypotheticalMonths.map((item) => (
              <div key={item.month} className="p-2 sm:p-3 rounded-lg border border-border bg-card">
                <div className="font-mono text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{item.month}</div>
                <div className={`font-semibold text-xs sm:text-sm ${item.result.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.result}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{item.note}</div>
              </div>
            ))}
          </div>
          
          <div className="p-3 sm:p-4 rounded-lg border border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
              <div>
                <span className="text-muted-foreground">6-mo: </span>
                <span className="font-semibold text-emerald-400">+5.4 units</span>
                <span className="text-muted-foreground"> (~3.6% ROI)</span>
              </div>
              <div>
                <span className="text-muted-foreground">CLV: </span>
                <span className="font-semibold text-emerald-400">+2.1%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Modest gains, significant variance, positive CLV trend. This is sustainable edge betting.
            </p>
          </div>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="py-10 sm:py-16">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Important disclaimers</h2>
          
          <div className="p-4 sm:p-6 rounded-lg border border-destructive/30 bg-destructive/5">
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span><strong>Past performance does not guarantee future results.</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>All betting involves risk. You can lose your entire bankroll.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>Do not stake money you cannot afford to lose.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>Gambling problem? Call 1-800-GAMBLER.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-16 border-t border-border">
        <div className="container max-w-3xl px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">FAQ</h2>
          
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-border rounded-lg px-4 sm:px-6 data-[state=open]:bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                  <span className="font-medium text-xs sm:text-sm">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3 sm:pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
        <section className="py-10 sm:py-16 border-t border-border/40">
          <div className="container max-w-xl text-center px-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-3 sm:mb-4">
              Get the daily summary
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm">
              One email each morning with actionable edges and CLV signals.
            </p>
            
            <EmailSubscribeForm />
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
              <Link to="/methodology" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Read the methodology
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

export default Performance;