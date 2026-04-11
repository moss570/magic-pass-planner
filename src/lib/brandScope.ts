import { supabase } from "@/integrations/supabase/client";

export interface BrandScope {
  id: string;
  name: string;
  slug: string;
  parks: string[];
  active: boolean;
}

export async function getUserBrandScope(userId: string): Promise<BrandScope[]> {
  // Get all active brands the user holds at least one pass for
  const { data: userPasses } = await supabase
    .from("user_park_passes")
    .select("pass_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!userPasses?.length) return [];

  const passIds = userPasses.map((p: any) => p.pass_id);

  const { data: passes } = await supabase
    .from("park_passes" as any)
    .select("brand_id")
    .in("id", passIds);

  if (!passes?.length) return [];

  const brandIds = [...new Set((passes as any[]).map((p) => p.brand_id))];

  const { data: brands } = await supabase
    .from("park_brands" as any)
    .select("*")
    .in("id", brandIds)
    .eq("active", true);

  return (brands as any[] || []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    parks: b.parks || [],
    active: b.active,
  }));
}

export async function getAllActiveBrands(): Promise<BrandScope[]> {
  const { data } = await supabase
    .from("park_brands" as any)
    .select("*")
    .eq("active", true);

  return (data as any[] || []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    parks: b.parks || [],
    active: b.active,
  }));
}

export async function getAllBrands(): Promise<BrandScope[]> {
  const { data } = await supabase
    .from("park_brands" as any)
    .select("*")
    .order("active", { ascending: false });

  return (data as any[] || []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    parks: b.parks || [],
    active: b.active,
  }));
}

export function resolveActiveBrand(
  scope: BrandScope[],
  preferred?: string
): BrandScope | null {
  if (!scope.length) return null;
  if (preferred) {
    const found = scope.find((b) => b.id === preferred);
    if (found) return found;
  }
  return scope[0];
}
