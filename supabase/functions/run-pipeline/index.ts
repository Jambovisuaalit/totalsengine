import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, PipelineInputSchema, validationErrorResponse } from "../_shared/validation.ts";

/**
 * Pipeline Orchestrator
 * 
 * Runs the full data pipeline in sequence:
 * 1. Scrape ESPN for games
 * 2. Fetch sharp odds from Betfair Exchange (FREE - no quota)
 * 3. Fetch execution odds from soft bookmakers
 * 4. Calculate fair odds
 * 5. Run decision engine
 * 6. Scrape ESPN injuries (once per 6 hours)
 */

const INJURY_FETCH_INTERVAL_HOURS = 6;

async function callFunction(baseUrl: string, functionName: string, body: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "x-api-key": Deno.env.get("ADMIN_API_KEY") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { success: response.ok && data.success !== false, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
  const { data: input, error: validationError } = await parseAndValidate(req, PipelineInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create pipeline run first to get correlation ID
  const { data: pipelineRun } = await supabase
    .from("pipeline_runs")
    .insert({ started_at: new Date().toISOString() })
    .select("id")
    .single();

  const pipelineRunId = pipelineRun?.id;
  const jobLogger = new JobLogger(supabase, { 
    jobName: "run-pipeline", 
    pipelineRunId 
  });

  try {
    await jobLogger.start();
    const { league, force } = input;
    
    const results: Record<string, unknown> = {};
    const now = new Date();

    console.log("Starting pipeline for league:", league);

    // Step 1: ESPN (no rate limit needed)
    console.log("Step 1: Scraping ESPN...");
    results.espn = await callFunction(supabaseUrl, "scrape-espn", { league, pipelineRunId });
    
    // Step 2: Fetch sharp odds from Betfair Exchange (FREE - no quota cost)
    console.log("Step 2: Fetching Betfair Exchange odds...");
    results.betfair_sharp = await callFunction(supabaseUrl, "fetch-betfair-odds", { league, pipelineRunId });
    
    // Step 3: Execution odds from soft bookmakers (via The Odds API)
    console.log("Step 3: Fetching execution odds...");
    results.execution_odds = await callFunction(supabaseUrl, "fetch-execution-odds", { league, pipelineRunId });

    // Step 3b: Cloudbet odds (FREE - no quota cost, no rate limit needed)
    console.log("Step 3b: Fetching Cloudbet odds...");
    results.cloudbet = await callFunction(supabaseUrl, "fetch-cloudbet-odds", { league, pipelineRunId });
    
    // Step 4: Calculate fair odds
    console.log("Step 4: Calculating fair odds...");
    results.fair_odds = await callFunction(supabaseUrl, "calculate-fair-odds", { pipelineRunId });
    
    // Step 5: Run decision engine
    console.log("Step 5: Running decision engine...");
    results.decisions = await callFunction(supabaseUrl, "run-decision-engine", { min_edge: 3.5, pipelineRunId });

    // Step 6: Scrape injuries (rate limited to once per 6 hours)
    const { data: lastInjuryFetch } = await supabase
      .from("api_fetch_log")
      .select("fetched_at")
      .eq("source", "espn_injuries")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const lastInjuryTime = lastInjuryFetch ? new Date(lastInjuryFetch.fetched_at) : null;
    const hoursSinceInjuryFetch = lastInjuryTime 
      ? (now.getTime() - lastInjuryTime.getTime()) / (1000 * 60 * 60)
      : Infinity;
    
    const canFetchInjuries = force || hoursSinceInjuryFetch >= INJURY_FETCH_INTERVAL_HOURS;
    
    if (!canFetchInjuries) {
      console.log(`RATE LIMIT: Skipping injury scrape (last fetch ${Math.round(hoursSinceInjuryFetch)} hours ago)`);
      results.injuries = { 
        success: true, 
        skipped: true, 
        reason: `Rate limited: ${Math.round(hoursSinceInjuryFetch)} hours since last fetch` 
      };
    } else {
      await supabase.from("api_fetch_log").insert({
        source: "espn_injuries",
        reason: force ? "forced" : `${Math.round(hoursSinceInjuryFetch)} hours since last fetch`,
      });
      
      console.log("Step 6: Scraping ESPN injuries...");
      results.injuries = await callFunction(supabaseUrl, "scrape-espn-injuries", { 
        pipelineRunId 
      });
    }

    const allSuccessful = Object.values(results).every((r: unknown) => (r as { success?: boolean })?.success);

    // Update pipeline run with completion
    await supabase
      .from("pipeline_runs")
      .update({ completed_at: now.toISOString() })
      .eq("id", pipelineRunId);

    await jobLogger.success({
      league,
      steps_completed: Object.keys(results).length,
      all_successful: allSuccessful,
      injuries_fetched: canFetchInjuries && !(results.injuries as { skipped?: boolean })?.skipped,
    });

    return new Response(
      JSON.stringify({
        success: allSuccessful,
        pipeline_run_id: pipelineRunId,
        pipeline_results: results,
        completed_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pipeline error:", error);
    await jobLogger.error(error instanceof Error ? error.message : "Unknown error");
    
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});