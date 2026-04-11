import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all active merch alerts
    const { data: alerts, error } = await supabase
      .from("ap_merch_alerts")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;

    for (const alert of alerts) {
      const lastChecked = alert.last_checked_at ? new Date(alert.last_checked_at) : new Date(0);
      const alreadyMatched: string[] = alert.last_match_ids || [];

      if (alert.drop_id) {
        // Specific drop alert — check if release date is within 1 hour or passed
        const { data: drop } = await supabase
          .from("ap_merch_drops")
          .select("*")
          .eq("id", alert.drop_id)
          .single();

        if (drop?.release_date) {
          const releaseTime = new Date(drop.release_date).getTime();
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;

          if (releaseTime - now <= oneHour && !alreadyMatched.includes(drop.id)) {
            // Notify
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  user_id: alert.user_id,
                  notification_type: "ap-merch-drop",
                  title: `🛍️ Merch Drop Alert: ${drop.name}`,
                  body: `${drop.name} is ${now >= releaseTime ? "now available" : "releasing within 1 hour"}! ${drop.location || ""}`,
                  channels: { email: alert.notify_email, sms: alert.notify_sms },
                }),
              });
            } catch { /* continue */ }

            await supabase
              .from("ap_merch_alerts")
              .update({
                last_match_ids: [...alreadyMatched, drop.id],
                last_checked_at: new Date().toISOString(),
                check_count: (alert.check_count || 0) + 1,
              })
              .eq("id", alert.id);
            notified++;
          }
        }
      } else if (alert.keywords?.length) {
        // Keyword alert — find new drops matching keywords
        let query = supabase
          .from("ap_merch_drops")
          .select("*")
          .eq("brand_id", alert.brand_id)
          .is("retired_at", null)
          .gt("created_at", lastChecked.toISOString());

        const { data: newDrops } = await query;

        const matchedDrops = (newDrops || []).filter((drop: any) => {
          const text = `${drop.name} ${drop.description || ""} ${(drop.tags || []).join(" ")}`.toLowerCase();
          return alert.keywords.some((kw: string) => text.includes(kw.toLowerCase())) &&
            !alreadyMatched.includes(drop.id);
        });

        for (const drop of matchedDrops) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                user_id: alert.user_id,
                notification_type: "ap-merch-keyword",
                title: `🛍️ New Drop Matches "${alert.keywords.join(", ")}"`,
                body: `${drop.name} — ${drop.description || "Check it out!"}`,
                channels: { email: alert.notify_email, sms: alert.notify_sms },
              }),
            });
          } catch { /* continue */ }
          notified++;
        }

        if (matchedDrops.length > 0) {
          await supabase
            .from("ap_merch_alerts")
            .update({
              last_match_ids: [...alreadyMatched, ...matchedDrops.map((d: any) => d.id)],
              last_checked_at: new Date().toISOString(),
              check_count: (alert.check_count || 0) + 1,
            })
            .eq("id", alert.id);
        } else {
          await supabase
            .from("ap_merch_alerts")
            .update({
              last_checked_at: new Date().toISOString(),
              check_count: (alert.check_count || 0) + 1,
            })
            .eq("id", alert.id);
        }
      }
    }

    return new Response(JSON.stringify({ checked: alerts.length, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
