import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface JobLogOptions {
  jobName: string;
  pipelineRunId?: string;
  idempotencyKey?: string;
}

export interface JobRun {
  id: string;
  job_name: string;
  pipeline_run_id: string | null;
  status: "STARTED" | "SUCCESS" | "ERROR" | "SKIPPED";
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  reason: string | null;
  meta: Record<string, unknown>;
  idempotency_key: string | null;
}

/**
 * Job Logger for Pipeline Observability
 * 
 * Logs job runs to job_runs table with:
 * - Status tracking (STARTED, SUCCESS, ERROR, SKIPPED)
 * - Duration measurement
 * - Metadata/counts storage
 * - Idempotency key support for deduplication
 */
export class JobLogger {
  private supabase: SupabaseClient;
  private jobName: string;
  private pipelineRunId: string | null;
  private idempotencyKey: string | null;
  private jobId: string | null = null;
  private startTime: number;

  constructor(supabase: SupabaseClient, options: JobLogOptions) {
    this.supabase = supabase;
    this.jobName = options.jobName;
    this.pipelineRunId = options.pipelineRunId || null;
    this.idempotencyKey = options.idempotencyKey || null;
    this.startTime = Date.now();
  }

  /**
   * Check if a job with this idempotency key already succeeded/skipped
   */
  async checkIdempotency(): Promise<{ exists: boolean; existingRun?: JobRun }> {
    if (!this.idempotencyKey) return { exists: false };

    const { data } = await this.supabase
      .from("job_runs")
      .select("*")
      .eq("idempotency_key", this.idempotencyKey)
      .in("status", ["SUCCESS", "SKIPPED"])
      .limit(1)
      .maybeSingle();

    return { exists: !!data, existingRun: data || undefined };
  }

  /**
   * Log job start
   */
  async start(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("job_runs")
      .insert({
        job_name: this.jobName,
        pipeline_run_id: this.pipelineRunId,
        status: "STARTED",
        idempotency_key: this.idempotencyKey,
        meta: {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to log job start:", error);
      return null;
    }

    this.jobId = data.id;
    return this.jobId;
  }

  /**
   * Log job success with metadata
   */
  async success(meta: Record<string, unknown> = {}): Promise<void> {
    if (!this.jobId) return;

    const durationMs = Date.now() - this.startTime;

    const { error } = await this.supabase
      .from("job_runs")
      .update({
        status: "SUCCESS",
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        meta,
      })
      .eq("id", this.jobId);

    if (error) {
      console.error("Failed to log job success:", error);
    }
  }

  /**
   * Log job error with reason
   */
  async error(reason: string, meta: Record<string, unknown> = {}): Promise<void> {
    if (!this.jobId) return;

    const durationMs = Date.now() - this.startTime;

    const { error } = await this.supabase
      .from("job_runs")
      .update({
        status: "ERROR",
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        reason,
        meta,
      })
      .eq("id", this.jobId);

    if (error) {
      console.error("Failed to log job error:", error);
    }
  }

  /**
   * Log job skipped with reason (no start required)
   */
  async skipped(reason: string, meta: Record<string, unknown> = {}): Promise<void> {
    const durationMs = Date.now() - this.startTime;

    const { error } = await this.supabase
      .from("job_runs")
      .insert({
        job_name: this.jobName,
        pipeline_run_id: this.pipelineRunId,
        status: "SKIPPED",
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        reason,
        meta,
        idempotency_key: this.idempotencyKey,
      });

    if (error) {
      console.error("Failed to log job skip:", error);
    }
  }
}