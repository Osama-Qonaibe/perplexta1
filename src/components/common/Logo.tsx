import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';
import { Sparkles, Cpu } from 'lucide-react';

export interface LogoProps {
  size?: number;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  fallbackType?: 'cpu' | 'sparkles' | 'brand';
  shape?: 'rounded' | 'circle' | 'none';
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  className = '',
  showName = false,
  nameClassName = 'font-bold text-sm text-[var(--text-primary)] font-sans tracking-tight',
  fallbackType = 'brand',
  shape = 'rounded',
}) => {
  const { siteSettings, theme, language } = useAppContext();
  const isRtl = language === 'ar';
  const shapeClass = shape === 'circle' 
    ? 'rounded-full' 
    : shape === 'none' 
    ? '' 
    : 'rounded-shape-sm';

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : siteSettings?.logoBase64;
  
  // Prefer custom uploaded logo, then official brand default-logo.svg
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo, 'general') : '/brand/default-logo.svg';
  
  const displayName = isRtl 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  // Simple icon fallback without nested box/borders
  const iconFallback = fallbackType === 'cpu' ? (
    <Cpu size={Math.max(14, Math.round(size * 0.5))} className="text-accent" />
  ) : fallbackType === 'sparkles' ? (
    <Sparkles size={Math.max(14, Math.round(size * 0.5))} className="text-accent" />
  ) : (
    <img
      src="/brand/default-logo.svg"
      alt={displayName}
      width={size}
      height={size}
      className="w-full h-full object-contain block"
      loading="eager"
      decoding="async"
    />
  );

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 select-none ${className}`}>
      <div 
        className={`${shape === 'none' ? '' : `border border-[var(--border-default)] bg-[var(--surface-subtle)] shadow-2xs ${shapeClass}`} overflow-hidden flex items-center justify-center shrink-0 relative`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <NotificationIconRenderer
          src={logoUrl}
          alt={displayName}
          size={size}
          className="w-full h-full object-contain block"
          fallbackIcon={iconFallback}
        />
      </div>
      {showName && (
        <span className={nameClassName}>
          {displayName}
        </span>
      )}
    </div>
  );
};

