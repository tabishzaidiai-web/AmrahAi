import React, { useState, useRef } from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const bgVideoUrl = "https://cdn.pixabay.com/video/2021/10/12/91645-629853316_tiny.mp4"; 

  return (
    <div className="min-h-screen bg-white text-emerald-950 font-sans selection:bg-gold selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[110] px-6 md:px-12 py-6 md:py-8 flex items-center justify-between glass border-b border-emerald-50">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
          <span className="text-[7px] md:text-[8px] font-bold text-gold uppercase tracking-[0.7em] mt-2">Maison Intelligence</span>
        </div>
        <button 
          onClick={() => onEnterApp('shoot')} 
          className="px-6 md:px-10 py-2.5 md:py-3 bg-emerald-950 text-white font-bold rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-gold transition-all btn-luxury"
        >
          Enter Studio
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
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

        <div className="relative z-10 max-w-6xl px-8 space-y-12 md:space-y-16 animate-lux-in">
          <h1 className="text-5xl md:text-[8rem] font-serif text-emerald-950 leading-[1] md:leading-[0.95] font-medium tracking-tighter">
            Synthesize Your <br/><span className="italic text-gold">Campaign.</span>
          </h1>
          <p className="text-emerald-950/40 text-lg md:text-2xl font-light leading-relaxed max-w-3xl mx-auto font-serif italic">
            Transform standard product photography into cinematic masterpieces with 100% visual fidelity.
          </p>
          <button 
            onClick={() => onEnterApp('shoot')}
            className="px-16 md:px-20 py-6 md:py-7 bg-emerald-950 text-white font-bold rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.5em] hover:bg-gold transition-all btn-luxury shadow-2xl"
          >
            Start Rendering
          </button>
        </div>
      </header>

      {/* Categories */}
      <section className="bg-emerald-950 flex flex-col lg:flex-row min-h-[600px]">
        {[
          { label: 'Fashion', title: 'Editorial Apparel', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000' },
          { label: 'Jewelry', title: 'Precision Macro', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200' },
          { label: 'Beauty', title: 'Premium Skincare', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200' },
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

      <footer className="py-24 px-12 bg-white text-center border-t border-emerald-50">
        <span className="text-3xl font-serif tracking-[0.4em] text-emerald-950 font-bold uppercase">AMRAH</span>
        <p className="text-[9px] text-gold uppercase tracking-[0.8em] mt-3">Neural Visual Intelligence</p>
      </footer>
    </div>
  );
};

export default Dashboard;