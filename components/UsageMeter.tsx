import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UsageMeter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  // In Local/Maison mode, we assume unlimited credits for full studio testing
  const isUnlimited = true;

  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-emerald-50/50 rounded-full border border-emerald-50">
      <div className="flex flex-col">
        <span className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest">Image Credits</span>
        <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">
          {isUnlimited ? 'Unlimited' : `${user.credits.images} / 3`}
        </span>
      </div>
      <div className="w-[1px] h-6 bg-emerald-100" />
      <div className="flex flex-col">
        <span className="text-[8px] font-bold text-emerald-950/40 uppercase tracking-widest">Video Credits</span>
        <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest">
          {isUnlimited ? 'Unlimited' : `${user.credits.videos} / 3`}
        </span>
      </div>
    </div>
  );
};

export default UsageMeter;
