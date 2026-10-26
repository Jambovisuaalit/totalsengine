import { useCLVAnalysis } from "@/hooks/useCLVAnalysis";
import { useROISummary } from "@/hooks/useROISummary";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";

export const LiveCLVProof = () => {
  const { data: clvData, isLoading: clvLoading } = useCLVAnalysis();
  const { data: roi, isLoading: roiLoading } = useROISummary();

  const isLoading = clvLoading || roiLoading;

  // Prepare chart data: show last 30 CLV entries as a running series
  const chartData = (clvData ?? [])
    .slice()
    .reverse()
    .slice(-30)
    .map((d, i) => ({
      index: i + 1,
      clv: Number((d.clv_percent * 100).toFixed(2)),
      label: `${d.selection}`,
    }));

  const positiveCLV = (clvData ?? []).filter((d) => d.clv_percent > 0).length;
  const totalCLV = (clvData ?? []).length;
  const hitRate = totalCLV > 0 ? ((positiveCLV / totalCLV) * 100).toFixed(0) : "—";
  const avgCLV =
    totalCLV > 0
      ? (
          ((clvData ?? []).reduce((s, d) => s + d.clv_percent, 0) / totalCLV) *
          100
        ).toFixed(2)
      : "—";

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container max-w-4xl">
          <Skeleton className="h-64 w-full rounded" />
        </div>
      </section>
    );
  }

  // Don't render if no data
  if (totalCLV === 0) return null;

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28">
      <div className="container max-w-4xl">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-foreground mb-2 sm:mb-3">
            Real-time edge validation
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Every edge is tracked against the closing line. Live data — not backtests.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Avg CLV"
            value={`${Number(avgCLV) > 0 ? "+" : ""}${avgCLV}%`}
            positive={Number(avgCLV) > 0}
          />
          <StatCard
            icon={<Activity className="h-3.5 w-3.5" />}
            label="+CLV hit rate"
            value={`${hitRate}%`}
            positive={Number(hitRate) > 50}
          />
          <StatCard
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label="Edges tracked"
            value={String(totalCLV)}
          />
        </div>

        {/* Chart */}
        <div className="rounded border border-border/60 bg-card/30 p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 mb-3 font-mono">
            CLV % per edge — last {chartData.length} entries
          </p>
          <div className="h-40 sm:h-52 md:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="clvGradientPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--status-positive))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--status-positive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="index"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "CLV"]}
                  labelFormatter={(label) => `Edge #${label}`}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="clv"
                  stroke="hsl(var(--status-positive))"
                  strokeWidth={1.5}
                  fill="url(#clvGradientPos)"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--status-positive))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-2 text-right font-mono">
            Live from database · updated each pipeline run
          </p>
        </div>

        {/* ROI summary if available */}
        {roi && (
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[10px] sm:text-xs text-muted-foreground/60 font-mono">
            <span>{roi.total_bets} settled bets</span>
            <span className="hidden sm:inline">·</span>
            <span>{roi.units_profit?.toFixed(2)}u profit</span>
            <span className="hidden sm:inline">·</span>
            <span>{roi.roi_percent?.toFixed(1)}% ROI</span>
          </div>
        )}
      </div>
    </section>
  );
};

function StatCard({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded border border-border/60 bg-card/30 p-3 sm:p-4 text-center transition-colors hover:border-border hover:bg-card/50">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60 mb-1.5">
        {icon}
        <span className="text-[10px] sm:text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={`text-base sm:text-lg md:text-xl font-semibold font-mono ${
          positive === true
            ? "status-positive"
            : positive === false
            ? "status-negative"
            : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}