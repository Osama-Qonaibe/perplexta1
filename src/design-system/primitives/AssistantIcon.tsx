/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — ASSISTANT ICON PRIMITIVE
 * 
 * Branded AI assistant icon with spin state, directional awareness,
 * and seamless theme integration using the real logo from site settings/control panel.
 */

import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { resolveImageUrl } from '../../utils/imageResolver';
import { NotificationIconRenderer } from '../../utils/imageProcessor';

export interface AssistantIconProps {
  size?: number;
  isSpinning?: boolean;
  dir?: 'ltr' | 'rtl';
  className?: string;
  fallbackType?: 'cpu' | 'sparkles';
  shape?: 'circle' | 'square';
  spinDirection?: 'normal' | 'reverse';
}

export const AssistantIcon: React.FC<AssistantIconProps> = ({
  size = 14,
  isSpinning = false,
  dir = 'ltr',
  className = '',
  fallbackType = 'cpu',
  shape = 'square',
  spinDirection = 'normal',
}) => {
  const { siteSettings, theme, language } = useAppContext();
  const isRtl = language === 'ar';

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64) 
    ? siteSettings?.logoLightBase64 
    : siteSettings?.logoBase64;
  const logoUrl = rawLogo ? resolveImageUrl(rawLogo, 'general') : null;
  const displayName = isRtl 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  const spinClass = isSpinning 
    ? (spinDirection === 'reverse' ? 'animate-spin-reverse' : 'animate-spin') 
    : '';

  const fallback = fallbackType === 'cpu' ? (
    <Cpu
      size={size}
      className={`text-accent shrink-0 transition-transform ${spinClass}`}
    />
  ) : (
    <Sparkles
      size={size}
      className={`text-accent shrink-0 transition-transform ${spinClass}`}
    />
  );

  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-shape-sm';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      dir={dir}
    >
      {logoUrl ? (
        <div 
          className={`${radiusClass} overflow-hidden flex items-center justify-center shrink-0 transition-transform ${spinClass}`}
          style={{ width: `${size + 2}px`, height: `${size + 2}px` }}
        >
          <NotificationIconRenderer
            src={logoUrl}
            alt={displayName}
            size={size + 2}
            className="w-full h-full object-contain block"
            fallbackIcon={fallback}
          />
        </div>
      ) : (
        fallback
      )}
    </span>
  );
};
