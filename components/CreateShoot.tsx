
import React, { useState } from 'react';
import { ModelPersona, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, ProductAnalysis, CameraAngle, CameraMotion } from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import ImageEditor from './ImageEditor';
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
}

const CreateShoot: React.FC<CreateShootProps> = ({ 
  brandKit, selectedModel, setSelectedModel, addToHistory, 
  initialCategory, userCredits, onInsufficientCredits, onError 
}) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [videoDirective, setVideoDirective] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [state, setState] = useState<AppState>(AppState.READY);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [aiConcepts, setAiConcepts] = useState<{label: string, prompt: string}[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion', 
    type: 'Clothing', 
    approxSize: 'Standard', 
    placement: 'Full body', 
    addLogo: false, 
    logoPlacement: 'Chest',
    cameraAngle: 'Standard',
    cameraMotion: 'Static',
    renderMode: 'on-model', 
    videoResolution: '720p',
    videoAspectRatio: '3:4'
  });

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const placements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', "Bird's Eye", 'Side', 'Close-up'];

  const steps = [
    { id: 1, label: 'Upload Product', active: !!productImage },
    { id: 2, label: 'Choose Model', active: !!productImage && !!selectedModel },
    { id: 3, label: 'Style & Details', active: !!productImage && !!selectedModel && customPrompt.length > 5 },
    { id: 4, label: 'Generate & Download', active: !!output || !!videoOutput }
  ];

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setProductImage(dataUrl);
      setState(AppState.ANALYZING);
      setLoadingMsg("Performing Asset Analysis...");
      try {
        const base64 = dataUrl.split(',')[1];
        const res = await GeminiService.analyzeProduct(base64, file.type, brandKit);
        setAnalysis(res);
        setIsGeneratingConcepts(true);
        const concepts = await GeminiService.suggestPhotoshootPrompts(base64, brandKit);
        setAiConcepts(concepts);
      } catch (e) { 
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { 
        setState(AppState.READY); 
        setIsGeneratingConcepts(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (type: 'image' | 'video' = 'image') => {
    if (!productImage || !selectedModel || !customPrompt) return;
    
    if (type === 'image' && userCredits.images <= 0) return onInsufficientCredits();
    if (type === 'video' && userCredits.videos <= 0) return onInsufficientCredits();

    setState(AppState.GENERATING);
    setLoadingMsg(type === 'image' ? "Orchestrating Render..." : "Synthesizing Motion...");
    
    try {
      const finalUseCase = type === 'video' && videoDirective 
        ? `${customPrompt}. Motion Directive: ${videoDirective}`
        : customPrompt;

      const resultUrl = await GeminiService.generatePhotoshoot({
        model: selectedModel, 
        productImage: productImage.split(',')[1], 
        useCase: finalUseCase, 
        productDetails
      }, brandKit, type, setLoadingMsg);

      if (type === 'image') {
        setOutput(resultUrl);
      } else {
        setVideoOutput(resultUrl);
      }

      addToHistory({ 
        id: Math.random().toString(36).substr(2, 9), 
        type, 
        url: resultUrl, 
        prompt: finalUseCase, 
        timestamp: Date.now() 
      });
    } catch (err: any) { 
      onError(err); 
    } finally { 
      setState(AppState.READY); 
    }
  };

  return (
    <div className="space-y-32 py-12 animate-lux-in">
      {/* 4-Step Flow Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto border-b border-gray-50 pb-20">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center gap-6 flex-1 relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all duration-1000 ${
              step.active 
                ? 'bg-gold border-gold text-white shadow-2xl shadow-gold/20' 
                : 'bg-white border-gray-100 text-gray-200'
            }`}>
              {step.active ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : step.id}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap ${
              step.active ? 'text-emerald-950' : 'text-gray-200'
            }`}>{step.label}</span>
            {idx < steps.length - 1 && (
              <div className="absolute top-7 left-[calc(50%+35px)] right-[calc(-50%+35px)] h-[1px] bg-gray-50" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-32">
        {/* Input Phase */}
        {(!output && !videoOutput) && (
          <div className="grid grid-cols-1 gap-32">
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 01</h3>
                <h2 className="text-4xl font-serif text-emerald-950 italic">Upload Product Asset</h2>
              </div>
              <div 
                onClick={() => document.getElementById('shoot_up')?.click()}
                className={`aspect-[21/9] rounded-[4rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 group ${productImage ? 'border-transparent bg-gray-50 shadow-inner' : 'border-gray-100 hover:border-gold/30 hover:bg-gold/5'}`}
              >
                {productImage ? <MediaAsset src={productImage} className="w-full h-full object-cover" /> : (
                  <div className="text-center space-y-6 px-12 group-hover:scale-105 transition-transform duration-700">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-gold shadow-xl border border-gray-50">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <span className="text-[12px] font-bold text-gray-300 uppercase tracking-widest block leading-relaxed italic">Deposit Master Product</span>
                  </div>
                )}
                <input type="file" id="shoot_up" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); }} className="hidden" />
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 02</h3>
                <h2 className="text-4xl font-serif text-emerald-950 italic">Cast Identity</h2>
              </div>
              <div className="bg-white border border-gray-50 rounded-[4rem] p-12 soft-shadow">
                <ModelShowcase 
                  compact 
                  selectedModelId={selectedModel?.id} 
                  onModelSelect={setSelectedModel} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 & 4 Section */}
        {(!output && !videoOutput) ? (
          <div className="space-y-20 pt-24 border-t border-gray-100">
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 03</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Style & Narrative</h2>
            </div>

            <div className="space-y-12">
              <div className="space-y-8">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Creative Vision Directive</label>
                  {isGeneratingConcepts && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-gold uppercase tracking-widest">Architecting concepts...</span>
                    </div>
                  )}
                </div>
                
                <textarea 
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                  placeholder="Define the photoshoot atmosphere, editorial lighting, and environment..." 
                  className="w-full bg-gray-50/50 border-none rounded-[3rem] p-12 text-sm font-serif italic min-h-[220px] focus:ring-1 focus:ring-gold/20 outline-none shadow-inner transition-all focus:bg-white"
                />

                {aiConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-3 px-2">
                    {aiConcepts.map((concept, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCustomPrompt(concept.prompt)}
                        className={`px-8 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:border-gold hover:text-gold hover:shadow-lg ${customPrompt === concept.prompt ? 'bg-gold text-white border-gold shadow-gold/20' : 'text-emerald-950/40'}`}
                      >
                        {concept.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Advanced Options Accordion */}
              <div className="border border-gray-100 rounded-[3rem] overflow-hidden bg-white soft-shadow">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-12 py-10 flex items-center justify-between group hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-[0.4em]">Advanced Refinements</span>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-100 transition-all ${showAdvanced ? 'rotate-180 bg-gold border-gold text-white' : 'text-emerald-950/20'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>
                {showAdvanced && (
                  <div className="px-12 pb-16 space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Product Type</label>
                          <select value={productDetails.type} onChange={(e) => setProductDetails({...productDetails, type: e.target.value as ProductType})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all">
                            {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Approx Size</label>
                          <input 
                            type="text" 
                            value={productDetails.approxSize} 
                            onChange={(e) => setProductDetails({...productDetails, approxSize: e.target.value})} 
                            placeholder="e.g. 24cm, US 10" 
                            className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Placement</label>
                          <select value={productDetails.placement} onChange={(e) => setProductDetails({...productDetails, placement: e.target.value as ProductPlacement})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all">
                            {placements.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Perspective</label>
                          <select value={productDetails.cameraAngle} onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all">
                            {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-gray-50 pt-12">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Rendering Spec</label>
                          <select value={productDetails.videoResolution} onChange={(e) => setProductDetails({...productDetails, videoResolution: e.target.value as '720p' | '1080p'})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all">
                            <option value="720p">720p Standard</option>
                            <option value="1080p">1080p Cinematic</option>
                          </select>
                        </div>
                      </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Execute Render */}
            <div className="flex flex-col items-center gap-12 pt-20">
              <button 
                onClick={() => handleGenerate('image')} 
                disabled={state !== AppState.READY || !productImage || !selectedModel || customPrompt.length < 5}
                className={`px-40 py-10 rounded-full font-bold text-[14px] uppercase tracking-[0.6em] transition-all shadow-2xl ${
                  state !== AppState.READY || !productImage || !selectedModel || customPrompt.length < 5
                    ? 'bg-gray-50 text-gray-200 scale-95' 
                    : 'bg-emerald-950 text-white hover:bg-gold hover:scale-105 active:scale-95 shadow-emerald-950/20'
                }`}
              >
                {state === AppState.GENERATING ? loadingMsg : 'Step 4: Execute Render'}
              </button>
            </div>
          </div>
        ) : (
          /* Result Phase */
          <div className="space-y-32 animate-lux-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Result 01</h3>
                  <h2 className="text-4xl font-serif text-emerald-950 italic">Primary Render</h2>
                </div>
                <div className="aspect-[3/4] w-full rounded-[4rem] overflow-hidden shadow-2xl relative group bg-gray-50 border border-gray-100">
                  <img src={output!} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />
                  <div className="absolute top-12 right-12 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-x-4 group-hover:translate-x-0">
                    <a href={output!} download className="p-8 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[3rem] shadow-2xl hover:text-gold transition-all transform hover:scale-110">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Motion Synthesis</h3>
                  <h2 className="text-4xl font-serif text-emerald-950 italic">Animate Campaign</h2>
                </div>
                
                {!videoOutput ? (
                  <div className="bg-white border border-gray-100 rounded-[4rem] p-16 soft-shadow space-y-12">
                    <p className="text-lg text-emerald-950/60 leading-relaxed font-light italic">
                      Bring this masterpiece to life. Our neural motion engine will synthesize a 100% faithful cinematic film based on your primary render.
                    </p>
                    
                    <div className="space-y-6">
                      <label className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-widest block ml-6">Custom Motion Directive (Optional)</label>
                      <textarea 
                        value={videoDirective}
                        onChange={(e) => setVideoDirective(e.target.value)}
                        placeholder="e.g. 'Slow cinematic zoom into the embroidery'..."
                        className="w-full bg-gray-50/50 border-none rounded-[3rem] p-10 text-xs font-serif italic min-h-[160px] focus:ring-1 focus:ring-gold/20 outline-none shadow-inner"
                      />
                    </div>

                    <button 
                      onClick={() => handleGenerate('video')}
                      disabled={state === AppState.GENERATING || userCredits.videos <= 0}
                      className={`w-full py-8 rounded-full font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${
                        state === AppState.GENERATING || userCredits.videos <= 0
                          ? 'bg-gray-100 text-gray-300'
                          : 'bg-emerald-950 text-white hover:bg-gold shadow-emerald-950/20 active:scale-95'
                      }`}
                    >
                      {state === AppState.GENERATING ? loadingMsg : 'Execute Video Synthesis'}
                    </button>
                    
                    <div className="flex items-center justify-center gap-4 opacity-30">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Premium Rendering Protocol</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full rounded-[4rem] overflow-hidden shadow-2xl relative group bg-gray-50 border border-gray-100">
                    <MediaAsset src={videoOutput} type="video" className="w-full h-full object-cover" />
                    <div className="absolute top-12 right-12 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-x-4 group-hover:translate-x-0">
                      <a href={videoOutput} download className="p-8 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[3rem] shadow-2xl hover:text-gold transition-all transform hover:scale-110">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center border-t border-gray-50 pt-24">
               <button 
                onClick={() => { setOutput(null); setVideoOutput(null); setCustomPrompt(''); setVideoDirective(''); setProductImage(null); setAnalysis(null); }}
                className="text-[11px] font-bold text-emerald-950/20 uppercase tracking-[0.5em] hover:text-emerald-950 transition-colors"
               >
                 Initialize New Production Session
               </button>
            </div>
          </div>
        )}
      </div>

      {showEditor && output && !videoOutput && (
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
