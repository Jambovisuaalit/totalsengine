import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PipelineHealth {
  job_name: string;
  latest_status: string;
  latest_run_at: string;
  latest_finished_at: string | null;
  latest_duration_ms: number | null;
  latest_reason: string | null;
  latest_meta: Record<string, unknown> | null;
  latest_pipeline_run_id: string | null;
  last_success_at: string | null;
}

export const usePipelineHealth = () => {
  return useQuery({
    queryKey: ["pipeline_health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_health")
        .select("*");

      if (error) throw error;
      return data as PipelineHealth[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};