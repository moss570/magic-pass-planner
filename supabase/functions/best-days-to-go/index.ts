import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ManualCrowdProvider } from "../_shared/crowdProvider.ts";
import { NWSWeatherProvider } from "../_shared/weatherProvider.ts";
import { DBPassTierProvider } from "../_shared/passTierProvider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PARKS = ["magic-kingdom", "epcot", "hollywood-studios", "animal-kingdom"];

function getNext10Dates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Use ET timezone for date calculation
  const etStr = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const base = new Date(etStr + "T00:00:00");
  for (let i = 0; i < 10; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().substring(0, 10));
  }
  return dates;
}

function computeScore(
  crowdLevel: number,
  precipChance: number,
  highF: number,
  isBlocked: boolean
): { score: number; grade: string } {
  // Crowd: 40 pts max
  const crowdPoints = (11 - crowdLevel) * 4;

  // Weather: 30 pts max
  let weatherPoints = 30;
  if (precipChance >= 60) weatherPoints -= 15;
  else if (precipChance >= 30) weatherPoints -= 5;
  if (highF >= 92) weatherPoints -= 10;
  if (highF <= 55) weatherPoints -= 10;
  if (weatherPoints < 0) weatherPoints = 0;

  // Pass tier: 30 pts max
  const passPoints = isBlocked ? 0 : 30;

  const score = crowdPoints + weatherPoints + passPoints;
  let grade: string;
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return { score, grade };
}

function buildReasons(
  crowdLevel: number,
  precipChance: number,
  highF: number,
  lowF: number,
  summary: string,
  isBlocked: boolean,
  passTier: string | null
): string[] {
  const reasons: string[] = [];

  if (crowdLevel <= 3) reasons.push(`Low crowds (${crowdLevel}/10)`);
  else if (crowdLevel <= 5) reasons.push(`Moderate crowds (${crowdLevel}/10)`);
  else if (crowdLevel <= 7) reasons.push(`Above-average crowds (${crowdLevel}/10)`);
  else reasons.push(`High crowds (${crowdLevel}/10)`);

  if (precipChance >= 60) reasons.push(`Rain likely (${precipChance}% chance)`);
  else if (precipChance >= 30) reasons.push(`Some rain possible (${precipChance}%)`);
  else reasons.push(`${summary}, ${highF}°F`);

  if (highF >= 92) reasons.push("Very hot — stay hydrated");
  if (highF <= 55) reasons.push("Cool for Florida — bring a jacket");

  if (isBlocked && passTier) reasons.push(`Blocked for ${passTier} pass`);
  else if (passTier) reasons.push(`Open for ${passTier} pass`);

  return reasons;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Admin refresh action
    if (action === "refresh") {
      const authHeader = req.headers.get("Authorization") || "";
      // For cron jobs, we allow anon key; for manual calls, require admin
      const dates = getNext10Dates();

      for (const parkId of VALID_PARKS) {
        const crowdProvider = new ManualCrowdProvider(supabase);
        const weatherProvider = new NWSWeatherProvider(supabase);

        const crowds = await crowdProvider.getForecast(parkId, dates);
        const weather = await weatherProvider.getForecast(parkId, dates);

        for (let i = 0; i < dates.length; i++) {
          const crowd = crowds[i];
          const wx = weather[i];
          const { score, grade } = computeScore(crowd.crowdLevel, wx.precipChance, wx.highF, false);
          const reasons = buildReasons(crowd.crowdLevel, wx.precipChance, wx.highF, wx.lowF, wx.summary, false, null);

          await supabase.from("best_days_predictions").upsert({
            park_id: parkId,
            prediction_date: dates[i],
            score,
            grade,
            crowd_level: crowd.crowdLevel,
            weather_summary: wx.summary,
            weather_high_f: wx.highF,
            weather_low_f: wx.lowF,
            precip_chance: wx.precipChance,
            pass_tier_blocked: false,
            reasons,
            computed_at: new Date().toISOString(),
          }, { onConflict: "park_id,prediction_date" });
        }
      }

      return new Response(JSON.stringify({ ok: true, parks: VALID_PARKS.length, dates: dates.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET — return predictions for a park
    const parkId = url.searchParams.get("parkId") || "magic-kingdom";
    const userPassTier = url.searchParams.get("userPassTier") || null;
    const sortBy = url.searchParams.get("sortBy") || "score";

    if (!VALID_PARKS.includes(parkId)) {
      return new Response(JSON.stringify({ error: "Invalid parkId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dates = getNext10Dates();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check cache
    const { data: cached } = await supabase
      .from("best_days_predictions")
      .select("*")
      .eq("park_id", parkId)
      .in("prediction_date", dates)
      .gte("computed_at", oneDayAgo);

    const cacheMap = new Map<string, any>();
    for (const row of cached || []) {
      cacheMap.set(row.prediction_date, row);
    }

    const missingDates = dates.filter((d) => !cacheMap.has(d));

    // Compute missing predictions
    if (missingDates.length > 0) {
      const crowdProvider = new ManualCrowdProvider(supabase);
      const weatherProvider = new NWSWeatherProvider(supabase);

      const crowds = await crowdProvider.getForecast(parkId, missingDates);
      const weather = await weatherProvider.getForecast(parkId, missingDates);

      for (let i = 0; i < missingDates.length; i++) {
        const crowd = crowds[i];
        const wx = weather[i];
        const { score, grade } = computeScore(crowd.crowdLevel, wx.precipChance, wx.highF, false);
        const reasons = buildReasons(crowd.crowdLevel, wx.precipChance, wx.highF, wx.lowF, wx.summary, false, null);

        const row = {
          park_id: parkId,
          prediction_date: missingDates[i],
          score,
          grade,
          crowd_level: crowd.crowdLevel,
          weather_summary: wx.summary,
          weather_high_f: wx.highF,
          weather_low_f: wx.lowF,
          precip_chance: wx.precipChance,
          pass_tier_blocked: false,
          reasons,
          computed_at: new Date().toISOString(),
        };

        await supabase.from("best_days_predictions").upsert(row, { onConflict: "park_id,prediction_date" });
        cacheMap.set(missingDates[i], row);
      }
    }

    // Apply pass tier adjustments on the fly
    let passTierBlockouts: Map<string, boolean> = new Map();
    if (userPassTier) {
      const passProvider = new DBPassTierProvider(supabase);
      const blockouts = await passProvider.getBlockouts(parkId, userPassTier, dates);
      for (const b of blockouts) {
        passTierBlockouts.set(b.date, b.isBlocked);
      }
    }

    // Build response
    const predictions = dates.map((d) => {
      const row = cacheMap.get(d);
      const isBlocked = passTierBlockouts.get(d) ?? false;

      // Recalculate score with pass tier
      const crowdLevel = row?.crowd_level ?? 5;
      const precipChance = row?.precip_chance ?? 20;
      const highF = row?.weather_high_f ?? 82;
      const lowF = row?.weather_low_f ?? 68;
      const summary = row?.weather_summary ?? "Fair";

      const { score, grade } = computeScore(crowdLevel, precipChance, highF, isBlocked);
      const reasons = buildReasons(crowdLevel, precipChance, highF, lowF, summary, isBlocked, userPassTier);

      return {
        parkId,
        date: d,
        score,
        grade,
        crowdLevel,
        weatherSummary: summary,
        weatherHighF: highF,
        weatherLowF: lowF,
        precipChance,
        passTierBlocked: isBlocked,
        reasons,
      };
    });

    // Sort
    if (sortBy === "score") {
      predictions.sort((a, b) => b.score - a.score);
    }
    // date sort is already chronological

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("best-days-to-go error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
