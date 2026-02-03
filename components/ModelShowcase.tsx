
import React, { useState, useMemo } from 'react';
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
  const [regionFilter, setRegionFilter] = useState<'All' | 'GCC' | 'Global'>('All');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const allAvailableStyles = useMemo(() => {
    const styles = new Set<string>();
    modelData.forEach(m => m.style.forEach(s => styles.add(s)));
    return Array.from(styles).sort();
  }, []);

  const filteredModels = useMemo(() => {
    let list: ModelPersona[] = [...modelData];
    
    if (personalModel) {
      list = [{
        id: personalModel.id,
        name: 'Personal Twin',
        nationality: 'User Private',
        region: 'Global',
        gender: 'Female',
        ageRange: 'Custom',
        style: ['Personal', 'Unique'],
        beautyNotes: 'Calibrated from user data for absolute brand fidelity.',
        features: 'User-defined facial structure and personality.',
        mainUrl: personalModel.representativePortrait,
        showcase: [],
        isPersonal: true,
        defaultPromptFragment: 'Personalized AI identity'
      } as ModelPersona, ...list];
    }

    return list.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.features.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGen = genderFilter === 'All' || m.gender === genderFilter;
      const matchRegion = regionFilter === 'All' || m.region === regionFilter;
      const matchStyles = selectedStyles.length === 0 || selectedStyles.every(s => m.style.includes(s));
      
      return matchSearch && matchGen && matchRegion && matchStyles;
    });
  }, [searchQuery, genderFilter, regionFilter, selectedStyles, personalModel]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  return (
    <div className={`space-y-12 ${compact ? '' : 'animate-lux-in'}`}>
      {!compact && (
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 soft-shadow space-y-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
            <div className="relative w-full lg:max-w-md group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-emerald-950/20 group-focus-within:text-gold transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search identities, features, or nationalities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-100 pl-16 pr-8 py-5 rounded-2xl text-[13px] font-medium outline-none focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-emerald-950/10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                {['All', 'Female', 'Male'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g as any)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      genderFilter === g ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30 hover:text-emerald-950/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-[0.2em] ml-2">Casting Specializations</span>
            <div className="flex flex-wrap gap-2">
              {allAvailableStyles.map(style => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                    selectedStyles.includes(style) 
                      ? 'bg-gold border-gold text-white shadow-lg shadow-gold/20' 
                      : 'bg-white border-gray-100 text-emerald-950/40 hover:border-gold/30 hover:text-emerald-950'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2 gap-8' : 'md:grid-cols-2 lg:grid-cols-3 gap-12'}`}>
        {filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <div 
              key={model.id} 
              onClick={() => onModelSelect?.(model)}
              className={`group bg-white rounded-[3rem] overflow-hidden soft-shadow transition-all border relative flex flex-col h-full ${
                selectedModelId === model.id ? 'border-gold shadow-2xl scale-[0.98]' : 'border-gray-50 hover:border-gold/20'
              } cursor-pointer`}
            >
              {/* Tooltip for Beauty Notes */}
              <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <div className="px-5 py-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 max-w-[200px]">
                  <p className="text-[8px] font-bold text-gold uppercase tracking-widest mb-1.5">Beauty Directives</p>
                  <p className="text-[10px] text-emerald-950/80 leading-relaxed italic font-light">"{model.beautyNotes}"</p>
                </div>
              </div>

              {/* Identity Status */}
              <div className="absolute top-6 left-6 z-10">
                <div className="px-4 py-2 bg-emerald-950/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${selectedModelId === model.id ? 'bg-gold animate-pulse' : 'bg-emerald-500/40'}`} />
                   <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                     {selectedModelId === model.id ? 'Identity Locked' : `Model ${model.id}`}
                   </span>
                </div>
              </div>

              {/* Portrait Zone */}
              <div className="aspect-[4/5] overflow-hidden relative bg-gray-50">
                <MediaAsset 
                  src={model.mainUrl} 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                  alt={`${model.name}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 transition-opacity" />
                
                <div className="absolute bottom-6 left-8 right-8 text-white">
                   <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/80 mb-1 block">{model.nationality}</span>
                   <h3 className="text-3xl font-serif italic">{model.name}</h3>
                </div>
              </div>

              {/* Detail Sheet */}
              <div className="p-8 space-y-6 flex-1 flex flex-col bg-white">
                  <div className="space-y-2">
                    <span className="text-[8px] font-bold text-emerald-950/20 uppercase tracking-widest block">Structural Features</span>
                    <p className="text-[11px] text-emerald-950/60 leading-relaxed font-light italic line-clamp-2">
                      "{model.features}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[8px] font-bold text-emerald-950/20 uppercase tracking-widest block">Casting Fit</span>
                    <div className="flex flex-wrap gap-2">
                      {model.style.map(s => (
                        <span key={s} className="text-[7px] text-emerald-950/60 font-bold uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 group-hover:border-gold/20 group-hover:text-gold transition-all">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!compact && (
                    <div className="pt-4 mt-auto">
                      <button className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${
                        selectedModelId === model.id 
                          ? 'bg-gold text-white shadow-xl shadow-gold/20' 
                          : 'bg-emerald-950 text-white hover:bg-gold shadow-lg shadow-emerald-950/10'
                      }`}>
                          {selectedModelId === model.id ? 'Identity Selected' : 'Cast Identity'}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 text-center space-y-6">
            <h4 className="text-2xl font-serif text-emerald-950 italic opacity-20">No matching identities.</h4>
            <button 
              onClick={() => { setSearchQuery(''); setGenderFilter('All'); setRegionFilter('All'); setSelectedStyles([]); }}
              className="text-gold text-[9px] font-bold uppercase tracking-widest underline underline-offset-8"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelShowcase;
