
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Studio from './components/Studio';
import Dashboard from './components/Dashboard';
import BrandMemory from './components/BrandMemory';
import CampaignSuite from './components/CampaignSuite';
import ModelShowcase from './components/ModelShowcase';
import CreateShoot from './components/CreateShoot';
import PersonalModel from './components/PersonalModel';
import { GenerationResult, BrandKit, ModelPersona, PersonalModelConfig, ProductCategory } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [initialCategory, setInitialCategory] = useState<ProductCategory>('other');
  const [personalModel, setPersonalModel] = useState<PersonalModelConfig | null>(() => {
    const saved = localStorage.getItem('amrah_personal_model');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [brandKit, setBrandKit] = useState<BrandKit>(() => {
    const saved = localStorage.getItem('amrah_brand_dna');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved brand DNA", e);
      }
    }
    return {
      name: "Luxury Maison",
      primaryColor: "#D4AF37",
      secondaryColor: "#1A1A1A",
      tone: 'luxury',
      primaryFont: 'Playfair Display',
      secondaryFont: 'Inter',
      fontWeight: '500'
    };
  });

  // Check API Key selection status for mandatory requirements of premium models
  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore - aistudio is globally provided by the environment
      if (window.aistudio) {
        // @ts-ignore - aistudio is globally provided by the environment
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenKeySelection = async () => {
    // @ts-ignore - aistudio is globally provided by the environment
    if (window.aistudio) {
      // @ts-ignore - aistudio is globally provided by the environment
      await window.aistudio.openSelectKey();
      // Proceed assuming success as per guidelines to handle potential race conditions
      setIsKeySelected(true);
    }
  };

  const handleEnterApp = (tab: string = 'dashboard', category?: ProductCategory) => {
    setActiveTab(tab);
    if (category) setInitialCategory(category);
    setView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModelSelect = (model: ModelPersona) => {
    setSelectedModel(model);
    setActiveTab('shoot');
  };

  const addToHistory = (result: GenerationResult) => {
    setHistory(prev => [result, ...prev]);
  };

  const handlePersonalModelCreated = (config: PersonalModelConfig) => {
    setPersonalModel(config);
    localStorage.setItem('amrah_personal_model', JSON.stringify(config));
  };

  const handlePersonalModelDelete = () => {
    setPersonalModel(null);
    localStorage.removeItem('amrah_personal_model');
    if (selectedModel?.isPersonal) setSelectedModel(null);
  };

  if (view === 'landing') {
    return <Dashboard onEnterApp={handleEnterApp} />;
  }

  // Mandatory view to ensure API key is selected before using premium models (Gemini 3 Pro / Veo)
  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] leading-tight" style={{ fontFamily: brandKit.primaryFont }}>Maison Authorization</h1>
          <p className="text-zinc-500 max-w-md mx-auto italic">To orchestration high-fidelity luxury assets and cinematic motion, please select a valid API key from a paid GCP project.</p>
          <div className="pt-2">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em] hover:underline">View Billing Documentation</a>
          </div>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className="px-12 py-5 bg-[#1A1A1A] text-white rounded-full font-bold text-[11px] uppercase tracking-[0.5em] hover:bg-[#D4AF37] transition-all shadow-2xl hover:scale-105 active:scale-95"
        >
          Select Maison API Key
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F9F9F9] text-zinc-800" style={{ fontFamily: brandKit.secondaryFont }}>
      <Header brandKit={brandKit} onLogoClick={() => setView('landing')} />
      
      {/* Top Main Navigation (Simplified for App Mode) */}
      <div className="bg-white border-b border-black/[0.05] px-8 py-4 flex items-center justify-between">
        <div className="flex gap-12">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'shoot-flow', label: 'Create Product Shoot', sub: 'Models → /create-shoot' },
            { id: 'studio', label: 'Quick Product Shot', sub: 'Single Asset' },
            { id: 'campaign', label: 'Campaign Banners', sub: 'Banners' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'shoot-flow') setActiveTab('models');
                else setActiveTab(item.id);
              }}
              className={`flex flex-col text-left transition-all group ${
                (activeTab === item.id || (item.id === 'shoot-flow' && (activeTab === 'models' || activeTab === 'shoot')))
                  ? 'text-[#1A1A1A]' 
                  : 'text-zinc-400 hover:text-[#1A1A1A]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
              <span className="text-[7px] font-medium uppercase tracking-[0.1em] text-zinc-300 group-hover:text-[#D4AF37]">{item.sub || ''}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
           <button onClick={() => setActiveTab('brand')} className={`px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'brand' ? 'bg-[#1A1A1A] text-white' : 'bg-zinc-50 text-zinc-400'}`}>Maison DNA</button>
           <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[#1A1A1A] text-white' : 'bg-zinc-50 text-zinc-400'}`}>Archives</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth bg-[#F9F9F9]">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-16 reveal active">
                <div className="space-y-4">
                   <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Command Sanctuary</span>
                   <h2 className="text-4xl md:text-6xl font-serif text-[#1A1A1A] leading-[1.1] tracking-tight" style={{ fontFamily: brandKit.primaryFont }}>
                      The Visionary’s <br /> Dashboard
                   </h2>
                   <p className="text-[#666] text-lg max-w-2xl font-light leading-relaxed italic">
                     Welcome to {brandKit.name}. Select an action above to begin orchestrating high-fidelity legacy assets.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { id: 'models', label: 'Create Product Shoot', desc: 'Full editorial with models' },
                     { id: 'studio', label: 'Quick Product Shot', desc: 'Standalone product renders' },
                     { id: 'campaign', label: 'Campaign Banners', desc: 'Automated ad generation' }
                   ].map(card => (
                     <div key={card.id} onClick={() => setActiveTab(card.id)} className="p-10 bg-white border border-black/[0.04] rounded-[40px] soft-shadow card-hover cursor-pointer group">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 mb-8 flex items-center justify-center text-zinc-300 group-hover:text-[#D4AF37] transition-colors">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <h3 className="text-xl font-serif mb-2">{card.label}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{card.desc}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
            
            {activeTab === 'studio' && <Studio brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} />}
            {activeTab === 'shoot' && (
              <CreateShoot 
                brandKit={brandKit} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                addToHistory={addToHistory}
                onGoBackToModels={() => setActiveTab('models')}
                initialCategory={initialCategory}
              />
            )}
            {activeTab === 'campaign' && <CampaignSuite brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} />}
            {activeTab === 'models' && <ModelShowcase onModelSelect={handleModelSelect} selectedModelId={selectedModel?.id} personalModel={personalModel} />}
            {activeTab === 'brand' && <BrandMemory brandKit={brandKit} setBrandKit={setBrandKit} />}
            {activeTab === 'personal' && <PersonalModel onCreated={handlePersonalModelCreated} onDelete={handlePersonalModelDelete} existingModel={personalModel} />}
            
            {activeTab === 'history' && (
              <div className="space-y-16 reveal active">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-black/[0.06] pb-10 gap-4">
                  <h2 className="text-4xl md:text-5xl font-serif text-[#1A1A1A] tracking-tight leading-none">Archives</h2>
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.4em]">{history.length} Assets Secured</span>
                </div>
                {history.length === 0 ? (
                  <div className="py-40 text-center space-y-6">
                    <p className="text-zinc-400 text-[10px] uppercase tracking-[0.5em] font-bold">The sanctuary is currently empty.</p>
                    <button onClick={() => setActiveTab('studio')} className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold underline underline-offset-8">Begin Creation</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                    {history.map((item) => (
                      <div key={item.id} className="group space-y-4">
                        <div className="aspect-video bg-white border border-black/[0.04] relative overflow-hidden rounded-[32px] soft-shadow card-hover">
                          {item.type === 'video' ? (
                            <video src={item.url} key={item.url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex justify-between items-start px-2">
                          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[75%]">"{item.prompt}"</p>
                          <span className="text-[8px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] border border-[#D4AF37]/20 px-3 py-1 rounded-full">{item.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
