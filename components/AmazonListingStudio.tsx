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
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

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

  const orchestrateBlueprint = async () => {
    if (!images[0].b64) return alert("Primary front view is required.");
    setState(AppState.ANALYZING);
    setLoadingMsg("Orchestrating Maison Blueprint...");
    try {
      const activeImages = images.filter(img => img.b64).map(img => ({
        b64: img.b64,
        mimeType: 'image/png',
        role: img.role
      }));
      const suite = await GeminiService.generateAmazonListingSuitePrompts(activeImages);
      setSuitePrompts(suite);
    } catch (err: any) {
      onError(err);
    } finally {
      setState(AppState.READY);
      setLoadingMsg("");
    }
  };

  const generateSlot = async (slotKey: string, slotData: AmazonListingPrompt) => {
    if (userCredits.images !== -1 && userCredits.images <= 0) return onInsufficientCredits();
    
    // Check if slot already exists and remove it to replace
    setResults(prev => prev.filter(r => r.slot !== slotKey));
    
    try {
      const mockAnalysis = {
        type: suitePrompts!.listing_metadata.product_identified,
        brand: brandKit.name,
        material: suitePrompts!.listing_metadata.primary_materials,
        colorPalette: [suitePrompts!.listing_metadata.brand_color_palette],
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

      setResults(prev => [...prev, res]);
      addToHistory({
        id: res.id,
        type: 'image',
        url: res.url,
        prompt: `[AMAZON ${res.type}] ${res.prompt}`,
        timestamp: Date.now()
      });
    } catch (err: any) {
      onError(err);
    }
  };

  const generateAll = async () => {
    if (!suitePrompts) return;
    if (userCredits.images !== -1 && userCredits.images < 9) return onInsufficientCredits();

    setIsGeneratingAll(true);
    setProgress(0);
    const slots = Object.entries(suitePrompts.amazon_suite) as [string, AmazonListingPrompt][];

    for (let i = 0; i < slots.length; i++) {
      const [slotKey, slotData] = slots[i];
      if (results.some(r => r.slot === slotKey)) {
        setProgress(((i + 1) / 9) * 100);
        continue;
      }
      setLoadingMsg(`Rendering Slot ${i + 1}/9: ${slotData.type}...`);
      await generateSlot(slotKey, slotData);
      setProgress(((i + 1) / 9) * 100);
    }
    setIsGeneratingAll(false);
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
    <div className="space-y-32 py-12 animate-lux-in max-w-7xl mx-auto pb-32">
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
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 01</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Upload Assets</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div onClick={() => fileInputRefs[0].current?.click()} className={`aspect-[16/9] rounded-[3.5rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${images[0].url ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 bg-maison-bg/30 hover:border-gold/30'}`}>
                {images[0].url ? <img src={images[0].url} className="w-full h-full object-cover" /> : (
                   <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-gold border border-emerald-50 shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-950/30 uppercase tracking-widest block">Primary Front View</span>
                   </div>
                )}
                <input type="file" ref={fileInputRefs[0]} onChange={(e) => handleFileChange(e, 0)} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                {[1, 2].map(idx => (
                  <div key={idx} onClick={() => fileInputRefs[idx].current?.click()} className={`aspect-square rounded-[2.5rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${images[idx].url ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 bg-maison-bg/30 hover:border-gold/30'}`}>
                    {images[idx].url ? <img src={images[idx].url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest">Detail View {idx}</span>}
                    <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                  </div>
                ))}
              </div>
            </div>
            
            {!suitePrompts && (
              <button 
                onClick={orchestrateBlueprint}
                disabled={state === AppState.ANALYZING || !images[0].url}
                className={`w-full py-7 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${
                  state === AppState.ANALYZING || !images[0].url ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
                }`}
              >
                {state === AppState.ANALYZING ? loadingMsg : 'Orchestrate Listing Blueprint'}
              </button>
            )}
          </section>

          {suitePrompts && (
            <section className="space-y-10 animate-lux-in">
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 02</h3>
                <h2 className="text-4xl font-serif text-emerald-950 italic">Listing Blueprint</h2>
              </div>
              <div className="bg-white rounded-[3.5rem] p-10 border border-emerald-50 soft-shadow space-y-8">
                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-emerald-50">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-emerald-950/40 tracking-widest block mb-1">Identified DNA</span>
                    <p className="text-[11px] font-bold uppercase text-emerald-950">{suitePrompts.listing_metadata.product_identified}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase text-emerald-950/40 tracking-widest block mb-1">Maison Palette</span>
                    <p className="text-[11px] font-bold uppercase text-emerald-950">{suitePrompts.listing_metadata.brand_color_palette}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-[0.4em] block">Suite Architecture</span>
                  <div className="space-y-3">
                    {/* Fixed: Added explicit type cast to Object.entries to resolve 'unknown' property type errors */}
                    {(Object.entries(suitePrompts.amazon_suite) as [string, AmazonListingPrompt][]).map(([key, data], i) => {
                      const isGenerated = results.some(r => r.slot === key);
                      return (
                        <div key={key} className="flex items-center justify-between gap-6 p-4 bg-maison-bg rounded-2xl border border-emerald-50/50 group">
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase text-emerald-950/60 truncate">{i+1}. {data.type}</p>
                              <p className="text-[9px] text-emerald-950/30 italic truncate mt-1">{data.prompt}</p>
                           </div>
                           <button 
                             onClick={() => generateSlot(key, data)}
                             disabled={isGeneratingAll}
                             className={`px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${isGenerated ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-950 border border-emerald-100 hover:border-gold hover:text-gold'}`}
                           >
                             {isGenerated ? 'Regenerate' : 'Render Slot'}
                           </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={generateAll}
                  disabled={isGeneratingAll}
                  className={`w-full py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl ${
                    isGeneratingAll ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
                  }`}
                >
                  {isGeneratingAll ? `Synthesizing ${Math.round(progress)}%` : 'Execute Full Suite Synthesis'}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-24">
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Archives</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Suite Visualization</h2>
            </div>
            
            {results.length > 0 ? (
              <div className="space-y-12">
                 <div className="grid grid-cols-3 gap-6">
                    {results.sort((a,b) => a.slot.localeCompare(b.slot)).map((res) => (
                      <div key={res.id} className="bg-white rounded-3xl p-4 border border-emerald-50 soft-shadow group relative">
                         <div className="aspect-square rounded-2xl overflow-hidden bg-emerald-50/30 shadow-inner mb-4">
                            <MediaAsset src={res.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         </div>
                         <div className="px-1 text-center">
                            <span className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest truncate block">{res.type}</span>
                         </div>
                         <div className="absolute inset-0 bg-emerald-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                            <a href={res.url} download className="p-3 bg-white rounded-xl text-emerald-950 hover:text-gold transition-colors">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                         </div>
                      </div>
                    ))}
                 </div>

                 {results.length === 9 && (
                   <button onClick={downloadAll} className="w-full py-7 bg-gold text-white rounded-full text-[12px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:bg-gold-hover transition-all">Download Full 9-Shot Suite</button>
                 )}
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-[4rem] border border-dashed border-emerald-50 bg-maison-bg/20 flex flex-col items-center justify-center p-20 text-center space-y-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-950/10 shadow-sm">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 </div>
                 <p className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-[0.5em]">Listing Synthesis Pending</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AmazonListingStudio;