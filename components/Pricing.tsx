
import React from 'react';
import { SubscriptionPackage } from '../types';

interface PricingProps {
  onSelect: (pkg: SubscriptionPackage) => void;
  onClose: () => void;
}

const packages: SubscriptionPackage[] = [
  {
    id: 'boutique',
    name: 'Boutique',
    price: 5,
    imageCredits: 10,
    videoCredits: 10,
    features: ['10 4K Image Renders', '10 Cinematic Video Shots', 'Brand Kit Persistence', 'Standard Fidelity']
  },
  {
    id: 'atelier',
    name: 'Atelier',
    price: 10,
    imageCredits: 20,
    videoCredits: 20,
    features: ['20 4K Image Renders', '20 Cinematic Video Shots', 'Priority Neural Rendering', 'High-Fidelity Mode']
  },
  {
    id: 'maison',
    name: 'Maison',
    price: 25,
    imageCredits: 50,
    videoCredits: 50,
    features: ['50 4K Image Renders', '50 Cinematic Video Shots', 'Early Access Features', 'Ultra-Fidelity Renders', '24/7 Concierge Support']
  }
];

const Pricing: React.FC<PricingProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/60 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl w-full bg-white rounded-[3rem] p-12 relative overflow-hidden shadow-2xl space-y-12 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-8 right-8 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Subscription Concierge</span>
          <h2 className="text-5xl font-serif text-emerald-950">Scale your digital presence.</h2>
          <p className="text-emerald-950/40 text-[11px] font-bold uppercase tracking-[0.3em]">Neural limits refresh automatically every 30 days</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-emerald-50/30 border border-emerald-50 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 group hover:bg-emerald-950 hover:text-white transition-all duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-serif italic">$</span>
                  <span className="text-6xl font-serif font-bold tracking-tighter">{pkg.price}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">/ mo</span>
                </div>
              </div>

              <div className="space-y-5 w-full">
                <div className="p-4 bg-white/50 rounded-2xl border border-white/20 group-hover:bg-white/10">
                   <p className="text-[10px] font-bold uppercase tracking-[0.1em]">{pkg.imageCredits} Image + {pkg.videoCredits} Video Credits</p>
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
                onClick={() => onSelect(pkg)}
                className="w-full py-5 bg-emerald-950 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.4em] group-hover:bg-gold transition-all btn-luxury"
              >
                Authorize Upgrade
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-emerald-950/20 font-bold uppercase tracking-widest italic leading-relaxed">
            Need a high-volume Enterprise Maison plan? <a href="#" className="text-gold underline decoration-gold/30 underline-offset-4">Contact Global Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
