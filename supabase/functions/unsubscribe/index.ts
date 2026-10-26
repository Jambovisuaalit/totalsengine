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
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email) {
      return new Response(
        generateHtmlPage("Error", "Missing email parameter"),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // Simple token validation: hash of email + secret
    const expectedToken = await generateToken(email);
    if (token !== expectedToken) {
      console.warn("Invalid unsubscribe token for:", email);
      return new Response(
        generateHtmlPage("Error", "Invalid or expired unsubscribe link"),
        { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Soft unsubscribe - mark as inactive
    const { error } = await supabase
      .from("email_subscribers")
      .update({ 
        is_active: false, 
        unsubscribed_at: new Date().toISOString() 
      })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Unsubscribed:", email);

    return new Response(
      generateHtmlPage(
        "Unsubscribed", 
        "You have been successfully unsubscribed from Doctore AI emails. You will no longer receive daily summaries."
      ),
      { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in unsubscribe:", error);
    return new Response(
      generateHtmlPage("Error", "Something went wrong. Please try again later."),
      { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );
  }
});

async function generateToken(email: string): Promise<string> {
  const secret = Deno.env.get("UNSUBSCRIBE_SECRET") || "default-secret";
  const data = new TextEncoder().encode(email.toLowerCase().trim() + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateHtmlPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Doctore AI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #0a0a0a;
      color: #fafafa;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    p {
      color: #a1a1aa;
      line-height: 1.6;
    }
    a {
      color: #22c55e;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 2rem;"><a href="https://doctore.lovable.app">← Back to Doctore AI</a></p>
  </div>
</body>
</html>
  `;
}

// Export for use in email functions
export { generateToken };