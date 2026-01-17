
import React from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  const commissions = [
    { 
      id: 'models', 
      label: 'Neural Model Shoot', 
      desc: 'High-fidelity editorial photography with locked identities.', 
      img: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=800',
      category: 'fashion' as ProductCategory
    },
    { 
      id: 'studio', 
      label: 'Couture Studio', 
      desc: 'Single product neural renders with 100% visual fidelity.', 
      img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
      category: 'jewelry' as ProductCategory
    },
    { 
      id: 'campaign', 
      label: 'Campaign Suite', 
      desc: 'Automated banner and narrative orchestration for brands.', 
      img: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=90&w=800',
      category: 'fashion' as ProductCategory
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A1A1A]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-8 md:px-20 py-8 flex items-center justify-between glass">
        <div className="flex flex-col">
          <span className="text-2xl font-serif tracking-widest text-[#D4AF37] italic font-medium uppercase leading-none">AMRAH</span>
          <span className="text-[6px] font-bold text-zinc-400 uppercase tracking-[0.5em] mt-1">BY ARABIAN AI</span>
        </div>
        <button onClick={() => onEnterApp()} className="px-10 py-3 bg-[#1A1A1A] text-white font-bold rounded-full text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] transition-all">Launch Studio</button>
      </nav>

      {/* High-Impact Responsive Hero */}
      <section className="relative min-h-[85vh] w-full flex items-center justify-center pt-24">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=90&w=2400")',
            filter: 'brightness(0.6)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-1" />

        <div className="relative z-10 text-center space-y-12 px-8 max-w-5xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.8em] block">Heritage Intelligence</span>
              <h1 className="text-6xl md:text-[8rem] font-serif text-white italic tracking-tighter leading-[0.85]">
                AMRAH <br className="hidden md:block" /> <span className="text-white/40">by Arabian AI</span>
              </h1>
              <p className="text-white/80 text-lg md:text-3xl font-light italic max-w-2xl mx-auto leading-relaxed mt-6">
                Hyper-Realistic Visuals for Luxury Brands.
              </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <button 
                onClick={() => onEnterApp('studio')}
                className="px-16 py-6 bg-white text-[#1A1A1A] font-bold rounded-full text-[11px] uppercase tracking-[0.4em] hover:bg-[#D4AF37] hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95"
              >
                Start Free with 50 Credits
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('commissions');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-16 py-6 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full text-[11px] uppercase tracking-[0.4em] hover:bg-white/20 transition-all"
              >
                See Examples
              </button>
           </div>
        </div>
      </section>

      {/* Entry Points Section */}
      <section id="commissions" className="py-32 px-8 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
           <div className="text-center space-y-4">
              <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.4em]">Strategic Engines</span>
              <h2 className="text-5xl font-serif italic text-[#1A1A1A]">Synthesize Your Signature</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {commissions.map((card, i) => (
              <div 
                key={i} 
                onClick={() => onEnterApp(card.id, card.category)}
                className="group bg-white rounded-[48px] overflow-hidden soft-shadow card-hover cursor-pointer border border-black/[0.03]"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img src={card.img} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-10 left-10 right-10 space-y-3">
                    <h3 className="text-3xl font-serif text-white italic">{card.label}</h3>
                    <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">{card.desc}</p>
                  </div>
                </div>
                <div className="p-8 flex justify-center border-t border-black/[0.03]">
                  <button className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.5em] group-hover:tracking-[0.7em] transition-all">Begin Session</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 md:px-20 bg-white border-t border-black/[0.05] text-center">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-serif tracking-widest text-[#D4AF37] italic font-medium uppercase leading-none">AMRAH</span>
            <span className="text-[6px] font-bold text-zinc-400 uppercase tracking-[0.5em] mt-1 text-center">BY ARABIAN AI</span>
          </div>
          <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-[0.4em]">© 2026 AMRAH Engine | All Visuals Synthesized via Neural Core</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
