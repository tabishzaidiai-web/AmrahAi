
import React from 'react';
import { BrandKit } from '../types';

interface HeaderProps {
  brandKit: BrandKit;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ brandKit, onLogoClick }) => {
  return (
    <header className="glass sticky top-0 z-50 px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-6 cursor-pointer group" onClick={onLogoClick}>
        {brandKit.logoUrl ? (
          <div className="h-10 w-auto flex items-center gap-4 border-r border-black/[0.06] pr-6">
            <img src={brandKit.logoUrl} alt="Maison Logo" className="h-full w-auto object-contain brightness-0 grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : null}
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif tracking-widest text-[#D4AF37] italic font-medium uppercase leading-none">
            {brandKit.name || 'AMRAH'}
          </h1>
          <span className="text-[6px] font-bold text-zinc-400 uppercase tracking-[0.5em] mt-1 text-center">
            HERITAGE ENGINE
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-10">
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Neural Lock Active</span>
        </div>
        
        <button className="text-[9px] font-bold text-zinc-400 hover:text-[#1A1A1A] uppercase tracking-[0.3em] transition-colors border-l border-black/[0.06] pl-10">
          Concierge
        </button>
      </div>
    </header>
  );
};

export default Header;
