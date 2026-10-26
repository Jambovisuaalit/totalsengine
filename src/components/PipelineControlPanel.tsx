import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useLatestPipelineRun } from "@/hooks/usePipelineRuns";
import { formatDistanceToNow } from "date-fns";
import { JobHealthStatus } from "./JobHealthStatus";

export function PipelineControlPanel() {
  const { data: latestRun } = useLatestPipelineRun();

  const getStatusMessage = () => {
    if (!latestRun) return { text: "Awaiting initial data sync", type: "neutral" };
    
    if (latestRun.new_edges > 0) {
      return { 
        text: `${latestRun.new_edges} new edges detected, pending confirmation`, 
        type: "action" 
      };
    }
    
    if (latestRun.stable_edges > 0) {
      return { 
        text: `${latestRun.stable_edges} confirmed edges currently active`, 
        type: "success" 
      };
    }
    
    return { text: "No edges detected in latest sync", type: "wait" };
  };

  const status = getStatusMessage();

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-medium">Pipeline</CardTitle>
            <CardDescription className="text-xs">Automated edge detection status</CardDescription>
          </div>
          {latestRun && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status + Stats Combined */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 p-3 rounded-lg flex items-center gap-3 ${
            status.type === "success"
              ? "bg-accent/50 border border-accent-foreground/10"
              : "bg-muted/50 border border-border/60"
          }`}>
            {status.type === "action" ? (
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : status.type === "success" ? (
              <CheckCircle className="w-4 h-4 status-positive flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{status.text}</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 min-w-[72px] text-center border border-border/40">
              <p className="text-[10px] text-muted-foreground">Edges</p>
              <p className="text-lg font-bold tabular-nums">{latestRun?.edges_found ?? "-"}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 min-w-[72px] text-center border border-border/40">
              <p className="text-[10px] text-muted-foreground">New</p>
              <p className="text-lg font-bold tabular-nums text-muted-foreground">{latestRun?.new_edges ?? "-"}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 min-w-[72px] text-center border border-border/40">
              <p className="text-[10px] text-muted-foreground">Stable</p>
              <p className="text-lg font-bold tabular-nums status-positive">{latestRun?.stable_edges ?? "-"}</p>
            </div>
          </div>
        </div>

        <JobHealthStatus />
      </CardContent>
    </Card>
  );
}