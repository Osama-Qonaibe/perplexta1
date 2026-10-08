import React, { useState, useEffect } from 'react';

type MediaType = 'feed' | 'square' | 'reel' | 'story' | 'video';

interface MediaContainerProps {
  type: MediaType;
  src: string;
  isVideo?: boolean;
}

export const StrictMediaContainer: React.FC<MediaContainerProps> = ({ type = 'feed', src, isVideo = false }) => {
  const [detectedCategory, setDetectedCategory] = useState<'portrait' | 'square' | 'landscape' | null>(null);

  // Categorize aspect ratios with strict mathematical thresholds
  const categorizeRatio = (ratio: number): 'portrait' | 'square' | 'landscape' => {
    if (ratio > 1.15) return 'landscape'; // Horizontal / Wide (16:9, 4:3)
    if (ratio < 0.85) return 'portrait';  // Vertical / Tall (4:5, 9:16)
    return 'square';                      // Square (1:1)
  };

  useEffect(() => {
    if (isVideo || !src) return;

    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      setDetectedCategory(categorizeRatio(img.naturalWidth / img.naturalHeight));
    } else {
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setDetectedCategory(categorizeRatio(img.naturalWidth / img.naturalHeight));
        }
      };
    }
  }, [src, isVideo]);

  const handleMediaLoad = (width: number, height: number) => {
    if (width && height) {
      setDetectedCategory(categorizeRatio(width / height));
    }
  };

  let resolvedCategory: 'portrait' | 'square' | 'landscape';

  if (type === 'reel' || type === 'story') {
    resolvedCategory = 'portrait';
  } else if (type === 'video') {
    resolvedCategory = 'landscape';
  } else if (type === 'square') {
    resolvedCategory = 'square';
  } else {
    resolvedCategory = detectedCategory || 'square';
  }

  // Unified Frame aspect-ratio alignment
  let containerClass = 'relative w-full overflow-hidden bg-black/90 dark:bg-black/95 flex items-center justify-center select-none transition-all duration-300';

  if (type === 'reel' || type === 'story') {
    containerClass += ' aspect-[9/16] max-h-[580px]';
  } else if (resolvedCategory === 'portrait') {
    // Bounded portrait container (Facebook 4:5 style) to prevent huge scrolling disruption
    containerClass += ' aspect-[4/5] max-h-[520px]';
  } else if (resolvedCategory === 'landscape') {
    containerClass += ' aspect-video';
  } else {
    // Square (1:1)
    containerClass += ' aspect-square';
  }

  const needsAmbientBackdrop = !isVideo && (resolvedCategory === 'portrait' || resolvedCategory === 'landscape');

  return (
    <div className={containerClass}>
      {/* Facebook-Style Premium Ambient Blur Backdrop for non-square media */}
      {needsAmbientBackdrop && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 dark:opacity-30 scale-125 pointer-events-none select-none z-0"
          />
          {/* Soft vignette overlay to highlight centered graphic */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none z-0" />
        </>
      )}

      {isVideo ? (
        <video
          src={src}
          controls
          playsInline
          onLoadedMetadata={(e) => handleMediaLoad(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
          className="relative z-10 w-full h-full object-contain select-none mx-auto"
        />
      ) : (
        <img
          src={src}
          alt="Post media content"
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={(e) => handleMediaLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          className={`relative z-10 w-full h-full ${
            resolvedCategory === 'square' ? 'object-cover' : 'object-contain p-1 sm:p-2 filter drop-shadow-xl'
          } select-none mx-auto`}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true';
              target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
            }
          }}
        />
      )}
    </div>
  );
};





