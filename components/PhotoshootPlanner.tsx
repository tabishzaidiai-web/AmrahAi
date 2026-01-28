
import React, { useState, useRef } from 'react';
import { BrandKit, LuxuryPhotoshootConfig } from '../types';
import { GeminiService } from '../services/geminiService';
import MediaAsset from './MediaAsset';

interface PhotoshootPlannerProps {
  brandKit: BrandKit;
}

const PhotoshootPlanner: React.FC<PhotoshootPlannerProps> = ({ brandKit }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [userBrief, setUserBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<LuxuryPhotoshootConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProductImage(ev.target?.result as string);
      setConfig(null);
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
      const res = await GeminiService.generateLuxuryPhotoshootConfig(
        base64, 
        'image/png', 
        userBrief
      );
      setConfig(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert("JSON Config copied to clipboard.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-end justify-between border-b border-black/5 pb-8">
         <div className="space-y-1">
            <h2 className="text-4xl font-serif text-emerald-950">Photoshoot Planner</h2>
            <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.4em]">Structured JSON Orchestration for Production.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">01. Master Asset</span>
                    {productImage && <button onClick={() => {setProductImage(null); setConfig(null);}} className="text-[8px] font-bold text-gold uppercase tracking-widest">Replace</button>}
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
                 <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">02. Design Brief</span>
                 <textarea 
                  value={userBrief} 
                  onChange={(e) => setUserBrief(e.target.value)} 
                  placeholder="Optional brief (e.g. '3-shot sequence focusing on material texture and model elegance')..." 
                  className="w-full bg-emerald-50/20 border-emerald-50 rounded-3xl p-6 text-xs italic min-h-[120px] focus:ring-1 focus:ring-gold/20 outline-none"
                 />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!productImage || isGenerating}
                className={`w-full py-5 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] transition-all ${!productImage || isGenerating ? 'bg-emerald-50 text-emerald-100 cursor-not-allowed' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl active:scale-95 shadow-emerald-950/20'}`}
              >
                {isGenerating ? 'Synthesizing Planner...' : 'Generate Luxury JSON'}
              </button>
           </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 space-y-10">
           {config ? (
              <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                 {/* Summary Card */}
                 <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow flex flex-col md:flex-row gap-10 items-start">
                    <div className="w-full md:w-1/3 aspect-[3/4] rounded-3xl overflow-hidden bg-emerald-50">
                       <MediaAsset src={productImage!} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-6">
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Neural Analysis</span>
                          <h3 className="text-3xl font-serif text-emerald-950">{config.shootStyle}</h3>
                       </div>
                       <div className="grid grid-cols-2 gap-6 pt-4 border-t border-emerald-50">
                          <div>
                             <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Type</span>
                             <span className="text-xs font-medium text-emerald-950 uppercase tracking-wider">{config.productSummary.type}</span>
                          </div>
                          <div>
                             <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Materials</span>
                             <span className="text-xs font-medium text-emerald-950 uppercase tracking-wider">{config.productSummary.materials}</span>
                          </div>
                          <div className="col-span-2">
                             <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest block">Key Details</span>
                             <span className="text-xs italic text-emerald-950/60 leading-relaxed">{config.productSummary.keyDetails}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* JSON Viewer */}
                 <div className="bg-emerald-950 rounded-4xl p-10 border border-white/10 soft-shadow relative group">
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Maison Shoot Config</span>
                       <button onClick={copyToClipboard} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">Copy Config</button>
                    </div>
                    <pre className="text-emerald-50/70 font-mono text-[11px] leading-relaxed overflow-x-auto p-6 bg-black/20 rounded-2xl border border-white/5 custom-scrollbar">
                       {JSON.stringify(config, null, 2)}
                    </pre>
                 </div>

                 {/* Shot Breakdown */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {config.shots.map((shot, i) => (
                       <div key={shot.id} className="bg-white rounded-[2.5rem] p-8 border border-emerald-50 soft-shadow space-y-4">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Shot {i+1}: {shot.id}</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="space-y-3">
                             <h4 className="text-sm font-serif italic text-emerald-950">{shot.notes}</h4>
                             <div className="grid grid-cols-2 gap-4 text-[9px] font-bold uppercase tracking-widest pt-2 border-t border-emerald-50">
                                <div className="text-emerald-950/40">Angle: <span className="text-emerald-950">{shot.angle}</span></div>
                                <div className="text-emerald-950/40">Lighting: <span className="text-emerald-950">{shot.lighting}</span></div>
                                <div className="text-emerald-950/40">Framing: <span className="text-emerald-950">{shot.cameraFraming}</span></div>
                                <div className="text-emerald-950/40">Talent: <span className="text-emerald-950">{shot.modelUsage}</span></div>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ) : isGenerating ? (
              <div className="h-[600px] bg-white rounded-4xl border border-emerald-50 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                 <div className="w-20 h-20 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                 <div className="text-center space-y-2">
                    <p className="text-[12px] font-bold uppercase text-gold tracking-[0.5em] animate-pulse">Orchestrating Planner</p>
                    <p className="text-[9px] font-bold uppercase text-emerald-950/20 tracking-widest">Generating structured high-fidelity JSON...</p>
                 </div>
              </div>
           ) : error ? (
              <div className="h-[400px] bg-red-50 rounded-4xl border border-red-100 flex flex-col items-center justify-center space-y-4 text-center p-12">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                 <h4 className="text-xl font-serif text-red-950">Planner Disruption</h4>
                 <p className="text-sm text-red-950/60 max-w-sm">{error}</p>
                 <button onClick={handleGenerate} className="px-8 py-3 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors">Retry Sync</button>
              </div>
           ) : (
              <div className="h-[600px] bg-white rounded-4xl border border-emerald-50 border-dashed flex flex-col items-center justify-center space-y-6 text-center p-20 animate-in fade-in duration-1000">
                 <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-950/10">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-2xl font-serif text-emerald-950">The Planner awaits your DNA.</h4>
                    <p className="text-sm text-emerald-950/40 max-w-md font-light leading-relaxed">Upload a product asset to generate a structured, JSON-based photoshoot plan calibrated for high-end editorial production.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PhotoshootPlanner;
