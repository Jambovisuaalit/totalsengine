import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple admin key check (use a secret for production)
    const url = new URL(req.url);
    const adminKey = url.searchParams.get("key");
    const expectedKey = Deno.env.get("ADMIN_API_KEY");

    if (!expectedKey) {
      console.error("ADMIN_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Admin access not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (adminKey !== expectedKey) {
      console.warn("Invalid admin key attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all subscribers
    const { data: subscribers, error } = await supabase
      .from("email_subscribers")
      .select("id, email, subscribed_at, is_active, unsubscribed_at")
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    const activeCount = subscribers?.filter(s => s.is_active).length || 0;
    const totalCount = subscribers?.length || 0;

    console.log(`Fetched ${totalCount} subscribers (${activeCount} active)`);

    return new Response(
      JSON.stringify({
        total: totalCount,
        active: activeCount,
        inactive: totalCount - activeCount,
        subscribers: subscribers || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in admin-subscribers:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch subscribers" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});