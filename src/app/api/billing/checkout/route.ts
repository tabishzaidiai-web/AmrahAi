import Stripe from 'stripe';
import { z } from 'zod';
import { PLANS, isStripeConfigured } from '@/lib/billing/plans';
import { getUser } from '@/lib/supabase/server';

const schema = z.object({ tier: z.enum(['starter', 'pro', 'scale']) });

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return Response.json({ message: 'Billing is not configured yet.' }, { status: 503 });
  }

  const user = await getUser();
  if (!user) {
    return Response.json({ message: 'Sign in to upgrade.' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ message: 'Unknown plan.' }, { status: 400 });
  }

  const plan = PLANS[parsed.data.tier];
  const priceId = plan.priceEnvKey ? process.env[plan.priceEnvKey] : undefined;
  if (!priceId) {
    return Response.json(
      { message: `No Stripe price configured for the ${plan.name} plan.` },
      { status: 503 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/studio?upgraded=1`,
    cancel_url: `${origin}/pricing`,
    customer_email: user.email,
    // The webhook needs to know which account to credit, and Stripe is the only
    // thing that survives the round trip through the payment page.
    client_reference_id: user.id,
    metadata: { userId: user.id, tier: plan.tier },
    subscription_data: { metadata: { userId: user.id, tier: plan.tier } },
  });

  return Response.json({ url: session.url });
}
