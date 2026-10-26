import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import {
  Sport,
  DailySlateData,
  PregameEdge,
  MatchCard,
  AvailabilityItem,
  SPORT_DISPLAY_NAMES,
  generateMatchSlug,
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
  edge: number;
  reasons: string[] | null;
}

/**
 * Safely parse a date string, returning null if invalid
 */
function safeParseDate(dateStr: string): Date | null {
  try {
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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
 * Build unique match cards from edges
 */
function buildMatchCards(edges: EdgeRow[]): MatchCard[] {
  const matchMap = new Map<string, MatchCard>();

  for (const edge of edges) {
    const matchKey = `${edge.home_team}-${edge.away_team}-${edge.start_time}`;
    
    if (!matchMap.has(matchKey)) {
      matchMap.set(matchKey, {
        id: `match-${edge.id}`,
        homeTeam: edge.home_team,
        awayTeam: edge.away_team,
        league: edge.league,
        startTime: edge.start_time,
        matchSlug: generateMatchSlug(edge.home_team, edge.away_team),
        topEdge: edge.edge,
        hasEdges: true,
      });
    } else {
      const existing = matchMap.get(matchKey)!;
      if (edge.edge > (existing.topEdge || 0)) {
        existing.topEdge = edge.edge;
      }
    }
  }

  return Array.from(matchMap.values()).sort((a, b) => 
    (b.topEdge || 0) - (a.topEdge || 0)
  );
}

interface AvailabilityRow {
  player_name: string;
  team: string;
  status: string;
  reason: string | null;
}

export function useDailySlateData(sport: Sport, date: string) {
  return useQuery({
    queryKey: ["daily-slate", sport, date],
    queryFn: async (): Promise<DailySlateData> => {
      // Build date range for the query
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
          .limit(20),
      ]);

      if (edgesResult.error) {
        console.error("Error fetching edges:", edgesResult.error);
        throw edgesResult.error;
      }

      const edges = (edgesResult.data as unknown as EdgeRow[]) || [];
      const availabilityRows = (availabilityResult.data as unknown as AvailabilityRow[]) || [];

      // Map availability to AvailabilityItem format
      const availability: AvailabilityItem[] = availabilityRows.map((row) => ({
        player: row.player_name,
        team: row.team,
        status: row.status as AvailabilityItem["status"],
        reason: row.reason || undefined,
      }));

      // Parse display date
      const parsedDate = safeParseDate(date);
      const displayDate = parsedDate
        ? format(parsedDate, "EEEE, MMMM d, yyyy")
        : date;

      // Build top edges (top 5)
      const topEdges = edges.slice(0, 5).map(mapToPregameEdge);

      // Build match cards
      const matches = buildMatchCards(edges);

      return {
        sport,
        date,
        displayDate,
        topEdges,
        biggestLineMoves: [], // Would need historical data to calculate
        availability,
        matches,
      };
    },
  });
}