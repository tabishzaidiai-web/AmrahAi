
import React from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  const useCases = [
    {
      id: 'fashion',
      label: 'Fashion',
      title: 'Editorial Apparel',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000',
      inputImg: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400',
      description: 'Preserve fabric drape and modest silhouettes with studio-grade lighting.'
    },
    {
      id: 'jewelry',
      label: 'Jewelry',
      title: 'High-Jewelry Macro',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200',
      inputImg: 'https://images.unsplash.com/photo-1573408339311-253bc3546f8d?auto=format&fit=crop&q=80&w=400',
      description: 'Unlock 100% fidelity in gem brilliance and precious metal luster.'
    },
    {
      id: 'beauty',
      label: 'Beauty',
      title: 'Premium Skincare',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200',
      inputImg: 'https://images.unsplash.com/photo-1594489828839-29d0bb8d35a9?auto=format&fit=crop&q=80&w=400',
      description: 'Elegant product staging with water ripples and atmospheric depth.'
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle',
      title: 'Luxury Objects',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200',
      inputImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
      description: 'Sophisticated tech and home goods in high-end architectural settings.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-gold selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[110] px-8 py-6 flex items-center justify-between glass !bg-black/20 !border-white/5">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-2xl font-serif tracking-[0.25em] text-white font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[7px] font-bold text-gold uppercase tracking-[0.6em] mt-1.5">Maison Intelligence</span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-[9px] font-bold uppercase tracking-[0.3em] text-white/50">
            <a href="#how-it-works" className="hover:text-gold transition-colors">Orchestration</a>
            <a href="#fidelity" className="hover:text-gold transition-colors">Precision</a>
            <a href="#use-cases" className="hover:text-gold transition-colors">Gallery</a>
          </div>
        </div>
        <button 
          onClick={() => onEnterApp('editorial')} 
          className="px-10 py-3 bg-white text-black font-bold rounded-full text-[10px] uppercase tracking-[0.3em] hover:bg-gold hover:text-white transition-all btn-luxury"
        >
          Enter Studio
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full h-screen flex flex-col items-center justify-center text-center overflow-hidden border-b border-white/5">
        {/* Absolute Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-40"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>

        <div className="relative z-10 max-w-4xl px-8 space-y-10 animate-in fade-in zoom-in-95 duration-1000">
          <div className="inline-flex items-center gap-4 px-6 py-2 bg-black/60 backdrop-blur-3xl border border-gold/20 rounded-full mx-auto">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
            <span className="text-[9px] font-bold text-gold uppercase tracking-[0.5em]">
              Neural Rendering for Luxury Maisons
            </span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-serif text-white leading-[1.1] font-medium">
            Synthesize Your <br/><span className="italic text-gold">Visual Identity.</span>
          </h1>
          
          <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            Transform standard product photography into cinematic, campaign-ready 4K assets with 100% visual fidelity.
          </p>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => onEnterApp('editorial')}
              className="px-20 py-7 bg-gold text-white font-bold rounded-full text-[13px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all btn-luxury shadow-[0_0_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95"
            >
              Create Luxury Imagery
            </button>
            <div className="flex items-center gap-8 text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">
               <span>Enterprise Ready</span>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span>Free Trial Credits Included</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 flex flex-col items-center gap-4 text-white/20">
          <span className="text-[8px] uppercase tracking-[0.4em] font-bold">Discover</span>
          <div className="w-px h-16 bg-gradient-to-b from-gold/50 to-transparent animate-bounce" />
        </div>
      </header>

      {/* Global Stat Bar */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
           {[
             { label: 'Neural Fidelity', val: '100%', detail: 'Zero deviation rendering' },
             { label: 'Generation Speed', val: '< 20s', detail: 'Real-time studio flow' },
             { label: 'Creative Efficiency', val: '15x', detail: 'Multi-channel sync' },
             { label: 'Global Compliance', val: 'Verified', detail: 'Modesty & safety locked' }
           ].map((stat, i) => (
             <div key={i} className="space-y-2 border-l border-emerald-950/5 pl-8">
                <div className="text-4xl font-serif text-emerald-950 font-medium">{stat.val}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">{stat.label}</span>
                  <span className="text-[9px] text-emerald-950/30 font-medium italic">{stat.detail}</span>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* Case Study Panels */}
      <section id="use-cases" className="bg-[#050505] flex flex-col lg:flex-row overflow-hidden border-b border-white/5">
        {useCases.map((useCase, idx) => (
          <div 
            key={useCase.id}
            className="relative flex-1 group overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 last:border-0 cursor-pointer min-h-[400px] lg:min-h-[600px] transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) hover:flex-[1.5]"
            onClick={() => onEnterApp('editorial', useCase.id as ProductCategory)}
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-emerald-950">
              <img 
                src={useCase.image} 
                className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[3000ms] ease-out opacity-80 group-hover:opacity-100"
                alt={useCase.title}
              />
            </div>
            
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 group-hover:via-black/10 transition-all duration-700" />
            
            {/* Content Container */}
            <div className="absolute inset-0 p-10 flex flex-col justify-end gap-6 z-20">
              <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">
                <div className="flex items-center gap-4">
                  <div className="h-px w-8 bg-gold transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-100" />
                  <span className="px-3 py-1 border border-gold/40 text-gold text-[8px] font-bold uppercase tracking-[0.3em] rounded-full backdrop-blur-sm">
                    {useCase.label}
                  </span>
                </div>
                <h3 className="text-3xl font-serif text-white leading-tight group-hover:text-gold transition-colors duration-500">
                  {useCase.title}
                </h3>
                <p className="text-white/40 text-[11px] font-light leading-relaxed max-w-[280px] opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200">
                  {useCase.description}
                </p>
              </div>

              {/* Neural Mini-Preview */}
              <div className="absolute top-12 left-10 w-20 h-20 rounded-3xl overflow-hidden border border-white/10 shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-700 delay-300 opacity-0 group-hover:opacity-100 group">
                <img src={useCase.inputImg} className="w-full h-full object-cover brightness-50" alt="Input" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[7px] text-gold font-bold uppercase tracking-widest mb-1">Source</span>
                </div>
              </div>
            </div>

            {/* Indicator */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-serif italic">0{idx + 1}</span>
               <div className="w-px h-12 bg-white/20" />
            </div>
          </div>
        ))}
      </section>

      {/* How It Works (Luxury Edition) */}
      <section id="how-it-works" className="py-40 px-8 bg-emerald-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em]">The Orchestration</span>
              <h2 className="text-5xl md:text-7xl font-serif text-white leading-tight">The Three Pillars of Perfection.</h2>
            </div>
            
            <div className="space-y-16">
              {[
                { id: '01', title: 'Maison Identity', desc: 'Secure your Brand DNA. Upload logos, define your visual palette, and set the editorial tone that governs all neural synthesis.' },
                { id: '02', title: 'Product Ground Truth', desc: 'Upload high-resolution source photos. Our vision model isolates the product, locking every texture, stitch, and reflection.' },
                { id: '03', title: 'Neural Casting', desc: 'Assign locked AI identities to your product. Generate consistent global campaigns with zero studio overhead.' }
              ].map((pill, i) => (
                <div key={i} className="flex gap-10 items-start group">
                  <span className="text-4xl font-serif text-gold/20 group-hover:text-gold transition-colors duration-500">{pill.id}</span>
                  <div className="space-y-3">
                    <h4 className="text-xl font-serif text-white">{pill.title}</h4>
                    <p className="text-white/40 text-sm font-light leading-relaxed max-w-sm">{pill.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="aspect-[4/5] bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=90&w=1000" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                      <svg className="w-6 h-6 text-gold fill-gold" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                   </div>
                </div>
                <div className="absolute bottom-10 left-10 right-10 p-8 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10">
                   <span className="text-[9px] font-bold text-gold uppercase tracking-[0.3em] block mb-2">Live Demo</span>
                   <p className="text-xs text-white/80 italic font-light">"Orchestrating high-jewelry macro sequence at 4K..."</p>
                </div>
             </div>
             {/* Decorative element */}
             <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold/10 blur-[100px] rounded-full" />
          </div>
        </div>
      </section>

      {/* Pricing / Footer CTA */}
      <section id="pricing" className="py-40 px-8 bg-white text-emerald-950 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em]">Invitation</span>
          <h2 className="text-5xl md:text-7xl font-serif leading-tight">Elevate your Maison’s digital legacy.</h2>
          <p className="text-emerald-950/40 text-lg font-light max-w-2xl mx-auto">Join the leading luxury brands redefining e-commerce with AMRAH Visual Intelligence.</p>
          
          <div className="pt-8 flex flex-col items-center gap-8">
            <button 
              onClick={() => onEnterApp('editorial')}
              className="px-16 py-6 bg-emerald-950 text-white font-bold rounded-full text-[12px] uppercase tracking-[0.5em] hover:bg-gold transition-all btn-luxury shadow-2xl"
            >
              Begin Your Studio Session
            </button>
            <div className="flex flex-col items-center gap-2">
              <p className="text-emerald-950/20 text-[9px] font-bold uppercase tracking-[0.3em]">Corporate Inquiries:</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-950 hover:text-gold transition-colors cursor-pointer border-b border-gold/30">partnerships@arabianai.maison</p>
            </div>
          </div>
        </div>
        
        {/* Corner decorative logos/patterns */}
        <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none p-20 transform rotate-12">
           <span className="text-[140px] font-serif font-bold uppercase tracking-[0.4em]">AMRAH</span>
        </div>
      </section>

      <footer className="py-20 px-8 border-t border-black/5 bg-[#FAFAFA] text-center">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-serif tracking-[0.3em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[8px] font-bold text-gold uppercase tracking-[0.5em] mt-2">Neural Visual Excellence</span>
          </div>
          
          <div className="flex gap-12 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-950/40">
            <a href="#" className="hover:text-gold">Privacy Protocol</a>
            <a href="#" className="hover:text-gold">Terms of Service</a>
            <a href="#" className="hover:text-gold">Security Ethics</a>
            <a href="#" className="hover:text-gold">Legal</a>
          </div>

          <div className="space-y-2">
            <p className="text-emerald-950/30 text-[9px] font-bold uppercase tracking-widest">&copy; 2026 Arabian AI Neural Engine. All rights reserved.</p>
            <p className="text-[8px] text-emerald-950/10 font-bold uppercase tracking-[0.4em]">Optimized for Global Maison Networks</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
