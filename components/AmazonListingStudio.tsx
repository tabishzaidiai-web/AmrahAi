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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const steps = [
    { id: 1, label: 'Upload Assets', active: !!images[0].url },
    { id: 2, label: 'Blueprint Suite', active: !!suitePrompts },
    { id: 3, label: 'Synthesize', active: results.length > 0 },
    { id: 4, label: 'Complete Archive', active: results.length === 9 }
  ];

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
    if (userCredits.images !== -1 && userCredits.images < 9) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Architecting Listing Suite...");
    setProgress(0);
    setResults([]);

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
            addLogo: !!brandKit.logoUrl,
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

  const downloadAll = async () => {
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const link = document.createElement('a');
      link.href = res.url;
      const safeType = res.type.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `amrah-amazon-slot-${i + 1}-${safeType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  };

  return (
    <div className="space-y-24 py-12 animate-lux-in max-w-7xl mx-auto">
      {/* 4-Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-16">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-6 flex-1 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-700 ${
              step.active 
                ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' 
                : 'bg-white border-gray-100 text-gray-200'
            }`}>
              {step.active ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : step.id}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap ${
              step.active ? 'text-emerald-950' : 'text-gray-200'
            }`}>{step.label}</span>
            {idx < steps.length - 1 && (
              <div className="absolute top-6 left-[calc(50%+30px)] right-[calc(-50%+30px)] h-[1px] bg-gray-50" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-20">
          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 01</h3>
              <h2 className="text-3xl font-serif text-black italic">Upload Assets</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div onClick={() => fileInputRefs[0].current?.click()} className={`aspect-[16/9] rounded-[3rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 ${images[0].url ? 'border-transparent bg-white shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}>
                {images[0].url ? <img src={images[0].url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Primary Front View</span>}
                <input type="file" ref={fileInputRefs[0]} onChange={(e) => handleFileChange(e, 0)} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[1, 2].map(idx => (
                  <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-[2rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 ${images[idx].url ? 'border-transparent bg-white shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}>
                    {images[idx].url ? <img src={images[idx].url} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">Detail View {idx}</span>}
                    <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 02 & 03</h3>
              <h2 className="text-3xl font-serif text-black italic">Orchestrate Suite</h2>
            </div>
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10">
               <div className="space-y-4">
                  <p className="text-sm text-black/40 font-light leading-relaxed">
                    AMRAH will synthesize a full 9-shot listing including lifestyle, isometric, and detailed material views based on your assets.
                  </p>
               </div>

               {/* Advanced Options Accordion */}
               <div className="border-t border-gray-50 pt-6">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] group-hover:text-gold transition-colors">Advanced Optics</span>
                  <svg className={`w-4 h-4 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAdvanced && suitePrompts && (
                  <div className="pt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                      <span className="text-[8px] opacity-40 uppercase tracking-widest block">Identified Product</span>
                      <span className="text-xs font-serif italic text-emerald-950">{suitePrompts.listing_metadata.product_identified}</span>
                    </div>
                    <div>
                      <span className="text-[8px] opacity-40 uppercase tracking-widest block">Primary Materials</span>
                      <span className="text-xs text-emerald-950">{suitePrompts.listing_metadata.primary_materials}</span>
                    </div>
                  </div>
                )}
               </div>

               <button 
                onClick={generateSuite}
                disabled={state === AppState.GENERATING || !images[0].url}
                className={`w-full py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl ${
                  state === AppState.GENERATING || !images[0].url ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
                }`}
               >
                 {state === AppState.GENERATING ? loadingMsg : 'Execute Synthesis'}
               </button>
            </div>
          </section>
        </div>

        <div className="space-y-20">
          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 04</h3>
              <h2 className="text-3xl font-serif text-black italic">Maison Archives</h2>
            </div>
            
            {state === AppState.GENERATING && results.length < 9 ? (
              <div className="aspect-[4/5] bg-white rounded-[3rem] border border-emerald-50 flex flex-col items-center justify-center p-20 text-center space-y-10">
                 <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-50 rounded-full" />
                    <div className="absolute inset-0 border-4 border-gold rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-950">
                      {Math.round(progress)}%
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h3 className="text-2xl font-serif text-emerald-950 italic">{loadingMsg}</h3>
                    <p className="text-[10px] text-emerald-950/30 font-bold uppercase tracking-widest">Neural Suite Progress</p>
                 </div>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-1000">
                 {results.map((res, i) => (
                   <div key={res.id} className="bg-white rounded-3xl p-3 border border-emerald-50 soft-shadow group relative flex flex-col space-y-3">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-emerald-50/30 shadow-inner">
                         <MediaAsset src={res.url} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-1">
                         <span className="text-[7px] font-bold text-gold uppercase tracking-widest block">Slot {i + 1}</span>
                         <span className="text-[8px] text-emerald-950/40 uppercase tracking-widest truncate block">{res.type}</span>
                      </div>
                   </div>
                 ))}
                 {results.length === 9 && (
                    <div className="col-span-3 pt-8">
                      <button onClick={downloadAll} className="w-full py-5 bg-gold text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:bg-gold/80 transition-all">Download Full 9-Shot Suite</button>
                    </div>
                 )}
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-[3rem] border border-dashed border-gray-100 flex flex-col items-center justify-center p-12 text-center space-y-4">
                 <div className="w-16 h-16 bg-maison-bg rounded-full flex items-center justify-center text-black/10">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth={2}/></svg>
                 </div>
                 <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">Synthesis Workspace Empty</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AmazonListingStudio;