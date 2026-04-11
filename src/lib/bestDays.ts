import { supabase } from "@/integrations/supabase/client";

export interface BestDayPrediction {
  parkId: string;
  date: string;
  score: number;
  grade: string;
  crowdLevel: number;
  weatherSummary: string;
  weatherHighF: number;
  weatherLowF: number;
  precipChance: number;
  passTierBlocked: boolean;
  reasons: string[];
}

export async function fetchBestDays(
  parkId: string,
  userPassTier: string | null,
  sortBy: "score" | "date" = "score"
): Promise<BestDayPrediction[]> {
  const { data, error } = await supabase.functions.invoke("best-days-to-go", {
    body: null,
    method: "GET",
  });

  // supabase.functions.invoke doesn't support query params well for GET,
  // so we'll use fetch directly
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "wknelhrmgspuztehetpa";
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const params = new URLSearchParams({ parkId, sortBy });
  if (userPassTier) params.set("userPassTier", userPassTier);

  const resp = await fetch(
    `https://${projectId}.supabase.co/functions/v1/best-days-to-go?${params}`,
    {
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`Failed to fetch best days: ${resp.status}`);
  }

  const json = await resp.json();
  return json.predictions || [];
}
