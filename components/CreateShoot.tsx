
import React, { useState, useEffect } from 'react';
import { ModelPersona, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, ProductType, ProductPlacement, ProductAnalysis, CameraAngle } from '../types';
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
  const [videoPrompt, setVideoPrompt] = useState('');
  const [state, setState] = useState<AppState>(AppState.READY);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [isRedefining, setIsRedefining] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
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

  // Neural Enhancement Chips
  const enhancementChips = [
    { label: 'Dramatic Lighting', prompt: 'Improve the lighting to be more dramatic and cinematic, using Rembrandt-style high-contrast shadows.' },
    { label: 'Highlight Textures', prompt: 'Focus on highlighting the intricate textures, fabric weaves, and material depth with micro-lighting.' },
    { label: 'Cinematic Glow', prompt: 'Apply a warm, ethereal cinematic glow with soft bloom and volumetric light shafts.' },
    { label: 'Studio Noir', prompt: 'Transform scene into a moody Studio Noir setting with deep blacks and sharp rim lighting.' }
  ];

  // Sync video prompt with image prompt initially if empty
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
        const res = await GeminiService.analyzeProduct(base64, file.type, brandKit);
        setAnalysis(res);
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
      // Use the output image as reference for video if it exists, otherwise use original product
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

  const applyEnhancement = (chipPrompt: string) => {
    if (activeTab === 'image') {
      setCustomPrompt(chipPrompt);
    } else {
      setVideoPrompt(chipPrompt);
    }
  };

  const toggleRedefine = () => {
    setIsRedefining(!isRedefining);
    setIsAnimating(false);
    if (!isRedefining) {
      setActiveTab('image');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleAnimate = () => {
    setIsAnimating(!isAnimating);
    setIsRedefining(false);
    if (!isAnimating) {
      setActiveTab('video');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 animate-lux-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif text-black italic">Maison Shoot Orchestrator</h2>
            <div 
              onClick={() => document.getElementById('shoot_up')?.click()}
              className={`aspect-[16/9] rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-700 relative ${productImage ? 'border-transparent bg-white shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}
            >
              {productImage ? <MediaAsset src={productImage} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-4 px-12">
                  <div className="w-16 h-16 bg-maison-bg rounded-full mx-auto flex items-center justify-center text-gold border border-gray-100">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-black uppercase tracking-widest block">Upload Product Image</span>
                    <p className="text-[9px] text-black/30 font-bold uppercase tracking-widest leading-relaxed">The AI will extract the product and use your selected model.</p>
                  </div>
                </div>
              )}
              <input type="file" id="shoot_up" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); }} className="hidden" />
            </div>
          </div>

          <div className={`space-y-8 bg-white rounded-[3rem] p-10 border shadow-sm transition-all duration-500 ${isRedefining || isAnimating ? 'border-gold ring-1 ring-gold/20' : 'border-gray-100'}`}>
            <div className="flex border-b border-gray-50 pb-6 gap-8">
              <button 
                onClick={() => setActiveTab('image')}
                className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative pb-2 ${activeTab === 'image' ? 'text-gold' : 'text-black/20'}`}
              >
                Visual Directive
                {activeTab === 'image' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gold" />}
              </button>
              <button 
                onClick={() => setActiveTab('video')}
                className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative pb-2 ${activeTab === 'video' ? 'text-gold' : 'text-black/20'}`}
              >
                Motion Directive
                {activeTab === 'video' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gold" />}
              </button>
            </div>

            {activeTab === 'image' ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                   <p className="text-[9px] text-black/30 font-bold uppercase tracking-widest">Atmosphere & Pose</p>
                   {isRedefining && <span className="text-[8px] font-bold text-gold uppercase tracking-widest animate-pulse">Redefining Active</span>}
                </div>
                <textarea 
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                  placeholder="Describe the campaign setting, lighting, and model pose..." 
                  className="w-full bg-maison-bg border-none rounded-[2rem] p-8 text-sm font-serif italic min-h-[160px] focus:ring-1 focus:ring-gold outline-none"
                />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                   <p className="text-[9px] text-black/30 font-bold uppercase tracking-widest">Motion & Flow</p>
                   {isAnimating && <span className="text-[8px] font-bold text-gold uppercase tracking-widest animate-pulse">Animation Active</span>}
                </div>
                <textarea 
                  value={videoPrompt} 
                  onChange={(e) => setVideoPrompt(e.target.value)} 
                  placeholder="Describe the cinematic movement (e.g. 'Fabric swaying in wind', 'Model walks slowly toward camera')..." 
                  className="w-full bg-maison-bg border-none rounded-[2rem] p-8 text-sm font-serif italic min-h-[160px] focus:ring-1 focus:ring-gold outline-none"
                />
              </div>
            )}

            {/* Enhancement Chips */}
            <div className="flex flex-wrap gap-3">
               {enhancementChips.map(chip => (
                 <button 
                  key={chip.label}
                  onClick={() => applyEnhancement(chip.prompt)}
                  className="px-4 py-2 bg-maison-bg border border-gray-100 rounded-full text-[8px] font-bold text-black/40 uppercase tracking-widest hover:border-gold hover:text-gold transition-all"
                 >
                   {chip.label}
                 </button>
               ))}
            </div>

            <button 
              onClick={() => handleGenerate(activeTab)} 
              disabled={state === AppState.GENERATING || !productImage || !selectedModel || (activeTab === 'image' ? !customPrompt : !videoPrompt)}
              className={`w-full py-6 rounded-full font-bold text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl ${
                state === AppState.GENERATING || !productImage || !selectedModel || (activeTab === 'image' ? !customPrompt : !videoPrompt)
                  ? 'bg-gray-100 text-black/10' 
                  : 'bg-black text-white hover:bg-gold shadow-gold/20'
              }`}
            >
              {state === AppState.GENERATING ? loadingMsg : (isRedefining || isAnimating) ? "Commit Re-Synthesis" : `Execute ${activeTab === 'image' ? 'Synthesis' : 'Motion Flow'}`}
            </button>
          </div>
        </div>

        <div className="space-y-12">
           <h3 className="text-xl font-serif text-black italic">Talent Selection</h3>
           {selectedModel ? (
             <div className="bg-white rounded-[3rem] p-10 soft-shadow border border-gray-100 space-y-8 animate-lux-in">
               <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-xl">
                    <img src={selectedModel.mainUrl} className="w-full h-full object-cover" alt="Model" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-gold text-[9px] font-bold uppercase tracking-[0.4em]">{selectedModel.nationality}</span>
                    <h4 className="text-2xl font-serif text-black italic">{selectedModel.name}</h4>
                  </div>
               </div>
               <p className="text-[11px] text-black/40 italic leading-relaxed">{selectedModel.features}</p>
             </div>
           ) : (
             <div className="h-[300px] bg-white border border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4">
                <p className="text-sm font-serif text-black/20 italic">No identity selected. Please browse the Models tab to cast your campaign star.</p>
                <button onClick={() => document.dispatchEvent(new CustomEvent('changeTab', { detail: 'models' }))} className="text-[9px] font-bold text-gold uppercase tracking-widest underline underline-offset-4">Browse Models</button>
             </div>
           )}

           {(output || videoOutput) && (
             <div className="space-y-8 pt-12 animate-lux-in" id="output-section">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-serif text-black italic">Maison Archives Output</h3>
                   <div className="flex gap-4">
                      {output && (
                        <button 
                          onClick={toggleAnimate}
                          className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${isAnimating ? 'bg-gold text-white' : 'bg-gold/10 border border-gold/20 text-gold hover:bg-gold hover:text-white'}`}
                        >
                          {videoOutput ? "Re-Animate" : "Animate Asset"}
                        </button>
                      )}
                      <button 
                        onClick={toggleRedefine}
                        className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${isRedefining ? 'bg-gold text-white' : 'bg-black text-white hover:bg-gold'}`}
                      >
                        Redefine Image
                      </button>
                   </div>
                </div>

                <div className="aspect-[3/4] w-full rounded-[3rem] overflow-hidden shadow-2xl relative group bg-white border border-gray-100">
                  {videoOutput ? (
                    <video src={videoOutput} className="w-full h-full object-cover" controls autoPlay loop />
                  ) : (
                    <img src={output!} className="w-full h-full object-cover" alt="Result" />
                  )}
                  
                  <div className="absolute top-8 right-8 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-700">
                    <a href={videoOutput || output!} download className="p-4 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl hover:text-gold transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                  </div>

                  {isRedefining && (
                    <div className="absolute inset-0 bg-gold/10 backdrop-blur-[2px] pointer-events-none border-4 border-gold rounded-[3rem] animate-pulse" />
                  )}
                  {isAnimating && (
                    <div className="absolute inset-0 bg-gold/5 backdrop-blur-[1px] pointer-events-none border-4 border-dashed border-gold rounded-[3rem] animate-pulse" />
                  )}
                </div>
                
                {(isRedefining || isAnimating) && (
                  <div className="text-center animate-bounce">
                    <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Modify directive above to commit changes</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CreateShoot;
