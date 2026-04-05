import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DINING-CHECK] ${step}${detailsStr}`);
};

// Solve Akamai's proof-of-work challenge
// Disney uses this to block simple bots - but we can solve it mathematically
async function solvePoWChallenge(nonce: string, difficulty: number): Promise<string> {
  const encoder = new TextEncoder();
  const target = BigInt(2 ** 256) / BigInt(difficulty);
  
  for (let i = 0; i < 1000000; i++) {
    const attempt = `${nonce}${i}`;
    const data = encoder.encode(attempt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to BigInt for comparison
    let hashVal = BigInt(0);
    for (const byte of hashArray) {
      hashVal = (hashVal << BigInt(8)) | BigInt(byte);
    }
    
    if (hashVal < target) {
      logStep("PoW solved", { attempts: i, nonce: attempt.slice(0, 30) });
      return attempt;
    }
  }
  throw new Error("Could not solve PoW challenge");
}

// Get a valid Disney session by solving the Akamai PoW challenge
async function getDisneySession(): Promise<string | null> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://disneyworld.disney.go.com",
    "Referer": "https://disneyworld.disney.go.com/dine-res/availability/",
    "x-correlation-id": crypto.randomUUID(),
    "x-conversation-id": crypto.randomUUID(),
  };

  try {
    // Step 1: Hit the availability endpoint to get the challenge
    const challengeRes = await fetch(
      "https://disneyworld.disney.go.com/dine-res/api/availability/2/2026-05-01,2026-05-01/00:00:00,23:59:59?trim=facets,media,webLinks,mediaGalleries,sortProductName&trimExclude=dining-events,diningEvent",
      { headers }
    );

    const challengeText = await challengeRes.text();
    
    // Check if we got a PoW challenge
    if (challengeRes.status === 428 || challengeText.includes("sec-cp-challenge")) {
      const challenge = JSON.parse(challengeText);
      logStep("Got PoW challenge", { difficulty: challenge.difficulty, provider: challenge.provider });

      // Step 2: Solve the PoW
      const solution = await solvePoWChallenge(challenge.nonce, challenge.difficulty);
      
      // Step 3: Submit the solution to Disney's verify endpoint
      const verifyRes = await fetch(`https://disneyworld.disney.go.com${challenge.verify_url}`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nonce: challenge.nonce,
          solution: solution,
          token: challenge.token,
          timestamp: challenge.timestamp,
        }),
      });

      const verifyCookies = verifyRes.headers.get("set-cookie");
      logStep("PoW verification", { status: verifyRes.status, hasCookie: !!verifyCookies });
      
      if (verifyRes.ok && verifyCookies) {
        return verifyCookies;
      }
      
      // Try getting cookies from the response body
      const verifyData = await verifyRes.text();
      logStep("Verify response", { body: verifyData.slice(0, 200) });
      return verifyCookies;
    }

    // If no challenge, we might already have access
    if (challengeRes.ok) {
      logStep("No challenge needed - direct access");
      return challengeRes.headers.get("set-cookie");
    }

    logStep("Unexpected response", { status: challengeRes.status, body: challengeText.slice(0, 200) });
    return null;

  } catch (err) {
    logStep("Session error", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

// Check availability for a specific restaurant, date, party size
async function checkAvailability(
  restaurantId: string,
  date: string,
  partySize: number,
  mealPeriods: string[],
  session: string | null
): Promise<{ available: boolean; times: string[]; bookingUrls: string[] }> {
  
  const mealPeriodCode = mealPeriods.includes("Dinner") ? "80000714" :
                          mealPeriods.includes("Lunch") ? "80000712" :
                          mealPeriods.includes("Breakfast") ? "80000711" : "80000714";

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://disneyworld.disney.go.com",
    "Referer": "https://disneyworld.disney.go.com/dine-res/availability/",
    "x-correlation-id": crypto.randomUUID(),
  };

  if (session) {
    headers["Cookie"] = session;
  }

  // Try the new dine-res API first
  const endpoint = `https://disneyworld.disney.go.com/dine-res/api/availability/${partySize}/${date},${date}/00:00:00,23:59:59?trim=facets,media,webLinks,mediaGalleries,sortProductName&trimExclude=dining-events,diningEvent`;
  
  try {
    const res = await fetch(endpoint, { headers });
    
    if (res.ok) {
      const data = await res.json();
      logStep("Got availability data", { keys: Object.keys(data).slice(0, 5) });
      
      // Parse the response for this specific restaurant
      const results = data?.availability || data?.results || data;
      
      // Look for the restaurant in results
      if (results && typeof results === 'object') {
        const restaurantData = results[restaurantId] || 
          Object.values(results).find((r: any) => 
            r?.id === restaurantId || r?.entityId?.includes(restaurantId)
          );
        
        if (restaurantData && (restaurantData as any).hasAvailability) {
          const offers = (restaurantData as any).offers || (restaurantData as any).singleLocation?.offers || [];
          const times = offers.map((o: any) => o.label || o.time || "Available");
          const urls = offers.map((o: any) => 
            `https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=${o.url || o.id}`
          );
          return { available: true, times, bookingUrls: urls };
        }
      }
      
      return { available: false, times: [], bookingUrls: [] };
    }
    
    // If new endpoint fails, try the old ADRFinder endpoint  
    const oldEndpoint = `https://disneyworld.disney.go.com/finder/api/v1/explorer-service/dining-availability-list/false/wdw/80007798;entityType=destination/${date}/${partySize}/?mealPeriod=${mealPeriodCode}`;
    
    const oldRes = await fetch(oldEndpoint, { headers });
    logStep("Old endpoint response", { status: oldRes.status });
    
    if (oldRes.ok) {
      const oldData = await oldRes.json();
      const restaurantAvail = oldData?.availability?.[restaurantId];
      
      if (restaurantAvail?.hasAvailability) {
        const offers = restaurantAvail?.singleLocation?.offers || [];
        const times = offers.map((o: any) => o.label);
        const urls = offers.map((o: any) => 
          `https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=${o.url}`
        );
        return { available: true, times, bookingUrls: urls };
      }
    }
    
    return { available: false, times: [], bookingUrls: [] };
    
  } catch (err) {
    logStep("Availability check error", { error: err instanceof Error ? err.message : String(err) });
    return { available: false, times: [], bookingUrls: [] };
  }
}

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
    logStep("Starting dining availability check run");
    const startTime = Date.now();

    // Get active alerts not checked in last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const { data: alerts, error: alertsError } = await supabase
      .from("dining_alerts")
      .select(`*, restaurant:restaurants(id, name, location, disney_url)`)
      .eq("status", "watching")
      .gte("alert_date", today)
      .or(`last_checked_at.is.null,last_checked_at.lt.${sixtySecondsAgo}`)
      .limit(25);

    if (alertsError) throw alertsError;

    logStep("Alerts to check", { count: alerts?.length || 0 });

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No alerts to check", checked: 0, durationMs: Date.now() - startTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get a Disney session (solve PoW once, reuse for all checks)
    logStep("Getting Disney session...");
    const session = await getDisneySession();
    logStep("Session status", { hasSession: !!session });

    let checked = 0;
    let found = 0;

    for (const alert of alerts) {
      try {
        const restaurant = alert.restaurant;
        if (!restaurant) continue;

        // Use the Disney entity ID from the external ID if available, or extract from URL
        const restaurantId = restaurant.disney_url
          ? restaurant.disney_url.split("/").filter(Boolean).pop() || ""
          : "";

        logStep("Checking restaurant", { name: restaurant.name, id: restaurantId, date: alert.alert_date });

        const { available, times, bookingUrls } = await checkAvailability(
          restaurantId,
          alert.alert_date,
          alert.party_size,
          alert.meal_periods || ["Dinner"],
          session
        );

        const updateData: any = {
          last_checked_at: new Date().toISOString(),
          check_count: (alert.check_count || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        if (available) {
          found++;
          updateData.status = "found";
          updateData.availability_found_at = new Date().toISOString();
          updateData.availability_url = bookingUrls[0] || restaurant.disney_url;

          logStep("AVAILABILITY FOUND!", {
            restaurant: restaurant.name,
            times,
            date: alert.alert_date,
            partySize: alert.party_size,
          });

          // Get user email and send notification
          const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
          if (userData?.user) {
            // Log notification
            await supabase.from("dining_notifications").insert({
              alert_id: alert.id,
              user_id: alert.user_id,
              restaurant_name: restaurant.name,
              alert_date: alert.alert_date,
              party_size: alert.party_size,
              availability_url: bookingUrls[0] || restaurant.disney_url,
              notification_type: "email",
            });

            logStep("Notification logged for", { email: userData.user.email, restaurant: restaurant.name });
          }
        }

        await supabase.from("dining_alerts").update(updateData).eq("id", alert.id);
        checked++;

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (alertErr) {
        logStep("Error on alert", {
          alertId: alert.id,
          error: alertErr instanceof Error ? alertErr.message : String(alertErr),
        });
      }
    }

    // Expire past-date alerts
    await supabase
      .from("dining_alerts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "watching")
      .lt("alert_date", today);

    const duration = Date.now() - startTime;
    logStep("Check run complete", { checked, found, durationMs: duration });

    return new Response(JSON.stringify({ success: true, checked, found, durationMs: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
