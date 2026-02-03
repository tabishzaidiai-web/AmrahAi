import React, { useState, useRef } from 'react';
import { BrandKit, AmazonListingSuite, AmazonResult, AppState, AmazonListingPrompt } from '../types';
import { GeminiService } from '../services/geminiService';
import MediaAsset from './MediaAsset';

interface AmazonListingStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: any) => void;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
}

const AmazonListingStudio: React.FC<AmazonListingStudioProps> = ({
  brandKit,
  addToHistory,
  userCredits,
  onInsufficientCredits,
  onError
}) => {
  const [images, setImages] = useState<{ b64: string, role: string, url: string }[]>([
    { b64: '', role: 'Front View (Required)', url: '' },
    { b64: '', role: 'Back View', url: '' },
    { b64: '', role: 'Angle/Detail View', url: '' }
  ]);
  const [state, setState] = useState<AppState>(AppState.READY);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [suitePrompts, setSuitePrompts] = useState<AmazonListingSuite | null>(null);
  const [results, setResults] = useState<AmazonResult[]>([]);
  const [progress, setProgress] = useState(0);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      const url = ev.target?.result as string;
      const newImages = [...images];
      newImages[index] = { ...newImages[index], b64, url };
      setImages(newImages);
      setSuitePrompts(null);
      setResults([]);
    };
    reader.readAsDataURL(file);
  };

  const generateSuite = async () => {
    if (!images[0].b64) return alert("Primary front view is required.");
    if (userCredits.images < 9) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Architecting Listing Suite...");
    setProgress(0);

    try {
      const activeImages = images.filter(img => img.b64).map(img => ({
        b64: img.b64,
        mimeType: 'image/png',
        role: img.role
      }));

      const suite = await GeminiService.generateAmazonListingSuitePrompts(activeImages);
      setSuitePrompts(suite);

      const slots = Object.entries(suite.amazon_suite) as [string, AmazonListingPrompt][];
      const generatedResults: AmazonResult[] = [];

      for (let i = 0; i < slots.length; i++) {
        const [slotKey, slotData] = slots[i];
        setLoadingMsg(`Rendering Slot ${i + 1}/9: ${slotData.type}...`);
        
        const mockAnalysis = {
          type: suite.listing_metadata.product_identified,
          brand: brandKit.name,
          material: suite.listing_metadata.primary_materials,
          colorPalette: [suite.listing_metadata.brand_color_palette],
          features: [],
          visualFidelityKeys: []
        };

        const url = await GeminiService.generateProductImage(
          images[0].b64,
          mockAnalysis,
          slotData.prompt,
          brandKit,
          {
            category: 'other',
            type: 'Other',
            approxSize: 'Standard',
            placement: 'Full body',
            addLogo: brandKit.logoUrl ? true : false,
            logoPlacement: 'Center front',
            renderMode: 'product-only'
          },
          "1:1"
        );

        const res: AmazonResult = {
          id: Math.random().toString(36).substr(2, 9),
          prompt: slotData.prompt,
          url,
          slot: slotKey,
          type: slotData.type
        };

        generatedResults.push(res);
        setResults([...generatedResults]);
        setProgress(((i + 1) / 9) * 100);
        
        addToHistory({
          id: res.id,
          type: 'image',
          url: res.url,
          prompt: `[AMAZON ${res.type}] ${res.prompt}`,
          timestamp: Date.now()
        });
      }

    } catch (err: any) {
      onError(err);
    } finally {
      setState(AppState.READY);
      setLoadingMsg("");
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert("Prompt copied to clipboard.");
  };

  const downloadAll = async () => {
    results.forEach((res, i) => {
      const link = document.createElement('a');
      link.href = res.url;
      link.download = `amazon-listing-slot-${i+1}.png`;
      link.click();
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-end justify-between border-b border-black/5 pb-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif text-emerald-950">Amazon Listing Studio</h2>
          <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.4em]">9-Slot Cohesive Production Suite</p>
        </div>
        {results.length === 9 && (
          <button 
            onClick={downloadAll}
            className="px-8 py-3 bg-emerald-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-xl"
          >
            Download Entire Suite
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
            <div className="p-6 bg-gold/5 border border-gold/20 rounded-3xl space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Production Mode Active</span>
              </div>
              <p className="text-[10px] text-emerald-950/60 font-medium leading-relaxed">
                A full 9-shot suite requires 9 credits. Ensure your assets are clear for absolute fidelity.
              </p>
            </div>

            <div className="space-y-6">
              <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">01. Source Assets</span>
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest ml-1">{img.role}</label>
                    <div 
                      onClick={() => fileInputRefs[idx].current?.click()}
                      className={`aspect-video rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${img.url ? 'border-transparent bg-emerald-50 shadow-inner' : 'border-emerald-100 hover:border-gold/30'}`}
                    >
                      {img.url ? (
                        <img src={img.url} className="w-full h-full object-cover" alt={img.role} />
                      ) : (
                        <div className="text-center space-y-1">
                          <svg className="w-6 h-6 mx-auto text-emerald-950/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
                          <span className="text-[8px] font-bold text-emerald-950/20 uppercase tracking-widest">Select Image</span>
                        </div>
                      )}
                      <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" accept="image/*" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={generateSuite}
              disabled={state === AppState.GENERATING || !images[0].url}
              className={`w-full py-5 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 ${state === AppState.GENERATING || !images[0].url ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-emerald-950/20'}`}
            >
              {state === AppState.GENERATING ? "Orchestrating..." : "Generate Amazon Suite"}
            </button>
          </div>

          {suitePrompts && (
            <div className="bg-emerald-950 rounded-4xl p-8 border border-white/5 soft-shadow space-y-6 text-white animate-in slide-in-from-top-4">
              <span className="text-[9px] font-bold text-gold uppercase tracking-[0.3em]">Listing Metadata</span>
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] opacity-40 uppercase tracking-widest block">Product</span>
                  <span className="text-sm font-serif italic">{suitePrompts.listing_metadata.product_identified}</span>
                </div>
                <div>
                  <span className="text-[8px] opacity-40 uppercase tracking-widest block">Materials</span>
                  <span className="text-xs">{suitePrompts.listing_metadata.primary_materials}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gold" />
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Consistency Lock Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {state === AppState.GENERATING && results.length < 9 ? (
            <div className="h-full bg-white rounded-[3rem] border border-emerald-50 flex flex-col items-center justify-center p-20 text-center space-y-10">
               <div className="relative">
                  <div className="w-24 h-24 border-4 border-emerald-50 rounded-full" />
                  <div 
                    className="absolute inset-0 border-4 border-gold rounded-full border-t-transparent animate-spin" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-950">
                    {Math.round(progress)}%
                  </div>
               </div>
               <div className="space-y-3">
                  <h3 className="text-2xl font-serif text-emerald-950 italic">{loadingMsg}</h3>
                  <p className="text-[10px] text-emerald-950/30 font-bold uppercase tracking-widest">Gemini Intelligence engaged</p>
               </div>
               <div className="w-full max-w-xs h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                  <div className="h-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
               </div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000">
               {results.map((res, i) => (
                 <div key={res.id} className="bg-white rounded-3xl p-4 border border-emerald-50 soft-shadow group relative flex flex-col space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-emerald-50/30 shadow-inner">
                       <MediaAsset src={res.url} className="w-full h-full object-cover" />
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => copyPrompt(res.prompt)}
                            className="p-2 bg-white text-emerald-950 rounded-lg shadow-xl hover:text-gold transition-all"
                            title="Copy Prompt"
                          >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                       </div>
                    </div>
                    <div className="px-2 pb-2">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[7px] font-bold text-gold uppercase tracking-[0.2em]">Slot {i + 1}</span>
                          <span className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest">{res.type}</span>
                       </div>
                       <p className="text-[9px] text-emerald-950/60 line-clamp-2 italic leading-relaxed font-light">"{res.prompt}"</p>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="h-full bg-white rounded-[3rem] border border-emerald-50 border-dashed flex flex-col items-center justify-center p-20 text-center space-y-6">
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-950/10">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth={2}/></svg>
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-serif text-emerald-950">Architect your global listing.</h3>
                  <p className="text-sm text-emerald-950/40 max-w-sm mx-auto font-light leading-relaxed">Upload your product views to generate a complete 9-shot Amazon listing suite with consistent branding and technical precision.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmazonListingStudio;