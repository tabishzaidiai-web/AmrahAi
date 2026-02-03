
import React, { useState, useRef } from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Direct MP4 Source for high-fidelity background (More reliable than YouTube for banners)
  const bgVideoUrl = "https://cdn.pixabay.com/video/2021/10/12/91645-629853316_tiny.mp4"; 
  const demoVideoId = "iD3ulMki7mU"; 

  const howItWorks = [
    {
      step: "01",
      title: "Deposit Product",
      desc: "Upload a standard high-res photo. Our AI isolates the core product DNA immediately."
    },
    {
      step: "02",
      title: "Select Identity",
      desc: "Choose from our Maison Model Registry or use your own private AI twin."
    },
    {
      step: "03",
      title: "Define Narrative",
      desc: "Describe the lighting, mood, and architectural setting for your campaign."
    },
    {
      step: "04",
      title: "Neural Synthesis",
      desc: "Generate 4K assets or cinematic video with 100% visual fidelity."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-emerald-950 font-sans selection:bg-gold selection:text-white overflow-x-hidden">
      {/* Video Modal - For detailed vision watch */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-20 animate-lux-in">
          <button 
            onClick={() => setShowVideoModal(false)}
            className="absolute top-10 right-10 text-white/40 hover:text-white transition-all z-[1010]"
            aria-label="Close video"
          >
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full max-w-7xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
            <iframe 
              src={`https://www.youtube-nocookie.com/embed/${demoVideoId}?autoplay=1&mute=0&rel=0&modestbranding=1`} 
              className="w-full h-full border-none"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title="AMRAH Vision Video"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[110] px-6 md:px-12 py-6 md:py-8 flex items-center justify-between glass border-b border-emerald-50">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
          <span className="text-[7px] md:text-[8px] font-bold text-gold uppercase tracking-[0.7em] mt-2">Maison Intelligence</span>
        </div>
        <div className="flex items-center gap-6 md:gap-10">
          <a href="#how-it-works" className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-emerald-950/40 hover:text-gold transition-colors">How it Works</a>
          <button 
            onClick={() => onEnterApp('shoot')} 
            className="px-6 md:px-10 py-2.5 md:py-3 bg-emerald-950 text-white font-bold rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-gold transition-all btn-luxury"
          >
            Enter Studio
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Layer 1: High-res Poster Fallback */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000')" }}
        >
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>

        {/* Layer 2: Native Video Background (Fixed Playback Issues) */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <video 
            ref={videoRef}
            src={bgVideoUrl}
            autoPlay 
            muted 
            loop 
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 grayscale-[0.2] transition-opacity duration-[2000ms] ${videoLoaded ? 'opacity-40' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 max-w-6xl px-8 space-y-12 md:space-y-16 animate-lux-in">
          <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/80 backdrop-blur-md rounded-full mx-auto border border-emerald-100 shadow-sm">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-bold text-emerald-950/60 uppercase tracking-[0.4em]">Neural Visual Legacy</span>
          </div>
          
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-5xl md:text-[8rem] font-serif text-emerald-950 leading-[1] md:leading-[0.95] font-medium tracking-tighter">
              Synthesize Your <br/><span className="italic text-gold">Campaign.</span>
            </h1>
            <p className="text-emerald-950/40 text-lg md:text-2xl font-light leading-relaxed max-w-3xl mx-auto font-serif italic">
              Transform standard product photography into cinematic, editorial-ready masterpieces with 100% fidelity.
            </p>
          </div>

          <div className="pt-6 md:pt-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
            <button 
              onClick={() => onEnterApp('shoot')}
              className="w-full md:w-auto px-16 md:px-20 py-6 md:py-7 bg-emerald-950 text-white font-bold rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.5em] hover:bg-gold transition-all btn-luxury shadow-2xl"
            >
              Start Rendering
            </button>
            <button 
              onClick={() => setShowVideoModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-6 md:py-7 border border-emerald-100 bg-white/50 backdrop-blur-sm text-emerald-950 font-bold rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all group"
            >
               <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-gold transition-colors">
                  <svg className="w-4 h-4 fill-emerald-950 group-hover:fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
               </div>
               Watch Vision
            </button>
          </div>
        </div>
      </header>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 md:py-40 bg-white border-t border-emerald-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16 md:space-y-24">
          <div className="text-center space-y-4">
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">The Process</span>
            <h2 className="text-3xl md:text-5xl font-serif text-emerald-950">Maison Production Workflow</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-16">
            {howItWorks.map((item, i) => (
              <div key={i} className="space-y-6 group">
                <div className="text-4xl md:text-5xl font-serif text-emerald-950/5 transition-colors group-hover:text-gold/20 duration-700">{item.step}</div>
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-serif text-emerald-950">{item.title}</h3>
                  <p className="text-[12px] text-emerald-950/40 leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="bg-emerald-950 flex flex-col lg:flex-row min-h-[600px]">
        {[
          { label: 'Fashion', title: 'Editorial Apparel', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000' },
          { label: 'Jewelry', title: 'Precision Macro', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200' },
          { label: 'Beauty', title: 'Premium Skincare', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200' },
          { label: 'Lifestyle', title: 'Luxury Objects', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200' }
        ].map((item, i) => (
          <div key={i} className="relative flex-1 group overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 cursor-pointer min-h-[350px] transition-all duration-1000 hover:flex-[1.5]" onClick={() => onEnterApp('shoot')}>
            <img src={item.img} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" alt={item.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent opacity-60" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
              <span className="text-gold text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
              <h3 className="text-2xl md:text-3xl font-serif text-white mt-2">{item.title}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="py-24 md:py-32 px-12 bg-white text-center">
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-serif tracking-[0.4em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[9px] md:text-[10px] font-bold text-gold uppercase tracking-[0.8em] mt-3">Neural Visual Intelligence</span>
          </div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.5em] opacity-20">&copy; 2026 Arabian AI Lab. Global Luxury Standard.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
