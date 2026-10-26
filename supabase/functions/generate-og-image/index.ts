import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OGImageRequest {
  edgeId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  edge: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { edgeId, homeTeam, awayTeam, league, market, edge }: OGImageRequest = await req.json();

    if (!edgeId || !homeTeam || !awayTeam) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if OG image already exists
    const { data: existingFile } = await supabase.storage
      .from("og-images")
      .list("", { search: `${edgeId}.png` });

    if (existingFile && existingFile.length > 0) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/og-images/${edgeId}.png`;
      return new Response(
        JSON.stringify({ imageUrl: publicUrl, cached: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OG image using Lovable AI
    const edgePercent = (edge * 100).toFixed(1);
    const prompt = `Create a professional, dark-themed OG image (1200x630 pixels) for a sports market analysis article.

Design requirements:
- Dark background (deep navy or charcoal, #0f172a or similar)
- Clean, modern typography
- Subtle gradient or geometric patterns for visual interest
- No photos or realistic imagery

Content to display:
- Large header: "Doctore AI" (top, prominent)
- Match: "${awayTeam} @ ${homeTeam}"
- League badge area: "${league}"
- Market type: "${market}"
- Edge indicator: "+${edgePercent}%" in a highlighted accent color (green/teal)
- Small footer text: "Informational. Non-advisory."

Style: Minimalist, professional, fintech/sports analytics aesthetic. High contrast text on dark background. 1200x630 aspect ratio exactly.`;

    console.log("Generating OG image for edge:", edgeId);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI generation failed:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("No image generated");
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("og-images")
      .upload(`${edgeId}.png`, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/og-images/${edgeId}.png`;
    console.log("OG image generated and uploaded:", publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, cached: false }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});