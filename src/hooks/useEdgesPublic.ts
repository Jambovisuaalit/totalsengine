import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EdgePublic {
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
  confidence: number;
  bookmaker: string;
  status: string;
  is_actionable: boolean;
  first_seen_at: string;
  last_seen_at: string | null;
  confirm_span_minutes: number | null;
  edge_trend: number | null;
  stake_fraction: number | null;
  updated_at: string;
  reasons: string[];
  meta: {
    hours_to_start: number;
    edge_trending: number | null;
    confirmation_minutes: number | null;
  };
}

export interface EdgeFilters {
  sport?: string;
  league?: string;
  market?: string;
  date?: string;
}

export function useEdgesPublic(filters?: EdgeFilters) {
  return useQuery({
    queryKey: ["edges_public", filters],
    queryFn: async () => {
      let query = supabase
        .from("edges_public")
        .select("*")
        .order("edge", { ascending: false });

      if (filters?.sport) {
        query = query.eq("sport", filters.sport);
      }
      if (filters?.league) {
        query = query.eq("league", filters.league);
      }
      if (filters?.market) {
        query = query.eq("market", filters.market);
      }
      if (filters?.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as unknown as EdgePublic[]) || [];
    },
  });
}

export function useEdgePublicById(id: string) {
  return useQuery({
    queryKey: ["edges_public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edges_public")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data as unknown as EdgePublic;
    },
    enabled: !!id,
  });
}