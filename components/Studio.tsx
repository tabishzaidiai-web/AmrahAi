
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement } from '../types';
import { GeminiService } from '../services/geminiService';
import { promptGallery } from '../data/prompts';
import ImageEditor from './ImageEditor';

interface StudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
}

const Studio: React.FC<StudioProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'jewelry',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Top-right corner',
    videoResolution: '720p',
    videoAspectRatio: '16:9'
  });

  const [layers, setLayers] = useState<GenerationResult[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId) || null, [layers, activeLayerId]);

  // Neural Dynamic Suggestions based on Product Intelligence
  const dynamicSuggestions = useMemo(() => {
    const type = analysis?.type || productDetails.type || 'product';
    const mat = analysis?.material || 'premium material';
    const feature = (analysis?.features && analysis.features[0]) || 'exquisite craftsmanship';
    
    return [
      {
        id: 'dyn-minimal',
        label: 'Minimalist Architecture',
        prompt: `Professional photo of this ${mat} ${type} on a raw concrete pedestal with a minimalist architectural background, soft diffused daylight, sharp focus on ${feature}, clean e-commerce mood.`
      },
      {
        id: 'dyn-arabian',
        label: 'Opulent Arabian',
        prompt: `Professional photo of this ${mat} ${type} on a dark silk surface with ornate gold surroundings, warm amber lighting from a hidden source, deep cinematic shadows, highlighting the ${feature}.`
      },
      {
        id: 'dyn-macro',
        label: 'Signature Macro',
        prompt: `Professional macro photo of the ${type} showcasing the fine ${mat} textures and ${feature}, shallow depth of field, cool-toned side lighting, high-end gallery aesthetic.`
      },
      {
        id: 'dyn-lifestyle',
        label: 'Luxury Lifestyle',
        prompt: `Professional photo of the ${type} in a sun-drenched marble boutique with blurred high-end decor, soft morning shadows, elegant high-fashion composition.`
      },
      {
        id: 'dyn-banner',
        label: 'Campaign Banner',
        prompt: `Professional wide-shot of the ${type} on a mirror-finish surface, volumetric lighting rays, minimal futuristic background, optimized for hero banner placement.`
      }
    ];
  }, [analysis, productDetails.type, brandKit.name]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setSourceImage(result);
      setState(AppState.ANALYZING);
      try {
        const res = await GeminiService.analyzeProduct(result.split(',')[1], file.type, brandKit);
        setAnalysis(res);
        setState(AppState.READY);
      } catch { setState(AppState.READY); }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!sourceImage || !prompt) return;
    setState(AppState.GENERATING);
    setLoadingMsg("Composing masterpiece...");
    try {
      const base64 = sourceImage.split(',')[1];
      
      // Inject logo instructions if enabled
      let finalPrompt = prompt;
      if (productDetails.addLogo) {
        const logoText = productDetails.logoPlacement === 'Background watermark' 
          ? `with the brand logo as a faint, subtle watermark in the background, keeping the product fully visible.`
          : `with the brand logo placed in the ${productDetails.logoPlacement.toLowerCase()}, small and subtle, not covering the main product.`;
        finalPrompt += ` ${logoText}`;
      }

      let url = genType === 'image' 
        ? await GeminiService.generateProductImage(base64, analysis!, finalPrompt, brandKit, productDetails)
        : await GeminiService.generateProductVideo(base64, analysis!, finalPrompt, brandKit, productDetails, setLoadingMsg);

      const newLayer: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: genType, url, prompt: finalPrompt, timestamp: Date.now() };
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      addToHistory(newLayer);
      setState(AppState.READY);
    } catch (err: any) {
      alert(`Render failed: ${err.message}`);
      setState(AppState.READY);
    }
  };

  const logoPlacements: LogoPlacement[] = ['Top-right corner', 'Top-left corner', 'Bottom-center', 'Background watermark'];

  return (
    <div className="space-y-12 pb-24 reveal active">
      {showEditor && activeLayer && activeLayer.type === 'image' && analysis && (
        <ImageEditor 
          imageUrl={activeLayer.url} 
          brandKit={brandKit}
          analysis={analysis}
          onSave={(url) => { 
            setLayers(layers.map(l => l.id === activeLayerId ? { ...l, url } : l)); 
            setShowEditor(false); 
          }} 
          onCancel={() => setShowEditor(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
           <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Couture Studio</span>
           <h2 className="text-4xl font-serif text-[#1A1A1A]">Neural Product Renders</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white border border-black/[0.05] rounded-[48px] p-8 soft-shadow space-y-8">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Step 1: Upload Piece</span>
              <div onClick={() => fileInputRef.current?.click()} className={`aspect-square rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-[#F9F9F9]' : 'border-zinc-100 hover:border-[#D4AF37]/30'}`}>
                {sourceImage ? <img src={sourceImage} className="w-full h-full object-cover" alt="Source" /> : <div className="text-center p-6 space-y-2"><svg className="w-8 h-8 text-zinc-100 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={1}/></svg><span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest block">Drop product asset</span></div>}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              {/* Logo Support Toggle */}
              <div className="space-y-6 pt-6 border-t border-black/[0.04]">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Add Brand Logo</span>
                    <button 
                      onClick={() => setProductDetails(prev => ({ ...prev, addLogo: !prev.addLogo }))}
                      className={`w-12 h-6 rounded-full transition-all relative ${productDetails.addLogo ? 'bg-[#D4AF37]' : 'bg-zinc-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${productDetails.addLogo ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
                 {productDetails.addLogo && (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">Placement</label>
                      <select 
                        value={productDetails.logoPlacement}
                        onChange={(e) => setProductDetails(prev => ({ ...prev, logoPlacement: e.target.value as LogoPlacement }))}
                        className="w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-4 py-2 text-[10px] font-bold uppercase"
                      >
                        {logoPlacements.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                 )}
              </div>

              {/* Video Configuration Panel */}
              {genType === 'video' && (
                <div className="space-y-6 pt-6 border-t border-black/[0.04] animate-in fade-in slide-in-from-top-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Video Orchestration</span>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Resolution</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['720p', '1080p'].map((res) => (
                          <button
                            key={res}
                            onClick={() => setProductDetails(prev => ({ ...prev, videoResolution: res as any }))}
                            className={`py-2 rounded-xl text-[9px] font-bold uppercase transition-all border ${productDetails.videoResolution === res ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-zinc-50 border-black/[0.05] text-zinc-400'}`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Aspect Ratio</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['16:9', '9:16'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setProductDetails(prev => ({ ...prev, videoAspectRatio: ratio as any }))}
                            className={`py-2 rounded-xl text-[9px] font-bold uppercase transition-all border ${productDetails.videoAspectRatio === ratio ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-zinc-50 border-black/[0.05] text-zinc-400'}`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 soft-shadow space-y-8">
              <div className="space-y-6">
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Step 2: Creative Directive</span>
                 
                 {/* Standard Prompt Templates */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {promptGallery.map(tpl => (
                       <button 
                         key={tpl.id}
                         onClick={() => setPrompt(tpl.promptTemplate)}
                         className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${prompt === tpl.promptTemplate ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-zinc-50 border-black/[0.04] text-zinc-500 hover:border-[#D4AF37]'}`}
                       >
                          <p className="text-[10px] font-bold uppercase tracking-widest">{tpl.label}</p>
                          <p className="text-[7px] opacity-60 font-medium uppercase truncate">{tpl.category}</p>
                       </button>
                    ))}
                 </div>

                 <textarea 
                   value={prompt} 
                   onChange={(e) => setPrompt(e.target.value)} 
                   placeholder="Describe the environment or select a template above..." 
                   className="w-full bg-[#F9F9F9] border-none rounded-[32px] p-8 text-[#1A1A1A] text-xl font-serif italic focus:outline-none min-h-[160px] resize-none shadow-inner" 
                 />

                 {/* Neural Intelligence Suggestions - Dynamically generated */}
                 <div className="space-y-3 pt-4 border-t border-black/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Neural Intelligence Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dynamicSuggestions.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setPrompt(s.prompt)}
                          className="px-4 py-2 bg-[#D4AF37]/5 border border-[#D4AF37]/10 hover:border-[#D4AF37] rounded-full text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest transition-all"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="pt-8 flex items-center justify-between gap-6">
                <div className="flex bg-zinc-50 p-1 rounded-2xl">
                  <button onClick={() => setGenType('image')} className={`px-8 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'image' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-zinc-400'}`}>Still</button>
                  <button onClick={() => setGenType('video')} className={`px-8 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'video' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-zinc-400'}`}>Film</button>
                </div>
                <button 
                  onClick={handleGenerate} 
                  disabled={state === AppState.GENERATING || !sourceImage || !prompt} 
                  className={`px-16 py-6 rounded-3xl font-bold text-[11px] uppercase tracking-[0.5em] transition-all shadow-xl ${state === AppState.GENERATING || !sourceImage || !prompt ? 'bg-zinc-100 text-zinc-300' : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:scale-105'}`}
                >
                  {state === AppState.GENERATING ? 'Synthesizing...' : 'Execute Neural Render'}
                </button>
              </div>
           </div>

           {activeLayer && (
             <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 flex flex-col soft-shadow relative animate-in zoom-in duration-700">
                <div className="aspect-square max-h-[500px] bg-[#F9F9F9] rounded-[32px] overflow-hidden mx-auto shadow-2xl relative group">
                   {activeLayer.type === 'video' ? <video src={activeLayer.url} className="w-full h-full object-cover" controls autoPlay loop /> : <img src={activeLayer.url} className="w-full h-full object-cover" alt="Result" />}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Studio;
