import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const BlogFewerBets = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Why Fewer Bets Can Outperform High-Volume Betting",
    description: "The counterintuitive case for selectivity over volume in sports betting.",
    author: {
      "@type": "Organization",
      name: "doctore",
    },
    datePublished: "2025-01-05",
    dateModified: "2025-01-05",
    publisher: {
      "@type": "Organization",
      name: "doctore",
      url: "https://doctore.lovable.app",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Subscribed",
      description: "You'll receive the daily summary starting tomorrow.",
    });
    
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Why Fewer Bets Can Outperform High-Volume Betting | doctore</title>
        <meta name="description" content="The counterintuitive case for selectivity over volume in sports betting." />
        <link rel="canonical" href="https://doctore.app/blog/fewer-bets" />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <SiteHeader />

      {/* Article Header */}
      <article className="py-16 md:py-24">
        <div className="container max-w-2xl">
          <header className="mb-12">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                January 2025
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                8 min read
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why fewer bets can outperform high-volume betting
            </h1>
            <p className="text-lg text-muted-foreground">
              The counterintuitive case for selectivity over volume in sports betting.
            </p>
          </header>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">The volume trap</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                There's a persistent belief in betting circles that more action equals more opportunity. The logic seems sound: if you have an edge, shouldn't you maximize the number of times you apply it?
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In theory, yes. In practice, this reasoning breaks down for a simple reason: most bettors don't have an edge on every bet they place. They have an edge on <em>some</em> bets—and the difference between those bets and the rest is where bankrolls go to die.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                High-volume betting only works if every bet carries positive expected value. The moment you start including marginal opportunities—bets where you're not sure, bets placed out of boredom, bets made because "there has to be something on tonight"—you dilute your edge. And in a game of thin margins, dilution is fatal.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Understanding variance and noise</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sports betting is a noisy environment. Even with a genuine 5% edge, you'll experience significant variance over hundreds of bets. Add more bets without maintaining edge quality, and you're not smoothing variance—you're amplifying it.
              </p>
              
              <div className="p-6 rounded-lg bg-card border border-border my-8">
                <h4 className="font-semibold mb-3">A simple illustration</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Consider two approaches over 100 bets:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Bettor A:</strong> Places 100 bets with an average 5% edge each. Expected profit: +5 units per 100 units staked.</li>
                  <li><strong className="text-foreground">Bettor B:</strong> Places 100 bets, but only 30 have a 5% edge. The other 70 average -2% (house edge). Net expected edge: ~0.5%.</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Bettor B placed the same number of bets, felt just as busy, but diluted their edge by 90%. Over time, the math is unforgiving.
                </p>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                The lesson isn't that volume is bad. It's that <em>unfiltered</em> volume is bad. Every additional bet needs to clear the same bar as your best bets. If it doesn't, you're paying for the privilege of feeling active.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Confirmation over speed</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In efficient markets—which modern sportsbooks increasingly resemble—genuine mispricings don't last forever, but they don't disappear instantly either. A line that's genuinely off will often stay off for 30 minutes, an hour, sometimes longer.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This creates an opportunity that high-volume bettors typically miss: confirmation.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Instead of jumping on the first signal—which could be noise, a data error, or a temporary glitch—you can wait. Check if the edge persists across multiple snapshots. See if the discrepancy is confirmed by other data points. Watch whether the line is moving toward your position (validating your read) or away from it (suggesting you misread the situation).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This patience costs you some edges—genuine opportunities that disappear before confirmation. But it saves you from far more bad bets than it costs in missed good ones. The math favors waiting.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">The psychological benefits of selectivity</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Beyond the mathematical arguments, there are psychological benefits to betting less that rarely get discussed.
              </p>
              
              <div className="space-y-6 my-8">
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold mb-2">Reduced emotional attachment</h4>
                  <p className="text-sm text-muted-foreground">
                    When you have 15 bets running, you're constantly monitoring, constantly reacting. One bad beat affects your mood for the next decision. With 1-2 bets, you can place them and move on. The outcome becomes less personal.
                  </p>
                </div>
                
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold mb-2">Clearer evaluation</h4>
                  <p className="text-sm text-muted-foreground">
                    Fewer bets mean you can actually remember why you made each one. You can track what worked and what didn't. With high volume, everything blurs into noise—you can't learn from outcomes you can't remember.
                  </p>
                </div>
                
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold mb-2">Sustainable engagement</h4>
                  <p className="text-sm text-muted-foreground">
                    Betting 15+ times per day is a part-time job. Betting 1-2 times per day is a hobby. Most people don't have the time, energy, or emotional bandwidth for the former. The latter is sustainable indefinitely.
                  </p>
                </div>
                
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold mb-2">Better bankroll management</h4>
                  <p className="text-sm text-muted-foreground">
                    With fewer concurrent bets, you can size each one appropriately. With 15 active positions, you're either over-leveraged or spreading yourself so thin that wins don't matter.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">What the research says</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Academic studies on betting markets consistently find that the most successful bettors—those with documented long-term profits—share common traits: they bet selectively, they have a clear edge criterion, and they don't deviate.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Conversely, studies on losing bettors find the opposite pattern: high volume, inconsistent criteria, and emotional decision-making. The correlation isn't subtle.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The professional sports betting syndicates that consistently profit don't bet on every game. They bet on situations where their models identify clear value. Sometimes that's 10 bets a day. Sometimes it's zero. Volume is an output of edge identification, not a goal in itself.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Practical takeaways</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you're currently a high-volume bettor and this resonates, here's how to shift your approach:
              </p>
              
              <div className="space-y-4 my-6">
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">01</span>
                  <div>
                    <h4 className="font-semibold mb-1">Define your edge criterion explicitly</h4>
                    <p className="text-sm text-muted-foreground">What has to be true for a bet to qualify? Write it down. If you can't articulate it, you don't have one.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">02</span>
                  <div>
                    <h4 className="font-semibold mb-1">Track pass rates, not just hit rates</h4>
                    <p className="text-sm text-muted-foreground">How many potential bets do you reject for every one you take? If the answer is "almost none," your filter isn't working.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">03</span>
                  <div>
                    <h4 className="font-semibold mb-1">Embrace days with zero bets</h4>
                    <p className="text-sm text-muted-foreground">A day without bets isn't a wasted day—it's a day you didn't give money back. Reframe inactivity as discipline.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">04</span>
                  <div>
                    <h4 className="font-semibold mb-1">Size bets to reflect conviction</h4>
                    <p className="text-sm text-muted-foreground">If you truly believe in fewer, higher-quality bets, your stake sizes should reflect that. Bigger edges deserve bigger bets.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <span className="font-mono text-primary font-semibold">05</span>
                  <div>
                    <h4 className="font-semibold mb-1">Measure what matters</h4>
                    <p className="text-sm text-muted-foreground">Track your Closing Line Value over time. Are the bets you place actually capturing value the market later corrects? This matters more than win-loss in the short term.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">The bottom line</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Volume feels productive. It gives you skin in the game, something to root for, a reason to watch. But feelings and profits are different things.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The edge in sports betting comes from finding and exploiting inefficiencies. Inefficiencies are rare by definition. A system that generates 10+ daily "edges" is almost certainly including noise. A system that generates 0-3 is probably being honest about the scarcity of genuine value.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Fewer bets, held to a higher standard, with patience built into the process. It's not the exciting approach. It's just the one that works.
              </p>
            </section>
          </div>

          {/* Related Reading */}
          <footer className="mt-16 pt-8 border-t border-border/40">
            <p className="text-sm text-muted-foreground mb-4">Related reading</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/blog/why-bettors-lose" className="text-sm text-foreground hover:text-primary transition-colors">
                Why Most Bettors Lose →
              </Link>
              <Link to="/blog/kelly-criterion" className="text-sm text-foreground hover:text-primary transition-colors">
                Kelly Criterion Explained →
              </Link>
              <Link to="/methodology" className="text-sm text-foreground hover:text-primary transition-colors">
                Our Methodology →
              </Link>
            </div>
          </footer>

          {/* Soft CTA */}
          <div className="mt-16 p-8 rounded-lg bg-card border border-border text-center">
            <p className="text-muted-foreground mb-6">
              If you want confirmed edges delivered daily—with time-based validation and conservative sizing built in—subscribe to the free summary.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background border-border"
              />
              <Button type="submit" className="h-11" disabled={isSubmitting}>
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground mt-4">
              One email each morning. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
};

export default BlogFewerBets;