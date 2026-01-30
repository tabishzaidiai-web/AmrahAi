
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { BrandKit, GenerationResult, ProductDetails, ProductCategory, ProductAnalysis } from '../types';
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
  { id: 'hd', label: 'HD Story', width: 1280, height: 720 },
  { id: 'square', label: 'Square Post', width: 1080, height: 1080 },
  { id: 'custom', label: 'Custom size', width: 0, height: 0 }
];

interface CampaignSuiteProps {
  brandKit: BrandKit;
  addToHistory: (res: GenerationResult) => void;
  initialCategory?: ProductCategory;
}

const CampaignSuite: React.FC<CampaignSuiteProps> = ({ brandKit, addToHistory, initialCategory }) => {
  const [productImages, setProductImages] = useState<(string | null)[]>([null, null, null]);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [campaignStory, setCampaignStory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{label: string, prompt: string}[]>([]);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedSizeId, setSelectedSizeId] = useState('full-hero');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const selectedPreset = useMemo(() => sizePresets.find(p => p.id === selectedSizeId), [selectedSizeId]);
  const isCustom = selectedSizeId === 'custom';

  const currentWidth = isCustom ? customWidth : (selectedPreset?.width || 1920);
  const currentHeight = isCustom ? customHeight : (selectedPreset?.height || 1080);

  const previewAspectRatio = useMemo(() => {
    if (currentWidth && currentHeight) return currentWidth / currentHeight;
    return 16 / 9;
  }, [currentWidth, currentHeight]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      const newImages = [...productImages];
      newImages[index] = result;
      setProductImages(newImages);

      if (index === 0) {
        setIsAnalyzing(true);
        try {
          const base64 = result.split(',')[1];
          const [prodAnalysis, suggestions] = await Promise.all([
            GeminiService.analyzeProduct(base64, file.type, brandKit),
            GeminiService.suggestCampaignStories(base64, brandKit)
          ]);
          setAnalysis(prodAnalysis);
          setAiSuggestions(suggestions);
        } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!campaignStory || !productImages[0]) return;
    setGenerating(true);
    try {
      const finalPrompt = `${campaignStory}. Important: Keep the product identical to the reference photo. Do not alter any design details or colors.`;
      const url = await GeminiService.generateCampaignAsset(finalPrompt, productImages, brandKit, { 
        category: initialCategory || 'fashion', type: 'Clothing', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest', renderMode: 'product-only'
      }, '16:9', '2K');
      const newResult: GenerationResult = { id: Math.random().toString(36).substr(2, 9), type: 'image', url, prompt: campaignStory, timestamp: Date.now() };
      setResults(prev => [newResult, ...prev]);
      addToHistory(newResult);
    } catch (err: any) { alert(err.message); } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-8 pb-20 reveal active">
      {editingId && results.find(r => r.id === editingId) && (
        <ImageEditor 
          imageUrl={results.find(r => r.id === editingId)!.url} 
          brandKit={brandKit}
          analysis={analysis || { type: 'Campaign', brand: brandKit.name, material: 'Premium', colorPalette: [], features: [], visualFidelityKeys: [] }}
          onSave={(url) => { setResults(results.map(r => r.id === editingId ? {...r, url} : r)); setEditingId(null); }} 
          onCancel={() => setEditingId(null)} 
        />
      )}

      <div className="space-y-2">
         <h2 className="text-3xl font-serif text-[#111] font-medium">Campaign Orchestrator</h2>
         <p className="text-xs text-gray-500 font-light uppercase tracking-widest">Build narrative-driven marketing assets with your own brand DNA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6 soft-shadow space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1. Brand Asset Upload</span>
              <div onClick={() => !productImages[0] && fileInputRefs[0].current?.click()} className={`aspect-square rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${productImages[0] ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:border-gold/30'}`}>
                {isAnalyzing && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>}
                {productImages[0] ? <img src={productImages[0]} className="w-full h-full object-cover" alt="Primary" /> : <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Primary Image</span>}
                <input type="file" ref={fileInputRefs[0]} onChange={(e) => handleFileChange(e, 0)} className="hidden" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(idx => (
                  <div key={idx} onClick={() => !productImages[idx] && fileInputRefs[idx].current?.click()} className={`aspect-square rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${productImages[idx] ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:border-gold/30'}`}>
                    {productImages[idx] ? <img src={productImages[idx]!} className="w-full h-full object-cover" alt={`Angle ${idx}`} /> : <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Angle {idx}</span>}
                    <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(e, idx)} className="hidden" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 space-y-4">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Format Specification</label>
              <select value={selectedSizeId} onChange={(e) => setSelectedSizeId(e.target.value)} className="w-full px-4 py-2 text-xs">
                {sizePresets.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-8 soft-shadow space-y-8">
             <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Narrative Blueprint</span>
                <textarea 
                  value={campaignStory} 
                  onChange={(e) => setCampaignStory(e.target.value)} 
                  placeholder="Define the campaign setting, mood, and audience direction..." 
                  className="w-full bg-gray-50 border-none rounded-xl p-6 text-sm italic min-h-[200px] focus:ring-1 focus:ring-gold/20"
                />
                
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((s, idx) => (
                    <button key={idx} onClick={() => setCampaignStory(s.prompt)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[8px] font-bold text-gray-400 uppercase tracking-widest hover:border-gold hover:text-gold transition-all">
                      {s.label}
                    </button>
                  ))}
                </div>
             </div>

             <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={handleGenerate} 
                  disabled={generating || !campaignStory || !productImages[0]} 
                  className={`px-12 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${generating || !campaignStory || !productImages[0] ? 'bg-gray-100 text-gray-300' : 'bg-[#111] text-white hover:bg-gold shadow-lg shadow-black/10'}`}
                >
                  {generating ? 'Drafting Campaign...' : 'Generate Campaign Asset'}
                </button>
             </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-6 pt-10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Campaign Masterpieces</span>
          <div className="grid grid-cols-1 gap-12">
            {results.map((res) => (
              <div key={res.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden soft-shadow animate-in slide-in-from-bottom-4 duration-700">
                 <div className="p-4 md:p-8 flex items-center justify-center bg-gray-50/50">
                    <div 
                      className="relative overflow-hidden shadow-2xl transition-all duration-700 mx-auto rounded-lg"
                      style={{ aspectRatio: previewAspectRatio, width: '100%', maxWidth: '1000px' }}
                    >
                       <img src={res.url} className="w-full h-full object-cover" alt="Result" />
                       <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => setEditingId(res.id)} className="px-4 py-2 bg-white/90 backdrop-blur-sm text-[9px] font-bold uppercase rounded-lg shadow-lg hover:text-gold transition-colors">Refine DNA</button>
                       </div>
                    </div>
                 </div>
                 <div className="px-8 py-4 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 italic font-medium">"{res.prompt}"</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSuite;
