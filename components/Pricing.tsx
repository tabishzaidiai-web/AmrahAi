import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StripeService } from '../services/stripeService';

interface PricingProps {
  onClose: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onClose }) => {
  const { user, session } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!user) return alert("Authorize with Maison Registry to proceed.");
    
    setLoadingId(priceId);
    try {
      await StripeService.initiateCheckout(priceId, user.email, session?.access_token);
    } catch (err) {
      console.error("Payment sync fault:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const plans = [
    {
      id: 'price_1SzyBL3zxqcaKujr2wp32fKp',
      name: 'Starter Atelier',
      price: 29.99,
      currency: 'AED',
      features: ['25 Visual Renders', '5 Cinematic Video Shots', 'Standard Model Access', 'Community Showcase']
    },
    {
      id: 'price_1SzyBk3zxqcaKujrgOkgazs8',
      name: 'Studio Pro',
      price: 50.00,
      currency: 'AED',
      features: ['Unlimited Image Renders', '25 Cinematic Video Shots', 'Priority Neural Access', 'Maison Hub Dashboard']
    },
    {
      id: 'price_1SzyCE3zxqcaKujraVF31jvj',
      name: 'Maison Global',
      price: 150.00,
      currency: 'AED',
      features: ['Infinite Film & Image Generation', 'API Deployment', 'Personal AI Identity Training', '24/7 Production Concierge']
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/70 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl w-full bg-white rounded-[3.5rem] p-16 relative shadow-2xl space-y-16 overflow-y-auto max-h-[90vh] no-scrollbar">
        
        {loadingId && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 rounded-[3.5rem]">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-2xl font-serif text-emerald-950 italic">Synchronizing with Stripe Checkout...</p>
          </div>
        )}

        <button onClick={onClose} className="absolute top-10 right-10 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-4">
          <span className="text-[11px] font-bold text-gold uppercase tracking-[0.5em]">Neural Visual Commerce</span>
          <h2 className="text-5xl font-serif text-emerald-950 italic leading-tight">Investment Tiers</h2>
          <p className="text-emerald-950/40 text-[11px] font-bold uppercase tracking-[0.3em]">Scalable intelligence for the modern boutique.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((pkg) => (
            <div key={pkg.id} className={`bg-emerald-50/20 border-2 rounded-[3rem] p-12 flex flex-col items-center text-center space-y-10 group transition-all duration-500 ${pkg.id.includes('Bk3') ? 'border-gold shadow-2xl scale-105' : 'border-emerald-50 hover:border-emerald-100'}`}>
              <div className="space-y-4">
                <h3 className="text-2xl font-serif text-emerald-950 italic">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-serif italic text-emerald-950/40">{pkg.currency}</span>
                  <span className="text-6xl font-serif font-bold tracking-tighter text-emerald-950">{pkg.price.toFixed(2)}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-950/30">/ mo</span>
                </div>
              </div>

              <ul className="space-y-4 w-full border-t border-emerald-50 pt-10">
                {pkg.features.map((f, i) => (
                  <li key={i} className="text-[10px] font-bold text-emerald-950/50 uppercase tracking-widest flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    {f}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleCheckout(pkg.id)}
                className={`w-full py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 ${pkg.id.includes('Bk3') ? 'bg-gold text-white' : 'bg-emerald-950 text-white'}`}
              >
                {`Authorize ${pkg.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;