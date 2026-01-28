import React, { useRef, useMemo, useState } from 'react';
import { BrandKit } from '../types';

interface BrandMemoryProps {
  brandKit: BrandKit;
  setBrandKit: (kit: BrandKit) => void;
}

const BrandMemory: React.FC<BrandMemoryProps> = ({ brandKit, setBrandKit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const handleSaveDNA = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('amrah_brand_dna', JSON.stringify(brandKit));
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-12 pb-20 reveal active">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-[#111] font-medium">Maison Identity</h2>
        <p className="text-xs text-gray-500 font-light uppercase tracking-widest">Establish your visual signature and digital legacy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border border-gray-100 rounded-xl p-8 soft-shadow space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Brand Emblem</span>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-[16/6] bg-gray-50 border border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all relative overflow-hidden ${brandKit.logoUrl ? 'border-transparent' : 'border-gray-200 hover:border-gold/30'}`}
              >
                {brandKit.logoUrl ? (
                  <img src={brandKit.logoUrl} className="max-h-[80%] max-w-[80%] object-contain" alt="Logo" />
                ) : (
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Upload Maison Logo</span>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setBrandKit({ ...brandKit, logoUrl: ev.target?.result as string }); r.readAsDataURL(f); } }} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Maison Name</label>
                <input type="text" value={brandKit.name} onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} className="w-full px-4 py-2.5 text-xs font-serif italic text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Primary Font</label>
                <input type="text" value={brandKit.primaryFont} onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} className="w-full px-4 py-2.5 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Brand Palette</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer" />
                  <span className="text-[10px] font-mono text-gray-400 uppercase">{brandKit.primaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden soft-shadow flex flex-col h-full">
            <div className="flex-1 relative overflow-hidden">
               <img src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=90&w=1200" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-white/20" />
            </div>
            <div className="p-8 space-y-2">
               <h3 className="text-xl font-serif text-[#111]">Style Synthesis</h3>
               <p className="text-xs text-gray-500 font-light leading-relaxed">Your visuals will be automatically calibrated to match the refined aesthetic of your Maison DNA.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={handleSaveDNA}
          disabled={isSaving}
          className={`px-16 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#111] text-white hover:bg-gold shadow-lg shadow-black/10'}`}
        >
          {isSaving ? 'Synchronizing...' : saveStatus === 'success' ? 'Identity Secured' : 'Commit Maison DNA'}
        </button>
      </div>
    </div>
  );
};

export default BrandMemory;