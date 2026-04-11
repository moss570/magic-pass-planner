// ═══════════════════════════════════════════════════════════════════════════════
// Pass Tier Provider — Abstraction layer for pass blockout lookups
// No hardcoded park IDs — works for any park_id + pass_tier combo
// ═══════════════════════════════════════════════════════════════════════════════

export interface PassBlockoutResult {
  parkId: string;
  date: string;
  passTier: string;
  isBlocked: boolean;
}

export interface PassTierProvider {
  getBlockouts(parkId: string, passTier: string, dates: string[]): Promise<PassBlockoutResult[]>;
}

/**
 * DBPassTierProvider reads from the pass_tier_blockouts table.
 * If no row exists for a (park, tier, date), assumes not blocked.
 */
export class DBPassTierProvider implements PassTierProvider {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async getBlockouts(parkId: string, passTier: string, dates: string[]): Promise<PassBlockoutResult[]> {
    const { data } = await this.supabaseClient
      .from("pass_tier_blockouts")
      .select("park_id, pass_tier, blockout_date, is_blocked")
      .eq("park_id", parkId)
      .eq("pass_tier", passTier)
      .in("blockout_date", dates);

    const blockedSet = new Set<string>();
    for (const row of data || []) {
      if (row.is_blocked) {
        blockedSet.add(row.blockout_date);
      }
    }

    return dates.map((d) => ({
      parkId,
      date: d,
      passTier,
      isBlocked: blockedSet.has(d),
    }));
  }
}
