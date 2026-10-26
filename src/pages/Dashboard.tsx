import { Helmet } from "react-helmet-async";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StickyFooter } from "@/components/StickyFooter";
import { PipelineControlPanel } from "@/components/PipelineControlPanel";
import { CLVAnalysis } from "@/components/CLVAnalysis";
import { ROIDashboard } from "@/components/ROIDashboard";
import { ActionablePlays } from "@/components/ActionablePlays";
import { MonitoringEdges } from "@/components/MonitoringEdges";
import { SourcePerformance } from "@/components/SourcePerformance";
import { useActionablePlays } from "@/hooks/useActionablePlays";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Dashboard = () => {
  const { data: plays } = useActionablePlays();

  const totalRisk = plays?.reduce((sum, play) => {
    const kelly = play.edge_percent / (play.execution_odds - 1);
    return sum + kelly;
  }, 0) ?? 0;
  const playCount = plays?.length ?? 0;

  return (
    <>
      <Helmet>
        <title>Dashboard — doctore</title>
        <meta
          name="description"
          content="Live analytical dashboard: confirmed edges, CLV signals, ROI tracking and source performance."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://doctore-ai.com/dashboard" />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden bg-background pb-24">
        {/* Ambient background — pure CSS, zero asset cost */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] translate-x-1/4 translate-y-1/4 rounded-full bg-accent/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <DashboardHeader />

        {/* Disclaimer Banner */}
        <div className="bg-muted/60 backdrop-blur-sm border-b border-border/60">
          <div className="container py-2.5">
            <p className="text-[11px] sm:text-xs text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto">
              <span className="font-medium text-foreground/80">Disclaimer:</span> This dashboard displays statistical analysis for informational purposes only.
              No content constitutes betting advice, recommendation, or guarantee of future results.
            </p>
          </div>
        </div>

        <main className="container py-8 sm:py-10 space-y-10 sm:space-y-12 animate-fade-in">
          <section className="animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
            <ErrorBoundary>
              <PipelineControlPanel />
            </ErrorBoundary>
          </section>

          <section className="animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
            <ErrorBoundary>
              <ROIDashboard />
            </ErrorBoundary>
          </section>

          <section
            className="space-y-10 sm:space-y-12 animate-fade-in"
            style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
          >
            <ErrorBoundary>
              <ActionablePlays />
            </ErrorBoundary>

            <ErrorBoundary>
              <MonitoringEdges />
            </ErrorBoundary>
          </section>

          <section
            className="space-y-10 sm:space-y-12 animate-fade-in"
            style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
          >
            <ErrorBoundary>
              <SourcePerformance />
            </ErrorBoundary>

            <ErrorBoundary>
              <CLVAnalysis />
            </ErrorBoundary>
          </section>
        </main>

        <StickyFooter totalRisk={totalRisk} playCount={playCount} />
      </div>
    </>
  );
};

export default Dashboard;