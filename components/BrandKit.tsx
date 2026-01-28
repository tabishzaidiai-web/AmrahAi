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
    }, 800);
  };

  const tones: BrandKitType['tone'][] = ['Minimal', 'Opulent', 'Street', 'Classic', 'Editorial'];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h2 className="text-4xl font-serif text-emerald-950">Brand Kit</h2>
            <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest">Establish your visual signature.</p>
         </div>
         <div className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            Brand Kit: {isComplete ? 'Complete' : 'Incomplete'}
         </div>
      </div>

      <div className="bg-white rounded-4xl p-12 border border-emerald-50 soft-shadow space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Logo Upload</span>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-video bg-emerald-50/30 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer transition-all relative overflow-hidden ${brandKit.logoUrl ? 'border-transparent' : 'border-emerald-100 hover:border-gold/30'}`}
              >
                {brandKit.logoUrl ? (
                  <img src={brandKit.logoUrl} className="max-h-[70%] max-w-[70%] object-contain" alt="Logo" />
                ) : (
                  <div className="text-center space-y-2">
                    <span className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block">Upload Maison Logo</span>
                    <span className="text-[8px] text-emerald-950/20 font-bold uppercase">PNG or SVG</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setBrandKit({ ...brandKit, logoUrl: ev.target?.result as string }); r.readAsDataURL(f); } }} className="hidden" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Maison Name</label>
                <input type="text" value={brandKit.name} onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} placeholder="e.g. Al Noor Luxury" className="w-full text-base font-serif italic" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Primary Font</label>
                <input type="text" value={brandKit.primaryFont} onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} placeholder="e.g. Playfair Display" className="w-full text-xs" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Brand Palette</span>
              <div className="flex items-center gap-12">
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <input type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                      <span className="text-[10px] font-mono text-emerald-950/40 uppercase">{brandKit.primaryColor}</span>
                   </div>
                   <p className="text-[8px] text-emerald-950/30 font-bold uppercase">Primary</p>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <input type="color" value={brandKit.secondaryColor} onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })} className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                      <span className="text-[10px] font-mono text-emerald-950/40 uppercase">{brandKit.secondaryColor}</span>
                   </div>
                   <p className="text-[8px] text-emerald-950/30 font-bold uppercase">Secondary</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest">Visual Tone</span>
              <div className="flex flex-wrap gap-2">
                 {tones.map(t => (
                   <button key={t} onClick={() => setBrandKit({ ...brandKit, tone: t })} className={`px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${brandKit.tone === t ? 'bg-emerald-950 text-white shadow-lg' : 'bg-emerald-50 text-emerald-950/40 hover:bg-emerald-100'}`}>
                      {t}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-emerald-50 flex flex-col items-center space-y-6">
           {saveStatus === 'error' && <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Add at least a logo and Maison name to complete your Brand Kit.</p>}
           <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-16 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] transition-all ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-950 text-white hover:bg-gold shadow-2xl shadow-emerald-950/20'}`}
           >
             {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Kit Secured' : 'Save Brand Kit'}
           </button>
           <p className="text-[9px] text-emerald-950/30 font-bold uppercase tracking-widest italic">Your Brand Kit now powers all shoots in Photo Studio and Campaigns.</p>
        </div>
      </div>
    </div>
  );
};

export default BrandKit;