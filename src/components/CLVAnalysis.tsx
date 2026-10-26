import { useState } from "react";
import { useCLVAnalysis } from "@/hooks/useCLVAnalysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EdgeOddsChart } from "./EdgeOddsChart";

export const CLVAnalysis = () => {
  const { data: clvData, isLoading, error } = useCLVAnalysis();
  const [selectedEdge, setSelectedEdge] = useState<{
    id: string;
    title: string;
  } | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            CLV Analysis
          </CardTitle>
          <CardDescription>
            CLV measures whether the bet beat the closing market price.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            CLV Analysis
          </CardTitle>
          <CardDescription>
            CLV measures whether the bet beat the closing market price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load CLV data</p>
        </CardContent>
      </Card>
    );
  }

  if (!clvData || clvData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            CLV Analysis
          </CardTitle>
          <CardDescription>
            CLV measures whether the bet beat the closing market price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No CLV data available yet. Run the pipeline multiple times to generate history.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleRowClick = (row: typeof clvData[0]) => {
    const title = `${row.home_team} vs ${row.away_team} - ${row.selection}`;
    if (selectedEdge?.id === row.edge_id) {
      setSelectedEdge(null);
    } else {
      setSelectedEdge({ id: row.edge_id, title });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          CLV Analysis
        </CardTitle>
        <CardDescription>
          CLV measures whether the bet beat the closing market price. Click a row to see odds history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {clvData.map((row) => (
            <Card
              key={row.edge_id}
              className={cn(
                "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                selectedEdge?.id === row.edge_id && "ring-2 ring-primary"
              )}
              onClick={() => handleRowClick(row)}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm flex items-center gap-1">
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        selectedEdge?.id === row.edge_id && "rotate-90"
                      )}
                    />
                    {row.home_team} vs {row.away_team}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      row.clv_percent > 0 && "status-positive",
                      row.clv_percent < 0 && "status-negative"
                    )}
                  >
                    {row.clv_percent > 0 ? "+" : ""}
                    {Number(row.clv_percent).toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Market:</span> {row.market}
                  </div>
                  <div>
                    <span className="font-medium">Selection:</span> {row.selection}
                  </div>
                  <div>
                    <span className="font-medium">Book:</span> {row.bookmaker}
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t">
                  <span>
                    <span className="text-muted-foreground">@ Bet:</span>{" "}
                    <span className="tabular-nums">{Number(row.fair_odds_at_bet).toFixed(2)}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">@ Close:</span>{" "}
                    <span className="tabular-nums">{Number(row.fair_odds_at_close).toFixed(2)}</span>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Selection</TableHead>
                <TableHead>Bookmaker</TableHead>
                <TableHead className="text-right">@ Bet</TableHead>
                <TableHead className="text-right">@ Close</TableHead>
                <TableHead className="text-right">CLV %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clvData.map((row) => (
                <TableRow
                  key={row.edge_id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedEdge?.id === row.edge_id && "bg-muted"
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        selectedEdge?.id === row.edge_id && "rotate-90"
                      )}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.home_team} vs {row.away_team}
                  </TableCell>
                  <TableCell>{row.market}</TableCell>
                  <TableCell>{row.selection}</TableCell>
                  <TableCell>{row.bookmaker}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(row.fair_odds_at_bet).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(row.fair_odds_at_close).toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      row.clv_percent > 0 && "status-positive",
                      row.clv_percent < 0 && "status-negative"
                    )}
                  >
                    {row.clv_percent > 0 ? "+" : ""}
                    {Number(row.clv_percent).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Odds History Chart */}
        {selectedEdge && (
          <EdgeOddsChart
            edgeId={selectedEdge.id}
            title={selectedEdge.title}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};