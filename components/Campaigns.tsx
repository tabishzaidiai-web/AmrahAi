import React, { useState, useRef, useMemo } from 'react';
import { BrandKit, GenerationResult, ProductCategory, AppState, ModelPersona, ProductDetails } from '../types';
import { GeminiService } from '../services/geminiService';
import MediaAsset from './MediaAsset';
import ModelShowcase from './ModelShowcase';

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

type BannerFormat = '16:9' | '9:16' | '1:1' | '3:4';

interface FormatPreset {
  id: BannerFormat;
  label: string;
  description: string;
}

const formatPresets: FormatPreset[] = [
  { id: '16:9', label: 'Landscape Hero', description: 'Web banners & Wide ads' },
  { id: '9:16', label: 'Mobile Story', description: 'Instagram & TikTok Ads' },
  { id: '1:1', label: 'Social Square', description: 'Feed posts & Carousel' },
  { id: '3:4', label: 'Editorial Portrait', description: 'Premium Lookbooks' },
];

const Campaigns: React.FC<CampaignsProps> = ({ 
  brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError,
  selectedModel, setSelectedModel
}) => {
  const [productImages, setProductImages] = useState<(string | null)[]>([null, null, null]);
  const [campaignIdea, setCampaignIdea] = useState('');
  const [state, setState] = useState<AppState>(AppState.READY);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<BannerFormat>('16:9');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const steps = [
    { id: 1, label: 'Upload product', active: !!productImages[0] },
    { id: 2, label: 'Choose model', active: !!selectedModel },
    { id: 3, label: 'Style & details', active: campaignIdea.length > 5 },
    { id: 4, label: 'Generate & download', active: results.length > 0 }
  ];

  const handleGenerate = async () => {
    if (!campaignIdea || !productImages[0]) return;
    if (userCredits.images !== -1 && userCredits.images <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Synthesizing Banner Suite...");
    try {
      const url = await GeminiService.generateCampaignAsset(
        campaignIdea, 
        productImages, brandKit, 
        { 
          category: initialCategory || 'fashion', 
          type: 'Clothing', 
          approxSize: 'Standard', 
          placement: 'Full body', 
          addLogo: !!brandKit.logoUrl, 
          logoPlacement: 'Top-right corner', 
          renderMode: 'on-model' 
        },
        selectedFormat,
        '1K'
      );
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignIdea, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      addToHistory(newRes);
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-32 py-12 animate-lux-in max-w-6xl mx-auto pb-32">
      {/* 4-Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-20">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-6 flex-1 relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-700 ${
              step.active 
                ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' 
                : 'bg-white border-gray-100 text-gray-200'
            }`}>
              {step.active ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : step.id}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.5em] transition-all duration-700 whitespace-nowrap ${
              step.active ? 'text-emerald-950' : 'text-gray-200'
            }`}>{step.label}</span>
            {idx < steps.length - 1 && (
              <div className="absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-[1px] bg-gray-50" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div className="space-y-24">
          {/* Step 1: Upload product */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 01</h3>
              <h2 className="text-4xl font-serif text-black italic">Upload product</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div onClick={() => fileInputRefs[0].current?.click()} className={`aspect-[16/9] rounded-[3.5rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${productImages[0] ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 bg-maison-bg/30 hover:border-gold/30'}`}>
                {productImages[0] ? <img src={productImages[0]} className="w-full h-full object-cover" /> : (
                   <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-gold border border-emerald-50 shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-950/30 uppercase tracking-widest block">Primary Hero Asset</span>
                   </div>
                )}
                <input type="file" ref={fileInputRefs[0]} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => { const ni = [...productImages]; ni[0] = ev.target?.result as string; setProductImages(ni); }; r.readAsDataURL(f); } }} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                {[1, 2].map(idx => (
                  <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-[2.5rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${productImages[idx] ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 bg-maison-bg/30 hover:border-gold/30'}`}>
                    {productImages[idx] ? <img src={productImages[idx]!} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest">Detail {idx}</span>}
                    <input type="file" ref={fileInputRefs[idx]} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => { const ni = [...productImages]; ni[idx] = ev.target?.result as string; setProductImages(ni); }; r.readAsDataURL(f); } }} className="hidden" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2: Choose model */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 02</h3>
              <h2 className="text-4xl font-serif text-black italic">Choose model</h2>
            </div>
            <div className="bg-white border border-emerald-50 rounded-[3.5rem] p-10 soft-shadow">
               <ModelShowcase compact selectedModelId={selectedModel?.id} onModelSelect={setSelectedModel} />
            </div>
          </section>
        </div>

        <div className="space-y-24">
          {/* Step 3: Style & details */}
          <section className="space-y-12">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 03</h3>
              <h2 className="text-4xl font-serif text-black italic">Style & details</h2>
            </div>
            
            <div className="bg-white rounded-[3.5rem] p-12 border border-emerald-50 soft-shadow space-y-12">
               {/* Campaign Vision */}
               <div className="space-y-6">
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] block ml-3">Creative Directive</span>
                  <textarea 
                    value={campaignIdea} 
                    onChange={(e) => setCampaignIdea(e.target.value)} 
                    placeholder="Define the overarching seasonal vision and atmospheric mood..." 
                    className="w-full bg-maison-bg border-none rounded-[2.5rem] p-10 text-sm font-serif italic min-h-[220px] focus:ring-1 focus:ring-gold outline-none shadow-inner"
                  />
               </div>

               {/* Advanced options Accordion for Format Selection */}
               <div className="border-t border-emerald-50 pt-10">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] group-hover:text-gold transition-colors">Advanced options</span>
                  <svg className={`w-5 h-5 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAdvanced && (
                  <div className="pt-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.4em] block ml-3">Banner Format & Dimensions</span>
                    <div className="grid grid-cols-2 gap-6">
                       {formatPresets.map((preset) => (
                         <button 
                          key={preset.id}
                          onClick={() => setSelectedFormat(preset.id)}
                          className={`p-8 rounded-[2.5rem] border text-left transition-all group ${selectedFormat === preset.id ? 'border-gold bg-gold/5 shadow-xl shadow-gold/5' : 'border-emerald-50 hover:border-gold/20 bg-maison-bg/30'}`}
                         >
                            <div className={`w-10 h-10 rounded-xl mb-6 flex items-center justify-center border transition-all ${selectedFormat === preset.id ? 'bg-gold border-gold text-white' : 'bg-white border-emerald-50 text-emerald-950/10'}`}>
                               <div className="border-2 border-current w-5 h-5 rounded-sm" style={{ aspectRatio: preset.id.replace(':', '/') }} />
                            </div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest ${selectedFormat === preset.id ? 'text-gold' : 'text-emerald-950/60'}`}>{preset.label}</p>
                            <p className="text-[10px] text-emerald-950/30 font-serif italic mt-2">{preset.description}</p>
                         </button>
                       ))}
                    </div>
                  </div>
                )}
               </div>

               <button 
                onClick={handleGenerate} 
                disabled={state === AppState.GENERATING || !productImages[0] || !campaignIdea || !selectedModel}
                className={`w-full py-7 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${state === AppState.GENERATING || !productImages[0] || !campaignIdea || !selectedModel ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'}`}
               >
                 {state === AppState.GENERATING ? loadingMsg : 'Execute Synthesis'}
               </button>
            </div>
          </section>

          {/* Step 4: Generate & download */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 04</h3>
              <h2 className="text-4xl font-serif text-black italic">Generate & download</h2>
            </div>
            {results.length > 0 ? (
              <div className="space-y-12 animate-lux-in">
                 {results.map(res => (
                   <div key={res.id} className="bg-white rounded-[4rem] overflow-hidden shadow-2xl relative group border border-emerald-50">
                      <div className="relative overflow-hidden bg-emerald-50/10" style={{ aspectRatio: selectedFormat.replace(':', '/') }}>
                         <img src={res.url} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
                      </div>
                      <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-700">
                         <a href={res.url} download className="p-5 bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] text-emerald-950 hover:text-gold transition-colors">
                           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         </a>
                      </div>
                      <div className="p-10 border-t border-emerald-50 bg-maison-bg/10">
                        <p className="text-[11px] text-emerald-950/40 font-serif italic">Generated for {formatPresets.find(p => p.id === selectedFormat)?.label}</p>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="aspect-video rounded-[4rem] border border-dashed border-emerald-50 bg-maison-bg/20 flex flex-col items-center justify-center p-20 text-center space-y-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-950/10 shadow-sm">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-[0.5em]">Campaign Library Empty</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;