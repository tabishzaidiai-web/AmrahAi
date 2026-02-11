import React from 'react';

interface MaisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
}

const MaisonModal: React.FC<MaisonModalProps> = ({ isOpen, onClose, title, children, primaryAction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-lux-in">
        <div className="mb-8">
          <h3 className="text-2xl font-serif text-emerald-950 italic">{title}</h3>
          <div className="h-[1px] w-12 bg-gold mt-2" />
        </div>
        
        <div className="space-y-6 mb-10">
          {children}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-emerald-950/40 hover:text-emerald-950 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={primaryAction.disabled || primaryAction.loading}
            onClick={primaryAction.onClick}
            className={`flex-1 py-4 bg-emerald-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              primaryAction.disabled || primaryAction.loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gold shadow-lg shadow-emerald-950/20'
            }`}
          >
            {primaryAction.loading ? 'Processing...' : primaryAction.label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaisonModal;