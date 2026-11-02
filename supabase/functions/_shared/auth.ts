/**
 * Shared authentication utilities for Edge Functions
 * 
 * These functions should be used by internal/pipeline functions
 * to protect against unauthorized invocation.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Validates that the request contains a valid internal API key.
 * Used for pipeline/cron functions that should not be publicly callable.
 * 
 * Returns null if authorized, or a Response object if unauthorized.
 */
export function requireInternalAuth(req: Request): Response | null {
  const apiKey = req.headers.get("x-api-key");
  const validKey = Deno.env.get("ADMIN_API_KEY");

  if (!validKey) {
    console.error("ADMIN_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!apiKey || apiKey !== validKey) {
    console.warn("Unauthorized request - missing or invalid API key");
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null;
}

export { corsHeaders };