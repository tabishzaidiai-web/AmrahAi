
import React from 'react';
import { BrandKit, User } from '../types';

interface HeaderProps {
  brandKit: BrandKit;
  onLogoClick: () => void;
  user: User | null;
  onUpgradeClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ brandKit, onLogoClick, user, onUpgradeClick, onLogout }) => {
  const refinedAvatar = user?.avatar || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=200';

  const isFree = user?.tier === 'Free';
  const used = user?.totalGenerated || 0;
  const limit = 5;
  const percent = Math.min((used / limit) * 100, 100);

  return (
    <header className="glass sticky top-0 z-[100] px-10 py-6 flex items-center justify-between">
      <div className="flex items-center gap-6 cursor-pointer group" onClick={onLogoClick}>
        {brandKit.logoUrl && (
          <div className="h-10 w-auto flex items-center gap-6 border-r border-black/5 pr-6">
            <img src={brandKit.logoUrl} alt="Logo" className="h-full w-auto object-contain brightness-0 grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif tracking-[0.2em] text-emerald-950 font-bold uppercase leading-none">
            {brandKit.name || 'AMRAH'}
          </h1>
          <span className="text-[7px] font-bold text-gold uppercase tracking-[0.5em] mt-1.5">
            Neural Visual Intelligence
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-10">
        {user && (
          <div className="flex items-center gap-10">
            {/* Usage Counter */}
            {isFree && (
              <div className="hidden md:flex flex-col gap-2 w-48">
                 <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-emerald-950/40">
                    <span>Maison Usage</span>
                    <span className={used >= limit ? 'text-red-500' : 'text-gold'}>{used}/{limit} FREE</span>
                 </div>
                 <div className="h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${used >= limit ? 'bg-red-500' : 'bg-gold'}`}
                      style={{ width: `${percent}%` }}
                    />
                 </div>
              </div>
            )}

            <div className="flex items-center gap-8 border-r border-black/5 pr-10">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-[0.1em] leading-none">{user.name}</span>
                <div className="flex items-center gap-4">
                   <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest">
                     {user.role} • {user.tier}
                   </span>
                </div>
              </div>
              <div className="relative group/avatar">
                <div className="w-11 h-11 rounded-full border-2 border-gold/20 p-0.5 cursor-pointer hover:border-gold transition-all overflow-hidden bg-white shadow-lg">
                  <img src={refinedAvatar} className="w-full h-full rounded-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" alt="Avatar" />
                </div>
                {/* Logout dropdown */}
                <div className="absolute top-full right-0 mt-4 w-48 bg-white border border-black/5 rounded-2xl shadow-2xl opacity-0 group-hover/avatar:opacity-100 pointer-events-none group-hover/avatar:pointer-events-auto transition-all p-2 overflow-hidden z-[110]">
                  <div className="px-4 py-2 border-b border-black/5 mb-1">
                     <p className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest">Maison Identity</p>
                     <p className="text-[10px] font-bold text-emerald-950 truncate">{user.email}</p>
                  </div>
                  <button onClick={onLogout} className="w-full text-left px-4 py-3 text-[10px] font-bold text-red-500 uppercase hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={onUpgradeClick}
          className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${user?.tier === 'Free' ? 'bg-gold text-white animate-pulse' : 'bg-emerald-950 text-white'} hover:bg-gold-hover btn-luxury`}
        >
          {user?.tier === 'Free' ? 'Upgrade to Pro' : `${user?.tier} Member`}
        </button>
      </div>
    </header>
  );
};

export default Header;
