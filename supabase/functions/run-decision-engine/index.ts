import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, DecisionEngineInputSchema, validationErrorResponse } from "../_shared/validation.ts";

/**
 * Decision Engine v2: Fewer But Better Bets
 *
 * Philosophy: Only bet when the edge is real, persistent, and actionable.
 * 
 * Lifecycle states:
 * - new: seen 1 time
 * - confirming: seen ≥2 times but span < 30 min
 * - stable: seen ≥3 times AND span ≥ 30 min AND trend_last2 ≥ -0.3
 * - decaying: trend_last2 < -0.3 OR edge falls below threshold
 * - dead: no longer found or game started
 *
 * Only "stable" edges with is_actionable=true should be bet.
 * 
 * Time-based trust: Edge must be stable for ≥2 consecutive runs
 * before is_actionable becomes true (kills flash spikes/glitches)
 * 
 * Stake sizing: Fractional Kelly (25%) capped at 2% bankroll
 */

// Thresholds (LOCKED - do not change without data)
const MIN_CONSECUTIVE_STABLE_RUNS = 2;
const BASE_MIN_EDGE = 3.5;
const MIN_CONFIRMATIONS_FOR_STABLE = 3;
const MIN_SPAN_MINUTES_FOR_STABLE = 30;
const TREND_NOISE_BAND = -0.3;
const MIN_ODDS = 1.6;
const MAX_ODDS = 3.5;
const KELLY_FRACTION = 0.25;
const MAX_STAKE_FRACTION = 0.02;
const MAX_TOTAL_EXPOSURE = 0.05; // 5% total bankroll exposure cap

