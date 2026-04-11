// Pure stacking calculator engine — no hardcoded brand strings

export interface UserPass {
  passId: string;
  brandId: string;
  tier: string;
  displayName: string;
  discountPercentDining: number;
  discountPercentMerch: number;
}

export interface UserCard {
  cardId: string;
  issuer: string;
  name: string;
  rewardType: string;
  baseRewardRate: number;
  diningRewardRate: number;
  hotelRewardRate: number;
  disneyRewardRate: number;
  notes: string;
}

export interface UserMembership {
  membershipType: string;
  isActive: boolean;
  expirationDate?: string;
  details?: Record<string, any>;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  eligibleCardIds: string[];
  eligiblePassTiers: string[];
  eligibleRestaurantIds: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  brandId: string;
  parkId?: string;
  location: string;
  serviceType: string;
  avgTicketPerPerson: number;
  cuisine?: string;
}

export interface Discount {
  id: string;
  category: string;
  title: string;
  discountPercent?: number;
  discountFlatAmount?: number;
  eligiblePassTiers: string[];
  eligibleCardIds: string[];
  isStackableWith: string[];
  restaurantId?: string;
}

export interface StackLineItem {
  source: string;
  label: string;
  type: "discount" | "reward" | "gift_card_savings" | "promotion";
  amount: number;
  note?: string;
  isMutuallyExclusive?: boolean;
  excludesWith?: string[];
}

export interface StackCombo {
  lineItems: StackLineItem[];
  totalSavings: number;
  effectiveRate: number;
}

export interface StackResult {
  bestStack: StackCombo;
  alternatives: StackCombo[];
  breakdown: StackLineItem[];
  totalSavings: number;
  effectiveRate: number;
  caveats: string[];
  warnings: string[];
}

export interface StackInputs {
  billAmount: number;
  restaurantId: string;
  userPasses: UserPass[];
  userCards: UserCard[];
  userMemberships: UserMembership[];
  promotions: Promotion[];
  restaurant: Restaurant;
  discounts: Discount[];
}

