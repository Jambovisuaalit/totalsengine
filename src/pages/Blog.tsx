import { Calendar, Clock, ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getTodayDate } from "@/lib/pregame-data";
import { SPORT_DISPLAY_NAMES, Sport } from "@/types/pregame";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "/blog/data-driven-betting-strategy",
    title: "Data-driven betting strategy: how to build a repeatable edge",
    excerpt: "A practical framework using expected value, fractional Kelly, and closing line value to replace guesswork with a measurable, repeatable edge.",
    date: "April 2026",
    readTime: "9 min read",
  },
  {
    slug: "/blog/expected-value",
    title: "Expected Value (EV) in betting: the only number that matters",
    excerpt: "Expected value is the mathematical foundation of profitable betting. Learn how to calculate EV, why it matters more than win rate, and how it connects to long-term results.",
    date: "February 2025",
    readTime: "12 min read",
  },
  {
    slug: "/blog/line-shopping",
    title: "Line shopping: the easiest edge most bettors ignore",
    excerpt: "Comparing odds across multiple sportsbooks before placing a bet is the simplest, most effective way to improve your long-term results. Yet most bettors bet wherever is most convenient.",
    date: "February 2025",
    readTime: "10 min read",
  },
  {
    slug: "/blog/what-is-clv",
    title: "What is Closing Line Value (CLV)?",
    excerpt: "CLV is the most reliable leading indicator of betting skill. Learn what it is, why it matters more than win rate, and how to measure your own.",
    date: "January 2025",
    readTime: "10 min read",
  },
  {
    slug: "/blog/why-bettors-lose",
    title: "Why most bettors lose despite 'good picks'",
    excerpt: "The uncomfortable truth: picking winners isn't enough. Most losing bettors are defeated not by bad analysis, but by bad process.",
    date: "January 2025",
    readTime: "9 min read",
  },
  {
    slug: "/blog/kelly-criterion",
    title: "Kelly Criterion explained without hype",
    excerpt: "The Kelly Criterion is mathematically elegant and practically dangerous. Learn what it is, its limitations, and why fractional Kelly is safer.",
    date: "January 2025",
    readTime: "12 min read",
  },
  {
    slug: "/blog/fewer-bets",
    title: "Why fewer bets can outperform high-volume betting",
    excerpt: "The counterintuitive case for selectivity over volume. High-volume betting only works if every bet carries positive expected value.",
    date: "January 2025",
    readTime: "8 min read",
  },
  {
    slug: "/blog/betting-vs-investing",
    title: "Betting vs investing: key differences",
    excerpt: "Sports betting and stock market investing share underlying mathematics. But the practical differences matter enormously for expectations.",
    date: "January 2025",
    readTime: "11 min read",
  },
  {
    slug: "/blog/vig-explained",
    title: "The Vig (Vigorish) explained",
    excerpt: "The vig is the fee built into betting odds that ensures bookmakers profit regardless of the outcome. Understanding it is fundamental.",
    date: "January 2025",
    readTime: "9 min read",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Betting Analysis & Education – Doctore AI Blog"
        description="Educational articles on betting analytics, CLV, bankroll management, and decision-making."
        canonical="https://doctore.lovable.app/blog"
      />
      
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-10 sm:py-16 md:py-24 border-b border-border/40">
          <div className="container max-w-3xl px-4 sm:px-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3 sm:mb-4 text-foreground">
              Betting analysis and education
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[32ch] sm:max-w-none">
              Educational articles on betting strategy, edge detection, and bankroll management.
            </p>
          </div>
        </section>

        {/* Pre-Game Series */}
        <section className="py-8 sm:py-12 border-b border-border/40">
          <div className="container max-w-3xl px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pre-Game Series</h2>
              <Badge variant="secondary" className="text-xs">Daily</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              {(['nba', 'tennis', 'soccer'] as Sport[]).map((sport) => (
                <Link key={sport} to={`/blog/pregame/${sport}/${getTodayDate()}`}>
                  <Card className="h-full hover:border-primary/40 transition-colors group">
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {SPORT_DISPLAY_NAMES[sport]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Today's slate →</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              {(['nhl', 'mlb', 'nfl'] as Sport[]).map((sport) => (
                <Link
                  key={sport}
                  to={`/blog/pregame/${sport}/${getTodayDate()}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {SPORT_DISPLAY_NAMES[sport]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-8 sm:py-16">
          <div className="container max-w-3xl px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-6">
              {blogPosts.map((post) => (
                <Link key={post.slug} to={post.slug}>
                  <Card className="border-border/60 hover:border-border transition-colors group bg-card/30">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground/70 mb-2 sm:mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {post.excerpt}
                      </p>
                      <span className="text-sm text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                        Read article
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Blog;