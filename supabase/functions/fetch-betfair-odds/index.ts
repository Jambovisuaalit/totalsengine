import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, OddsApiInputSchema, validationErrorResponse } from "../_shared/validation.ts";

/**
 * Fetch sharp odds from Pinnacle by scraping their website via Firecrawl.
 * Stores results in pinnacle_odds table (used by calculate-fair-odds).
 *
 * Pinnacle has one of the lowest margins in the industry (~2%), making
 * their odds an excellent proxy for true market prices.
 */

// Pinnacle sport slugs
const PINNACLE_SPORT_SLUGS: Record<string, { sport: string; league: string }> = {
  nba: { sport: "basketball", league: "NBA" },
  nhl: { sport: "hockey", league: "NHL" },
  nfl: { sport: "football", league: "NFL" },
  mlb: { sport: "baseball", league: "MLB" },
};

import { getTeamKeywords, teamsMatch } from "../_shared/team-matching.ts";

interface PinnacleMatchOdds {
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
}

/**
 * Parse Pinnacle odds from Firecrawl markdown output.
 * Pinnacle pages list games in a structured format we can parse.
 */
function parsePinnacleMarkdown(markdown: string): PinnacleMatchOdds[] {
  const results: PinnacleMatchOdds[] = [];

  // Match lines like: "Team A -110 / Team B +120" or similar patterns
  // Pinnacle markdown typically has team names with odds in decimal or american format
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for decimal odds patterns (e.g., 1.85, 2.10) next to team names
    // Pinnacle uses decimal odds on their international site
    const decimalOddsPattern = /^(.+?)\s+([\d]+\.[\d]+)\s*$/;
    const match = line.match(decimalOddsPattern);

    if (match) {
      const teamName = match[1].trim();
      const odds = parseFloat(match[2]);

      // Check if next line has the opposing team
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const nextMatch = nextLine.match(decimalOddsPattern);
        if (nextMatch && odds >= 1.01 && odds <= 50) {
          const awayTeam = nextMatch[1].trim();
          const awayOdds = parseFloat(nextMatch[2]);

          if (awayOdds >= 1.01 && awayOdds <= 50) {
            results.push({
              homeTeam: teamName,
              awayTeam,
              homeOdds: odds,
              awayOdds,
            });
            i++; // Skip next line
          }
        }
      }
    }
  }

  return results;
}

/**
 * Alternative: use Firecrawl's JSON extraction with a schema
 * to get structured odds data from Pinnacle.
 */
