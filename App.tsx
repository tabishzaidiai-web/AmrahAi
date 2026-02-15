import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import Header from './components/Header.tsx';
import CreateShoot from './components/CreateShoot.tsx';
import PhotoStudio from './components/PhotoStudio.tsx';
import Campaigns from './components/Campaigns.tsx';
import AmazonListingStudio from './components/AmazonListingStudio.tsx';
import Studio from './components/Studio.tsx';
import VideoStudio from './components/VideoStudio.tsx';
import MaisonDashboard from './components/MaisonDashboard.tsx';
import BrandMemory from './components/BrandMemory.tsx';
import PhotoshootPlanner from './components/PhotoshootPlanner.tsx';
import AuthModal from './components/AuthModal.tsx';
import UpgradeModal from './components/UpgradeModal.tsx';
import UsageMeter from './components/UsageMeter.tsx';
import Dashboard from './components/Dashboard.tsx';
import { 
  GenerationResult, 
  BrandKit as BrandKitType, 
  ModelPersona, 
  ProductCategory 
} from './types.ts';

const MainApp: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('shoot');
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

  // Automatically enter the app if user is already logged in or just authenticated
  useEffect(() => {
    if (user && view === 'landing' && showAuthModal) {
      setView('app');
      setShowAuthModal(false);
    }
  }, [user, view, showAuthModal]);

  const isOverLimit = (type: 'image' | 'video') => {
    if (!user || user.tier !== 'Free') return false;
    if (type === 'image' && user.credits.images >= 3) return true;
    if (type === 'video' && user.credits.videos >= 1) return true;
    return false;
  };

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
    if (err.code === 'quota_exceeded' || err.message?.includes('limit')) {
      setShowUpgradeModal(true);
    } else {
      alert(err?.message || "An unexpected neural orchestration error occurred.");
    }
  }, []);

  const addToHistory = (result: GenerationResult) => {
    refreshProfile(); 
  };

  const tabs = [
    { id: 'shoot', label: 'Product Shoot' },
    { id: 'master', label: 'Master Studio' },
    { id: 'video', label: 'Film Studio' },
    { id: 'banners', label: 'Banners' },
    { id: 'amazon', label: 'Amazon Suite' },
    { id: 'planner', label: 'Planner' },
    { id: 'hub', label: 'Maison Hub' },
    { id: 'dna', label: 'Brand DNA' }
  ];

  if (view === 'landing') {
    return (
      <>
        <Dashboard onEnterApp={handleEnterApp} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-emerald-950 font-sans selection:bg-gold selection:text-white">
      <Header 
        brandKit={brandKit} 
        onLogoClick={() => setView('landing')} 
        user={user} 
        onUpgradeClick={() => setShowUpgradeModal(true)}
        onLogout={logout}
      />
      
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <div className="bg-white px-4 md:px-16 flex items-center justify-center border-b border-gray-50 h-28 sticky top-0 z-50">
        <div className="flex gap-8 md:gap-12 whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative h-28 px-2 flex items-center ${
                activeTab === item.id ? 'text-gold' : 'text-emerald-950/20 hover:text-emerald-950/50'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
              )}
            </button>
          ))}
        </div>
        <div className="absolute right-12 hidden xl:block opacity-80">
           <UsageMeter />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-20 bg-white no-scrollbar">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'shoot' && (
            <CreateShoot 
              brandKit={brandKit} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              addToHistory={addToHistory} initialCategory={initialCategory}
              userCredits={user?.credits || {images:0, videos:0}} 
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
              isLocked={isOverLimit('image')}
            />
          )}
          {activeTab === 'master' && (
            <Studio 
              brandKit={brandKit} 
              addToHistory={addToHistory} 
              initialCategory={initialCategory} 
            />
          )}
          {activeTab === 'video' && (
            <VideoStudio 
              brandKit={brandKit} 
              addToHistory={addToHistory} 
              initialCategory={initialCategory}
              userCredits={user?.credits || {images:0, videos:0}} 
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              isLocked={isOverLimit('video')}
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
          {activeTab === 'amazon' && (
            <AmazonListingStudio 
              brandKit={brandKit} 
              addToHistory={addToHistory} 
              userCredits={user?.credits || {images:0, videos:0}}
              onInsufficientCredits={() => setShowUpgradeModal(true)} 
              onError={handleApiError}
            />
          )}
          {activeTab === 'planner' && (
            <PhotoshootPlanner brandKit={brandKit} />
          )}
          {activeTab === 'hub' && (
            <MaisonDashboard />
          )}
          {activeTab === 'dna' && (
            <BrandMemory brandKit={brandKit} setBrandKit={setBrandKit} />
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