
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ModelPersona, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, ProductAnalysis, CameraAngle, CameraMotion } from '../types';
import { GeminiService } from '../services/geminiService';
import { modelData } from '../data/models';
import ImageEditor from './ImageEditor';
import ModelShowcase from './ModelShowcase';
import MediaAsset from './MediaAsset';

interface CreateShootProps {
  brandKit: BrandKit;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
  addToHistory: (res: GenerationResult) => void;
  onGoBackToModels: () => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
}

const CreateShoot: React.FC<CreateShootProps> = ({ 
  brandKit, selectedModel, setSelectedModel, addToHistory, 
  onGoBackToModels, initialCategory, userCredits, onInsufficientCredits 
}) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Intelligence Logic
  const [aiSuggestions, setAiSuggestions] = useState<{label: string, prompt: string}[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Motion Conversion State
  const [isConvertingToVideo, setIsConvertingToVideo] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [showMotionControls, setShowMotionControls] = useState(false);

  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion', 
    type: 'Clothing', 
    approxSize: 'Standard', 
    placement: 'Full body', 
    addLogo: false, 
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    cameraMotion: 'Static',
    renderMode: 'product-only', 
    videoResolution: '720p',
    videoAspectRatio: '16:9'
  });

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', "Bird's Eye", 'Side', 'Close-up'];
  const cameraMotions: CameraMotion[] = ['Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Zoom In', 'Zoom Out'];
  const logoPlacements: LogoPlacement[] = ['Chest', 'Center front', 'Wrist/dial center', 'Bag front', 'Top-right corner', 'Background watermark'];

  const motionSuggestions = [
    { label: "Cinematic Dolly", prompt: "A slow dolly-in towards the model and product." },
    { label: "Fashion Pan", prompt: "A professional horizontal pan following the drape of the garment." },
    { label: "Atmospheric Zoom", prompt: "A soft, subtle zoom-in on the product details." }
  ];

  const steps = [
    { id: 1, label: 'Upload Product' },
    { id: 2, label: 'Choose Model' },
    { id: 3, label: 'Style & Details' },
    { id: 4, label: 'Generate' }
  ];

  const handleSuggestPrompts = async () => {
    if (!productImage) return;
    setIsSuggesting(true);
    try {
      const base64 = productImage.split(',')[1];
      const suggestions = await GeminiService.suggestCampaignStories(base64, brandKit);
      setAiSuggestions(suggestions.slice(0, 3));
    } catch (err) { console.error("Suggestion Error:", err); } finally { setIsSuggesting(false); }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setProductImage(dataUrl);
      setState(AppState.ANALYZING);
      setLoadingMsg("Identifying DNA...");
      try {
        const res = await GeminiService.analyzeProduct(dataUrl.split(',')[1], file.type, brandKit);
        setAnalysis(res);
        if (res.type) {
          const matched = productTypes.find(t => t.toLowerCase().includes(res.type.toLowerCase())) || 'Other';
          setProductDetails(prev => ({ ...prev, type: matched as ProductType }));
        }
      } catch (e) { 
        console.error("Analysis failed", e);
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { setState(AppState.READY); }
    };
    reader.readAsDataURL(file);
  };

  const currentStep = useMemo(() => {
    if (!productImage) return 1;
    if (!selectedModel && productDetails.renderMode === 'on-model') return 2;
    if (!output) return 3;
    return 4;
  }, [productImage, selectedModel, output, productDetails.renderMode]);

  const handleGenerate = async () => {
    if (!productImage) return;
    if (productDetails.renderMode === 'on-model' && !selectedModel) return;
    if (genType === 'image' && userCredits.images <= 0) return onInsufficientCredits();
    if (genType === 'video' && userCredits.videos <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Securing Visual Fidelity...");
    try {
      let finalPrompt = "";
      if (productDetails.renderMode === 'product-only') {
        finalPrompt = `[STRICT PRODUCT-ONLY MODE: Never generate humans, hands or faces.] ${customPrompt || 'Professional product editorial'}`;
      } else {
        let strictRules = `[STRICT MODESTY & FIDELITY LOCK: Never change product logo, color, or shape. Lock model identity to the source portrait.]`;
        finalPrompt = `${strictRules} ${selectedModel?.defaultPromptFragment || ''} ${customPrompt || 'Professional editorial shoot'}`;
      }
      
      const resultUrl = await GeminiService.generatePhotoshoot({
        model: productDetails.renderMode === 'on-model' ? selectedModel : null, 
        productImage: productImage.split(',')[1], 
        useCase: finalPrompt, 
        productDetails
      }, brandKit, genType, setLoadingMsg);
      
      setOutput(resultUrl);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: genType, url: resultUrl, prompt: finalPrompt, timestamp: Date.now() });
    } catch (err: any) { alert(err.message); } finally { setState(AppState.READY); }
  };

  const handleConvertToVideo = async () => {
    if (!output || genType !== 'image') return;
    if (userCredits.videos <= 0) return onInsufficientCredits();

    setIsConvertingToVideo(true);
    setLoadingMsg("Synthesizing Motion...");
    try {
      const url = await GeminiService.generateVideoFromImage(output, motionPrompt || "Cinematic fashion reveal", (msg) => setLoadingMsg(msg));
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'video', url, prompt: motionPrompt || "Cinematic Motion", timestamp: Date.now() };
      setOutput(url);
      setGenType('video');
      addToHistory(newRes);
      setShowMotionControls(false);
    } catch (err: any) {
      alert(`Motion synthesis failed: ${err.message}`);
    } finally {
      setIsConvertingToVideo(false);
      setState(AppState.READY);
    }
  };

  return (
    <div className="space-y-16 pb-24 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-12">
        {steps.map((step) => {
          const isSkipped = productDetails.renderMode === 'product-only' && step.id === 2;
          if (isSkipped) return null;
          return (
            <div key={step.id} className="flex flex-col items-center gap-4 relative flex-1 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2 ${
                currentStep >= step.id ? 'bg-emerald-950 text-white border-emerald-950 shadow-lg' : 'bg-white text-emerald-950/20 border-emerald-50'
              }`}>
                {step.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${currentStep >= step.id ? 'text-emerald-950' : 'text-emerald-950/20'}`}>
                {step.label}
              </span>
              {step.id < 4 && (
                <div className="absolute top-5 left-[calc(50%+25px)] right-[calc(-50%+25px)] h-[2px] bg-emerald-50" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
             <div className="space-y-4">
                <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-widest">
                  {productDetails.renderMode === 'product-only' ? 'Master Product Asset (No Model)' : 'Master Product Asset'}
                </span>
                <div onClick={() => !productImage && document.getElementById('ps_up')?.click()} className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${productImage ? 'border-transparent bg-emerald-50 shadow-inner' : 'border-emerald-100 hover:border-gold/30'}`}>
                   {productImage ? <MediaAsset src={productImage} className="w-full h-full object-cover" /> : (
                     <div className="text-center space-y-2 px-6">
                       <div className="w-12 h-12 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-gold">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path d="M12 4v16m8-8H4" strokeWidth={2}/>
                         </svg>
                       </div>
                       <span className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block leading-relaxed">
                         {productDetails.renderMode === 'product-only' ? 'Upload product image (no model required)' : 'Upload product for editorial shoot'}
                       </span>
                     </div>
                   )}
                   <input type="file" id="ps_up" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); }} className="hidden" />
                </div>
             </div>

             <div className="space-y-4 pt-10 border-t border-emerald-50">
               <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-widest">Render Mode</span>
               <div className="flex bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100">
                  <button 
                    onClick={() => { setProductDetails({...productDetails, renderMode: 'product-only'}); setOutput(null); }}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${productDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30'}`}
                  >
                    Product Only
                  </button>
                  <button 
                    onClick={() => setProductDetails({...productDetails, renderMode: 'on-model'})}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${productDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30'}`}
                  >
                    On-Model
                  </button>
               </div>
             </div>

             {productImage && productDetails.renderMode === 'on-model' && (
               <div className="space-y-6 pt-10 border-t border-emerald-50 animate-in slide-in-from-top-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-widest">Neural Talent Cast</span>
                    <button onClick={onGoBackToModels} className="text-[8px] font-bold text-gold uppercase tracking-widest hover:underline">Models Page</button>
                  </div>

                  {/* Talent Quick Selection Dropdown */}
                  <div className="space-y-4">
                    <select 
                      value={selectedModel?.id || ''} 
                      onChange={(e) => {
                        const m = modelData.find(model => model.id === e.target.value);
                        if (m) setSelectedModel(m);
                      }}
                      className="w-full px-4 py-3 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                    >
                      <option value="" disabled>Select Maison Talent</option>
                      {modelData.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.nationality})</option>
                      ))}
                    </select>

                    {selectedModel ? (
                      <div className="flex items-center gap-6 bg-emerald-50/40 p-5 rounded-3xl group cursor-pointer transition-all hover:bg-emerald-100/50" onClick={() => setSelectedModel(null as any)}>
                        <MediaAsset src={selectedModel.mainUrl} className="w-16 h-16 rounded-2xl object-cover shadow-lg bg-emerald-50" />
                        <div className="space-y-1">
                          <h4 className="text-lg font-serif text-emerald-950">{selectedModel.name}</h4>
                          <span className="text-[8px] text-emerald-950/40 font-bold uppercase tracking-widest">{selectedModel.nationality}</span>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                      </div>
                    ) : (
                      <button onClick={onGoBackToModels} className="w-full py-5 border-2 border-dashed border-emerald-100 rounded-3xl text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest hover:border-gold/30 hover:text-gold transition-all flex items-center justify-center gap-3">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth={2}/></svg>
                         Browse Identity Registry
                      </button>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-10">
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">Creative Direction</span>
                   <button 
                      onClick={handleSuggestPrompts}
                      disabled={!productImage || isSuggesting}
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
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                  placeholder={productDetails.renderMode === 'product-only' ? "Define the standalone product setting and lighting..." : "Define the photoshoot atmosphere, lighting, and global setting..."} 
                  className="w-full bg-emerald-50/20 border-2 border-emerald-100/30 rounded-3xl p-8 text-sm italic min-h-[160px] focus:ring-1 focus:ring-gold focus:border-gold transition-all shadow-inner outline-none"
                />
                
                {aiSuggestions.length > 0 && (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                     <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Director's Vision</span>
                     <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((s, i) => (
                           <button 
                              key={i} 
                              onClick={() => setCustomPrompt(s.prompt)}
                              className="px-5 py-2.5 bg-white border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-950/60 uppercase tracking-widest hover:border-gold hover:text-gold transition-all shadow-sm active:scale-95"
                           >
                              {s.label}
                           </button>
                        ))}
                     </div>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 border-t border-emerald-50">
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Master Format</label>
                  <div className="flex bg-emerald-50 p-1 rounded-2xl border border-emerald-100">
                    <button onClick={() => setGenType('image')} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'image' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/20'}`}>Still</button>
                    <button onClick={() => setGenType('video')} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'video' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/20'}`}>Film</button>
                  </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Camera Perspective</label>
                   <select 
                     value={productDetails.cameraAngle} 
                     onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} 
                     className="w-full px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                   >
                      {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                   </select>
                </div>
                <div className="space-y-4">
                   <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Camera Motion</label>
                   <select 
                     value={productDetails.cameraMotion} 
                     onChange={(e) => setProductDetails({...productDetails, cameraMotion: e.target.value as CameraMotion})} 
                     className="w-full px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                   >
                      {cameraMotions.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>
             </div>

             {/* Film Specs Section */}
             {genType === 'video' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 animate-in slide-in-from-top-2 duration-500">
                  <div className="space-y-4">
                     <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Video Resolution</label>
                     <select 
                       value={productDetails.videoResolution} 
                       onChange={(e) => setProductDetails({...productDetails, videoResolution: e.target.value as any})} 
                       className="w-full px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                     >
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                     </select>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Aspect Ratio</label>
                     <select 
                       value={productDetails.videoAspectRatio} 
                       onChange={(e) => setProductDetails({...productDetails, videoAspectRatio: e.target.value as any})} 
                       className="w-full px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                     >
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Story)</option>
                     </select>
                  </div>
               </div>
             )}

             <div className="pt-6 border-t border-emerald-50">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-3 text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest hover:text-gold transition-all py-2"
                >
                  <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  Pro Specs & Brand Injection
                </button>
                {showAdvanced && (
                  <div className="pt-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="max-w-md space-y-6">
                       <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest ml-2">Brand Injection</label>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl">
                             <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Add my brand logo</span>
                             <input type="checkbox" checked={productDetails.addLogo} onChange={(e) => setProductDetails({...productDetails, addLogo: e.target.checked})} className="w-4 h-4 accent-gold" />
                          </div>
                          {productDetails.addLogo && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                               <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Logo Placement</label>
                               <select 
                                 value={productDetails.logoPlacement} 
                                 onChange={(e) => setProductDetails({...productDetails, logoPlacement: e.target.value as LogoPlacement})} 
                                 className="w-full px-6 py-4 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                               >
                                  {logoPlacements.map(lp => <option key={lp} value={lp}>{lp}</option>)}
                               </select>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="pt-10 border-t border-emerald-50 flex justify-end gap-10 items-center">
                <div className="text-right">
                   <span className="block text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest">Authorization Cost</span>
                   <span className="text-[11px] font-bold text-gold uppercase tracking-widest">1 Render Credit</span>
                </div>
                <button 
                  onClick={handleGenerate} 
                  disabled={!productImage || (productDetails.renderMode === 'on-model' && !selectedModel) || state === AppState.GENERATING} 
                  className={`px-20 py-6 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all ${!productImage || (productDetails.renderMode === 'on-model' && !selectedModel) || state === AppState.GENERATING ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl active:scale-95 shadow-emerald-950/20'} btn-luxury`}
                >
                   {state === AppState.GENERATING ? loadingMsg : 'Execute Neural Photoshoot'}
                </button>
             </div>
          </div>

          {(output || state === AppState.GENERATING || isConvertingToVideo) && (
            <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-8 flex flex-col items-center animate-in zoom-in duration-1000">
              <div className="aspect-[4/5] w-full max-w-[480px] rounded-4xl overflow-hidden shadow-2xl relative group bg-emerald-50/50">
                {(state === AppState.GENERATING || isConvertingToVideo) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-emerald-950/10 backdrop-blur-sm z-30">
                    <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-[12px] font-bold uppercase text-gold tracking-[0.5em] animate-pulse">{loadingMsg}</p>
                  </div>
                ) : (
                  <>
                    <MediaAsset src={output!} type={genType} className="w-full h-full object-cover" />
                    <div className="absolute top-8 right-8 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {genType === 'image' && <button onClick={() => setShowEditor(true)} className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-all hover:scale-110"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
                      <a href={output!} download className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-all hover:scale-110"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                    </div>

                    {genType === 'image' && (
                        <div className="absolute bottom-8 left-8 right-8 space-y-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           {!showMotionControls ? (
                              <button 
                                onClick={() => setShowMotionControls(true)}
                                className="w-full py-5 bg-gold text-white rounded-3xl font-bold text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-gold-hover transition-all"
                              >
                                Convert to Cinematic Film
                              </button>
                           ) : (
                              <div className="bg-white p-8 rounded-4xl space-y-8 shadow-2xl border border-emerald-50 animate-in slide-in-from-bottom-6">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Motion Profile</span>
                                    <button onClick={() => setShowMotionControls(false)} className="text-emerald-950/40 hover:text-emerald-950"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {motionSuggestions.map((m, i) => (
                                       <button 
                                          key={i} 
                                          onClick={() => setMotionPrompt(m.prompt)}
                                          className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${motionPrompt === m.prompt ? 'bg-gold border-gold text-white' : 'bg-emerald-50 border-emerald-50 text-emerald-950/40 hover:bg-emerald-100'}`}
                                       >
                                          {m.label}
                                       </button>
                                    ))}
                                 </div>
                                 <textarea 
                                    value={motionPrompt}
                                    onChange={(e) => setMotionPrompt(e.target.value)}
                                    placeholder="Define the motion trajectory..."
                                    className="w-full bg-emerald-50/50 rounded-2xl p-4 text-xs italic min-h-[100px] focus:ring-1 focus:ring-gold outline-none"
                                 />
                                 <button 
                                    onClick={handleConvertToVideo}
                                    className="w-full py-5 bg-emerald-950 text-white rounded-3xl font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-gold transition-all"
                                 >
                                    Synthesize Motion
                                 </button>
                              </div>
                           )}
                        </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {productDetails.renderMode === 'on-model' && !selectedModel && productImage && currentStep === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <ModelShowcase onModelSelect={setSelectedModel} personalModel={null} />
        </div>
      )}

      {showEditor && output && genType === 'image' && (
        <ImageEditor 
          imageUrl={output} brandKit={brandKit}
          analysis={analysis || { type: 'Clothing', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }} 
          onSave={(url) => { setOutput(url); setShowEditor(false); }} onCancel={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
};

export default CreateShoot;
