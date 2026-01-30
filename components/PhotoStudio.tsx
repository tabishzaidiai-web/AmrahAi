
import React, { useState, useRef, useMemo } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, CameraAngle, CameraMotion } from '../types';
import { GeminiService } from '../services/geminiService';
import ImageEditor from './ImageEditor';
import MediaAsset from './MediaAsset';

interface PhotoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError }) => {
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showProControls, setShowProControls] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  
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
    { label: "Atmospheric Zoom", prompt: "A slow, breathing zoom-in focusing on material textures." },
    { label: "Elegant Pan", prompt: "A cinematic horizontal pan revealing the depth of the piece." },
    { label: "Slow Reveal", prompt: "A gentle light-sweep reveal from shadows into full brilliance." }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Intelligence Prompt Suggestions based on Product Analysis
  const dynamicSuggestions = useMemo(() => {
    const product = analysis?.type || productDetails.type || 'luxury piece';
    const material = analysis?.material || 'premium material';
    const detail = analysis?.features?.[0] || 'fine craftsmanship';
    const mode = productDetails.renderMode === 'product-only' 
      ? 'standing standalone as a singular hero object with no humans in scene' 
      : 'presented gracefully by a high-fashion model in a modest editorial pose';

    const protectionLine = "\n\nImportant: Keep the product identical to the reference photo. Do not alter any design details or colors.";

    return [
      { 
        label: 'Minimalist Monolith', 
        icon: '📐',
        prompt: `Surgical-grade minimalist composition. The ${material} ${product} is centered on a raw, honed basalt monolith. ${mode}. Soft directional morning light, sharp focus on the ${detail}. Zero distortion, 100% visual fidelity.${protectionLine}` 
      },
      { 
        label: 'Opulent Arabian', 
        icon: '🌙',
        prompt: `An opulent Maison campaign. The ${material} ${product} is nestled on heavy royal emerald velvet. ${mode}. Intricate mashrabiya shadow patterns across the background, warm golden highlights on the ${detail}. Heritage luxury mood.${protectionLine}` 
      },
      { 
        label: 'Desert Mirage', 
        icon: '🏜️',
        prompt: `Prestige landscape editorial. The ${material} ${product} in the style of Al-Ula, positioned in fine crimson desert sand at blue hour. ${mode}. A single beam of dawn light hitting the ${detail}. Violet and amber sky gradients.${protectionLine}` 
      },
      { 
        label: 'Noir Excellence', 
        icon: '🎞️',
        prompt: `Cinematic product portrait. The ${material} ${product} emerging from a deep charcoal void. ${mode}. A singular razor-sharp rim light traces the silhouette and ${detail}. Dramatic, sophisticated high-end advertising aesthetic.${protectionLine}` 
      },
      { 
        label: 'Marina Modern', 
        icon: '🛥️',
        prompt: `Bright lifestyle campaign. The ${product} resting on a white marble table overlooking a blurred Mediterranean marina. ${mode}. Crisp afternoon sunlight, sparkling water bokeh, high-fashion summer atmosphere.${protectionLine}` 
      },
      { 
        label: 'Heritage Majlis', 
        icon: '🍵',
        prompt: `Refined modern majlis setting. The ${product} surrounded by dark wood textures and silk. ${mode}. Warm volumetric ambient light illuminating the ${detail}. A celebration of cultural luxury and modern elegance.${protectionLine}` 
      },
      { 
        label: 'Zen Architectural', 
        icon: '🏢',
        prompt: `Pristine architectural shoot. The ${material} ${product} in an open-air glass and steel atrium. ${mode}. Sharp geometric shadows, cool northern daylight, emphasis on structural integrity and the ${detail}.${protectionLine}` 
      },
      { 
        label: 'Prismatic Macro', 
        icon: '💎',
        prompt: `Extreme macro study. Intimate focus on the ${detail} of the ${product}. ${mode}. Caustic light reflections dancing across a silk backdrop. Shimmering ${material} highlights, soft creamy depth of field.${protectionLine}` 
      },
      { 
        label: 'Silk & Shadows', 
        icon: '🧣',
        prompt: `Sensory material focus. The ${product} draped among heavy folds of charcoal grey silk. ${mode}. Moody, directional side-lighting revealing every detail of the ${material} and ${detail}.${protectionLine}` 
      },
      { 
        label: 'Luxe Penthouse', 
        icon: '🏙️',
        prompt: `High-rise penthouse suite at night. The ${material} ${product} positioned near a floor-to-ceiling window. ${mode}. Warm interior light meets the blurred cold bokeh of city skyline lights in the background.${protectionLine}` 
      }
    ];
  }, [analysis, productDetails.type, productDetails.renderMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setSourceImage(result);
      setState(AppState.ANALYZING);
      setLoadingMsg("Identifying Brand DNA...");
      try {
        const res = await GeminiService.analyzeProduct(result.split(',')[1], file.type, brandKit);
        setAnalysis(res);
      } catch (err) { 
        onError(err);
        console.error("Analysis Error:", err); 
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { 
        setState(AppState.READY); 
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;
    if (genType === 'image' && userCredits.images <= 0) return onInsufficientCredits();
    if (genType === 'video' && userCredits.videos <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating with Strict Fidelity...");
    try {
      const base64 = sourceImage.split(',')[1];
      let url = genType === 'image' 
        ? await GeminiService.generateProductImage(base64, analysis!, prompt, brandKit, productDetails)
        : await GeminiService.generateProductVideo(base64, analysis!, prompt, brandKit, productDetails, setLoadingMsg);

      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: genType, url, prompt: prompt, timestamp: Date.now() };
      setOutput(url);
      addToHistory(newRes);
    } catch (err: any) { 
      onError(err);
    } finally { setState(AppState.READY); }
  };

  const handleConvertToVideo = async () => {
    if (!output || genType !== 'image') return;
    if (userCredits.videos <= 0) return onInsufficientCredits();

    setIsConvertingToVideo(true);
    setLoadingMsg("Synthesizing Motion...");
    try {
      const url = await GeminiService.generateVideoFromImage(output, motionPrompt || "Slow cinematic reveal", (msg) => setLoadingMsg(msg));
      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'video', url, prompt: motionPrompt || "Cinematic Motion", timestamp: Date.now() };
      setOutput(url);
      setGenType('video');
      addToHistory(newRes);
      setShowMotionControls(false);
    } catch (err: any) {
      onError(err);
    } finally {
      setIsConvertingToVideo(false);
      setState(AppState.READY);
    }
  };

  return (
    <div className="h-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 h-full">
        
        {/* Zone 1: Inputs & Identity Summary */}
        <div className="lg:col-span-3 space-y-8 h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white rounded-4xl p-8 border border-emerald-50 soft-shadow space-y-8">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">
                    {productDetails.renderMode === 'product-only' ? 'Master Asset (No Model)' : 'Master Asset'}
                  </span>
                  {sourceImage && <button onClick={() => {setSourceImage(null); setAnalysis(null); setPrompt('');}} className="text-[8px] font-bold text-gold uppercase tracking-widest">Replace</button>}
               </div>
               <div 
                onClick={() => !sourceImage && fileInputRef.current?.click()} 
                className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-emerald-50' : 'border-emerald-100 hover:border-gold/30'}`}
               >
                 {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : (
                   <div className="text-center space-y-2 px-4">
                     <div className="w-10 h-10 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-gold">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                     </div>
                     <span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest block leading-relaxed">
                       {productDetails.renderMode === 'product-only' ? 'Upload product image (no model required)' : 'Upload product for model shoot'}
                     </span>
                   </div>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
               </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-emerald-50">
               <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Render Mode</span>
               <div className="flex bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100">
                  <button 
                    onClick={() => setProductDetails({...productDetails, renderMode: 'product-only'})}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${productDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30 hover:text-emerald-950/50'}`}
                  >
                    Product Only
                  </button>
                  <button 
                    onClick={() => setProductDetails({...productDetails, renderMode: 'on-model'})}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${productDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/30 hover:text-emerald-950/50'}`}
                  >
                    On-Model
                  </button>
               </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-emerald-50">
               <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Product Specs</span>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-1">Camera Angle</label>
                     <select 
                       value={productDetails.cameraAngle} 
                       onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} 
                       className="w-full text-[10px] uppercase font-bold tracking-widest px-4 py-3 bg-emerald-50/20 border-emerald-50 outline-none rounded-2xl focus:border-gold/30"
                     >
                        {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-1">Camera Motion</label>
                     <select 
                       value={productDetails.cameraMotion} 
                       onChange={(e) => setProductDetails({...productDetails, cameraMotion: e.target.value as CameraMotion})} 
                       className="w-full text-[10px] uppercase font-bold tracking-widest px-4 py-3 bg-emerald-50/20 border-emerald-50 outline-none rounded-2xl focus:border-gold/30"
                     >
                        {cameraMotions.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            {genType === 'video' && (
              <div className="space-y-6 pt-6 border-t border-emerald-50 animate-in slide-in-from-top-2 duration-500">
                 <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Film Specs</span>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-1">Resolution</label>
                       <select 
                         value={productDetails.videoResolution} 
                         onChange={(e) => setProductDetails({...productDetails, videoResolution: e.target.value as any})} 
                         className="w-full text-[10px] uppercase font-bold tracking-widest px-4 py-3 bg-emerald-50/20 border-emerald-50 outline-none rounded-2xl focus:border-gold/30"
                       >
                          <option value="720p">720p (HD)</option>
                          <option value="1080p">1080p (FHD)</option>
                       </select>
                    </div>
                 </div>
              </div>
            )}

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
          </div>
        </div>

        {/* Zone 2: Style & Orchestration */}
        <div className="lg:col-span-5 h-full">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow h-full flex flex-col gap-10">
              <div className="space-y-8 flex-1">
                 <div className="flex items-center justify-between border-b border-black/5 pb-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-[0.3em]">Creative Direction</span>
                      <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest">Neural Vision Pipeline</span>
                    </div>
                    <div className="flex items-center gap-4">
                       {prompt && (
                          <button onClick={() => setPrompt('')} className="text-[8px] font-bold text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors">Clear Brief</button>
                       )}
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                          <span className="text-[9px] font-bold text-gold uppercase tracking-widest">Elite AI Active</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder={`Instruct the AI Director on environment, lighting, and narrative... ${productDetails.renderMode === 'product-only' ? '(Strictly product-on-background, no people)' : '(High-end model campaign)'}`}
                      className="w-full bg-zinc-50 border-2 border-emerald-100/30 rounded-3xl p-8 text-sm italic min-h-[220px] focus:ring-1 focus:ring-gold focus:border-gold transition-all shadow-inner outline-none placeholder:text-zinc-300"
                    />
                    
                    {/* Intelligence-Driven Dynamic Suggestion Hub */}
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">Director's Vision Blueprint</span>
                         {analysis && <span className="text-[8px] font-bold text-emerald-950/20 uppercase tracking-widest italic">Personalized for your {analysis.type}</span>}
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                          {dynamicSuggestions.length > 0 ? (
                            dynamicSuggestions.map((s, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setPrompt(s.prompt)}
                                className={`text-left px-6 py-5 bg-zinc-50/50 border border-emerald-50 rounded-2xl group hover:border-gold/40 transition-all duration-300 shadow-sm ${prompt === s.prompt ? 'border-gold bg-gold/[0.03] ring-1 ring-gold/20' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-3">
                                      <span className="text-lg">{s.icon}</span>
                                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${prompt === s.prompt ? 'text-gold' : 'text-emerald-950/60'}`}>{s.label}</span>
                                   </div>
                                   <svg className={`w-3 h-3 transition-all ${prompt === s.prompt ? 'text-gold scale-125' : 'text-emerald-950/10'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </div>
                                <p className={`text-[10px] italic leading-relaxed transition-colors line-clamp-2 ${prompt === s.prompt ? 'text-emerald-950' : 'text-emerald-950/40'}`}>
                                  {s.prompt}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="py-12 text-center bg-emerald-50/20 rounded-3xl border border-emerald-50 border-dashed">
                               <p className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest">Upload your product asset to unlock <br/>Dynamic Neural Visions</p>
                            </div>
                          )}
                      </div>
                    </div>
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
                 {(output || isConvertingToVideo) ? (
                   <>
                     <MediaAsset src={output || ''} type={genType} className={`w-full h-full object-cover transition-opacity ${isConvertingToVideo ? 'opacity-30' : 'opacity-100'}`} />
                     
                     {isConvertingToVideo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-emerald-950/20 backdrop-blur-sm z-30">
                           <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                           <p className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">{loadingMsg}</p>
                        </div>
                     )}

                     <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <a href={output || '#'} download className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                        {genType === 'image' && <button onClick={() => setShowEditor(true)} className="p-4 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                     </div>

                     {genType === 'image' && !isConvertingToVideo && (
                        <div className="absolute bottom-6 left-6 right-6 space-y-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           {!showMotionControls ? (
                              <button 
                                onClick={() => setShowMotionControls(true)}
                                className="w-full py-4 bg-gold text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-gold/20 hover:bg-gold-hover transition-all"
                              >
                                Convert to Cinematic Film
                              </button>
                           ) : (
                              <div className="bg-white/95 backdrop-blur p-6 rounded-3xl space-y-6 shadow-2xl border border-emerald-50 animate-in slide-in-from-bottom-4">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Motion Direction</span>
                                    <button onClick={() => setShowMotionControls(false)} className="text-emerald-950/40 hover:text-emerald-950"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {motionSuggestions.map((m, i) => (
                                       <button 
                                          key={i} 
                                          onClick={() => setMotionPrompt(m.prompt)}
                                          className={`px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all ${motionPrompt === m.prompt ? 'bg-gold border-gold text-white' : 'bg-emerald-50 border-emerald-50 text-emerald-950/40 hover:bg-emerald-100'}`}
                                       >
                                          {m.label}
                                       </button>
                                    ))}
                                 </div>
                                 <textarea 
                                    value={motionPrompt}
                                    onChange={(e) => setMotionPrompt(e.target.value)}
                                    placeholder="Describe the cinematic movement..."
                                    className="w-full bg-emerald-50/50 rounded-2xl p-4 text-[10px] italic min-h-[80px] focus:ring-1 focus:ring-gold outline-none"
                                 />
                                 <button 
                                    onClick={handleConvertToVideo}
                                    className="w-full py-4 bg-emerald-950 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-gold transition-all"
                                 >
                                    Execute Film synthesis
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
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