interface EdgeHistory {
  edge_percent: number;
  captured_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
  const { data: input, error: validationError } = await parseAndValidate(req, DecisionEngineInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const min_edge = input.min_edge!;
  const pipelineRunId = input.pipelineRunId;

  const jobLogger = new JobLogger(supabase, { 
    jobName: "run-decision-engine",
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    // Get blacklisted sources
    const { data: blacklist } = await supabase
      .from("source_blacklist")
      .select("bookmaker, market");

    const blacklistSet = new Set(
      (blacklist || []).map((b) => `${b.bookmaker}-${b.market || "*"}`)
    );

    const isBlacklisted = (bookmaker: string, market: string) => {
      return blacklistSet.has(`${bookmaker}-${market}`) || blacklistSet.has(`${bookmaker}-*`);
    };

    // Get all current edges before update
    const { data: existingEdges } = await supabase
      .from("edges")
      .select("id, game_id, market, selection, bookmaker, edge_percent, snapshot_count, status, first_seen_at, last_seen_at, consecutive_stable_runs");

    const existingEdgeMap = new Map<string, Record<string, unknown>>();
    const existingEdgeIds: string[] = [];
    for (const edge of existingEdges || []) {
      const key = `${edge.game_id}-${edge.market}-${edge.selection}-${edge.bookmaker}`;
      existingEdgeMap.set(key, edge);
      existingEdgeIds.push(edge.id);
    }

    // BATCH: Fetch all edge history for existing edges in one query
    const edgeHistoryMap = new Map<string, EdgeHistory[]>();
    if (existingEdgeIds.length > 0) {
      const { data: allHistory } = await supabase
        .from("edge_history")
        .select("edge_id, edge_percent, captured_at")
        .in("edge_id", existingEdgeIds)
        .order("captured_at", { ascending: false });
      
      for (const h of allHistory || []) {
        const edgeId = h.edge_id as string;
        if (!edgeHistoryMap.has(edgeId)) {
          edgeHistoryMap.set(edgeId, []);
        }
        const arr = edgeHistoryMap.get(edgeId)!;
        if (arr.length < 5) {
          arr.push({ edge_percent: h.edge_percent, captured_at: h.captured_at });
        }
      }
    }

    // BATCH: Fetch all games for game start time checks
    const { data: allGames } = await supabase
      .from("games")
      .select("id, start_time");
    
    const gameStartTimeMap = new Map<string, Date>();
    for (const g of allGames || []) {
      gameStartTimeMap.set(g.id, new Date(g.start_time));
    }

    // Get all fair odds (derived from Pinnacle)
    const { data: fairOddsData, error: fairError } = await supabase
      .from("fair_odds")
      .select("game_id, market, selection, fair_odds");

    if (fairError) {
      console.error("Error fetching fair odds:", fairError);
      throw new Error("Failed to fetch fair odds");
    }

    // Get all execution odds (soft bookmakers)
    const { data: executionData, error: execError } = await supabase
      .from("execution_odds")
      .select("game_id, market, selection, odds, bookmaker");

    if (execError) {
      console.error("Error fetching execution odds:", execError);
      throw new Error("Failed to fetch execution odds");
    }

    if (!fairOddsData?.length || !executionData?.length) {
      await jobLogger.success({
        message: "No odds data to compare",
        fair_odds_count: fairOddsData?.length || 0,
        execution_odds_count: executionData?.length || 0,
        edges_found: 0,
      });
      return new Response(
        JSON.stringify({
          success: true,
          message: "No odds data to compare",
          edges_found: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create lookup map for fair odds
    const fairOddsMap = new Map<string, number>();
    for (const fo of fairOddsData) {
      const key = `${fo.game_id}-${fo.market}-${fo.selection}`;
      fairOddsMap.set(key, parseFloat(String(fo.fair_odds)));
    }

    const normalizeSelection = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const foundEdgeKeys = new Set<string>();
    const now = new Date();
    let edgesFound = 0;
    let edgesStored = 0;
    let historyStored = 0;
    let newEdges = 0;
    let confirmingEdges = 0;
    let stableEdges = 0;
    let actionableCount = 0;

    interface ActionableEdgeData {
      edgeKey: string;
      edgeId: string;
      stakeFraction: number;
      gameId: string;
    }
    const actionableEdges: ActionableEdgeData[] = [];

    for (const exec of executionData) {
      const execOdds = parseFloat(String(exec.odds));

      if (execOdds < MIN_ODDS || execOdds > MAX_ODDS) continue;
      if (isBlacklisted(exec.bookmaker, exec.market)) continue;

      let key = `${exec.game_id}-${exec.market}-${exec.selection}`;
      let fairOdds = fairOddsMap.get(key);

      if (!fairOdds) {
        const normalizedExec = normalizeSelection(exec.selection);
        for (const fo of fairOddsData) {
          if (fo.game_id === exec.game_id && fo.market === exec.market) {
            const normalizedFair = normalizeSelection(fo.selection);
            const execLast = normalizedExec.split(/\s+/).pop();
            const fairLast = normalizedFair.split(/\s+/).pop();
            if (execLast === fairLast || normalizedExec.includes(fairLast!) || normalizedFair.includes(execLast!)) {
              fairOdds = parseFloat(String(fo.fair_odds));
              break;
            }
          }
        }
      }

      if (!fairOdds) continue;

      const edgePercent = ((execOdds / fairOdds) - 1) * 100;

      if (edgePercent >= min_edge) {
        edgesFound++;
        const edgeKey = `${exec.game_id}-${exec.market}-${exec.selection}-${exec.bookmaker}`;
        foundEdgeKeys.add(edgeKey);

        const existingEdge = existingEdgeMap.get(edgeKey);
        const roundedEdge = Math.round(edgePercent * 100) / 100;

        const firstSeenAt = (existingEdge?.first_seen_at as string) || now.toISOString();
        const snapshotCount = ((existingEdge?.snapshot_count as number) || 0) + 1;
        
        let trendLast2: number | null = null;
        let avgEdge = roundedEdge;
        
        if (existingEdge) {
          const history = edgeHistoryMap.get(existingEdge.id as string) || [];
          
          if (history.length > 0) {
            avgEdge = history.reduce((sum, h) => sum + parseFloat(String(h.edge_percent)), roundedEdge) / (history.length + 1);
            trendLast2 = roundedEdge - parseFloat(String(history[0].edge_percent));
          }
        }

        const firstSeenDate = new Date(firstSeenAt);
        const spanMinutes = (now.getTime() - firstSeenDate.getTime()) / (1000 * 60);

        let status = "new";
        let isActionable = false;
        let stakeFraction = 0;
        let consecutiveStableRuns = 0;
        const prevConsecutiveStable = (existingEdge?.consecutive_stable_runs as number) || 0;
        const wasStable = existingEdge?.status === "stable";

        if (snapshotCount === 1) {
          status = "new";
          newEdges++;
        } else if (snapshotCount >= MIN_CONFIRMATIONS_FOR_STABLE && spanMinutes >= MIN_SPAN_MINUTES_FOR_STABLE) {
          if (trendLast2 === null || trendLast2 >= TREND_NOISE_BAND) {
            status = "stable";
            stableEdges++;
            
            consecutiveStableRuns = wasStable ? prevConsecutiveStable + 1 : 1;
            
            if (consecutiveStableRuns >= MIN_CONSECUTIVE_STABLE_RUNS) {
              const impliedProb = 1 / fairOdds;
              const kelly = (impliedProb * execOdds - 1) / (execOdds - 1);
              stakeFraction = Math.max(0, Math.min(kelly * KELLY_FRACTION, MAX_STAKE_FRACTION));
              
              isActionable = stakeFraction > 0;
              if (isActionable) actionableCount++;
            }
          } else {
            status = "decaying";
            consecutiveStableRuns = 0;
          }
        } else if (snapshotCount >= 2) {
          if (trendLast2 !== null && trendLast2 < TREND_NOISE_BAND) {
            status = "decaying";
          } else {
            status = "confirming";
            confirmingEdges++;
          }
        }

        const edgeData = {
          game_id: exec.game_id,
          market: exec.market,
          selection: exec.selection,
          fair_odds: fairOdds,
          execution_odds: execOdds,
          bookmaker: exec.bookmaker,
          edge_percent: roundedEdge,
          status,
          snapshot_count: snapshotCount,
          edge_trend: trendLast2,
          first_seen_at: firstSeenAt,
          last_seen_at: now.toISOString(),
          last_snapshot_at: now.toISOString(),
          confirm_span_minutes: Math.round(spanMinutes * 100) / 100,
          is_actionable: isActionable,
          stake_fraction: Math.round(stakeFraction * 10000) / 10000,
          consecutive_stable_runs: consecutiveStableRuns,
          created_at: now.toISOString(),
        };

        const { data: upsertedEdge, error } = await supabase
          .from("edges")
          .upsert(edgeData, { onConflict: "game_id,market,selection,bookmaker" })
          .select("id")
          .single();

        if (!error && upsertedEdge) {
          edgesStored++;

          if (isActionable && stakeFraction > 0) {
            actionableEdges.push({
              edgeKey,
              edgeId: upsertedEdge.id,
              stakeFraction,
              gameId: exec.game_id,
            });
          }

          const { error: historyError } = await supabase.from("edge_history").insert({
            edge_id: upsertedEdge.id,
            game_id: exec.game_id,
            bookmaker: exec.bookmaker,
            market: exec.market,
            selection: exec.selection,
            fair_odds: fairOdds,
            execution_odds: execOdds,
            edge_percent: roundedEdge,
          });

          if (!historyError) historyStored++;
        } else if (error) {
          console.error("Error storing edge:", error);
        }
      }
    }

    // ========== EXPOSURE CAP ENFORCEMENT ==========
    const totalExposure = actionableEdges.reduce((sum, e) => sum + e.stakeFraction, 0);
    let exposureScaleFactor = 1;
    let exposureCapped = false;

    if (totalExposure > MAX_TOTAL_EXPOSURE) {
      exposureScaleFactor = MAX_TOTAL_EXPOSURE / totalExposure;
      exposureCapped = true;
      console.log(`Exposure cap triggered: ${(totalExposure * 100).toFixed(2)}% > ${(MAX_TOTAL_EXPOSURE * 100).toFixed(0)}%, scaling by ${exposureScaleFactor.toFixed(3)}`);

      for (const edge of actionableEdges) {
        const scaledStake = Math.round(edge.stakeFraction * exposureScaleFactor * 10000) / 10000;
        await supabase
          .from("edges")
          .update({ stake_fraction: scaledStake })
          .eq("id", edge.edgeId);
      }
    }

    // Mark edges that weren't found as dead
    let deadEdges = 0;
    const edgesToMarkDead: string[] = [];
    
    for (const [key, edge] of existingEdgeMap) {
      if (!foundEdgeKeys.has(key) && edge.status !== "dead") {
        const gameStartTime = gameStartTimeMap.get(edge.game_id as string);
        const gameStarted = gameStartTime && gameStartTime < now;
        
        const lastSeen = edge.last_seen_at ? new Date(edge.last_seen_at as string) : new Date(edge.first_seen_at as string);
        const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
        
        if (gameStarted || hoursSinceLastSeen > 2) {
          edgesToMarkDead.push(edge.id as string);
        }
      }
    }

    if (edgesToMarkDead.length > 0) {
      await supabase
        .from("edges")
        .update({ status: "dead", is_actionable: false, stake_fraction: 0 })
        .in("id", edgesToMarkDead);
      deadEdges = edgesToMarkDead.length;
    }

    // Note: pipeline_runs is already recorded by run-pipeline orchestration function

    console.log(`Found ${edgesFound}, stored ${edgesStored}, new: ${newEdges}, confirming: ${confirmingEdges}, stable: ${stableEdges}, actionable: ${actionableCount}, dead: ${deadEdges}`);

    await jobLogger.success({
      fair_odds_count: fairOddsData.length,
      execution_odds_count: executionData.length,
      edges_found: edgesFound,
      edges_stored: edgesStored,
      new_edges: newEdges,
      confirming_edges: confirmingEdges,
      stable_edges: stableEdges,
      actionable_bets: actionableCount,
      dead_edges: deadEdges,
      exposure_capped: exposureCapped,
      total_exposure_percent: Math.round(totalExposure * 10000) / 100,
    });

    return new Response(
      JSON.stringify({
        success: true,
        fair_odds_count: fairOddsData.length,
        execution_odds_count: executionData.length,
        edges_found: edgesFound,
        edges_stored: edgesStored,
        new_edges: newEdges,
        confirming_edges: confirmingEdges,
        stable_edges: stableEdges,
        actionable_bets: actionableCount,
        dead_edges: deadEdges,
        history_snapshots: historyStored,
        exposure: {
          total_exposure_percent: Math.round(totalExposure * 10000) / 100,
          exposure_capped: exposureCapped,
          scale_factor: exposureCapped ? Math.round(exposureScaleFactor * 1000) / 1000 : null,
          max_exposure_percent: MAX_TOTAL_EXPOSURE * 100,
        },
        thresholds: {
          min_edge: min_edge,
          min_odds: MIN_ODDS,
          max_odds: MAX_ODDS,
          min_confirmations: MIN_CONFIRMATIONS_FOR_STABLE,
          min_span_minutes: MIN_SPAN_MINUTES_FOR_STABLE,
          kelly_fraction: KELLY_FRACTION,
          max_stake_fraction: MAX_STAKE_FRACTION,
          max_total_exposure: MAX_TOTAL_EXPOSURE,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Decision engine error:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});