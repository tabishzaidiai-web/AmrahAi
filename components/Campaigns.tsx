import React, { useState, useRef, useMemo } from 'react';
import { BrandKit, GenerationResult, ProductCategory } from '../types';
import { GeminiService } from '../services/geminiService';

interface CampaignsProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
}

const Campaigns: React.FC<CampaignsProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [productImages, setProductImages] = useState<(string | null)[]>([null, null, null]);
  const [campaignIdea, setCampaignIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  
  const [season, setSeason] = useState('Ramadan');
  const [channels, setChannels] = useState<string[]>(['Instagram post – 1:1']);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

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
    setGenerating(true);
    try {
      // Logic would typically loop through channels, here we generate one main asset to show simplified flow
      const url = await GeminiService.generateCampaignAsset(
        `Seasonal: ${season}. Channel: ${channels[0]}. Idea: ${campaignIdea}`, 
        productImages, brandKit, 
        { category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest' }
      );
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignIdea, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      addToHistory(newRes);
    } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };

  const channelOptions = ['Instagram post – 1:1', 'Instagram story – 9:16', 'Website hero – 16:9', 'Billboard – 4:3'];

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in duration-700">
      <div className="space-y-2">
         <h2 className="text-4xl font-serif text-emerald-950">Campaigns</h2>
         <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest">Global Narrative Orchestration</p>
      </div>

      <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-16">
        <div className="space-y-12">
          {/* Step 1: Upload */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-8 h-8 rounded-full bg-emerald-950 text-white flex items-center justify-center text-xs font-serif italic">1</span>
               <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">Upload Brand Assets</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
               {[0, 1, 2].map(idx => (
                 <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${productImages[idx] ? 'border-transparent bg-emerald-50' : 'border-emerald-100 hover:border-gold/30'}`}>
                    {productImages[idx] ? <img src={productImages[idx]!} className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest">Asset {idx + 1}</span>}
                    <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                 </div>
               ))}
            </div>
          </div>

          {/* Step 2: Idea */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-8 h-8 rounded-full bg-emerald-950 text-white flex items-center justify-center text-xs font-serif italic">2</span>
               <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">Global Campaign Idea</span>
            </div>
            <textarea 
              value={campaignIdea} 
              onChange={(e) => setCampaignIdea(e.target.value)} 
              placeholder="e.g. Ramadan capsule collection for Gulf luxury shoppers..." 
              className="w-full bg-emerald-50/20 border-none rounded-3xl p-8 text-base italic min-h-[140px] focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Step 3: Presets */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-8 h-8 rounded-full bg-emerald-950 text-white flex items-center justify-center text-xs font-serif italic">3</span>
               <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">Specifications</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-4">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Season</label>
                  <div className="flex flex-wrap gap-2">
                     {['Ramadan', 'Eid', 'Holiday', 'Summer'].map(s => (
                       <button key={s} onClick={() => setSeason(s)} className={`px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${season === s ? 'bg-emerald-950 text-white' : 'bg-emerald-50 text-emerald-950/40'}`}>{s}</button>
                     ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Channels</label>
                  <div className="flex flex-wrap gap-2">
                     {channelOptions.map(c => (
                       <button key={c} onClick={() => setChannels([c])} className={`px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${channels.includes(c) ? 'bg-gold text-white' : 'bg-emerald-50 text-emerald-950/40'}`}>{c}</button>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-emerald-50 flex justify-center">
           <button 
            onClick={handleGenerate} 
            disabled={generating || !campaignIdea || !productImages[0]} 
            className={`px-20 py-5 rounded-full font-bold text-[12px] uppercase tracking-[0.4em] transition-all ${generating || !campaignIdea || !productImages[0] ? 'bg-emerald-50 text-emerald-100' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl shadow-emerald-950/20'}`}
           >
             {generating ? 'Drafting Campaign...' : 'Generate Campaign Assets'}
           </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif text-emerald-950">Master Outputs</h3>
              <button className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest border-b border-gold pb-1">Download All Assets</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {results.map((res, i) => (
                <div key={res.id} className="bg-white rounded-4xl p-6 border border-emerald-50 soft-shadow group">
                   <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 relative">
                      <img src={res.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button className="px-8 py-3 bg-white text-emerald-950 font-bold text-[9px] uppercase tracking-widest rounded-full shadow-2xl">Download</button>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">{channels[0]}</span>
                      <button className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest hover:text-gold">Replace Asset</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;