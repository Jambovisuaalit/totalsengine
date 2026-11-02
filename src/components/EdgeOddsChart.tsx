import { useEdgeHistory } from "@/hooks/useEdgeHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Loader2, X, TrendingUp } from "lucide-react";

interface EdgeOddsChartProps {
  edgeId: string;
  title: string;
  onClose: () => void;
}

export const EdgeOddsChart = ({ edgeId, title, onClose }: EdgeOddsChartProps) => {
  const { data: history, isLoading, error } = useEdgeHistory(edgeId);

  const chartData = history?.map((point) => ({
    time: format(new Date(point.captured_at), "HH:mm"),
    fullTime: format(new Date(point.captured_at), "dd.MM HH:mm"),
    fairOdds: Number(point.fair_odds),
    executionOdds: Number(point.execution_odds),
    edgePercent: Number(point.edge_percent),
  }));

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Odds History: {title}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load history</p>
        ) : !chartData || chartData.length < 2 ? (
          <p className="text-sm text-muted-foreground py-4">
            Not enough data points yet. Run the pipeline multiple times to see trends.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    value.toFixed(2),
                    name === 'fairOdds' ? 'Fair Odds' : 
                    name === 'executionOdds' ? 'Execution Odds' : 'Edge %'
                  ]}
                  labelFormatter={(label, payload) => 
                    payload?.[0]?.payload?.fullTime || label
                  }
                />
                <Legend 
                  formatter={(value) => 
                    value === 'fairOdds' ? 'Fair Odds' : 
                    value === 'executionOdds' ? 'Execution Odds' : 'Edge %'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="fairOdds"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="executionOdds"
                  stroke="hsl(var(--status-positive))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--status-positive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};