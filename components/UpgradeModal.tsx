import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StripeService } from '../services/stripeService';

interface UpgradeModalProps {
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { user, session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleStripeCheckout = async (priceId: string) => {
    if (!user) return alert("Maison account required for subscription.");
    
    setLoadingPlan(priceId);
    try {
      await StripeService.initiateCheckout(priceId, user.email, session?.access_token);
    } catch (err: any) {
      console.error("Maison Transaction Error:", err);
      alert("Neural transaction secured but interrupted. Please try again.");
    } finally {
      // Typically the page redirects, but reset for robustness
      setLoadingPlan(null);
    }
  };

  const plans = [
    { 
      id: 'price_1SzyBL3zxqcaKujr2wp32fKp', 
      name: 'Starter Atelier', 
      price: '29.99', 
      currency: 'AED',
      features: ['25 High-Res Image Generations', '5 Video Syntheses', 'Standard Priority', 'Single User Hub'] 
    },
    { 
      id: 'price_1SzyBk3zxqcaKujrgOkgazs8', 
      name: 'Studio Pro', 
      price: '50.00', 
      currency: 'AED',
      features: ['Unlimited Image Renders', '25 Cinematic Video Shots', 'Priority Neural Access', '8K Upscaling', 'Amazon Suite Blueprinting'] 
    },
    { 
      id: 'price_1SzyCE3zxqcaKujraVF31jvj', 
      name: 'Maison Global', 
      price: '150.00', 
      currency: 'AED',
      features: ['Unlimited Video & Image Synthesis', 'Private Neural Training', '24/7 Concierge Support', 'Full API Access', 'Bulk Campaign Orchestration'] 
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/80 backdrop-blur-2xl flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-6xl w-full bg-white rounded-[4rem] p-16 shadow-2xl space-y-16 relative">
        
        {loadingPlan && (
          <div className="absolute inset-0 z-[400] bg-white/90 backdrop-blur-md rounded-[4rem] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-24 h-24 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gold animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20c4.083 0 7.774-2.436 9.262-6H12z" /></svg>
                </div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-3xl font-serif text-emerald-950 italic">Securing Transaction...</h3>
                <p className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.5em]">Neural Encryption in Progress</p>
             </div>
          </div>
        )}

        <button onClick={onClose} className="absolute top-10 right-10 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-4">
          <span className="text-[11px] font-bold text-gold uppercase tracking-[0.5em]">Maison Premium Access</span>
          <h2 className="text-5xl md:text-6xl font-serif text-emerald-950 italic">Scale your visual empire.</h2>
          <p className="text-emerald-950/40 text-[11px] font-bold uppercase tracking-[0.3em]">Unlock 100% Visual Fidelity with High-Fidelity Synthesis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-emerald-50/30 rounded-[3rem] p-10 border flex flex-col items-center text-center group transition-all duration-500 ${plan.id.includes('Bk3') ? 'border-gold shadow-2xl scale-105' : 'border-emerald-50 hover:border-emerald-100'}`}>
              <div className="space-y-4 mb-8">
                {plan.id.includes('Bk3') && <span className="px-4 py-1.5 bg-gold text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-gold/20">Maison Preferred</span>}
                <h3 className="text-3xl font-serif text-emerald-950">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-serif italic text-emerald-950/40">{plan.currency}</span>
                  <span className="text-5xl font-serif font-bold tracking-tighter text-emerald-950">{plan.price}</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-950/40">/ mo</span>
                </div>
              </div>

              <ul className="space-y-4 w-full border-t border-emerald-50 pt-10 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-[10px] font-bold text-emerald-950/50 uppercase tracking-[0.15em] leading-relaxed flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="w-full pt-10">
                <button 
                  onClick={() => handleStripeCheckout(plan.id)} 
                  disabled={loadingPlan !== null}
                  className={`w-full py-6 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-2xl ${
                    plan.id.includes('Bk3') ? 'bg-gold text-white hover:bg-gold-hover' : 'bg-emerald-950 text-white hover:bg-emerald-800'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Securing Plan...' : `Activate ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-8 border-t border-emerald-50">
           <div className="flex items-center justify-center gap-8 opacity-30 grayscale">
              <span className="text-[9px] font-bold uppercase tracking-widest">Secured by Stripe Maison</span>
              <div className="h-4 w-px bg-emerald-950" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Global Payouts</span>
              <div className="h-4 w-px bg-emerald-950" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Neural SSL Certified</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;