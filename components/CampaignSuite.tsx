
import React, { useState, useRef, useMemo } from 'react';
import { BrandKit, GenerationResult, ProductDetails, ProductCategory } from '../types';
import { GeminiService } from '../services/geminiService';
import ImageEditor from './ImageEditor';

interface BannerSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

const sizePresets: BannerSizePreset[] = [
  { id: 'full-hero', label: 'Full hero', width: 1920, height: 1080 },
  { id: 'wide-hero', label: 'Wide hero', width: 1920, height: 600 },
  { id: 'hero-strip', label: 'Hero strip', width: 1600, height: 500 },
  { id: 'hd', label: 'HD', width: 1280, height: 720 },
  { id: 'header', label: 'Header', width: 1024, height: 300 },
  { id: 'leaderboard', label: 'Leaderboard', width: 728, height: 90 },
  { id: 'med-rect', label: 'Medium rectangle', width: 300, height: 250 },
  { id: 'skyscraper', label: 'Skyscraper', width: 160, height: 600 },
  { id: 'custom', label: 'Custom size', width: 0, height: 0 }
];

interface CampaignSuiteProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
}

const CampaignSuite: React.FC<CampaignSuiteProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [campaignStory, setCampaignStory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Size Config State
  const [selectedSizeId, setSelectedSizeId] = useState('full-hero');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset = useMemo(() => sizePresets.find(p => p.id === selectedSizeId), [selectedSizeId]);
  const isCustom = selectedSizeId === 'custom';

  const currentWidth = isCustom ? customWidth : (selectedPreset?.width || 1920);
  const currentHeight = isCustom ? customHeight : (selectedPreset?.height || 1080);

  // Preview Aspect Ratio calculation
  const previewAspectRatio = useMemo(() => {
    if (currentWidth && currentHeight) return currentWidth / currentHeight;
    return 16 / 9;
  }, [currentWidth, currentHeight]);

  const storyPresets = [
    { label: "Lookbook Shoot", prompt: "A minimalist lookbook collection featuring your hero product in a sun-drenched architectural villa, focused on fabric texture and silhouette." },
    { label: "Jewelry Macro", prompt: "An intimate macro close-up of the jewel, dramatically lit with deep shadows and prismatic reflections, set against charcoal velvet." },
    { label: "Abaya Editorial", prompt: "A sophisticated abaya campaign set against the Dubai skyline at twilight, capturing the flow of the garment in a desert breeze." }
  ];

  const handleGenerate = async () => {
    if (!campaignStory || !productImage) return alert("Please upload a hero product and define your campaign story.");
    setGenerating(true);
    try {
      const url = await GeminiService.generateCampaignAsset(campaignStory, productImage, brandKit, { category: 'fashion', type: 'Clothing', approxSize: '', placement: 'Full body', addLogo: false, logoPlacement: 'Chest' }, '16:9', '2K');
      const newResult: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignStory, timestamp: Date.now() };
      setResults(prev => [newResult, ...prev]);
      addToHistory(newResult);
    } catch (err: any) {
      alert(`Campaign failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-16 reveal active pb-20">
      {editingId && results.find(r => r.id === editingId) && (
        <ImageEditor 
          imageUrl={results.find(r => r.id === editingId)!.url} 
          brandKit={brandKit}
          analysis={{ type: 'Campaign', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }}
          onSave={(url) => { setResults(results.map(r => r.id === editingId ? {...r, url} : r)); setEditingId(null); }} 
          onCancel={() => setEditingId(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
           <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Campaign Suite</span>
           <h2 className="text-4xl font-serif text-[#1A1A1A]">Narrative Orchestration</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Step 1: Banner Configuration & Upload */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-black/[0.05] rounded-[48px] p-8 soft-shadow space-y-10">
             <div className="space-y-4">
               <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Step 1: Hero Product</h4>
               <div onClick={() => fileInputRef.current?.click()} className={`aspect-square rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${productImage ? 'border-transparent bg-[#F9F9F9]' : 'border-zinc-100 hover:border-[#D4AF37]/30'}`}>
                  {productImage ? <img src={productImage} className="w-full h-full object-cover" alt="Hero Product" /> : <div className="text-center p-6 space-y-2 text-zinc-300 font-bold uppercase text-[9px] tracking-widest">Upload hero product</div>}
                  <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload=(ev)=>setProductImage(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
               </div>
             </div>
             
             {/* Banner Size Config Panel */}
             <div className="space-y-6 pt-4 border-t border-black/[0.04]">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Banner size config</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Select size</label>
                    <select 
                      value={selectedSizeId}
                      onChange={(e) => setSelectedSizeId(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#D4AF37]"
                    >
                      {sizePresets.map(size => (
                        <option key={size.id} value={size.id}>{size.label} {size.width > 0 ? `(${size.width}x${size.height})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Width (px)</label>
                      <input 
                        type="number" 
                        value={currentWidth} 
                        readOnly={!isCustom}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                        className={`w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-4 py-3 text-[10px] font-bold focus:outline-none ${!isCustom ? 'opacity-50' : 'focus:border-[#D4AF37]'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Height (px)</label>
                      <input 
                        type="number" 
                        value={currentHeight} 
                        readOnly={!isCustom}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                        className={`w-full bg-zinc-50 border border-black/[0.05] rounded-xl px-4 py-3 text-[10px] font-bold focus:outline-none ${!isCustom ? 'opacity-50' : 'focus:border-[#D4AF37]'}`}
                      />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Step 2: Campaign Narrative */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          <div className="bg-white border border-black/[0.05] rounded-[48px] p-10 soft-shadow flex flex-col flex-1 space-y-10">
             <div className="space-y-6 flex-1">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Step 2: Campaign Story</h4>
                <textarea 
                  value={campaignStory} 
                  onChange={(e) => setCampaignStory(e.target.value)} 
                  placeholder="Describe the campaign atmosphere..." 
                  className="w-full bg-[#F9F9F9] border-none rounded-[40px] p-10 text-[#1A1A1A] text-2xl focus:outline-none min-h-[300px] font-serif italic resize-none" 
                />
                
                <div className="flex flex-wrap gap-4">
                   {storyPresets.map(p => (
                      <button key={p.label} onClick={() => setCampaignStory(p.prompt)} className="px-6 py-3 bg-zinc-50 border border-black/[0.04] rounded-full text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">
                        {p.label}
                      </button>
                   ))}
                </div>
             </div>

             <div className="pt-8 flex justify-end">
                <button 
                  onClick={handleGenerate} 
                  disabled={generating || !campaignStory || !productImage} 
                  className={`px-16 py-8 rounded-[40px] font-bold text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl ${generating || !campaignStory || !productImage ? 'bg-zinc-100 text-zinc-300' : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:scale-105'}`}
                >
                  {generating ? 'Drafting Storyboards...' : 'Execute Campaign Assets'}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Campaign Result View */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-12 pt-12">
          {results.map((res) => (
            <div key={res.id} className="group bg-white border border-black/[0.05] rounded-[48px] overflow-hidden soft-shadow flex flex-col">
               <div className="p-10 bg-zinc-50 flex items-center justify-center">
                  <div 
                    className="relative overflow-hidden bg-[#F9F9F9] shadow-2xl transition-all duration-700 mx-auto"
                    style={{ 
                      aspectRatio: previewAspectRatio,
                      width: '100%',
                      maxWidth: '1200px'
                    }}
                  >
                     <img src={res.url} className="w-full h-full object-cover" alt="Campaign Result" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={() => setEditingId(res.id)} className="px-8 py-3 bg-white text-black font-bold rounded-2xl text-[9px] uppercase tracking-widest hover:scale-105 transition-all">Refine Asset</button>
                        <button onClick={() => { const l=document.createElement('a'); l.href=res.url; l.download=`amrah-campaign-${res.id}.png`; l.click(); }} className="px-8 py-3 bg-[#D4AF37] text-white font-bold rounded-2xl text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Export Asset</button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignSuite;
