import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { fetchWithRetry } from "../_shared/retry.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, OddsApiInputSchema, validationErrorResponse } from "../_shared/validation.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
  const { data: input, error: validationError } = await parseAndValidate(req, OddsApiInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const league = input.league!;
  const pipelineRunId = input.pipelineRunId;

  const jobLogger = new JobLogger(supabase, { 
    jobName: "fetch-odds-api",
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

    // Map league to The Odds API sport key
    const sportKeyMap: Record<string, string> = {
      nhl: "icehockey_nhl",
      nba: "basketball_nba",
      nfl: "americanfootball_nfl",
      mlb: "baseball_mlb",
    };

    const sportKey = sportKeyMap[league.toLowerCase()] || "icehockey_nhl";

    // Fetch odds from The Odds API with retry logic
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us,eu&markets=h2h&bookmakers=pinnacle,betfair_ex_eu,matchbook`;
    
    console.log("Fetching odds from The Odds API for:", sportKey);

    const oddsResponse = await fetchWithRetry(
      () => fetch(oddsUrl),
      {
        maxAttempts: 3,
        initialDelayMs: 2000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error, delayMs) => {
          console.log(`[The Odds API] Retry ${attempt}: ${error instanceof Response ? `Status ${error.status}` : error.message}, waiting ${delayMs}ms`);
        },
      }
    );
    
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
    console.log("Fetched games with odds:", games.length);

    // Log remaining requests
    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log("API requests remaining:", remainingRequests);

    // BATCH: Fetch all games from DB once outside the loop
    const { data: dbGames } = await supabase
      .from("games")
      .select("id, home_team, away_team")
      .ilike("league", league);

    let oddsStored = 0;
    let gamesMatched = 0;

    // Normalize team name for matching
    const normalizeTeam = (name: string) => 
      name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z\s]/g, "")
        .trim();

    const getTeamKeywords = (name: string) => {
      const normalized = normalizeTeam(name);
      const words = normalized.split(/\s+/);
      return { last: words[words.length - 1], full: normalized };
    };

    const teamsMatch = (team1: ReturnType<typeof getTeamKeywords>, team2: ReturnType<typeof getTeamKeywords>) => 
      team1.last === team2.last || 
      team1.full.includes(team2.last) || 
      team2.full.includes(team1.last);

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

      const gameId = matchedGame.id;
      gamesMatched++;

      // Extract Pinnacle odds (or first available sharp book)
      const pinnacle = game.bookmakers.find((b) => b.key === "pinnacle") ||
                       game.bookmakers.find((b) => b.key === "betfair_ex_eu") ||
                       game.bookmakers[0];

      if (!pinnacle) continue;

      const h2hMarket = pinnacle.markets.find((m) => m.key === "h2h");
      if (!h2hMarket) continue;

      for (const outcome of h2hMarket.outcomes) {
        const { error } = await supabase
          .from("pinnacle_odds")
          .upsert(
            {
              game_id: gameId,
              market: "moneyline",
              selection: outcome.name,
              odds: outcome.price,
              scraped_at: new Date().toISOString(),
            },
            { onConflict: "game_id,market,selection" }
          );

        if (!error) oddsStored++;
      }
    }

    await jobLogger.success({
      league,
      games_found: games.length,
      games_matched: gamesMatched,
      odds_stored: oddsStored,
      requests_remaining: parseInt(remainingRequests || "0"),
    });

    return new Response(
      JSON.stringify({
        success: true,
        games_found: games.length,
        games_matched: gamesMatched,
        odds_stored: oddsStored,
        requests_remaining: remainingRequests,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Odds API error:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});