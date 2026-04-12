// Client-side helper to fetch attractions and shows from Supabase tables
import { supabase } from "@/integrations/supabase/client";

export interface AttractionRow {
  id: string;
  park_id: string;
  name: string;
  land: string;
  has_lightning_lane: boolean;
  ll_type: string | null;
  avg_duration_min: number;
  ride_type: string;
  thrill_level: number | null;
  height_req_in: number | null;
  description: string | null;
  is_open: boolean;
}

export interface ShowRow {
  id: string;
  park_id: string;
  name: string;
  land: string;
  duration_min: number;
  location: string | null;
  is_open: boolean;
  is_nighttime: boolean;
}

const attractionCache: Record<string, AttractionRow[]> = {};
const showCache: Record<string, ShowRow[]> = {};

export async function getAttractionsForPark(parkId: string): Promise<AttractionRow[]> {
  if (attractionCache[parkId]) return attractionCache[parkId];
  
  const { data, error } = await supabase
    .from('attractions')
    .select('id, park_id, name, land, has_lightning_lane, ll_type, avg_duration_min, ride_type, thrill_level, height_req_in, description, is_open')
    .eq('park_id', parkId)
    .eq('is_open', true)
    .order('land')
    .order('name');
  
  if (error || !data) return [];
  attractionCache[parkId] = data as AttractionRow[];
  return attractionCache[parkId];
}

export async function getShowsForPark(parkId: string): Promise<ShowRow[]> {
  if (showCache[parkId]) return showCache[parkId];
  
  const { data, error } = await supabase
    .from('shows')
    .select('id, park_id, name, land, duration_min, location, is_open, is_nighttime')
    .eq('park_id', parkId)
    .eq('is_open', true)
    .order('land')
    .order('name');
  
  if (error || !data) return [];
  showCache[parkId] = data as ShowRow[];
  return showCache[parkId];
}

// Map display park names to park_id used in the DB
const PARK_ID_MAP: Record<string, string> = {
  "Magic Kingdom": "magic-kingdom",
  "EPCOT": "epcot",
  "Hollywood Studios": "hollywood-studios",
  "Animal Kingdom": "animal-kingdom",
  "🌊 Typhoon Lagoon": "typhoon-lagoon",
  "❄️ Blizzard Beach": "blizzard-beach",
};

export function toParkId(displayName: string): string {
  return PARK_ID_MAP[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}
