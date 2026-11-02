import { useMonitoringEdges } from "@/hooks/useMonitoringEdges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Clock, Pause } from "lucide-react";

export const MonitoringEdges = () => {
  const { data: edges, isLoading, error } = useMonitoringEdges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Eye className="w-4 h-4 text-muted-foreground" />
            Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  if (!edges || edges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Eye className="w-4 h-4 text-muted-foreground" />
            Monitoring
          </CardTitle>
          <CardDescription>Edges under observation awaiting stability threshold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Pause className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No edges being monitored</p>
            <p className="text-xs mt-2 opacity-70">New opportunities will appear here when detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const newEdges = edges.filter(e => e.status === "new");
  const confirmingEdges = edges.filter(e => e.status === "confirming");

  const formatSpan = (minutes: number | null) => {
    if (!minutes) return "just now";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60 * 10) / 10}h`;
  };

  const getStatusBadge = (status: string, snapshotCount: number) => {
    if (status === "new") {
      return (
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border/60">
          waiting
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border/60">
        {snapshotCount}/3 seen
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Eye className="w-4 h-4 text-muted-foreground" />
          Monitoring
          <Badge variant="outline" className="ml-auto text-xs font-normal text-muted-foreground">
            {newEdges.length} new · {confirmingEdges.length} confirming
          </Badge>
        </CardTitle>
        <CardDescription>Edges awaiting confirmation (need ≥3 over 30+ min)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {edges.map((edge) => (
            <div
              key={edge.id}
              className="p-2.5 sm:p-3 rounded border border-border/40 bg-muted/30"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm text-foreground/80 truncate">
                      {edge.game.away_team} @ {edge.game.home_team}
                    </span>
                    {getStatusBadge(edge.status, edge.snapshot_count)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1 truncate">
                    {edge.market} · {edge.selection}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-mono text-muted-foreground">
                      +{Number(edge.edge_percent).toFixed(1)}%
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] sm:text-xs text-muted-foreground/60 mt-0.5 sm:mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatSpan(edge.confirm_span_minutes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};