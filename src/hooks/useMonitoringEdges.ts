import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonitoringEdge {
  id: string;
  game_id: string;
  market: string;
  selection: string;
  fair_odds: number;
  execution_odds: number;
  edge_percent: number;
  bookmaker: string;
  status: string;
  snapshot_count: number;
  first_seen_at: string;
  last_seen_at: string | null;
  confirm_span_minutes: number | null;
  game: {
    league: string;
    home_team: string;
    away_team: string;
    start_time: string;
  };
}

export const useMonitoringEdges = () => {
  return useQuery({
    queryKey: ["monitoring_edges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edges")
        .select(`
          id,
          game_id,
          market,
          selection,
          fair_odds,
          execution_odds,
          edge_percent,
          bookmaker,
          status,
          snapshot_count,
          first_seen_at,
          last_seen_at,
          confirm_span_minutes,
          game:games (
            league,
            home_team,
            away_team,
            start_time
          )
        `)
        .in("status", ["new", "confirming"])
        .order("edge_percent", { ascending: false });

      if (error) throw error;
      
      return (data as unknown as MonitoringEdge[]).filter(
        (edge) => edge.game !== null
      );
    },
  });
};