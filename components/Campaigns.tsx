
import React, { useState, useRef, useMemo } from 'react';
import { BrandKit, GenerationResult, ProductCategory } from '../types';
import { GeminiService } from '../services/geminiService';
import MediaAsset from './MediaAsset';

interface CampaignsProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
}

const Campaigns: React.FC<CampaignsProps> = ({ 
  brandKit, 
  addToHistory, 
  initialCategory,
  userCredits,
  onInsufficientCredits 
}) => {
  const [productImages, setProductImages] = useState<(string | null)[]>([null, null, null]);
  const [campaignIdea, setCampaignIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [season, setSeason] = useState('Ramadan');
  const [selectedChannel, setSelectedChannel] = useState('Instagram post – 1:1');

  // Suggestion State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{label: string, prompt: string}[]>([]);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleSuggestPrompts = async () => {
    if (!productImages[0]) return;
    setIsSuggesting(true);
    try {
      const base64 = productImages[0].split(',')[1];
      const suggestions = await GeminiService.suggestCampaignStories(base64, brandKit);
      setAiSuggestions(suggestions.slice(0, 3));
    } catch (err) { console.error("Campaign Suggestion Error:", err); } finally { setIsSuggesting(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newImages = [...productImages];
      newImages[index] = ev.target?.result as string;
      setProductImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!campaignIdea || !productImages[0]) return;
    if (userCredits.images <= 0) return onInsufficientCredits();

    setGenerating(true);
    try {
      const url = await GeminiService.generateCampaignAsset(
        `Seasonal: ${season}. Channel: ${selectedChannel}. Idea: ${campaignIdea}`, 
        productImages, brandKit, 
        { category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest' }
      );
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignIdea, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      addToHistory(newRes);
    } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-end justify-between border-b border-black/5 pb-8">
         <div className="space-y-1">
            <h2 className="text-4xl font-serif text-emerald-950">Campaign Orchestrator</h2>
            <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.4em]">Multi-channel neural asset synchronization.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Step 1: Assets */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">01. Master Assets</span>
                    <button onClick={() => {setProductImages([null, null, null]); setAiSuggestions([]);}} className="text-[8px] font-bold text-gold uppercase tracking-widest">Reset</button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {[0, 1].map(idx => (
                      <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${productImages[idx] ? 'border-transparent bg-emerald-50 shadow-inner' : 'border-emerald-100 hover:border-gold/30'}`}>
                         {productImages[idx] ? <MediaAsset src={productImages[idx]!} className="w-full h-full object-cover" /> : <div className="text-center space-y-1"><svg className="w-5 h-5 mx-auto text-emerald-950/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg><span className="text-[7px] font-bold text-emerald-950/20 uppercase tracking-widest">Asset {idx + 1}</span></div>}
                         <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-emerald-50">
                 <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">02. Seasonal Directive</span>
                 <div className="flex flex-wrap gap-2">
                    {['Ramadan', 'Eid', 'Winter', 'Spring', 'Summer'].map(s => (
                      <button key={s} onClick={() => setSeason(s)} className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${season === s ? 'bg-emerald-950 text-white shadow-lg' : 'bg-emerald-50 text-emerald-950/30 hover:bg-emerald-100'}`}>{s}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Step 2 & 3: Narrative & Output */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">Creative Direction</span>
                    <button 
                      onClick={handleSuggestPrompts}
                      disabled={!productImages[0] || isSuggesting}
                      className="px-6 py-2.5 border-2 border-gold text-gold rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
                    >
                      {isSuggesting ? (
                         <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      Suggest Luxury Prompts
                    </button>
                 </div>
                 <textarea 
                  value={campaignIdea} 
                  onChange={(e) => setCampaignIdea(e.target.value)} 
                  placeholder="Define the overarching campaign vision (e.g. 'A celebration of heritage and modern elegance')..." 
                  className="w-full bg-emerald-50/20 border-2 border-emerald-100/30 rounded-3xl p-8 text-sm italic min-h-[160px] focus:ring-1 focus:ring-gold focus:border-gold transition-all shadow-inner outline-none"
                 />
                 
                 {aiSuggestions.length > 0 && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                       <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Campaign Blueprints</span>
                       <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map((s, i) => (
                             <button 
                                key={i} 
                                onClick={() => setCampaignIdea(s.prompt)}
                                className="px-5 py-2.5 bg-white border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-950/60 uppercase tracking-widest hover:border-gold hover:text-gold transition-all shadow-sm"
                             >
                                {s.label}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-emerald-50">
                 <div className="space-y-4">
                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Master Channel</span>
                    <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest focus:border-gold/30 outline-none">
                       <option>Instagram post – 1:1</option>
                       <option>Instagram story – 9:16</option>
                       <option>Website hero – 16:9</option>
                    </select>
                 </div>
                 <div className="flex flex-col justify-end">
                    <button 
                      onClick={handleGenerate} 
                      disabled={generating || !campaignIdea || !productImages[0]} 
                      className={`w-full py-5 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all ${generating || !campaignIdea || !productImages[0] ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl active:scale-95 shadow-emerald-950/20'}`}
                    >
                      {generating ? 'Orchestrating Narrative...' : 'Execute Banner Suite'}
                    </button>
                 </div>
              </div>
           </div>

           {results.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6 duration-700">
                {results.map((res) => (
                  <div key={res.id} className="bg-white rounded-4xl p-6 border border-emerald-50 soft-shadow group">
                     <div className="aspect-square rounded-3xl overflow-hidden relative shadow-inner">
                        <MediaAsset src={res.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <a href={res.url} download className="px-10 py-4 bg-white text-emerald-950 font-bold text-[10px] uppercase tracking-widest rounded-full shadow-2xl hover:bg-gold hover:text-white transition-all">Download Asset</a>
                        </div>
                     </div>
                     <div className="pt-6 px-4 flex justify-between items-center">
                        <span className="text-[8px] font-bold text-emerald-950/20 uppercase tracking-[0.2em]">{selectedChannel}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
