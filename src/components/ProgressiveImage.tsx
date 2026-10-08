import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  className = '',
  wrapperClassName = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const fallbackImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23161b22"/><circle cx="200" cy="150" r="40" fill="%2310b981" opacity="0.3"/><path d="M185 150 L200 135 L215 150" stroke="%2310b981" stroke-width="3" fill="none"/></svg>';
  const activeSrc = isError ? (placeholderSrc || fallbackImage) : src;

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-[var(--surface-card)] ${wrapperClassName}`}>
      {/* Low-res or blur placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-[var(--surface-subtle)] animate-pulse filter blur-xl scale-110" />
      )}

      {placeholderSrc && !isLoaded && !isError && (
        <img
          src={placeholderSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-slow ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}

      {/* High-res image */}
      <motion.img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{
          opacity: (isLoaded || isError) ? 1 : 0,
          filter: isLoaded ? 'blur(0px)' : 'blur(5px)',
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-theme ${className}`}
        loading="lazy"
      />
    </div>
  );
};
