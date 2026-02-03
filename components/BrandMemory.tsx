import React, { useRef, useState } from 'react';
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
    // Persist brand settings to localStorage for local-first reliability
    setTimeout(() => {
      localStorage.setItem('amrah_brand_dna', JSON.stringify(brandKit));
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBrandKit({
          ...brandKit,
          logoUrl: ev.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const tones: BrandKit['tone'][] = ['Minimal', 'Opulent', 'Street', 'Classic', 'Editorial'];

  return (
    <div className="space-y-16 pb-20 animate-lux-in">
      <div className="space-y-2 border-b border-gray-100 pb-8">
        <h2 className="text-4xl font-serif text-emerald-950 italic">Maison DNA Memory</h2>
        <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.3em]">Commit your brand identity to our neural visual legacy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Identity Inputs */}
        <div className="lg:col-span-7 space-y-12">
          <div className="bg-white rounded-[3rem] p-12 border border-gray-50 shadow-sm space-y-12">
            
            {/* Logo area: Single instance with drag-and-drop feel */}
            <div className="space-y-6">
              <span className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Brand Emblem</span>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-40 h-40 bg-gray-50 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${brandKit.logoUrl ? 'border-transparent shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}
                >
                  {brandKit.logoUrl ? (
                    <img src={brandKit.logoUrl} className="max-h-[70%] max-w-[70%] object-contain" alt="Logo" />
                  ) : (
                    <div className="text-center text-emerald-950/10 flex flex-col items-center">
                       <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                       <span className="text-[7px] font-bold uppercase tracking-widest">Upload Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold uppercase tracking-widest">Replace Asset</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                <div className="flex-1 space-y-4">
                  <h4 className="text-lg font-serif italic text-emerald-950">Neural Asset Lock</h4>
                  <p className="text-xs text-emerald-950/40 font-serif italic leading-relaxed">
                    Once uploaded, our AI twin identifies logo geometry for pixel-perfect placement on generated apparel, timepieces, and accessories.
                  </p>
                </div>
              </div>
            </div>

            {/* General Settings: Name & Typography */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-50">
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Maison Official Name</label>
                <input 
                  type="text" 
                  value={brandKit.name} 
                  onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} 
                  className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-base font-serif italic focus:ring-1 focus:ring-gold outline-none transition-all" 
                  placeholder="e.g., Al Noor Luxury" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Primary Typography Face</label>
                <input 
                  type="text" 
                  value={brandKit.primaryFont} 
                  onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} 
                  className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-gold outline-none transition-all" 
                  placeholder="e.g., Playfair Display" 
                />
              </div>
            </div>

            {/* Colors & Visual Tone */}
            <div className="pt-10 border-t border-gray-50 space-y-10">
              <div className="space-y-6">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Maison Palette Picker</label>
                <div className="flex flex-wrap items-center gap-10">
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl pr-6 border border-gray-100">
                    <input type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                    <span className="text-[9px] font-mono text-emerald-950/30 uppercase">Primary</span>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl pr-6 border border-gray-100">
                    <input type="color" value={brandKit.secondaryColor} onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })} className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                    <span className="text-[9px] font-mono text-emerald-950/30 uppercase">Secondary</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest block ml-2">Neural Visual Tone</label>
                <div className="flex flex-wrap gap-3">
                  {tones.map(t => (
                    <button
                      key={t}
                      onClick={() => setBrandKit({ ...brandKit, tone: t })}
                      className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${
                        brandKit.tone === t ? 'bg-emerald-950 text-white shadow-lg' : 'bg-gray-50 text-emerald-950/30 hover:bg-gray-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-5 flex flex-col justify-start">
           <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm space-y-8 text-center sticky top-32">
              <div className="space-y-4">
                 <h3 className="text-3xl font-serif text-emerald-950 italic">Commit Identity</h3>
                 <p className="text-sm text-emerald-950/40 font-light leading-relaxed">Saving your Maison DNA ensures absolute consistency across all neural render sessions and video synthesis flows.</p>
              </div>
              <button 
                onClick={handleSaveDNA}
                disabled={isSaving}
                className={`w-full py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl active:scale-[0.98] ${
                  saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-gold text-white hover:bg-gold-hover'
                }`}
              >
                {isSaving ? 'Synchronizing...' : saveStatus === 'success' ? 'DNA Secured' : 'Commit Brand DNA'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BrandMemory;