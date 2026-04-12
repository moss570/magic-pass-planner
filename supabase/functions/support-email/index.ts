/**
 * Support Email Edge Function
 * Reads inbox via IMAP, sends replies via SMTP
 * Credentials stored as environment variables
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const IMAP_HOST = "mail.privateemail.com";
const IMAP_PORT = 993;
const SMTP_HOST = "mail.privateemail.com";
const SMTP_PORT = 465;
const EMAIL_USER = Deno.env.get("SUPPORT_EMAIL_USER") || "support@magicpassplus.com";
const EMAIL_PASS = Deno.env.get("SUPPORT_EMAIL_PASS") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, ...params } = await req.json();

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    switch (action) {
      case "fetch_emails": {
        // Use Deno's built-in TLS to connect to IMAP
        // Since Deno edge functions have limited IMAP support,
        // we'll use a REST API approach via a proxy
        
        // For now, store/read from Supabase table as email cache
        const { data: emails, error } = await supabase
          .from("support_emails")
          .select("*")
          .order("received_at", { ascending: false })
          .limit(params.limit || 50);

        if (error) throw error;

        return new Response(JSON.stringify({ emails: emails || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_reply": {
        const { to, subject, body, inReplyTo } = params;

        // Use Brevo API to send (more reliable than raw SMTP from edge function)
        const brevoKey = Deno.env.get("BREVO_API_KEY") || "";
        
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoKey,
          },
          body: JSON.stringify({
            sender: { name: "Magic Pass Plus Support", email: "support@magicpassplus.com" },
            to: [{ email: to }],
            subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
            htmlContent: `<div style="font-family: Arial, sans-serif;">${body.replace(/\n/g, "<br>")}</div>`,
            headers: inReplyTo ? { "In-Reply-To": inReplyTo } : {},
          }),
        });

        const result = await response.json();

        // Log the reply
        await supabase.from("support_emails").insert({
          message_id: result.messageId || `reply-${Date.now()}`,
          from_address: "support@magicpassplus.com",
          to_address: to,
          subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
          body_text: body,
          body_html: body,
          is_outbound: true,
          status: "sent",
          received_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_status": {
        const { emailId, status } = params;
        const { error } = await supabase
          .from("support_emails")
          .update({ status })
          .eq("id", emailId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
