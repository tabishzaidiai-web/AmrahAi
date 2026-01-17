
import React, { useState, useRef, useMemo } from 'react';
import { ModelPersona, ShootUseCase, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, LogoPlacement } from '../types';
import { GeminiService } from '../services/geminiService';
import { promptGallery } from '../data/prompts';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';

interface CreateShootProps {
  brandKit: BrandKit;
  selectedModel: ModelPersona | null;
  setSelectedModel: (model: ModelPersona) => void;
  addToHistory: (res: GenerationResult) => void;
  onGoBackToModels: () => void;
  initialCategory?: ProductCategory;
}

const CreateShoot: React.FC<CreateShootProps> = ({ brandKit, selectedModel, addToHistory, onGoBackToModels, initialCategory }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<ShootUseCase>('Clothing photoshoot');
  const [customPrompt, setCustomPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: 'fashion',
    type: 'Clothing',
    approxSize: 'Standard',
    placement: 'Full body',
    addLogo: false,
    logoPlacement: 'Bottom-center'
  });

  const productInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!productImage || !selectedModel) return;
    setState(AppState.GENERATING);
    setLoadingMsg("Syncing Talent Identity...");
    try {
      // Construction: Model Fragment + Template + Logo
      let finalPrompt = `${selectedModel.defaultPromptFragment} ${customPrompt || useCase}`;
      
      if (productDetails.addLogo) {
        finalPrompt += ` with the brand logo placed in the ${productDetails.logoPlacement.toLowerCase()}, small and subtle.`;
      }

      const resultUrl = await GeminiService.generatePhotoshoot({
        model: selectedModel,
        productImage: productImage.split(',')[1],
        useCase: finalPrompt as any,
        productDetails: productDetails
      }, brandKit, genType, setLoadingMsg);
      
      setOutput(resultUrl);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: genType, url: resultUrl, prompt: finalPrompt, timestamp: Date.now() });
      setState(AppState.READY);
    } catch (err: any) {
      alert(`Session failed: ${err.message}`);
      setState(AppState.READY);
    }
  };

  const logoPlacements: LogoPlacement[] = ['Top-right corner', 'Top-left corner', 'Bottom-center', 'Background watermark'];

  return (
    <div className="space-y-12 pb-24 reveal active">
      {showEditor && output && genType === 'image' && (
        <ImageEditor 
          imageUrl={output} 
          brandKit={brandKit}
          analysis={{ type: 'Clothing', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }} 
          onSave={(url) => { setOutput(url); setShowEditor(false); }} 
          onCancel={() => setShowEditor(false)} 
        />
      )}

      {/* Talent Identity Lock Header */}
      <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 flex flex-col md:flex-row items-center justify-between soft-shadow gap-10">
        <div className="flex items-center gap-10">
           {selectedModel ? (
             <>
               <div className="w-32 h-32 rounded-[32px] overflow-hidden border-2 border-[#D4AF37]/20 relative">
                  <img src={selectedModel.mainUrl} className="w-full h-full object-cover" alt="Locked Model" />
               </div>
               <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Locked Talent Identity</span>
                  <h2 className="text-4xl font-serif italic text-[#1A1A1A]">{selectedModel.name}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{selectedModel.nationality} • {selectedModel.gender}</span>
                    <button onClick={onGoBackToModels} className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest underline underline-offset-4">Change Model</button>
                  </div>
               </div>
             </>
           ) : (
             <button onClick={onGoBackToModels} className="px-10 py-4 bg-[#1A1A1A] text-white rounded-2xl text-[10px] uppercase font-bold tracking-widest">Select Neural Model</button>
           )}
        </div>
        <div className="flex bg-zinc-50 p-1 rounded-2xl">
           <button onClick={() => setGenType('image')} className={`px-10 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${genType === 'image' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-zinc-400'}`}>Signature Still</button>
           <button onClick={() => setGenType('video')} className={`px-10 py-4 rounded-xl text-[10px] font-bold uppercase transition-all ${genType === 'video' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-zinc-400'}`}>Cinematic Film</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-black/[0.05] rounded-[48px] p-8 soft-shadow space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Neural Asset Source</span>
              <div onClick={() => productInputRef.current?.click()} className={`aspect-square rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${productImage ? 'border-transparent bg-[#F9F9F9]' : 'border-zinc-100 hover:border-[#D4AF37]/30'}`}>
                  {productImage ? <img src={productImage} className="w-full h-full object-cover rounded-[32px]" /> : <div className="text-center p-6 space-y-2"><svg className="w-8 h-8 text-zinc-200 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={1} /></svg><span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest block text-center px-4">Upload product asset</span></div>}
                  <input type="file" ref={productInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setProductImage(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
              </div>
            </div>

            {/* Logo Settings */}
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
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 soft-shadow space-y-10">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Art Direction Prompt</span>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {promptGallery.map(tpl => (
                         <button 
                           key={tpl.id}
                           onClick={() => setCustomPrompt(tpl.promptTemplate)}
                           className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${customPrompt === tpl.promptTemplate ? 'bg-[#1A1A1A] text-white' : 'bg-zinc-50 border-black/[0.05] text-zinc-500'}`}
                         >
                            <p className="text-[10px] font-bold uppercase tracking-widest">{tpl.label}</p>
                            <p className="text-[7px] opacity-60 font-medium uppercase truncate">{tpl.category}</p>
                         </button>
                       ))}
                    </div>

                    <textarea 
                      value={customPrompt} 
                      onChange={(e) => setCustomPrompt(e.target.value)} 
                      placeholder="Specify campaign narrative or select a template..." 
                      className="w-full bg-[#F9F9F9] border-none rounded-[32px] p-8 text-[#1A1A1A] text-xl font-serif italic focus:outline-none min-h-[160px] resize-none shadow-inner" 
                    />
                 </div>
              </div>

              <div className="pt-8 border-t border-black/[0.04] flex justify-end">
                 <button 
                    onClick={handleGenerate}
                    disabled={!productImage || !selectedModel || state === AppState.GENERATING}
                    className={`px-24 py-8 rounded-[40px] font-bold text-[12px] uppercase tracking-[0.6em] transition-all shadow-2xl ${!productImage || !selectedModel || state === AppState.GENERATING ? 'bg-zinc-100 text-zinc-300' : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:scale-105 active:scale-95'}`}
                 >
                    {state === AppState.GENERATING ? loadingMsg : 'Execute Photoshoot'}
                 </button>
              </div>
           </div>

           {output && (
             <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 flex flex-col soft-shadow relative animate-in zoom-in duration-700">
               <div className="aspect-[3/4] max-h-[600px] rounded-[40px] overflow-hidden shadow-2xl mx-auto relative group">
                 {genType === 'video' ? <video src={output} className="w-full h-full object-cover" controls autoPlay loop /> : <img src={output} className="w-full h-full object-cover" />}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CreateShoot;
