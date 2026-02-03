
import React, { useState } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, ProductType, CameraAngle, ModelPersona, ProductPlacement } from '../types';
import { GeminiService } from '../services/geminiService';
import ModelShowcase from './ModelShowcase';
import ImageEditor from './ImageEditor';
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
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [output, setOutput] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [aiConcepts, setAiConcepts] = useState<{label: string, prompt: string}[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  
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
    // Fixed: changed '1:1' to '16:9' to match the allowed union type for videoAspectRatio in ProductDetails
    videoAspectRatio: '16:9'
  });

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const placements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];
  const lightingPresets = ['Soft Ambient', 'Dramatic Spotlight', 'Golden Hour Glow', 'Studio Noir', 'Natural Daylight'];
  
  const steps = [
    { id: 1, label: 'Upload Product', active: !!sourceImage },
    { id: 2, label: 'Choose Mode', active: !!sourceImage && (productDetails.renderMode === 'product-only' || !!selectedModel) },
    { id: 3, label: 'Style & Details', active: !!sourceImage && prompt.length > 5 },
    { id: 4, label: 'Generate & Download', active: !!output }
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
        setIsGeneratingConcepts(true);
        const concepts = await GeminiService.suggestPhotoshootPrompts(base64, brandKit);
        setAiConcepts(concepts);
      } catch (err) { 
        setAnalysis({ type: 'Product', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] });
      } finally { 
        setState(AppState.READY); 
        setIsGeneratingConcepts(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;
    if (genType === 'image' && userCredits.images <= 0) return onInsufficientCredits();
    setState(AppState.GENERATING);
    setLoadingMsg("Orchestrating...");
    try {
      const base64 = sourceImage.split(',')[1];
      const finalPrompt = `Lighting: ${lighting}. Environment: ${prompt}`;
      let url = await GeminiService.generateProductImage(base64, analysis!, finalPrompt, brandKit, productDetails);
      setOutput(url);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: finalPrompt, timestamp: Date.now() });
    } catch (err: any) { onError(err); } finally { setState(AppState.READY); }
  };

  return (
    <div className="space-y-32 py-12 animate-lux-in">
      {/* 4-Step Header */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        {/* Step 1 & 2 */}
        <div className="space-y-20">
          <div className="space-y-10">
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 01</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Master Asset</h2>
            </div>
            <div 
              onClick={() => document.getElementById('quick_up')?.click()}
              className={`aspect-square rounded-[4rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-1000 ${sourceImage ? 'border-transparent bg-gray-50 shadow-inner' : 'border-gray-100 hover:border-gold/30'}`}
            >
              {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-6 px-12 italic text-gray-300">
                  <span className="text-[12px] font-bold uppercase tracking-widest block leading-relaxed">Deposit Product Asset</span>
                </div>
              )}
              <input type="file" id="quick_up" onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 02</h3>
                <h2 className="text-4xl font-serif text-emerald-950 italic">Presentation Mode</h2>
             </div>
             <div className="flex bg-gray-50 p-2 rounded-[3rem] border border-gray-100 shadow-inner mb-12">
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'product-only'})}
                  className={`flex-1 py-6 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-700 ${productDetails.renderMode === 'product-only' ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-950/20'}`}
                >
                  Standalone
                </button>
                <button 
                  onClick={() => setProductDetails({...productDetails, renderMode: 'on-model'})}
                  className={`flex-1 py-6 rounded-[2.5rem] text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-700 ${productDetails.renderMode === 'on-model' ? 'bg-white text-emerald-950 shadow-xl' : 'text-emerald-950/20'}`}
                >
                  On Model
                </button>
             </div>
             {productDetails.renderMode === 'on-model' && (
                <div className="bg-white border border-gray-50 rounded-[3rem] p-8 soft-shadow animate-in slide-in-from-bottom-4 duration-500">
                   <ModelShowcase 
                     compact 
                     selectedModelId={selectedModel?.id} 
                     onModelSelect={setSelectedModel} 
                   />
                </div>
             )}
          </div>
        </div>

        {/* Step 3 & 4 */}
        <div className="space-y-20">
          <div className="space-y-12">
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 03</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Style & Vision</h2>
            </div>

            <div className="space-y-10">
              <div className="space-y-6">
                <span className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-[0.4em] ml-2 block">Atmosphere Lighting</span>
                <div className="flex flex-wrap gap-4">
                  {lightingPresets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setLighting(preset)}
                      className={`px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-700 border ${
                        lighting === preset ? 'bg-gold border-gold text-white shadow-xl shadow-gold/20' : 'bg-white border-gray-100 text-emerald-950/20 hover:text-emerald-950/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block ml-6">Environment Context</label>
                <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="Describe the studio environment, background textures, and architectural shadows..." 
                  className="w-full bg-gray-50/50 border-none rounded-[3rem] p-12 text-sm font-serif italic min-h-[160px] focus:ring-1 focus:ring-gold/20 outline-none transition-all focus:bg-white shadow-inner"
                />
              </div>

              {/* Advanced Accordion */}
              <div className="border border-gray-100 rounded-[3rem] overflow-hidden bg-white soft-shadow">
                 <button 
                   onClick={() => setShowAdvanced(!showAdvanced)}
                   className="w-full px-12 py-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
                 >
                   <span className="text-[11px] font-bold text-emerald-950/40 uppercase tracking-[0.4em]">Advanced Optics</span>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 transition-all ${showAdvanced ? 'rotate-180 bg-gold border-gold text-white' : 'text-emerald-950/20'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                   </div>
                 </button>
                 {showAdvanced && (
                   <div className="px-12 pb-12 space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Product Type</label>
                          <select value={productDetails.type} onChange={(e) => setProductDetails({...productDetails, type: e.target.value as ProductType})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none">
                             {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Approx Size</label>
                          <input 
                            type="text" 
                            value={productDetails.approxSize} 
                            onChange={(e) => setProductDetails({...productDetails, approxSize: e.target.value})} 
                            placeholder="e.g. 15cm" 
                            className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Placement</label>
                          <select value={productDetails.placement} onChange={(e) => setProductDetails({...productDetails, placement: e.target.value as ProductPlacement})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none">
                            {placements.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-widest block">Studio Angle</label>
                          <select value={productDetails.cameraAngle} onChange={(e) => setProductDetails({...productDetails, cameraAngle: e.target.value as CameraAngle})} className="w-full bg-gray-50 border-none rounded-3xl px-8 py-5 text-[11px] font-bold uppercase tracking-widest outline-none">
                             <option value="Standard">Standard Studio</option>
                             <option value="Close-up">Macro Focus</option>
                             <option value="Low Angle">Low Profile</option>
                          </select>
                        </div>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-12 pt-12">
            <div className="space-y-4 text-center">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Step 04</h3>
              <h2 className="text-4xl font-serif text-emerald-950 italic">Execute Synthesis</h2>
            </div>
            
            <button 
              onClick={handleGenerate} 
              disabled={state !== AppState.READY || !sourceImage || prompt.length < 5}
              className={`px-40 py-10 rounded-full font-bold text-[14px] uppercase tracking-[0.6em] transition-all shadow-2xl ${
                state !== AppState.READY || !sourceImage || prompt.length < 5 ? 'bg-gray-50 text-gray-200' : 'bg-emerald-950 text-white hover:bg-gold shadow-emerald-950/20'
              }`}
            >
              {state === AppState.GENERATING ? 'Synthesizing...' : 'Step 4: Execute Render'}
            </button>

            {output && (
              <div className="w-full max-w-lg animate-lux-in pt-12">
                 <div className="aspect-square w-full rounded-[4rem] overflow-hidden shadow-2xl relative group bg-gray-50 border border-gray-100">
                    <MediaAsset src={output} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-emerald-950/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-10 right-10 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
                       <a href={output} download className="p-8 bg-white/90 backdrop-blur-md text-emerald-950 rounded-[2.5rem] shadow-2xl hover:text-gold transition-all">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </a>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoStudio;
