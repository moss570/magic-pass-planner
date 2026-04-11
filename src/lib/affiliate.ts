/**
 * Affiliate link builder — DB-driven routing (Milestone 10).
 * Fetches the highest-priority enabled network for the given category
 * and interpolates its deeplink template with context params.
 */

import { supabase } from "@/integrations/supabase/client";

type AffiliateCategory = 'hotels' | 'flights' | 'tickets' | 'rental_cars' | 'activities' | 'insurance' | 'dining' | 'merch';

interface AffiliateContext {
  tripId?: string;
  userId?: string;
  checkIn?: string;
  checkOut?: string;
  origin?: string;
  destination?: string;
  adults?: string | number;
  children?: string | number;
  depart_date?: string;
  return_date?: string;
  stops_max?: string | number;
  [key: string]: string | number | undefined;
}

function interpolate(template: string, ctx: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(ctx[key] ?? ""));
}

function appendUtm(url: string, source: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "magicpassplus");
    u.searchParams.set("utm_medium", "app");
    u.searchParams.set("utm_campaign", source);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Build a booking URL routed through the highest-priority enabled affiliate network.
 * Falls back to rawDeeplink with UTM params if no network is enabled.
 */
export async function buildBookingUrl({
  category,
  rawDeeplink,
  context = {},
}: {
  category: AffiliateCategory;
  rawDeeplink: string;
  context?: AffiliateContext;
}): Promise<string> {
  try {
    const { data } = await supabase
      .from("affiliate_networks" as any)
      .select("id, slug, deeplink_template, affiliate_id, sub_id_pattern, base_url")
      .eq("category", category)
      .eq("is_enabled", true)
      .order("priority", { ascending: true })
      .limit(1);

    if (!data?.length) return appendUtm(rawDeeplink, "direct");

    const network = (data as any[])[0];
    const subId = interpolate(network.sub_id_pattern || "", context as any);
    const finalUrl = interpolate(network.deeplink_template || rawDeeplink, {
      ...context,
      base_url: network.base_url,
      affiliate_id: network.affiliate_id,
      sub_id: subId,
    } as any);

    // Log click fire-and-forget
    supabase.from("affiliate_clicks" as any).insert({
      network_id: network.id,
      user_id: context.userId,
      trip_id: context.tripId,
      deeplink: finalUrl,
    } as any);

    return finalUrl;
  } catch {
    return appendUtm(rawDeeplink, "direct");
  }
}

/**
 * Get a generic booking search URL for a category when no specific template exists.
 */
export function getGenericBookingUrl(category: AffiliateCategory): string {
  const urls: Record<string, string> = {
    hotels: "https://www.booking.com/searchresults.html?dest_id=20023488&dest_type=city",
    flights: "https://www.google.com/travel/flights",
    tickets: "https://disneyworld.disney.go.com/admission/tickets/",
    dining: "https://disneyworld.disney.go.com/dining/",
    merch: "https://www.shopdisney.com/",
    rental_cars: "https://www.rentalcars.com/",
    activities: "https://www.viator.com/Orlando/d663-ttd",
    insurance: "https://www.squaremouth.com/",
  };
  return urls[category] || urls.hotels;
}
