
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PhotoStudio from './components/PhotoStudio';
import Dashboard from './components/Dashboard';
import BrandMemory from './components/BrandMemory';
import Campaigns from './components/Campaigns';
import CreateShoot from './components/CreateShoot';
import PhotoshootPlanner from './components/PhotoshootPlanner';
import AdminDashboard from './components/AdminDashboard';
import ModelShowcase from './components/ModelShowcase';
import AmazonListingStudio from './components/AmazonListingStudio';
import Auth from './components/Auth';
import Pricing from './components/Pricing';
import { GenerationResult, BrandKit as BrandKitType, ModelPersona, ProductCategory, User, SubscriptionPackage, UsageLog } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('editorial');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [initialCategory, setInitialCategory] = useState<ProductCategory>('fashion');
  const [showPricing, setShowPricing] = useState(false);
  
  // Usage Logs State (Simulated Database)
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>(() => {
    const saved = localStorage.getItem('amrah_usage_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('amrah_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Global Brand Kit State
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
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKeyStatus();
  }, []);

  const handleEnterApp = (tab: string = 'editorial', category?: ProductCategory) => {
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
    
    if (user) {
      // Update User Session & Usage
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

      // Update Global Admin Simulation Database
      const allUsers: User[] = JSON.parse(localStorage.getItem('amrah_all_users') || '[]');
      const idx = allUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        allUsers[idx] = updatedUser;
        localStorage.setItem('amrah_all_users', JSON.stringify(allUsers));
      }

      // Add to Usage Logs
      const newLog: UsageLog = {
        id: `log-${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        type: result.type,
        timestamp: Date.now(),
        prompt: result.prompt
      };
      const updatedLogs = [newLog, ...usageLogs];
      setUsageLogs(updatedLogs);
      localStorage.setItem('amrah_usage_logs', JSON.stringify(updatedLogs));
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
      
      // Update Global Simulation Store
      const allUsers: User[] = JSON.parse(localStorage.getItem('amrah_all_users') || '[]');
      const idx = allUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        allUsers[idx] = updatedUser;
        localStorage.setItem('amrah_all_users', JSON.stringify(allUsers));
      }
      
      setShowPricing(false);
    }
  };

  if (view === 'landing') {
    return <Dashboard onEnterApp={handleEnterApp} />;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-10 animate-in fade-in duration-500">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Security Protocol</span>
          <h1 className="text-5xl font-serif text-emerald-950 leading-tight">Maison Authorization</h1>
          <p className="text-emerald-950/40 max-w-md mx-auto italic font-light leading-relaxed">To orchestrate high-fidelity assets and cinematic motion, please authorize your secure session with an API Key.</p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] hover:underline block pt-4">View Billing Documentation</a>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className="px-16 py-6 bg-emerald-950 text-white rounded-full font-bold text-[12px] uppercase tracking-[0.4em] hover:bg-gold transition-all shadow-2xl btn-luxury"
        >
          Select Maison API Key
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FDFDFD] text-emerald-950 font-sans">
      <Header 
        brandKit={brandKit} 
        onLogoClick={() => setView('landing')} 
        user={user} 
        onUpgradeClick={() => setShowPricing(true)}
        onLogout={handleLogout}
      />
      
      {showPricing && <Pricing onClose={() => setShowPricing(false)} onSelect={handleUpgrade} />}

      {/* Navigation Sub-Header */}
      <div className="bg-white border-b border-black/5 px-10 py-6 flex items-center justify-between">
        <div className="flex gap-12 overflow-x-auto no-scrollbar">
          {[
            { id: 'editorial', label: 'Photo Studio' },
            { id: 'amazon', label: 'Amazon Studio' },
            { id: 'talent', label: 'Talent' },
            { id: 'quick', label: 'Quick Shot' },
            { id: 'banners', label: 'Campaigns' },
            { id: 'planner', label: 'Shoot Planner' },
            { id: 'brand', label: 'Brand DNA' },
            ...(user.role === 'Admin' ? [{ id: 'admin', label: 'Metrics (Admin)' }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-[11px] font-bold uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
                activeTab === item.id ? 'text-gold' : 'text-emerald-950/40 hover:text-emerald-950'
              }`}
            >
              {item.label}
              {activeTab === item.id && <div className="absolute -bottom-7 left-0 right-0 h-0.5 bg-gold" />}
            </button>
          ))}
        </div>

        <div className="flex gap-4 items-center shrink-0">
           <button 
             onClick={() => setActiveTab('history')} 
             className={`px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
               activeTab === 'history' ? 'bg-emerald-950 text-white shadow-lg' : 'bg-emerald-50 text-emerald-950/40 hover:bg-emerald-100'
             }`}
           >
             Archives
           </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-12 scroll-smooth bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'editorial' && (
            <CreateShoot 
              brandKit={brandKit} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              addToHistory={addToHistory} onGoBackToModels={() => setActiveTab('talent')} initialCategory={initialCategory}
              userCredits={user.credits} 
              onInsufficientCredits={() => setShowPricing(true)}
            />
          )}
          {activeTab === 'amazon' && (
            <AmazonListingStudio 
              brandKit={brandKit} 
              addToHistory={addToHistory}
              userCredits={user.credits}
              onInsufficientCredits={() => setShowPricing(true)}
            />
          )}
          {activeTab === 'talent' && (
             <ModelShowcase 
               onModelSelect={(m) => { setSelectedModel(m); setActiveTab('editorial'); }} 
               selectedModelId={selectedModel?.id}
               personalModel={null}
             />
          )}
          {activeTab === 'quick' && (
            <PhotoStudio 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user.credits} 
              onInsufficientCredits={() => setShowPricing(true)}
            />
          )}
          {activeTab === 'banners' && (
            <Campaigns 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user.credits} 
              onInsufficientCredits={() => setShowPricing(true)}
            />
          )}
          {activeTab === 'planner' && (
            <PhotoshootPlanner brandKit={brandKit} />
          )}
          {activeTab === 'brand' && <BrandMemory brandKit={brandKit} setBrandKit={setBrandKit} />}
          {activeTab === 'admin' && user.role === 'Admin' && <AdminDashboard logs={usageLogs} />}
          
          {activeTab === 'history' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="flex items-end justify-between border-b border-black/5 pb-8">
                <h2 className="text-4xl font-serif text-emerald-950 tracking-tight">Archives</h2>
                <span className="text-emerald-950/40 text-[10px] font-bold uppercase tracking-[0.3em]">{history.length} Neural Assets Secured</span>
              </div>
              {history.length === 0 ? (
                <div className="py-40 text-center space-y-6">
                  <p className="text-emerald-950/20 text-[11px] uppercase tracking-[0.6em] font-bold">The archives are currently empty.</p>
                  <button onClick={() => setActiveTab('editorial')} className="text-gold text-[11px] uppercase tracking-widest font-bold underline underline-offset-8">Begin Session</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {history.map((item) => (
                    <div key={item.id} className="group space-y-5">
                      <div className="aspect-[4/5] bg-white border border-black/5 relative overflow-hidden rounded-[2.5rem] soft-shadow group-hover:scale-[1.02] transition-all duration-500">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <a href={item.url} download className="p-3 bg-white text-emerald-950 rounded-xl shadow-xl hover:text-gold transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                        </div>
                      </div>
                      <div className="flex justify-between items-start px-4">
                        <p className="text-[10px] text-emerald-950/50 italic font-medium leading-relaxed max-w-[70%] line-clamp-2">"{item.prompt}"</p>
                        <span className="text-[9px] text-gold font-bold uppercase tracking-widest bg-gold/5 px-3 py-1.5 rounded-full border border-gold/10">{item.type}</span>
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
