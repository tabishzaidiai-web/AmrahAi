import React, { useState, useEffect, useRef } from 'react';

interface MediaAssetProps {
  src: string;
  type?: 'image' | 'video';
  alt?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const MediaAsset: React.FC<MediaAssetProps> = ({ 
  src, 
  type = 'image', 
  alt = 'Asset', 
  className = '',
  controls = false,
  autoPlay = true,
  loop = true,
  muted = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    if (type === 'video' && videoRef.current) {
      videoRef.current.load();
    }
  }, [src, type]);

  useEffect(() => {
    const video = videoRef.current;
    if (type === 'video' && video && autoPlay) {
      const playVideo = async () => {
        try {
          await video.play();
          setIsPaused(false);
        } catch (err) {
          console.warn("Autoplay blocked or failed:", err);
          setIsPaused(true);
        }
      };
      playVideo();
    }
  }, [src, type, autoPlay]);

  const handleLoaded = () => {
    setLoading(false);
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPaused(false);
    }
  };

  // High quality editorial fallback
  const fallback = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";

  return (
    <div className={`relative overflow-hidden ${className} bg-gray-50 flex items-center justify-center`}>
      {loading && !error && (
        <div className="absolute inset-0 bg-emerald-50/50 backdrop-blur-[2px] animate-pulse flex items-center justify-center z-10">
          <div className="w-10 h-10 border-2 border-gold/10 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      
      {isPaused && !loading && type === 'video' && (
        <button 
          onClick={handleManualPlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all group"
        >
          <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-emerald-950 shadow-2xl scale-100 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
      
      {error ? (
        <img 
          src={fallback} 
          className={`${className} opacity-20 grayscale transition-opacity duration-1000`} 
          alt="Asset unavailable" 
        />
      ) : type === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700 w-full h-full object-cover`}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          onLoadedData={handleLoaded}
          onCanPlayThrough={handleLoaded}
          onPlaying={handleLoaded}
          onPause={() => setIsPaused(true)}
          onPlay={() => setIsPaused(false)}
          onError={(e) => {
            console.error(`Video Error:`, e);
            setError(true);
            setLoading(false);
          }}
          playsInline
          webkit-playsinline="true"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700 w-full h-full object-cover`}
          onLoad={handleLoaded}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </div>
  );
};

export default MediaAsset;