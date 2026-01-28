
import React, { useState, useRef, useMemo } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, PromptLibraryItem } from '../types';
import { GeminiService } from '../services/geminiService';
import ImageEditor from './ImageEditor';
import { modelData } from '../data/models';
import MediaAsset from './MediaAsset';

interface PhotoStudioProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
}

const PhotoStudio: React.FC<PhotoStudioProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion',
    type: 'Clothing',
    approxSize: 'Standard',
    placement: 'Full body',
    addLogo: false,
    logoPlacement: 'Chest'
  });

  const [selectedModelId, setSelectedModelId] = useState(modelData[0].id);
  const selectedModel = useMemo(() => modelData.find(m => m.id === selectedModelId), [selectedModelId]);

  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya', 'Other'];
  const logoPlacements: LogoPlacement[] = ['Chest', 'Center front', 'Wrist/dial center', 'Bag front', 'Top-right corner', 'Background watermark'];

  const promptLibrary: PromptLibraryItem[] = useMemo(() => {
    const type = analysis?.type || productDetails.type || 'luxury item';
    const mat = analysis?.material || 'premium material';
    const mainFeature = analysis?.features?.[0] || 'intricate detailing';
    const tone = brandKit.tone || 'Editorial';

    return [
      {
        id: 'lib-1',
        category: 'Luxury fashion editorials',
        title: 'Vogue Heritage',
        description: 'High-fashion editorial with dramatic architecture.',
        template: `A high-fashion editorial campaign for this ${mat} ${type}. Modest pose against a brutalist glass atrium. ${tone} lighting, sharp focus on ${mainFeature}.`
      },
      {
        id: 'lib-2',
        category: 'Jewelry close-ups',
        title: 'Facet Brilliance',
        description: 'Macro focus on metal and gemstones.',
        template: `Ultra-macro studio photography of ${mat} ${type}. Pinpoint lighting highlights ${mainFeature}. Soft charcoal velvet background, ${tone} aesthetic.`
      }
    ];
  }, [analysis, productDetails.type, brandKit]);

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
    setLoadingMsg("Syncing with Neural Core...");
    try {
      const base64 = sourceImage.split(',')[1];
      let finalPrompt = `${selectedModel?.defaultPromptFragment} ${prompt}`;
      if (productDetails.addLogo) {
        finalPrompt += ` [Apply brand logo at ${productDetails.logoPlacement.toLowerCase()}.]`;
      }
      
      let url = genType === 'image' 
        ? await GeminiService.generateProductImage(base64, analysis!, finalPrompt, brandKit, productDetails)
        : await GeminiService.generateProductVideo(base64, analysis!, finalPrompt, brandKit, productDetails, setLoadingMsg);

      const newRes: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: genType, url, prompt: finalPrompt, timestamp: Date.now() };
      setResults(prev => [newRes, ...prev]);
      setActiveResultId(newRes.id);
      addToHistory(newRes);
      setState(AppState.READY);
    } catch (err: any) {
      alert(`Render failed: ${err.message}`);
      setState(AppState.READY);
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700 relative h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif text-emerald-950">Photo Studio</h2>
          <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest">Neural Product Orchestration Center</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLibrary(!showLibrary)}
            className={`px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${showLibrary ? 'bg-gold text-white border-gold' : 'bg-white text-emerald-950 border-emerald-50 hover:border-gold/30'}`}
          >
            {showLibrary ? 'Close Library' : 'Prompt Library'}
          </button>
          <div className="flex bg-emerald-50 p-1 rounded-2xl">
            <button onClick={() => setGenType('image')} className={`px-10 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'image' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/40'}`}>Still Photography</button>
            <button onClick={() => setGenType('video')} className={`px-10 py-3 rounded-xl text-[9px] font-bold uppercase transition-all ${genType === 'video' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-950/40'}`}>Cinematic Film</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-emerald-50 soft-shadow space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">01. Master Asset</span>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-emerald-50' : 'border-emerald-100 hover:border-gold/50'}`}
              >
                {sourceImage ? <MediaAsset src={sourceImage} className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest">Upload Product</span>}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-emerald-50">
               <div className="space-y-2">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Category</label>
                  <select value={productDetails.type} onChange={(e) => setProductDetails(prev => ({ ...prev, type: e.target.value as ProductType }))} className="w-full text-xs">
                     {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Inject Maison Logo</label>
                  <input type="checkbox" checked={productDetails.addLogo} onChange={(e) => setProductDetails(prev => ({ ...prev, addLogo: e.target.checked }))} className="w-4 h-4 accent-gold" />
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-emerald-50 soft-shadow space-y-10">
             <div className="space-y-6">
                <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">02. Style Blueprint</span>
                <div className="grid grid-cols-4 gap-3">
                   {modelData.map(m => (
                     <button key={m.id} onClick={() => setSelectedModelId(m.id)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedModelId === m.id ? 'border-gold' : 'border-transparent'}`}>
                        <MediaAsset src={m.mainUrl} className="w-full h-full object-cover" />
                     </button>
                   ))}
                </div>
                <div className="space-y-4 pt-6">
                   <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Narrative Narrative Idea</label>
                   <textarea 
                     value={prompt} 
                     onChange={(e) => setPrompt(e.target.value)} 
                     placeholder="Define the scene..." 
                     className="w-full bg-emerald-50/30 border-none rounded-2xl p-6 text-sm italic min-h-[160px] focus:ring-1 focus:ring-gold/20"
                   />
                </div>
             </div>
             <div className="pt-6 border-t border-emerald-50 flex justify-end">
                <button 
                  onClick={handleGenerate} 
                  disabled={state === AppState.GENERATING || !sourceImage || !prompt} 
                  className={`px-14 py-4 rounded-full font-bold text-[11px] uppercase tracking-[0.3em] transition-all ${state === AppState.GENERATING || !sourceImage || !prompt ? 'bg-emerald-50 text-emerald-100' : 'bg-emerald-950 text-white hover:bg-gold shadow-lg shadow-emerald-950/10'}`}
                >
                  {state === AppState.GENERATING ? 'Orchestrating...' : 'Execute Neural Render'}
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="space-y-4">
             <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">03. Rendered Assets</span>
             <div className="grid grid-cols-1 gap-6">
                {results.length === 0 && state !== AppState.GENERATING ? (
                  <div className="bg-emerald-50/30 border border-dashed border-emerald-100 rounded-3xl aspect-square flex items-center justify-center text-center p-12">
                     <p className="text-[10px] text-emerald-950/30 font-bold uppercase tracking-[0.4em]">Ready for orchestration.</p>
                  </div>
                ) : (
                  <>
                    {state === AppState.GENERATING && (
                      <div className="bg-emerald-50 animate-pulse rounded-3xl aspect-square flex items-center justify-center">
                        <span className="text-[9px] font-bold uppercase text-gold animate-bounce">{loadingMsg}</span>
                      </div>
                    )}
                    {results.map(res => (
                      <div key={res.id} onClick={() => setActiveResultId(res.id)} className={`bg-white rounded-3xl overflow-hidden soft-shadow transition-all border-2 cursor-pointer ${activeResultId === res.id ? 'border-gold' : 'border-transparent'}`}>
                         <MediaAsset src={res.url} type={res.type} className="w-full h-full object-cover aspect-square" />
                         <div className="p-4 flex items-center justify-between bg-white border-t border-emerald-50">
                            <span className="text-[8px] text-emerald-950/40 font-bold uppercase truncate max-w-[140px]">Neural Asset</span>
                            <div className="flex gap-2">
                               <a href={res.url} download className="p-2 hover:text-gold transition-colors">
                                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                               </a>
                            </div>
                         </div>
                      </div>
                    ))}
                  </>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoStudio;
