const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout', async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.id;

  const planPrices = {
    starter: 'price_starter_id',
    pro: 'price_pro_id',
    enterprise: 'price_enterprise_id'
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: planPrices[planId], quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
    metadata: { userId, planId }
  });

  res.json({ url: session.url });
});

module.exports = router;
