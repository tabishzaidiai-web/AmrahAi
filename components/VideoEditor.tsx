
import React, { useState, useRef, useEffect } from 'react';
import { BrandKit } from '../types';

interface VideoEditorProps {
  videoUrl: string;
  brandKit: BrandKit;
  onSave: (editedSettings: any) => void;
  onCancel: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoUrl, brandKit, onSave, onCancel }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [activeFilter, setActiveFilter] = useState('none');
  const [aspectRatio, setAspectRatio] = useState<'16/9' | '9/16' | '1/1'>('16/9');
  
  // Trimming state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const filters = [
    { id: 'none', label: 'Original', settings: { b: 100, c: 100, s: 100, se: 0 } },
    { id: 'maison', label: 'Maison Mono', settings: { b: 110, c: 130, s: 0, se: 0 } },
    { id: 'vintage', label: 'Vintage Gold', settings: { b: 95, c: 110, s: 80, se: 40 } },
    { id: 'editorial', label: 'Editorial', settings: { b: 105, c: 115, s: 110, se: 0 } },
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      if (video.currentTime < startTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [startTime, endTime]);

  const applyPreset = (filter: typeof filters[0]) => {
    setActiveFilter(filter.id);
    setBrightness(filter.settings.b);
    setContrast(filter.settings.c);
    setSaturation(filter.settings.s);
    setSepia(filter.settings.se);
  };

  const handleSave = () => {
    // In a real app, we might use FFmpeg.wasm to process the video.
    // Here we simulate saving the metadata settings.
    alert("Video refinements metadata secured. (In production, this triggers server-side re-encoding)");
    onSave({ brightness, contrast, saturation, sepia, aspectRatio, startTime, endTime });
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#0D0D0D]/95 backdrop-blur-2xl flex items-center justify-center p-8 md:p-20 overflow-hidden animate-in fade-in duration-500">
      <div className="w-full h-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Preview Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.5em]">Film Refinement</span>
              <h2 className="text-3xl font-serif text-white italic">Cinematic Master</h2>
            </div>
            <button onClick={onCancel} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 bg-black/40 rounded-[48px] border border-white/5 relative overflow-hidden flex items-center justify-center shadow-2xl">
            <div 
              className="relative overflow-hidden transition-all duration-700 shadow-2xl bg-zinc-900"
              style={{ 
                aspectRatio: aspectRatio.replace('/', ':'),
                width: aspectRatio === '16/9' ? '100%' : aspectRatio === '9/16' ? '40%' : '60%',
                maxHeight: '100%'
              }}
            >
              <video 
                ref={videoRef}
                src={videoUrl} 
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%)` }}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>

          {/* Timeline / Trimming */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-4">
             <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase tracking-widest">
                <span>Timeline Trim</span>
                <span>{startTime.toFixed(1)}s - {endTime.toFixed(1)}s</span>
             </div>
             <div className="relative h-12 bg-black/20 rounded-xl overflow-hidden flex items-center px-2">
                <input 
                  type="range" 
                  min="0" 
                  max={duration} 
                  step="0.1"
                  value={startTime} 
                  onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime - 0.5))}
                  className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <input 
                  type="range" 
                  min="0" 
                  max={duration} 
                  step="0.1"
                  value={endTime} 
                  onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime + 0.5))}
                  className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="h-2 bg-white/10 w-full rounded-full overflow-hidden relative">
                   <div 
                     className="absolute h-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                     style={{ 
                       left: `${(startTime / duration) * 100}%`, 
                       width: `${((endTime - startTime) / duration) * 100}%` 
                     }} 
                   />
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[48px] p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
          
          {/* Aspect Ratio */}
          <div className="space-y-4">
             <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] block">Frame Orientation</span>
             <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '16/9', label: '16:9' },
                  { id: '9/16', label: '9:16' },
                  { id: '1/1', label: '1:1' }
                ].map(ratio => (
                  <button 
                    key={ratio.id} 
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`py-3 rounded-xl text-[8px] font-bold uppercase transition-all border ${aspectRatio === ratio.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
                  >
                    {ratio.label}
                  </button>
                ))}
             </div>
          </div>

          {/* Visual Effects */}
          <div className="space-y-6">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] block">Visual Grading</span>
            <div className="grid grid-cols-2 gap-3">
              {filters.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => applyPreset(f)} 
                  className={`py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all border ${activeFilter === f.id ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tuning */}
          <div className="space-y-6">
             {[
                { label: 'Brightness', val: brightness, set: setBrightness },
                { label: 'Contrast', val: contrast, set: setContrast },
                { label: 'Saturation', val: saturation, set: setSaturation }
             ].map((ctrl) => (
                <div key={ctrl.label} className="space-y-2">
                   <div className="flex justify-between text-[8px] font-bold text-white/60 uppercase tracking-widest">
                      <span>{ctrl.label}</span>
                      <span>{ctrl.val}%</span>
                   </div>
                   <input type="range" min="0" max="200" value={ctrl.val} onChange={(e) => ctrl.set(parseInt(e.target.value))} className="w-full accent-[#D4AF37] opacity-60 hover:opacity-100" />
                </div>
             ))}
          </div>

          <div className="mt-auto space-y-4">
            <button onClick={handleSave} className="w-full py-6 bg-[#D4AF37] text-white font-bold rounded-[32px] text-[10px] uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Export Refined Film</button>
            <button onClick={onCancel} className="w-full py-6 bg-white/5 text-white/60 font-bold rounded-[32px] text-[10px] uppercase tracking-[0.5em] border border-white/5 hover:bg-white/10 transition-all">Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
