import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, ExecutionOddsInputSchema, validationErrorResponse } from "../_shared/validation.ts";

interface OddsApiGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

import { getTeamKeywords, teamsMatch } from "../_shared/team-matching.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
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
    jobName: "fetch-execution-odds",
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    const API_KEY = Deno.env.get("THE_ODDS_API");
    if (!API_KEY) {
      await jobLogger.error("The Odds API key not configured");
      return new Response(
        JSON.stringify({ success: false, error: "The Odds API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sportKeyMap: Record<string, string> = {
      nhl: "icehockey_nhl",
      nba: "basketball_nba",
      nfl: "americanfootball_nfl",
      mlb: "baseball_mlb",
    };

    const sportKey = sportKeyMap[league.toLowerCase()] || "icehockey_nhl";

    // Fetch odds from soft EU bookmakers
    const bookmakers = "bet365,unibet_eu,coolbet,paddypower";
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=eu,uk&markets=h2h&bookmakers=${bookmakers}`;

    console.log("Fetching execution odds for:", sportKey);

    const oddsResponse = await fetch(oddsUrl);

    if (!oddsResponse.ok) {
      const errText = await oddsResponse.text();
      console.error("The Odds API error:", errText);
      await jobLogger.error(`Failed to fetch odds: ${errText}`);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch odds", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const games: OddsApiGame[] = await oddsResponse.json();
    console.log("Fetched games:", games.length);

    // Fetch all games from DB once
    const { data: dbGames } = await supabase
      .from("games")
      .select("id, home_team, away_team")
      .ilike("league", league);

    let oddsStored = 0;
    let gamesMatched = 0;

    for (const game of games) {
      const oddsHome = getTeamKeywords(game.home_team);
      const oddsAway = getTeamKeywords(game.away_team);

      const matchedGame = dbGames?.find((g) => {
        const dbHome = getTeamKeywords(g.home_team);
        const dbAway = getTeamKeywords(g.away_team);

        const directMatch = teamsMatch(dbHome, oddsHome) && teamsMatch(dbAway, oddsAway);
        const reversedMatch = teamsMatch(dbHome, oddsAway) && teamsMatch(dbAway, oddsHome);

        return directMatch || reversedMatch;
      });

      if (!matchedGame) {
        console.log("No match for:", game.home_team, "vs", game.away_team);
        continue;
      }

      gamesMatched++;
      const gameId = matchedGame.id;

      // Process each bookmaker
      for (const bookmaker of game.bookmakers) {
        const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h");
        if (!h2hMarket) continue;

        for (const outcome of h2hMarket.outcomes) {
          const { error } = await supabase.from("execution_odds").upsert(
            {
              game_id: gameId,
              market: "moneyline",
              selection: outcome.name,
              odds: outcome.price,
              bookmaker: bookmaker.key,
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
      games_fetched: games.length,
      games_matched: gamesMatched,
      odds_stored: oddsStored,
    });

    return new Response(
      JSON.stringify({
        success: true,
        games_fetched: games.length,
        games_matched: gamesMatched,
        odds_stored: oddsStored,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Execution odds error:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});