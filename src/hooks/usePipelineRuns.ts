import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PipelineRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  edges_found: number;
  stable_edges: number;
  new_edges: number;
  should_run_again: boolean;
  next_run_reason: string | null;
}

export const usePipelineRuns = () => {
  return useQuery({
    queryKey: ["pipeline_runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PipelineRun[];
    },
  });
};

export const useLatestPipelineRun = () => {
  return useQuery({
    queryKey: ["latest_pipeline_run"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as PipelineRun | null;
    },
  });
};