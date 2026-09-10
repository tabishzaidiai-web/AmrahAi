import { createClient } from '../supabase/server';
import { PLANS } from './plans';
import type { Tier } from '../providers/types';

/**
 * Credit accounting.
 *
 * Every shoot costs real money the moment it starts, so the balance is checked
 * and decremented before generation rather than after. A brand who cancels
 * mid-shoot has still incurred the provider spend.
 */

export interface Account {
  tier: Tier;
  creditsRemaining: number;
  routingPolicy: 'any' | 'western-only';
}

export async function loadAccount(userId: string): Promise<Account | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('tier, credits_remaining, routing_policy')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    tier: (data.tier as Tier) ?? 'free',
    creditsRemaining: Number(data.credits_remaining ?? 0),
    routingPolicy: (data.routing_policy as Account['routingPolicy']) ?? 'any',
  };
}

export interface CreditCheck {
  allowed: boolean;
  reason?: string;
  account?: Account;
}

/**
 * Reserves one shoot's worth of credit.
 *
 * The decrement is conditional on the balance still being positive, so two
 * shoots started at once cannot both spend the last credit.
 */
export async function reserveShoot(userId: string): Promise<CreditCheck> {
  const account = await loadAccount(userId);
  if (!account) return { allowed: false, reason: 'No account found.' };

  if (account.creditsRemaining <= 0) {
    const plan = PLANS[account.tier];
    return {
      allowed: false,
      account,
      reason:
        account.tier === 'free'
          ? `You have used all ${plan.shootsPerMonth} free shoots. Upgrade to keep going.`
          : 'You have used this month\'s shoots. Upgrade for more.',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits_remaining: account.creditsRemaining - 1 })
    .eq('id', userId)
    .gt('credits_remaining', 0)
    .select('credits_remaining')
    .single();

  if (error || !data) {
    return { allowed: false, account, reason: 'Could not reserve a shoot credit.' };
  }

  return {
    allowed: true,
    account: { ...account, creditsRemaining: Number(data.credits_remaining) },
  };
}

/** Returns a credit when a shoot produced nothing usable. */
export async function refundShoot(userId: string): Promise<void> {
  const supabase = await createClient();
  const account = await loadAccount(userId);
  if (!account) return;

  await supabase
    .from('profiles')
    .update({ credits_remaining: account.creditsRemaining + 1 })
    .eq('id', userId);
}
