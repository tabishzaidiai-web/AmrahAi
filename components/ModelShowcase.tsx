
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
  personalModel = null,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [currentHero, setCurrentHero] = useState(0);

  const heroImages = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000'
  ];

  useEffect(() => {
    if (compact) return;
    const timer = setInterval(() => {
      setCurrentHero(prev => (prev + 1) % heroImages.length);
    }, 4000);
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
    <div className={`space-y-16 ${compact ? '' : 'animate-lux-in'}`}>
      {!compact && (
        <>
          {/* Models Hero Carousel */}
          <div className="relative h-[400px] md:h-[500px] rounded-[4rem] overflow-hidden soft-shadow bg-emerald-950">
            {heroImages.map((img, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${currentHero === i ? 'opacity-40' : 'opacity-0'}`}>
                <img src={img} className="w-full h-full object-cover grayscale-[0.5]" alt="Banner" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24 space-y-6">
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">Talent Registry</span>
              <h2 className="text-5xl md:text-6xl font-serif text-white italic leading-tight">Maison Identities</h2>
              <p className="text-white/60 text-sm font-light max-w-md italic font-serif">Cast the perfect neural identity for your luxury collection. Every model is calibrated for 100% brand fidelity.</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-gray-100 soft-shadow flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <input 
                type="text" 
                placeholder="Search by name, features, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none pl-8 pr-8 py-5 rounded-full text-[12px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-gold/20 transition-all outline-none"
              />
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-full border border-gray-100">
              {['All', 'Female', 'Male'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g as any)}
                  className={`px-10 py-3.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                    genderFilter === g ? 'bg-white text-emerald-950 shadow-md' : 'text-emerald-950/20 hover:text-emerald-950/60'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2 gap-8' : 'md:grid-cols-2 lg:grid-cols-3 gap-16'}`}>
        {filteredModels.map((model) => (
          <div 
            key={model.id} 
            onClick={() => onModelSelect?.(model)}
            className={`group bg-white rounded-[4rem] overflow-hidden soft-shadow transition-all border relative flex flex-col h-full ${
              selectedModelId === model.id ? 'border-gold shadow-2xl scale-[0.98]' : 'border-gray-50 hover:border-gold/20'
            } cursor-pointer`}
          >
            <div className="aspect-[3/4] overflow-hidden relative bg-gray-50">
              <MediaAsset src={model.mainUrl} className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110" />
              {selectedModelId === model.id && (
                <div className="absolute top-8 left-8 bg-gold text-white px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-xl animate-bounce">
                  Active Talent
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute bottom-10 left-10 right-10 text-white">
                 <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold mb-2 block">{model.nationality}</span>
                 <h3 className="text-3xl font-serif italic">{model.name}</h3>
              </div>
            </div>

            <div className="p-12 space-y-8 flex-1 flex flex-col">
                <p className="text-[12px] text-emerald-950/40 leading-relaxed font-serif italic line-clamp-3">
                  "{model.features}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {model.style.map(s => (
                    <span key={s} className="text-[7px] text-emerald-950/60 font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-50">
                      {s}
                    </span>
                  ))}
                </div>
                {!compact && (
                  <div className="pt-6 mt-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onModelSelect?.(model); }}
                      className={`w-full py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl ${
                      selectedModelId === model.id 
                        ? 'bg-gold text-white' 
                        : 'bg-emerald-950 text-white hover:bg-gold'
                    }`}>
                        {selectedModelId === model.id ? 'Re-Apply to Shoot' : 'Cast for Active Shoot'}
                    </button>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
      
      {!compact && filteredModels.length === 0 && (
        <div className="text-center py-40">
           <p className="text-sm font-serif text-emerald-950/20 italic">No identities found in the Maison Registry matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default ModelShowcase;
