// ═══════════════════════════════════════════════════════════════════════════════
// Crowd Provider — Abstraction layer for crowd forecasts
// No hardcoded park IDs — works for any park_id
// ═══════════════════════════════════════════════════════════════════════════════

export interface CrowdForecast {
  parkId: string;
  date: string; // YYYY-MM-DD
  crowdLevel: number; // 1-10
  source: string;
}

export interface CrowdProvider {
  getForecast(parkId: string, dates: string[]): Promise<CrowdForecast[]>;
}

/**
 * ManualCrowdProvider reads from admin-entered park_crowd_forecasts table.
 * Falls back to a moderate crowd level (5) if no data exists for a date.
 */
export class ManualCrowdProvider implements CrowdProvider {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async getForecast(parkId: string, dates: string[]): Promise<CrowdForecast[]> {
    const { data } = await this.supabaseClient
      .from("park_crowd_forecasts")
      .select("park_id, forecast_date, crowd_level, source")
      .eq("park_id", parkId)
      .in("forecast_date", dates);

    const map = new Map<string, CrowdForecast>();
    for (const row of data || []) {
      map.set(row.forecast_date, {
        parkId: row.park_id,
        date: row.forecast_date,
        crowdLevel: row.crowd_level,
        source: row.source || "manual",
      });
    }

    return dates.map((d) =>
      map.get(d) || { parkId, date: d, crowdLevel: 5, source: "default" }
    );
  }
}
