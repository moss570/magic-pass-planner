import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry failed/pending notifications that are less than 2 hours old
// and have been attempted fewer than 5 times.
// Schedule this with pg_cron every 2 minutes.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Find unsent notifications that are recent and under retry limit
    const { data: pendingNotifs, error } = await supabase
      .from("dining_notifications")
      .select("id")
      .is("sent_at", null)
      .or("retry_count.is.null,retry_count.lt.5")
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: true })
      .limit(30);

    if (error) throw error;

    if (!pendingNotifs || pendingNotifs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications", retried: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[RETRY-NOTIFICATIONS] Found ${pendingNotifs.length} pending notifications`);

    let successCount = 0;
    let failCount = 0;

    for (const notif of pendingNotifs) {
      try {
        const resp = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ notification_id: notif.id }),
          }
        );

        if (resp.ok) {
          const result = await resp.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`[RETRY-NOTIFICATIONS] Error retrying ${notif.id}:`, err);
        failCount++;
      }

      // Small delay between retries to avoid overwhelming providers
      await new Promise((r) => setTimeout(r, 500));
    }

    // Mark notifications that have hit the retry limit as permanently failed
    await supabase
      .from("dining_notifications")
      .update({ delivery_status: "failed" })
      .is("sent_at", null)
      .gte("retry_count", 5);

    const result = {
      retried: pendingNotifs.length,
      succeeded: successCount,
      failed: failCount,
    };

    console.log("[RETRY-NOTIFICATIONS] Complete", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[RETRY-NOTIFICATIONS] FATAL:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
