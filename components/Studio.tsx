
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, LogoPlacement, ProductType, ProductPlacement, CameraAngle } from '../types';
import { GeminiService } from '../services/geminiService';

interface StudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: string;
}

const Studio: React.FC<StudioProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [state, setState] = useState<AppState>(AppState.READY);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [layers, setLayers] = useState<GenerationResult[]>([]);
  const [suggestions, setSuggestions] = useState<{label: string, prompt: string}[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: (initialCategory as any) || 'fashion',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Top-right corner',
    renderMode: 'product-only', 
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setSourceImage(dataUrl);
      setIsAnalyzing(true);
      setState(AppState.ANALYZING);
      setLoadingMsg("Performing Neural Analysis...");

      try {
        const base64 = dataUrl.split(',')[1];
        const [prodAnalysis, aiSuggestions] = await Promise.all([
          GeminiService.analyzeProduct(base64, file.type, brandKit),
          GeminiService.suggestPhotoshootPrompts(base64, brandKit)
        ]);
        setAnalysis(prodAnalysis);
        setSuggestions(aiSuggestions);
      } catch (err) {
        console.warn("Analysis failed, using defaults.");
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally {
        setIsAnalyzing(false);
        setState(AppState.READY);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;
    setState(AppState.GENERATING);
    setLoadingMsg("Synthesizing...");
    try {
      const base64 = sourceImage.split(',')[1];
      let url = genType === 'image' 
        ? await GeminiService.generateProductImage(base64, analysis!, prompt, brandKit, productDetails)
        : await GeminiService.generateProductVideo(base64, analysis!, prompt, brandKit, productDetails, setLoadingMsg);

      const newLayer: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: genType, url, prompt, timestamp: Date.now() };
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      addToHistory(newLayer);
      setState(AppState.READY);
    } catch (err: any) {
      alert(`Render failed: ${err.message}`);
      setState(AppState.READY);
    }
  };

  return (
    <div className="space-y-16 animate-lux-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-serif text-black italic">Neural Master Studio</h2>
        <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.4em]">High-Fidelity Product Orchestration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 soft-shadow space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block ml-2">Product DNA Asset</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${sourceImage ? 'border-transparent bg-gray-50' : 'border-gray-100 hover:border-gold/30'}`}
              >
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-[8px] font-bold uppercase text-gold tracking-widest">Analyzing DNA</span>
                  </div>
                )}
                {sourceImage ? <img src={sourceImage} className="w-full h-full object-cover" alt="Source" /> : (
                  <div className="text-center space-y-2">
                    <span className="text-[9px] font-bold text-gold uppercase tracking-widest block">Upload Product</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-gray-50">
               <div className="space-y-4">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-[9px] font-bold text-black/40 uppercase tracking-widest block">Atmosphere Blueprint</label>
                    {analysis && <span className="text-[8px] font-bold text-gold uppercase tracking-widest">{analysis.type} Identified</span>}
                  </div>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Describe the environment, lighting, and textures..." 
                    className="w-full bg-maison-bg border-none rounded-2xl p-6 text-sm font-serif italic min-h-[140px] focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner"
                  />
                  
                  {/* Dynamic Suggestion Chips */}
                  {suggestions.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest block ml-2">Maison Recommendations</span>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((item, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setPrompt(item.prompt)}
                            className="px-4 py-2 bg-emerald-50/50 border border-emerald-50 rounded-full text-[8px] font-bold text-emerald-950/60 uppercase tracking-widest hover:border-gold hover:text-gold hover:bg-white transition-all active:scale-95"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={state === AppState.GENERATING || !sourceImage || !prompt}
              className={`w-full py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl ${
                state === AppState.GENERATING || !sourceImage || !prompt ? 'bg-gray-100 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
              }`}
            >
              {state === AppState.GENERATING ? loadingMsg : 'Execute Synthesis'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
           {layers.length > 0 ? (
             <div className="grid grid-cols-1 gap-12">
               {layers.map(layer => (
                 <div key={layer.id} className="bg-white rounded-[3.5rem] p-10 border border-gray-100 soft-shadow animate-lux-in group relative">
                   <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-maison-bg border border-gray-50">
                      {layer.type === 'video' ? <video src={layer.url} className="w-full h-full object-cover" controls autoPlay loop /> : <img src={layer.url} className="w-full h-full object-cover" alt="Output" />}
                   </div>
                   <div className="absolute top-16 right-16 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
                      <a href={layer.url} download className="p-5 bg-white shadow-2xl rounded-2xl text-black hover:text-gold transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                   </div>
                   <div className="pt-8 px-6">
                      <p className="text-[11px] text-black/40 font-serif italic">"{layer.prompt}"</p>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="h-full bg-white rounded-[4rem] border border-dashed border-gray-200 flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-maison-bg rounded-full flex items-center justify-center text-black/10">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif text-black italic">Synthesis Workspace</h3>
                  <p className="text-sm text-black/20 max-w-sm mx-auto font-light leading-relaxed">Your neural renders will materialize here. Orchestrate multiple layers to build a cohesive campaign legacy.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Studio;
