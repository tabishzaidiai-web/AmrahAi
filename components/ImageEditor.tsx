import React, { useState, useRef, useEffect } from 'react';
import { BrandKit, ProductAnalysis } from '../types';
import { GeminiService } from '../services/geminiService';

interface ImageEditorProps {
  imageUrl: string;
  brandKit: BrandKit;
  analysis: ProductAnalysis;
  onSave: (newImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, brandKit, analysis, onSave, onCancel }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [activeFilter, setActiveFilter] = useState('none');
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState(imageUrl);
  
  // AI Redefinement State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiLoadingMsg, setAiLoadingMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const filters = [
    { id: 'none', label: 'Original', settings: { b: 100, c: 100, s: 100, se: 0, g: 0 } },
    { id: 'maison', label: 'Maison Mono', settings: { b: 110, c: 130, s: 0, se: 0, g: 100 } },
    { id: 'vintage', label: 'Vintage Gold', settings: { b: 95, c: 110, s: 80, se: 40, g: 0 } },
    { id: 'editorial', label: 'Editorial', settings: { b: 105, c: 115, s: 110, se: 0, g: 0 } },
    { id: 'heritage', label: 'Heritage', settings: { b: 90, c: 120, s: 70, se: 10, g: 0 } },
  ];

  const signatureRefinements = [
    { 
      id: 'maison-heritage', 
      label: 'Maison Heritage', 
      icon: '✨',
      prompt: 'Add subtle, intricate gold embroidery following the seams of the product. Place the product in a serene, cinematic desert sunset scene with soft orange and purple lighting.' 
    },
    { 
      id: 'royal-monogram', 
      label: 'Royal Monogram', 
      icon: '⚜️',
      prompt: 'Refine product texture to include a subtle embossed leather monogram pattern. Set in a luxury hotel lobby with warm ambient light.' 
    },
    { 
      id: 'midnight-oasis', 
      label: 'Midnight Oasis', 
      icon: '🌙',
      prompt: 'Transform background to a moonlit Arabian garden with silver moonlight reflections. Enhance metallic details of the product.' 
    }
  ];

  const applyPreset = (filter: typeof filters[0]) => {
    setActiveFilter(filter.id);
    setBrightness(filter.settings.b);
    setContrast(filter.settings.c);
    setSaturation(filter.settings.s);
    setSepia(filter.settings.se);
    setGrayscale(filter.settings.g);
  };

  const handleAiRefine = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse) return;
    
    setIsAiProcessing(true);
    setAiLoadingMsg("Accessing Neural Core...");
    
    try {
      const messages = ["Analyzing Request...", "Synchronizing Brand DNA...", "Regenerating Textures...", "Finalizing Render..."];
      let msgIdx = 0;
      const interval = setInterval(() => {
        msgIdx++;
        if (msgIdx < messages.length) setAiLoadingMsg(messages[msgIdx]);
      }, 2000);

      const editedUrl = await GeminiService.editProductImage(currentDisplayUrl, analysis, promptToUse, brandKit);
      clearInterval(interval);
      setCurrentDisplayUrl(editedUrl);
      setAiPrompt('');
    } catch (e: any) {
      alert(`AI Refinement Failed: ${e.message}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%)`;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0D0D0D]/95 backdrop-blur-2xl flex items-center justify-center p-8 md:p-20 overflow-hidden animate-in fade-in duration-500">
      <div className="w-full h-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.5em]">Refinement Lab</span>
              <h2 className="text-3xl font-serif text-white italic">Asset Transformation</h2>
            </div>
            <button onClick={onCancel} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 bg-black/40 rounded-[48px] border border-white/5 relative overflow-hidden flex items-center justify-center group shadow-2xl">
            {isAiProcessing && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <p className="text-xl font-serif italic text-white">{aiLoadingMsg}</p>
              </div>
            )}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]" />
            <img 
              ref={imageRef}
              src={currentDisplayUrl} 
              alt="Refining" 
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%)` }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[48px] p-10 flex flex-col gap-8 overflow-y-auto custom-scrollbar no-scrollbar">
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-[32px] space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Neural AI Redefine</span>
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              </div>
              
              <div className="space-y-3">
                 <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block ml-2">Signature Refinements</span>
                 <div className="grid grid-cols-1 gap-2">
                    {signatureRefinements.map(refine => (
                      <button 
                        key={refine.id}
                        onClick={() => handleAiRefine(refine.prompt)}
                        disabled={isAiProcessing}
                        className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all group"
                      >
                         <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                           {refine.icon}
                         </div>
                         <div className="text-left">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{refine.label}</p>
                            <p className="text-[8px] text-white/40 italic">One-click synthesis</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block ml-2">Custom Transformation</span>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to change (e.g. 'Add pearl details', 'Change background to urban Dubai')..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-serif italic focus:outline-none focus:border-[#D4AF37]/50 min-h-[100px] placeholder-white/20"
                />
                <button 
                  onClick={() => handleAiRefine()}
                  disabled={!aiPrompt || isAiProcessing}
                  className={`w-full py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all ${!aiPrompt || isAiProcessing ? 'bg-white/5 text-white/10' : 'bg-[#D4AF37] text-white shadow-lg hover:scale-[1.02] shadow-[#D4AF37]/20'}`}
                >
                  Execute Neural Edit
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] block">Manual Controls</span>
              <div className="space-y-5">
                {[
                  { label: 'Brightness', val: brightness, set: setBrightness },
                  { label: 'Contrast', val: contrast, set: setContrast },
                  { label: 'Saturation', val: saturation, set: setSaturation }
                ].map((ctrl) => (
                  <div key={ctrl.label} className="space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-white/60 uppercase tracking-widest">
                      <span>{ctrl.label}</span>
                      <span>{ctrl.val}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={ctrl.val} onChange={(e) => ctrl.set(parseInt(e.target.value))} className="w-full accent-[#D4AF37] opacity-60 hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] block">Heritage Presets</span>
              <div className="grid grid-cols-2 gap-3">
                {filters.map(f => (
                  <button key={f.id} onClick={() => applyPreset(f)} className={`py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all border ${activeFilter === f.id ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4 pb-4">
            <button onClick={handleSave} className="w-full py-6 bg-[#D4AF37] text-white font-bold rounded-[32px] text-[10px] uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all gold-glow">Commit Refinements</button>
            <button onClick={onCancel} className="w-full py-6 bg-white/5 text-white/60 font-bold rounded-[32px] text-[10px] uppercase tracking-[0.5em] border border-white/5 hover:bg-white/10 transition-all">Discard Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
