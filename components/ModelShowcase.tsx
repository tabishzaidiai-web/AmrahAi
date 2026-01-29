
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
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [regionFilter, setRegionFilter] = useState<'All' | 'GCC' | 'Global'>('All');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Extract unique styles from modelData for filter chips
  const allAvailableStyles = useMemo(() => {
    const styles = new Set<string>();
    modelData.forEach(m => m.style.forEach(s => styles.add(s)));
    return Array.from(styles).sort();
  }, []);

  const filteredModels = useMemo(() => {
    let list: ModelPersona[] = [...modelData];
    
    // Inject Personal Twin if available
    if (personalModel) {
      list = [{
        id: personalModel.id,
        name: 'Personal Twin',
        nationality: 'User Private',
        region: 'Global',
        gender: 'Female',
        ageRange: 'Custom',
        style: ['Personal', 'Unique'],
        beautyNotes: 'Calibrated from user data.',
        features: 'User-defined facial structure.',
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search and Primary Filters */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-50 soft-shadow space-y-8">
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
              className="w-full bg-emerald-50/20 border-emerald-50 pl-16 pr-8 py-5 rounded-2xl text-[13px] font-medium outline-none focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-emerald-950/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100">
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

            <div className="flex bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100">
              {['All', 'GCC', 'Global'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r as any)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    regionFilter === r ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30 hover:text-emerald-950/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style Chips */}
        <div className="space-y-4 pt-4 border-t border-emerald-50">
          <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-[0.2em] ml-2">Casting Specializations</span>
          <div className="flex flex-wrap gap-2">
            {allAvailableStyles.map(style => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                  selectedStyles.includes(style) 
                    ? 'bg-gold border-gold text-white shadow-lg shadow-gold/20' 
                    : 'bg-white border-emerald-50 text-emerald-950/40 hover:border-gold/30 hover:text-emerald-950'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <div 
              key={model.id} 
              onClick={() => onModelSelect?.(model)}
              className={`group bg-white rounded-[3rem] overflow-hidden soft-shadow transition-all border-2 relative flex flex-col ${
                selectedModelId === model.id ? 'border-gold ring-4 ring-gold/5' : 'border-transparent hover:border-gold/30'
              } cursor-pointer hover:translate-y-[-4px]`}
            >
              {/* Identity Lock Status */}
              <div className="absolute top-6 left-6 z-10">
                <div className="px-4 py-2 bg-emerald-950/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                   <span className="text-[8px] font-bold text-white uppercase tracking-widest">Locked Identity {model.id}</span>
                </div>
              </div>

              {/* Portrait Zone */}
              <div className="aspect-[4/5] overflow-hidden relative bg-emerald-50">
                <MediaAsset 
                  src={model.mainUrl} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                  alt={`${model.name} - ${model.nationality} ${model.gender}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                
                <div className="absolute bottom-6 left-8 right-8 text-white">
                   <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold mb-1 block">{model.nationality}</span>
                   <h3 className="text-3xl font-serif">{model.name}</h3>
                </div>
              </div>

              {/* Identity Detail Sheet */}
              <div className="p-8 space-y-6 flex-1 flex flex-col bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Age Range</span>
                      <span className="text-[11px] font-medium text-emerald-950">{model.ageRange} Years</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Gender</span>
                      <span className="text-[11px] font-medium text-emerald-950">{model.gender}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Locked Features</span>
                    <p className="text-[11px] text-emerald-950/60 leading-relaxed font-light italic">
                      "{model.features}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Casting Fit</span>
                    <div className="flex flex-wrap gap-1.5">
                      {model.style.map(s => (
                        <span key={s} className="text-[7px] text-gold font-bold uppercase tracking-widest bg-gold/5 px-2.5 py-1 rounded-md border border-gold/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${
                      selectedModelId === model.id 
                        ? 'bg-gold text-white shadow-xl shadow-gold/20' 
                        : 'bg-emerald-950 text-white hover:bg-gold shadow-lg shadow-emerald-950/10'
                    }`}>
                        {selectedModelId === model.id ? 'Identity Selected' : 'Cast Identity'}
                    </button>
                  </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-950/10">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-serif text-emerald-950">No Identities Found</h4>
              <p className="text-sm text-emerald-950/40 font-light max-w-sm mx-auto">Try refining your search query or filters to discover the perfect talent for your Maison.</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setGenderFilter('All'); setRegionFilter('All'); setSelectedStyles([]); }}
              className="text-gold text-[10px] font-bold uppercase tracking-widest underline underline-offset-8"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelShowcase;
