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

  return (
    <div className="space-y-16 pb-20 animate-lux-in">
      <div className="space-y-2 border-b border-gray-100 pb-8">
        <h2 className="text-4xl font-serif text-black italic">Maison DNA Memory</h2>
        <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.3em]">Commit your brand identity to our neural visual legacy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-12">
          <div className="bg-white rounded-[3rem] p-12 border border-gray-50 soft-shadow space-y-12">
            <div className="space-y-6">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest block ml-2">Brand Emblem</span>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-32 h-32 bg-maison-bg border-2 border-dashed rounded-[2rem] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${brandKit.logoUrl ? 'border-transparent shadow-xl' : 'border-gray-100 hover:border-gold/30'}`}
                >
                  {brandKit.logoUrl ? (
                    <img src={brandKit.logoUrl} className="max-h-[80%] max-w-[80%] object-contain" alt="Logo" />
                  ) : (
                    <div className="text-center text-black/10 italic text-[8px] font-bold uppercase tracking-widest">Logo</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold uppercase tracking-widest">Update</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-xs text-black/40 font-serif italic leading-relaxed">
                    Upload your high-resolution emblem. The neural core will automatically lock logo placement and color grading across all campaign assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-50">
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-2">Official Name</label>
                <input type="text" value={brandKit.name} onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} className="w-full bg-maison-bg border-none px-6 py-4 rounded-2xl text-base font-serif italic" placeholder="Maison Heritage" />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-2">Typographic Face</label>
                <input type="text" value={brandKit.primaryFont} onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} className="w-full bg-maison-bg border-none px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest" placeholder="Playfair Display" />
              </div>
            </div>

            <div className="pt-10 border-t border-gray-50 space-y-6">
              <label className="text-[9px] font-bold text-black/30 uppercase tracking-widest block ml-2">Color Synchronization</label>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 bg-maison-bg p-2 rounded-2xl pr-6 border border-gray-100">
                  <input type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" />
                  <span className="text-[9px] font-mono text-black/30 uppercase">{brandKit.primaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center">
           <div className="bg-white rounded-[3rem] p-12 border border-gray-100 soft-shadow space-y-8 text-center animate-lux-in">
              <div className="space-y-4">
                 <h3 className="text-3xl font-serif text-black italic">Commit Identity</h3>
                 <p className="text-sm text-black/40 font-light leading-relaxed">Securing your Brand DNA ensures consistent fidelity across every Studio session and Campaign suite.</p>
              </div>
              <button 
                onClick={handleSaveDNA}
                disabled={isSaving}
                className={`w-full py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl ${
                  saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-gold text-white hover:scale-[1.02]'
                }`}
              >
                {isSaving ? 'Synchronizing...' : saveStatus === 'success' ? 'Identity Secured' : 'Save Brand DNA'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BrandMemory;