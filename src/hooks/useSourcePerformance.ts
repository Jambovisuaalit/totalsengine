import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SourcePerformance {
  bookmaker: string;
  market: string;
  total_edges: number;
  avg_clv: number;
  positive_clv_count: number;
  hit_rate: number;
}

export interface BlacklistedSource {
  id: string;
  bookmaker: string;
  market: string | null;
  reason: string | null;
  created_at: string;
}

export const useSourcePerformance = () => {
  return useQuery({
    queryKey: ["source_performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_performance")
        .select("*")
        .order("avg_clv", { ascending: false });

      if (error) throw error;
      return data as SourcePerformance[];
    },
  });
};

export const useBlacklistedSources = () => {
  return useQuery({
    queryKey: ["blacklisted_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_blacklist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlacklistedSource[];
    },
  });
};

export const useAddToBlacklist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookmaker, market, reason }: { bookmaker: string; market?: string; reason?: string }) => {
      const { error } = await supabase
        .from("source_blacklist")
        .insert({ bookmaker, market, reason });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklisted_sources"] });
      queryClient.invalidateQueries({ queryKey: ["source_performance"] });
    },
  });
};