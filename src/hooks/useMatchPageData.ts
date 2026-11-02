import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sport,
  MatchPageData,
  PregameEdge,
  AvailabilityItem,
  SPORT_DISPLAY_NAMES,
} from "@/types/pregame";

interface EdgeRow {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  market: string;
  selection: string;
  book_odds: number;
  fair_odds: number;
  model_prob: number;
  edge: number;
  bookmaker: string;
  reasons: string[] | null;
  is_actionable: boolean;
}

interface AvailabilityRow {
  player_name: string;
  team: string;
  status: string;
  reason: string | null;
}

/**
 * Map edge row to PregameEdge
 */
function mapToPregameEdge(edge: EdgeRow): PregameEdge {
  const reasons = edge.reasons as string[] | null;
  return {
    id: edge.id,
    market: edge.market,
    selection: edge.selection,
    bookOdds: edge.book_odds,
    fairOdds: edge.fair_odds,
    edge: edge.edge,
    whyItMatters: reasons?.[0] || `${edge.edge.toFixed(1)}% edge detected on ${edge.selection}`,
  };
}

/**
 * Parse match slug to extract team names
 */
function parseMatchSlug(slug: string): { home: string; away: string } {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) {
    return { home: slug, away: "" };
  }
  
  const formatTeamName = (s: string) =>
    s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return {
    home: formatTeamName(parts[0]),
    away: formatTeamName(parts[1]),
  };
}

export function useMatchPageData(
  sport: Sport,
  league: string,
  matchSlug: string,
  date: string
) {
  return useQuery({
    queryKey: ["match-page", sport, league, matchSlug, date],
    queryFn: async (): Promise<MatchPageData | null> => {
      // Parse team names from slug
      const { home, away } = parseMatchSlug(matchSlug);

      // Build date range
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch edges and availability in parallel
      const [edgesResult, availabilityResult] = await Promise.all([
        supabase
          .from("edges_public")
          .select("*")
          .eq("sport", sport)
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString())
          .order("edge", { ascending: false }),
        supabase
          .from("player_availability")
          .select("player_name, team, status, reason")
          .eq("sport", sport)
          .eq("game_date", date)
          .order("status", { ascending: true })
          .limit(50),
      ]);

      if (edgesResult.error) {
        console.error("Error fetching edges:", edgesResult.error);
        throw edgesResult.error;
      }

      const allEdges = (edgesResult.data as unknown as EdgeRow[]) || [];
      const allAvailability = (availabilityResult.data as unknown as AvailabilityRow[]) || [];

      // Filter edges that match this specific game
      const matchEdges = allEdges.filter((edge) => {
        const homeMatch =
          edge.home_team.toLowerCase().includes(home.toLowerCase()) ||
          home.toLowerCase().includes(edge.home_team.toLowerCase());
        const awayMatch =
          edge.away_team.toLowerCase().includes(away.toLowerCase()) ||
          away.toLowerCase().includes(edge.away_team.toLowerCase());
        return homeMatch && awayMatch;
      });

      // Filter availability for teams in this match
      const matchAvailability: AvailabilityItem[] = allAvailability
        .filter((row) => {
          const teamLower = row.team.toLowerCase();
          return (
            teamLower.includes(home.toLowerCase()) ||
            home.toLowerCase().includes(teamLower) ||
            teamLower.includes(away.toLowerCase()) ||
            away.toLowerCase().includes(teamLower)
          );
        })
        .map((row) => ({
          player: row.player_name,
          team: row.team,
          status: row.status as AvailabilityItem["status"],
          reason: row.reason || undefined,
        }));

      // If no edges found for this match, return basic structure
      if (matchEdges.length === 0) {
        return {
          sport,
          league,
          matchSlug,
          date,
          homeTeam: home,
          awayTeam: away,
          startTime: `${date}T19:00:00Z`,
          summary: `Pre-game analysis for ${away} at ${home}. Check back closer to game time for edge detection and market analysis.`,
          marketSnapshot: {
            moneyline: { open: 0, current: 0 },
          },
          availability: matchAvailability,
          edges: [],
          trueProbability: 50,
          fairOdds: 2.0,
          edgePercent: 0,
          bestPrices: [],
          riskNotes: [
            "No edges currently detected for this matchup",
            "Market data may update closer to game time",
          ],
        };
      }

      // Use first edge to get match details
      const primaryEdge = matchEdges[0];
      const topEdge = matchEdges.reduce(
        (max, e) => (e.edge > max.edge ? e : max),
        matchEdges[0]
      );

      // Build best prices from unique bookmakers
      const bookmakerPrices = new Map<string, number>();
      for (const edge of matchEdges) {
        if (!bookmakerPrices.has(edge.bookmaker)) {
          bookmakerPrices.set(edge.bookmaker, edge.book_odds);
        }
      }
      const bestPrices = Array.from(bookmakerPrices.entries())
        .map(([bookmaker, odds], idx) => ({
          bookmaker,
          odds,
          isPrimary: idx === 0,
        }))
        .slice(0, 3);

      // Calculate true probability from model_prob
      const avgModelProb =
        matchEdges.reduce((sum, e) => sum + (e.model_prob || 50), 0) /
        matchEdges.length;

      return {
        sport,
        league: primaryEdge.league,
        matchSlug,
        date,
        homeTeam: primaryEdge.home_team,
        awayTeam: primaryEdge.away_team,
        startTime: primaryEdge.start_time,
        summary: `${primaryEdge.away_team} travels to face ${primaryEdge.home_team} in a ${SPORT_DISPLAY_NAMES[sport]} matchup. Our model has identified ${matchEdges.length} potential edge${matchEdges.length > 1 ? "s" : ""} based on market pricing inefficiencies.`,
        marketSnapshot: {
          moneyline: {
            open: topEdge.fair_odds,
            current: topEdge.book_odds,
          },
        },
        availability: matchAvailability,
        edges: matchEdges.slice(0, 5).map(mapToPregameEdge),
        trueProbability: avgModelProb,
        fairOdds: topEdge.fair_odds,
        edgePercent: topEdge.edge,
        bestPrices,
        riskNotes: [
          matchEdges.some((e) => e.is_actionable)
            ? "Actionable edges detected - confirmed by model"
            : "Edges still confirming - monitor for stability",
          "Market data updates in real-time",
          matchAvailability.length > 0
            ? `${matchAvailability.length} player(s) with availability concerns`
            : "Check injury reports before placing any bets",
        ],
      };
    },
  });
}