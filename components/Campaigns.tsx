
import React, { useState, useRef } from 'react';
import { BrandKit, GenerationResult, ProductCategory, AppState, ModelPersona } from '../types';
import { GeminiService } from '../services/geminiService';
import { modelData } from '../data/models';
import MediaAsset from './MediaAsset';

interface CampaignsProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
}

const Campaigns: React.FC<CampaignsProps> = ({ 
  brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError,
  selectedModel, setSelectedModel
}) => {
  const [productImages, setProductImages] = useState<(string | null)[]>([null, null, null]);
  const [campaignIdea, setCampaignIdea] = useState('');
  const [state, setState] = useState<AppState>(AppState.READY);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [season, setSeason] = useState('Ramadan');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('Instagram post – 1:1');
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [aiConcepts, setAiConcepts] = useState<{label: string, prompt: string}[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const steps = [
    { id: 1, label: 'Upload Assets', active: !!productImages[0] },
    { id: 2, label: 'Choose Identity', active: !!productImages[0] && !!selectedModel },
    { id: 3, label: 'Style & Directive', active: !!productImages[0] && !!selectedModel && campaignIdea.length > 5 },
    { id: 4, label: 'Generate Suite', active: results.length > 0 }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const newImages = [...productImages];
      newImages[index] = dataUrl;
      setProductImages(newImages);

      if (index === 0) {
        setIsGeneratingConcepts(true);
        try {
          const base64 = dataUrl.split(',')[1];
          const concepts = await GeminiService.suggestPhotoshootPrompts(base64, brandKit);
          setAiConcepts(concepts);
        } catch (err) { console.error(err); } finally { setIsGeneratingConcepts(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!campaignIdea || !productImages[0]) return;
    if (userCredits.images <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating Seasonal Suite...");
    try {
      const finalNarrative = `Seasonal: ${season}. Channel: ${selectedChannel}. Idea: ${campaignIdea}. Model Identity: ${selectedModel?.name || 'Standard'}.`;
      const url = await GeminiService.generateCampaignAsset(
        finalNarrative, 
        productImages, brandKit, 
        { category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest', renderMode: 'on-model' },
        selectedChannel.includes('1:1') ? '1:1' : selectedChannel.includes('9:16') ? '9:16' : '16:9'
      );
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignIdea, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      addToHistory(newRes);
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-24 py-12 animate-lux-in">
      {/* 4-Step Flow Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto border-b border-gray-50 pb-16">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-6 flex-1 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-1000 ${
              step.active 
                ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' 
                : 'bg-white border-gray-100 text-gray-200'
            }`}>
              {step.active ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : step.id}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-[0.35em] transition-all duration-700 whitespace-nowrap ${
              step.active ? 'text-emerald-950' : 'text-gray-200'
            }`}>{step.label}</span>
            {idx < steps.length - 1 && (
              <div className="absolute top-6 left-[calc(50%+30px)] right-[calc(-50%+30px)] h-[1px] bg-gray-50" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        {/* Step 1 & 2 */}
        <div className="space-y-20">
          <div className="space-y-10">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 01</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Campaign Assets</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div 
                onClick={() => fileInputRefs[0].current?.click()}
                className={`aspect-[16/9] rounded-[3rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${productImages[0] ? 'border-transparent bg-gray-50 shadow-inner' : 'border-gray-100 hover:border-gold/30'}`}
              >
                {productImages[0] ? <img src={productImages[0]} className="w-full h-full object-cover" /> : (
                  <div className="text-center px-12 italic text-gray-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest block">Deposit Master Banner Asset</span>
                  </div>
                )}
                <input type="file" ref={fileInputRefs[0]} onChange={(e) => handleFileChange(e, 0)} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                 {[1, 2].map(idx => (
                   <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-[2.5rem] border border-dashed flex items-center justify-center cursor-pointer transition-all duration-1000 overflow-hidden ${productImages[idx] ? 'border-transparent bg-gray-50 shadow-inner' : 'border-gray-100 hover:border-gold/30'}`}>
                      {productImages[idx] ? <img src={productImages[idx]!} className="w-full h-full object-cover" /> : (
                         <span className="text-[9px] font-bold text-gray-200 uppercase tracking-widest block">Detail {idx}</span>
                      )}
                      <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 02</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Maison Identity</h2>
            </div>
            <div className="grid grid-cols-2 gap-6 max-h-[450px] overflow-y-auto no-scrollbar p-1">
               {modelData.slice(0, 10).map(m => (
                 <div key={m.id} onClick={() => setSelectedModel(m)} className={`aspect-[3/4] rounded-[2.5rem] overflow-hidden cursor-pointer border-2 transition-all duration-700 relative group ${selectedModel?.id === m.id ? 'border-gold shadow-2xl scale-[0.98]' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                    <img src={m.mainUrl} className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60" />
                    <p className="absolute bottom-8 left-8 text-white text-[12px] font-serif italic">{m.name}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Step 3 & 4 */}
        <div className="space-y-20">
          <div className="space-y-12">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 03</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Campaign Vision</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Creative Blueprint</label>
                  {isGeneratingConcepts && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                      <span className="text-[8px] font-bold text-gold uppercase tracking-widest">Orchestrating concepts...</span>
                    </div>
                  )}
                </div>
                
                <textarea 
                  value={campaignIdea} 
                  onChange={(e) => setCampaignIdea(e.target.value)} 
                  placeholder="Define the overarching campaign vision, seasonal mood, and architectural setting..." 
                  className="w-full bg-gray-50 border-none rounded-[3rem] p-12 text-sm font-serif italic min-h-[240px] focus:ring-1 focus:ring-gold outline-none transition-all focus:bg-white"
                />

                {aiConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-3 px-2">
                    {aiConcepts.map((concept, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCampaignIdea(concept.prompt)}
                        className={`px-6 py-3 bg-white border border-gray-100 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all hover:border-gold hover:text-gold hover:shadow-md ${campaignIdea === concept.prompt ? 'bg-gold/5 border-gold text-gold shadow-lg shadow-gold/10' : 'text-emerald-950/40'}`}
                      >
                        {concept.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Accordion */}
              <div className="border border-gray-100 rounded-[3rem] overflow-hidden bg-white">
                 <button 
                   onClick={() => setShowAdvanced(!showAdvanced)}
                   className="w-full px-12 py-8 flex items-center justify-between group hover:bg-gray-50 transition-colors"
                 >
                   <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-[0.4em]">Advanced Seasonal Parameters</span>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 transition-all ${showAdvanced ? 'rotate-180 bg-gold border-gold text-white' : 'text-emerald-950/20'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                   </div>
                 </button>
                 {showAdvanced && (
                   <div className="px-12 pb-12 grid grid-cols-1 gap-10 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="space-y-4">
                        <label className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest block ml-2">Seasonal Vibe</label>
                        <div className="flex flex-wrap gap-3">
                          {['Ramadan', 'Eid', 'Winter', 'Summer'].map(s => (
                            <button key={s} onClick={() => setSeason(s)} className={`px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-700 ${season === s ? 'bg-gold text-white shadow-lg' : 'bg-gray-50 text-emerald-950/20 hover:text-emerald-950/40'}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest block ml-2">Channel Optimization</label>
                        <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all">
                          <option>Instagram post – 1:1</option>
                          <option>Instagram story – 9:16</option>
                          <option>Website hero – 16:9</option>
                        </select>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-12">
            <div className="space-y-2 text-center">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Step 04</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Execute Campaign Suite</h2>
            </div>
            
            <button 
              onClick={handleGenerate} 
              disabled={state !== AppState.READY || !productImages[0] || !selectedModel || campaignIdea.length < 5}
              className={`px-32 py-8 rounded-full font-bold text-[13px] uppercase tracking-[0.5em] transition-all shadow-2xl ${
                state !== AppState.READY || !productImages[0] || !selectedModel || campaignIdea.length < 5 ? 'bg-gray-50 text-gray-200' : 'bg-emerald-950 text-white hover:bg-gold shadow-emerald-950/20'
              }`}
            >
              {state === AppState.GENERATING ? 'Orchestrating...' : 'Step 4: Execute Suite'}
            </button>

            {results.length > 0 && (
              <div className="w-full space-y-16 animate-lux-in pt-12">
                  {results.map(res => (
                    <div key={res.id} className="bg-white rounded-[4rem] overflow-hidden shadow-2xl relative group border border-gray-100">
                       <img src={res.url} className="w-full object-cover transition-transform duration-[4s] group-hover:scale-[1.05]" />
                       <div className="absolute inset-0 bg-emerald-950/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute bottom-12 right-12 flex gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
                          <a href={res.url} download className="p-8 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[2.5rem] shadow-2xl hover:text-gold transition-all transform hover:scale-110">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                       </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
