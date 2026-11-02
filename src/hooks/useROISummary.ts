import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ROISummary {
  total_bets: number;
  units_staked: number;
  units_profit: number;
  roi_percent: number;
}

export const useROISummary = () => {
  return useQuery({
    queryKey: ["roi_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roi_summary")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as ROISummary | null;
    },
  });
};