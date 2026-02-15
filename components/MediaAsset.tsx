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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  useEffect(() => {
    if (type === 'video' && videoRef.current && autoPlay) {
      videoRef.current.play().catch(() => {
        // Autoplay policy might block initial play
      });
    }
  }, [src, type, autoPlay]);

  const handleLoaded = () => {
    setLoading(false);
  };

  // High quality editorial fallback
  const fallback = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";

  return (
    <div className={`relative overflow-hidden ${className} bg-gray-50`}>
      {loading && !error && (
        <div className="absolute inset-0 bg-emerald-50/50 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
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
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          onLoadedData={handleLoaded}
          onCanPlay={handleLoaded}
          onLoadedMetadata={handleLoaded}
          onError={() => {
            console.warn(`Video failed to load: ${src}`);
            setError(true);
          }}
          playsInline
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`}
          onLoad={handleLoaded}
          onError={() => {
            console.warn(`Image failed to load: ${src}`);
            setError(true);
          }}
        />
      )}
    </div>
  );
};

export default MediaAsset;