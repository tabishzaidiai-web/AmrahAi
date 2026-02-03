import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import PhotoStudio from './components/PhotoStudio';
import Dashboard from './components/Dashboard';
import Campaigns from './components/Campaigns';
import CreateShoot from './components/CreateShoot';
import AmazonListingStudio from './components/AmazonListingStudio';
import ModelShowcase from './components/ModelShowcase';
import BrandKit from './components/BrandKit';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import UpgradeModal from './components/UpgradeModal';
import UsageMeter from './components/UsageMeter';
import { 
  GenerationResult, 
  BrandKit as BrandKitType, 
  ModelPersona, 
  ProductCategory, 
  UsageLog 
} from './types';

const MainApp: React.FC = () => {
  const { user, session, logout, refreshProfile } = useAuth();
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('shoot');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelPersona | null>(null);
  const [initialCategory, setInitialCategory] = useState<ProductCategory>('fashion');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    document.addEventListener('changeTab', handleTabChange);
    return () => document.removeEventListener('changeTab', handleTabChange);
  }, []);

  const handleEnterApp = (tab: string = 'shoot', category?: ProductCategory) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
    if (category) setInitialCategory(category);
    setView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApiError = useCallback((err: any) => {
    if (err.code === 'quota_exceeded') {
      setShowUpgradeModal(true);
    } else {
      alert(err?.message || "An unexpected neural orchestration error occurred.");
    }
  }, []);

  const addToHistory = (result: GenerationResult) => {
    setHistory(prev => [result, ...prev]);
    refreshProfile(); // Update credits after generation
  };

  const tabs = [
    { id: 'shoot', label: 'Create Product Shoot' },
    { id: 'quick', label: 'Quick Product Shot' },
    { id: 'amazon', label: 'Amazon Studio' },
    { id: 'banners', label: 'Campaign Banners' },
    { id: 'models', label: 'Maison Models' },
    { id: 'brand', label: 'Maison DNA' },
    { id: 'history', label: 'Archives' },
  ];

  if (user?.role === 'Admin') {
    tabs.push({ id: 'admin', label: 'Command Center' });
  }

  if (view === 'landing') {
    return (
      <>
        <Dashboard onEnterApp={handleEnterApp} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-emerald-950 font-sans">
      <Header 
        brandKit={brandKit} 
        onLogoClick={() => setView('landing')} 
        user={user} 
        onUpgradeClick={() => setShowUpgradeModal(true)}
        onLogout={logout}
      />
      
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <div className="bg-white px-4 md:px-16 flex items-center justify-between border-b border-gray-100 h-20">
        <div className="flex gap-8 md:gap-12 whitespace-nowrap overflow-x-auto no-scrollbar">
          {tabs.map((item) => (
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
        <UsageMeter />
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-24 bg-white no-scrollbar">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'shoot' && (
            <CreateShoot 
              brandKit={brandKit} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              addToHistory={addToHistory} initialCategory={initialCategory}
              userCredits={user?.credits || {images:0, videos:0}} 
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
            />
          )}
          {activeTab === 'quick' && (
            <PhotoStudio 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user?.credits || {images:0, videos:0}} 
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            />
          )}
          {activeTab === 'amazon' && (
            <AmazonListingStudio 
              brandKit={brandKit}
              addToHistory={addToHistory}
              userCredits={user?.credits || {images:0, videos:0}}
              onInsufficientCredits={() => setShowUpgradeModal(true)}
              onError={handleApiError}
            />
          )}
          {activeTab === 'banners' && (
            <Campaigns 
              brandKit={brandKit} addToHistory={addToHistory} initialCategory={initialCategory} 
              userCredits={user?.credits || {images:0, videos:0}}
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            />
          )}
          {activeTab === 'models' && (
            <ModelShowcase 
              onModelSelect={(m) => { setSelectedModel(m); setActiveTab('shoot'); }}
              selectedModelId={selectedModel?.id}
            />
          )}
          {activeTab === 'brand' && (
            <BrandKit brandKit={brandKit} setBrandKit={setBrandKit} />
          )}
          {activeTab === 'admin' && user?.role === 'Admin' && (
            <AdminDashboard logs={logs} />
          )}
          {activeTab === 'history' && (
            <div className="space-y-16 animate-lux-in">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif text-emerald-950 italic">Maison Archives</h2>
                <p className="text-[10px] font-bold text-emerald-950/20 uppercase tracking-[0.3em]">Curated Visual Exports</p>
              </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;
