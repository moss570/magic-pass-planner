import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

// Known travel confirmation sender domains
const ALLOWED_SENDER_DOMAINS = [
  "disneyworld.disney.go.com", "disney.go.com", "wdw.disney.com",
  "marriott.com", "hilton.com", "ihg.com", "hyatt.com", "bestwestern.com",
  "wyndham.com", "choicehotels.com", "radissonhotels.com",
  "delta.com", "aa.com", "united.com", "southwest.com", "jetblue.com",
  "spirit.com", "frontier.com", "allegiantair.com",
  "expedia.com", "booking.com", "hotels.com", "kayak.com", "priceline.com",
  "travelocity.com", "orbitz.com", "tripadvisor.com",
  "enterprise.com", "hertz.com", "avis.com", "budget.com", "national.com",
  "opentable.com", "resy.com",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();

    // Handle SNS subscription confirmation
    if (body.Type === "SubscriptionConfirmation") {
      const subscribeUrl = body.SubscribeURL;
      if (subscribeUrl) {
        await fetch(subscribeUrl);
      }
      return new Response(JSON.stringify({ confirmed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle SNS notification
    if (body.Type === "Notification") {
      const message = typeof body.Message === "string" ? JSON.parse(body.Message) : body.Message;
      return await processInboundEmail(supabase, message);
    }

    // Direct invocation for testing
    if (body.rawTo || body.raw_to) {
      return await processInboundEmail(supabase, body);
    }

    return new Response(JSON.stringify({ error: "Unknown payload type" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("inbound-email-handler error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processInboundEmail(supabase: any, message: any) {
  const rawTo = message.rawTo || message.raw_to || "";
  const rawFrom = message.rawFrom || message.raw_from || "";
  const subject = message.subject || "";
  const messageId = message.messageId || message.message_id || crypto.randomUUID();
  const s3Key = message.s3Key || message.s3_key || "";
  const emailBody = message.body || message.content || "";

  // Extract forwarding token from address: trips+<token>@inbox.magicpassplus.com
  const tokenMatch = rawTo.match(/trips\+([A-Za-z0-9_-]{16})@/);
  const forwardingToken = tokenMatch ? tokenMatch[1] : null;

  if (!forwardingToken) {
    await logEvent(supabase, {
      raw_to: rawTo, raw_from: rawFrom, subject, message_id: messageId,
      s3_key: s3Key, status: "rejected_token", reject_reason: "No forwarding token in address",
    });
    return new Response(JSON.stringify({ error: "Invalid address" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Look up user by token
  const { data: profile } = await supabase
    .from("users_profile")
    .select("id, trusted_senders")
    .eq("forwarding_token", forwardingToken)
    .single();

  if (!profile) {
    await logEvent(supabase, {
      raw_to: rawTo, raw_from: rawFrom, subject, message_id: messageId,
      s3_key: s3Key, status: "rejected_token", reject_reason: "Unknown forwarding token",
    });
    return new Response(JSON.stringify({ error: "Unknown token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const userId = profile.id;

  // SPF/DKIM domain check
  const senderDomain = rawFrom.split("@")[1]?.toLowerCase();
  const isAllowedDomain = senderDomain && ALLOWED_SENDER_DOMAINS.some(
    d => senderDomain === d || senderDomain.endsWith(`.${d}`)
  );

  if (!isAllowedDomain) {
    await logEvent(supabase, {
      user_id: userId, raw_to: rawTo, raw_from: rawFrom, subject, message_id: messageId,
      s3_key: s3Key, status: "rejected_spf", reject_reason: `Sender domain ${senderDomain} not in allow-list`,
    });
    return new Response(JSON.stringify({ error: "Sender not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  // Rate limit: max 50 per 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("inbound_email_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("processed_at", twentyFourHoursAgo);

  if ((count || 0) >= 50) {
    await logEvent(supabase, {
      user_id: userId, raw_to: rawTo, raw_from: rawFrom, subject, message_id: messageId,
      s3_key: s3Key, status: "rejected_rate_limit", reject_reason: "Exceeded 50 emails in 24h",
    });
    return new Response(JSON.stringify({ error: "Rate limited" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 429,
    });
  }

  // Check trusted senders
  const trustedSenders: string[] = profile.trusted_senders || [];
  const isTrusted = trustedSenders.includes(rawFrom.toLowerCase());

  // Call reservations-parse
  const parseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/reservations-parse`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const parseResponse = await fetch(parseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      userId,
      source: "forward",
      rawContent: emailBody,
      senderEmail: rawFrom,
      attachments: [],
    }),
  });

  const parseResult = await parseResponse.json();

  // If first email from this sender, force pending_review
  if (!isTrusted && parseResult.reservation?.id) {
    await supabase
      .from("reservations_inbox")
      .update({ status: "pending_review" })
      .eq("id", parseResult.reservation.id);
  }

  // Log success
  await logEvent(supabase, {
    user_id: userId, raw_to: rawTo, raw_from: rawFrom, subject, message_id: messageId,
    s3_key: s3Key, status: "success",
    reservation_id: parseResult.reservation?.id || null,
  });

  return new Response(JSON.stringify({ success: true, reservation: parseResult.reservation }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function logEvent(supabase: any, event: any) {
  try {
    await supabase.from("inbound_email_events").insert(event);
  } catch (err) {
    console.error("Failed to log inbound email event:", err);
  }
}
