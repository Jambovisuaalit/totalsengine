import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EdgeHistoryPoint {
  id: string;
  edge_id: string;
  fair_odds: number;
  execution_odds: number;
  edge_percent: number;
  captured_at: string;
}

export const useEdgeHistory = (edgeId: string | null) => {
  return useQuery({
    queryKey: ["edge_history", edgeId],
    queryFn: async () => {
      if (!edgeId) return [];
      
      const { data, error } = await supabase
        .from("edge_history")
        .select("id, edge_id, fair_odds, execution_odds, edge_percent, captured_at")
        .eq("edge_id", edgeId)
        .order("captured_at", { ascending: true });

      if (error) throw error;
      return data as EdgeHistoryPoint[];
    },
    enabled: !!edgeId,
  });
};