import React from 'react';
import { BrandKit } from '../types';

interface HeaderProps {
  brandKit: BrandKit;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ brandKit, onLogoClick }) => {
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
          <span className="text-[7px] font-bold text-gold uppercase tracking-[0.4em] mt-1.5">
            Luxury Visual Intelligence
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-10">
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-[0.2em]">Neural Engine Locked</span>
        </div>
        
        <button className="text-[10px] font-bold text-emerald-950/60 hover:text-gold uppercase tracking-[0.2em] transition-colors pl-10 border-l border-black/5">
          Plan & Usage
        </button>
      </div>
    </header>
  );
};

export default Header;