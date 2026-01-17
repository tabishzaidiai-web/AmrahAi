
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { PersonalModelConfig } from '../types';

interface PersonalModelProps {
  onCreated: (config: PersonalModelConfig) => void;
  onDelete: () => void;
  existingModel: PersonalModelConfig | null;
}

const PersonalModel: React.FC<PersonalModelProps> = ({ onCreated, onDelete, existingModel }) => {
  const [agreed, setAgreed] = useState(false);
  const [dataset, setDataset] = useState<string[]>([]);
  const [training, setTraining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setDataset(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleTrain = async () => {
    if (dataset.length < 5) return alert("Please upload at least 5 images for initial calibration.");
    setTraining(true);
    try {
      const modelId = await GeminiService.trainPersonalModel(dataset);
      onCreated({
        id: modelId,
        representativePortrait: dataset[0],
        dataset: dataset,
        createdAt: Date.now()
      });
    } catch (e) {
      alert("Training failed. Ensure images are clear.");
    } finally {
      setTraining(false);
    }
  };

  if (existingModel) {
    return (
      <div className="space-y-12 reveal active">
        <div className="bg-white border border-black/[0.05] rounded-[48px] p-12 soft-shadow flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="w-40 h-40 rounded-[32px] overflow-hidden border-4 border-[#D4AF37]/20 shadow-2xl">
              <img src={existingModel.representativePortrait} className="w-full h-full object-cover" alt="Personal Twin" />
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.5em] block">Your AI Twin Active</span>
              <h2 className="text-4xl font-serif italic text-[#1A1A1A]">Neural Self-Sync</h2>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Calibrated on {new Date(existingModel.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <button 
            onClick={() => { if(confirm("Permanently delete your personal AI identity?")) onDelete(); }}
            className="px-10 py-4 border border-red-100 text-red-400 hover:bg-red-50 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all"
          >
            Purge Neural Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-16 reveal active">
      <div className="text-center space-y-4">
        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.6em] block">Exclusive Intelligence</span>
        <h2 className="text-5xl font-serif text-[#1A1A1A] tracking-tight">Create Your AI Twin</h2>
        <p className="text-[#666] italic text-lg max-w-xl mx-auto">Scale your own visual identity with hyper-realistic AI precision. Private, secure, and brand-safe.</p>
      </div>

      {!agreed ? (
        <div className="bg-white border border-black/[0.05] rounded-[48px] p-12 soft-shadow space-y-8">
           <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.4em] border-b border-black/[0.05] pb-4">Ethical Use & Privacy Agreement</h4>
              <div className="text-xs text-zinc-500 space-y-4 leading-relaxed font-light">
                <p>• I confirm I have explicit consent from the subject in the uploaded images.</p>
                <p>• I agree that this model will only be used for tasteful, commercial fashion content.</p>
                <p>• I understand that AMRAH strictly prohibits explicit or revealing clothing generations.</p>
                <p>• My data is stored locally and used only for my private generations.</p>
              </div>
           </div>
           <button 
            onClick={() => setAgreed(true)} 
            className="w-full py-6 bg-[#1A1A1A] text-white font-bold rounded-3xl text-[10px] uppercase tracking-[0.5em] hover:bg-[#D4AF37] transition-all shadow-2xl"
           >
             I Consent & Agree
           </button>
        </div>
      ) : (
        <div className="space-y-12">
           <div className="bg-white border border-black/[0.05] rounded-[48px] p-12 soft-shadow space-y-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Dataset Ingestion</span>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{dataset.length} Images Added</span>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[21/9] bg-[#F9F9F9] border-2 border-dashed border-zinc-100 rounded-[40px] flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/40 transition-all group"
              >
                <div className="text-center space-y-3">
                   <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center text-[#D4AF37] shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
                   </div>
                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Upload 10-30 Master Portraits</span>
                </div>
                <input type="file" ref={fileInputRef} multiple onChange={(e) => handleFiles(e.target.files!)} className="hidden" />
              </div>

              {dataset.length > 0 && (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 overflow-y-auto max-h-[300px] p-2 no-scrollbar">
                  {dataset.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-black/[0.05]">
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="flex justify-center">
             <button 
              onClick={handleTrain}
              disabled={training || dataset.length < 5}
              className={`px-20 py-6 rounded-[32px] font-bold text-[11px] uppercase tracking-[0.5em] transition-all shadow-2xl ${training || dataset.length < 5 ? 'bg-zinc-100 text-zinc-300' : 'bg-[#1A1A1A] text-white hover:bg-[#D4AF37] hover:scale-105'}`}
             >
               {training ? 'Orchestrating Identity...' : 'Initialize Neural Training'}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonalModel;
