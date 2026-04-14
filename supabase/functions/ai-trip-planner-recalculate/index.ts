import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveAroundLocked, generateNudges } from "../_shared/scheduler.ts";
import type { LockedBlock, SchedulerItem, Nudge } from "../_shared/scheduler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get("authorization") || req.headers.get("x-client-authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tripId, dayIndex, currentDay, lockedBlocks, userPreferences } = body;

    if (!currentDay || !currentDay.items) {
      return new Response(JSON.stringify({ error: "currentDay with items[] is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const walkingSpeedKmh = userPreferences?.walkingSpeedKmh || 2.5;
    const parkClose = 22 * 60; // 10 PM

    // Convert incoming items to SchedulerItems
    const items: SchedulerItem[] = (currentDay.items || []).map((it: any) => ({
      startTime: parseTimeToMinutes(it.time || "8:00 AM"),
      duration: it.duration || it.durationMinutes || (it.rideMinutes || 5) + (it.waitMinutes || 0),
      walkMinutes: it.walkMinutes || 0,
      waitMinutes: it.waitMinutes || it.wait || 0,
      rideMinutes: it.rideMinutes || undefined,
      activity: it.activity,
      type: it.type,
      badge: it.badge,
      tip: it.tip || "",
      location: it.location,
      land: it.land,
      priority: it.priority || "recommended",
      alternativeDining: it.alternativeDining,
      passingPoints: it.passingPoints || [],
      locked: it.locked || false,
    }));

    const locks: LockedBlock[] = (lockedBlocks || []).map((lb: any) => ({
      itemIndex: lb.itemIndex,
      startTime: lb.startTime,
      durationMinutes: lb.durationMinutes,
      label: lb.label,
    }));

    // Resolve
    const { items: resolvedItems, warnings } = resolveAroundLocked(
      items,
      locks,
      parkClose,
      walkingSpeedKmh,
    );

    // Generate nudges
    const nudges = generateNudges(resolvedItems);

    // Count shifts
    const shifted = resolvedItems.filter((it, i) => {
      if (it.locked || it.dropped) return false;
      const orig = items[i];
      return orig && it.startTime !== orig.startTime;
    }).length;

    return new Response(JSON.stringify({
      day: {
        ...currentDay,
        items: resolvedItems.map(it => ({
          time: minutesToTimeStr(it.startTime),
          activity: it.activity,
          type: it.type,
          badge: it.badge,
          tip: it.tip,
          wait: it.waitMinutes,
          location: it.location,
          land: it.land,
          priority: it.priority,
          walkMinutes: it.walkMinutes,
          waitMinutes: it.waitMinutes,
          rideMinutes: it.rideMinutes,
          durationMinutes: it.duration,
          alternativeDining: it.alternativeDining,
          passingPoints: it.passingPoints,
          locked: it.locked || false,
          dropped: it.dropped || false,
        })),
        nudges,
      },
      warnings,
      itemsShifted: shifted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseTimeToMinutes(timeStr: string): number {
  // "8:00 AM" or "11:15" or "14:30"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 480;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}
