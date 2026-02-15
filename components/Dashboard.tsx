import React, { useState, useEffect } from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Stop taking bad",
      highlight: "product photos.",
      description: "AMRAH by Arabian AI turns your product images into hyper-realistic, cinematic visuals for luxury fashion, jewelry, and watches — without a studio or photographer.",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop",
      hook: "STUDIO-GRADE 4K SYNTHESIS"
    },
    {
      title: "From simple photos to",
      highlight: "cinematic campaigns.",
      description: "Generate 100+ ready-to-use visuals for your website, ads, and social media in seconds. Calibrated for 100% brand fidelity and modest fashion standards.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
      hook: "ENTERPRISE-READY NEURAL CORE"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-emerald-950 font-sans selection:bg-gold selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[110] px-6 md:px-12 py-6 md:py-8 flex items-center justify-between glass border-b border-emerald-50">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-2xl md:text-3xl font-serif tracking-[0.3em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
          <span className="text-[7px] md:text-[8px] font-bold text-gold uppercase tracking-[0.7em] mt-2">Maison Intelligence</span>
        </div>
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onEnterApp('shoot')} 
            className="hidden md:block text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest hover:text-gold transition-colors"
          >
            Maison Philosophy
          </button>
          <button 
            onClick={() => onEnterApp('shoot')} 
            className="px-6 md:px-10 py-2.5 md:py-3 bg-emerald-950 text-white font-bold rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-gold transition-all btn-luxury"
          >
            Enter Studio
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden bg-emerald-950">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-in-out ${activeSlide === index ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-105 invisible'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-linear"
              style={{ 
                backgroundImage: `url('${slide.image}')`,
                transform: activeSlide === index ? 'scale(1.1)' : 'scale(1.0)'
              }}
            />
            <div className="absolute inset-0 bg-emerald-950/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-white/10" />
          </div>
        ))}

        {/* Content Overlay */}
        <div className="relative z-10 max-w-6xl px-6 md:px-8 space-y-12">
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`transition-all duration-1000 delay-300 ${activeSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 absolute inset-x-0'}`}
            >
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="h-[1px] w-8 bg-gold/50" />
                  <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">
                    {slide.hook}
                  </span>
                  <div className="h-[1px] w-8 bg-gold/50" />
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-serif text-white leading-[1] font-medium tracking-tight drop-shadow-2xl">
                  {slide.title} <br/>
                  <span className="italic text-gold block mt-2">{slide.highlight}</span>
                </h1>
                
                <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto font-serif italic drop-shadow-md px-4 mt-8">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10 pt-4">
            <button 
              onClick={() => onEnterApp('shoot')}
              className="w-full sm:w-auto px-16 md:px-24 py-6 md:py-7 bg-white text-emerald-950 font-bold rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.6em] hover:bg-gold hover:text-white transition-all btn-luxury shadow-2xl active:scale-95"
            >
              Start Your AI Photoshoot
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('maison-experience');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-12 py-6 md:py-7 bg-transparent border border-white/30 text-white font-bold rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.6em] backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95"
            >
              Watch the Premiere
            </button>
          </div>

          {/* Trust Bullets Bar */}
          <div className="pt-20 flex flex-wrap justify-center gap-x-16 gap-y-6 opacity-60">
             {[
               "No studio. No photographer. No editing.",
               "Generate 100+ visuals in minutes.",
               "Perfect for Shopify, Amazon & Etsy."
             ].map((text, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                 <span className="text-[9px] font-bold text-white uppercase tracking-widest">{text}</span>
               </div>
             ))}
          </div>
        </div>
      </header>

      {/* Intro Video Section */}
      <section id="maison-experience" className="py-24 md:py-32 bg-maison-bg relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em]">The Maison Experience</span>
            <h2 className="text-4xl md:text-5xl font-serif text-emerald-950 italic">Where Vision Meets Velocity</h2>
            <p className="text-emerald-950/60 text-sm md:text-base font-serif italic max-w-2xl mx-auto">
              Witness the power of AMRAH as it orchestrates 100% brand-faithful assets in real-time.
            </p>
          </div>

          <div className="relative group max-w-5xl mx-auto">
            {/* Decorative Gold Frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-emerald-950 shadow-2xl border border-emerald-50">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/iD3ulMki7mU?si=vlUBSlVSUnWMRprm&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                title="AMRAH by Arabian AI - Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
            
            {/* Call to Action below Video */}
            <div className="pt-12 text-center">
              <button 
                onClick={() => onEnterApp('shoot')}
                className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-950 hover:text-gold transition-colors flex items-center gap-4 mx-auto group"
              >
                <div className="w-8 h-[1px] bg-gold group-hover:w-12 transition-all" />
                Experience the studio yourself
                <div className="w-8 h-[1px] bg-gold group-hover:w-12 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="bg-emerald-950 flex flex-col lg:flex-row min-h-[700px] relative z-20">
        {[
          { label: 'Fashion', title: 'Haute Abaya & Couture', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000' },
          { label: 'Jewelry', title: 'Absolute Macro Clarity', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200' },
          { label: 'Timepieces', title: 'Horological Precision', img: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1200' },
        ].map((item, i) => (
          <div key={i} className="relative flex-1 group overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 cursor-pointer min-h-[450px] transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) hover:flex-[1.8]" onClick={() => onEnterApp('shoot')}>
            <img src={item.img} className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 transition-all duration-[1500ms] group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" alt={item.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent opacity-80" />
            <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-end">
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">{item.label}</span>
              <h3 className="text-4xl md:text-5xl font-serif text-white group-hover:text-gold transition-colors duration-700">{item.title}</h3>
              <div className="w-0 group-hover:w-24 h-[1px] bg-gold mt-6 transition-all duration-1000" />
            </div>
          </div>
        ))}
      </section>

      {/* Maison Mission */}
      <section className="py-48 px-6 bg-maison-bg text-center relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gold/20" />
         <div className="max-w-4xl mx-auto space-y-14 relative z-10">
            <span className="text-gold text-[11px] font-bold uppercase tracking-[0.8em]">Neural Integrity Protocol</span>
            <h2 className="text-5xl md:text-7xl font-serif text-emerald-950 italic leading-[1.1]">Where Artificial Intelligence <br/>Protects Authentic Artistry.</h2>
            <p className="text-emerald-950/60 text-xl md:text-2xl font-serif leading-relaxed italic max-w-3xl mx-auto">
              Amrah is not just generative; it is regenerative. We don't invent—we amplify. 
              Our engine is calibrated to identify and lock your product's unique visual DNA, 
              ensuring that every AI-synthesized asset remains 100% faithful to the physical original.
            </p>
            <div className="pt-8">
               <button onClick={() => onEnterApp('shoot')} className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold border-b border-gold/30 pb-2 hover:border-gold transition-all">Explore the Technology</button>
            </div>
         </div>
      </section>

      <footer className="py-32 px-12 bg-white text-center border-t border-emerald-50">
        <div className="flex flex-col items-center gap-8">
          <span className="text-3xl md:text-4xl font-serif tracking-[0.4em] text-emerald-950 font-bold uppercase">AMRAH</span>
          <div className="flex gap-12 text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest">
            <a href="#" className="hover:text-gold transition-colors">Privacy</a>
            <a href="#" className="hover:text-gold transition-colors">Enterprise</a>
            <a href="#" className="hover:text-gold transition-colors">Contact</a>
          </div>
          <p className="text-[10px] text-gold uppercase tracking-[0.8em] mt-4">Neural Visual Intelligence Lab</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;