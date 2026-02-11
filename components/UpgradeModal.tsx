import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Replace these with your actual Stripe Price IDs from your dashboard
const STRIPE_PRICES = {
  starter: 'price_starter_123',
  pro: 'price_pro_456',
  enterprise: 'price_enterprise_789'
};

interface UpgradeModalProps {
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { user, session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleStripeCheckout = async (planId: keyof typeof STRIPE_PRICES) => {
    if (!user) return alert("Please sign in first");
    
    setLoadingPlan(planId);
    try {
      // In a production environment with the Firebase Stripe Extension,
      // you add a document to the checkout_sessions collection.
      // Here, we simulate a fetch to your Cloud Function.
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          priceId: STRIPE_PRICES[planId],
          success_url: window.location.origin,
          cancel_url: window.location.origin
        })
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url; // Redirect to Stripe Hosted Checkout
      }
    } catch (err: any) {
      console.error("Stripe Error:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: '$9.99', features: ['3 High-Res Images Included', '1 Video Credit', 'Standard Support'] },
    { id: 'pro', name: 'Pro', price: '$29.99', features: ['Unlimited Images', '20 Video Credits', 'Priority Queue', '8K Upscaling'] },
    { id: 'enterprise', name: 'Enterprise', price: '$99.99', features: ['Unlimited Everything', 'Custom Model Training', 'API Access', '24/7 Concierge'] }
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/80 backdrop-blur-2xl flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-6xl w-full bg-white rounded-[4rem] p-16 shadow-2xl space-y-16 relative">
        <button onClick={onClose} className="absolute top-10 right-10 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-4">
          <span className="text-[11px] font-bold text-gold uppercase tracking-[0.5em]">Maison Premium</span>
          <h2 className="text-5xl font-serif text-emerald-950">Scale your visual empire.</h2>
          <p className="text-emerald-950/40 text-[11px] font-bold uppercase tracking-[0.3em]">Unlock 100% Visual Fidelity without limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-emerald-50/30 rounded-[3rem] p-10 border border-emerald-50 space-y-8 flex flex-col items-center text-center group hover:border-gold transition-all duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif text-emerald-950">{plan.name}</h3>
                <div className="text-4xl font-serif font-bold text-emerald-950">{plan.price}<span className="text-[10px] uppercase font-bold text-emerald-950/40">/mo</span></div>
              </div>

              <ul className="space-y-3 w-full border-t border-emerald-50 pt-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-[10px] font-bold text-emerald-950/60 uppercase tracking-widest">{f}</li>
                ))}
              </ul>

              <div className="w-full space-y-4 pt-8">
                <button 
                  onClick={() => handleStripeCheckout(plan.id as any)} 
                  disabled={loadingPlan !== null}
                  className="w-full py-4 bg-emerald-950 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-gold transition-all disabled:opacity-50"
                >
                  {loadingPlan === plan.id ? 'Connecting...' : 'Pay with Stripe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;