import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PLANS, isStripeConfigured } from '@/lib/billing/plans';
import type { Tier } from '@/lib/providers/types';

/**
 * Applies subscription changes to an account.
 *
 * Stripe is the source of truth for what a brand has paid for, so this is the
 * only place a tier is granted. It runs with the service role because the
 * request carries no user session — the caller is Stripe, not the brand.
 */

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function applyTier(userId: string, tier: Tier) {
  await admin()
    .from('profiles')
    .update({ tier, credits_remaining: PLANS[tier].shootsPerMonth })
    .eq('id', userId);
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return Response.json({ message: 'Billing is not configured.' }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) {
    return Response.json({ message: 'Missing webhook signature.' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    // Verifying the signature is what stops anyone granting themselves a plan
    // by posting to this endpoint.
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ message: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        const tier = session.metadata?.tier as Tier | undefined;
        if (userId && tier) await applyTier(userId, tier);
        break;
      }

      case 'invoice.paid': {
        // Each renewal restores the month's allowance.
        const invoice = event.data.object as Stripe.Invoice & {
          subscription_details?: { metadata?: Record<string, string> };
        };
        const meta = invoice.subscription_details?.metadata;
        if (meta?.userId && meta?.tier) await applyTier(meta.userId, meta.tier as Tier);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) await applyTier(userId, 'free');
        break;
      }
    }
  } catch (error) {
    console.error('Billing webhook failed', event.type, error);
    // Returning an error asks Stripe to retry, which is what should happen when
    // a payment succeeded but the account was not updated.
    return Response.json({ message: 'Could not apply the subscription.' }, { status: 500 });
  }

  return Response.json({ received: true });
}
