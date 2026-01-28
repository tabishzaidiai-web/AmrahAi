
import React, { useState, useMemo } from 'react';
import { ModelPersona, PersonalModelConfig } from '../types';
import { modelData } from '../data/models';
import MediaAsset from './MediaAsset';

interface ModelShowcaseProps {
  onModelSelect?: (model: ModelPersona) => void;
  selectedModelId?: string;
  personalModel: PersonalModelConfig | null;
}

const ModelShowcase: React.FC<ModelShowcaseProps> = ({ onModelSelect, selectedModelId, personalModel }) => {
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
      const matchGen = genderFilter === 'All' || m.gender === genderFilter;
      return matchGen;
    });
  }, [genderFilter, personalModel]);

  return (
    <div className="space-y-12 reveal active">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-emerald-950 font-medium">Neural Talent Casting</h2>
          <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest">Choose a locked identity for your Maison's editorial photoshoot.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-emerald-50 soft-shadow">
          {['All', 'Female', 'Male'].map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g as any)}
              className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                genderFilter === g ? 'bg-emerald-950 text-white shadow-sm' : 'text-emerald-950/30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {filteredModels.map((model) => (
          <div 
            key={model.id} 
            onClick={() => onModelSelect?.(model)}
            className={`group bg-white rounded-3xl overflow-hidden soft-shadow transition-all border-2 ${
              selectedModelId === model.id ? 'border-gold' : 'border-transparent hover:border-gold/30'
            } cursor-pointer`}
          >
            <div className="aspect-[3/4] overflow-hidden relative bg-emerald-50">
              <MediaAsset 
                src={model.mainUrl} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={`${model.name} - ${model.nationality} ${model.gender}`} 
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest bg-white/90 text-emerald-950 backdrop-blur-sm shadow-sm">
                  {model.isPersonal ? 'Private Identity' : model.nationality}
                </span>
              </div>
            </div>
            <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif text-emerald-950">{model.name}</h3>
                    <span className="text-[7px] font-bold text-emerald-950/20 uppercase tracking-widest">{model.gender}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {model.style.map(s => (
                      <span key={s} className="text-[7px] text-emerald-950/40 font-bold uppercase tracking-widest bg-emerald-50/50 px-2 py-0.5 rounded"># {s}</span>
                    ))}
                  </div>
                </div>
                <button className={`w-full py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                  selectedModelId === model.id ? 'bg-gold text-white shadow-gold/20' : 'bg-emerald-950 text-white hover:bg-gold'
                }`}>
                    {selectedModelId === model.id ? 'Talent Cast' : 'Select Identity'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelShowcase;
