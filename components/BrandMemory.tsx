
import React, { useRef, useMemo, useState } from 'react';
import { BrandKit } from '../types';

interface BrandMemoryProps {
  brandKit: BrandKit;
  setBrandKit: (kit: BrandKit) => void;
}

const BrandMemory: React.FC<BrandMemoryProps> = ({ brandKit, setBrandKit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const toneMetadata = useMemo(() => ({
    professional: { 
      label: 'Studio Minimal', 
      desc: 'Neutral, pure, standard catalog visuals. Optimized for e-commerce clarity.',
      preview: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=1200',
    },
    energetic: { 
      label: 'Dynamic Luxe', 
      desc: 'Vibrant, contrast editorial narratives for a bold market presence.',
      preview: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200',
    },
    minimal: { 
      label: 'Pure Essence', 
      desc: 'Architectural, airy, soft shadows. The height of understated elegance.',
      preview: 'https://images.unsplash.com/photo-1539109132382-3bf1551874e9?auto=format&fit=crop&q=80&w=1200',
    },
    luxury: { 
      label: 'Bespoke Arabian', 
      desc: 'Sophisticated shadows, rich textures, golden hour. Heritage-focused opulence.',
      preview: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=90&w=1200',
    }
  }), []);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBrandKit({ ...brandKit, logoUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file input click
    setBrandKit({ ...brandKit, logoUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveDNA = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('amrah_brand_dna', JSON.stringify(brandKit));
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1200);
  };

  const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="space-y-4">
      <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-[0.4em] mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full border-4 border-white soft-shadow cursor-pointer relative"
          style={{ backgroundColor: value }}
        >
          <input 
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-[#1A1A1A] tracking-widest uppercase">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-16 max-w-5xl pb-24 reveal active">
      <div className="space-y-4 text-center md:text-left">
        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Identity Control</span>
        <h2 className="text-5xl md:text-6xl font-serif text-[#1A1A1A] tracking-tight leading-tight">Maison DNA</h2>
        <p className="text-[#666] font-light text-xl italic max-w-2xl leading-relaxed mx-auto md:mx-0">
          Establish your digital heritage. Persist your brand signature across all engine outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-12">
          
          {/* Logo Section */}
          <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 soft-shadow">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-6 block">Maison Emblem</span>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-[16/7] bg-[#F9F9F9] border-2 border-dashed rounded-[40px] flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                isDragging ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-zinc-100 hover:border-[#D4AF37]/40'
              }`}
            >
              {brandKit.logoUrl ? (
                <div className="relative h-full w-full flex items-center justify-center p-12">
                  <img src={brandKit.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={removeLogo}
                      className="px-6 py-2 bg-white rounded-xl text-[9px] font-bold uppercase tracking-widest text-red-500 shadow-xl hover:bg-red-50 transition-colors"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-[#D4AF37] shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Drag and drop or</span>
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest underline decoration-dotted">Browse Files</span>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            {brandKit.logoUrl && <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mt-4 text-center animate-pulse">Brand logo active</p>}
          </div>

          {/* Typeface & Name */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Maison Name</label>
                <input 
                  type="text"
                  value={brandKit.name}
                  onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })}
                  className="w-full bg-white border border-black/[0.05] rounded-2xl px-6 py-4 text-[#1A1A1A] font-serif italic text-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Primary Font</label>
                <input 
                  type="text"
                  value={brandKit.primaryFont}
                  onChange={(e) => setBrandKit({ ...brandKit, primaryFont: e.target.value })}
                  className="w-full bg-white border border-black/[0.05] rounded-2xl px-6 py-4 text-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                  placeholder="e.g. Playfair Display"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ColorPicker label="Primary Palette" value={brandKit.primaryColor} onChange={(hex) => setBrandKit({ ...brandKit, primaryColor: hex })} />
              <ColorPicker label="Secondary Palette" value={brandKit.secondaryColor} onChange={(hex) => setBrandKit({ ...brandKit, secondaryColor: hex })} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.3em] block">Visual Archetype</span>
          <div className="aspect-[4/5] rounded-[60px] overflow-hidden border border-black/[0.05] bg-white soft-shadow relative group">
            <img src={toneMetadata[brandKit.tone].preview} className="w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110" alt="Preview" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 space-y-2">
              <h3 className="text-3xl font-serif italic text-white leading-none">{toneMetadata[brandKit.tone].label}</h3>
              <p className="text-[10px] text-white/50 font-light leading-relaxed">{toneMetadata[brandKit.tone].desc}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(toneMetadata) as Array<keyof typeof toneMetadata>).map((tone) => (
              <button
                key={tone}
                onClick={() => setBrandKit({ ...brandKit, tone })}
                className={`p-6 rounded-[32px] border transition-all text-left group ${
                  brandKit.tone === tone ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-zinc-500 border-black/[0.05] hover:border-zinc-200'
                }`}
              >
                <p className="text-xs font-serif italic group-hover:translate-x-1 transition-transform">{toneMetadata[tone].label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-16 border-t border-black/[0.05] flex justify-center">
        <button 
          onClick={handleSaveDNA}
          disabled={isSaving}
          className={`px-24 py-6 rounded-[32px] text-[11px] font-bold uppercase tracking-[0.5em] transition-all shadow-xl hover:shadow-2xl active:scale-95 ${
            saveStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:scale-105'
          }`}
        >
          {isSaving ? 'Synchronizing DNA...' : saveStatus === 'success' ? 'Brand DNA Secured' : 'Save Brand DNA'}
        </button>
      </div>
    </div>
  );
};

export default BrandMemory;
