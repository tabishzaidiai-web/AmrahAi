
import React, { useState, useRef } from 'react';
import { BrandKit, ModelPersona } from '../types';
import { GeminiService } from '../services/geminiService';
import { modelData } from '../data/models';
import MediaAsset from './MediaAsset';

interface PhotoshootPlannerProps {
  brandKit: BrandKit;
}

const PhotoshootPlanner: React.FC<PhotoshootPlannerProps> = ({ brandKit }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [userBrief, setUserBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefText, setBriefText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProductImage(ev.target?.result as string);
      setBriefText(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!productImage) return;
    setIsGenerating(true);
    setError(null);
    try {
      const base64 = productImage.split(',')[1];
      const res = await GeminiService.generatePhotoshootBrief(
        base64, 
        'image/png', 
        userBrief,
        brandKit,
        selectedModel
      );
      setBriefText(res);
    } catch (err: any) {
      setError(err.message || "Failed to orchestrate production plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard.");
  };

  const extractAiBrief = (text: string) => {
    const parts = text.split(/GENERATION BRIEF:/i);
    return parts.length > 1 ? parts[1].trim() : "";
  };

  const renderBrief = (text: string) => {
    const aiBrief = extractAiBrief(text);
    const humanPart = text.split(/GENERATION BRIEF:/i)[0];

    return (
      <div className="space-y-12">
        <div className="human-plan">
          {humanPart.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && !trimmed.startsWith('•') && !trimmed.startsWith('-'))) {
              return <h4 key={i} className="text-xl font-serif text-emerald-950 mt-10 mb-4 border-b border-gold/20 pb-2">{trimmed.replace(/#/g, '')}</h4>;
            }
            if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d\./.test(trimmed)) {
              return <li key={i} className="ml-6 mb-2 text-sm text-emerald-950/70 list-none flex gap-3">
                <span className="text-gold">•</span>
                <span>{trimmed.replace(/^[•\-\d\.]\s*/, '')}</span>
              </li>;
            }
            if (trimmed.length === 0) return null;
            return <p key={i} className="text-sm text-emerald-950/80 leading-relaxed mb-4">{trimmed}</p>;
          })}
        </div>

        {aiBrief && (
          <div className="ai-brief mt-16 p-8 bg-emerald-950 rounded-3xl border border-gold/20 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <svg className="w-20 h-20 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">AI Generation Brief</span>
               </div>
               <button 
                onClick={() => copyToClipboard(aiBrief)}
                className="px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-[8px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-emerald-950 transition-all"
               >
                 Copy Prompt
               </button>
            </div>
            <p className="text-xs text-emerald-50/70 font-mono leading-loose relative z-10">
              {aiBrief}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-end justify-between border-b border-black/5 pb-8">
         <div className="space-y-1">
            <h2 className="text-4xl font-serif text-emerald-950">Photoshoot Assistant</h2>
            <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.4em]">Simple planning & neural brief orchestration.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">01. Reference Asset</span>
                    {productImage && <button onClick={() => {setProductImage(null); setBriefText(null);}} className="text-[8px] font-bold text-gold uppercase tracking-widest">Replace</button>}
                 </div>
                 <div 
                   onClick={() => !productImage && fileInputRef.current?.click()} 
                   className={`aspect-square rounded-3xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${productImage ? 'border-transparent bg-emerald-50 shadow-inner' : 'border-emerald-100 hover:border-gold/30'}`}
                 >
                    {productImage ? (
                      <MediaAsset src={productImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-gold">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest block">Upload Product</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-emerald-50">
                 <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">02. Talent Casting (Optional)</span>
                 <select 
                   value={selectedModel?.id || ''} 
                   onChange={(e) => {
                     const m = modelData.find(m => m.id === e.target.value);
                     setSelectedModel(m || null);
                   }}
                   className="w-full px-4 py-3 bg-emerald-50/20 border-emerald-50 rounded-2xl text-[10px] uppercase font-bold tracking-widest outline-none focus:border-gold/30 transition-colors"
                 >
                   <option value="">No specific model</option>
                   {modelData.map(m => (
                     <option key={m.id} value={m.id}>{m.name} ({m.nationality})</option>
                   ))}
                 </select>
                 {selectedModel && (
                    <p className="text-[8px] text-gold font-bold uppercase tracking-widest text-center">Identity Locked: {selectedModel.id}</p>
                 )}
              </div>

              <div className="space-y-6 pt-10 border-t border-emerald-50">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">03. Creative Directive</span>
                    <span className="text-[8px] px-2 py-0.5 bg-emerald-50 text-emerald-950/40 rounded uppercase font-bold tracking-widest">Required</span>
                 </div>
                 <textarea 
                  value={userBrief} 
                  onChange={(e) => setUserBrief(e.target.value)} 
                  placeholder="e.g. 'Plan an indoor abaya shoot for Instagram in Dubai, minimalist, beige tones.'" 
                  className="w-full bg-emerald-50/20 border-emerald-50 rounded-3xl p-6 text-xs italic min-h-[140px] focus:ring-1 focus:ring-gold/20 outline-none placeholder:text-emerald-950/20"
                 />
                 <p className="text-[8px] text-emerald-950/30 uppercase font-bold tracking-widest text-center">Ready for your vision</p>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!productImage || !userBrief || isGenerating}
                className={`w-full py-5 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all ${!productImage || !userBrief || isGenerating ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl active:scale-95 shadow-emerald-950/20'}`}
              >
                {isGenerating ? 'Planning Shoot...' : 'Start Planning'}
              </button>
           </div>
        </div>

        {/* Brief Panel */}
        <div className="lg:col-span-8 space-y-10">
           {briefText ? (
              <div className="bg-[#FCFAF8] rounded-4xl p-16 border border-emerald-50 soft-shadow relative animate-in fade-in zoom-in-95 duration-500 min-h-[600px] flex flex-col">
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
                 
                 <div className="flex items-center justify-between mb-12 border-b border-gold/10 pb-8 relative z-10">
                    <div className="space-y-1">
                       <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Photoshoot Brief</span>
                       <h3 className="text-3xl font-serif text-emerald-950 italic">Project Planning</h3>
                    </div>
                    <button onClick={() => copyToClipboard(briefText)} className="p-3 bg-white border border-emerald-50 rounded-2xl text-emerald-950 hover:text-gold transition-all shadow-sm" title="Copy Full Plan">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                 </div>

                 <div className="relative z-10 flex-1">
                    {renderBrief(briefText)}
                 </div>

                 <div className="mt-20 pt-12 border-t border-gold/10 text-center relative z-10">
                    <div className="inline-flex items-center gap-4 px-6 py-2 bg-white rounded-full border border-emerald-50">
                       <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                       <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-[0.3em]">Prepared by AMRAH Neural core</span>
                    </div>
                 </div>
              </div>
           ) : isGenerating ? (
              <div className="h-[600px] bg-white rounded-4xl border border-emerald-50 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                 <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                 <div className="text-center space-y-2">
                    <p className="text-[12px] font-bold uppercase text-gold tracking-[0.5em] animate-pulse">Consulting Photoshoot Assistant</p>
                    <p className="text-[9px] font-bold uppercase text-emerald-950/20 tracking-widest">Orchestrating production & generation cues...</p>
                 </div>
              </div>
           ) : error ? (
              <div className="h-[400px] bg-red-50 rounded-4xl border border-red-100 flex flex-col items-center justify-center space-y-4 text-center p-12">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                 <h4 className="text-xl font-serif text-red-950">Assistant Intervention</h4>
                 <p className="text-sm text-red-950/60 max-w-sm">{error}</p>
                 <button onClick={handleGenerate} className="px-8 py-3 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors">Retry Session</button>
              </div>
           ) : (
              <div className="h-[600px] bg-white rounded-4xl border border-emerald-50 border-dashed flex flex-col items-center justify-center space-y-6 text-center p-20 animate-in fade-in duration-1000">
                 <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-950/10">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-2xl font-serif text-emerald-950">Assistant is ready to help.</h4>
                    <p className="text-sm text-emerald-950/40 max-w-md font-light leading-relaxed">Submit your reference and vision to receive a simple photoshoot plan and an AI-ready generation brief.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PhotoshootPlanner;
