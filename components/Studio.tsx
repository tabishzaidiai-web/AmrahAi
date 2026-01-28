
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppState, ProductAnalysis, BrandKit, GenerationResult, ProductDetails, ProductCategory, LogoPlacement, ProductType, ProductPlacement, PromptLibraryItem, CameraAngle } from '../types';
import { GeminiService } from '../services/geminiService';
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
  const [showLibrary, setShowLibrary] = useState(true);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'jewelry',
    type: 'Jewelry',
    approxSize: 'Standard',
    placement: 'On table',
    addLogo: false,
    logoPlacement: 'Top-right corner',
    cameraAngle: 'Standard',
    videoResolution: '720p',
    videoAspectRatio: '16:9'
  });

  const [layers, setLayers] = useState<GenerationResult[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId) || null, [layers, activeLayerId]);

  const productTypes: ProductType[] = ['Jewelry', 'Watch', 'Clothing', 'Bag', 'Shoes', 'Accessories', 'Abaya / Modest fashion', 'Other'];
  const productPlacements: ProductPlacement[] = ['On ear', 'On neck', 'On wrist', 'On finger', 'On chest', 'On shoulder', 'Full body', 'Handheld', 'On table'];
  const logoPlacements: LogoPlacement[] = ['Chest', 'Center front', 'Wrist/dial center', 'Bag front', 'Top-right corner', 'Background watermark'];
  const cameraAngles: CameraAngle[] = ['Standard', 'Low Angle', 'High Angle', "Bird's Eye", 'Side', 'Close-up'];

  // Dynamically generate 10 high-fidelity prompt suggestions based on Product Analysis
  const dynamicSuggestions = useMemo(() => {
    const type = analysis?.type || productDetails.type || 'luxury piece';
    const mat = analysis?.material || 'premium material';
    const mainFeature = analysis?.features?.[0] || 'intricate craftsmanship';
    const brand = brandKit.name || 'Maison';

    return [
      { id: 's1', label: 'Minimalist Monolith', prompt: `A high-fidelity minimalist composition of the ${mat} ${type} on a slab of honed grey limestone. Natural morning light, focus on ${mainFeature}.` },
      { id: 's2', label: 'Opulent Arabian', prompt: `An opulent editorial scene: the ${mat} ${type} on royal emerald velvet. Intricate mashrabiya shadows, warm golden lighting on the ${mainFeature}.` },
      { id: 's3', label: 'Desert Dawn', prompt: `The ${mat} ${type} in the ${brand} style, nestled in fine desert sand dune at first light. Violet and amber sky background.` },
      { id: 's4', label: 'Marina Modern', prompt: `Bright lifestyle campaign shot of the ${type} overlooking a blurred Mediterranean marina. Crisp daylight, sparkling water bokeh.` },
      { id: 's5', label: 'Noir Excellence', prompt: `Cinematic product portrait of the ${mat} ${type} emerging from a deep charcoal void. A single rim light traces the ${mainFeature}.` },
      { id: 's6', label: 'Heritage Majlis', prompt: `The ${type} in a refined modern majlis setting. Traditional carved wood textures meet minimalist glass tables. Warm ambient light.` },
      { id: 's7', label: 'Architectural Atrium', prompt: `A high-fashion setting with the ${type} in an open-air glass and steel atrium. Sharp geometric shadows and high-noon lighting.` },
      { id: 's8', label: 'Silk & Velvet', prompt: `Intimate macro shot of the ${type} nestled in heavy folds of charcoal velvet and silk. Dramatic mood lighting catches the sheen of ${mat}.` },
      { id: 's9', label: 'Nordic Glass', prompt: `Pristine product shot of the ${type} on a reflective frosted glass surface. Cold northern light, minimalist environment.` },
      { id: 's10', label: 'Metropolis Suite', prompt: `High-rise penthouse suite at night. The ${type} near a window with blurred city lights reflecting in its ${mat} surface.` }
    ];
  }, [analysis, brandKit.name, productDetails.type]);

  const useLibraryPrompt = (item: PromptLibraryItem | { prompt: string }) => {
    setPrompt('prompt' in item ? (item as any).prompt : (item as any).template);
    const textarea = document.getElementById('main-prompt-input');
    if (textarea) textarea.focus();
  };

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
    setLoadingMsg("Synthesizing masterpiece...");
    try {
      const base64 = sourceImage.split(',')[1];
      let finalPrompt = prompt;
      if (productDetails.addLogo) {
        finalPrompt += ` [BRAND LOGO PROTOCOL: Apply logo at ${productDetails.logoPlacement.toLowerCase()}.]`;
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

  return (
    <div className="flex gap-8 pb-20 reveal active relative h-full">
      {showEditor && activeLayer && activeLayer.type === 'image' && analysis && (
        <ImageEditor 
          imageUrl={activeLayer.url} 
          brandKit={brandKit}
          analysis={analysis}
          onSave={(url) => { setLayers(layers.map(l => l.id === activeLayerId ? { ...l, url } : l)); setShowEditor(false); }} 
          onCancel={() => setShowEditor(false)} 
        />
      )}

      {/* Main Studio Area */}
      <div className={`transition-all duration-500 flex-1 space-y-8 ${showLibrary ? 'mr-[320px]' : ''}`}>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-serif text-[#111] font-medium">Neural Product Studio</h2>
          <p className="text-xs text-gray-500 font-light">Synthesize high-fidelity product renders with granular control.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Control Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6 soft-shadow space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1. Source Asset</span>
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`aspect-square rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${sourceImage ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:border-gold/50'}`}
                >
                  {sourceImage ? <img src={sourceImage} className="w-full h-full object-cover" alt="Source" /> : <div className="text-center text-gray-300 space-y-1"><span className="text-[9px] font-bold uppercase block">Upload Asset</span></div>}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                 <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
                         <select value={productDetails.type} onChange={(e) => setProductDetails(prev => ({ ...prev, type: e.target.value as ProductType }))} className="w-full px-3 py-2 text-xs">
                            {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Placement</label>
                         <select value={productDetails.placement} onChange={(e) => setProductDetails(prev => ({ ...prev, placement: e.target.value as ProductPlacement }))} className="w-full px-3 py-2 text-xs">
                            {productPlacements.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Camera Angle</label>
                       <select 
                         value={productDetails.cameraAngle} 
                         onChange={(e) => setProductDetails(prev => ({ ...prev, cameraAngle: e.target.value as CameraAngle }))} 
                         className="w-full px-3 py-2 text-xs"
                       >
                          {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-4">
                 <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="add-logo-cb"
                      checked={productDetails.addLogo} 
                      onChange={(e) => setProductDetails(prev => ({ ...prev, addLogo: e.target.checked }))}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <label htmlFor="add-logo-cb" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer select-none">Add my brand logo</label>
                 </div>
                 
                 {productDetails.addLogo && (
                   <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Logo placement</label>
                      <select 
                        value={productDetails.logoPlacement} 
                        onChange={(e) => setProductDetails(prev => ({ ...prev, logoPlacement: e.target.value as LogoPlacement }))}
                        className="w-full px-3 py-2 text-xs bg-gray-50"
                      >
                         {logoPlacements.map(lp => <option key={lp} value={lp}>{lp}</option>)}
                      </select>
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-8 soft-shadow space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Narrative Orchestration</span>
                    <button 
                      onClick={() => setShowLibrary(!showLibrary)}
                      className="text-[8px] font-bold text-gold uppercase tracking-widest hover:underline"
                    >
                      {showLibrary ? 'Hide Library' : 'Open Library'}
                    </button>
                 </div>
                 <div className="relative group">
                    <textarea 
                      id="main-prompt-input"
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Define the environment and lighting for this masterpiece..." 
                      className="w-full bg-gray-50 border-none rounded-xl p-6 text-sm italic min-h-[140px] focus:ring-1 focus:ring-gold/20 shadow-inner"
                    />
                 </div>

                 {/* Neural suggestions integrated exactly below prompt box */}
                 <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Neural Intelligence Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dynamicSuggestions.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => useLibraryPrompt(s)}
                          className={`px-3 py-2 bg-white border border-gray-100 hover:border-gold/30 rounded-full text-[8px] font-bold text-gray-500 hover:text-gold uppercase tracking-widest transition-all shadow-sm ${prompt === s.prompt ? 'border-gold text-gold ring-1 ring-gold/10' : ''}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                <div className="flex bg-gray-50 p-1 rounded-lg">
                  <button onClick={() => setGenType('image')} className={`px-6 py-2 rounded-md text-[9px] font-bold uppercase transition-all ${genType === 'image' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-400'}`}>Still</button>
                  <button onClick={() => setGenType('video')} className={`px-6 py-2 rounded-md text-[9px] font-bold uppercase transition-all ${genType === 'video' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-400'}`}>Film</button>
                </div>
                <button 
                  onClick={handleGenerate} 
                  disabled={state === AppState.GENERATING || !sourceImage || !prompt} 
                  className={`px-10 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${state === AppState.GENERATING || !sourceImage || !prompt ? 'bg-gray-100 text-gray-300' : 'bg-[#111] text-white hover:bg-gold shadow-lg shadow-black/10'}`}
                >
                  {state === AppState.GENERATING ? 'Synthesizing...' : 'Execute Neural Render'}
                </button>
              </div>
            </div>

            {activeLayer && (
              <div className="bg-white border border-gray-100 rounded-xl p-8 soft-shadow flex flex-col items-center animate-in zoom-in duration-500">
                <div className="aspect-square w-full max-w-[500px] bg-gray-50 rounded-lg overflow-hidden shadow-inner relative group">
                  {activeLayer.type === 'video' ? <video src={activeLayer.url} className="w-full h-full object-cover" controls autoPlay loop /> : <img src={activeLayer.url} className="w-full h-full object-cover" alt="Result" />}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeLayer.type === 'image' && <button onClick={() => setShowEditor(true)} className="p-2 bg-white rounded-lg shadow-lg hover:text-gold transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg></button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Prompt Library Panel */}
      <div 
        className={`fixed top-24 bottom-6 right-6 w-[300px] bg-white border border-gray-100 rounded-xl soft-shadow transition-all duration-500 flex flex-col z-[40] ${showLibrary ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'}`}
      >
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-[11px] font-bold text-[#111] uppercase tracking-widest">Luxury Prompt Library</h3>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Select to inject DNA</p>
          </div>
          <button 
            onClick={() => setShowLibrary(false)}
            className="p-1.5 text-gray-300 hover:text-gold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col-reverse gap-4">
          {[
            {
              id: 'lib-1',
              category: 'Minimalist',
              title: 'Zen Monolith',
              description: 'Clean, architectural shot on stone.',
              template: 'A high-fidelity minimalist composition of the product resting on a monolith of honed grey limestone. Soft, directional morning light from high-left, sharp focus. Seamless neutral background.'
            },
            {
              id: 'lib-2',
              category: 'Heritage',
              title: 'Opulent Majlis',
              description: 'Warm, rich Arabian interior setting.',
              template: 'A prestigious campaign shot of the product positioned in a modern luxury majlis. Warm ambient light, mashrabiya shadow patterns, blurred heritage textures in the background. High-contrast and cinematic.'
            },
            {
              id: 'lib-3',
              category: 'Editorial',
              title: 'Editorial Noir',
              description: 'Dramatic lighting for high-end ads.',
              template: 'Dramatic studio product portrait. Single razor-sharp rim light tracing the form of the product, highlighting the fine details against a deep black void. Sophisticated and mysterious.'
            },
            {
              id: 'lib-4',
              category: 'Lifestyle',
              title: 'Marina Chic',
              description: 'Bright, outdoor coastal atmosphere.',
              template: 'Bright lifestyle campaign on a marble table at a Dubai Marina penthouse. Sparkling water bokeh, crisp daylight, high-fashion summer mood.'
            }
          ].map((item) => (
            <div 
              key={item.id} 
              className="group bg-gray-50 hover:bg-white border border-transparent hover:border-gold/30 rounded-xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-md"
              onClick={() => useLibraryPrompt({ prompt: item.template })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[7px] font-bold text-gold uppercase tracking-[0.2em]">{item.category}</span>
              </div>
              <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-widest mb-1">{item.title}</h4>
              <p className="text-[8px] text-gray-500 font-medium leading-relaxed mb-3">{item.description}</p>
              <button className="w-full py-2 border border-gray-100 rounded-lg text-[7px] font-bold text-gray-400 uppercase tracking-widest group-hover:bg-gold group-hover:text-white group-hover:border-gold transition-all">
                Use Template
              </button>
            </div>
          ))}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default Studio;
