export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_fetch_log: {
        Row: {
          fetched_at: string
          id: string
          reason: string | null
          source: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          reason?: string | null
          source: string
        }
        Update: {
          fetched_at?: string
          id?: string
          reason?: string | null
          source?: string
        }
        Relationships: []
      }
      bet_results: {
        Row: {
          edge_id: string | null
          id: string
          notes: string | null
          odds_taken: number
          placed_at: string | null
          pnl: number | null
          result: string | null
          settled_at: string | null
          stake_fraction: number
        }
        Insert: {
          edge_id?: string | null
          id?: string
          notes?: string | null
          odds_taken: number
          placed_at?: string | null
          pnl?: number | null
          result?: string | null
          settled_at?: string | null
          stake_fraction: number
        }
        Update: {
          edge_id?: string | null
          id?: string
          notes?: string | null
          odds_taken?: number
          placed_at?: string | null
          pnl?: number | null
          result?: string | null
          settled_at?: string | null
          stake_fraction?: number
        }
        Relationships: [
          {
            foreignKeyName: "bet_results_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edge_clv"
            referencedColumns: ["edge_id"]
          },
          {
            foreignKeyName: "bet_results_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_results_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges_public"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_history: {
        Row: {
          bookmaker: string
          captured_at: string
          edge_id: string | null
          edge_percent: number
          execution_odds: number
          fair_odds: number
          game_id: string | null
          id: string
          market: string
          selection: string
        }
        Insert: {
          bookmaker: string
          captured_at?: string
          edge_id?: string | null
          edge_percent: number
          execution_odds: number
          fair_odds: number
          game_id?: string | null
          id?: string
          market: string
          selection: string
        }
        Update: {
          bookmaker?: string
          captured_at?: string
          edge_id?: string | null
          edge_percent?: number
          execution_odds?: number
          fair_odds?: number
          game_id?: string | null
          id?: string
          market?: string
          selection?: string
        }
        Relationships: [
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edge_clv"
            referencedColumns: ["edge_id"]
          },
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      edges: {
        Row: {
          bookmaker: string
          confirm_span_minutes: number | null
          consecutive_stable_runs: number | null
          created_at: string | null
          edge_percent: number
          edge_trend: number | null
          execution_odds: number
          fair_odds: number
          first_seen_at: string | null
          game_id: string | null
          id: string
          is_actionable: boolean | null
          last_seen_at: string | null
          last_snapshot_at: string | null
          market: string
          selection: string
          snapshot_count: number | null
          stake_fraction: number | null
          status: string | null
        }
        Insert: {
          bookmaker: string
          confirm_span_minutes?: number | null
          consecutive_stable_runs?: number | null
          created_at?: string | null
          edge_percent: number
          edge_trend?: number | null
          execution_odds: number
          fair_odds: number
          first_seen_at?: string | null
          game_id?: string | null
          id?: string
          is_actionable?: boolean | null
          last_seen_at?: string | null
          last_snapshot_at?: string | null
          market: string
          selection: string
          snapshot_count?: number | null
          stake_fraction?: number | null
          status?: string | null
        }
        Update: {
          bookmaker?: string
          confirm_span_minutes?: number | null
          consecutive_stable_runs?: number | null
          created_at?: string | null
          edge_percent?: number
          edge_trend?: number | null
          execution_odds?: number
          fair_odds?: number
          first_seen_at?: string | null
          game_id?: string | null
          id?: string
          is_actionable?: boolean | null
          last_seen_at?: string | null
          last_snapshot_at?: string | null
          market?: string
          selection?: string
          snapshot_count?: number | null
          stake_fraction?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      execution_odds: {
        Row: {
          bookmaker: string
          fetched_at: string | null
          game_id: string | null
          id: string
          market: string
          odds: number
          selection: string
        }
        Insert: {
          bookmaker: string
          fetched_at?: string | null
          game_id?: string | null
          id?: string
          market: string
          odds: number
          selection: string
        }
        Update: {
          bookmaker?: string
          fetched_at?: string | null
          game_id?: string | null
          id?: string
          market?: string
          odds?: number
          selection?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_odds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      fair_odds: {
        Row: {
          calculated_at: string
          fair_odds: number
          game_id: string | null
          id: string
          margin_removed: number
          market: string
          selection: string
        }
        Insert: {
          calculated_at?: string
          fair_odds: number
          game_id?: string | null
          id?: string
          margin_removed: number
          market: string
          selection: string
        }
        Update: {
          calculated_at?: string
          fair_odds?: number
          game_id?: string | null
          id?: string
          margin_removed?: number
          market?: string
          selection?: string
        }
        Relationships: [
          {
            foreignKeyName: "fair_odds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_team: string
          created_at: string
          external_id: string
          home_team: string
          id: string
          league: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          away_team: string
          created_at?: string
          external_id: string
          home_team: string
          id?: string
          league: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_team?: string
          created_at?: string
          external_id?: string
          home_team?: string
          id?: string
          league?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          duration_ms: number | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          job_name: string
          meta: Json | null
          pipeline_run_id: string | null
          reason: string | null
          started_at: string
          status: string
        }
        Insert: {
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_name: string
          meta?: Json | null
          pipeline_run_id?: string | null
          reason?: string | null
          started_at?: string
          status: string
        }
        Update: {
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_name?: string
          meta?: Json | null
          pipeline_run_id?: string | null
          reason?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pinnacle_odds: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          market: string
          odds: number
          scraped_at: string
          selection: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          market: string
          odds: number
          scraped_at?: string
          selection: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          market?: string
          odds?: number
          scraped_at?: string
          selection?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinnacle_odds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          edges_found: number | null
          id: string
          new_edges: number | null
          next_run_reason: string | null
          should_run_again: boolean | null
          stable_edges: number | null
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          edges_found?: number | null
          id?: string
          new_edges?: number | null
          next_run_reason?: string | null
          should_run_again?: boolean | null
          stable_edges?: number | null
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          edges_found?: number | null
          id?: string
          new_edges?: number | null
          next_run_reason?: string | null
          should_run_again?: boolean | null
          stable_edges?: number | null
          started_at?: string | null
        }
        Relationships: []
      }
      player_availability: {
        Row: {
          created_at: string
          game_date: string | null
          id: string
          league: string
          player_name: string
          reason: string | null
          scraped_at: string
          source: string | null
          source_url: string | null
          sport: string
          status: string
          team: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_date?: string | null
          id?: string
          league: string
          player_name: string
          reason?: string | null
          scraped_at?: string
          source?: string | null
          source_url?: string | null
          sport: string
          status: string
          team: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_date?: string | null
          id?: string
          league?: string
          player_name?: string
          reason?: string | null
          scraped_at?: string
          source?: string | null
          source_url?: string | null
          sport?: string
          status?: string
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      source_blacklist: {
        Row: {
          bookmaker: string
          created_at: string | null
          id: string
          market: string | null
          reason: string | null
        }
        Insert: {
          bookmaker: string
          created_at?: string | null
          id?: string
          market?: string | null
          reason?: string | null
        }
        Update: {
          bookmaker?: string
          created_at?: string | null
          id?: string
          market?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      sql_query_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          query_text: string
          row_count: number | null
          runtime_ms: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          query_text: string
          row_count?: number | null
          runtime_ms?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          query_text?: string
          row_count?: number | null
          runtime_ms?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sql_saved_queries: {
        Row: {
          created_at: string
          id: string
          name: string
          query_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          query_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          query_text?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      blacklist_suggestions: {
        Row: {
          avg_clv: number | null
          bookmaker: string | null
          hit_rate: number | null
          market: string | null
          reason: string | null
          should_blacklist: boolean | null
          total_edges: number | null
        }
        Relationships: []
      }
      edge_clv: {
        Row: {
          away_team: string | null
          bookmaker: string | null
          clv_percent: number | null
          edge_id: string | null
          fair_odds_at_bet: number | null
          fair_odds_at_close: number | null
          home_team: string | null
          market: string | null
          selection: string | null
        }
        Relationships: []
      }
      edge_stats: {
        Row: {
          avg_edge: number | null
          edge_id: string | null
          first_seen_at: string | null
          last_edge: number | null
          last_seen_at: string | null
          snapshots: number | null
          span_minutes: number | null
          trend_last2: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edge_clv"
            referencedColumns: ["edge_id"]
          },
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edge_history_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges_public"
            referencedColumns: ["id"]
          },
        ]
      }
      edges_public: {
        Row: {
          away_team: string | null
          book_odds: number | null
          bookmaker: string | null
          confidence: number | null
          confirm_span_minutes: number | null
          edge: number | null
          edge_trend: number | null
          fair_odds: number | null
          first_seen_at: string | null
          home_team: string | null
          id: string | null
          is_actionable: boolean | null
          last_seen_at: string | null
          league: string | null
          market: string | null
          meta: Json | null
          model_prob: number | null
          reasons: Json | null
          selection: string | null
          sport: string | null
          stake_fraction: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      pipeline_health: {
        Row: {
          job_name: string | null
          last_success_at: string | null
          latest_duration_ms: number | null
          latest_finished_at: string | null
          latest_meta: Json | null
          latest_pipeline_run_id: string | null
          latest_reason: string | null
          latest_run_at: string | null
          latest_status: string | null
        }
        Insert: {
          job_name?: string | null
          last_success_at?: never
          latest_duration_ms?: number | null
          latest_finished_at?: string | null
          latest_meta?: Json | null
          latest_pipeline_run_id?: string | null
          latest_reason?: string | null
          latest_run_at?: string | null
          latest_status?: string | null
        }
        Update: {
          job_name?: string | null
          last_success_at?: never
          latest_duration_ms?: number | null
          latest_finished_at?: string | null
          latest_meta?: Json | null
          latest_pipeline_run_id?: string | null
          latest_reason?: string | null
          latest_run_at?: string | null
          latest_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_pipeline_run_id_fkey"
            columns: ["latest_pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_summary: {
        Row: {
          roi_percent: number | null
          total_bets: number | null
          units_profit: number | null
          units_staked: number | null
        }
        Relationships: []
      }
      source_performance: {
        Row: {
          avg_clv: number | null
          bookmaker: string | null
          hit_rate: number | null
          market: string | null
          positive_clv_count: number | null
          total_edges: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_data: { Args: never; Returns: undefined }
      cleanup_rate_limit_log: { Args: never; Returns: undefined }
      invoke_error_alert: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const