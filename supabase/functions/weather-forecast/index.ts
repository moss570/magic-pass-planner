import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Orlando, FL coordinates
const ORLANDO_LAT = 28.5383;
const ORLANDO_LNG = -81.3792;

// Disney World park coordinates for more accurate forecasts
const PARK_COORDS: Record<string, { lat: number; lng: number }> = {
  "Magic Kingdom": { lat: 28.4177, lng: -81.5812 },
  "EPCOT": { lat: 28.3747, lng: -81.5494 },
  "Hollywood Studios": { lat: 28.3574, lng: -81.5580 },
  "Animal Kingdom": { lat: 28.3553, lng: -81.5900 },
  default: { lat: ORLANDO_LAT, lng: ORLANDO_LNG },
};

function getWeatherIcon(code: number, isDay: boolean): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear" };
  if (code <= 2) return { emoji: isDay ? "⛅" : "🌙", label: "Partly Cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Overcast" };
  if (code <= 48) return { emoji: "🌫️", label: "Foggy" };
  if (code <= 57) return { emoji: "🌧️", label: "Drizzle" };
  if (code <= 67) return { emoji: "🌦️", label: "Rain" };
  if (code <= 77) return { emoji: "❄️", label: "Snow" };
  if (code <= 82) return { emoji: "🌧️", label: "Rain Showers" };
  if (code <= 84) return { emoji: "🌨️", label: "Snow Showers" };
  if (code <= 99) return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "🌤️", label: "Mixed" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const park = url.searchParams.get("park") || "default";
    const days = parseInt(url.searchParams.get("days") || "7");
    const coords = PARK_COORDS[park] || PARK_COORDS.default;

    // Fetch from Open-Meteo (free, no API key needed)
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=${Math.min(days, 16)}&timezone=America%2FNew_York`;

    const meteoResp = await fetch(meteoUrl);
    if (!meteoResp.ok) throw new Error(`Weather API ${meteoResp.status}`);
    const meteoData = await meteoResp.json();

    const daily = meteoData.daily;
    const forecast = daily.time.map((date: string, i: number) => {
      const code = daily.weather_code[i];
      const isDay = true;
      const { emoji, label } = getWeatherIcon(code, isDay);
      const rainChance = daily.precipitation_probability_max[i] || 0;
      const tempHigh = Math.round(daily.temperature_2m_max[i]);
      const tempLow = Math.round(daily.temperature_2m_min[i]);
      const windSpeed = Math.round(daily.wind_speed_10m_max[i]);

      // Crowd level estimate (Disney Orlando summer/weekends are busier)
      const dateObj = new Date(date + "T12:00:00");
      const isWeekend = [0, 6].includes(dateObj.getDay());
      const month = dateObj.getMonth();
      const isSummer = month >= 5 && month <= 8;
      const isHoliday = (month === 11 && dateObj.getDate() >= 20) || (month === 0 && dateObj.getDate() <= 5);
      let crowdLevel = isWeekend ? 7 : 4;
      if (isSummer) crowdLevel = Math.min(10, crowdLevel + 2);
      if (isHoliday) crowdLevel = Math.min(10, crowdLevel + 3);

      const crowdLabel = crowdLevel <= 3 ? "Low" : crowdLevel <= 5 ? "Moderate" : crowdLevel <= 7 ? "Busy" : "Very Busy";
      const crowdColor = crowdLevel <= 3 ? "green" : crowdLevel <= 5 ? "yellow" : crowdLevel <= 7 ? "orange" : "red";

      return {
        date,
        dayOfWeek: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        emoji,
        weatherLabel: label,
        weatherCode: code,
        tempHigh,
        tempLow,
        rainChance,
        windSpeed,
        crowdLevel,
        crowdLabel,
        crowdColor,
        isGoodDay: rainChance < 30 && crowdLevel <= 5,
      };
    });

    return new Response(JSON.stringify({ forecast, park, location: coords }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
