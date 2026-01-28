
import React, { useState } from 'react';
import { SubscriptionPackage } from '../types';

interface PricingProps {
  onSelect: (pkg: SubscriptionPackage) => void;
  onClose: () => void;
}

const packages: SubscriptionPackage[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    imageCredits: 5,
    videoCredits: 0,
    features: ['5 4K Image Renders', 'Limited Brand DNA Persistence', 'Standard Studio Access']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    imageCredits: -1, // Unlimited
    videoCredits: 20,
    features: ['Unlimited 4K Image Renders', '20 Cinematic Video Shots', 'Priority Neural Rendering', 'High-Fidelity Mode', 'Multi-User Maison Access']
  },
  {
    id: 'maison',
    name: 'Maison',
    price: 49.00,
    imageCredits: -1,
    videoCredits: -1,
    features: ['Unlimited Image Renders', 'Unlimited Cinematic Film Shots', '24/7 Concierge Support', 'API & JSON Orchestrator', 'Enterprise White-Labeling']
  }
];

const Pricing: React.FC<PricingProps> = ({ onSelect, onClose }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStripeCheckout = (pkg: SubscriptionPackage) => {
    if (pkg.price === 0) return onSelect(pkg);
    
    setProcessingId(pkg.id);
    // Simulate Stripe Redirect
    setTimeout(() => {
       setProcessingId(null);
       onSelect(pkg);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/60 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl w-full bg-white rounded-[3rem] p-12 relative overflow-hidden shadow-2xl space-y-12 max-h-[90vh] overflow-y-auto">
        {processingId && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-serif text-emerald-950">Synchronizing with Stripe...</h3>
               <p className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Securing Maison Transaction</p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="absolute top-8 right-8 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Subscription Concierge</span>
          <h2 className="text-5xl font-serif text-emerald-950">Scale your digital presence.</h2>
          <p className="text-emerald-950/40 text-[11px] font-bold uppercase tracking-[0.3em]">Unlock 100% Visual Fidelity with Pro Unlimited</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`bg-emerald-50/30 border-2 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 group transition-all duration-500 ${pkg.name === 'Pro' ? 'border-gold shadow-2xl scale-105' : 'border-emerald-50'}`}>
              <div className="space-y-2">
                <div className="flex flex-col items-center gap-2">
                   {pkg.name === 'Pro' && <span className="bg-gold text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>}
                   <h3 className="text-2xl font-serif">{pkg.name}</h3>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-serif italic">$</span>
                  <span className="text-6xl font-serif font-bold tracking-tighter">{pkg.price.toFixed(0)}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">/ mo</span>
                </div>
              </div>

              <div className="space-y-5 w-full">
                <div className={`p-4 rounded-2xl border ${pkg.name === 'Pro' ? 'bg-gold/5 border-gold/20' : 'bg-white/50 border-white/20'}`}>
                   <p className="text-[10px] font-bold uppercase tracking-[0.1em]">
                     {pkg.imageCredits === -1 ? 'Unlimited' : pkg.imageCredits} Images + {pkg.videoCredits === -1 ? 'Unlimited' : pkg.videoCredits} Videos
                   </p>
                </div>
                <ul className="space-y-3">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-[10px] font-medium opacity-60 flex items-center justify-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handleStripeCheckout(pkg)}
                className={`w-full py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 ${pkg.name === 'Pro' ? 'bg-gold text-white' : 'bg-emerald-950 text-white'}`}
              >
                {pkg.price === 0 ? 'Current Plan' : 'Select Maison Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-emerald-950/20 font-bold uppercase tracking-widest italic leading-relaxed">
            Payment secured by <span className="text-emerald-950 font-bold">Stripe Maison Network</span>. <br/>All plans include 256-bit encryption.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
