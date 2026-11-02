import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CLVData {
  edge_id: string;
  home_team: string;
  away_team: string;
  market: string;
  selection: string;
  bookmaker: string;
  fair_odds_at_bet: number;
  fair_odds_at_close: number;
  clv_percent: number;
}

export const useCLVAnalysis = () => {
  return useQuery({
    queryKey: ["edge_clv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edge_clv")
        .select("*")
        .order("clv_percent", { ascending: false });

      if (error) throw error;
      return data as CLVData[];
    },
  });
};