// Perplexta / RATAQ Sovereign Studio - Brand Kit Architecture & System

export interface BrandKitLogoItem {
  id: string;
  titleAr: string;
  titleEn: string;
  type: 'primary' | 'light' | 'dark' | 'icon';
  url: string;
}

export interface BrandKitCustomFont {
  id: string;
  name: string;
  url: string;
  format: string;
}

export interface StudioBrandKit {
  brandName: string;
  brandNameEn: string;
  taglineAr: string;
  taglineEn: string;
  logos: BrandKitLogoItem[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
    custom: string[];
  };
  fonts: {
    heading: string;
    subheading: string;
    body: string;
    customFonts: BrandKitCustomFont[];
  };
}

export const DEFAULT_BRAND_KIT: StudioBrandKit = {
  brandName: 'استوديو رينكس',
  brandNameEn: 'Rinex Sovereign Studio',
  taglineAr: 'بيئة التصميم الرقمي والإنتاج الإبداعي المتقدم',
  taglineEn: 'Professional Sovereign Digital Design & Creative Suite',
  logos: [
    {
      id: 'logo-primary',
      titleAr: 'الشعار الأساسي (المعتمد)',
      titleEn: 'Primary Official Logo',
      type: 'primary',
      url: '/brand/default-logo.svg'
    },
    {
      id: 'logo-dark-watermark',
      titleAr: 'شعار الداكن / الشفاف',
      titleEn: 'Dark Watermark Logo',
      type: 'dark',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="%230f172a"/><circle cx="100" cy="100" r="60" fill="none" stroke="%2338bdf8" stroke-width="8"/><polygon points="100,50 145,130 55,130" fill="%2338bdf8" opacity="0.85"/></svg>'
    },
    {
      id: 'logo-icon-mark',
      titleAr: 'الأيقونة المصغرة (Monogram)',
      titleEn: 'App / Favicon Mark',
      type: 'icon',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="%236366f1"/><path d="M40 35 L80 35 L80 50 L58 50 L78 85 L58 85 L40 54 Z" fill="white"/></svg>'
    }
  ],
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#10b981',
    dark: '#0f172a',
    light: '#f8fafc',
    custom: ['#f43f5e', '#f59e0b', '#06b6d4', '#4f46e5', '#ec4899', '#14b8a6']
  },
  fonts: {
    heading: 'Cairo, sans-serif',
    subheading: 'Tajawal, sans-serif',
    body: 'Tajawal, sans-serif',
    customFonts: [
      {
        id: 'font-cairo-local',
        name: 'Cairo Bold',
        url: 'https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap',
        format: 'woff2'
      },
      {
        id: 'font-tajawal-local',
        name: 'Tajawal Regular',
        url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap',
        format: 'woff2'
      }
    ]
  }
};

const BRAND_KIT_STORAGE_PREFIX = 'perplexta_studio_brandkit_';

export function getStoredBrandKit(userId?: string | number, siteSettings?: any): StudioBrandKit {
  if (!userId || userId === 'guest') {
    return {
      brandName: siteSettings?.siteNameAr || 'استوديو رينكس',
      brandNameEn: 'Rinex Sovereign Studio',
      taglineAr: 'بيئة التصميم الرقمي والإنتاج الإبداعي المتقدم',
      taglineEn: 'Professional Sovereign Digital Design & Creative Suite',
      logos: [],
      colors: { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#10b981', dark: '#0f172a', light: '#f8fafc', custom: [] },
      fonts: { heading: 'Cairo, sans-serif', subheading: 'Tajawal, sans-serif', body: 'Tajawal, sans-serif', customFonts: [] }
    };
  }
  try {
    const key = `${BRAND_KIT_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    let kit = DEFAULT_BRAND_KIT;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        kit = {
          ...DEFAULT_BRAND_KIT,
          ...parsed,
          colors: {
            ...DEFAULT_BRAND_KIT.colors,
            ...(parsed.colors || {})
          },
          fonts: {
            ...DEFAULT_BRAND_KIT.fonts,
            ...(parsed.fonts || {})
          },
          logos: Array.isArray(parsed.logos) && parsed.logos.length > 0 ? parsed.logos : DEFAULT_BRAND_KIT.logos
        };
      }
    }

    // Enhance with live siteSettings if primary logo is missing or default
    if (siteSettings?.logoBase64 && kit.logos[0]) {
      kit.logos[0].url = siteSettings.logoBase64;
    }
    if (siteSettings?.siteNameAr) {
      kit.brandName = siteSettings.siteNameAr;
    }
    return kit;
  } catch (err) {
    console.warn('Failed to parse brand kit from storage', err);
    return DEFAULT_BRAND_KIT;
  }
}

export function saveStoredBrandKit(userId: string | number | undefined, kit: StudioBrandKit): void {
  try {
    const key = `${BRAND_KIT_STORAGE_PREFIX}${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(kit));
  } catch (err) {
    console.warn('Failed to save brand kit to storage', err);
  }
}
