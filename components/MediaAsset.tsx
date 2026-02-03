
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
        // Autoplay policy might block initial play, silent fail is fine
      });
    }
  }, [src, type, autoPlay]);

  const handleLoaded = () => {
    setLoading(false);
  };

  const fallback = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800";

  if (error) {
    return <img src={fallback} className={`${className} opacity-50 grayscale`} alt="Error fallback" />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-emerald-50/50 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      
      {type === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          onLoadedData={handleLoaded}
          onCanPlay={handleLoaded}
          onLoadedMetadata={handleLoaded}
          onError={() => setError(true)}
          playsInline
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
          onLoad={handleLoaded}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default MediaAsset;
