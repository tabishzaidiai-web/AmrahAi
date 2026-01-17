
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'models', label: 'Neural Models', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { id: 'studio', label: 'Couture Studio', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'campaign', label: 'Campaign Suite', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  ];

  return (
    <aside className="w-64 border-r border-black/[0.06] bg-white flex flex-col p-8 hidden lg:flex">
      <nav className="space-y-12 flex-1">
        <div>
          <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.5em] mb-10 block">Navigation</span>
          <div className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold transition-all group ${
                  activeTab === item.id || (item.id === 'models' && activeTab === 'shoot')
                    ? 'bg-[#1A1A1A] text-white shadow-xl' 
                    : 'text-zinc-400 hover:bg-zinc-50 hover:text-[#1A1A1A]'
                }`}
              >
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-8 border-t border-black/[0.04] space-y-4 text-center">
        <div className="flex items-center justify-center gap-3 p-4 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/10">
           <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
           <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest">50 Credits Remaining</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
