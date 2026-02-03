
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
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'M'}&background=022c22&color=D4AF37`;
  
  // Credit calculation for the usage bar
  const totalCredits = 10; // Mock total for visual bar
  const remainingCredits = user?.credits.images || 0;
  const usedCredits = Math.max(0, totalCredits - remainingCredits);
  const usagePercentage = Math.min(100, (usedCredits / totalCredits) * 100);

  return (
    <header className="glass sticky top-0 z-[100] px-12 py-6 flex items-center justify-between border-b border-emerald-50">
      <div className="flex items-center gap-8 cursor-pointer group" onClick={onLogoClick}>
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif tracking-[0.25em] text-emerald-950 font-bold uppercase leading-none group-hover:text-gold transition-colors">
            {brandKit.name === 'Luxury Maison' ? 'LUXURY MAISON' : brandKit.name.toUpperCase()}
          </h1>
          <span className="text-[7px] font-bold text-gold uppercase tracking-[0.55em] mt-2.5">
            Neural Visual Intelligence
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-16">
        {user && (
          <div className="flex items-center gap-12">
            {/* Maison Usage Bar aligned with screenshot */}
            <div className="hidden xl:flex flex-col gap-2 w-64">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-widest">Maison Usage</span>
                <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">{usedCredits}/{totalCredits} Free</span>
              </div>
              <div className="h-1 bg-emerald-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000" 
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 border-r border-emerald-50 pr-12">
              <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-[0.2em]">Maison Partner</span>
              <span className="text-[8px] font-bold text-emerald-950/30 uppercase tracking-[0.2em]">User • {user.tier}</span>
            </div>
            
            <div className="relative group/user">
              <div className="w-12 h-12 rounded-full bg-emerald-950 flex items-center justify-center p-0.5 cursor-pointer hover:shadow-xl transition-all">
                <div className="w-full h-full rounded-full border border-gold/30 flex items-center justify-center text-gold text-[10px] font-bold">
                  MP
                </div>
              </div>
              <div className="absolute top-full right-0 mt-4 w-56 bg-white border border-emerald-50 rounded-[2rem] shadow-2xl opacity-0 group-hover/user:opacity-100 pointer-events-none group-hover/user:pointer-events-auto transition-all p-2 overflow-hidden">
                <div className="px-6 py-4 border-b border-emerald-50 mb-1">
                  <p className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest">Partner ID</p>
                  <p className="text-[11px] font-bold text-emerald-950 truncate">{user.email}</p>
                </div>
                <button onClick={onLogout} className="w-full text-left px-6 py-4 text-[11px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-10 w-[1px] bg-emerald-50" />

        <button 
          onClick={onUpgradeClick}
          className="px-10 py-3.5 bg-gold text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-hover transition-all btn-luxury shadow-lg shadow-gold/10"
        >
          Upgrade to Pro
        </button>
      </div>
    </header>
  );
};

export default Header;
