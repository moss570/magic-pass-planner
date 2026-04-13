// Plan definitions matching the official pricing sheet
// LIVE MODE — Updated April 12, 2026

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
      oneTime: 'price_1TLXwjHd9LGS7BQDyLANm9fk',
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
      oneTime: 'price_1TLXuyHd9LGS7BQD4jjwoaZg',
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
      monthly: 'price_1TLXuIHd9LGS7BQDVUMpYWFW',
      annual: 'price_1TLXoCHd9LGS7BQD48aLSEoz',
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
      monthly: 'price_1TLXnNHd9LGS7BQDayVF912J',
      annual: 'price_1TLXnNHd9LGS7BQD7cvP52b5',
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
      annual: 'price_1TLXlnHd9LGS7BQDd4uF2qM7',
    },
  },
};

// Legacy PRICE_IDS removed — all checkout should use PLANS above
export const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {};
