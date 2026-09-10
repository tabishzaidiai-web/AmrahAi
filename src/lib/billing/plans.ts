import type { Tier } from '../providers/types';

/**
 * What each plan grants.
 *
 * A shoot is one garment turned into a full bundle, which is the unit brands
 * think in and the unit we bill in. Credits are counted per shoot rather than
 * per image so a retry to correct garment length — which the brand did not ask
 * for and should not pay for — costs them nothing.
 */

/** The self-serve plans. Enterprise is sold, not checked out. */
export type PaidTier = 'starter' | 'pro' | 'scale';

export interface Plan {
  tier: Tier;
  name: string;
  /** USD per month. Zero for the free tier. */
  price: number;
  shootsPerMonth: number;
  features: string[];
  /** Stripe price id, absent on the free tier. */
  priceEnvKey?: string;
}

export const PLANS: Record<Tier, Plan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    shootsPerMonth: 3,
    features: ['3 shoots', 'Full bundle', 'Marketplace compliance checks'],
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: 29,
    shootsPerMonth: 25,
    features: ['25 shoots a month', 'Ghost mannequin packshots', 'Amazon listing assembly'],
    priceEnvKey: 'STRIPE_PRICE_STARTER',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 99,
    shootsPerMonth: 90,
    features: [
      'Everything in Starter',
      'Higher-fidelity image engine',
      'Runway video',
      'Brand kit and house model',
    ],
    priceEnvKey: 'STRIPE_PRICE_PRO',
  },
  scale: {
    tier: 'scale',
    name: 'Scale',
    price: 199,
    shootsPerMonth: 180,
    features: ['Everything in Pro', 'Catalogue batch import', 'API access', 'Priority queue'],
    priceEnvKey: 'STRIPE_PRICE_SCALE',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 0,
    shootsPerMonth: Number.MAX_SAFE_INTEGER,
    features: [
      'Everything in Scale',
      'Western-only processing',
      'Dedicated support and SLA',
    ],
  },
};

export const PAID_PLANS: (Plan & { tier: PaidTier })[] = [
  PLANS.starter as Plan & { tier: PaidTier },
  PLANS.pro as Plan & { tier: PaidTier },
  PLANS.scale as Plan & { tier: PaidTier },
];

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
