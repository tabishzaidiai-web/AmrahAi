import React, { useState, useRef } from 'react';
import { BrandKit, GenerationResult, ProductCategory, AppState, ModelPersona } from '../types';
import { GeminiService } from '../services/geminiService';
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
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleGenerate = async () => {
    if (!campaignIdea || !productImages[0]) return;
    if (userCredits.images <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating Seasonal Suite...");
    try {
      const url = await GeminiService.generateCampaignAsset(
        campaignIdea, 
        productImages, brandKit, 
        { category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest', renderMode: 'on-model' },
        '16:9'
      );
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignIdea, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      addToHistory(newRes);
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-24 py-12 animate-lux-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-serif text-black italic">Campaign Suites</h2>
        <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.4em]">Multi-Asset Visual Legacy Synthesis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 soft-shadow space-y-10">
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block ml-2">Primary Reference</label>
                <div onClick={() => fileInputRefs[0].current?.click()} className={`aspect-[16/9] rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 ${productImages[0] ? 'border-transparent bg-gray-50' : 'border-gray-100 hover:border-gold/30'}`}>
                  {productImages[0] ? <img src={productImages[0]} className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Main Product</span>}
                  <input type="file" ref={fileInputRefs[0]} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => { const ni = [...productImages]; ni[0] = ev.target?.result as string; setProductImages(ni); }; r.readAsDataURL(f); } }} className="hidden" />
                </div>
             </div>
             
             <div className="space-y-6 pt-10 border-t border-gray-50">
                <label className="text-[9px] font-bold text-black/40 uppercase tracking-widest block ml-2">Narrative Blueprint</label>
                <textarea 
                  value={campaignIdea} 
                  onChange={(e) => setCampaignIdea(e.target.value)} 
                  placeholder="Define the overarching campaign vision..." 
                  className="w-full bg-maison-bg border-none rounded-2xl p-6 text-sm font-serif italic min-h-[180px] focus:ring-1 focus:ring-gold outline-none"
                />
             </div>

             <button 
              onClick={handleGenerate} 
              disabled={state === AppState.GENERATING || !productImages[0] || !campaignIdea}
              className={`w-full py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl ${state === AppState.GENERATING || !productImages[0] || !campaignIdea ? 'bg-gray-100 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'}`}
             >
               {state === AppState.GENERATING ? loadingMsg : 'Synthesize Suite'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-8">
           {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-12">
                 {results.map(res => (
                   <div key={res.id} className="bg-white rounded-[4rem] overflow-hidden shadow-2xl relative group border border-gray-100 animate-lux-in">
                      <img src={res.url} className="w-full object-cover transition-transform duration-[4s] group-hover:scale-[1.05]" />
                      <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all duration-700">
                         <a href={res.url} download className="p-5 bg-white shadow-2xl rounded-2xl text-black hover:text-gold transition-colors">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         </a>
                      </div>
                      <div className="p-10 border-t border-gray-50">
                        <p className="text-[11px] text-black/40 font-serif italic">"{res.prompt}"</p>
                      </div>
                   </div>
                 ))}
              </div>
           ) : (
             <div className="h-full bg-white rounded-[4rem] border border-dashed border-gray-200 flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-maison-bg rounded-full flex items-center justify-center text-black/10">
                   <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif text-black italic">Campaign Orchestration</h3>
                  <p className="text-sm text-black/20 max-w-sm mx-auto font-light leading-relaxed">Deposit your master references to synthesize a unified multi-asset campaign suite optimized for global luxury platforms.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;