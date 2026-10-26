import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { fetchWithRetry } from "../_shared/retry.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";
import { parseAndValidate, EspnInputSchema, validationErrorResponse } from "../_shared/validation.ts";
import { resolveTeamName } from "../_shared/team-names.ts";

interface ESPNGame {
  external_id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: string;
}

function parseTimeToISO(timeStr: string, dateStr: string): string {
  const dateMatch = dateStr.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d+)/);
  if (!dateMatch) return "";
  
  const [, , month, day, year] = dateMatch;
  const monthMap: Record<string, string> = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12"
  };
  
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return "";
  
  let [, hours, minutes, period] = timeMatch;
  let hour = parseInt(hours);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  
  hour += 5;
  let dayNum = parseInt(day);
  if (hour >= 24) {
    hour -= 24;
    dayNum += 1;
  }
  
  return `${year}-${monthMap[month]}-${dayNum.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minutes}:00Z`;
}

function parseMarkdownSchedule(markdown: string, league: string): ESPNGame[] {
  const games: ESPNGame[] = [];
  const lines = markdown.split('\n');
  
  let currentDate = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const dateMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\w+\s+\d+,\s+\d{4}$/);
    if (dateMatch) {
      currentDate = line;
      continue;
    }
    
    if (line.startsWith('|') && line.includes('@') && currentDate) {
      const gameIdMatch = line.match(/gameId[=/](\d+)/);
      if (!gameIdMatch) continue;
      
      const gameId = gameIdMatch[1];
      
      const timeMatch = line.match(/\[?(\d{1,2}:\d{2}\s*(?:AM|PM))\]?/i);
      if (!timeMatch) continue;
      
      const timeStr = timeMatch[1];
      
      if (line.match(/\w+\s+\d+,\s+\w+\s+\d+/)) continue;
      
      const teamMatches = line.match(/\[([^\]]+)\]\([^)]+team[^)]+\)/g);
      if (!teamMatches || teamMatches.length < 2) continue;
      
      const awayName = teamMatches[0].match(/\[([^\]]+)\]/)?.[1] || "";
      const homeName = teamMatches[1].match(/\[([^\]]+)\]/)?.[1] || "";
      
      const awayTeam = resolveTeamName(awayName, league);
      const homeTeam = resolveTeamName(homeName, league);
      
      const startTime = parseTimeToISO(timeStr, currentDate);
      if (!startTime) continue;
      
      games.push({
        external_id: gameId,
        away_team: awayTeam,
        home_team: homeTeam,
        start_time: startTime,
        status: "scheduled"
      });
    }
  }
  
  return games;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for pipeline functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  // Validate input parameters
  const { data: input, error: validationError } = await parseAndValidate(req, EspnInputSchema);
  if (validationError || !input) {
    return validationErrorResponse(validationError || "Invalid input", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const league = input.league!;
  const pipelineRunId = input.pipelineRunId;

  const jobLogger = new JobLogger(supabase, { 
    jobName: "scrape-espn",
    pipelineRunId,
  });

  try {
    await jobLogger.start();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      await jobLogger.error("Firecrawl not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const espnUrl = `https://www.espn.com/${league}/schedule`;
    console.log("Scraping ESPN:", espnUrl);

    // Firecrawl API call with retry logic
    const scrapeResponse = await fetchWithRetry(
      () => fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: espnUrl,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      }),
      {
        maxAttempts: 3,
        initialDelayMs: 2000,
        retryableStatuses: [429, 500, 502, 503, 504],
        onRetry: (attempt, error, delayMs) => {
          console.log(`[Firecrawl] Retry ${attempt}: ${error instanceof Response ? `Status ${error.status}` : error.message}, waiting ${delayMs}ms`);
        },
      }
    );

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("ESPN scrape failed:", scrapeData);
      await jobLogger.error("Failed to scrape ESPN", { details: scrapeData });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to scrape ESPN", details: scrapeData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    console.log("Scraped markdown length:", markdown.length);

    const games = parseMarkdownSchedule(markdown, league);
    console.log("Parsed games from markdown:", games.length);

    // If no games found with regex, fall back to AI extraction
    if (games.length === 0) {
      console.log("No games found with regex, trying AI extraction...");
      
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        // AI Gateway call with retry logic
        const aiResponse = await fetchWithRetry(
          () => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { 
                  role: "system", 
                  content: "You extract NHL game schedules from ESPN. Return ONLY scheduled games (not completed). Use exact team full names." 
                },
                { 
                  role: "user", 
                  content: `Extract upcoming NHL games from this schedule. Current date: ${currentDate}

FORMAT: The tables have columns MATCHUP, TIME, TV, tickets, Odds
- Away team is listed first, home team after "@"
- Times are in ET (Eastern Time)
- Ignore rows with scores (e.g., "TOR 4, FLA 1") - those are finished

For each game return:
- external_id: ESPN gameId from URL (e.g., "401803028")
- away_team: Full team name (e.g., "Dallas Stars")  
- home_team: Full team name (e.g., "Washington Capitals")
- start_time: ISO 8601 with UTC timezone
- status: "scheduled"

ESPN Schedule:
${markdown.slice(5000, 20000)}`
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "save_games",
                    description: "Save extracted game data",
                    parameters: {
                      type: "object",
                      properties: {
                        games: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              external_id: { type: "string" },
                              away_team: { type: "string" },
                              home_team: { type: "string" },
                              start_time: { type: "string" },
                              status: { type: "string" },
                            },
                            required: ["external_id", "away_team", "home_team", "start_time", "status"],
                          },
                        },
                      },
                      required: ["games"],
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "save_games" } },
            }),
          }),
          {
            maxAttempts: 2,
            initialDelayMs: 1000,
            retryableStatuses: [429, 500, 502, 503, 504],
            onRetry: (attempt, error, delayMs) => {
              console.log(`[Lovable AI] Retry ${attempt}: ${error instanceof Response ? `Status ${error.status}` : error.message}, waiting ${delayMs}ms`);
            },
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            try {
              const parsed = JSON.parse(toolCall.function.arguments);
              games.push(...(parsed.games || []));
              console.log("AI extracted games:", parsed.games?.length || 0);
            } catch (e) {
              console.error("Failed to parse AI response:", e);
            }
          }
        }
      }
    }

    const leagueUpper = league.toUpperCase();
    let inserted = 0;

    for (const game of games) {
      const { data, error } = await supabase
        .from("games")
        .upsert(
          {
            external_id: game.external_id,
            league: leagueUpper,
            home_team: game.home_team,
            away_team: game.away_team,
            start_time: game.start_time,
            status: game.status,
          },
          { onConflict: "external_id" }
        )
        .select();

      if (error) {
        console.error("Insert error:", error);
      } else if (data?.length) {
        inserted++;
      }
    }

    await jobLogger.success({
      league: leagueUpper,
      games_found: games.length,
      games_stored: inserted,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        league: leagueUpper,
        games_found: games.length,
        games_stored: inserted,
        sample_games: games.slice(0, 3),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ESPN scraper error:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});