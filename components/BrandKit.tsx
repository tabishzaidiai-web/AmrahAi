
import React, { useRef, useState, useMemo } from 'react';
import { BrandKit as BrandKitType } from '../types';

interface BrandKitProps {
  brandKit: BrandKitType;
  setBrandKit: (kit: BrandKitType) => void;
}

const BrandKit: React.FC<BrandKitProps> = ({ brandKit, setBrandKit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isComplete = useMemo(() => {
    return brandKit.name && brandKit.logoUrl && brandKit.primaryColor;
  }, [brandKit]);

  const handleSave = () => {
    if (!brandKit.name || !brandKit.logoUrl) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('amrah_brand_dna', JSON.stringify(brandKit));
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1200);
  };

  const tones: BrandKitType['tone'][] = ['Minimal', 'Opulent', 'Street', 'Classic', 'Editorial'];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-black/5 pb-8">
         <div className="space-y-1">
            <h2 className="text-4xl font-serif text-emerald-950">Maison Brand Kit</h2>
            <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.3em]">The foundational DNA for all neural visual intelligence.</p>
         </div>
         <div className={`px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-3 ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            Maison ID Status: {isComplete ? 'Secured' : 'Awaiting Details'}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow text-center space-y-8">
              <div className="space-y-4">
                 <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`mx-auto w-40 h-40 bg-emerald-50/30 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${brandKit.logoUrl ? 'border-transparent shadow-xl' : 'border-emerald-100 hover:border-gold/30'}`}
                 >
                   {brandKit.logoUrl ? (
                     <img src={brandKit.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" />
                   ) : (
                     <span className="text-[9px] font-bold text-emerald-950/20 uppercase tracking-widest">Logo</span>
                   )}
                   <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold uppercase tracking-widest">Change</span>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setBrandKit({ ...brandKit, logoUrl: ev.target?.result as string }); r.readAsDataURL(f); } }} className="hidden" />
                 </div>
                 <h3 className="text-2xl font-serif italic text-emerald-950">{brandKit.name || 'Maison Name'}</h3>
              </div>
              
              <div className="pt-8 border-t border-emerald-50 flex items-center justify-center gap-6">
                 <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: brandKit.primaryColor }} />
                 <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: brandKit.secondaryColor }} />
                 <div className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">{brandKit.tone}</div>
              </div>
           </div>
        </div>

        {/* Configuration Fields */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Maison Official Name</label>
                  <input type="text" value={brandKit.name} onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} placeholder="e.g. Al Noor Luxury" className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-base font-serif italic" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Primary Typographic Face</label>
                  <input type="text" value={brandKit.primaryFont} onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} placeholder="e.g. Playfair Display" className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Neural Visual Tone</span>
                  <div className="flex flex-wrap gap-2">
                    {tones.map(t => (
                      <button key={t} onClick={() => setBrandKit({ ...brandKit, tone: t })} className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${brandKit.tone === t ? 'bg-emerald-950 text-white shadow-lg' : 'bg-emerald-50 text-emerald-950/30 hover:bg-emerald-100'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Maison Palette Swatches</span>
                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4 bg-emerald-50/30 p-2 rounded-2xl pr-4 border border-emerald-50">
                      <input type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                      <span className="text-[9px] font-mono text-emerald-950/40 uppercase tracking-tighter">Primary</span>
                    </div>
                    <div className="flex items-center gap-4 bg-emerald-50/30 p-2 rounded-2xl pr-4 border border-emerald-50">
                      <input type="color" value={brandKit.secondaryColor} onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                      <span className="text-[9px] font-mono text-emerald-950/40 uppercase tracking-tighter">Secondary</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-emerald-50 flex flex-col items-center space-y-6 text-center">
               {saveStatus === 'error' && <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.2em] animate-bounce">A Logo and Maison name are required to synchronize DNA.</p>}
               {saveStatus === 'success' && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em]">Brand Identity synchronized successfully.</p>}
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-20 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.5em] transition-all shadow-2xl ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-950 text-white hover:bg-gold hover:scale-105 shadow-emerald-950/20'} btn-luxury`}
               >
                 {isSaving ? 'Synchronizing Sessions...' : saveStatus === 'success' ? 'DNA Secured' : 'Commit Maison Identity'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandKit;
