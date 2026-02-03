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
    'Amrah banner.png',
    'Amrah.png',
    'Amrah1.png'
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
          <div className="relative h-[400px] md:h-[500px] rounded-[4rem] overflow-hidden soft-shadow bg-white border border-gray-100">
            {heroImages.map((img, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${currentHero === i ? 'opacity-100' : 'opacity-0'}`}>
                <img src={img} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000'} alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
              </div>
            ))}
            <div className="absolute inset-0 flex flex-col justify-center px-20 space-y-4">
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.5em]">Global Talent Registry</span>
              <h2 className="text-5xl font-serif text-white italic">Maison Identities</h2>
              <p className="text-white/60 text-sm font-light max-w-md">Cast the perfect neural identity for your luxury collection. Every model is calibrated for 100% brand fidelity.</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-gray-100 soft-shadow flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <input 
                type="text" 
                placeholder="Search identities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-maison-bg/50 border-gray-100 pl-6 pr-6 py-4 rounded-2xl text-[12px] font-medium focus:ring-1 focus:ring-gold/20 transition-all"
              />
            </div>
            <div className="flex bg-maison-bg/50 p-1 rounded-2xl border border-gray-100">
              {['All', 'Female', 'Male'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g as any)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    genderFilter === g ? 'bg-white text-black shadow-sm' : 'text-black/30 hover:text-black'
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
              selectedModelId === model.id ? 'border-gold shadow-2xl scale-[0.98]' : 'border-gray-50 hover:border-gold/20'
            } cursor-pointer`}
          >
            <div className="aspect-[4/5] overflow-hidden relative bg-gray-50">
              <MediaAsset src={model.mainUrl} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 transition-opacity" />
              <div className="absolute bottom-10 left-10 right-10 text-white">
                 <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/80 mb-2 block">{model.nationality}</span>
                 <h3 className="text-3xl font-serif italic">{model.name}</h3>
              </div>
            </div>

            <div className="p-10 space-y-6 flex-1 flex flex-col">
                <p className="text-[11px] text-black/40 leading-relaxed font-light italic line-clamp-2">
                  "{model.features}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {model.style.map(s => (
                    <span key={s} className="text-[7px] text-black/60 font-bold uppercase tracking-widest bg-maison-bg px-3 py-1.5 rounded-full border border-gray-100">
                      {s}
                    </span>
                  ))}
                </div>
                {!compact && (
                  <div className="pt-4 mt-auto">
                    <button className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                      selectedModelId === model.id 
                        ? 'bg-gold text-white shadow-xl' 
                        : 'bg-black text-white hover:bg-gold'
                    }`}>
                        {selectedModelId === model.id ? 'Identity Selected' : 'Cast Identity'}
                    </button>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelShowcase;