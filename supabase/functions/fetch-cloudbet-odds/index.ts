import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, ExecutionOddsInputSchema, validationErrorResponse } from "../_shared/validation.ts";

/**
 * Fetch moneyline odds from Cloudbet Feed API (FREE - no quota cost)
 * 
 * Uses the Affiliate API key which returns cached data (up to 1 min behind).
 * Stores odds in execution_odds table alongside other bookmaker data.
 * 
 * API docs: https://www.cloudbet.com/api
 * Base URL: https://sports-api.cloudbet.com/pub
 */

const CLOUDBET_BASE = "https://sports-api.cloudbet.com/pub";

// Map our league codes to Cloudbet competition keys + market keys
const LEAGUE_CONFIG: Record<string, { competition: string; marketKey: string }> = {
  nba: { competition: "basketball-usa-nba", marketKey: "basketball.moneyline" },
  nhl: { competition: "ice-hockey-usa-nhl", marketKey: "ice-hockey.moneyline" },
  mlb: { competition: "baseball-usa-mlb", marketKey: "baseball.moneyline" },
  nfl: { competition: "american-football-usa-nfl", marketKey: "american-football.moneyline" },
};

import { getTeamKeywords, teamsMatch } from "../_shared/team-matching.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireInternalAuth(req);
  if (authError) return authError;

  const { data: input, error: validationError } = await parseAndValidate(req, ExecutionOddsInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const league = input.league!;
  const pipelineRunId = input.pipelineRunId;

  const jobLogger = new JobLogger(supabase, {
    jobName: "fetch-cloudbet-odds",
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    const apiKey = Deno.env.get("CLOUDBET_API_KEY");
    if (!apiKey) {
      await jobLogger.error("CLOUDBET_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "CLOUDBET_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = LEAGUE_CONFIG[league.toLowerCase()];
    if (!config) {
      await jobLogger.error(`Unsupported league for Cloudbet: ${league}`);
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported league: ${league}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch competition odds from Cloudbet
    const url = `${CLOUDBET_BASE}/v2/odds/competitions/${config.competition}?markets=${config.marketKey}`;
    console.log("Fetching Cloudbet odds:", url);

    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudbet API error:", response.status, errText);
      await jobLogger.error(`Cloudbet API ${response.status}: ${errText}`);
      return new Response(
        JSON.stringify({ success: false, error: `Cloudbet API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const events = data?.events || [];
    console.log("Cloudbet events fetched:", Object.keys(events).length);

    // Fetch our DB games for matching
    const { data: dbGames } = await supabase
      .from("games")
      .select("id, home_team, away_team")
      .ilike("league", league);

    let oddsStored = 0;
    let gamesMatched = 0;

    // Events is an object keyed by event ID
    const eventList = Object.values(events) as Array<{
      home?: { name?: string };
      away?: { name?: string };
      markets?: Record<string, { submarkets?: Record<string, { selections?: Array<{
        outcome?: string;
        price?: string;
        status?: string;
      }> }> }>;
    }>;

    for (const event of eventList) {
      const homeName = event.home?.name;
      const awayName = event.away?.name;
      if (!homeName || !awayName) continue;

      const cbHome = getTeamKeywords(homeName);
      const cbAway = getTeamKeywords(awayName);

      const matchedGame = dbGames?.find((g) => {
        const dbHome = getTeamKeywords(g.home_team);
        const dbAway = getTeamKeywords(g.away_team);
        return (
          (teamsMatch(dbHome, cbHome) && teamsMatch(dbAway, cbAway)) ||
          (teamsMatch(dbHome, cbAway) && teamsMatch(dbAway, cbHome))
        );
      });

      if (!matchedGame) {
        console.log("No DB match for Cloudbet event:", homeName, "vs", awayName);
        continue;
      }

      gamesMatched++;
      const gameId = matchedGame.id;

      // Extract moneyline selections from the market
      const market = event.markets?.[config.marketKey];
      if (!market?.submarkets) continue;

      for (const submarket of Object.values(market.submarkets)) {
        const selections = submarket.selections || [];
        for (const sel of selections) {
          if (!sel.price || sel.status !== "SELECTION_ENABLED") continue;

          const odds = parseFloat(sel.price);
          if (isNaN(odds) || odds <= 1) continue;

          // Map outcome to team name
          let selectionName = sel.outcome === "home" ? homeName : sel.outcome === "away" ? awayName : sel.outcome;
          if (!selectionName) continue;

          const { error } = await supabase.from("execution_odds").upsert(
            {
              game_id: gameId,
              market: "moneyline",
              selection: selectionName,
              odds,
              bookmaker: "cloudbet",
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "game_id,market,selection,bookmaker" }
          );

          if (!error) oddsStored++;
        }
      }
    }

    await jobLogger.success({
      league,
      events_fetched: eventList.length,
      games_matched: gamesMatched,
      odds_stored: oddsStored,
    });

    return new Response(
      JSON.stringify({
        success: true,
        events_fetched: eventList.length,
        games_matched: gamesMatched,
        odds_stored: oddsStored,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cloudbet odds error:", error);
    await jobLogger.error(errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});