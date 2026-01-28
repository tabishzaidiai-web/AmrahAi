
import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  const fallback = "https://images.unsplash.com/photo-1560343060-c147b7da1f11?auto=format&fit=crop&q=80&w=800"; // Elegant placeholder

  if (error) {
    return <img src={fallback} className={`${className} opacity-50 grayscale`} alt="Error fallback" />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-emerald-50/50 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      
      {type === 'video' ? (
        <video
          src={src}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          onLoadedData={() => setLoading(false)}
          onError={() => setError(true)}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default MediaAsset;
