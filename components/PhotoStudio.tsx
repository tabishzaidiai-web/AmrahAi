
import React, { useState, useRef, useMemo } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, CameraAngle } from '../types';
import { GeminiService } from '../services/geminiService';
import ImageEditor from './ImageEditor';
import MediaAsset from './MediaAsset';

interface PhotoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits }) => {
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showProControls, setShowProControls] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  
  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<{label: string, prompt: string}[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion',
    type: 'Clothing',
    approxSize: 'Standard',
    placement: 'Full body',
    addLogo: false,
    logoPlacement: 'Chest',
    cameraAngle: 'Standard'
  });

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const productPlacements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', "Bird's Eye", 'Side', 'Close-up'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestPrompts = async () => {
    if (!sourceImage) return;
    setIsSuggesting(true);
    try {
      const base64 = sourceImage.split(',')[1];
      const suggestions = await GeminiService.suggestCampaignStories(base64, brandKit);
      setAiSuggestions(suggestions.slice(0, 3)); // Display exactly 3 creative editorial suggestions
    } catch (err) {
      console.error("Prompt suggestion failed", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setSourceImage(result);
      setState(AppState.ANALYZING);
      setLoadingMsg("Analyzing Asset...");
      try {
        const res = await GeminiService.analyzeProduct(result.split(',')[1], file.type, brandKit);
        setAnalysis(res);
      } catch (err) { console.error(err); } finally { setState(AppState.READY); }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;

    if (genType === 'image' && userCredits.images <= 0) return onInsufficientCredits();
    if (genType === 'video' && userCredits.videos <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating...");
    try {
      const base64 = sourceImage.split(',')[1];
      let finalPrompt = `[SYSTEM: 100% VISUAL FIDELITY MODE. Never alter color, logo, or shape.] ${prompt}`;
      if (productDetails.addLogo) finalPrompt += ` [Apply brand logo at ${productDetails.logoPlacement}.]`;
      
      let url = genType === 'image' 
        ? await GeminiService.generateProductImage(base64, analysis!, finalPrompt, brandKit, productDetails)
        : await GeminiService.generateProductVideo(base64, analysis!, finalPrompt, brandKit, productDetails, setLoadingMsg);

      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: genType, url, prompt: finalPrompt, timestamp: Date.now() };
      setOutput(url);
      addToHistory(newRes);
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setState(AppState.READY); }
  };

  return (
    <div className="h-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 h-full">
        
        {/* Zone 1: Inputs & Identity Summary */}
        <div className="lg:col-span-3 space-y-8 h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white rounded-4xl p-8 border border-emerald-50 soft-shadow space-y-8">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Master Asset</span>
                  {sourceImage && <button onClick={() => {setSourceImage(null); setAiSuggestions([]);}} className="text-[8px] font-bold text-gold uppercase tracking-widest">Replace</button>}
               </div>
               <div 
                onClick={() => !sourceImage && fileInputRef.current?.click()} 
                className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-emerald-50' : 'border-emerald-100 hover:border-gold/30'}`}
               >
                 {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : <div className="text-center space-y-2"><div className="w-10 h-10 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-gold"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></div><span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest block">Upload Product</span></div>}
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-emerald-50">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Maison DNA</span>
                  <div className="w-4 h-4 rounded-full border border-emerald-50" style={{ backgroundColor: brandKit.primaryColor }} />
               </div>
               <div className="space-y-1">
                  <h4 className="text-sm font-serif italic text-emerald-950">{brandKit.name}</h4>
                  <p className="text-[8px] text-emerald-950/30 font-bold uppercase tracking-widest">{brandKit.tone} Tone Active</p>
               </div>
            </div>

            <div className="pt-6 border-t border-emerald-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest">Pro Controls</span>
                   <button onClick={() => setShowProControls(!showProControls)} className={`w-10 h-5 rounded-full transition-all relative ${showProControls ? 'bg-gold' : 'bg-emerald-50'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showProControls ? 'left-6' : 'left-1'}`} />
                   </button>
                </div>
                {showProControls && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                       <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Camera Angle</label>
                       <select value={productDetails.cameraAngle} onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full text-[10px] uppercase font-bold tracking-widest px-3 py-2">
                          {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest">Add Logo</span>
                       <input type="checkbox" checked={productDetails.addLogo} onChange={(e) => setProductDetails({...productDetails, addLogo: e.target.checked})} className="w-4 h-4 accent-gold" />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Zone 2: Style & Orchestration */}
        <div className="lg:col-span-5 h-full">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow h-full flex flex-col gap-10">
              <div className="space-y-8 flex-1">
                 <div className="flex items-center justify-between border-b border-black/5 pb-4">
                    <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-[0.3em]">Scene Prompt</span>
                    <button 
                      onClick={handleSuggestPrompts}
                      disabled={!sourceImage || isSuggesting}
                      className="group flex items-center gap-3 px-6 py-2.5 bg-gold text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold-hover transition-all disabled:opacity-30 shadow-lg shadow-gold/20 active:scale-95"
                    >
                      {isSuggesting ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      Suggest Luxury Prompts
                    </button>
                 </div>

                 <div className="space-y-6">
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Define the environment, lighting, and cinematic mood for this asset..." 
                      className="w-full bg-emerald-50/20 border-emerald-50 rounded-3xl p-8 text-sm italic min-h-[220px] focus:ring-1 focus:ring-gold/20 focus:bg-white transition-all shadow-inner border border-emerald-100/50"
                    />
                    
                    {/* AI Suggested Chips - Light Luxury Style */}
                    {aiSuggestions.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                             <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">Neural Narrative Blueprints</span>
                          </div>
                          <div className="flex flex-col gap-3">
                              {aiSuggestions.map((s, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setPrompt(s.prompt)}
                                  className={`text-left px-6 py-4 bg-white border border-emerald-50 rounded-2xl group hover:border-gold transition-all duration-500 shadow-sm hover:shadow-md ${prompt === s.prompt ? 'border-gold bg-gold/[0.02] ring-1 ring-gold/20 shadow-lg' : ''}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                     <span className="text-[8px] font-bold text-gold uppercase tracking-[0.2em]">{s.label}</span>
                                     <div className={`w-1.5 h-1.5 rounded-full transition-colors ${prompt === s.prompt ? 'bg-gold' : 'bg-emerald-50'}`} />
                                  </div>
                                  <p className={`text-[10px] italic leading-relaxed transition-colors ${prompt === s.prompt ? 'text-emerald-950' : 'text-emerald-950/50'}`}>
                                    {s.prompt.length > 100 ? s.prompt.substring(0, 100) + '...' : s.prompt}
                                  </p>
                                </button>
                              ))}
                          </div>
                        </div>
                    )}
                 </div>
              </div>

              <div className="pt-10 border-t border-emerald-50 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex bg-emerald-50 p-1 rounded-2xl border border-emerald-100">
                       <button onClick={() => setGenType('image')} className={`px-10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${genType === 'image' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30'}`}>Still</button>
                       <button onClick={() => setGenType('video')} className={`px-10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${genType === 'video' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30'}`}>Film</button>
                    </div>
                    <div className="text-right">
                       <span className="block text-[8px] font-bold text-emerald-950/20 uppercase tracking-widest mb-1">Authorization</span>
                       <span className="text-[10px] font-bold text-gold uppercase tracking-widest">1 Render Credit</span>
                    </div>
                 </div>
                 <button 
                  onClick={handleGenerate} 
                  disabled={state === AppState.GENERATING || !sourceImage || !prompt} 
                  className={`w-full py-6 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all ${state === AppState.GENERATING || !sourceImage || !prompt ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl shadow-emerald-950/20 active:scale-95'} btn-luxury`}
                 >
                   {state === AppState.GENERATING ? loadingMsg : 'Execute Neural Synthesis'}
                 </button>
              </div>
           </div>
        </div>

        {/* Zone 3: Outputs / Render Gallery */}
        <div className="lg:col-span-4 h-full">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow h-full flex flex-col gap-8">
              <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-[0.3em]">Master Render</span>
              <div className="flex-1 bg-emerald-50/50 rounded-4xl overflow-hidden relative group">
                 {output ? (
                   <>
                     <MediaAsset src={output} type={genType} className="w-full h-full object-cover" />
                     <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={output} download className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                        <button onClick={() => setShowEditor(true)} className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                     </div>
                   </>
                 ) : state === AppState.GENERATING ? (
                   <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-[11px] font-bold text-gold uppercase tracking-[0.5em] animate-pulse">{loadingMsg}</p>
                   </div>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-950/10"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      <p className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-[0.3em]">Neural render will appear here upon orchestration.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {showEditor && output && genType === 'image' && (
        <ImageEditor 
          imageUrl={output} brandKit={brandKit}
          analysis={analysis || { type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }} 
          onSave={(url) => { setOutput(url); setShowEditor(false); }} onCancel={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
};

export default PhotoStudio;
