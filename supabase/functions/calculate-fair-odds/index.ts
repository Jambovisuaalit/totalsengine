import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, FairOddsInputSchema, validationErrorResponse } from "../_shared/validation.ts";

/**
 * Fair Odds Engine
 * 
 * Removes the margin (vig) from Pinnacle odds to calculate true probabilities.
 * Pinnacle is considered a sharp book with ~2-3% margin.
 * 
 * Method: Multiplicative margin removal
 * 1. Convert odds to implied probabilities
 * 2. Sum probabilities to get overround (e.g., 1.03 = 3% margin)
 * 3. Divide each probability by overround to get true probabilities
 * 4. Convert back to fair odds
 */

interface OddsGroup {
  game_id: string;
  market: string;
  odds: { selection: string; odds: number }[];
}

function impliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

function decimalOdds(probability: number): number {
  return 1 / probability;
}

function removeMutiplicativeMargin(oddsArray: number[]): { fairOdds: number[]; marginRemoved: number } {
  const impliedProbs = oddsArray.map(impliedProbability);
  const overround = impliedProbs.reduce((sum, p) => sum + p, 0);
  const marginRemoved = (overround - 1) * 100;
  
  const trueProbs = impliedProbs.map(p => p / overround);
  const fairOdds = trueProbs.map(decimalOdds);
  
  return { fairOdds, marginRemoved };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
  const { data: input, error: validationError } = await parseAndValidate(req, FairOddsInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { pipelineRunId } = input;

  const jobLogger = new JobLogger(supabase, { 
    jobName: "calculate-fair-odds",
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    // Get all Pinnacle odds grouped by game and market
    const { data: pinnacleOdds, error: fetchError } = await supabase
      .from("pinnacle_odds")
      .select("*")
      .order("game_id")
      .order("market");

    if (fetchError) {
      console.error("Error fetching Pinnacle odds:", fetchError);
      await jobLogger.error("Failed to fetch Pinnacle odds");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch Pinnacle odds" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pinnacleOdds?.length) {
      await jobLogger.success({ 
        message: "No Pinnacle odds to process", 
        pinnacle_odds_processed: 0,
        fair_odds_calculated: 0 
      });
      return new Response(
        JSON.stringify({ success: true, message: "No Pinnacle odds to process", fair_odds_calculated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group odds by game_id + market
    const oddsGroups: Map<string, OddsGroup> = new Map();

    for (const odds of pinnacleOdds) {
      const key = `${odds.game_id}-${odds.market}`;
      
      if (!oddsGroups.has(key)) {
        oddsGroups.set(key, {
          game_id: odds.game_id,
          market: odds.market,
          odds: [],
        });
      }
      
      oddsGroups.get(key)!.odds.push({
        selection: odds.selection,
        odds: parseFloat(String(odds.odds)),
      });
    }

    console.log(`Processing ${oddsGroups.size} odds groups`);

    let calculated = 0;

    for (const [, group] of oddsGroups) {
      if (group.odds.length < 2) continue;

      const oddsArray = group.odds.map(o => o.odds);
      const { fairOdds, marginRemoved } = removeMutiplicativeMargin(oddsArray);

      for (let i = 0; i < group.odds.length; i++) {
        const { error } = await supabase
          .from("fair_odds")
          .upsert(
            {
              game_id: group.game_id,
              market: group.market,
              selection: group.odds[i].selection,
              fair_odds: fairOdds[i],
              margin_removed: marginRemoved,
              calculated_at: new Date().toISOString(),
            },
            { onConflict: "game_id,market,selection" }
          );

        if (error) {
          console.error("Error storing fair odds:", error);
        } else {
          calculated++;
        }
      }
    }

    await jobLogger.success({
      pinnacle_odds_processed: pinnacleOdds.length,
      odds_groups: oddsGroups.size,
      fair_odds_calculated: calculated,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pinnacle_odds_processed: pinnacleOdds.length,
        fair_odds_calculated: calculated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Fair odds engine error:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});