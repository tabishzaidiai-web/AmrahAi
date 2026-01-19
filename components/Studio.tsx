
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement } from '../types';
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

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const productPlacements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];

  // Enhanced Environment Presets for Visual Gallery
  const environmentPresets = useMemo(() => [
    {
      category: 'Heritage',
      items: [
        { id: 'h-1', label: 'Old Souk Dusk', prompt: 'Inside a grand, atmospheric Arabian souk at twilight. Soft lantern light, intricate woodwork, warm amber shadows, and floating dust motes catching the light.', img: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=400' },
        { id: 'h-2', label: 'Silk Palace', prompt: 'An opulent palace chamber with heavy silk drapes and marble floors. Royal blue and gold accents, soft volumetric lighting from high windows.', img: 'https://images.unsplash.com/photo-1512106373293-673e160249d8?auto=format&fit=crop&q=80&w=400' }
      ]
    },
    {
      category: 'Modernist',
      items: [
        { id: 'm-1', label: 'Concrete Zen', prompt: 'A minimalist architectural space with raw concrete walls. Sharp geometric shadows, cold northern light, clean lines, and an ultra-modern aesthetic.', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400' },
        { id: 'm-2', label: 'Glass Infinity', prompt: 'A high-end glass showroom overlooking a blurred neon-lit metropolis at night. Rain droplets on the glass, cool blue reflections.', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400' }
      ]
    },
    {
      category: 'Organic',
      items: [
        { id: 'o-1', label: 'Desert Silence', prompt: 'Golden sand dunes at the first light of dawn. Soft orange sky, deep blue shadows, wind ripples in the sand, very peaceful and vast.', img: 'https://images.unsplash.com/photo-1443633190479-502621746b14?auto=format&fit=crop&q=80&w=400' },
        { id: 'o-2', label: 'Mossy Grotto', prompt: 'A damp stone cave floor covered in vibrant green moss. A single sunbeam pierces the dark, illuminating the product with natural brilliance.', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400' }
      ]
    }
  ], []);

  // Neural Dynamic Suggestions based on Product Intelligence
  const dynamicSuggestions = useMemo(() => {
    const type = analysis?.type || productDetails.type || 'luxury piece';
    const mat = analysis?.material || 'exquisite material';
    const feature = (analysis?.features && analysis.features.length > 0) 
      ? analysis.features[0] 
      : 'intricate craftsmanship';
    
    return [
      {
        id: 'dyn-minimal',
        label: 'Zen Minimalist',
        prompt: `A high-fidelity minimalist composition featuring the ${mat} ${type} centered on a monolith of honed limestone. Natural, soft-angled morning light creates long, gentle shadows. Background is a seamless, matte neutral architectural space. Focus is sharp on the ${feature}.`
      },
      {
        id: 'dyn-opulent-arabian',
        label: 'Opulent Arabian',
        prompt: `A prestigious editorial shot of the ${mat} ${type} resting on a rich, midnight-blue silk cushion. Ornate mashrabiya patterns cast intricate shadows across the scene. Warm, golden volumetric lighting highlights the ${feature} and the heritage essence of the piece.`
      }
    ];
  }, [analysis, productDetails.type]);

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
        if (res.type) {
           const detectedType = productTypes.find(t => t.toLowerCase().includes(res.type.toLowerCase())) || 'Other';
           setProductDetails(prev => ({ ...prev, type: detectedType as ProductType }));
        }
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
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Step 1: Asset Configuration</span>
              
              <div onClick={() => fileInputRef.current?.click()} className={`aspect-square rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-[#F9F9F9]' : 'border-zinc-100 hover:border-[#D4AF37]/30'}`}>
                {sourceImage ? <img src={sourceImage} className="w-full h-full object-cover" alt="Source" /> : <div className="text-center p-6 space-y-2"><svg className="w-8 h-8 text-zinc-100 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={1}/></svg><span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest block">Upload product asset</span></div>}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              {/* Quick Config */}
              <div className="space-y-4 pt-4 border-t border-black/[0.04]">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                       <select value={productDetails.type} onChange={(e) => setProductDetails(prev => ({ ...prev, type: e.target.value as ProductType }))} className="w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-3 py-2 text-[9px] font-bold uppercase">
                          {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Placement</label>
                       <select value={productDetails.placement} onChange={(e) => setProductDetails(prev => ({ ...prev, placement: e.target.value as ProductPlacement }))} className="w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-3 py-2 text-[9px] font-bold uppercase">
                          {productPlacements.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-black/[0.04]">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Add Maison Logo</span>
                    <button onClick={() => setProductDetails(prev => ({ ...prev, addLogo: !prev.addLogo }))} className={`w-12 h-6 rounded-full transition-all relative ${productDetails.addLogo ? 'bg-[#D4AF37]' : 'bg-zinc-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${productDetails.addLogo ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 soft-shadow space-y-10">
              
              {/* Environment Gallery */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Signature Maison Backdrops</span>
                    <span className="text-[8px] font-bold text-[#D4AF37] uppercase tracking-widest">Select to apply</span>
                 </div>
                 <div className="space-y-8">
                    {environmentPresets.map((cat) => (
                       <div key={cat.category} className="space-y-3">
                          <h4 className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.3em]">{cat.category}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {cat.items.map((item) => (
                                <div 
                                  key={item.id} 
                                  onClick={() => setPrompt(item.prompt)}
                                  className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all relative aspect-video ${prompt === item.prompt ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                   <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.label} />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-3">
                                      <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center">{item.label}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Director's Console */}
              <div className="space-y-6 pt-10 border-t border-black/[0.04]">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Director's Console</span>
                    <div className="flex gap-2">
                       {dynamicSuggestions.map(s => (
                         <button key={s.id} onClick={() => setPrompt(s.prompt)} className="px-3 py-1 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-full text-[7px] font-bold text-[#D4AF37] uppercase tracking-widest hover:border-[#D4AF37] transition-all">Neural Tip</button>
                       ))}
                    </div>
                 </div>

                 <textarea 
                   value={prompt} 
                   onChange={(e) => setPrompt(e.target.value)} 
                   placeholder="Orchestrate a custom environment here..." 
                   className="w-full bg-[#F9F9F9] border-none rounded-[32px] p-8 text-[#1A1A1A] text-xl font-serif italic focus:outline-none min-h-[140px] resize-none shadow-inner" 
                 />
              </div>

              <div className="pt-8 flex items-center justify-between gap-6 border-t border-black/[0.04]">
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
