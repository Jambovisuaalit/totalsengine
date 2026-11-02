import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JobLogger } from "../_shared/job-logger.ts";
import { fetchWithRetry } from "../_shared/retry.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";

interface InjuryReport {
  player_name: string;
  team: string;
  status: string;
  reason: string;
}

// ESPN sport paths
const SPORT_PATHS: Record<string, { path: string; sportName: string }> = {
  nba: { path: "nba", sportName: "nba" },
  nfl: { path: "nfl", sportName: "nfl" },
  mlb: { path: "mlb", sportName: "mlb" },
  nhl: { path: "nhl", sportName: "nhl" },
};

// Status normalization
function normalizeStatus(rawStatus: string): string {
  const status = rawStatus.toUpperCase().trim();
  if (status.includes("OUT")) return "OUT";
  if (status.includes("QUESTIONABLE")) return "QUESTIONABLE";
  if (status.includes("PROBABLE")) return "PROBABLE";
  if (status.includes("DOUBTFUL")) return "DOUBTFUL";
  if (status.includes("DAY-TO-DAY") || status.includes("DTD")) return "DAY-TO-DAY";
  if (status.includes("GTD") || status.includes("GAME TIME")) return "GTD";
  return "QUESTIONABLE"; // Default fallback
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let input: { sport?: string; pipelineRunId?: string } = {};
  try {
    input = await req.json();
  } catch {
    // Default to all sports
  }

  const sport = input.sport?.toLowerCase();
  const pipelineRunId = input.pipelineRunId;

  const jobLogger = new JobLogger(supabase, {
    jobName: "scrape-espn-injuries",
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await jobLogger.error("Lovable API key not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Lovable API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which sports to scrape
    const sportsToScrape = sport && SPORT_PATHS[sport] 
      ? [{ key: sport, ...SPORT_PATHS[sport] }]
      : Object.entries(SPORT_PATHS).map(([key, val]) => ({ key, ...val }));

    const results: Record<string, { scraped: number; stored: number }> = {};
    const today = new Date().toISOString().split("T")[0];

    for (const sportConfig of sportsToScrape) {
      const espnUrl = `https://www.espn.com/${sportConfig.path}/injuries`;
      console.log(`Scraping ESPN injuries: ${espnUrl}`);

      try {
        // Scrape ESPN injuries page
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
          console.error(`Failed to scrape ${sportConfig.sportName} injuries:`, scrapeData);
          results[sportConfig.key] = { scraped: 0, stored: 0 };
          continue;
        }

        const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
        console.log(`Scraped ${sportConfig.sportName} injuries markdown length:`, markdown.length);

        // Use AI to extract structured injury data
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
                  content: `You extract injury reports from ESPN. Extract player name, team, status (OUT, QUESTIONABLE, PROBABLE, DOUBTFUL, DAY-TO-DAY, GTD), and injury reason/description.`,
                },
                {
                  role: "user",
                  content: `Extract all injury reports from this ESPN ${sportConfig.sportName.toUpperCase()} injuries page.

For each injured player, extract:
- player_name: Full name
- team: Full team name
- status: One of OUT, QUESTIONABLE, PROBABLE, DOUBTFUL, DAY-TO-DAY, GTD
- reason: Injury description (e.g., "Knee", "Hamstring strain")

ESPN Injuries Page Content:
${markdown.slice(0, 25000)}`,
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "save_injuries",
                    description: "Save extracted injury data",
                    parameters: {
                      type: "object",
                      properties: {
                        injuries: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              player_name: { type: "string" },
                              team: { type: "string" },
                              status: { type: "string" },
                              reason: { type: "string" },
                            },
                            required: ["player_name", "team", "status"],
                          },
                        },
                      },
                      required: ["injuries"],
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "save_injuries" } },
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

        if (!aiResponse.ok) {
          console.error(`AI extraction failed for ${sportConfig.sportName}`);
          results[sportConfig.key] = { scraped: 0, stored: 0 };
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        let injuries: InjuryReport[] = [];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            injuries = parsed.injuries || [];
            console.log(`AI extracted ${injuries.length} injuries for ${sportConfig.sportName}`);
          } catch (e) {
            console.error("Failed to parse AI response:", e);
          }
        }

        // Store injuries in database
        let stored = 0;
        for (const injury of injuries) {
          const { error } = await supabase
            .from("player_availability")
            .upsert(
              {
                player_name: injury.player_name,
                team: injury.team,
                sport: sportConfig.key,
                league: sportConfig.key.toUpperCase(),
                status: normalizeStatus(injury.status),
                reason: injury.reason || null,
                source: "espn",
                source_url: espnUrl,
                game_date: today,
                scraped_at: new Date().toISOString(),
              },
              {
                onConflict: "player_name,team,sport,game_date",
                ignoreDuplicates: false,
              }
            );

          if (error) {
            console.error("Insert error:", error.message);
          } else {
            stored++;
          }
        }

        results[sportConfig.key] = { scraped: injuries.length, stored };
      } catch (sportError) {
        console.error(`Error scraping ${sportConfig.sportName}:`, sportError);
        results[sportConfig.key] = { scraped: 0, stored: 0 };
      }
    }

    const totalScraped = Object.values(results).reduce((sum, r) => sum + r.scraped, 0);
    const totalStored = Object.values(results).reduce((sum, r) => sum + r.stored, 0);

    await jobLogger.success({
      sports_processed: Object.keys(results).length,
      total_injuries_scraped: totalScraped,
      total_injuries_stored: totalStored,
      by_sport: results,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sports_processed: Object.keys(results).length,
        total_injuries_scraped: totalScraped,
        total_injuries_stored: totalStored,
        by_sport: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ESPN injuries scraper error:", error);
    await jobLogger.error(errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});