import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { JobLogger } from "../_shared/job-logger.ts";
import { withRetry } from "../_shared/retry.ts";
import { requireInternalAuth, corsHeaders } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function generateUnsubscribeToken(email: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase().trim() + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface PricingDiscrepancy {
  id: string;
  edge_percent: number;
  bookmaker: string;
  market: string;
  selection: string;
  execution_odds: number;
  fair_odds: number;
  snapshot_count: number;
  confirm_span_minutes: number;
  game: {
    home_team: string;
    away_team: string;
    league: string;
    start_time: string;
  } | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require API key authentication for internal functions
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const hourStr = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

  // Create job logger with hourly idempotency key
  const jobLogger = new JobLogger(supabase, { 
    jobName: "send-pregame-email",
    idempotencyKey: `pregame-email-${hourStr}`,
  });

  try {
    console.log("Checking for pre-game email trigger...");

    // STRICT IDEMPOTENCY: Check if already sent this hour
    const { exists, existingRun } = await jobLogger.checkIdempotency();
    if (exists) {
      console.log("Pre-game email already sent this hour, skipping");
      await jobLogger.skipped("Already sent this hour", { 
        previous_run_at: existingRun?.finished_at 
      });
      return new Response(
        JSON.stringify({ skipped: true, reason: "Already sent this hour" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active subscribers from the database
    const { data: subscribers, error: subscribersError } = await supabase
      .from("email_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      throw subscribersError;
    }

    const emailFrom = Deno.env.get("SUMMARY_EMAIL_FROM") || "Doctore AI <onboarding@resend.dev>";
    const emailTo = subscribers?.map(s => s.email) || [];

    if (emailTo.length === 0) {
      console.log("No active subscribers");
      await jobLogger.skipped("No active subscribers", { recipients: 0 });
      return new Response(
        JSON.stringify({ skipped: true, reason: "No active subscribers" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${emailTo.length} active subscribers`);

    // Find today's games and check if first one starts within 75-105 minutes
    const { data: todaysGames, error: gamesError } = await supabase
      .from("games")
      .select("id, start_time, home_team, away_team, league")
      .eq("status", "scheduled")
      .gte("start_time", `${todayStr}T00:00:00Z`)
      .lte("start_time", `${todayStr}T23:59:59Z`)
      .order("start_time", { ascending: true })
      .limit(1);

    if (gamesError) {
      console.error("Error fetching games:", gamesError);
      throw gamesError;
    }

    if (!todaysGames || todaysGames.length === 0) {
      console.log("No games scheduled for today");
      await jobLogger.skipped("No games today", { date: todayStr });
      return new Response(
        JSON.stringify({ skipped: true, reason: "No games today" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstGame = todaysGames[0];
    const gameTime = new Date(firstGame.start_time);
    const minutesUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60);

    console.log(`First game: ${firstGame.away_team} @ ${firstGame.home_team} in ${minutesUntilGame.toFixed(0)} minutes`);

    // Only send if game is 75-105 minutes away (window to catch ~90 min mark)
    if (minutesUntilGame < 75 || minutesUntilGame > 105) {
      console.log(`Not in trigger window (75-105 min), currently ${minutesUntilGame.toFixed(0)} min away`);
      await jobLogger.skipped(
        `First game in ${minutesUntilGame.toFixed(0)} minutes, outside 75-105 min window`,
        { minutes_until_game: Math.round(minutesUntilGame) }
      );
      return new Response(
        JSON.stringify({ 
          skipped: true, 
          reason: `First game in ${minutesUntilGame.toFixed(0)} minutes, outside 75-105 min window` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await jobLogger.start();

    // Fetch pricing discrepancies for today (informational only)
    const { data: discrepancies, error: betsError } = await supabase
      .from("edges")
      .select(`
        id,
        edge_percent,
        bookmaker,
        market,
        selection,
        execution_odds,
        fair_odds,
        snapshot_count,
        confirm_span_minutes,
        game:games!edges_game_id_fkey (
          home_team,
          away_team,
          league,
          start_time
        )
      `)
      .eq("status", "stable")
      .eq("is_actionable", true)
      .order("created_at", { ascending: false });

    if (betsError) {
      console.error("Error fetching discrepancies:", betsError);
      throw betsError;
    }

    // Filter to today's games and normalize
    const todaysDiscrepancies: PricingDiscrepancy[] = (discrepancies || [])
      .map((item: unknown) => {
        const b = item as Record<string, unknown>;
        return {
          ...b,
          game: Array.isArray(b.game) ? b.game[0] : b.game,
        } as PricingDiscrepancy;
      })
      .filter((item: PricingDiscrepancy) => {
        if (!item.game?.start_time) return false;
        const gameDate = new Date(item.game.start_time).toISOString().split("T")[0];
        return gameDate === todayStr;
      });

    console.log(`Found ${todaysDiscrepancies.length} pricing discrepancies for today`);

    // Get CLV data for informational display
    const { data: clvData } = await supabase
      .from("edge_clv")
      .select("clv_percent");

    const avgClv = clvData && clvData.length > 0
      ? clvData.reduce((sum, row) => sum + (row.clv_percent || 0), 0) / clvData.length
      : null;

    const clvDisplay = avgClv !== null
      ? `${avgClv >= 0 ? "+" : ""}${avgClv.toFixed(2)}%`
      : "N/A";

    // Build email - INFORMATIONAL ONLY
    const gameTimeFormatted = gameTime.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      timeZone: "UTC" 
    }) + " UTC";

    const emailSubject = `Doctore - Pre-Game Market Analysis (${todayStr})`;

    let emailBody = `
DOCTORE - PRE-GAME MARKET ANALYSIS
Date: ${todayStr}
First game starts: ${gameTimeFormatted} (in ~${Math.round(minutesUntilGame)} minutes)

================================================================================
DISCLAIMER
================================================================================

This email contains informational market analysis only. 
It does not constitute betting advice, recommendations, or suggestions.
All data is for educational and research purposes.

================================================================================
PRICING DISCREPANCIES DETECTED
================================================================================
`;

    if (todaysDiscrepancies.length === 0) {
      emailBody += `
No significant pricing discrepancies detected today.
`;
    } else {
      todaysDiscrepancies.forEach((item, index) => {
        const betGameTime = item.game?.start_time 
          ? new Date(item.game.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
          : "TBD";

        const impliedProb = item.execution_odds > 0 ? (1 / item.execution_odds * 100).toFixed(1) : "N/A";
        const fairProb = item.fair_odds > 0 ? (1 / item.fair_odds * 100).toFixed(1) : "N/A";

        emailBody += `
${index + 1}. ${item.game?.league || "Unknown League"}
   Match: ${item.game?.away_team || "Away"} @ ${item.game?.home_team || "Home"}
   Time: ${betGameTime}
   Market: ${item.market} - ${item.selection}
   Source: ${item.bookmaker}
   
   Offered Odds: ${item.execution_odds?.toFixed(2) || "N/A"} (implied: ${impliedProb}%)
   Model Fair Odds: ${item.fair_odds?.toFixed(2) || "N/A"} (implied: ${fairProb}%)
   Discrepancy: ${item.edge_percent?.toFixed(2) || "0"}%
`;
      });
    }

    emailBody += `
================================================================================
MODEL PERFORMANCE (CLV)
================================================================================

Average Closing Line Value: ${clvDisplay}

================================================================================

This is an automated market analysis from Doctore.
For educational and informational purposes only.
Not betting advice. Please gamble responsibly.

To unsubscribe, visit: {UNSUBSCRIBE_LINK}
`;

    console.log(`Sending pre-game email to ${emailTo.length} subscribers`);

    // Send individual emails with personalized unsubscribe links
    const supabaseProjectUrl = Deno.env.get("SUPABASE_URL")!;
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") || "default-secret";
    
    const emailPromises = emailTo.map(async (recipientEmail) => {
      const token = await generateUnsubscribeToken(recipientEmail, unsubscribeSecret);
      const unsubscribeLink = `${supabaseProjectUrl}/functions/v1/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${token}`;
      const personalizedBody = emailBody.replace("{UNSUBSCRIBE_LINK}", unsubscribeLink);
      
      // Resend call with retry logic
      return withRetry(
        () => resend.emails.send({
          from: emailFrom,
          to: [recipientEmail],
          subject: emailSubject,
          text: personalizedBody,
        }),
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          onRetry: (attempt, error, delayMs) => {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            console.log(`[Resend] Retry ${attempt} for ${recipientEmail}: ${errorMsg}, waiting ${delayMs}ms`);
          },
        }
      );
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successCount = emailResults.filter(r => r.status === "fulfilled").length;
    const failedCount = emailResults.filter(r => r.status === "rejected").length;
    console.log(`Pre-game emails sent: ${successCount}/${emailTo.length}`);

    await jobLogger.success({
      date: todayStr,
      recipients: emailTo.length,
      emails_sent: successCount,
      emails_failed: failedCount,
      discrepancies_found: todaysDiscrepancies.length,
      minutes_until_first_game: Math.round(minutesUntilGame),
    });

    return new Response(
      JSON.stringify({
        success: true,
        date: todayStr,
        first_game_in_minutes: Math.round(minutesUntilGame),
        discrepancies_found: todaysDiscrepancies.length,
        emails_sent: emailTo.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-pregame-email-summary:", error);
    await jobLogger.error(errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});