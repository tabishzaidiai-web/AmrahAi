import React, { useState } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, ProductType, CameraAngle, ModelPersona, ProductPlacement } from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import MediaAsset from './MediaAsset';

interface PhotoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ 
  brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError,
  selectedModel, setSelectedModel
}) => {
  const [state, setState] = useState<AppState>(AppState.READY);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [lighting, setLighting] = useState('Soft Ambient');
  const [output, setOutput] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [suggestions, setSuggestions] = useState<{label: string, prompt: string}[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'jewelry',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    cameraMotion: 'Static',
    renderMode: 'product-only', 
    videoResolution: '720p',
    videoAspectRatio: '16:9'
  });

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const placements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];
  const lightingPresets = ['Soft Ambient', 'Dramatic Spotlight', 'Golden Hour Glow', 'Studio Noir', 'Natural Daylight'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', 'Bird\'s Eye', 'Side', 'Close-up'];
  
  const steps = [
    { id: 1, label: 'Upload product', active: !!sourceImage },
    { id: 2, label: 'Choose model', active: !!sourceImage && (productDetails.renderMode === 'product-only' || !!selectedModel) },
    { id: 3, label: 'Style & details', active: !!sourceImage && prompt.length > 5 },
    { id: 4, label: 'Generate & download', active: !!output }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setSourceImage(result);
      setState(AppState.ANALYZING);
      setLoadingMsg("Asset Analysis...");
      try {
        const base64 = result.split(',')[1];
        const res = await GeminiService.analyzeProduct(base64, file.type, brandKit);
        setAnalysis(res);
      } catch (err) { 
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { 
        setState(AppState.READY); 
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestPrompts = async () => {
    if (!sourceImage) return;
    setIsSuggesting(true);
    try {
      const base64 = sourceImage.split(',')[1];
      const res = await GeminiService.suggestPhotoshootPrompts(base64, brandKit);
      setSuggestions(res);
    } catch (err) {
      console.error("Neural suggestion failure:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;
    if (userCredits.images !== -1 && userCredits.images <= 0) return onInsufficientCredits();
    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating...");
    try {
      const base64 = sourceImage.split(',')[1];
      const finalPrompt = `Lighting: ${lighting}. Environment: ${prompt}. Camera Angle: ${productDetails.cameraAngle}.`;
      let url = await GeminiService.generateProductImage(base64, analysis!, finalPrompt, brandKit, productDetails);
      setOutput(url);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: finalPrompt, timestamp: Date.now() });
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
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 01</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Upload product</h2>
            </div>
            <div 
              onClick={() => document.getElementById('quick_up')?.click()}
              className={`aspect-square rounded-[3.5rem] border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${sourceImage ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 bg-maison-bg/30 hover:border-gold/30'}`}
            >
              {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-6 px-12">
                   <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-gold border border-emerald-50 shadow-sm">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-950/30 uppercase tracking-widest block">Upload Product</span>
                </div>
              )}
              <input type="file" id="quick_up" onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </section>

          <section className="space-y-10">
             <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 02</h3>
                <h2 className="text-4xl font-serif text-emerald-950 italic">Choose model</h2>
             </div>
             <div className="flex bg-gray-50 p-2 rounded-[2.5rem] border border-emerald-50/50 mb-10">
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'product-only'})}
                  className={`flex-1 py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-700 ${productDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-950/30 hover:text-emerald-950/60'}`}
                >
                  Standalone
                </button>
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'on-model'})}
                  className={`flex-1 py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-700 ${productDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-950/30 hover:text-emerald-950/60'}`}
                >
                  On Model
                </button>
             </div>
             {productDetails.renderMode === 'on-model' && (
                <div className="bg-white border border-emerald-50 rounded-[3.5rem] p-8 soft-shadow animate-in slide-in-from-bottom-4 duration-700">
                   <ModelShowcase compact selectedModelId={selectedModel?.id} onModelSelect={setSelectedModel} />
                </div>
             )}
          </section>
        </div>

        <div className="space-y-24">
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 03</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Style & details</h2>
            </div>

            <div className="bg-white rounded-[3.5rem] p-12 border border-emerald-50 soft-shadow space-y-12">
              <div className="space-y-6">
                <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] block ml-3">Lighting Aesthetic</span>
                <div className="flex flex-wrap gap-3">
                  {lightingPresets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setLighting(preset)}
                      className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 border ${
                        lighting === preset ? 'bg-gold border-gold text-white shadow-xl shadow-gold/10' : 'bg-white border-emerald-50 text-emerald-950/20 hover:text-emerald-950/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-3">
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] block">Atmosphere Blueprint</span>
                  <button 
                    onClick={handleSuggestPrompts}
                    disabled={isSuggesting || !sourceImage}
                    className="text-[9px] font-bold text-gold uppercase tracking-widest hover:text-gold/80 transition-colors disabled:opacity-30 flex items-center gap-2"
                  >
                    {isSuggesting ? (
                      <>
                        <div className="w-2 h-2 border border-gold border-t-transparent rounded-full animate-spin" />
                        Orchestrating...
                      </>
                    ) : (
                      'Suggest Luxury Prompts'
                    )}
                  </button>
                </div>
                <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="Describe the environment and background atmosphere..." 
                  className="w-full bg-maison-bg border-none rounded-[2.5rem] p-10 text-sm font-serif italic min-h-[200px] focus:ring-1 focus:ring-gold outline-none shadow-inner"
                />
                
                {suggestions.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 ml-3">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(s.prompt)}
                        className={`px-4 py-2 bg-emerald-50/50 border border-emerald-50 rounded-full text-[8px] font-bold text-emerald-950/60 uppercase tracking-widest hover:border-gold hover:text-gold hover:bg-white transition-all active:scale-95 text-center leading-tight ${prompt === s.prompt ? 'border-gold text-gold bg-white' : ''}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-emerald-50 pt-10">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] group-hover:text-gold transition-colors">Advanced options</span>
                  <svg className={`w-5 h-5 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAdvanced && (
                  <div className="pt-10 grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-3">Type</label>
                       <select value={productDetails.type} onChange={(e) => setProductDetails({...productDetails, type: e.target.value as ProductType})} className="w-full bg-maison-bg rounded-2xl px-8 py-5 text-[10px] font-bold uppercase outline-none border border-emerald-50/50">
                          {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-3">Camera Angle</label>
                       <select value={productDetails.cameraAngle} onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full bg-maison-bg rounded-2xl px-8 py-5 text-[10px] font-bold uppercase outline-none border border-emerald-50/50">
                          {cameraAngles.map(angle => (
                            <option key={angle} value={angle}>{angle}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-3">Placement</label>
                       <select value={productDetails.placement} onChange={(e) => setProductDetails({...productDetails, placement: e.target.value as ProductPlacement})} className="w-full bg-maison-bg rounded-2xl px-8 py-5 text-[10px] font-bold uppercase outline-none border border-emerald-50/50">
                          {placements.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={state !== AppState.READY || !sourceImage || prompt.length < 5}
                className={`w-full py-7 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${
                  state !== AppState.READY || !sourceImage || prompt.length < 5 ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
                }`}
              >
                {state === AppState.GENERATING ? 'Synthesizing...' : 'Execute Synthesis'}
              </button>
            </div>
          </section>

          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 04</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Generate & download</h2>
            </div>
            {output ? (
              <div className="animate-lux-in">
                 <div className="aspect-square w-full rounded-[4rem] overflow-hidden shadow-2xl relative group bg-white border border-emerald-50">
                    <MediaAsset src={output} className="w-full h-full object-cover" />
                    <div className="absolute top-10 right-10 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                       <a href={output} download className="p-5 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[2rem] shadow-2xl hover:text-gold transition-all">
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </a>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="aspect-square rounded-[4rem] border border-dashed border-emerald-50 bg-maison-bg/20 flex flex-col items-center justify-center p-16 text-center space-y-6">
                 <p className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-[0.5em]">Synthesis Pending</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PhotoStudio;
