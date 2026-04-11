/**
 * Affiliate link builder — stub for Milestone 05.
 * Real affiliate network routing wired in Milestone 10.
 */

type AffiliateCategory = 'hotels' | 'flights' | 'tickets' | 'dining' | 'merch';

interface AffiliateParams {
  tripId?: string;
  userId?: string;
  [key: string]: string | undefined;
}

/**
 * Build a booking URL with UTM tracking params.
 * In this milestone this simply appends UTM params to the raw deeplink.
 * Milestone 10 will route through real affiliate networks.
 */
export function buildBookingUrl(
  category: AffiliateCategory,
  baseUrl: string,
  params: AffiliateParams = {}
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "magicpassplus");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", category);
  if (params.tripId) url.searchParams.set("utm_content", `trip_${params.tripId}`);
  if (params.userId) url.searchParams.set("ref", params.userId.slice(0, 8));
  return url.toString();
}

/**
 * Get a generic booking search URL for a category when no specific template exists.
 */
export function getGenericBookingUrl(category: AffiliateCategory): string {
  const urls: Record<AffiliateCategory, string> = {
    hotels: "https://www.booking.com/searchresults.html?dest_id=20023488&dest_type=city",
    flights: "https://www.google.com/travel/flights",
    tickets: "https://disneyworld.disney.go.com/admission/tickets/",
    dining: "https://disneyworld.disney.go.com/dining/",
    merch: "https://www.shopdisney.com/",
  };
  return urls[category];
}
