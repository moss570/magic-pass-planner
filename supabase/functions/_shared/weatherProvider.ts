// ═══════════════════════════════════════════════════════════════════════════════
// Weather Provider — Abstraction layer for weather forecasts
// No hardcoded park IDs — works for any park_id via lat/lng lookup
// ═══════════════════════════════════════════════════════════════════════════════

export interface WeatherForecast {
  parkId: string;
  date: string; // YYYY-MM-DD
  highF: number;
  lowF: number;
  precipChance: number; // 0-100
  summary: string;
  source: string;
}

export interface WeatherProvider {
  getForecast(parkId: string, dates: string[]): Promise<WeatherForecast[]>;
}

// Lat/lng for park regions — extend for Universal, SeaWorld, etc.
const PARK_COORDS: Record<string, { lat: number; lng: number }> = {
  "magic-kingdom": { lat: 28.4177, lng: -81.5812 },
  "epcot": { lat: 28.3747, lng: -81.5494 },
  "hollywood-studios": { lat: 28.3575, lng: -81.5583 },
  "animal-kingdom": { lat: 28.3553, lng: -81.5901 },
};

const DEFAULT_COORD = { lat: 28.3852, lng: -81.5639 }; // Orlando center

/**
 * NWSWeatherProvider calls the free NWS (weather.gov) API.
 * NWS forecast covers ~7 days. Beyond that we fall back to cached or defaults.
 */
export class NWSWeatherProvider implements WeatherProvider {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async getForecast(parkId: string, dates: string[]): Promise<WeatherForecast[]> {
    // First check cache
    const { data: cached } = await this.supabaseClient
      .from("park_weather_forecasts")
      .select("*")
      .eq("park_id", parkId)
      .in("forecast_date", dates);

    const cacheMap = new Map<string, any>();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    for (const row of cached || []) {
      if (row.fetched_at > oneDayAgo) {
        cacheMap.set(row.forecast_date, row);
      }
    }

    const missingDates = dates.filter((d) => !cacheMap.has(d));

    if (missingDates.length > 0) {
      const fetched = await this.fetchFromNWS(parkId, missingDates);
      for (const f of fetched) {
        cacheMap.set(f.date, {
          forecast_date: f.date,
          high_f: f.highF,
          low_f: f.lowF,
          precip_chance: f.precipChance,
          summary: f.summary,
        });
        // Upsert cache
        await this.supabaseClient.from("park_weather_forecasts").upsert({
          park_id: parkId,
          forecast_date: f.date,
          high_f: f.highF,
          low_f: f.lowF,
          precip_chance: f.precipChance,
          summary: f.summary,
          source: "nws",
          fetched_at: new Date().toISOString(),
        }, { onConflict: "park_id,forecast_date" });
      }
    }

    return dates.map((d) => {
      const row = cacheMap.get(d);
      if (row) {
        return {
          parkId,
          date: d,
          highF: row.high_f ?? 82,
          lowF: row.low_f ?? 68,
          precipChance: row.precip_chance ?? 20,
          summary: row.summary ?? "Partly cloudy",
          source: "nws",
        };
      }
      return {
        parkId,
        date: d,
        highF: 82,
        lowF: 68,
        precipChance: 20,
        summary: "Typical Orlando weather",
        source: "default",
      };
    });
  }

  private async fetchFromNWS(parkId: string, dates: string[]): Promise<WeatherForecast[]> {
    const coords = PARK_COORDS[parkId] || DEFAULT_COORD;
    const results: WeatherForecast[] = [];

    try {
      // Step 1: Get the forecast grid endpoint
      const pointResp = await fetch(
        `https://api.weather.gov/points/${coords.lat},${coords.lng}`,
        { headers: { "User-Agent": "MagicPassPlanner/1.0 (contact@magicpassplanner.com)" } }
      );
      if (!pointResp.ok) return results;
      const pointData = await pointResp.json();
      const forecastUrl = pointData.properties?.forecast;
      if (!forecastUrl) return results;

      // Step 2: Get the forecast
      const fcResp = await fetch(forecastUrl, {
        headers: { "User-Agent": "MagicPassPlanner/1.0 (contact@magicpassplanner.com)" },
      });
      if (!fcResp.ok) return results;
      const fcData = await fcResp.json();
      const periods = fcData.properties?.periods || [];

      // NWS returns daytime/nighttime periods. Pair them by date.
      const dayMap = new Map<string, { high?: number; low?: number; precip?: number; summary?: string }>();

      for (const p of periods) {
        const pDate = p.startTime?.substring(0, 10);
        if (!pDate || !dates.includes(pDate)) continue;

        const entry = dayMap.get(pDate) || {};
        if (p.isDaytime) {
          entry.high = p.temperature;
          entry.summary = p.shortForecast;
          // NWS probabilityOfPrecipitation
          entry.precip = p.probabilityOfPrecipitation?.value ?? entry.precip ?? 0;
        } else {
          entry.low = p.temperature;
          if (!entry.precip && p.probabilityOfPrecipitation?.value != null) {
            entry.precip = Math.max(entry.precip ?? 0, p.probabilityOfPrecipitation.value);
          }
        }
        dayMap.set(pDate, entry);
      }

      for (const d of dates) {
        const entry = dayMap.get(d);
        if (entry && entry.high != null) {
          results.push({
            parkId,
            date: d,
            highF: entry.high,
            lowF: entry.low ?? entry.high - 14,
            precipChance: entry.precip ?? 0,
            summary: entry.summary ?? "Fair",
            source: "nws",
          });
        }
      }
    } catch (e) {
      console.error("NWS fetch error:", e);
    }

    return results;
  }
}
