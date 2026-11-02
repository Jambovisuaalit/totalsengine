import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Database, Brain, BarChart3, Layers, Target, Code, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";

const Manifesto = () => {
  return (
    <>
      <Helmet>
        <title>The Doctore Edge — Data-Driven Betting Intelligence Platform</title>
        <meta
          name="description"
          content="Doctore is the first transparent, data-native betting intelligence ecosystem. AI sports analytics, predictive modeling API, odds comparison engine, and closing line value tracking — unified."
        />
        <link rel="canonical" href="https://doctore.lovable.app/manifesto" />
        <meta property="og:title" content="The Doctore Edge — A Manifesto for Data-Driven Betting Intelligence" />
        <meta property="og:description" content="Transparency over hype. Data over opinion. Infrastructure over shortcuts. Discover the operating system for betting intelligence." />
        <meta property="og:url" content="https://doctore.lovable.app/manifesto" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://doctore.lovable.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="sports betting api, ai sports analytics api, predictive modeling api, odds comparison engine, closing line value tracker, value bet finder, betting ROI calculator, prediction accuracy tracker, enterprise sports data, sportsbook integration api" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "The Doctore Edge — A Manifesto for Data-Driven Betting Intelligence",
            description: "How Doctore is building the first transparent, data-native betting intelligence ecosystem with AI analytics, predictive modeling APIs, and real-time odds infrastructure.",
            author: { "@type": "Organization", name: "Doctore" },
            publisher: {
              "@type": "Organization",
              name: "Doctore",
              url: "https://doctore.lovable.app",
            },
            mainEntityOfPage: "https://doctore.lovable.app/manifesto",
          })}
        </script>
      </Helmet>

      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/60">
          <div className="container max-w-3xl py-16 sm:py-24">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Manifesto
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              The Doctore Edge
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-serif italic">
              A Manifesto for Data-Driven Betting Intelligence
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section className="border-b border-border/60">
          <div className="container max-w-3xl py-12 sm:py-16">
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-4">
              The sports betting industry has evolved into a global data market worth hundreds of billions of dollars annually. Yet the majority of betting platforms, prediction sites, and analytics tools still rely on fragmented information, opaque models, and affiliate-driven content.
            </p>
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-4">
              Doctore exists to change that.
            </p>
            <p className="text-base sm:text-lg text-foreground leading-relaxed">
              Our mission is to build the first truly transparent, data-native betting intelligence ecosystem — where analytics, infrastructure, and prediction models converge into a unified platform.
            </p>
            <p className="text-base sm:text-lg text-foreground leading-relaxed mt-4 font-medium">
              This is what we call <span className="text-accent-foreground">The Doctore Edge</span>.
            </p>
          </div>
        </section>

        {/* The Problem */}
        <section className="border-b border-border/60 bg-card">
          <div className="container max-w-3xl py-12 sm:py-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-8">
              The Problem
            </h2>
            <p className="text-muted-foreground mb-8">
              Most competitors fall into one of three categories:
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: BarChart3,
                  title: "Media-driven betting platforms",
                  description: "These sites generate traffic through content, picks, and guides. Their revenue depends on affiliate commissions from sportsbooks rather than the accuracy of their insights.",
                },
                {
                  icon: Target,
                  title: "Value-betting software tools",
                  description: "These platforms focus on line shopping and arbitrage opportunities. While powerful, they rarely provide the full analytical context behind market inefficiencies.",
                },
                {
                  icon: Database,
                  title: "Sports data infrastructure providers",
                  description: "These companies supply odds feeds and sports data to sportsbooks. Their solutions are powerful but inaccessible to the broader developer and analytics ecosystem.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start p-4 rounded-lg border border-border/60 bg-background">
                  <div className="mt-1 p-2 rounded-md bg-accent">
                    <item.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-foreground font-medium">
              Each category solves only a part of the problem. None connects the full pipeline from <span className="font-mono text-sm bg-accent text-accent-foreground px-1.5 py-0.5 rounded">data → insight → prediction → infrastructure</span>.
            </p>
          </div>
        </section>

        {/* The Doctore Approach — 3 Layers */}
        <section className="border-b border-border/60">
          <div className="container max-w-3xl py-12 sm:py-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-10">
              The Doctore Approach
            </h2>
            <p className="text-muted-foreground mb-10">
              Doctore integrates three layers into a single ecosystem:
            </p>

            <div className="space-y-10">
              {/* Layer 1 */}
              <div className="relative pl-8 border-l-2 border-accent-foreground/30">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-accent-foreground flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-1">
                  Intelligence — BetDoctore
                </h3>
                <p className="text-sm text-muted-foreground mb-3">The intelligence layer of the ecosystem</p>
                <ul className="space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Predictive analytics & AI sports analytics</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Value bet finder & betting ROI calculator</li>
                  <li className="flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Data-driven strategy frameworks</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground italic">
                  Instead of selling picks, BetDoctore teaches users how betting markets actually work.
                </p>
              </div>

              {/* Layer 2 */}
              <div className="relative pl-8 border-l-2 border-accent-foreground/30">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-accent-foreground flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">2</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-1">
                  Infrastructure — Doctore AI
                </h3>
                <p className="text-sm text-muted-foreground mb-3">The technical backbone & sports betting API</p>
                <ul className="space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2"><Code className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Real-time odds intelligence API</li>
                  <li className="flex items-center gap-2"><Brain className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Predictive modeling infrastructure</li>
                  <li className="flex items-center gap-2"><Database className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Enterprise sports data pipelines</li>
                  <li className="flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Sportsbook integration API</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground italic">
                  The goal is to make betting intelligence programmable.
                </p>
              </div>

              {/* Layer 3 */}
              <div className="relative pl-8 border-l-2 border-accent-foreground/30">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-accent-foreground flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">3</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-1">
                  Market Intelligence Engine
                </h3>
                <p className="text-sm text-muted-foreground mb-3">Tracking the betting data economy itself</p>
                <ul className="space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Prediction accuracy tracker & model benchmarking</li>
                  <li className="flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Search market analysis & traffic intelligence</li>
                  <li className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" /> Continuous strategy adaptation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="border-b border-border/60 bg-card">
          <div className="container max-w-3xl py-12 sm:py-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Why This Matters
            </h2>
            <p className="text-muted-foreground mb-8">
              The betting industry is undergoing a structural transformation. Three trends are shaping the future:
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { label: "Data Transparency", text: "Users increasingly demand proof behind predictions." },
                { label: "AI Decision Support", text: "Machine learning models are becoming central to market analysis." },
                { label: "Developer Ecosystems", text: "Sportsbooks and betting tools are moving toward API-driven infrastructure." },
              ].map((trend) => (
                <div key={trend.label} className="p-4 rounded-lg border border-border/60 bg-background">
                  <p className="text-sm font-medium text-accent-foreground mb-2">{trend.label}</p>
                  <p className="text-sm text-muted-foreground">{trend.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-foreground">
              Doctore is designed around all three.
            </p>
          </div>
        </section>

        {/* The Competitive Edge */}
        <section className="border-b border-border/60">
          <div className="container max-w-3xl py-12 sm:py-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-6">
              The Competitive Edge
            </h2>
            <p className="text-muted-foreground mb-8">
              While many competitors focus on a single vertical, Doctore operates across the entire betting intelligence stack.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { layer: "Content Layer", action: "Builds authority and attracts global traffic" },
                { layer: "Analytics Layer", action: "Converts insights into decision-making tools" },
                { layer: "Infrastructure Layer", action: "Enables developers and sportsbooks to integrate intelligence directly" },
              ].map((item) => (
                <div key={item.layer} className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-accent-foreground mt-1 flex-shrink-0" />
                  <p className="text-foreground">
                    <span className="font-medium">{item.layer}</span>{" "}
                    <span className="text-muted-foreground">— {item.action}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-accent/50 border border-accent-foreground/20">
              <p className="text-sm font-mono text-accent-foreground text-center">
                Data → Insight → Tools → Infrastructure → More Data
              </p>
            </div>
          </div>
        </section>

        {/* The Long-Term Vision */}
        <section className="border-b border-border/60 bg-card">
          <div className="container max-w-3xl py-12 sm:py-16">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-6">
              The Long-Term Vision
            </h2>
            <p className="text-foreground mb-6">
              Our goal is not simply to build another betting analytics platform. We aim to become <span className="font-medium text-accent-foreground">the operating system for betting intelligence</span>.
            </p>
            <p className="text-muted-foreground mb-6">A platform where:</p>
            <ul className="space-y-3 text-foreground">
              <li className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground mt-2 flex-shrink-0" />
                Analysts discover inefficiencies in betting markets
              </li>
              <li className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground mt-2 flex-shrink-0" />
                Developers build predictive applications via our sports betting API
              </li>
              <li className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground mt-2 flex-shrink-0" />
                Sportsbooks integrate real-time odds comparison engine data
              </li>
              <li className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground mt-2 flex-shrink-0" />
                Bettors make informed, transparent decisions backed by closing line value tracking
              </li>
            </ul>
          </div>
        </section>

        {/* Closing */}
        <section className="border-b border-border/60">
          <div className="container max-w-3xl py-16 sm:py-20 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-8">
              The Doctore Edge
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              In an industry dominated by affiliate marketing and opaque predictions, Doctore stands for a different model.
            </p>
            <div className="space-y-2 text-lg font-medium text-foreground mb-8">
              <p>Transparency over hype.</p>
              <p>Data over opinion.</p>
              <p>Infrastructure over shortcuts.</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Because in modern betting markets, the true edge is not a single prediction. The true edge is understanding the system behind the odds.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card">
          <div className="container max-w-xl py-12 sm:py-16 text-center">
            <h3 className="font-serif text-xl font-bold text-foreground mb-4">
              Stay informed
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get data-driven betting intelligence delivered to your inbox.
            </p>
            <EmailSubscribeForm />
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/methodology" className="hover:text-foreground transition-colors underline underline-offset-4">
                How it works
              </Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors underline underline-offset-4">
                Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
};

export default Manifesto;