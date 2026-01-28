import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PhotoStudio from './components/PhotoStudio';
import Dashboard from './components/Dashboard';
import BrandKit from './components/BrandKit';
import Campaigns from './components/Campaigns';
import ModelShowcase from './components/ModelShowcase';
import CreateShoot from './components/CreateShoot';
import { GenerationResult, BrandKit as BrandKitType, ModelPersona, ProductCategory } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('studio');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [initialCategory, setInitialCategory] = useState<ProductCategory>('fashion');
  
  const [brandKit, setBrandKit] = useState<BrandKitType>(() => {
    const saved = localStorage.getItem('amrah_brand_dna');
    if (saved) return JSON.parse(saved);
    return {
      name: "Luxury Maison",
      primaryColor: "#022c22",
      secondaryColor: "#D4AF37",
      tone: 'Editorial',
      primaryFont: 'Playfair Display',
      secondaryFont: 'Inter',
      fontWeight: '500'
    };
  });

  const isBrandKitComplete = useMemo(() => !!(brandKit.name && brandKit.logoUrl), [brandKit]);

  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKeyStatus();
  }, []);

  const handleEnterApp = (tab: string = 'studio', category?: ProductCategory) => {
    setActiveTab(tab);
    if (category) setInitialCategory(category);
    setView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenKeySelection = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const addToHistory = (result: GenerationResult) => {
    setHistory(prev => [result, ...prev]);
  };

  if (view === 'landing') {
    return <Dashboard onEnterApp={handleEnterApp} />;
  }

  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-10 animate-in fade-in duration-500">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Security Protocol</span>
          <h1 className="text-5xl font-serif text-emerald-950 leading-tight">Maison Authorization</h1>
          <p className="text-emerald-950/40 max-w-md mx-auto italic font-light">To orchestrate high-fidelity assets and cinematic motion, please authorize with a Maison API Key.</p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] hover:underline block pt-4">View Billing Documentation</a>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className="px-16 py-6 bg-emerald-950 text-white rounded-full font-bold text-[12px] uppercase tracking-[0.4em] hover:bg-gold transition-all shadow-2xl"
        >
          Select Maison API Key
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FDFDFD] text-emerald-950" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header brandKit={brandKit} onLogoClick={() => setView('landing')} />
      
      {/* Sub Navigation */}
      <div className="bg-white border-b border-black/5 px-10 py-5 flex items-center justify-between">
        <div className="flex gap-16">
          {[
            { id: 'studio', label: 'Photo Studio' },
            { id: 'models', label: 'Editorial Talent' },
            { id: 'campaign', label: 'Campaigns' },
            { id: 'brand', label: 'Brand Kit' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${
                activeTab === item.id ? 'text-gold border-b border-gold pb-1' : 'text-emerald-950/40 hover:text-emerald-950'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
           <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-950 text-white' : 'bg-emerald-50 text-emerald-950/40 hover:bg-emerald-100'}`}>Archives</button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-12 scroll-smooth">
        {activeTab === 'studio' && <PhotoStudio brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} />}
        {activeTab === 'campaign' && <Campaigns brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} />}
        {activeTab === 'models' && <ModelShowcase onModelSelect={(m) => { setSelectedModel(m); setActiveTab('shoot'); }} selectedModelId={selectedModel?.id} personalModel={null} />}
        {activeTab === 'shoot' && (
          <CreateShoot 
            brandKit={brandKit} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            addToHistory={addToHistory} onGoBackToModels={() => setActiveTab('models')} initialCategory={initialCategory}
          />
        )}
        {activeTab === 'brand' && <BrandKit brandKit={brandKit} setBrandKit={setBrandKit} />}
        
        {activeTab === 'history' && (
          <div className="space-y-12 reveal active">
            <div className="flex items-end justify-between border-b border-black/5 pb-8">
              <h2 className="text-4xl font-serif text-emerald-950 tracking-tight">Archives</h2>
              <span className="text-emerald-950/40 text-[10px] font-bold uppercase tracking-[0.3em]">{history.length} Assets Secured</span>
            </div>
            {history.length === 0 ? (
              <div className="py-40 text-center space-y-6">
                <p className="text-emerald-950/20 text-[10px] uppercase tracking-[0.5em] font-bold">The archives are currently empty.</p>
                <button onClick={() => setActiveTab('studio')} className="text-gold text-[10px] uppercase tracking-widest font-bold underline underline-offset-8">Begin Session</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {history.map((item) => (
                  <div key={item.id} className="group space-y-4">
                    <div className="aspect-[4/3] bg-white border border-black/5 relative overflow-hidden rounded-[2.5rem] soft-shadow group-hover:scale-[1.02] transition-all">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={item.url} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex justify-between items-start px-2">
                      <p className="text-[9px] text-emerald-950/40 italic font-medium leading-relaxed max-w-[70%]">"{item.prompt}"</p>
                      <span className="text-[8px] text-gold font-bold uppercase tracking-widest bg-gold/5 px-3 py-1 rounded-full">{item.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;