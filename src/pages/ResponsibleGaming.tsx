import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const ResponsibleGaming = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Responsible Use & Risk Awareness – Doctore AI"
        description="Doctore AI is an analytical tool. Betting involves risk. Learn about responsible usage and risk awareness."
        canonical="https://doctore.lovable.app/responsible-gaming"
      />
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 border-b border-border/40">
          <div className="container max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground">
              Responsible use and risk awareness
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Betting always involves risk. Doctore AI is an informational tool—not financial advice, not a guarantee, and not a path to certain profit.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <article className="prose prose-invert prose-sm max-w-none space-y-12">
              
              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">This platform is informational, not advice</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Doctore AI provides analytical observations about betting markets. Nothing on this platform constitutes financial advice, gambling recommendations, or guarantees of any outcome.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  All betting decisions are yours. We provide data and analysis; you decide whether and how to act on that information. We are not responsible for any losses incurred.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Betting always involves risk</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Even with positive expected value, short-term and medium-term losses are normal. Variance is real and unavoidable.
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>Losing streaks of 10+ bets occur regularly even with edge</li>
                  <li>Monthly drawdowns of 20%+ are statistically expected</li>
                  <li>Quarters or even years can be unprofitable despite skill</li>
                  <li>Edge estimates can be wrong</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Never bet money you cannot afford to lose. This is not a figure of speech.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">No guarantees, no certainty</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We explicitly reject the language of certainty. You will never see us use:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>"Lock" or "guaranteed win"</li>
                  <li>"Must-bet" or "can't miss"</li>
                  <li>"Easy money" or "free money"</li>
                  <li>Any promise of specific returns</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  If you encounter this language anywhere in betting, treat it as a red flag. The nature of probability means certainty is impossible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">Managing expectations and drawdowns</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Realistic expectations are essential:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>Professional bettors measure success over thousands of bets, not dozens</li>
                  <li>A 2-3% monthly return would be exceptional in this field</li>
                  <li>Most months will not feel successful, even for profitable bettors</li>
                  <li>The emotional toll of variance is real and should be anticipated</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  If you find yourself chasing losses, increasing stakes after losing, or betting money you need for other purposes—stop immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">When not to bet</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You should not bet if:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>You are betting money needed for rent, food, or other essentials</li>
                  <li>You are in debt or struggling financially</li>
                  <li>Betting is causing stress, anxiety, or relationship problems</li>
                  <li>You feel the need to hide your betting from others</li>
                  <li>You are under 18/21 (depending on jurisdiction)</li>
                  <li>Betting is illegal in your jurisdiction</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-medium text-foreground mb-4">External help resources</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you or someone you know has a gambling problem, help is available:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-3 list-none">
                  <li>
                    <strong className="text-foreground">National Council on Problem Gambling</strong><br />
                    1-800-522-4700 (24/7, confidential)<br />
                    <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ncpgambling.org</a>
                  </li>
                  <li>
                    <strong className="text-foreground">Gamblers Anonymous</strong><br />
                    <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gamblersanonymous.org</a>
                  </li>
                  <li>
                    <strong className="text-foreground">GamCare (UK)</strong><br />
                    0808-8020-133<br />
                    <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gamcare.org.uk</a>
                  </li>
                </ul>
              </section>

            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ResponsibleGaming;