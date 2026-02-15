import React, { useState, useMemo, useEffect } from 'react';
import { ModelPersona, PersonalModelConfig } from '../types';
import { modelData } from '../data/models';
import MediaAsset from './MediaAsset';

interface ModelShowcaseProps {
  onModelSelect?: (model: ModelPersona) => void;
  selectedModelId?: string;
  personalModel?: PersonalModelConfig | null;
  compact?: boolean;
}

const ModelShowcase: React.FC<ModelShowcaseProps> = ({ 
  onModelSelect, 
  selectedModelId, 
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [currentHero, setCurrentHero] = useState(0);

  const heroImages = [
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1200'
  ];

  const steps = [
    { id: 1, label: 'Explore Maison', active: true },
    { id: 2, label: 'Filter Aesthetic', active: !!searchQuery || genderFilter !== 'All' },
    { id: 3, label: 'Cast Identity', active: !!selectedModelId },
    { id: 4, label: 'Identity Secured', active: !!selectedModelId }
  ];

  useEffect(() => {
    if (compact) return;
    const timer = setInterval(() => {
      setCurrentHero(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [compact, heroImages.length]);

  const filteredModels = useMemo(() => {
    let list: ModelPersona[] = [...modelData];
    return list.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.features.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGen = genderFilter === 'All' || m.gender === genderFilter;
      return matchSearch && matchGen;
    });
  }, [searchQuery, genderFilter]);

  return (
    <div className={`space-y-16 pb-20 ${compact ? '' : 'animate-lux-in'}`}>
      {!compact && (
        <>
          {/* 4-Step Indicator Header */}
          <div className="flex items-center justify-between border-b border-gray-50 pb-16">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center gap-6 flex-1 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-700 ${
                  step.active 
                    ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' 
                    : 'bg-white border-gray-100 text-gray-200'
                }`}>
                  {step.active ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : step.id}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap ${
                  step.active ? 'text-emerald-950' : 'text-gray-200'
                }`}>{step.label}</span>
                {idx < steps.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+30px)] right-[calc(-50%+30px)] h-[1px] bg-gray-50" />
                )}
              </div>
            ))}
          </div>

          {/* Models Hero Carousel */}
          <div className="relative h-[450px] md:h-[600px] rounded-[4rem] overflow-hidden soft-shadow bg-emerald-950">
            {heroImages.map((img, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-[2s] ease-in-out ${currentHero === i ? 'opacity-60' : 'opacity-0'}`}>
                <img src={img} className="w-full h-full object-cover" alt={`Campaign ${i}`} />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24 space-y-6">
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">Exclusive Talent Registry</span>
              <h2 className="text-5xl md:text-7xl font-serif text-white italic leading-tight max-w-2xl">Maison Signature <br/>Identities</h2>
              <p className="text-white/70 text-base md:text-lg font-light max-w-md italic font-serif">Select your Maison star. Each identity is a masterpiece of Arabian AI, calibrated for 100% visual fidelity.</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-emerald-50 soft-shadow flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <input 
                type="text" 
                placeholder="Search by name, feature, or style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-emerald-50/20 border-emerald-50 pl-10 pr-10 py-5 rounded-full text-[12px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-gold/20 transition-all outline-none"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-950/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="flex bg-emerald-50/30 p-1.5 rounded-full border border-emerald-50">
              {['All', 'Female', 'Male'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g as any)}
                  className={`px-10 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                    genderFilter === g ? 'bg-white text-emerald-950 shadow-md' : 'text-emerald-950/30 hover:text-emerald-950/60'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2 gap-8' : 'md:grid-cols-2 lg:grid-cols-3 gap-12'}`}>
        {filteredModels.map((model) => (
          <div 
            key={model.id} 
            onClick={() => onModelSelect?.(model)}
            className={`group bg-white rounded-[3.5rem] overflow-hidden soft-shadow transition-all border relative flex flex-col h-full ${
              selectedModelId === model.id ? 'border-gold shadow-2xl scale-[0.98]' : 'border-emerald-50 hover:border-gold/30'
            } cursor-pointer hover:shadow-2xl transition-all duration-500`}
          >
            <div className="aspect-[3/4] overflow-hidden relative bg-emerald-50/10">
              <MediaAsset 
                src={model.mainUrl} 
                className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-105" 
                alt={model.name}
              />
              {selectedModelId === model.id && (
                <div className="absolute top-8 left-8 bg-gold text-white px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-2xl animate-pulse z-10">
                  Identity Locked
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute bottom-10 left-10 right-10 text-white">
                 <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/90 mb-2 block">{model.nationality}</span>
                 <h3 className="text-3xl font-serif italic tracking-tight">{model.name}</h3>
              </div>
            </div>

            <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="text-[13px] text-emerald-950/60 leading-relaxed font-serif italic line-clamp-2">
                    "{model.features}"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {model.style.slice(0, 3).map(s => (
                      <span key={s} className="text-[7px] text-emerald-950/50 font-bold uppercase tracking-widest bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-50/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                
                {!compact && (
                  <div className="pt-6 border-t border-emerald-50/50 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onModelSelect?.(model); }}
                      className={`w-full py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all active:scale-95 ${
                      selectedModelId === model.id 
                        ? 'bg-gold text-white' 
                        : 'bg-emerald-950 text-white hover:bg-gold shadow-emerald-950/10'
                    }`}>
                        {selectedModelId === model.id ? 'Identity Confirmed' : 'Cast Persona'}
                    </button>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
      
      {!compact && filteredModels.length === 0 && (
        <div className="text-center py-40 border border-dashed border-emerald-50/30 rounded-[4rem]">
           <p className="text-lg font-serif text-emerald-950/20 italic">No identities match your current filter criteria in the Maison Registry.</p>
        </div>
      )}
    </div>
  );
};

export default ModelShowcase;