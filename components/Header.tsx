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
  return (
    <header className="glass sticky top-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between border-b border-emerald-50">
      <div className="flex flex-col cursor-pointer" onClick={onLogoClick}>
        <span className="text-xl md:text-2xl font-serif tracking-[0.2em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
        <span className="text-[7px] font-bold text-gold uppercase tracking-[0.5em] mt-1.5">Visual Intelligence</span>
      </div>
      
      <div className="flex items-center gap-6 md:gap-12">
        {user && (
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">{user.name}</span>
            <span className="text-[8px] font-bold text-gold uppercase tracking-widest">{user.tier} Account</span>
          </div>
        )}
        <button 
          onClick={onUpgradeClick}
          className="px-6 md:px-10 py-2.5 bg-emerald-950 text-white rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold transition-all shadow-xl"
        >
          Upgrade
        </button>
      </div>
    </header>
  );
};

export default Header;