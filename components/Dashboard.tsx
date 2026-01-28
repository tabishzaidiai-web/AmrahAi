import React from 'react';
import { ProductCategory } from '../types';

interface DashboardProps {
  onEnterApp: (tab?: string, initialCategory?: ProductCategory) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-white text-emerald-950 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-8 py-5 flex items-center justify-between glass">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-2xl font-serif tracking-[0.2em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[8px] font-bold text-gold uppercase tracking-widest mt-1">BY ARABIAN AI</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-emerald-950/60">
            <a href="#how-it-works" className="hover:text-gold transition-colors">How It Works</a>
            <a href="#fidelity" className="hover:text-gold transition-colors">Fidelity</a>
            <a href="#pricing" className="hover:text-gold transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gold transition-colors">FAQ</a>
          </div>
        </div>
        <button 
          onClick={() => onEnterApp('editorial')} 
          className="px-10 py-3 bg-emerald-950 text-white font-bold rounded-full text-[10px] uppercase tracking-widest hover:bg-gold transition-all btn-luxury"
        >
          Launch Studio
        </button>
      </nav>

      {/* Impactful Hero Section */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Subtle Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Amrah Luxury Collection"
          />
          <div className="absolute inset-0 bg-emerald-950/50 backdrop-brightness-75" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-8 flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="text-[11px] font-bold text-gold uppercase tracking-[0.5em] drop-shadow-sm">
            Visual Intelligence for Luxury
          </span>
          <h1 className="text-5xl md:text-8xl font-serif text-white leading-[1.1] font-medium max-w-5xl drop-shadow-md">
            Product-intelligent AI shoots that never break your brand.
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
            Upload your product once. AMRAH creates hyper-realistic images and videos that preserve every logo, color, and detail.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <button 
              onClick={() => onEnterApp('editorial')}
              className="px-14 py-5 bg-gold text-white font-bold rounded-full text-[11px] uppercase tracking-[0.3em] hover:bg-gold-hover transition-all btn-luxury shadow-2xl shadow-gold/20"
            >
              Start Free with 10 Credits
            </button>
            <a 
              href="#fidelity" 
              className="px-14 py-5 bg-white/10 backdrop-blur-md text-white font-bold rounded-full text-[11px] uppercase tracking-[0.3em] hover:bg-white/20 transition-all border border-white/20"
            >
              See Examples
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
          <span className="text-[8px] font-bold uppercase tracking-widest">Scroll to Explore</span>
          <div className="w-px h-8 bg-white/20" />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-8 bg-emerald-950 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">The Journey</span>
            <h2 className="text-4xl md:text-5xl font-serif">Three steps to perfection.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { step: '01', title: 'Set Identity', desc: 'Define your Brand Kit with logos, colors, and the editorial tone that guides every neural render.' },
              { step: '02', title: 'Upload Product', desc: 'A simple photo is all we need. Our AI isolates the product and preserves 100% of its DNA.' },
              { step: '03', title: 'Orchestrate', desc: 'Choose a locked AI model and a scene. AMRAH generates cinematic assets ready for global campaigns.' }
            ].map((item, i) => (
              <div key={i} className="space-y-6 group">
                <span className="text-6xl font-serif text-white/10 group-hover:text-gold/40 transition-colors duration-500">{item.step}</span>
                <h3 className="text-2xl font-serif">{item.title}</h3>
                <p className="text-white/50 text-sm font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Safety & Fidelity */}
      <section id="fidelity" className="py-32 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Safety Protocol</span>
              <h2 className="text-4xl md:text-5xl font-serif text-emerald-950 leading-tight">100% Precision. <br/>Zero Compromise.</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-950">AMRAH preserves:</h4>
                <ul className="space-y-2 text-emerald-950/60 text-sm font-light">
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-gold rounded-full"/> Exact marquise cut and setting integrity.</li>
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-gold rounded-full"/> Metal luster and stone brilliance.</li>
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-gold rounded-full"/> Structural fidelity of multi-band designs.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-950">AMRAH evolves:</h4>
                <ul className="space-y-2 text-emerald-950/60 text-sm font-light">
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-emerald-300 rounded-full"/> Lighting, background, and presentation.</li>
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-emerald-300 rounded-full"/> Luxury editorial staging.</li>
                  <li className="flex items-center gap-3"><div className="w-1 h-1 bg-emerald-300 rounded-full"/> High-end cinematic reflections.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-[3rem] p-8 aspect-square flex items-center justify-center overflow-hidden">
             <div className="grid grid-cols-2 gap-6 w-full h-full">
                <div className="relative group overflow-hidden rounded-[2rem] bg-white border border-black/5 shadow-sm">
                   <img 
                     src="https://files.oaiusercontent.com/file-D0R1WfG72v65A68Gq8o0Yt?se=2025-02-12T16%3A36%3A05Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D45f27663-d142-46a4-8451-8758b292c10b.webp&sig=6K%2BFv6V7rE0zYQ2/6uHk7l%2BfU7X5YgEaN2L9Dk4L3wE%3D" 
                     className="w-full h-full object-cover grayscale-[0.2]" 
                     alt="Ground Truth" 
                   />
                   <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-emerald-950 text-white text-[8px] font-bold uppercase tracking-widest rounded-full opacity-80">Ground Truth</span>
                   </div>
                </div>
                <div className="relative group overflow-hidden rounded-[2rem] bg-white border border-black/5 shadow-sm">
                   <img 
                     src="https://files.oaiusercontent.com/file-M497D2rI9pYhF866QW8i3P?se=2025-02-12T16%3A36%3A11Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D1a2d67da-0857-41e1-b472-353272d3e513.webp&sig=rX/z1m6lR5iO%2Bn6v6uHk7l%2BfU7X5YgEaN2L9Dk4L3wE%3D" 
                     className="w-full h-full object-cover" 
                     alt="Neural Render" 
                   />
                   <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-gold text-white text-[8px] font-bold uppercase tracking-widest rounded-full opacity-90 shadow-lg">Neural Render</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="py-32 px-8 bg-emerald-50 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-5xl font-serif text-emerald-950">Ready to transform your Maison’s digital presence?</h2>
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={() => onEnterApp('editorial')}
              className="px-16 py-6 bg-emerald-950 text-white font-bold rounded-full text-[12px] uppercase tracking-[0.4em] hover:bg-gold transition-all btn-luxury"
            >
              Launch Studio
            </button>
            <p className="text-emerald-950/40 text-xs font-bold uppercase tracking-widest">Enterprise solutions start at $2,500/mo.</p>
          </div>
        </div>
      </section>

      <footer className="py-20 px-8 border-t border-black/5 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xl font-serif tracking-[0.2em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">BY ARABIAN AI</span>
          </div>
          <p className="text-emerald-950/30 text-[9px] font-bold uppercase tracking-widest">&copy; 2026 Arabian AI Engine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;