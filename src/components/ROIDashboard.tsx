import { Link } from "react-router-dom";
import { useROISummary } from "@/hooks/useROISummary";
import { useCLVAnalysis } from "@/hooks/useCLVAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Target, Coins, TrendingUp, Percent, ArrowRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ROIDashboard = () => {
  const { data, isLoading, error } = useROISummary();
  const { data: clvData } = useCLVAnalysis();

  // Calculate live CLV stats
  const clvStats = clvData && clvData.length > 0
    ? {
        count: clvData.length,
        avgClv: clvData.reduce((sum, d) => sum + Number(d.clv_percent), 0) / clvData.length,
        positiveRate: (clvData.filter(d => Number(d.clv_percent) > 0).length / clvData.length) * 100,
      }
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">Failed to load ROI data</p>
      </Card>
    );
  }

  const hasBets = (data?.total_bets ?? 0) > 0;

  const stats = hasBets
    ? [
        {
          label: "Total Bets",
          value: data?.total_bets ?? 0,
          icon: Target,
          format: (v: number) => v.toString(),
        },
        {
          label: "Units Staked",
          value: data?.units_staked ?? 0,
          icon: Coins,
          format: (v: number) => v.toFixed(2),
        },
        {
          label: "Units Profit",
          value: data?.units_profit ?? 0,
          icon: TrendingUp,
          format: (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2),
          colorize: true,
        },
        {
          label: "ROI",
          value: data?.roi_percent ?? 0,
          icon: Percent,
          format: (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%",
          colorize: true,
        },
      ]
    : [];

  // CLV-based stats when no bets yet
  const clvCards = clvStats
    ? [
        {
          label: "CLV Samples",
          value: clvStats.count,
          icon: BarChart3,
          format: (v: number) => v.toString(),
        },
        {
          label: "Avg CLV",
          value: clvStats.avgClv,
          icon: TrendingUp,
          format: (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%",
          colorize: true,
        },
        {
          label: "CLV Hit Rate",
          value: clvStats.positiveRate,
          icon: Target,
          format: (v: number) => v.toFixed(1) + "%",
        },
      ]
    : [];

  const displayStats = hasBets ? stats : clvCards;

  return (
    <div className="space-y-4">
      {!hasBets && clvStats && (
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Edge Quality Metrics</h3>
          <span className="text-xs text-muted-foreground">· CLV-based tracking</span>
        </div>
      )}
      {hasBets && (
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Performance</h3>
        </div>
      )}
      
      {displayStats.length > 0 ? (
        <div className={cn(
          "grid gap-3",
          displayStats.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
        )}>
          {displayStats.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="p-4 sm:p-5 transition-all duration-200 hover:border-border hover:shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <stat.icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{stat.label}</span>
                </div>
                <p
                  className={cn(
                    "text-2xl sm:text-3xl font-bold tabular-nums tracking-tight",
                    stat.colorize && stat.value > 0 && "status-positive",
                    stat.colorize && stat.value < 0 && "status-negative"
                  )}
                >
                  {stat.format(Number(stat.value))}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            No performance data yet. Edges will be tracked once the pipeline generates CLV data.
          </p>
        </Card>
      )}

      {hasBets && clvStats && (
        <div className="grid grid-cols-3 gap-3">
          {clvCards.map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg border border-border/60 bg-muted/30">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <stat.icon className="h-3 w-3" />
                <span className="text-[10px] font-medium">{stat.label}</span>
              </div>
              <p className={cn(
                "text-sm font-bold tabular-nums",
                stat.colorize && stat.value > 0 && "status-positive",
                stat.colorize && stat.value < 0 && "status-negative"
              )}>
                {stat.format(Number(stat.value))}
              </p>
            </div>
          ))}
        </div>
      )}

      <Link 
        to="/performance" 
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        View full performance history
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
};