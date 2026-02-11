
import React, { useState } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, ProductType, CameraAngle, ModelPersona, ProductPlacement, CameraMotion } from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import MediaAsset from './MediaAsset';

interface VideoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
  isLocked?: boolean;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ 
  brandKit, addToHistory, initialCategory, userCredits, onInsufficientCredits, onError,
  selectedModel, setSelectedModel, isLocked = false
}) => {
  const [state, setState] = useState<AppState>(AppState.READY);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'jewelry',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    /* Fix: Removed 'as any' since 'Orbit' is now defined in CameraMotion in types.ts */
    cameraMotion: 'Orbit',
    renderMode: 'product-only', 
    videoResolution: '720p',
    videoAspectRatio: '16:9'
  });

  /* Fix: Removed 'as any' from 'Orbit' preset */
  const motionPresets: CameraMotion[] = ['Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Zoom In', 'Zoom Out', 'Orbit'];
  const steps = [
    { id: 1, label: 'Upload Asset', active: !!sourceImage },
    { id: 2, label: 'Cast Mode', active: !!sourceImage && (productDetails.renderMode === 'product-only' || !!selectedModel) },
    { id: 3, label: 'Motion Blueprint', active: !!sourceImage && prompt.length > 5 },
    { id: 4, label: 'Synthesize Film', active: !!output }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setSourceImage(result);
      setState(AppState.ANALYZING);
      setLoadingMsg("Asset DNA Analysis...");
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

  const handleGenerate = async () => {
    if (isLocked) {
      onInsufficientCredits();
      return;
    }
    if (!sourceImage || !prompt) return;
    if (userCredits.videos !== -1 && userCredits.videos <= 0 && !isLocked) return onInsufficientCredits();
    
    setState(AppState.GENERATING);
    setLoadingMsg("Initializing Veo Synthesis...");
    try {
      const base64 = sourceImage.split(',')[1];
      const identityLock = selectedModel && productDetails.renderMode === 'on-model' ? `Model Identity: ${selectedModel.name}, ${selectedModel.nationality}. Features: ${selectedModel.features}. ` : "";
      const finalPrompt = `${identityLock}${prompt}. Camera Motion: ${productDetails.cameraMotion}. High-fidelity textures.`;
      
      let url = await GeminiService.generateProductVideo(base64, analysis!, finalPrompt, brandKit, productDetails, setLoadingMsg);
      setOutput(url);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: 'video', url: url, prompt: finalPrompt, timestamp: Date.now() });
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-24 py-12 animate-lux-in max-w-6xl mx-auto">
      {/* 4-Step Indicator */}
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

      {isLocked && (
        <div className="p-6 bg-gold/10 border border-gold/20 rounded-3xl text-center">
          <p className="text-emerald-950 font-serif italic text-lg mb-4">You have reached your 1-video free limit.</p>
          <button onClick={onInsufficientCredits} className="px-8 py-3 bg-gold text-white rounded-full font-bold uppercase tracking-widest text-[10px]">Upgrade to Unlimited</button>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-20 ${isLocked ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        <div className="space-y-16">
          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 01</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Source DNA</h2>
            </div>
            <div 
              onClick={() => document.getElementById('vid_up')?.click()}
              className={`aspect-square rounded-[3rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${sourceImage ? 'border-transparent bg-white shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}
            >
              {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-4 px-12">
                   <div className="w-14 h-14 bg-maison-bg rounded-full mx-auto flex items-center justify-center text-gold border border-gray-100">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest block">Upload Product Asset</span>
                </div>
              )}
              <input type="file" id="vid_up" onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </section>

          <section className="space-y-8">
             <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 02</h3>
                <h2 className="text-3xl font-serif text-emerald-950 italic">Casting Mode</h2>
             </div>
             <div className="flex bg-gray-50 p-1.5 rounded-[2.5rem] border border-gray-100 mb-8">
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'product-only'})}
                  className={`flex-1 py-4 rounded-[2rem] text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-700 ${productDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-950/20'}`}
                >
                  Standalone Product
                </button>
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'on-model'})}
                  className={`flex-1 py-4 rounded-[2rem] text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-700 ${productDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-950/20'}`}
                >
                  Modest Talent
                </button>
             </div>
             {productDetails.renderMode === 'on-model' && (
                <div className="bg-white border border-gray-50 rounded-[3rem] p-6 soft-shadow animate-in slide-in-from-bottom-4 duration-500">
                   <ModelShowcase compact selectedModelId={selectedModel?.id} onModelSelect={setSelectedModel} />
                </div>
             )}
          </section>
        </div>

        <div className="space-y-16">
          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 03</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Motion Directive</h2>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10">
              <div className="space-y-4">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] block ml-2">Cinematic Camera Motion</span>
                <div className="flex flex-wrap gap-2">
                  {motionPresets.map(motion => (
                    <button
                      key={motion}
                      onClick={() => setProductDetails({...productDetails, cameraMotion: motion})}
                      className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-500 border ${
                        productDetails.cameraMotion === motion ? 'bg-gold border-gold text-white shadow-lg shadow-gold/10' : 'bg-white border-gray-50 text-black/20 hover:text-black/60'
                      }`}
                    >
                      {motion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] block ml-2">Scene Description</span>
                <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="Describe the environment, lighting, and cinematic atmosphere..." 
                  className="w-full bg-maison-bg border-none rounded-2xl p-8 text-sm font-serif italic min-h-[160px] focus:ring-1 focus:ring-gold outline-none"
                />
              </div>

              <div className="border-t border-gray-50 pt-6">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <span className="text-[9px] font-bold text-black/30 uppercase tracking-[0.3em] group-hover:text-gold transition-colors">Advanced Synthesis Optics</span>
                  <svg className={`w-4 h-4 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAdvanced && (
                  <div className="pt-6 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                       <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-2">Resolution</label>
                       <select value={productDetails.videoResolution} onChange={(e) => setProductDetails({...productDetails, videoResolution: e.target.value as any})} className="w-full bg-maison-bg rounded-2xl px-6 py-4 text-[9px] font-bold uppercase outline-none">
                          <option value="720p">720p Optimized</option>
                          <option value="1080p">1080p Cinematic</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-bold text-black/30 uppercase tracking-widest block ml-2">Aspect Ratio</label>
                       <select value={productDetails.videoAspectRatio} onChange={(e) => setProductDetails({...productDetails, videoAspectRatio: e.target.value as any})} className="w-full bg-maison-bg rounded-2xl px-6 py-4 text-[9px] font-bold uppercase outline-none">
                          <option value="16:9">Landscape (16:9)</option>
                          <option value="9:16">Portrait (9:16)</option>
                       </select>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={state === AppState.GENERATING || !sourceImage || prompt.length < 5}
                className={`w-full py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl ${
                  state === AppState.GENERATING || !sourceImage || prompt.length < 5 ? 'bg-gray-50 text-black/10' : 'bg-black text-white hover:bg-gold shadow-gold/20'
                }`}
              >
                {state === AppState.GENERATING ? loadingMsg : 'Execute Synthesis'}
              </button>
            </div>
          </section>

          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Step 04</h3>
              <h2 className="text-3xl font-serif text-emerald-950 italic">Maison Film Vault</h2>
            </div>
            {output ? (
              <div className="animate-lux-in">
                 <div className="aspect-video w-full rounded-[3rem] overflow-hidden shadow-2xl relative group bg-white border border-gray-100">
                    <MediaAsset src={output} type="video" className="w-full h-full object-cover" controls autoPlay loop />
                    <div className="absolute top-8 right-8 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-700">
                       <a href={output} download className="p-4 bg-white/90 backdrop-blur-md text-emerald-950 rounded-2xl shadow-xl hover:text-gold transition-all">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </a>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="aspect-video rounded-[3rem] border border-dashed border-gray-100 flex flex-col items-center justify-center p-12 text-center space-y-4">
                 <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">Film Synthesis Pending</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;
