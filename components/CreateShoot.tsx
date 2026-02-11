import React, { useState, useEffect } from 'react';
import { ModelPersona, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, ProductType, ProductPlacement, ProductAnalysis, CameraAngle } from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import MediaAsset from './MediaAsset';

interface CreateShootProps {
  brandKit: BrandKit;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
  userCredits: { images: number; videos: number };
  onInsufficientCredits: () => void;
  onError: (err: any) => void;
  isLocked?: boolean;
}

const CreateShoot: React.FC<CreateShootProps> = ({ 
  brandKit, selectedModel, setSelectedModel, addToHistory, 
  initialCategory, userCredits, onInsufficientCredits, onError, isLocked
}) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [state, setState] = useState<AppState>(AppState.READY);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [isRedefining, setIsRedefining] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<{label: string, prompt: string}[]>([]);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion', 
    type: 'Clothing', 
    approxSize: 'Standard', 
    placement: 'Full body', 
    addLogo: false, 
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    renderMode: 'on-model', 
    videoResolution: '720p',
    videoAspectRatio: '9:16'
  });

  const steps = [
    { id: 1, label: 'Upload product', active: !!productImage },
    { id: 2, label: 'Choose model', active: !!selectedModel },
    { id: 3, label: 'Style & details', active: customPrompt.length > 5 || videoPrompt.length > 5 },
    { id: 4, label: 'Generate & download', active: !!output || !!videoOutput }
  ];

  useEffect(() => {
    if (customPrompt && !videoPrompt) {
      setVideoPrompt(`Cinematic motion: ${customPrompt}, focusing on dramatic camera orbits and realistic fabric movement.`);
    }
  }, [customPrompt, videoPrompt]);

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setProductImage(dataUrl);
      setState(AppState.ANALYZING);
      setLoadingMsg("Performing Asset Analysis...");
      try {
        const base64 = dataUrl.split(',')[1];
        const [res, aiSuggestions] = await Promise.all([
          GeminiService.analyzeProduct(base64, file.type, brandKit),
          GeminiService.suggestPhotoshootPrompts(base64, brandKit)
        ]);
        setAnalysis(res);
        setSuggestions(aiSuggestions);
      } catch (e) { 
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { setState(AppState.READY); }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (type: 'image' | 'video' = 'image') => {
    if (!productImage || !selectedModel) return;
    const promptToUse = type === 'image' ? customPrompt : videoPrompt;
    if (!promptToUse) return;

    if (type === 'image' && userCredits.images !== -1 && userCredits.images <= 0) return onInsufficientCredits();
    if (type === 'video' && userCredits.videos !== -1 && userCredits.videos <= 0) return onInsufficientCredits();
    
    setState(AppState.GENERATING);
    setLoadingMsg(type === 'image' ? "Orchestrating Render..." : "Synthesizing Motion...");
    
    try {
      const referenceAsset = type === 'video' && output ? output : productImage;
      const resultUrl = await GeminiService.generatePhotoshoot({
        model: selectedModel, 
        productImage: referenceAsset.split(',')[1], 
        useCase: promptToUse, 
        productDetails
      }, brandKit, type, setLoadingMsg);

      if (type === 'image') {
        setOutput(resultUrl);
        setVideoOutput(null); 
        setIsRedefining(false);
      } else {
        setVideoOutput(resultUrl);
        setIsAnimating(false);
      }

      addToHistory({ 
        id: Math.random().toString(36).substr(2, 9), 
        type, 
        url: resultUrl, 
        prompt: promptToUse, 
        timestamp: Date.now() 
      });
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-32 animate-lux-in max-w-6xl mx-auto pb-32">
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
          {/* Step 1: Upload product */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 01</h3>
              <h2 className="text-4xl font-serif text-black italic">Upload product</h2>
            </div>
            <div 
              onClick={() => document.getElementById('shoot_up')?.click()}
              className={`aspect-[16/9] rounded-[3.5rem] border border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 relative ${productImage ? 'border-transparent bg-white shadow-2xl shadow-emerald-950/5' : 'border-emerald-100 hover:border-gold/30 bg-maison-bg/30'}`}
            >
              {productImage ? <MediaAsset src={productImage} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-6 px-12">
                  <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-gold border border-emerald-50 shadow-sm">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-950/30 uppercase tracking-widest block">Deposit Master Asset</span>
                </div>
              )}
              <input type="file" id="shoot_up" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); }} className="hidden" />
            </div>
          </section>

          {/* Step 2: Choose model */}
          <section className="space-y-10">
             <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 02</h3>
                <h2 className="text-4xl font-serif text-black italic">Choose model</h2>
             </div>
             <div className="bg-white border border-emerald-50 rounded-[3.5rem] p-10 soft-shadow overflow-hidden">
                <ModelShowcase 
                   compact 
                   selectedModelId={selectedModel?.id} 
                   onModelSelect={setSelectedModel} 
                />
             </div>
          </section>
        </div>

        <div className="space-y-24">
          {/* Step 3: Style & details */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 03</h3>
              <h2 className="text-4xl font-serif text-black italic">Style & details</h2>
            </div>
            
            <div className={`space-y-10 bg-white rounded-[3.5rem] p-12 border border-emerald-50 soft-shadow transition-all duration-700 ${isRedefining || isAnimating ? 'ring-1 ring-gold/10' : ''}`}>
              <div className="flex border-b border-emerald-50 pb-8 gap-10">
                <button 
                  onClick={() => setActiveTab('image')}
                  className={`text-[11px] font-bold uppercase tracking-[0.4em] transition-all relative pb-3 ${activeTab === 'image' ? 'text-gold' : 'text-black/20'}`}
                >
                  Visual Synthesis
                  {activeTab === 'image' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gold" />}
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`text-[11px] font-bold uppercase tracking-[0.4em] transition-all relative pb-3 ${activeTab === 'video' ? 'text-gold' : 'text-black/20'}`}
                >
                  Motion Synthesis
                  {activeTab === 'video' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gold" />}
                </button>
              </div>

              <div className="space-y-6">
                <textarea 
                  value={activeTab === 'image' ? customPrompt : videoPrompt} 
                  onChange={(e) => activeTab === 'image' ? setCustomPrompt(e.target.value) : setVideoPrompt(e.target.value)} 
                  placeholder={activeTab === 'image' ? "Describe the campaign setting and lighting..." : "Describe the cinematic motion..."} 
                  className="w-full bg-maison-bg border-none rounded-[2.5rem] p-10 text-sm font-serif italic min-h-[180px] focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner"
                />

                {suggestions.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest block ml-3">Maison Recommendations</span>
                    <div className="flex flex-wrap gap-3">
                      {suggestions.map((s, idx) => (
                        <button 
                          key={idx}
                          onClick={() => activeTab === 'image' ? setCustomPrompt(s.prompt) : setVideoPrompt(s.prompt)}
                          className="px-5 py-2.5 bg-maison-bg border border-emerald-50 rounded-full text-[9px] font-bold text-black/40 uppercase tracking-widest hover:border-gold hover:text-gold transition-all active:scale-95"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced options Accordion */}
              <div className="border-t border-emerald-50 pt-8">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.4em] group-hover:text-gold transition-colors">Advanced options</span>
                  <svg className={`w-5 h-5 text-black/20 transition-transform duration-500 ${showAdvanced ? 'rotate-180 text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAdvanced && (
                  <div className="pt-8 grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-3">Product Type</label>
                       <select value={productDetails.type} onChange={(e) => setProductDetails({...productDetails, type: e.target.value as ProductType})} className="w-full bg-maison-bg rounded-2xl px-8 py-5 text-[10px] font-bold uppercase outline-none border border-emerald-50/50">
                          <option value="Clothing">Clothing</option>
                          <option value="Jewelry">Jewelry</option>
                          <option value="Watch">Watch</option>
                          <option value="Bag">Bag</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-3">Camera Angle</label>
                       <select value={productDetails.cameraAngle} onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full bg-maison-bg rounded-2xl px-8 py-5 text-[10px] font-bold uppercase outline-none border border-emerald-50/50">
                          <option value="Standard">Standard</option>
                          <option value="Low Angle">Low Profile</option>
                          <option value="Close-up">Detail Focus</option>
                       </select>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleGenerate(activeTab)} 
                disabled={state === AppState.GENERATING || !productImage || !selectedModel}
                className={`w-full py-7 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${
                  state === AppState.GENERATING || !productImage || !selectedModel
                    ? 'bg-gray-50 text-black/10' 
                    : 'bg-black text-white hover:bg-gold shadow-gold/20'
                }`}
              >
                {state === AppState.GENERATING ? loadingMsg : `Execute Synthesis`}
              </button>
            </div>
          </section>

          {/* Step 4: Generate & download */}
          <section className="space-y-10">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-gold">Step 04</h3>
              <h2 className="text-4xl font-serif text-black italic">Generate & download</h2>
            </div>
            
            {(output || videoOutput) ? (
              <div className="animate-lux-in">
                <div className="aspect-[3/4] w-full rounded-[4rem] overflow-hidden shadow-2xl relative group bg-white border border-emerald-50">
                  {videoOutput ? (
                    <MediaAsset src={videoOutput} type="video" className="w-full h-full object-cover" controls autoPlay loop />
                  ) : (
                    <MediaAsset src={output!} className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute top-10 right-10 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700">
                    <a href={videoOutput || output!} download className="p-5 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[2rem] shadow-2xl hover:text-gold transition-all">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-[4rem] border border-dashed border-emerald-50 bg-maison-bg/20 flex flex-col items-center justify-center p-16 text-center space-y-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-950/10 shadow-sm">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-[0.5em]">Neural Render Pending</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CreateShoot;