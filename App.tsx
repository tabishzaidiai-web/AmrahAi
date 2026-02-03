
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PhotoStudio from './components/PhotoStudio';
import Dashboard from './components/Dashboard';
import Campaigns from './components/Campaigns';
import CreateShoot from './components/CreateShoot';
import Auth from './components/Auth';
import Pricing from './components/Pricing';
import { GenerationResult, BrandKit as BrandKitType, ModelPersona, ProductCategory, User, SubscriptionPackage } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('shoot');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(true);
  const [initialCategory, setInitialCategory] = useState<ProductCategory>('fashion');
  const [showPricing, setShowPricing] = useState(false);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('amrah_user_session');
    return saved ? JSON.parse(saved) : null;
  });

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

  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (window.aistudio) {
        try {
          // @ts-ignore
          const selected = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(selected);
        } catch (e) {
          setIsKeySelected(true);
        }
      }
    };
    checkKeyStatus();
  }, []);

  const handleEnterApp = (tab: string = 'shoot', category?: ProductCategory) => {
    setActiveTab(tab);
    if (category) setInitialCategory(category);
    setView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenKeySelection = async () => {
    // @ts-ignore
    if (window.aistudio) {
      try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setIsKeySelected(true);
      } catch (e) {
        alert("Failed to initialize Key Selector.");
      }
    } else {
      setIsKeySelected(true);
    }
  };

  const handleResetKey = useCallback(() => {
    setIsKeySelected(false);
  }, []);

  const addToHistory = (result: GenerationResult) => {
    setHistory(prev => [result, ...prev]);
    if (user) {
      const updatedUser: User = {
        ...user,
        totalGenerated: (user.totalGenerated || 0) + 1,
        credits: {
          images: result.type === 'image' && user.credits.images !== -1 ? Math.max(0, user.credits.images - 1) : user.credits.images,
          videos: result.type === 'video' && user.credits.videos !== -1 ? Math.max(0, user.credits.videos - 1) : user.credits.videos,
        }
      };
      setUser(updatedUser);
      localStorage.setItem('amrah_user_session', JSON.stringify(updatedUser));
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('amrah_user_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('amrah_user_session');
    setView('landing');
  };

  const handleUpgrade = (pkg: SubscriptionPackage) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        tier: pkg.name as User['tier'],
        credits: {
          images: pkg.imageCredits === -1 ? -1 : (user.credits.images + pkg.imageCredits),
          videos: pkg.videoCredits === -1 ? -1 : (user.credits.videos + pkg.videoCredits)
        }
      };
      setUser(updatedUser);
      localStorage.setItem('amrah_user_session', JSON.stringify(updatedUser));
      setShowPricing(false);
    }
  };

  const handleApiError = useCallback((err: any) => {
    const errMsg = err?.message?.toLowerCase() || "";
    // Check for common auth or project-not-found errors
    if (
      errMsg.includes("requested entity was not found") || 
      errMsg.includes("authentication error") || 
      errMsg.includes("unauthorized") ||
      errMsg.includes("api key")
    ) {
      handleResetKey();
      alert("Maison Session Expired or Authentication Failed. Please re-select your API key to continue.");
    } else {
      alert(err?.message || "An unexpected neural orchestration error occurred.");
    }
  }, [handleResetKey]);

  if (view === 'landing') {
    return <Dashboard onEnterApp={handleEnterApp} />;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-12 animate-lux-in">
        <div className="space-y-6">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Authorization</span>
          <h1 className="text-4xl md:text-5xl font-serif text-emerald-950 leading-tight">Maison Access Control</h1>
          <p className="text-emerald-950/40 max-w-md mx-auto italic font-light leading-relaxed">
            Your session requires a valid Gemini API Key from a paid project. Please authorize to resume rendering.
          </p>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className="px-12 md:px-16 py-6 md:py-7 bg-emerald-950 text-white rounded-full font-bold text-[11px] uppercase tracking-[0.4em] hover:bg-gold transition-all shadow-2xl btn-luxury"
        >
          Select Maison API Key
        </button>
        <p className="text-[9px] text-emerald-950/20 uppercase tracking-widest">
          Ensure billing is enabled at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">ai.google.dev/gemini-api/docs/billing</a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-emerald-950 font-sans">
      <Header 
        brandKit={brandKit} 
        onLogoClick={() => setView('landing')} 
        user={user} 
        onUpgradeClick={() => setShowPricing(true)}
        onLogout={handleLogout}
      />
      
      {showPricing && <Pricing onClose={() => setShowPricing(false)} onSelect={handleUpgrade} />}

      {/* Responsive Navigation */}
      <div className="bg-white px-4 md:px-16 flex items-center justify-center border-b border-gray-100 h-20 relative overflow-x-auto no-scrollbar">
        <div className="flex gap-8 md:gap-16 whitespace-nowrap">
          {[
            { id: 'shoot', label: 'Create Product Shoot' },
            { id: 'quick', label: 'Quick Product Shot' },
            { id: 'banners', label: 'Campaign Banners' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative h-20 px-2 flex items-center ${
                activeTab === item.id ? 'text-gold' : 'text-emerald-950/30 hover:text-emerald-950/60'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
              )}
            </button>
          ))}
        </div>
        
        <div className="hidden md:flex absolute right-16 items-center gap-8">
           <button 
             onClick={() => setActiveTab('history')} 
             className={`px-8 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
               activeTab === 'history' ? 'bg-emerald-950 text-white' : 'bg-emerald-50/50 text-emerald-950/40 hover:text-emerald-950'
             }`}
           >
             Archives
           </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-24 bg-white no-scrollbar">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'shoot' && (
            <CreateShoot 
              brandKit={brandKit} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              addToHistory={addToHistory} initialCategory={initialCategory}
              userCredits={user.credits} onInsufficientCredits={() => setShowPricing(true)} onError={handleApiError}
            />
          )}
          {activeTab === 'quick' && (
            <PhotoStudio 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user.credits} onInsufficientCredits={() => setShowPricing(true)} onError={handleApiError}
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            />
          )}
          {activeTab === 'banners' && (
            <Campaigns 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user.credits} onInsufficientCredits={() => setShowPricing(true)} onError={handleApiError}
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            />
          )}
          {activeTab === 'history' && (
            <div className="space-y-16 animate-lux-in">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif text-emerald-950 italic">Maison Archives</h2>
                <p className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-[0.3em]">Curated Visual Exports</p>
              </div>
              
              {history.length === 0 ? (
                <div className="py-60 text-center opacity-10 text-[11px] uppercase tracking-widest font-bold">No assets curated.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16">
                  {history.map((item) => (
                    <div key={item.id} className="group space-y-6">
                      <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden rounded-[2.5rem] border border-gray-50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-1">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="px-4 space-y-2">
                        <p className="text-[9px] text-emerald-950/40 uppercase tracking-widest font-bold">{new Date(item.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] text-emerald-950/60 italic line-clamp-1">{item.prompt}</p>
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
  );
};

export default App;
