import React, { useState, useRef, useMemo } from 'react';
import { ModelPersona, BrandKit, AppState, GenerationResult, ProductDetails, ProductCategory, LogoPlacement } from '../types';
import { GeminiService } from '../services/geminiService';
import ImageEditor from './ImageEditor';

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
  const [customPrompt, setCustomPrompt] = useState('');
  const [genType, setGenType] = useState<'image' | 'video'>('image');
  const [state, setState] = useState<AppState>(AppState.UPLOADING);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest'
  });

  const handleGenerate = async () => {
    if (!productImage || !selectedModel) return;
    setState(AppState.GENERATING);
    setLoadingMsg("Syncing Neural Identity...");
    try {
      let finalPrompt = `${selectedModel.defaultPromptFragment} ${customPrompt || 'Professional editorial shoot'}`;
      const resultUrl = await GeminiService.generatePhotoshoot({
        model: selectedModel, productImage: productImage.split(',')[1], useCase: finalPrompt, productDetails
      }, brandKit, genType, setLoadingMsg);
      setOutput(resultUrl);
      addToHistory({ id: Math.random().toString(36).substr(2, 9), type: genType, url: resultUrl, prompt: finalPrompt, timestamp: Date.now() });
      setState(AppState.READY);
    } catch (err: any) { alert(err.message); setState(AppState.READY); }
  };

  return (
    <div className="space-y-12 reveal active">
      {showEditor && output && genType === 'image' && (
        <ImageEditor 
          imageUrl={output} brandKit={brandKit}
          analysis={{ type: 'Clothing', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }} 
          onSave={(url) => { setOutput(url); setShowEditor(false); }} onCancel={() => setShowEditor(false)} 
        />
      )}

      <div className="bg-white border border-emerald-50 rounded-4xl p-10 flex flex-col md:flex-row items-center justify-between soft-shadow gap-12">
        <div className="flex items-center gap-8">
           {selectedModel && (
             <>
               <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-gold/20 shadow-xl group relative">
                  <img src={selectedModel.mainUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={onGoBackToModels} className="text-[8px] font-bold text-white uppercase tracking-widest">Change</button>
                  </div>
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-[0.4em] block">Identity Locked</span>
                  <h3 className="text-3xl font-serif text-emerald-950">{selectedModel.name}</h3>
                  <p className="text-[9px] text-emerald-950/40 font-bold uppercase tracking-widest">Model locked for this shoot.</p>
               </div>
             </>
           )}
        </div>
        <div className="flex bg-emerald-50 p-1.5 rounded-2xl">
           <button onClick={() => setGenType('image')} className={`px-12 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${genType === 'image' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-950/30'}`}>Still Photograph</button>
           <button onClick={() => setGenType('video')} className={`px-12 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${genType === 'video' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-950/30'}`}>Brand Film</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-8">
             <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.4em]">Product Asset</span>
                <div onClick={() => !productImage && document.getElementById('ps_up')?.click()} className={`aspect-square rounded-[2rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${productImage ? 'border-transparent bg-emerald-50' : 'border-emerald-100 hover:border-gold/30'}`}>
                   {productImage ? <img src={productImage} className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest">Upload Product</span>}
                   <input type="file" id="ps_up" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setProductImage(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" />
                </div>
                <p className="text-[8px] text-emerald-950/30 text-center font-bold uppercase tracking-widest">We isolate the product only.</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-12">
             <div className="space-y-6">
                <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-[0.4em]">Narrative Direction</span>
                <textarea 
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                  placeholder="Describe the cinematic scene in simple language..." 
                  className="w-full bg-emerald-50/20 border-none rounded-[2rem] p-8 text-base italic min-h-[180px] focus:ring-1 focus:ring-gold/20"
                />
             </div>
             <div className="pt-8 border-t border-emerald-50 flex justify-end">
                <button 
                  onClick={handleGenerate} 
                  disabled={!productImage || !selectedModel || state === AppState.GENERATING} 
                  className={`px-16 py-5 rounded-full font-bold text-[12px] uppercase tracking-[0.4em] transition-all ${!productImage || !selectedModel || state === AppState.GENERATING ? 'bg-emerald-50 text-emerald-100' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl shadow-emerald-950/20'}`}
                >
                   {state === AppState.GENERATING ? loadingMsg : 'Execute Shoot'}
                </button>
             </div>
          </div>

          {output && (
             <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow flex flex-col items-center animate-in zoom-in duration-1000">
               <div className="aspect-[3/4] w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                 {genType === 'video' ? <video src={output} className="w-full h-full object-cover" controls autoPlay loop /> : <img src={output} className="w-full h-full object-cover" />}
                 {genType === 'image' && (
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowEditor(true)} className="p-3 bg-white text-emerald-950 rounded-2xl shadow-2xl hover:text-gold transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg>
                      </button>
                   </div>
                 )}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CreateShoot;