async function scrapePinnacleWithFirecrawl(
  firecrawlKey: string,
  league: string
): Promise<PinnacleMatchOdds[]> {
  const sportInfo = PINNACLE_SPORT_SLUGS[league.toLowerCase()];
  if (!sportInfo) return [];

  const url = `https://www.pinnacle.com/en/${sportInfo.sport}/matchups/`;

  console.log(`Scraping Pinnacle for ${league} at: ${url}`);

  // Use Firecrawl with JSON extraction schema for structured odds
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["json"],
      jsonOptions: {
        schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  homeTeam: { type: "string" },
                  awayTeam: { type: "string" },
                  homeOdds: { type: "number", description: "Decimal odds for home team moneyline" },
                  awayOdds: { type: "number", description: "Decimal odds for away team moneyline" },
                  drawOdds: { type: "number", description: "Decimal odds for draw if applicable" },
                },
                required: ["homeTeam", "awayTeam", "homeOdds", "awayOdds"],
              },
            },
          },
        },
        prompt: `Extract all ${sportInfo.league} matchups from this Pinnacle sportsbook page. For each game, get the home team name, away team name, and their moneyline decimal odds (e.g. 1.85, 2.10). Only include upcoming games, not live games. Decimal odds are always > 1.0 (e.g. 1.50, 2.20, 3.40).`,
      },
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firecrawl error (${response.status}): ${err}`);
  }

  const data = await response.json();

  // Try JSON extraction first
  const extracted = data?.data?.json || data?.json;
  if (extracted?.matches && Array.isArray(extracted.matches)) {
    console.log(`Firecrawl JSON extracted ${extracted.matches.length} matches`);
    return extracted.matches.filter(
      (m: PinnacleMatchOdds) =>
        m.homeTeam &&
        m.awayTeam &&
        m.homeOdds > 1.01 &&
        m.awayOdds > 1.01
    );
  }

  // Fallback: try parsing markdown
  const markdown = data?.data?.markdown || data?.markdown || "";
  if (markdown) {
    console.log("Falling back to markdown parsing...");
    const parsed = parsePinnacleMarkdown(markdown);
    console.log(`Parsed ${parsed.length} matches from markdown`);
    return parsed;
  }

  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireInternalAuth(req);
  if (authError) return authError;

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
    jobName: "fetch-betfair-odds", // keep job name for pipeline_health view compatibility
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      await jobLogger.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!PINNACLE_SPORT_SLUGS[league.toLowerCase()]) {
      await jobLogger.error(`Unsupported league: ${league}`);
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported league: ${league}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scrape Pinnacle via Firecrawl
    const pinnacleMatches = await scrapePinnacleWithFirecrawl(firecrawlKey, league);
    console.log(`Got ${pinnacleMatches.length} Pinnacle matches for ${league}`);

    if (!pinnacleMatches.length) {
      await jobLogger.success({
        league,
        matches_found: 0,
        games_matched: 0,
        odds_stored: 0,
        message: "No Pinnacle matches found or scraped",
      });
      return new Response(
        JSON.stringify({ success: true, matches_found: 0, odds_stored: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch DB games for matching
    const { data: dbGames } = await supabase
      .from("games")
      .select("id, home_team, away_team")
      .ilike("league", league);

    let oddsStored = 0;
    let gamesMatched = 0;

    for (const match of pinnacleMatches) {
      const pinnHome = getTeamKeywords(match.homeTeam);
      const pinnAway = getTeamKeywords(match.awayTeam);

      const matchedGame = dbGames?.find((g) => {
        const dbHome = getTeamKeywords(g.home_team);
        const dbAway = getTeamKeywords(g.away_team);
        return (
          (teamsMatch(dbHome, pinnHome) && teamsMatch(dbAway, pinnAway)) ||
          (teamsMatch(dbHome, pinnAway) && teamsMatch(dbAway, pinnHome))
        );
      });

      if (!matchedGame) {
        console.log(`No DB match for Pinnacle: ${match.homeTeam} vs ${match.awayTeam}`);
        continue;
      }

      gamesMatched++;

      // Store home odds
      const homeUpsert = await supabase.from("pinnacle_odds").upsert(
        {
          game_id: matchedGame.id,
          market: "moneyline",
          selection: match.homeTeam,
          odds: match.homeOdds,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "game_id,market,selection" }
      );
      if (!homeUpsert.error) oddsStored++;
      else console.error("Error storing home odds:", homeUpsert.error);

      // Store away odds
      const awayUpsert = await supabase.from("pinnacle_odds").upsert(
        {
          game_id: matchedGame.id,
          market: "moneyline",
          selection: match.awayTeam,
          odds: match.awayOdds,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "game_id,market,selection" }
      );
      if (!awayUpsert.error) oddsStored++;
      else console.error("Error storing away odds:", awayUpsert.error);

      // Store draw odds if present (hockey OT etc.)
      if (match.drawOdds && match.drawOdds > 1.01) {
        const drawUpsert = await supabase.from("pinnacle_odds").upsert(
          {
            game_id: matchedGame.id,
            market: "moneyline",
            selection: "Draw",
            odds: match.drawOdds,
            scraped_at: new Date().toISOString(),
          },
          { onConflict: "game_id,market,selection" }
        );
        if (!drawUpsert.error) oddsStored++;
      }
    }

    await jobLogger.success({
      league,
      source: "pinnacle_firecrawl",
      matches_found: pinnacleMatches.length,
      games_matched: gamesMatched,
      odds_stored: oddsStored,
    });

    return new Response(
      JSON.stringify({
        success: true,
        source: "pinnacle_firecrawl",
        matches_found: pinnacleMatches.length,
        games_matched: gamesMatched,
        odds_stored: oddsStored,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Pinnacle scrape error:", error);
    await jobLogger.error(errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});