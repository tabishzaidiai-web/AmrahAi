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
    <div className="space-y-12 pb-20 reveal active animate-in fade-in duration-700">
      <div className="space-y-2 border-b border-black/5 pb-8">
        <h2 className="text-4xl font-serif text-[#111] font-medium tracking-tight">Maison Identity</h2>
        <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.3em]">Establish your visual signature and digital legacy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-10">
            {/* Logo Upload Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest block">Brand Emblem</span>
                {brandKit.logoUrl && (
                  <button 
                    onClick={() => setBrandKit({ ...brandKit, logoUrl: undefined })}
                    className="text-[8px] font-bold text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-32 h-32 bg-emerald-50/30 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${brandKit.logoUrl ? 'border-transparent shadow-xl' : 'border-emerald-100 hover:border-gold/30'}`}
                >
                  {brandKit.logoUrl ? (
                    <img src={brandKit.logoUrl} className="max-h-[80%] max-w-[80%] object-contain" alt="Logo Preview" />
                  ) : (
                    <div className="text-center text-emerald-950/20">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[7px] font-bold uppercase tracking-widest">No Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold uppercase tracking-widest">Update</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-xs text-emerald-950/60 font-light leading-relaxed italic">
                    Upload your Maison emblem in high resolution. Supported formats: PNG, SVG, JPG. Transparent backgrounds are highly recommended for neural injection.
                  </p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-emerald-950 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-gold transition-all shadow-lg shadow-emerald-950/10"
                  >
                    Select Logo File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-emerald-50">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Maison Official Name</label>
                <input 
                  type="text" 
                  value={brandKit.name} 
                  onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })} 
                  className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-base font-serif italic focus:bg-white transition-all" 
                  placeholder="e.g. Al Noor Luxury"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2">Primary Typographic Face</label>
                <input 
                  type="text" 
                  value={brandKit.primaryFont} 
                  onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })} 
                  className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:bg-white transition-all" 
                  placeholder="e.g. Playfair Display"
                />
              </div>
            </div>

            <div className="pt-10 border-t border-emerald-50">
              <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest block ml-2 mb-4">Brand Palette Swatch</label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-emerald-50/30 p-2.5 rounded-2xl pr-6 border border-emerald-50">
                  <input 
                    type="color" 
                    value={brandKit.primaryColor} 
                    onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })} 
                    className="w-12 h-12 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden" 
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest">Primary Color</span>
                    <span className="text-[10px] font-mono text-emerald-950 uppercase tracking-tighter">{brandKit.primaryColor}</span>
                  </div>
                </div>
                <div className="text-xs text-emerald-950/30 italic font-light">
                  This color guides the mood and accents of generated campaign assets.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-4xl border border-emerald-50 overflow-hidden soft-shadow flex flex-col h-full group">
            <div className="flex-1 relative overflow-hidden bg-emerald-900">
               <img 
                 src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=90&w=1200" 
                 className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2000ms]" 
                 alt="Brand Vibe"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent" />
               <div className="absolute bottom-10 left-10 right-10 space-y-2">
                 <span className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Visual Signature</span>
                 <h3 className="text-3xl font-serif text-white italic">Heritage Synthesis</h3>
               </div>
            </div>
            <div className="p-10 space-y-4">
               <p className="text-sm text-emerald-950/60 font-light leading-relaxed">
                 Your visuals will be automatically calibrated to match the refined aesthetic of your Maison DNA. 
                 By securing your identity here, the AI model prioritizes your specific branding across all studios.
               </p>
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                 <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest">Global Brand Consistency Guaranteed</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={handleSaveDNA}
          disabled={isSaving}
          className={`px-24 py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.5em] transition-all shadow-2xl ${
            saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-950 text-white hover:bg-gold hover:scale-105 shadow-emerald-950/20 active:scale-95'
          } btn-luxury`}
        >
          {isSaving ? 'Synchronizing Sessions...' : saveStatus === 'success' ? 'Identity Secured' : 'Commit Maison DNA'}
        </button>
      </div>
    </div>
  );
};

export default BrandMemory;