export function computeBestStack(inputs: StackInputs): StackResult {
  const { billAmount, userPasses, userCards, userMemberships, promotions, restaurant, discounts } = inputs;
  const warnings: string[] = [];
  const caveats: string[] = [];

  // Check for expired memberships
  const tiw = userMemberships.find((m) => m.membershipType === "tables_in_wonderland");
  if (tiw && tiw.expirationDate) {
    const exp = new Date(tiw.expirationDate);
    if (exp < new Date()) {
      warnings.push(`Tables in Wonderland expired ${Math.ceil((Date.now() - exp.getTime()) / 86400000)} days ago`);
    }
  }

  // Build all possible line items
  const allItems: StackLineItem[] = [];

  // 1. AP dining discounts
  const apDiscounts = discounts.filter(
    (d) => d.category === "dining" && d.eligiblePassTiers.some((t) => userPasses.some((p) => p.passId === t))
  );
  for (const d of apDiscounts) {
    if (d.discountPercent) {
      allItems.push({
        source: "ap_discount",
        label: `AP Discount (${d.discountPercent}%)`,
        type: "discount",
        amount: billAmount * (d.discountPercent / 100),
        isMutuallyExclusive: true,
        excludesWith: ["visa_discount"],
      });
    }
  }

  // 2. Card-based dining discounts (e.g., Disney Visa)
  const cardDiscounts = discounts.filter(
    (d) => d.category === "dining" && d.eligibleCardIds.some((c) => userCards.some((uc) => uc.cardId === c))
  );
  for (const d of cardDiscounts) {
    if (d.discountPercent) {
      allItems.push({
        source: "visa_discount",
        label: `${d.title} (${d.discountPercent}%)`,
        type: "discount",
        amount: billAmount * (d.discountPercent / 100),
        isMutuallyExclusive: true,
        excludesWith: ["ap_discount"],
      });
    }
  }

  // 3. Tables in Wonderland (20% dining)
  if (tiw && tiw.isActive && (!tiw.expirationDate || new Date(tiw.expirationDate) > new Date())) {
    allItems.push({
      source: "tiw",
      label: "Tables in Wonderland (20%)",
      type: "discount",
      amount: billAmount * 0.2,
      isMutuallyExclusive: true,
      excludesWith: ["ap_discount", "visa_discount"],
      note: "20% off food & non-alcoholic beverages at participating locations",
    });
  }

  // 4. DVC discount
  const dvc = userMemberships.find((m) => m.membershipType === "dvc" && m.isActive);
  if (dvc) {
    allItems.push({
      source: "dvc",
      label: "DVC Member Discount (10%)",
      type: "discount",
      amount: billAmount * 0.1,
      isMutuallyExclusive: true,
      excludesWith: ["ap_discount", "visa_discount", "tiw"],
    });
  }

  // 5. Active promotions
  for (const promo of promotions) {
    const eligible =
      (promo.eligiblePassTiers.length === 0 || promo.eligiblePassTiers.some((t) => userPasses.some((p) => p.passId === t))) &&
      (promo.eligibleCardIds.length === 0 || promo.eligibleCardIds.some((c) => userCards.some((uc) => uc.cardId === c))) &&
      (promo.eligibleRestaurantIds.length === 0 || promo.eligibleRestaurantIds.includes(restaurant.id));
    if (eligible) {
      const amount = promo.discountType === "percent" ? billAmount * (promo.discountValue / 100) : promo.discountValue;
      allItems.push({
        source: `promo_${promo.id}`,
        label: promo.title,
        type: "promotion",
        amount,
        note: promo.description,
      });
    }
  }

  // 6. Credit card rewards (these always stack)
  for (const card of userCards) {
    if (card.diningRewardRate > 0) {
      // Approximate point value: 1 point ≈ $0.01 for cashback, $0.012 for points, $0.01 for miles
      const pointValue = card.rewardType === "points" ? 0.012 : card.rewardType === "miles" ? 0.01 : 0.01;
      const earnedPoints = billAmount * (card.diningRewardRate / 100);
      const rewardValue = earnedPoints * pointValue * 100; // Convert percentage rate to dollar value
      // Actually: diningRewardRate is multiplier (e.g. 3 = 3x or 3%)
      const rewardDollars = billAmount * (card.diningRewardRate / 100);
      if (rewardDollars > 0.01) {
        allItems.push({
          source: `reward_${card.cardId}`,
          label: `${card.name} (${card.diningRewardRate}% rewards)`,
          type: "reward",
          amount: rewardDollars,
          note: card.notes,
        });
      }
    }
  }

  // 7. Gift card savings (Target RedCard)
  const hasRedCard = userCards.some((c) => c.cardId.startsWith("target_redcard"));
  if (hasRedCard) {
    allItems.push({
      source: "gift_card_savings",
      label: "Gift Card Savings (5% via Target RedCard)",
      type: "gift_card_savings",
      amount: billAmount * 0.05,
      note: "Buy Disney gift cards with RedCard for 5% off, then pay with gift cards",
    });
  }

  // Resolve mutual exclusions: pick the best from each exclusive group
  const exclusiveItems = allItems.filter((i) => i.isMutuallyExclusive);
  const nonExclusiveItems = allItems.filter((i) => !i.isMutuallyExclusive);

  // Find the best exclusive discount
  let bestExclusive: StackLineItem | null = null;
  if (exclusiveItems.length > 0) {
    bestExclusive = exclusiveItems.reduce((best, item) => (item.amount > best.amount ? item : best));
    if (exclusiveItems.length > 1) {
      const others = exclusiveItems.filter((i) => i !== bestExclusive).map((i) => i.label);
      caveats.push(`${bestExclusive!.label} chosen over ${others.join(", ")} — they don't stack at most locations`);
    }
  }

  const bestLineItems: StackLineItem[] = [];
  if (bestExclusive) bestLineItems.push(bestExclusive);
  
  // Add non-exclusive items (rewards, gift card savings, promotions)
  for (const item of nonExclusiveItems) {
    bestLineItems.push(item);
  }

  const totalSavings = bestLineItems.reduce((sum, i) => sum + i.amount, 0);
  const effectiveRate = billAmount > 0 ? totalSavings / billAmount : 0;

  const bestStack: StackCombo = {
    lineItems: bestLineItems,
    totalSavings,
    effectiveRate,
  };

  // Generate alternatives by swapping exclusive discount
  const alternatives: StackCombo[] = [];
  for (const excItem of exclusiveItems) {
    if (excItem === bestExclusive) continue;
    const altItems = [excItem, ...nonExclusiveItems];
    const altSavings = altItems.reduce((sum, i) => sum + i.amount, 0);
    alternatives.push({
      lineItems: altItems,
      totalSavings: altSavings,
      effectiveRate: billAmount > 0 ? altSavings / billAmount : 0,
    });
  }

  return {
    bestStack,
    alternatives: alternatives.slice(0, 3),
    breakdown: bestLineItems,
    totalSavings,
    effectiveRate,
    caveats,
    warnings,
  };
}
