import { usePipelineHealth, PipelineHealth } from "@/hooks/usePipelineHealth";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, SkipForward, AlertTriangle, Database, Ban } from "lucide-react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const PERSISTENT_ERROR_THRESHOLD_MINUTES = 10;

const JOB_LABELS: Record<string, string> = {
  "run-pipeline": "Pipeline",
  "fetch-odds-api": "Fetch Odds",
  "fetch-cloudbet-odds": "Cloudbet",
  "scrape-espn": "Scrape ESPN",
  "scrape-espn-injuries": "Injuries",
  "calculate-fair-odds": "Fair Odds",
  "fetch-execution-odds": "Exec Odds",
  "run-decision-engine": "Decision",
  "send-daily-email-summary": "Daily Email",
  "send-pregame-email-summary": "Pregame Email",
  "send-error-alert": "Error Alert",
};


const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="w-3 h-3 status-positive" />;
    case "ERROR":
      return <XCircle className="w-3 h-3 text-destructive" />;
    case "SKIPPED":
      return <SkipForward className="w-3 h-3 text-muted-foreground" />;
    default:
      return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />;
  }
};

const getErrorType = (job: PipelineHealth): { icon: React.ReactNode; label: string } | null => {
  const reason = job.latest_reason?.toLowerCase() || "";
  const meta = job.latest_meta as Record<string, unknown> | null;

  if (reason.includes("idempotency") || reason.includes("already")) {
    return { icon: <Ban className="w-3 h-3" />, label: "Idempotency" };
  }
  if (reason.includes("quota") || reason.includes("rate limit") || reason.includes("429")) {
    return { icon: <AlertTriangle className="w-3 h-3" />, label: "API Quota" };
  }
  if (meta?.edges_found === 0 || meta?.gamesCount === 0 || reason.includes("no games") || reason.includes("0 edges")) {
    return { icon: <Database className="w-3 h-3" />, label: "No Data" };
  }
  if (job.latest_status === "ERROR") {
    return { icon: <XCircle className="w-3 h-3" />, label: "Error" };
  }
  return null;
};

const JobDetails = ({ job }: { job: PipelineHealth }) => {
  const meta = job.latest_meta as Record<string, unknown> | null;
  const errorType = getErrorType(job);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">{JOB_LABELS[job.job_name] ?? job.job_name}</span>
        <Badge 
          variant={job.latest_status === "SUCCESS" ? "default" : job.latest_status === "ERROR" ? "destructive" : "secondary"}
          className="text-[10px] px-1.5 py-0"
        >
          {job.latest_status}
        </Badge>
      </div>

      {errorType && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {errorType.icon}
          <span>{errorType.label}</span>
        </div>
      )}

      {job.latest_reason && (
        <div className="p-2 rounded bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground font-mono break-words">
            {job.latest_reason}
          </p>
        </div>
      )}

      {meta && Object.keys(meta).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Meta:</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            {Object.entries(meta).slice(0, 6).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-1">
                <span className="text-muted-foreground truncate">{key}:</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {job.last_success_at && job.latest_status !== "SUCCESS" && (
        <p className="text-[10px] text-muted-foreground">
          Last success: {formatDistanceToNow(new Date(job.last_success_at), { addSuffix: true })}
        </p>
      )}
    </div>
  );
};

export function JobHealthStatus() {
  const { data: jobs, isLoading } = usePipelineHealth();

  if (isLoading || !jobs?.length) {
    return null;
  }

  const persistentErrors = jobs.filter((job) => {
    if (job.latest_status !== "ERROR") return false;
    if (!job.latest_run_at) return false;
    const minutesSinceError = differenceInMinutes(new Date(), new Date(job.latest_run_at));
    return minutesSinceError >= PERSISTENT_ERROR_THRESHOLD_MINUTES;
  });

  return (
    <div className="space-y-3">
      {persistentErrors.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Pipeline Alert</AlertTitle>
          <AlertDescription className="text-xs">
            {persistentErrors.length === 1 ? (
              <>
                <strong>{JOB_LABELS[persistentErrors[0].job_name] ?? persistentErrors[0].job_name}</strong> has been in ERROR state for{" "}
                {formatDistanceToNow(new Date(persistentErrors[0].latest_run_at!))}
              </>
            ) : (
              <>
                {persistentErrors.length} jobs have persistent errors:{" "}
                {persistentErrors.map((j) => JOB_LABELS[j.job_name] ?? j.job_name).join(", ")}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Job Health</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {jobs.map((job) => (
          <HoverCard key={job.job_name} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border cursor-default hover:border-primary/50 transition-colors">
                <StatusIcon status={job.latest_status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {JOB_LABELS[job.job_name] ?? job.job_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {job.latest_run_at
                      ? formatDistanceToNow(new Date(job.latest_run_at), { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
                {job.latest_duration_ms && (
                  <span className="text-[10px] text-muted-foreground">
                    {(job.latest_duration_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72" side="bottom" align="start">
              <JobDetails job={job} />
            </HoverCardContent>
          </HoverCard>
        ))}
        </div>
      </div>
    </div>
  );
}