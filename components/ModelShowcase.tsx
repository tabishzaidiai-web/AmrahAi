
import React, { useState, useMemo } from 'react';
import { ModelPersona, PersonalModelConfig } from '../types';
import { modelData } from '../data/models';

interface ModelShowcaseProps {
  onModelSelect?: (model: ModelPersona) => void;
  selectedModelId?: string;
  personalModel: PersonalModelConfig | null;
}

const ModelShowcase: React.FC<ModelShowcaseProps> = ({ onModelSelect, selectedModelId, personalModel }) => {
  const [regionFilter, setRegionFilter] = useState<'All' | 'GCC' | 'Global'>('All');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');

  const filteredModels = useMemo(() => {
    let list: ModelPersona[] = [...modelData];
    if (personalModel) {
      list = [{
        id: personalModel.id,
        name: 'Personal Twin',
        nationality: 'User Private',
        region: 'Global',
        gender: 'Female',
        style: ['Personal', 'Unique'],
        mainUrl: personalModel.representativePortrait,
        showcase: [],
        isPersonal: true
      } as ModelPersona, ...list];
    }
    return list.filter(m => {
      const matchRegion = regionFilter === 'All' || m.region === regionFilter;
      const matchGen = genderFilter === 'All' || m.gender === genderFilter;
      return matchRegion && matchGen;
    });
  }, [regionFilter, genderFilter, personalModel]);

  return (
    <div className="space-y-12 reveal active">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Neural Casting</span>
          <h2 className="text-5xl md:text-6xl font-serif text-[#1A1A1A] tracking-tight">Talent Selection</h2>
          <p className="text-[#666] font-light text-xl italic max-w-2xl leading-relaxed">Choose a locked identity for your photoshoot. Every model preserves 100% visual consistency across sessions.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-black/[0.05] soft-shadow self-end">
            {['All', 'Female', 'Male'].map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g as any)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                  genderFilter === g ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 pt-8">
        {filteredModels.map((model) => (
          <div 
            key={model.id} 
            onClick={() => onModelSelect?.(model)}
            className={`group bg-white border rounded-[48px] overflow-hidden flex flex-col transition-all duration-700 soft-shadow cursor-pointer ${
              selectedModelId === model.id ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-black/[0.05]'
            }`}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={model.mainUrl} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" alt={model.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest ${model.isPersonal ? 'bg-[#D4AF37] text-white' : 'bg-white/90 text-[#1A1A1A]'}`}>
                  {model.isPersonal ? 'Private Model' : `${model.region} talent`}
                </span>
              </div>
              <div className="absolute bottom-6 left-8 right-8 space-y-2">
                 <h3 className="text-4xl font-serif text-white italic leading-none">{model.name}</h3>
                 <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{model.nationality}</p>
              </div>
            </div>
            <div className="p-8 border-t border-black/[0.04] flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Identity Status</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Locked & Secure</span>
                </div>
                <button className="px-8 py-3.5 bg-[#1A1A1A] text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest group-hover:bg-[#D4AF37] transition-all">
                    Select Talent
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelShowcase;
