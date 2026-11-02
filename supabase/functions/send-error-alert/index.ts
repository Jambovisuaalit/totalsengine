import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { JobLogger } from "../_shared/job-logger.ts";
import { withRetry } from "../_shared/retry.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const PERSISTENT_ERROR_THRESHOLD_MINUTES = 10;

interface PipelineHealth {
  job_name: string;
  latest_status: string;
  latest_run_at: string;
  latest_reason: string | null;
  latest_meta: Record<string, unknown> | null;
  last_success_at: string | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for internal functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create unique idempotency key per hour to avoid spamming
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  
  const jobLogger = new JobLogger(supabase, {
    jobName: "send-error-alert",
    idempotencyKey: `error-alert-${hourKey}`,
  });

  try {
    console.log("Checking for persistent job errors...");

    // Check idempotency - only send one alert per hour
    const { exists, existingRun } = await jobLogger.checkIdempotency();
    if (exists) {
      console.log("Error alert already sent this hour, skipping");
      await jobLogger.skipped("Already sent this hour", {
        previous_run_at: existingRun?.finished_at,
      });
      return new Response(
        JSON.stringify({ skipped: true, reason: "Already sent this hour" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pipeline health
    const { data: jobs, error: healthError } = await supabase
      .from("pipeline_health")
      .select("*");

    if (healthError) {
      console.error("Error fetching pipeline health:", healthError);
      throw healthError;
    }

    // Find persistent errors (ERROR status for more than threshold minutes)
    const persistentErrors = (jobs as PipelineHealth[] || []).filter((job) => {
      if (job.latest_status !== "ERROR") return false;
      if (!job.latest_run_at) return false;
      
      const errorTime = new Date(job.latest_run_at);
      const minutesSinceError = (now.getTime() - errorTime.getTime()) / (1000 * 60);
      return minutesSinceError >= PERSISTENT_ERROR_THRESHOLD_MINUTES;
    });

    if (persistentErrors.length === 0) {
      console.log("No persistent errors found");
      await jobLogger.skipped("No persistent errors", { jobs_checked: jobs?.length || 0 });
      return new Response(
        JSON.stringify({ skipped: true, reason: "No persistent errors" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await jobLogger.start();

    console.log(`Found ${persistentErrors.length} persistent errors`);

    // Build email content
    const emailTo = Deno.env.get("SUMMARY_EMAIL_TO")?.split(",").map(e => e.trim()) || [];
    const emailFrom = Deno.env.get("SUMMARY_EMAIL_FROM") || "Doctore AI <onboarding@resend.dev>";

    if (emailTo.length === 0) {
      console.log("No alert recipients configured");
      await jobLogger.success({ 
        skipped: true, 
        reason: "No recipients configured",
        errors_found: persistentErrors.length,
      });
      return new Response(
        JSON.stringify({ skipped: true, reason: "No recipients configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobLabels: Record<string, string> = {
      "run-pipeline": "Pipeline",
      "fetch-odds-api": "Fetch Odds",
      "scrape-espn": "Scrape ESPN",
      "calculate-fair-odds": "Fair Odds",
      "fetch-execution-odds": "Exec Odds",
      "run-decision-engine": "Decision",
      "send-daily-email-summary": "Daily Email",
      "send-pregame-email-summary": "Pregame Email",
    };

    const emailSubject = `⚠️ ALERT: ${persistentErrors.length} Pipeline Job${persistentErrors.length > 1 ? "s" : ""} Failed`;

    let emailBody = `
DOCTORE AI - PIPELINE ERROR ALERT
Generated at: ${now.toISOString()}

================================================================================
PERSISTENT ERRORS DETECTED
================================================================================

The following jobs have been in ERROR state for more than ${PERSISTENT_ERROR_THRESHOLD_MINUTES} minutes:

`;

    persistentErrors.forEach((job, index) => {
      const minutesSinceError = Math.round(
        (now.getTime() - new Date(job.latest_run_at).getTime()) / (1000 * 60)
      );
      const lastSuccess = job.last_success_at 
        ? new Date(job.last_success_at).toISOString()
        : "Never";

      emailBody += `
${index + 1}. ${jobLabels[job.job_name] || job.job_name}
   Status: ERROR (for ${minutesSinceError} minutes)
   Error Time: ${job.latest_run_at}
   Last Success: ${lastSuccess}
   Reason: ${job.latest_reason || "No reason provided"}
`;

      if (job.latest_meta && Object.keys(job.latest_meta).length > 0) {
        emailBody += `   Meta: ${JSON.stringify(job.latest_meta)}
`;
      }
    });

    emailBody += `
================================================================================
ACTION REQUIRED
================================================================================

Please investigate these errors and take appropriate action.
Check the pipeline logs for more details.

================================================================================

This is an automated alert from Doctore AI.
You will not receive another alert for this hour.
`;

    console.log(`Sending error alert to ${emailTo.length} recipients`);

    // Resend API call with retry logic
    const emailResult = await withRetry(
      () => resend.emails.send({
        from: emailFrom,
        to: emailTo,
        subject: emailSubject,
        text: emailBody,
      }),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        onRetry: (attempt, error, delayMs) => {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.log(`[Resend] Retry ${attempt}: ${errorMsg}, waiting ${delayMs}ms`);
        },
      }
    );

    console.log("Error alert email sent:", emailResult);

    await jobLogger.success({
      errors_found: persistentErrors.length,
      jobs_affected: persistentErrors.map(j => j.job_name),
      recipients: emailTo.length,
      email_id: emailResult.data?.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        errors_found: persistentErrors.length,
        jobs_affected: persistentErrors.map(j => j.job_name),
        email_sent_to: emailTo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-error-alert:", error);
    await jobLogger.error(errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});