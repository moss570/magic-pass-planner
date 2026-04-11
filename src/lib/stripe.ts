// Plan definitions matching the official pricing sheet

export type PlanId =
  | 'free'
  | 'ninety_day_planner'
  | 'ninety_day_friend'
  | 'magic_pass_planner'
  | 'magic_pass_plus'
  | 'founders_pass';

export interface PlanMeta {
  id: PlanId;
  displayName: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  oneTimePrice: number | null;
  autoRenews: boolean;
  dataDeletesOnExpiry: boolean;
  stripePriceIds: {
    monthly?: string;
    annual?: string;
    oneTime?: string;
  };
}

export const PLANS: Record<PlanId, PlanMeta> = {
  free: {
    id: 'free',
    displayName: 'Free – 7 Days',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 0,
    autoRenews: false,
    dataDeletesOnExpiry: true,
    stripePriceIds: {},
  },
  ninety_day_planner: {
    id: 'ninety_day_planner',
    displayName: '90 Day Magic Pass Planner',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 36.99,
    autoRenews: false,
    dataDeletesOnExpiry: true,
    stripePriceIds: {
      oneTime: 'price_1TIFUJHGyELqjZIIs9kh5fxU',
    },
  },
  ninety_day_friend: {
    id: 'ninety_day_friend',
    displayName: '90 Day Magic Pass Friend',
    monthlyPrice: null,
    annualPrice: null,
    oneTimePrice: 14.99,
    autoRenews: false,
    dataDeletesOnExpiry: true,
    stripePriceIds: {
      oneTime: 'price_1TL6ncHGyELqjZIItXdgKKLt',
    },
  },
  magic_pass_planner: {
    id: 'magic_pass_planner',
    displayName: 'Magic Pass Planner',
    monthlyPrice: 9.99,
    annualPrice: 105.99,
    oneTimePrice: null,
    autoRenews: true,
    dataDeletesOnExpiry: false,
    stripePriceIds: {
      monthly: 'price_1TL6pTHGyELqjZIIHzN49S29',
      annual: 'price_1TL6oyHGyELqjZIIzgPyCYTV',
    },
  },
  magic_pass_plus: {
    id: 'magic_pass_plus',
    displayName: 'Magic Pass Plus',
    monthlyPrice: 17.99,
    annualPrice: 174.99,
    oneTimePrice: null,
    autoRenews: true,
    dataDeletesOnExpiry: false,
    stripePriceIds: {
      monthly: 'price_1TL6shHGyELqjZIIIE8I8au3',
      annual: 'price_1TL6sKHGyELqjZIIfvrVZxhJ',
    },
  },
  founders_pass: {
    id: 'founders_pass',
    displayName: 'Magic Pass Plus – Founders Pass',
    monthlyPrice: null,
    annualPrice: 74.99,
    oneTimePrice: null,
    autoRenews: true,
    dataDeletesOnExpiry: false,
    stripePriceIds: {
      annual: 'price_1TL6tbHGyELqjZII6iClFSFM',
    },
  },
};

// Legacy PRICE_IDS for backward compatibility with existing create-checkout / stripe-webhook
export const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  "Pre-Trip Planner": {
    monthly: "price_1TIFQjHGyELqjZIIWYcXXufY",
    annual: "price_1TIFRRHGyELqjZIIgxUOhMUF",
  },
  "Magic Pass": {
    monthly: "price_1TIFRwHGyELqjZIIy7UMYR2U",
    annual: "price_1TIFSLHGyELqjZIIZ8Jw8MP2",
  },
  "AP Command Center": {
    monthly: "price_1TIFSwHGyELqjZII9yTjfkYd",
    annual: "price_1TIFTMHGyELqjZIIwZqYxeUt",
  },
  "AP Command Center PLUS": {
    monthly: "price_1TIFTqHGyELqjZII0qpW5oiT",
    annual: "price_1TIFUJHGyELqjZIIs9kh5fxU",
  },
};
