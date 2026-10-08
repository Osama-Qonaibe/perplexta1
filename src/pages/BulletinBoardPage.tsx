import { secureStorage } from "@/lib/storage";
import { getPostShareUrl, getPageShareUrl, getPostShareText, getPageShareText } from "@/utils/shareUtils";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { useNavigate, useLocation, useParams, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  Megaphone, Plus, Search, Heart, MessageSquare, Share2, Bookmark, Gift,
  Phone, Video, CheckCircle2, Eye, Sparkles,
  Send, X, Wallet, Tag, MessageCircle, Building2, MapPin, Globe, Type,
  UserCheck, UserPlus, Inbox, ArrowRight, ArrowLeft, ShieldCheck, Camera, User, Calendar,
  Image as ImageIcon, Filter, ChevronLeft, ChevronRight, Layers, Loader2, BarChart2, ArrowUp, ArrowDown, RefreshCw, Rocket,
  Radio, Clapperboard, Bell, Menu, SlidersHorizontal, Trash2, Ban, Volume2, VolumeX,
  Smile, Users, Compass, ChevronDown, Check, Navigation, Lock, Scissors, Edit2, Upload,
  AtSign, Hash, Settings, Cpu, ArrowUpDown, Languages, MessageSquareText, Copy, Briefcase, Link, ExternalLink, CheckCircle, Target, Crosshair,
  Music, HelpCircle
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageResolver';
import { NotificationIconRenderer } from '../utils/imageProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { BulletinAd, BulletinAdComment, BulletinPage, MediaGalleryItem } from '../../server/db/types';
import { UserAdAnalyticsView } from '../components/UserAdAnalyticsView';
import { PostFeed } from '../components/PostFeed';
import { BoardFeed } from '../components/bulletin/BoardFeed';
import { SavedPostsTab } from '../components/bulletin/SavedPostsTab';
import { InquiriesTab } from '../components/bulletin/InquiriesTab';
import { LiveStreamModal } from '../components/bulletin/LiveStreamModal';
import { AdMessengerHub } from '../components/AdMessengerHub';
import { AdPromotionStudioView } from '../components/AdPromotionStudioView';
import { RecommendationWidget } from '../components/RecommendationWidget';
import { MediaFormatPlayer } from '../components/MediaFormatPlayer';
import { VideoTrimmerModal } from '../components/VideoTrimmerModal';
import { VideoPreviewer } from '../components/VideoPreviewer';
import { ReelsFeed } from '../components/ReelsFeed';
import { StoryUploadModal } from '../components/StoryUploadModal';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { ViralMediaStudioModal, MediaProjectState } from '../components/bulletin/studio';

import { MediaManagerModal } from '../components/MediaManagerModal';
import { ComposerMediaPreview } from '../components/ComposerMediaPreview';
import { AudioLibraryPickerModal, AudioTrackItem } from '../components/bulletin/AudioLibraryPickerModal';
import { MediaLightboxModal, LightboxMediaItem } from '../components/MediaLightboxModal';
import { triggerHaptic } from '../utils/haptics';
import { triggerSuccessConfetti } from '../utils/confetti';
import { BulletinAvatar } from '../components/BulletinAvatar';
import { ImageUploadDropzone } from '../components/ImageUploadDropzone';
import { optimizeImageUpload, RECOMMENDED_IMAGE_SPECS } from '../utils/imageOptimizer';
import { extractVideoMetadata, extractVideoThumbnail, getRecommendedDimensions, getMediaUrl, compressAndResizeImage, extractVideoUrlFromAd } from '../utils/mediaUtils';
import { stopAllMedia, getGlobalMuteState, setGlobalMuteState } from '../utils/mediaCoordinator';
import { SOCIAL_COLORS } from '../constants/socialColors';
import { isPathBlocked } from '../utils/sectionVisibility';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AppModal, toast, useConfirm } from '@/design-system';
import { SearchableSelect } from '../components/SearchableSelect';
import { LocationAutocompleteInput } from '../components/LocationAutocompleteInput';
import { CategoryAutocompleteInput } from '../components/CategoryAutocompleteInput';
import { CATEGORY_GROUPS } from '../constants/categories';
import { UniversalLocationModal } from '../components/common/UniversalLocationModal';
import {
  normalizeGeoText,
  StandardGeoResult,
} from '../constants/geoData';

const VIRALBOOK_CATEGORIES = [
  { id: 'all', labelAr: 'كافة الفئات والقطاعات', labelEn: 'All Categories' },
  { id: 'e-commerce', labelAr: 'التجارة الإلكترونية والتسوق', labelEn: 'E-Commerce & Retail' },
  { id: 'technology', labelAr: 'التكنولوجيا والبرمجيات والذكاء الاصطناعي', labelEn: 'Tech & AI' },
  { id: 'construction', labelAr: 'البناء والديكور والمقاولات والمنزل', labelEn: 'Construction & Home' },
  { id: 'real-estate', labelAr: 'العقارات والاستثمار العقاري', labelEn: 'Real Estate' },
  { id: 'automotive', labelAr: 'السيارات والمحركات وقطع الغيار', labelEn: 'Automotive & Vehicles' },
  { id: 'health', labelAr: 'الصحة والطب والرعاية والتجميل', labelEn: 'Health & Medical' },
  { id: 'food-dining', labelAr: 'المطاعم والأغذية والمقاهي والحلويات', labelEn: 'Food & Dining' },
  { id: 'education', labelAr: 'التعليم والتدريب واللغات والجامعات', labelEn: 'Education & Training' },
  { id: 'services', labelAr: 'الخدمات المهنية والأعمال والتسويق', labelEn: 'Business & Professional Services' },
  { id: 'tourism', labelAr: 'السياحة والسفر وفنادق والترفيه', labelEn: 'Tourism & Travel' },
  { id: 'industry', labelAr: 'الصناعة والزراعة والمعدات الثقيلة', labelEn: 'Industry & Agriculture' },
  { id: 'jobs', labelAr: 'فرص العمل والتوظيف', labelEn: 'Jobs & Careers' }
];

const VIRALBOOK_SORT_OPTIONS = [
  { id: 'latest', labelAr: 'الأحدث', labelEn: 'Latest' },
  { id: 'popular', labelAr: 'الأكثر تفاعلاً', labelEn: 'Popular' },
];

interface LocationSearchResult {
  display_name: string;
  city: string;
  title?: string;
  subtitle?: string;
  state?: string;
  country: string;
  country_code?: string;
  flag?: string;
  lat: string;
  lon: string;
  raw_type?: string;
  category_label?: string;
  place_type?: string;
  parentCity?: string;
}

const getPlaceCategoryLabel = (item: LocationSearchResult, isRtl: boolean = true): string => {
  if (item.category_label) return item.category_label;
  const rawType = (item.raw_type || item.place_type || '').toLowerCase();
  if (rawType.includes('city') || rawType.includes('municipality')) return isRtl ? 'مدينة' : 'City';
  if (rawType.includes('town')) return isRtl ? 'بلدة' : 'Town';
  if (rawType.includes('village') || rawType.includes('hamlet')) return isRtl ? 'قرية' : 'Village';
  if (rawType.includes('suburb') || rawType.includes('neighbourhood') || rawType.includes('quarter')) return isRtl ? 'حي' : 'Neighborhood';
  if (rawType.includes('road') || rawType.includes('street') || rawType.includes('highway')) return isRtl ? 'شارع' : 'Street';
  if (rawType.includes('district') || rawType.includes('county') || rawType.includes('administrative') || rawType.includes('state')) return isRtl ? 'محافظة' : 'District';
  if (rawType.includes('building') || rawType.includes('landmark')) return isRtl ? 'معلم' : 'Landmark';
  return isRtl ? 'موقع جغرافي' : 'Location';
};

const getCountryCode = (countryName?: string): string => {
  if (!countryName || countryName === 'all') return '';
  const c = countryName.toLowerCase();
  if (c.includes('فلسطين') || c.includes('palestine')) return 'ps';
  if (c.includes('الأردن') || c.includes('jordan')) return 'jo';
  if (c.includes('السعودية') || c.includes('saudi')) return 'sa';
  if (c.includes('الإمارات') || c.includes('uae') || c.includes('emirates')) return 'ae';
  if (c.includes('مصر') || c.includes('egypt')) return 'eg';
  if (c.includes('قطر') || c.includes('qatar')) return 'qa';
  if (c.includes('الكويت') || c.includes('kuwait')) return 'kw';
  if (c.includes('عمان') || c.includes('oman')) return 'om';
  if (c.includes('البحرين') || c.includes('bahrain')) return 'bh';
  if (c.includes('العراق') || c.includes('iraq')) return 'iq';
  if (c.includes('لبنان') || c.includes('lebanon')) return 'lb';
  if (c.includes('سوريا') || c.includes('syria')) return 'sy';
  if (c.includes('اليمن') || c.includes('yemen')) return 'ye';
  if (c.includes('المغرب') || c.includes('morocco')) return 'ma';
  if (c.includes('الجزائر') || c.includes('algeria')) return 'dz';
  if (c.includes('تونس') || c.includes('tunisia')) return 'tn';
  if (c.includes('السودان') || c.includes('sudan')) return 'sd';
  if (c.includes('تركيا') || c.includes('turkey')) return 'tr';
  if (c.includes('المملكة المتحدة') || c.includes('uk')) return 'gb';
  if (c.includes('الولايات المتحدة') || c.includes('usa')) return 'us';
  if (c.includes('ألمانيا') || c.includes('germany')) return 'de';
  if (c.includes('فرنسا') || c.includes('france')) return 'fr';
  if (c.includes('كندا') || c.includes('canada')) return 'ca';
  return '';
};

const getCountryFlagEmoji = (countryCode?: string, countryName?: string): string => {
  if (countryCode && countryCode.length === 2) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  if (!countryName) return '🌐';
  if (countryName.includes('فلسطين')) return '🇵🇸';
  if (countryName.includes('الأردن')) return '🇯🇴';
  if (countryName.includes('السعودية')) return '🇸🇦';
  if (countryName.includes('الإمارات')) return '🇦🇪';
  if (countryName.includes('مصر')) return '🇪🇬';
  if (countryName.includes('قطر')) return '🇶🇦';
  if (countryName.includes('الكويت')) return '🇰🇼';
  if (countryName.includes('عمان') || countryName.includes('عُمان')) return '🇴🇲';
  if (countryName.includes('البحرين')) return '🇧🇭';
  if (countryName.includes('العراق')) return '🇮🇶';
  if (countryName.includes('لبنان')) return '🇱🇧';
  if (countryName.includes('سوريا')) return '🇸🇾';
  if (countryName.includes('اليمن')) return '🇾🇪';
  if (countryName.includes('المغرب')) return '🇲🇦';
  if (countryName.includes('الجزائر')) return '🇩🇿';
  if (countryName.includes('تونس')) return '🇹🇳';
  if (countryName.includes('السودان')) return '🇸🇩';
  if (countryName.includes('تركيا')) return '🇹🇷';
  if (countryName.includes('المملكة المتحدة') || countryName.includes('بريطانيا')) return '🇬🇧';
  if (countryName.includes('الولايات المتحدة') || countryName.includes('أمريكا')) return '🇺🇸';
  if (countryName.includes('ألمانيا')) return '🇩🇪';
  if (countryName.includes('فرنسا')) return '🇫🇷';
  if (countryName.includes('كندا')) return '🇨🇦';
  return '🌍';
};

const FEELINGS = [
  { id: 'happy', labelAr: 'سعيد', labelEn: 'Happy', icon: '😊' },
  { id: 'blessed', labelAr: 'مبارك', labelEn: 'Blessed', icon: '😇' },
  { id: 'loved', labelAr: 'محبوب', labelEn: 'Loved', icon: '🥰' },
  { id: 'excited', labelAr: 'متحمس', labelEn: 'Excited', icon: '🤩' },
  { id: 'cool', labelAr: 'رائع', labelEn: 'Cool', icon: '😎' },
  { id: 'grateful', labelAr: 'ممتن', labelEn: 'Grateful', icon: '🙏' },
  { id: 'productive', labelAr: 'منتج', labelEn: 'Productive', icon: '💪' },
  { id: 'inspired', labelAr: 'ملهم', labelEn: 'Inspired', icon: '💡' },
];

export const BulletinBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeIdParam, subPath, subId } = useParams<{ id?: string; subPath?: string; subId?: string }>();
  const { language, setLanguage, user, token, setIsAuthModalOpen, theme, siteSettings, isMobile, refreshUser, t } = useAppContext();
  const isRtl = language === 'ar';

  const activeLogo = (theme === 'light' && siteSettings?.logoLightBase64)
    ? siteSettings.logoLightBase64
    : (siteSettings?.logoBase64 || siteSettings?.logoLightBase64 || null);

  const resolveActiveTabFromLocation = (): 'board' | 'reels' | 'pages' | 'inquiries' | 'my_ads' | 'analytics' | 'saved' => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const urlTab = searchParams.get('tab');

        if (urlTab === 'inquiries' || path.includes('/inquiries')) return 'inquiries';
        if (path.startsWith('/reels') || path.includes('/reels')) return 'reels';
        if (path.includes('/pages')) return 'pages';
        if (path.includes('/my-ads') || path.includes('/my_ads')) return 'my_ads';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/saved')) return 'saved';

        if (path === '/viralbook' || path === '/bulletin' || path === '/viralbook/' || path === '/bulletin/') {
          if (urlTab && urlTab !== 'board') {
            const validTabs = ['board', 'reels', 'pages', 'inquiries', 'my_ads', 'analytics', 'saved'];
            if (validTabs.includes(urlTab)) return urlTab as any;
          }
          return 'board';
        }

        const validTabs = ['board', 'reels', 'pages', 'inquiries', 'my_ads', 'analytics', 'saved'];
        if (urlTab && validTabs.includes(urlTab)) {
          return urlTab as any;
        }

        const savedTab = sessionStorage.getItem('perplexta_bulletin_active_tab') || localStorage.getItem('perplexta_bulletin_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
          return savedTab as any;
        }
      }
    } catch (e) {
    }
    return 'board';
  };

  const [activeTab, setActiveTab] = useState<'board' | 'reels' | 'pages' | 'inquiries' | 'my_ads' | 'analytics' | 'saved'>(resolveActiveTabFromLocation);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    const path = location.pathname.toLowerCase();

    if (urlTab === 'inquiries' || path.includes('/inquiries')) {
      if (activeTab !== 'inquiries') {
        setActiveTab('inquiries');
        fetchInquiries();
      }
    } else if (path === '/viralbook' || path === '/bulletin' || path === '/viralbook/' || path === '/bulletin/') {
      if (activeTab !== 'board' && !urlTab) {
        setActiveTab('board');
      }
    }

    const adIdParam = searchParams.get('ad_id');
    if (adIdParam) {
      const targetAdId = parseInt(adIdParam, 10);
      if (!isNaN(targetAdId)) {
        setTimeout(() => {
          const el = document.getElementById(`bulletin-ad-${targetAdId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-accent');
            setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2500);
          }
        }, 600);
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    try {
      sessionStorage.setItem('perplexta_bulletin_active_tab', activeTab);
      localStorage.setItem('perplexta_bulletin_active_tab', activeTab);
      if (typeof window !== 'undefined') {
        const tabToPathMap: Record<string, string> = {
          board: '/viralbook',
          reels: '/viralbook/reels',
          pages: '/viralbook/pages',
          inquiries: '/viralbook/inquiries',
          my_ads: '/viralbook/my-ads',
          analytics: '/viralbook/analytics',
          saved: '/viralbook/saved'
        };

        const targetPath = tabToPathMap[activeTab] || '/viralbook';
        const currentPath = window.location.pathname;

        const isExactOrSubMatch = currentPath === targetPath ||
          (activeTab === 'board' && (currentPath === '/viralbook' || currentPath === '/bulletin' || /^\/(?:viralbook|bulletin)\/\d+$/.test(currentPath))) ||
          (activeTab === 'reels' && (currentPath.startsWith('/viralbook/reels') || currentPath.startsWith('/reels')));

        if (!isExactOrSubMatch) {
          window.history.replaceState(null, '', targetPath);
        }

        if (window.location.search) {
          const url = new URL(window.location.href);
          if (url.searchParams.has('tab')) {
            url.searchParams.delete('tab');
            const cleanSearch = url.searchParams.toString();
            const newCleanUrl = url.pathname + (cleanSearch ? `?${cleanSearch}` : '') + url.hash;
            window.history.replaceState(null, '', newCleanUrl);
          }
        }
      }
    } catch (e) {
    }
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const restoreScroll = () => {
      try {
        const savedScroll = sessionStorage.getItem(`perplexta_scroll_${activeTab}`);
        if (savedScroll) {
          const scrollY = parseInt(savedScroll, 10);
          if (!isNaN(scrollY) && scrollY > 0) {
            const container = document.querySelector('.main-scroll-container');
            if (container) {
              container.scrollTop = scrollY;
            } else {
              window.scrollTo({ top: scrollY, behavior: 'instant' as any });
            }
          }
        }
      } catch (e) {}
    };

    timer = setTimeout(restoreScroll, 50);
    timer2 = setTimeout(restoreScroll, 150);

    const handleScroll = (e: Event) => {
      if (!active) return;
      try {
        const target = e.target as HTMLElement;
        if (target && (target.classList?.contains('main-scroll-container') || target === document.documentElement)) {
          if (!document.body.classList.contains('layout-locked') && !document.body.classList.contains('workspace-focus-mode')) {
            const scrollTop = target.scrollTop || window.scrollY;
            sessionStorage.setItem(`perplexta_scroll_${activeTab}`, String(scrollTop));
          }
        }
      } catch (e) {}
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timer2);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeTab]);

  // Ensure all background video/audio streams stop immediately when switching tabs
  useEffect(() => {
    stopAllMedia();
  }, [activeTab]);
  const [activeReelModalId, setActiveReelModalId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [messagingAdId, setMessagingAdId] = useState<number | null>(null);
  const [insightsAdId, setInsightsAdId] = useState<number | null>(null);

  const [ads, setAds] = useState<BulletinAd[]>([]);
  const [myAds, setMyAds] = useState<BulletinAd[]>([]);
  const [savedAds, setSavedAds] = useState<BulletinAd[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [previewingVideoStoryId, setPreviewingVideoStoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => {
    const raw = secureStorage.getSync('perplexta_user_countries');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        if (typeof raw === 'string' && raw.trim() && raw !== 'all') return raw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    const single = secureStorage.getSync('perplexta_user_country');
    return single && single !== 'all' ? [single] : [];
  });
  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    const raw = secureStorage.getSync('perplexta_user_cities');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        if (typeof raw === 'string' && raw.trim() && raw !== 'all') return raw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    const single = secureStorage.getSync('perplexta_user_city');
    return single && single !== 'all' ? [single] : [];
  });
  const [selectedRadius, setSelectedRadius] = useState<string>(() => {
    return secureStorage.getSync('perplexta_user_radius') || '10';
  });

  // Backward compatibility strings
  const selectedCountry = selectedCountries.length === 0 ? 'all' : selectedCountries.join('، ');
  const selectedCity = selectedCities.length === 0 ? 'all' : selectedCities.join('، ');

  const [isLocationFlyoutOpen, setIsLocationFlyoutOpen] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const headerLocationButtonRef = useRef<HTMLButtonElement>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawLogo = (theme === 'light' && siteSettings?.logoLightBase64)
    ? siteSettings?.logoLightBase64
    : siteSettings?.logoBase64;

  const currentCategoryLabel = useMemo(() => {
    const found = VIRALBOOK_CATEGORIES.find(c => c.id === selectedCategory);
    if (!found || found.id === 'all') {
      return isRtl ? 'الفئات' : 'Categories';
    }
    return isRtl ? found.labelAr : found.labelEn;
  }, [selectedCategory, isRtl]);

  const currentSortLabel = useMemo(() => {
    const found = VIRALBOOK_SORT_OPTIONS.find(s => s.id === sortBy);
    return found ? (isRtl ? found.labelAr : found.labelEn) : (isRtl ? 'الأحدث' : 'Latest');
  }, [sortBy, isRtl]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({ x: 0, y: 0, isOpen: false });

  const combinedReelsAds = useMemo(() => {
    const map = new Map<number, BulletinAd>();
    [...ads, ...myAds, ...savedAds].forEach(a => {
      if (!a || !a.id || a.ad_format === 'story' || (a as any).is_story) return;
      const vUrl = extractVideoUrlFromAd(a);
      if (vUrl) {
        map.set(Number(a.id), { ...a, video_url: vUrl });
      }
    });

    if (activeReelModalId !== null && !map.has(Number(activeReelModalId))) {
      const targetAd = ads.find(a => Number(a.id) === Number(activeReelModalId)) ||
                       myAds.find(a => Number(a.id) === Number(activeReelModalId)) ||
                       savedAds.find(a => Number(a.id) === Number(activeReelModalId));
      if (targetAd) {
        const vUrl = extractVideoUrlFromAd(targetAd) || targetAd.video_url || targetAd.image_url || '';
        map.set(Number(targetAd.id), { ...targetAd, video_url: vUrl });
      }
    }
    return Array.from(map.values());
  }, [ads, myAds, savedAds, activeReelModalId]);

  useEffect(() => {
    const handleOpenReelFullscreen = (e: any) => {
      const { adId, url } = e.detail || {};
      if (adId) {
        setActiveReelModalId(adId);
      } else if (url) {
        const found = combinedReelsAds.find(a => a.video_url === url || extractVideoUrlFromAd(a) === url);
        if (found) {
          setActiveReelModalId(found.id);
        } else if (ads.length > 0) {
          setActiveReelModalId(ads[0].id);
        } else {
          setActiveTab('reels');
        }
      } else {
        setActiveTab('reels');
      }
    };

    window.addEventListener('open-reel-fullscreen', handleOpenReelFullscreen as EventListener);
    return () => {
      window.removeEventListener('open-reel-fullscreen', handleOpenReelFullscreen as EventListener);
    };
  }, [combinedReelsAds, ads]);

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error(isRtl ? 'خاصية تحديد الموقع غير مدعومة في جهازك' : 'Geolocation is not supported');
      return;
    }
    setIsDetectingGps(true);
    const tId = toast.loading(isRtl ? 'جاري تحديد موقعك عبر GPS...' : 'Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/bulletin/geocoding/reverse?lat=${latitude}&lon=${longitude}&lang=${isRtl ? 'ar' : 'en'}`
          );
          const data = await res.json();
          const detectedCity = data.city || data.title || (isRtl ? 'موقعي الحالي' : 'Current Location');
          const detectedCountry = data.country || '';

          setSelectedCities([detectedCity]);
          if (detectedCountry) {
            setSelectedCountries([detectedCountry]);
            secureStorage.set('perplexta_user_countries', JSON.stringify([detectedCountry]));
          } else {
            setSelectedCountries([]);
            secureStorage.set('perplexta_user_countries', JSON.stringify([]));
          }
          secureStorage.set('perplexta_user_cities', JSON.stringify([detectedCity]));
          toast.dismiss(tId);
          toast.success(
            isRtl
              ? `🎯 تم تحديد موقعك: ${detectedCity} ${detectedCountry ? `(${detectedCountry})` : ''}`
              : `🎯 Location set: ${detectedCity} ${detectedCountry ? `(${detectedCountry})` : ''}`
          );
        } catch (e) {
          toast.dismiss(tId);
          toast.error(isRtl ? 'تعذر جلب تفاصيل العنوان لموقعك' : 'Failed to retrieve location details');
        } finally {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
        toast.dismiss(tId);
        toast.error(isRtl ? 'تعذر الحصول على إذن الموقع من الجهاز' : 'Failed to get location permission');
      },
      { timeout: 8000 }
    );
  };

  const [pagesList, setPagesList] = useState<BulletinPage[]>([]);
  const [myPagesList, setMyPagesList] = useState<BulletinPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState<boolean>(false);

  const [selectedPageDetail, setSelectedPageDetail] = useState<{ page: BulletinPage; ads: BulletinAd[] } | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: {
      id: number;
      name: string;
      avatar?: string;
      cover_image?: string | null;
      bio?: string;
      occupation?: string;
      location?: string;
      website_url?: string;
      custom_domain?: string;
      is_domain_verified?: boolean;
      social_links?: Record<string, string>;
      verified_links?: string[];
      email?: string;
      kyc_status?: string;
      role?: string;
      created_at?: Date | string;
      posts_count?: number;
      pages_count?: number;
    };
    ads: BulletinAd[];
  } | null>(null);
  const [pageDetailTab, setPageDetailTab] = useState<'ads' | 'about' | 'media'>('ads');

  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState<boolean>(false);
  const [isEditPageModalOpen, setIsEditPageModalOpen] = useState<boolean>(false);
  const [editingPageData, setEditingPageData] = useState<BulletinPage | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);
  const [isSubmittingPageEdit, setIsSubmittingPageEdit] = useState<boolean>(false);

  const [profileFormData, setProfileFormData] = useState({
    name: '',
    avatar: '',
    cover_image: '',
    email: '',
    occupation: '',
    location: '',
    bio: '',
    website_url: '',
    custom_domain: '',
    is_domain_verified: false,
    social_links: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      whatsapp: '',
      youtube: '',
      github: ''
    },
    verified_links: [] as string[],
    custom_instructions: '',
    language: 'ar',
    theme: 'light'
  });

  const [kycFullName, setKycFullName] = useState<string>('');
  const [kycIDNumber, setKycIDNumber] = useState<string>('');
  const [kycSelfieUrl, setKycSelfieUrl] = useState<string>('');
  const [kycTab, setKycTab] = useState<'info' | 'kyc'>('info');

  useEffect(() => {
    if (isProfileEditModalOpen && user) {
      setProfileFormData({
        name: user.name || '',
        avatar: user.avatar || '',
        cover_image: user.cover_image || '',
        email: user.email || '',
        occupation: user.occupation || '',
        location: user.location || '',
        bio: user.bio || user.custom_instructions || '',
        website_url: user.website_url || '',
        custom_domain: user.custom_domain || '',
        is_domain_verified: !!user.is_domain_verified,
        social_links: {
          facebook: user.social_links?.facebook || '',
          instagram: user.social_links?.instagram || '',
          linkedin: user.social_links?.linkedin || '',
          twitter: user.social_links?.twitter || '',
          whatsapp: user.social_links?.whatsapp || '',
          youtube: user.social_links?.youtube || '',
          github: user.social_links?.github || ''
        },
        verified_links: user.verified_links || [],
        custom_instructions: user.custom_instructions || '',
        language: (user as any).language || language || 'ar',
        theme: (user as any).theme || theme || 'light'
      });
    }
  }, [isProfileEditModalOpen, user]);

  const [editPageFormData, setEditPageFormData] = useState({
    name: '',
    category: '',
    city: '',
    address: '',
    description: '',
    avatar_url: '',
    cover_url: '',
    whatsapp_number: '',
    phone_number: '',
    website_url: '',
    lat: '',
    lon: ''
  });
  const [editPageManagers, setEditPageManagers] = useState<any[]>([]);
  const [newManagerEmail, setNewManagerEmail] = useState<string>('');
  const [newManagerRole, setNewManagerRole] = useState<'full' | 'limited'>('limited');

  useEffect(() => {
    if (editingPageData) {
      setEditPageFormData({
        name: editingPageData.name || '',
        category: editingPageData.category || 'تجارة إلكترونية / E-Commerce',
        city: editingPageData.city || 'غزة',
        address: editingPageData.address || '',
        description: editingPageData.description || '',
        avatar_url: editingPageData.avatar_url || '',
        cover_url: editingPageData.cover_url || '',
        whatsapp_number: editingPageData.whatsapp_number || '',
        phone_number: editingPageData.phone_number || '',
        website_url: editingPageData.website_url || '',
        lat: (editingPageData as any).lat || (editingPageData as any).latitude || '',
        lon: (editingPageData as any).lon || (editingPageData as any).longitude || ''
      });
      let managersList: any[] = [];
      if (editingPageData.managers) {
        try {
          managersList = typeof editingPageData.managers === 'string'
            ? JSON.parse(editingPageData.managers)
            : editingPageData.managers;
        } catch (e) {
          managersList = [];
        }
      }
      setEditPageManagers(Array.isArray(managersList) ? managersList : []);
    }
  }, [editingPageData]);

  useEffect(() => {
    if (user && isProfileEditModalOpen) {
      setKycFullName('');
      setKycIDNumber('');
      setKycSelfieUrl('');
      setKycTab('info');
    }
  }, [user, isProfileEditModalOpen]);

  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [inquiriesSearchTerm, setInquiriesSearchTerm] = useState<string>('');
  const [inquiriesLoading, setInquiriesLoading] = useState<boolean>(false);
  const [selectedInboxAd, setSelectedInboxAd] = useState<BulletinAd | null>(null);

  useEffect(() => {
    if (token) {
      fetchMyAds();
      fetchInquiries();
      fetchMyPages();
      fetchWallet();
    } else {
      setMyAds([]);
      setInquiriesList([]);
      setMyPagesList([]);
      setWalletBalance(0);
    }
  }, [token]);

  useEffect(() => {
    const handleOpenInquiries = () => {
      setSelectedPageDetail(null);
      setActiveTab('inquiries');
      fetchInquiries();
    };
    const handleInquiriesUpdated = () => {
      fetchInquiries();
    };

    window.addEventListener('open-bulletin-inquiries', handleOpenInquiries);
    window.addEventListener('bulletin-inquiry-updated', handleInquiriesUpdated);
    return () => {
      window.removeEventListener('open-bulletin-inquiries', handleOpenInquiries);
      window.removeEventListener('bulletin-inquiry-updated', handleInquiriesUpdated);
    };
  }, []);

  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const pullDistanceRef = useRef<number>(0);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);

  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState<boolean>(false);
  const [isStreamSetupOpen, setIsStreamSetupOpen] = useState<boolean>(false);
  const [streamTitleInput, setStreamTitleInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() => getGlobalMuteState());

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (typeof customEvent.detail?.muted === 'boolean') {
        setIsMuted(customEvent.detail.muted);
      }
    };
    window.addEventListener('perplexta:mute_change', handleMuteChange);
    return () => window.removeEventListener('perplexta:mute_change', handleMuteChange);
  }, []);
  const [currentFeedIndex, setCurrentFeedIndex] = useState<number>(0);
  const [liveComments, setLiveComments] = useState<{id: string, user: string, text: string}[]>([]);
  const [liveLikes, setLiveLikes] = useState<number>(0);
  const [liveViewers, setLiveViewers] = useState<number>(0);
  const [newLiveComment, setNewLiveComment] = useState<string>('');
  const [isGiftModalOpen, setIsGiftModalOpen] = useState<boolean>(false);
  const [giftsCatalog, setGiftsCatalog] = useState<any[]>([]);
  const [showLikeAnimation, setShowLikeAnimation] = useState<boolean>(false);

  const streamFeed = [
    { id: 'live-1', type: 'live', host: 'Ahmed Khalil', hostId: 101, title: isRtl ? 'تحليل السوق العقاري' : 'Real Estate Market Analysis', viewers: 1240 },
    { id: 'reel-1', type: 'reel', host: 'Sara Tech', hostId: 102, title: isRtl ? 'مراجعة آيفون 16 برو' : 'iPhone 16 Pro Review', viewers: 850 },
    { id: 'live-2', type: 'live', host: 'Mustafa Business', hostId: 103, title: isRtl ? 'أسرار النجاح في التجارة' : 'Success Secrets in Business', viewers: 2100 },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const storyPressTimerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveComment.trim()) return;
    setLiveComments(prev => [...prev, { id: Date.now().toString(), user: user?.name || (isRtl ? 'مستخدم' : 'User'), text: newLiveComment }]);
    setNewLiveComment('');
  };

  const handleLiveLike = () => {
    setLiveLikes(prev => prev + 1);
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const fetchGiftsCatalog = async () => {
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGiftsCatalog(data);
      }
    } catch (e) {
      console.error('Error fetching gifts:', e);
    }
  };

  const handleSendGift = async (gift: any) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          giftId: gift.id,
          recipientId: streamFeed[currentFeedIndex]?.hostId || 1,
          context: 'live'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl
          ? `تم إرسال ${gift.name_ar} بنجاح!`
          : `Sent ${gift.name_en} successfully!`
        );
        setIsGiftModalOpen(false);
        fetchWallet();
        setLiveComments(prev => [...prev, {
          id: Date.now().toString(),
          user: user?.name || (isRtl ? 'مستخدم' : 'User'),
          text: isRtl ? `أرسل هدية: ${gift.name_ar} ${gift.icon}` : `Sent a gift: ${gift.name_en} ${gift.icon}`
        }]);
      } else {
        toast.error(isRtl ? (data.error_ar || data.error) : data.error);
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال الهدية' : 'Error sending gift');
    }
  };

  const startLiveStream = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e: any) {
        if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            toast.info(isRtl ? 'تم تفعيل الكاميرا فقط (الميكروفون غير موجود).' : 'Camera only activated (microphone not found).');
          } catch (e2: any) {
            if (e2.name === 'NotFoundError' || e2.name === 'DevicesNotFoundError') {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              toast.info(isRtl ? 'تم تفعيل الميكروفون فقط (الكاميرا غير موجودة).' : 'Microphone only activated (camera not found).');
            } else {
              throw e2;
            }
          }
        } else {
          throw e;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      toast.error(isRtl ? 'تعذر الوصول إلى الكاميرا والميكروفون. يرجى التحقق من الصلاحيات.' : 'Could not access camera and microphone. Please check permissions.');
    }
  };

  const stopLiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let interval: any;
    if (isLiveStreamOpen) {
      startLiveStream();
      fetchGiftsCatalog();
      setLiveViewers(Math.floor(Math.random() * 1200) + 1500);
      setLiveLikes(Math.floor(Math.random() * 800));
      setLiveComments([]);

      interval = setInterval(() => {
        setLiveViewers(prev => {
          const drift = Math.floor(Math.random() * 51) - 25;
          const next = prev + drift;
          if (next < 1500) return 1500 + Math.floor(Math.random() * 200);
          if (next > 10000) return 10000 - Math.floor(Math.random() * 200);
          return next;
        });
      }, 3000);
    } else {
      stopLiveStream();
      setIsGiftModalOpen(false);
    }
    return () => {
      stopLiveStream();
      if (interval) clearInterval(interval);
    };
  }, [isLiveStreamOpen]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [isComposerDragging, setIsComposerDragging] = useState<boolean>(false);
  const [showMediaDropzone, setShowMediaDropzone] = useState<boolean>(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState<boolean>(false);
  const [storyUploadMode, setStoryUploadMode] = useState<'media' | 'text'>('media');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingAdId, setEditingAdId] = useState<number | null>(null);
  const [isSubmittingAd, setIsSubmittingAd] = useState<boolean>(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState<boolean>(false);
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>('all');
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    media_gallery: [] as MediaGalleryItem[],
    whatsapp_number: '',
    phone_number: '',
    target_url: '',
    hashtags: '',
    page_id: '' as string | number,
    location_city: 'القدس الشريف',
    location_radius: '10',
    feeling: '',
    is_ai_generated: false,
    tagged_users: [] as string[],
    has_whatsapp_button: false,
    audience: 'public' as 'public' | 'friends' | 'only_me',
    ad_format: 'post' as 'post' | 'reel' | 'story',
    quick_questions: ['', '', ''] as string[],
    aspect_ratio: 'grid' as string,
    audio_url: '',
    audio_title: '',
    audio_artist: '',
    audio_track_id: ''
  });

  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrackItem | null>(null);

  const [suggestionType, setSuggestionType] = useState<'none' | 'hashtag' | 'mention'>('none');
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/bulletin/hashtags/trending')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setTrendingHashtags(data.tags);
        }
      })
      .catch(err => console.error('[Hashtags client] Fetch failed:', err));
  }, []);

  useEffect(() => {
    if (suggestionType !== 'mention') return;
    const url = `/api/bulletin/mentions/suggest?q=${encodeURIComponent(suggestionQuery)}`;
    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setMentionSuggestions(data.results);
        }
      })
      .catch(err => console.error('[Mentions client] Fetch failed:', err));
  }, [suggestionType, suggestionQuery, token]);

  const handleComposerTextChange = (text: string) => {
    if (text.length > 1000) return;
    setAdFormData(prev => ({ ...prev, description: text }));

    const lastWord = text.split(/[\s\n]+/).pop() || '';
    if (lastWord.startsWith('#')) {
      setSuggestionType('hashtag');
      setSuggestionQuery(lastWord.slice(1));
    } else if (lastWord.startsWith('@')) {
      setSuggestionType('mention');
      setSuggestionQuery(lastWord.slice(1));
    } else {
      setSuggestionType('none');
      setSuggestionQuery('');
    }
  };

  const handleSelectSuggestion = (selectedVal: string) => {
    const text = adFormData.description;
    const words = text.split(/([\s\n]+)/);

    let replaced = false;
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i].trim().startsWith('#') && suggestionType === 'hashtag') {
        words[i] = selectedVal.startsWith('#') ? selectedVal : `#${selectedVal}`;
        replaced = true;
        break;
      }
      if (words[i].trim().startsWith('@') && suggestionType === 'mention') {
        words[i] = selectedVal.startsWith('@') ? selectedVal : `@${selectedVal}`;

        const cleanName = selectedVal.replace(/^@/, '');
        if (!adFormData.tagged_users.includes(cleanName)) {
          setAdFormData(prev => ({
            ...prev,
            tagged_users: [...prev.tagged_users, cleanName]
          }));
        }

        replaced = true;
        break;
      }
    }

    const newText = words.join('') + ' ';
    setAdFormData(prev => ({ ...prev, description: newText }));
    setSuggestionType('none');
    setSuggestionQuery('');
  };

  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);

  const directReelInputRef = useRef<HTMLInputElement>(null);
  const [isTrimmerModalOpen, setIsTrimmerModalOpen] = useState(false);
  const [trimmerVideoUrl, setTrimmerVideoUrl] = useState('');
  const [videoMetadataInfo, setVideoMetadataInfo] = useState<{
    fileSize?: number;
    duration?: number;
    resolution?: string;
    fileName?: string;
    uploadProgress?: number;
    processingStage?: 'idle' | 'uploading' | 'transcoding' | 'extracting' | 'done';
    localVideoUrl?: string;
  }>({ processingStage: 'done' });

  // Cleanup helper to revoke object URLs and eliminate memory leaks
  const cleanupComposerMediaUrls = React.useCallback(() => {
    if (videoMetadataInfo.localVideoUrl && videoMetadataInfo.localVideoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(videoMetadataInfo.localVideoUrl);
      } catch (_) {}
    }
    if (adFormData.video_url && adFormData.video_url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(adFormData.video_url);
      } catch (_) {}
    }
    (adFormData.media_gallery || []).forEach(item => {
      if (item.url && item.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.url);
        } catch (_) {}
      }
    });
  }, [videoMetadataInfo.localVideoUrl, adFormData.video_url, adFormData.media_gallery]);

  // Clean up any allocated client-side blob URLs when unmounting or navigating away
  useEffect(() => {
    return () => {
      cleanupComposerMediaUrls();
    };
  }, [cleanupComposerMediaUrls]);

  const [composerView, setComposerView] = useState<'main' | 'feelings' | 'location' | 'tagging' | 'emojis'>('main');
  const [userSearch, setUserSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedComposerCountry, setSelectedComposerCountry] = useState<string>('فلسطين');
  const [customLocationSearch, setCustomLocationSearch] = useState<string>('');

  const openReelUploadModal = () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      setIsAuthModalOpen(true);
      return;
    }
    if (directReelInputRef.current) {
      directReelInputRef.current.value = '';
      directReelInputRef.current.click();
    } else {
      const input = document.getElementById('direct-reel-video-input') as HTMLInputElement;
      if (input) {
        input.value = '';
        input.click();
      }
    }
  };

  const openPostUploadModal = () => {
    cleanupComposerMediaUrls();
    setAdFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      media_gallery: [],
      whatsapp_number: (user as any)?.phone || '',
      phone_number: '',
      target_url: '',
      hashtags: '',
      page_id: '' as string | number,
      location_city: 'القدس الشريف',
      location_radius: '10',
      feeling: '',
      is_ai_generated: false,
      tagged_users: [] as string[],
      has_whatsapp_button: false,
      audience: 'public' as 'public' | 'friends' | 'only_me',
      ad_format: 'post',
      quick_questions: ['', '', ''] as string[],
      aspect_ratio: 'grid',
      audio_url: '',
      audio_title: '',
      audio_artist: '',
      audio_track_id: ''
    });
    setSelectedAudioTrack(null);
    setVideoMetadataInfo({ processingStage: 'done' });
    setIsEditMode(false);
    setEditingAdId(null);
    setComposerView('main');
    setIsAdModalOpen(true);
  };


  // Dynamic Google Places / Geocoder query for Composer location picker with 350ms debouncing
  useEffect(() => {
    if (composerView !== 'location') {
      return;
    }

    const lang = isRtl ? 'ar' : 'en';
    const q = customLocationSearch.trim();
    const effectiveCountry = selectedComposerCountry !== 'all' ? selectedComposerCountry : '';

    setIsSearchingLocation(true);

    const controller = new AbortController();
    const delay = q ? 350 : 0;

    const timer = setTimeout(async () => {
      try {
        const queryParam = q ? `q=${encodeURIComponent(q)}&` : '';
        const res = await fetch(
          `/api/bulletin/geocoding/search?${queryParam}country=${encodeURIComponent(
            effectiveCountry
          )}&limit=25&lang=${lang}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            setLocationSuggestions(data.results);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Error fetching location suggestions:', e);
        }
      } finally {
        setIsSearchingLocation(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customLocationSearch, selectedComposerCountry, composerView, isRtl]);

  const [isPageModalOpen, setIsPageModalOpen] = useState<boolean>(false);
  const [isSubmittingPage, setIsSubmittingPage] = useState<boolean>(false);
  const [pageFormData, setPageFormData] = useState({
    name: '',
    category: 'تجارة إلكترونية / E-Commerce',
    city: 'غزة',
    address: '',
    description: '',
    avatar_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    cover_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    whatsapp_number: '',
    phone_number: '',
    website_url: ''
  });

  const [inquireAd, setInquireAd] = useState<BulletinAd | null>(null);
  const [inquiryText, setInquiryText] = useState<string>('');
  const [inquiryPhone, setInquiryPhone] = useState<string>('');
  const [isSendingInquiry, setIsSendingInquiry] = useState<boolean>(false);

  const [expandedAdId, setExpandedAdId] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, BulletinAdComment[]>>({});
  const [loadingCommentsAdId, setLoadingCommentsAdId] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    items: LightboxMediaItem[];
    initialIndex: number;
    postTitle?: string;
    authorName?: string;
    ad?: BulletinAd | null;
  }>({
    isOpen: false,
    items: [],
    initialIndex: 0,
    ad: null
  });

  const updateUrlWithPost = (postId: number | null) => {
    if (typeof window !== 'undefined') {
      const cleanUrl = postId ? `/viralbook/${postId}` : `/viralbook`;
      if (window.location.pathname !== cleanUrl) {
        window.history.pushState(null, '', cleanUrl);
      }
    }
  };

  const handleOpenLightbox = (url: string, items?: any[], index = 0, postTitle?: string, authorName?: string, ad?: BulletinAd) => {
    let resolvedItems: LightboxMediaItem[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      resolvedItems = items.map((it: any, i: number) => {
        if (typeof it === 'string') {
          return { id: `item-${i}`, url: it, type: 'image' };
        }
        return {
          id: it.id || `item-${i}`,
          url: it.url,
          type: it.type || (it.url?.endsWith('.mp4') ? 'video' : 'image'),
          caption: it.caption || '',
          thumbnailUrl: it.thumbnailUrl
        };
      });
    } else {
      resolvedItems = [{ id: 'item-0', url, type: url?.endsWith('.mp4') ? 'video' : 'image' }];
    }

    setLightboxState({
      isOpen: true,
      items: resolvedItems,
      initialIndex: index,
      postTitle,
      authorName,
      ad: ad || undefined
    });

    if (ad && ad.id) {
      updateUrlWithPost(ad.id);
    }
  };

  const setLightboxImage = (url: string | null) => {
    if (!url) {
      setLightboxState(prev => ({ ...prev, isOpen: false }));
      updateUrlWithPost(null);
    } else {
      handleOpenLightbox(url);
    }
  };
  const [isAddToPostModalOpen, setIsAddToPostModalOpen] = useState<boolean>(false);

  useModalScrollLock(activeReelModalId !== null, 'reels-viewer');

  const [boostingAd, setBoostingAd] = useState<BulletinAd | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState<boolean>(false);

  const isAnyModalOpen = isAdModalOpen ||
    isStoryViewerOpen ||
    isLiveStreamOpen ||
    isStoryModalOpen ||
    isAudienceModalOpen ||
    isPageModalOpen ||
    isAddToPostModalOpen ||
    isBoostModalOpen ||
    isGiftModalOpen ||
    inquireAd !== null ||
    isMediaManagerOpen ||
    isTrimmerModalOpen ||
    isAudioPickerOpen ||
    editingAdId !== null;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.add('workspace-focus-mode');
    } else {
      document.body.classList.remove('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.remove('workspace-focus-mode');
    }
    return () => {
      document.body.classList.remove('layout-locked', 'workspace-focus-mode');
      document.documentElement.classList.remove('workspace-focus-mode');
    };
  }, [isAnyModalOpen]);

  const handleOpenBoostModal = (ad: BulletinAd) => {
    if (!user || !token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لتمويل إعلانك' : 'Please log in first to boost your ad');
      setIsAuthModalOpen(true);
      return;
    }
    setBoostingAd(ad);
    setIsBoostModalOpen(true);
  };

  const handleBoostSuccess = (updatedAd: BulletinAd) => {
    triggerSuccessConfetti();
    setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd, is_boosted: true } : a));
    setMyAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd, is_boosted: true } : a));
    fetchAds(1, false);
    fetchWallet();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;

    // 1. Check for Commercial Page route: /viralbook/page/:slug or /viralbook/pages/:slug
    const pageMatch = pathname.match(/\/(?:viralbook|bulletin)\/pages?\/([^\/]+)/i);
    if (pageMatch && pageMatch[1] && !['p', 'post', 'reels', 'inquiries', 'my-ads', 'analytics', 'saved', 'board'].includes(pageMatch[1].toLowerCase())) {
      const pageSlug = decodeURIComponent(pageMatch[1]);
      handleOpenPageDetail(pageSlug);
      return;
    }

    // 1b. Check for User Personal Profile Wall route: /viralbook/u/:userId or /u/:userId
    const userMatch = pathname.match(/\/(?:viralbook|bulletin)\/u(?:ser)?\/([^\/]+)/i) || pathname.match(/\/u\/([^\/]+)/i);
    if (userMatch && userMatch[1]) {
      const targetUserId = decodeURIComponent(userMatch[1]);
      handleOpenUserDetail(targetUserId);
      return;
    }

    // 2. Extract Post Code or ID with supreme precision:
    let targetPostCode: string | null = null;

    // A) Search for PX- code anywhere in pathname (e.g. /viralbook/p/qoomre/PX-UHYGZZ/slug or /p/PX-UHYGZZ)
    const pxMatch = pathname.match(/(PX-[A-Za-z0-9_-]+)/i);
    if (pxMatch && pxMatch[1]) {
      targetPostCode = pxMatch[1];
    } else {
      // B) Check query parameters (?ad=123, ?post=PX-123, ?id=123, ?code=123, ?p=123, ?reel=123)
      const urlParams = new URLSearchParams(window.location.search);
      const postParam = urlParams.get('post') || urlParams.get('ad') || urlParams.get('id') || urlParams.get('code') || urlParams.get('p') || urlParams.get('reel');
      if (postParam) {
        targetPostCode = postParam.trim();
      } else {
        // C) Check path segments for /p/:code, /post/:code, /viralbook/p/.../:code
        const segments = pathname.split('/').filter(Boolean);
        const pIndex = segments.findIndex(s => s.toLowerCase() === 'p' || s.toLowerCase() === 'post');
        if (pIndex !== -1 && segments.length > pIndex + 1) {
          for (let i = pIndex + 1; i < segments.length; i++) {
            if (/^PX-/i.test(segments[i]) || !isNaN(Number(segments[i]))) {
              targetPostCode = decodeURIComponent(segments[i]);
              break;
            }
          }
          if (!targetPostCode && segments.length > pIndex + 1) {
            targetPostCode = decodeURIComponent(segments[segments.length - 1]);
          }
        } else if (routeIdParam && !['reels', 'pages', 'page', 'inquiries', 'my-ads', 'analytics', 'saved', 'board'].includes(routeIdParam.toLowerCase())) {
          targetPostCode = routeIdParam;
        }
      }
    }

    if (targetPostCode && !['board', 'viralbook', 'bulletin', 'reels', 'pages', 'inquiries'].includes(targetPostCode.toLowerCase())) {
      const codeOrId = targetPostCode;
      const fetchDirectPost = async () => {
        try {
          const res = await fetch(`/api/bulletin/ads/code/${encodeURIComponent(codeOrId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (!res.ok) {
            console.warn('[Bulletin] Direct post fetch returned status:', res.status);
            return;
          }
          const data = await res.json();
          const ad: BulletinAd = data.ad || (data.id ? data : null);
          if (ad) {
            // Ensure this ad is at the top of the feed list
            setAds(prev => {
              const filtered = prev.filter(p => p.id !== ad.id && (p as any).post_code !== (ad as any).post_code);
              return [ad, ...filtered];
            });

            if (ad.ad_format === 'reel') {
              setActiveTab('reels');
              setActiveReelModalId(ad.id);
            } else {
              setActiveTab('board');
              const firstGalleryUrl = Array.isArray(ad.media_gallery) && ad.media_gallery.length > 0
                ? (typeof ad.media_gallery[0] === 'string' ? ad.media_gallery[0] : ad.media_gallery[0]?.url || '')
                : '';
              const rawMedia = ad.video_url || ad.image_url || firstGalleryUrl || '';
              const mediaUrl = rawMedia ? getMediaUrl(rawMedia) : '';
              handleOpenLightbox(mediaUrl, ad.media_gallery, 0, ad.title, ad.author_name, ad);
            }

            try {
              const cRes = await fetch(`/api/bulletin/ads/${ad.id}/comments`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              const cData = await cRes.json();
              if (cData.success) {
                setCommentsMap(prev => ({ ...prev, [ad.id]: cData.comments || [] }));
              }
            } catch (cErr) {
              console.error('Failed to fetch direct post comments:', cErr);
            }
          }
        } catch (e) {
          console.error('Failed to fetch direct post:', e);
        }
      };
      fetchDirectPost();
    }
  }, [token, routeIdParam, subPath, subId, location.pathname]);

  useEffect(() => {
    let targetReelId: number | null = null;
    const isReelRoute = location.pathname.startsWith('/reels') ||
      location.pathname.includes('/reels') ||
      subPath === 'reels';

    if (isReelRoute) {
      if (subId && !isNaN(Number(subId))) {
        targetReelId = Number(subId);
      } else if (routeIdParam && !isNaN(Number(routeIdParam))) {
        targetReelId = Number(routeIdParam);
      } else if (typeof window !== 'undefined') {
        const reelMatch = location.pathname.match(/\/(?:reels|viralbook\/reels|bulletin\/reels)\/(\d+)/i);
        if (reelMatch && reelMatch[1]) {
          targetReelId = Number(reelMatch[1]);
        }
      }
    }

    if (!targetReelId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reelIdStr = urlParams.get('reel');
      if (reelIdStr && !isNaN(Number(reelIdStr))) {
        targetReelId = Number(reelIdStr);
      }
    }

    if (targetReelId && targetReelId > 0) {
      const reelId = targetReelId;
      const fetchDirectReel = async () => {
        try {
          const res = await fetch(`/api/bulletin/ads/${reelId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const data = await res.json();
          if (data.success && data.ad && data.ad.video_url) {
            setAds(prev => {
              const exists = prev.some(a => a.id === data.ad.id);
              if (exists) return prev;
              return [data.ad, ...prev];
            });
            setActiveReelModalId(reelId);
            setActiveTab('reels');
          }
        } catch (e) {
          console.error('Failed to fetch direct reel:', e);
        }
      };
      fetchDirectReel();
    }
  }, [token, routeIdParam, subPath, subId, location.pathname]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boostStatus = urlParams.get('status');
    const sessionId = urlParams.get('session_id');

    if (boostStatus === 'boost-success' && sessionId && token) {
      fetch(`/api/bulletin/verify-boost-session?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            triggerSuccessConfetti();
            toast.success(isRtl ? 'تم ترويج إعلانك وتنشيطه بنجاح عبر Stripe! 🚀' : 'Ad boosted successfully via Stripe!');
            fetchAds(1, false);
            fetchWallet();
          }
        })
        .catch(console.error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const adIdParam = routeIdParam || urlParams.get('id') || urlParams.get('ad');
    if (adIdParam) {
      const targetId = Number(adIdParam);
      if (!isNaN(targetId) && targetId > 0) {
        const exists = ads.some(a => a.id === targetId);
        if (exists) {
          setExpandedAdId(targetId);
          setTimeout(() => {
            const el = document.getElementById(`bulletin-ad-${targetId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 350);
        } else {
          fetch(`/api/bulletin/ads/${targetId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.ad) {
                setAds(prev => [data.ad, ...prev.filter(a => a.id !== data.ad.id)]);
                setExpandedAdId(targetId);
                setTimeout(() => {
                  const el = document.getElementById(`bulletin-ad-${targetId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350);
              }
            })
            .catch(err => console.error('Failed to load deep-linked ad:', err));
        }
      }
    }
  }, [token, location, routeIdParam, ads]);

  useEffect(() => {
    if (routeIdParam === 'pages' && subPath && !isNaN(Number(subPath))) {
      const pageId = Number(subPath);
      handleOpenPageDetail(pageId);
    }
  }, [routeIdParam, subPath]);

  const [adPage, setAdPage] = useState<number>(1);
  const [hasMoreAds, setHasMoreAds] = useState<boolean>(true);
  const [loadingMoreAds, setLoadingMoreAds] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleNavigateToPost = async (adId: number) => {
    if (!adId) return;

    stopAllMedia();
    setActiveReelModalId(null);
    setLightboxState(prev => ({ ...prev, isOpen: false }));
    updateUrlWithPost(null);

    if (activeTab !== 'board') {
      setActiveTab('board');
    }

    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedAudienceFilter('all');
    setSelectedCities([]);

    let targetAd = ads.find(a => a.id === adId);
    if (!targetAd) {
      try {
        const res = await fetch(`/api/bulletin/ads/${adId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.ad) {
          targetAd = data.ad;
          setAds(prev => [data.ad, ...prev.filter(a => a.id !== data.ad.id)]);
        }
      } catch (e) {
        console.error('Failed to fetch target post for navigation:', e);
      }
    }

    setExpandedAdId(adId);

    const executeScroll = (attempts = 0) => {
      const el = document.getElementById(`bulletin-ad-${adId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-accent', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-zinc-900', 'shadow-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-accent', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-zinc-900', 'shadow-2xl');
        }, 3500);
      } else if (attempts < 8) {
        setTimeout(() => executeScroll(attempts + 1), 150);
      }
    };

    setTimeout(() => executeScroll(), 120);
  };


  const handleStoryViewed = async (storyId: number) => {
    try {
      const response = await fetch(`/api/bulletin/ads/${storyId}/impression`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, impressions_count: (Number(s.impressions_count) || 0) + 1 } : s));
      }
    } catch (err) {
    }
  };

  const handleStoryDeleted = (storyId: number) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    fetchStories();
  };

  const fetchAds = async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMoreAds(true);
    } else {
      setLoading(true);
      setAdPage(1);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCities.length > 0) {
        params.append('cities', selectedCities.join(','));
        params.append('city', selectedCities.join(','));
      } else if (selectedCity !== 'all') {
        params.append('city', selectedCity);
      }
      if (selectedCountries.length > 0) {
        params.append('countries', selectedCountries.join(','));
        params.append('country', selectedCountries.join(','));
      }
      if (selectedAudienceFilter !== 'all') params.append('audience', selectedAudienceFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sort', sortBy);
      params.append('page', String(pageNum));
      params.append('limit', '8');

      const res = await fetch(`/api/bulletin/ads?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.status === 503) {
        toast.error(isRtl ? 'النظام قيد التشغيل، يرجى المحاولة بعد لحظات' : 'System initializing, please retry in a moment');
        return;
      }

      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (isRtl ? 'تم تجاوز حد الطلبات، يرجى الانتظار قليلًا' : 'Rate limit exceeded, please wait a moment'));
        return;
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        const fetchedAds: BulletinAd[] = data.ads || [];
        if (append) {
          const existingIds = new Set(ads.map(a => a.id));
          const newUniqueAds = fetchedAds.filter(a => !existingIds.has(a.id));
          if (newUniqueAds.length > 0) {
            setAds(prev => [...prev, ...newUniqueAds]);
            setHasMoreAds(true);
          } else {
            if (ads.length > 0) {
              const recycled = ads.slice(0, 8).map((ad, idx) => ({
                ...ad,
                _virtualId: `${ad.id}_recycle_${pageNum}_${idx}_${Date.now()}`
              }));
              setAds(prev => [...prev, ...recycled as any]);
              setHasMoreAds(true);
            } else {
              setHasMoreAds(false);
            }
          }
        } else {
          setAds(fetchedAds);
          setHasMoreAds(true);
        }
      }
    } catch (error) {
      console.error('Error fetching bulletin ads:', error);
      toast.error(isRtl ? 'تعذر تحميل الإعلانات' : 'Failed to load ads');
    } finally {
      setLoading(false);
      setLoadingMoreAds(false);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/bulletin/stories', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.status === 503) return;
      if (!res.ok) throw new Error('Failed to fetch stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleLoadMoreAds = () => {
    if (loading || loadingMoreAds) return;
    const nextPage = adPage + 1;
    setAdPage(nextPage);
    fetchAds(nextPage, true);
  };

  const fetchPages = async () => {
    setPagesLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/bulletin/pages?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.status === 503) return;
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json();
      if (data.success) {
        setPagesList(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setPagesLoading(false);
    }
  };

  const fetchMyPages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bulletin/pages/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyPagesList(data.pages || []);
      }
    } catch (e) {}
  };

  const fetchMyAds = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bulletin/ads/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyAds(data.ads || []);
      }
    } catch (e) {}
  };

  const fetchInquiries = async () => {
    if (!token) return;
    setInquiriesLoading(true);
    try {
      const [legacyRes, directRes] = await Promise.all([
        fetch('/api/bulletin/inquiries/my', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bulletin/my-inquiries', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const legacyData = await legacyRes.json().catch(() => ({ inquiries: [] }));
      const directData = await directRes.json().catch(() => ({ inquiries: [] }));

      const legacyInquiries = (legacyData.inquiries || []).map((inq: any) => ({
        ...inq,
        type: 'legacy'
      }));

      const directInquiries = (directData.inquiries || []).map((thread: any) => ({
        id: `direct_${thread.ad_id}_${thread.other_user_id}`,
        ad_id: thread.ad_id,
        ad_title: thread.ad_title,
        ad_image: thread.ad_image,
        sender_id: thread.other_user_id,
        sender_name: thread.other_user_name,
        sender_avatar: thread.other_user_avatar,
        message: thread.last_message,
        unread_count: thread.unread_count,
        created_at: thread.last_message_at,
        type: 'direct'
      }));

      setInquiriesList([...directInquiries, ...legacyInquiries]);
    } catch (e) {
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setWalletBalance(parseFloat(data.balance) || 0);
      }
    } catch (e) {}
  };

  // Silent background geolocation & recommendation matching
  useEffect(() => {
    const detectBackgroundLocation = async () => {
      try {
        const stored = secureStorage.getSync('perplexta_user_countries');
        if (!stored) {
          const res = await fetch('https://ipapi.co/json/').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.country_name) {
              const country = data.country_name;
              setSelectedCountries([country]);
              secureStorage.set('perplexta_user_countries', JSON.stringify([country]));
            }
          }
        }
      } catch (e) {
        // Fallback silently
      }
    };
    detectBackgroundLocation();
  }, []);

  useEffect(() => {
    sessionStorage.removeItem('perplexta_bulletin_scroll_y');
    fetchAds();
    fetchStories();
    fetchPages();
  }, [selectedCategory, selectedCities, selectedCountries, sortBy, selectedAudienceFilter]);

  useEffect(() => {
    const handleScroll = () => {
      try {
        const container = document.querySelector('.main-scroll-container');
        const containerY = container ? container.scrollTop : 0;
        const windowY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const currentY = Math.max(containerY, windowY);

        const isPostFullscreen = expandedAdId !== null || activeReelModalId !== null || lightboxState.isOpen || activeTab !== 'board';
        setShowScrollTop(!isPostFullscreen && currentY > 200);

        if (activeTab === 'board' && currentY > 0 && !document.body.classList.contains('layout-locked') && !document.body.classList.contains('workspace-focus-mode')) {
          sessionStorage.setItem('perplexta_bulletin_scroll_y', String(currentY));
        }
      } catch (e) {}
    };

    const container = document.querySelector('.main-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'board' && !loading && ads.length > 0) {
      const savedScrollY = sessionStorage.getItem('perplexta_bulletin_scroll_y');
      if (savedScrollY && Number(savedScrollY) > 0) {
        const targetY = Number(savedScrollY);
        const timer = setTimeout(() => {
          const container = document.querySelector('.main-scroll-container');
          if (container) {
            container.scrollTop = targetY;
          } else {
            window.scrollTo({ top: targetY, behavior: 'instant' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, loading, ads.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('perplexta_bulletin_scroll_y');
    if (activeTab === 'board') fetchAds();
    if (activeTab === 'pages') fetchPages();
  };

  const handleToggleLike = async (adId: number, reaction: string = 'like') => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول للتفاعل مع الإعلان' : 'Please log in to like ads');
      return;
    }

    setAds(prev => prev.map(ad => {
      if (ad.id === adId) {
        const currentReaction = (ad as any).user_reaction;
        const isRemoving = currentReaction === reaction;
        const nextReaction = isRemoving ? null : reaction;
        const countDelta = isRemoving ? -1 : (currentReaction ? 0 : 1);
        return {
          ...ad,
          user_has_liked: Boolean(nextReaction),
          user_reaction: nextReaction,
          likes_count: Math.max(0, (ad.likes_count || 0) + countDelta)
        };
      }
      return ad;
    }));

    setSavedAds(prev => prev.map(ad => {
      if (ad.id === adId) {
        const currentReaction = (ad as any).user_reaction;
        const isRemoving = currentReaction === reaction;
        const nextReaction = isRemoving ? null : reaction;
        const countDelta = isRemoving ? -1 : (currentReaction ? 0 : 1);
        return {
          ...ad,
          user_has_liked: Boolean(nextReaction),
          user_reaction: nextReaction,
          likes_count: Math.max(0, (ad.likes_count || 0) + countDelta)
        };
      }
      return ad;
    }));

    try {
      const res = await fetch(`/api/bulletin/ads/${adId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      });
      const data = await res.json();
      if (data.success && data.user_reaction !== undefined) {
        setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, user_has_liked: data.isLiked, user_reaction: data.user_reaction, likes_count: data.likesCount } : ad));
        setSavedAds(prev => prev.map(ad => ad.id === adId ? { ...ad, user_has_liked: data.isLiked, user_reaction: data.user_reaction, likes_count: data.likesCount } : ad));
      } else if (!data.success) {
        fetchAds();
      }
    } catch (e) {
      fetchAds();
    }
  };

  const handleToggleFollowPage = async (pageId: number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول لمتابعة الصفحة' : 'Please log in to follow page');
      return;
    }

    setPagesList(prev => prev.map(p => {
      if (p.id === pageId) {
        const following = p.user_is_following;
        return {
          ...p,
          user_is_following: !following,
          followers_count: following ? Math.max(0, p.followers_count - 1) : p.followers_count + 1
        };
      }
      return p;
    }));

    if (selectedPageDetail && selectedPageDetail.page.id === pageId) {
      setSelectedPageDetail(prev => prev ? {
        ...prev,
        page: {
          ...prev.page,
          user_is_following: !prev.page.user_is_following,
          followers_count: prev.page.user_is_following ? Math.max(0, prev.page.followers_count - 1) : prev.page.followers_count + 1
        }
      } : null);
    }

    try {
      const res = await fetch(`/api/bulletin/pages/${pageId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.is_following ? (isRtl ? 'تمت متابعة الصفحة' : 'Page followed') : (isRtl ? 'تم إلغاء المتابعة' : 'Unfollowed'));
      }
    } catch (e) {
      fetchPages();
    }
  };

  const handleOpenPageDetail = async (pageIdentifier: number | string) => {
    try {
      const isSlug = typeof pageIdentifier === 'string' && isNaN(Number(pageIdentifier));
      const endpoint = isSlug
        ? `/api/bulletin/pages/slug/${encodeURIComponent(pageIdentifier)}`
        : `/api/bulletin/pages/${pageIdentifier}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success || data.id) {
        const pageObj = data.page || data;
        let pageAds: BulletinAd[] = data.ads || [];
        if (!data.ads) {
          const adsRes = await fetch(`/api/bulletin/ads?page_id=${pageObj.id}`);
          const adsData = await adsRes.json();
          pageAds = adsData.ads || [];
        }
        setSelectedUserDetail(null);
        setSelectedPageDetail({ page: pageObj, ads: pageAds });
        setPageDetailTab('ads');
        window.scrollTo({ top: 180, behavior: 'smooth' });
      } else {
        toast.error(data.error || 'تعذر فتح الصفحة');
      }
    } catch (e) {
      toast.error(isRtl ? 'تعذر تحميل الصفحة' : 'Failed to load page');
    }
  };

  const handleOpenUserDetail = async (userIdentifier: number | string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bulletin/users/${encodeURIComponent(userIdentifier)}/wall`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSelectedPageDetail(null);
        setSelectedUserDetail({
          user: data.user,
          ads: data.ads || []
        });
        window.scrollTo({ top: 120, behavior: 'smooth' });
        const cleanUrl = `/viralbook/u/${data.user.id}`;
        if (typeof window !== 'undefined' && window.location.pathname !== cleanUrl) {
          window.history.pushState({}, '', cleanUrl);
        }
      } else {
        toast.error(data.error || (isRtl ? 'تعذر فتح الملف الشخصي' : 'Could not open user wall'));
      }
    } catch (e) {
      toast.error(isRtl ? 'تعذر تحميل حائط المستخدم' : 'Failed to load user wall');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBoard = () => {
    setSelectedPageDetail(null);
    setSelectedUserDetail(null);
    if (typeof window !== 'undefined' && (window.location.pathname.includes('/u/') || window.location.pathname.includes('/pages/'))) {
      window.history.pushState({}, '', '/viralbook');
    }
  };

  const handleToggleCommentLike = async (adId: number, commentId: number, reaction: string = 'like') => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    setCommentsMap((prev) => ({
      ...prev,
      [adId]: (prev[adId] || []).map((c) => {
        if (c.id === commentId) {
          const isRemoving = c.user_reaction === reaction;
          return {
            ...c,
            user_reaction: isRemoving ? null : reaction,
            like_count: Math.max(0, (c.like_count || 0) + (isRemoving ? -1 : (c.user_reaction ? 0 : 1))),
          };
        }
        return c;
      })
    }));

    try {
      await fetch(`/api/bulletin/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      });
    } catch (e) {}
  };

  const toggleComments = async (adId: number) => {
    if (expandedAdId === adId) {
      setExpandedAdId(null);
      return;
    }

    setExpandedAdId(adId);
    if (!commentsMap[adId]) {
      setLoadingCommentsAdId(adId);
      try {
        const res = await fetch(`/api/bulletin/ads/${adId}/comments`);
        const data = await res.json();
        if (data.success) {
          setCommentsMap(prev => ({ ...prev, [adId]: data.comments || [] }));
        }
      } catch (e) {
        console.error('Failed to fetch comments:', e);
      } finally {
        setLoadingCommentsAdId(null);
      }
    }
  };

  const handleAddComment = async (adId: number, parentIdOrText?: number | string, optParentId?: number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول للتعليق' : 'Please log in to comment');
      return;
    }
    let text = newCommentText;
    let parentId = typeof parentIdOrText === 'number' ? parentIdOrText : optParentId;
    if (typeof parentIdOrText === 'string') {
      text = parentIdOrText;
    }
    const contentToSend = text;
    if (!contentToSend || !contentToSend.trim()) return;

    try {
      const res = await fetch(`/api/bulletin/ads/${adId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: contentToSend.trim(), parent_id: parentId })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsMap(prev => ({
          ...prev,
          [adId]: [...(prev[adId] || []), data.comment]
        }));
        if (typeof parentIdOrText !== 'string') {
          setNewCommentText('');
          setReplyToCommentId(null);
        }
        setAds(prev => prev.map(a => a.id === adId ? { ...a, comments_count: a.comments_count + 1 } : a));
        toast.success(isRtl ? 'تم إضافة تعليقك' : 'Comment added');
      } else {
        toast.error(data.error || 'فشل إرسال التعليق');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إضافة التعليق');
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول لإرسال الاستفسار' : 'Please log in to inquire');
      return;
    }
    if (!inquireAd || !inquiryText.trim()) return;

    setIsSendingInquiry(true);
    try {
      const res = await fetch(`/api/bulletin/ads/${inquireAd.id}/inquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inquiryText.trim(),
          sender_phone: inquiryPhone.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم إرسال استفسارك للتاجر بنجاح!' : 'Inquiry sent to merchant successfully!');
        setInquireAd(null);
        setInquiryText('');
        setInquiryPhone('');
      } else {
        toast.error(data.error || 'فشل إرسال الاستفسار');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إرسال الاستفسار');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleMessageAdvertiser = async (ad: BulletinAd, customMessage?: string) => {
    if (!token || !user) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لمراسلة المعلن' : 'Please log in to message the advertiser');
      setIsAuthModalOpen(true);
      return;
    }

    if (user.id && (user.id === ad.user_id)) {
      toast.error(isRtl ? 'هذا إعلانك الخاص، لا يمكنك مراسلة نفسك' : 'This is your own advertisement');
      return;
    }

    setMessagingAdId(ad.id);
    try {
      const res = await fetch(`/api/bulletin/ads/${ad.id}/message-advertiser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: customMessage || '' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم فتح المحادثة المشفرة مع المعلن في صندوق الرسائل!' : 'Encrypted chat with advertiser opened in messenger!');
        setInquireAd(null);
        await fetchInquiries();
        setSelectedInboxAd(ad);
        setActiveTab('inquiries');
      } else {
        toast.error(data.error || (isRtl ? 'فشل مراسلة المعلن' : 'Failed to message advertiser'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء الاتصال بالمعلن' : 'Error contacting advertiser');
    } finally {
      setMessagingAdId(null);
    }
  };

  const fetchSavedAds = async () => {
    if (!token) return;
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/bulletin/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSavedAds(data.ads);
      }
    } catch (e) {
      console.error('Fetch saved ads error:', e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleToggleSave = async (adOrId: BulletinAd | number) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }
    const targetId = typeof adOrId === 'number' ? adOrId : adOrId.id;

    try {
      const res = await fetch(`/api/bulletin/ads/${targetId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        const updateFn = (prev: BulletinAd[]) => prev.map(a => a.id === targetId ? { ...a, user_has_saved: data.saved } : a);
        setAds(updateFn);
        setMyAds(updateFn);
        if (data.saved) {
          fetchSavedAds();
        } else {
          setSavedAds(prev => prev.filter(a => a.id !== targetId));
        }
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حفظ المنشور');
    }
  };

  const triggerFeedRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      triggerHaptic('light');
      if (activeTab === 'board') {
        await Promise.all([
          fetchAds(1, false),
          fetchPages(),
          fetchStories()
        ]);
      } else if (activeTab === 'pages') {
        await fetchPages();
      } else if (activeTab === 'my_ads') {
        await fetchMyAds();
      } else if (activeTab === 'saved') {
        await fetchSavedAds();
      }
      triggerHaptic('success');
      toast.success(isRtl ? 'تم تحديث المحتوى بنجاح' : 'Feed updated successfully', { id: 'bulletin-pull-refresh' });
    } catch (e) {
      console.error('Pull to refresh error:', e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }, 250);
    }
  };

  useEffect(() => {
    if (activeTab === 'reels') return;

    let touchStartY: number | null = null;
    let touchStartX: number | null = null;
    let isTouchPulling = false;

    let mouseStartY: number | null = null;
    let isMousePulling = false;

    const getScrollTop = () => {
      const container = document.querySelector('.main-scroll-container') as HTMLElement | null;
      const cTop = container ? container.scrollTop : 0;
      const wTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return Math.max(cTop, wTop);
    };

    const isInteractive = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          'button, a, input, textarea, select, [role="button"], video, audio, .custom-scrollbar, [data-prevent-pull="true"], [data-radix-popper-content-wrapper]'
        )
      );
    };

    const isModalActive = () => {
      return Boolean(
        isAnyModalOpen ||
        lightboxState.isOpen ||
        activeReelModalId !== null ||
        isMobileSidebarOpen ||
        isMobileSearchOpen ||
        contextMenu.isOpen
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isRefreshing || isModalActive()) return;
      if (isInteractive(e.target)) return;

      const scrollTop = getScrollTop();
      if (scrollTop <= 2) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isTouchPulling = true;
        pullDistanceRef.current = 0;
        hasTriggeredHapticRef.current = false;
      } else {
        touchStartY = null;
        touchStartX = null;
        isTouchPulling = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchPulling || touchStartY === null || isRefreshing) return;

      const scrollTop = getScrollTop();
      if (scrollTop > 2) {
        isTouchPulling = false;
        touchStartY = null;
        touchStartX = null;
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY;
      const deltaX = Math.abs(touch.clientX - (touchStartX ?? touch.clientX));

      if (deltaX > 8 && deltaX > deltaY && pullDistanceRef.current === 0) {
        isTouchPulling = false;
        touchStartY = null;
        touchStartX = null;
        return;
      }

      if (deltaY > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, 95);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        if (damped >= 55 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          triggerHaptic('medium');
        } else if (damped < 55) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      }
    };

    const onTouchEnd = () => {
      if (!isTouchPulling) return;
      isTouchPulling = false;
      touchStartY = null;
      touchStartX = null;

      const finalDist = pullDistanceRef.current;
      if (finalDist >= 55 && !isRefreshing) {
        triggerFeedRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      hasTriggeredHapticRef.current = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || isRefreshing || isModalActive()) return;
      if (isInteractive(e.target)) return;

      const scrollTop = getScrollTop();
      if (scrollTop <= 2) {
        mouseStartY = e.clientY;
        isMousePulling = true;
        pullDistanceRef.current = 0;
        hasTriggeredHapticRef.current = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMousePulling || mouseStartY === null || isRefreshing) return;

      const scrollTop = getScrollTop();
      if (scrollTop > 2) {
        isMousePulling = false;
        mouseStartY = null;
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      const deltaY = e.clientY - mouseStartY;
      if (deltaY > 0) {
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.6, 95);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        if (damped >= 55 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          triggerHaptic('medium');
        } else if (damped < 55) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      }
    };

    const onMouseUp = () => {
      if (!isMousePulling) return;
      isMousePulling = false;
      mouseStartY = null;

      const finalDist = pullDistanceRef.current;
      if (finalDist >= 55 && !isRefreshing) {
        triggerFeedRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      hasTriggeredHapticRef.current = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [
    activeTab,
    isRefreshing,
    isAnyModalOpen,
    lightboxState.isOpen,
    activeReelModalId,
    isMobileSidebarOpen,
    isMobileSearchOpen,
    contextMenu.isOpen,
    isRtl
  ]);

  const handleReportAd = async (ad: BulletinAd) => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const reason = await confirm({
      title: isRtl ? 'الإبلاغ عن المنشور' : 'Report Post',
      description: isRtl ? 'لماذا تبلغ عن هذا المنشور؟' : 'Why are you reporting this post?',
      hasInput: true,
      inputPlaceholder: isRtl ? 'أدخل سبب الإبلاغ...' : 'Enter reason...',
      confirmLabel: isRtl ? 'إرسال البلاغ' : 'Submit Report',
      variant: 'warning',
      requiredInput: true,
    });
    if (!reason || typeof reason !== 'string' || !reason.trim()) return;

    try {
      const response = await fetch(`/api/bulletin/ads/${ad.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال البلاغ' : 'Failed to send report'));
      }
    } catch (error) {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    }
  };

  const handleRecommendationAdClick = (adId: number) => {
    if (activeTab !== 'board') {
      setActiveTab('board');
    }
    setTimeout(() => {
      const el = document.getElementById(`bulletin-ad-${adId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-accent');
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 2500);
      }
    }, 200);
  };

  const handleEditAd = (ad: BulletinAd) => {
    const synthesizedGallery: MediaGalleryItem[] = [];
    if (ad.media_gallery && Array.isArray(ad.media_gallery) && ad.media_gallery.length > 0) {
      synthesizedGallery.push(...ad.media_gallery);
    } else {
      if (ad.image_url) {
        const urls = ad.image_url.split(',').map(u => u.trim()).filter(Boolean);
        urls.forEach((url, i) => {
          synthesizedGallery.push({
            id: `img-${i}-${Date.now()}`,
            url,
            type: 'image',
            caption: ''
          });
        });
      }
      if (ad.video_url) {
        synthesizedGallery.push({
          id: `vid-0-${Date.now()}`,
          url: ad.video_url,
          type: 'video',
          caption: '',
          thumbnailUrl: ad.image_url ? ad.image_url.split(',')[0].trim() : undefined
        });
      }
    }

    setAdFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url || '',
      video_url: ad.video_url || '',
      media_gallery: synthesizedGallery,
      whatsapp_number: ad.whatsapp_number || '',
      phone_number: ad.phone_number || '',
      target_url: ad.target_url || '',
      hashtags: Array.isArray(ad.hashtags) ? ad.hashtags.join(',') : (ad.hashtags || ''),
      page_id: ad.page_id || '',
      location_city: ad.location_city || 'القدس الشريف',
      location_radius: '10',
      feeling: ad.feeling || '',
      is_ai_generated: ad.is_ai_generated || false,
      tagged_users: Array.isArray(ad.tagged_users) ? ad.tagged_users : [],
      has_whatsapp_button: !!ad.whatsapp_number,
      audience: (ad.audience as any) || 'public',
      ad_format: (ad.ad_format as any) || 'post',
      quick_questions: Array.isArray(ad.quick_questions) ? ad.quick_questions : ['', '', ''],
      aspect_ratio: (ad as any).aspect_ratio || 'grid',
      audio_url: (ad as any).audio_url || '',
      audio_title: (ad as any).audio_title || '',
      audio_artist: (ad as any).audio_artist || '',
      audio_track_id: (ad as any).audio_track_id || ''
    });
    setEditingAdId(ad.id);
    setIsEditMode(true);
    setIsAdModalOpen(true);
  };

  const confirm = useConfirm();

  const handleDeleteAd = async (ad: BulletinAd) => {
    if (!token) return;
    const confirmDelete = await confirm({
      title: isRtl ? 'حذف المنشور' : 'Delete Post',
      description: isRtl ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?',
      variant: 'danger',
      confirmLabel: isRtl ? 'حذف' : 'Delete'
    });
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/bulletin/ads/${ad.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم حذف المنشور بنجاح' : 'Post deleted successfully');
        setAds(prev => prev.filter(a => a.id !== ad.id));
        setMyAds(prev => prev.filter(a => a.id !== ad.id));
      } else {
        toast.error(data.error || 'فشل حذف المنشور');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حذف المنشور');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const totalMediaCount = (adFormData.media_gallery && adFormData.media_gallery.length > 0)
      ? adFormData.media_gallery.length
      : (adFormData.image_url ? adFormData.image_url.split(',').map(u => u.trim()).filter(Boolean).length : 0);
    if (totalMediaCount > 20) {
      toast.error(isRtl ? 'الحد الأقصى المسموح به هو 20 وسيطة فقط' : 'The maximum limit allowed is only 20 media items');
      return;
    }

    setIsSubmittingAd(true);
    try {
      const desc = adFormData.description || '';
      const textHashtags = (desc.match(/#[\p{L}\p{N}_]+/gu) || []).map(h => h.replace(/^#/, '').trim());
      const existingHashtags = Array.isArray(adFormData.hashtags)
        ? adFormData.hashtags.map((h: any) => String(h).replace(/^#/, '').trim()).filter(Boolean)
        : typeof adFormData.hashtags === 'string'
        ? adFormData.hashtags.split(/[,\s]+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean)
        : [];
      const mergedHashtags = Array.from(new Set([...existingHashtags, ...textHashtags]));

      const textMentions = (desc.match(/@[\p{L}\p{N}_]+/gu) || []).map(m => m.replace(/^@/, '').trim()).filter(Boolean);
      const existingMentions = (Array.isArray(adFormData.tagged_users) ? adFormData.tagged_users : [])
        .map(m => String(m).replace(/^@/, '').trim())
        .filter(Boolean);
      const mergedMentions = Array.from(new Set([...existingMentions, ...textMentions]));

      const payload = {
        ...adFormData,
        title: adFormData.title?.trim() || (desc.length > 60 ? desc.slice(0, 60) + '...' : desc) || 'منشور جديد',
        hashtags: mergedHashtags.join(','),
        tagged_users: mergedMentions
      };

      const url = isEditMode ? `/api/bulletin/ads/${editingAdId}` : '/api/bulletin/ads';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.clear();
        const isReel = payload.ad_format === 'reel';
        const createdAd = data.ad || payload;

        if (isEditMode) {
          toast.success(isRtl ? 'تم التحديث' : 'Updated');
        } else {
          toast.success(isRtl ? 'تم النشر' : 'Published');
          if (createdAd && createdAd.id) {
            setAds(prev => [createdAd, ...prev.filter(a => a.id !== createdAd.id)]);
            setMyAds(prev => [createdAd, ...prev.filter(a => a.id !== createdAd.id)]);
            if (isReel) {
              setActiveTab('reels');
              setActiveReelModalId(Number(createdAd.id));
            } else {
              setActiveTab('board');
              setTimeout(() => {
                handleNavigateToPost(Number(createdAd.id));
              }, 120);
            }
          }
        }
        cleanupComposerMediaUrls();
        setIsAdModalOpen(false);
        setIsEditMode(false);
        setEditingAdId(null);
        setAdFormData({
          title: '',
          description: '',
          image_url: '',
          video_url: '',
          media_gallery: [],
          whatsapp_number: '',
          phone_number: '',
          target_url: '',
          hashtags: '',
          page_id: '',
          location_city: 'القدس الشريف',
          location_radius: '10',
          feeling: '',
          is_ai_generated: false,
          tagged_users: [],
          has_whatsapp_button: false,
          audience: 'public',
          ad_format: 'post',
          quick_questions: ['', '', ''],
          aspect_ratio: 'grid',
          audio_url: '',
          audio_title: '',
          audio_artist: '',
          audio_track_id: ''
        });
        fetchMyAds();
        fetchAds();
        fetchWallet();
        if (selectedPageDetail) {
          handleOpenPageDetail(selectedPageDetail.page.id);
        }
        setActiveTab('board');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(data.error || 'فشل نشر المنشور');
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('حدث خطأ أثناء نشر الإعلان');
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleMixedMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | File[] } }) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setIsAdModalOpen(true);
    const filesArray = Array.from(filesList);

    const currentGallery = adFormData.media_gallery || [];
    const maxLimit = 20;

    if (currentGallery.length >= maxLimit) {
      toast.error(isRtl ? `الحد الأقصى هو ${maxLimit} وسيطة للمنشور الواحد` : `Cannot upload more than ${maxLimit} media items per post`);
      return;
    }

    let filesToUpload = filesArray;
    if (currentGallery.length + filesArray.length > maxLimit) {
      const allowedCount = maxLimit - currentGallery.length;
      toast.warning(
        isRtl
          ? `الحد الأقصى هو ${maxLimit} عنصر. سيتم رفع أول ${allowedCount} وسائط إضافية فقط.`
          : `Maximum limit is ${maxLimit} items. Only the first ${allowedCount} items will be uploaded.`
      );
      filesToUpload = filesArray.slice(0, allowedCount);
    }

    const toastId = toast.loading(
      isRtl
        ? `جاري معالجة ورفع الوسائط (${filesToUpload.length} عنصر)...`
        : `Processing and uploading media (${filesToUpload.length} items)...`
    );

    try {
      const authToken = token || secureStorage.getSync('app_token') || '';
      const newItems: MediaGalleryItem[] = [];
      let imagesUploaded = 0;
      let videosUploaded = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error(isRtl ? `الملف ${file.name} ليس مدعوماً (صور أو فيديو فقط)` : `File ${file.name} is not supported`);
          continue;
        }

        if (isVideo) {
          if (file.size > 100 * 1024 * 1024) {
            toast.error(isRtl ? `حجم الفيديو ${file.name} يتجاوز 100MB` : `Video ${file.name} exceeds 100MB`);
            continue;
          }

          let thumbUrl: string | undefined;
          let videoRatio = '16:9';
          let isVertical = false;
          try {
            const meta = await extractVideoMetadata(file);
            thumbUrl = meta.thumbnail;
            videoRatio = meta.aspectRatio;
            isVertical = meta.isVertical;
          } catch (_) {}

          const formDataUpload = new FormData();
          formDataUpload.append('file', file);

          const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: formDataUpload
          });

          if (res.ok) {
            const data = await res.json();
            const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url || data.path;
            const fileUrl = getMediaUrl(rawUrl);
            if (fileUrl) {
              newItems.push({
                id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: fileUrl,
                type: 'video',
                caption: '',
                thumbnailUrl: thumbUrl
              });
              videosUploaded++;
              setAdFormData(prev => ({
                ...prev,
                aspect_ratio: videoRatio,
                ad_format: isVertical ? 'reel' : (prev.ad_format || 'post')
              }));
            }
          }
        } else {
          if (file.size > 25 * 1024 * 1024) {
            toast.error(isRtl ? `حجم الصورة ${file.name} يتجاوز 25MB` : `Image ${file.name} exceeds 25MB`);
            continue;
          }

          const compressed = await compressAndResizeImage(file, {
            format: 'feed',
            quality: 0.88,
            mimeType: 'image/webp'
          });

          const formDataUpload = new FormData();
          formDataUpload.append('file', compressed.file);

          const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: formDataUpload
          });

          if (res.ok) {
            const data = await res.json();
            const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url || data.path;
            const fileUrl = getMediaUrl(rawUrl);
            if (fileUrl) {
              newItems.push({
                id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: fileUrl,
                type: 'image',
                caption: ''
              });
              imagesUploaded++;
            }
          }
        }
      }

      if (newItems.length > 0) {
        setAdFormData(prev => {
          const combinedGallery = [...(prev.media_gallery || []), ...newItems];
          const allImages = combinedGallery.filter(m => m.type === 'image').map(m => m.url);
          const firstVideo = combinedGallery.find(m => m.type === 'video');

          return {
            ...prev,
            media_gallery: combinedGallery,
            image_url: allImages.join(','),
            video_url: firstVideo ? firstVideo.url : prev.video_url
          };
        });
        toast.dismiss(toastId);
        const msg = isRtl
          ? `تم رفع الوسائط بنجاح (${imagesUploaded} صور، ${videosUploaded} فيديو)!`
          : `Successfully uploaded ${imagesUploaded} images & ${videosUploaded} videos!`;
        toast.success(msg);
      } else {
        throw new Error('No files uploaded');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'حدث خطأ أثناء رفع الوسائط، يرجى المحاولة لاحقاً' : 'Error uploading media files, please try again.');
    }
  };

  const isVideoFile = (file: File): boolean => {
    if (file.type && file.type.startsWith('video/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', '3gp', '3g2', 'wmv', 'flv', 'ogv', 'ts', 'mts', 'm2ts', 'vob'];
    return !!(ext && videoExts.includes(ext));
  };

  const handleImageFileUpload = (e: any) => handleMixedMediaUpload(e);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الفيديو كبير جداً (الحد الأقصى 100MB)' : 'Video file is too large (max 100MB)');
      return;
    }

    setIsAdModalOpen(true);

    // 1. Revoke any previously allocated local blob URL to prevent memory leaks
    if (videoMetadataInfo.localVideoUrl && videoMetadataInfo.localVideoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(videoMetadataInfo.localVideoUrl);
      } catch (_) {}
    }

    // 2. High-Performance Instant Local Preview via URL.createObjectURL
    const localUrl = URL.createObjectURL(file);

    setVideoMetadataInfo({
      fileName: file.name,
      fileSize: file.size,
      localVideoUrl: localUrl,
      uploadProgress: 0,
      processingStage: 'uploading'
    });

    // 3. Immediately set adFormData so ComposerMediaPreview, Trimmer, and VideoFrameCapture render the video instantly
    setAdFormData(prev => {
      const gallery = (prev.media_gallery || []).filter(m => m.type !== 'video');
      gallery.unshift({
        id: `vid-temp-${Date.now()}`,
        url: localUrl,
        type: 'video',
        caption: ''
      });
      return {
        ...prev,
        video_url: localUrl,
        media_gallery: gallery
      };
    });

    // 4. Client-side Instant Metadata & Frame extraction (0ms wait for server upload)
    extractVideoMetadata(file).then(meta => {
      if (meta) {
        setAdFormData(prev => ({
          ...prev,
          image_url: prev.image_url || meta.thumbnail,
          aspect_ratio: meta.aspectRatio || prev.aspect_ratio || '16:9',
          ad_format: meta.isVertical ? 'reel' : ((prev.ad_format as string) === 'banner' ? 'post' : (prev.ad_format || 'post'))
        }));
        setVideoMetadataInfo(prev => ({
          ...prev,
          duration: meta.duration || prev.duration,
          resolution: meta.width && meta.height ? `${meta.width}x${meta.height}` : prev.resolution
        }));
      }
    }).catch(err => console.warn('Instant video metadata extraction notice:', err));

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const handleUploadFallback = (_f: File, url: string) => {
      console.warn('Video server upload warning, continuing with local preview');
      setAdFormData(prev => ({ ...prev, video_url: url }));
      setVideoMetadataInfo(prev => ({
        ...prev,
        processingStage: 'done',
        uploadProgress: 100
      }));
      toast.success(isRtl ? 'تم تجهيز مقطع الفيديو للمعاينة' : 'Video loaded for preview');
    };

    const authToken = token || secureStorage.getSync('app_token') || '';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/files/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setVideoMetadataInfo(prev => ({
          ...prev,
          uploadProgress: percentComplete,
          processingStage: percentComplete >= 100 ? 'transcoding' : 'uploading'
        }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const rawUrl = data.fileUrl || data.file?.file_url || data.file?.url || data.url || data.path;
          const fileUrl = getMediaUrl(rawUrl);
          if (fileUrl) {
            let thumb = '';
            let videoRatio = '16:9';
            let isVertical = false;
            try {
              const meta = await extractVideoMetadata(file);
              thumb = meta.thumbnail;
              videoRatio = meta.aspectRatio;
              isVertical = meta.isVertical;
            } catch (_) {}

            setAdFormData(prev => {
              const gallery = (prev.media_gallery || []).map(m => {
                if (m.type === 'video' && (m.url === localUrl || m.url.startsWith('blob:'))) {
                  return { ...m, url: fileUrl, thumbnailUrl: prev.image_url || thumb };
                }
                return m;
              });
              if (!gallery.some(m => m.url === fileUrl)) {
                gallery.push({
                  id: `vid-${Date.now()}`,
                  url: fileUrl,
                  type: 'video',
                  caption: '',
                  thumbnailUrl: prev.image_url || thumb
                });
              }
              return {
                ...prev,
                video_url: fileUrl,
                media_gallery: gallery,
                aspect_ratio: videoRatio || prev.aspect_ratio || '16:9',
                image_url: prev.image_url || thumb,
                ad_format: isVertical ? 'reel' : ((prev.ad_format as string) === 'banner' ? 'post' : (prev.ad_format || 'post'))
              };
            });

            setVideoMetadataInfo(prev => ({
              ...prev,
              fileSize: data.fileSize || data.file?.file_size || file.size,
              duration: data.duration || data.file?.duration,
              resolution: data.resolution || data.file?.resolution,
              processingStage: 'done',
              uploadProgress: 100
            }));

            // Once server URL is securely registered in form data, revoke the temporary localUrl
            if (localUrl.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(localUrl);
              } catch (_) {}
            }

            toast.success(isRtl ? 'تم رفع مقطع الفيديو بنجاح!' : 'Video uploaded successfully!');
          } else {
             handleUploadFallback(file, localUrl);
          }
        } catch (err) {
          console.error('Parse response error:', err);
          handleUploadFallback(file, localUrl);
        }
      } else {
        const errJson = (() => { try { return JSON.parse(xhr.responseText); } catch (e) { return {}; } })();
        toast.error(errJson.error || errJson.message_ar || (isRtl ? 'فشل الرفع' : 'Upload failed'));
        handleUploadFallback(file, localUrl);
      }
    };

    xhr.onerror = () => {
      toast.error(isRtl ? 'حدث خطأ في الشبكة' : 'Network error occurred');
      handleUploadFallback(file, localUrl);
    };

    xhr.send(formDataUpload);
  };

  const handleUploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const authToken = token || secureStorage.getSync('app_token') || '';

    let res = await fetch('/api/bulletin/upload', {
      method: 'POST',
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: formData
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message_ar || err.error || (isRtl ? 'فشل رفع الملف' : 'Upload failed'));
    }
    const data = await res.json();
    return data.url || data.fileUrl || data.file?.url || data.file?.file_url || '';
  };

  const handleMixedMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const authToken = token || secureStorage.getSync('app_token') || '';
    if (!authToken) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    const fileList = Array.from(files);
    for (const file of fileList) {
      if (isVideoFile(file)) {
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleVideoFileUpload(fakeEvent);
      } else if (file.type.startsWith('image/')) {
        const uploadToast = toast.loading(isRtl ? `جاري معالجة ورفع الصورة: ${file.name}...` : `Uploading: ${file.name}...`);
        try {
          const url = await handleUploadFile(file);
          toast.dismiss(uploadToast);
          if (url) {
            setAdFormData(prev => {
              const gallery = [...(prev.media_gallery || [])];
              if (!gallery.some(m => m.url === url)) {
                gallery.push({
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                  url,
                  type: 'image',
                  caption: ''
                });
              }
              return {
                ...prev,
                image_url: prev.image_url ? `${prev.image_url},${url}` : url,
                media_gallery: gallery
              };
            });
            toast.success(isRtl ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
          }
        } catch (err: any) {
          toast.dismiss(uploadToast);
          toast.error(err?.message || (isRtl ? 'فشل رفع الصورة' : 'Failed to upload image'));
        }
      }
    }
    e.target.value = '';
  };

  const handleReelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const authToken = token || secureStorage.getSync('app_token') || '';
    if (!authToken) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      setIsAuthModalOpen(true);
      return;
    }

    if (!isVideoFile(file)) {
      toast.error(isRtl ? 'يرجى اختيار مقطع فيديو لرفع الريلز (9:16)' : 'Please select a video file for Reels (9:16)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الفيديو كبير جداً (الحد الأقصى 100MB)' : 'Video file is too large (max 100MB)');
      return;
    }

    // 1. Revoke previous blob URL to prevent memory leaks
    if (videoMetadataInfo.localVideoUrl && videoMetadataInfo.localVideoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(videoMetadataInfo.localVideoUrl);
      } catch (_) {}
    }

    // 2. High-Performance Instant Local Preview
    const localUrl = URL.createObjectURL(file);

    // 3. Initialize adFormData with 9:16 Reel settings
    setAdFormData({
      title: '',
      description: '',
      image_url: '',
      video_url: localUrl,
      media_gallery: [{
        id: `vid-temp-${Date.now()}`,
        url: localUrl,
        type: 'video',
        caption: ''
      }],
      whatsapp_number: (user as any)?.phone || '',
      phone_number: '',
      target_url: '',
      hashtags: '',
      page_id: '' as string | number,
      location_city: 'القدس الشريف',
      location_radius: '10',
      feeling: '',
      is_ai_generated: false,
      tagged_users: [] as string[],
      has_whatsapp_button: false,
      audience: 'public' as 'public' | 'friends' | 'only_me',
      ad_format: 'reel',
      quick_questions: ['', '', ''] as string[],
      aspect_ratio: '9:16',
      audio_url: '',
      audio_title: '',
      audio_artist: '',
      audio_track_id: ''
    });

    setVideoMetadataInfo({
      fileName: file.name,
      fileSize: file.size,
      localVideoUrl: localUrl,
      uploadProgress: 0,
      processingStage: 'uploading'
    });

    // 4. Background server upload
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/files/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setVideoMetadataInfo(prev => ({
          ...prev,
          uploadProgress: percentComplete,
          processingStage: percentComplete >= 100 ? 'transcoding' : 'uploading'
        }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url || data.path;
          const finalUrl = getMediaUrl(rawUrl);
          if (finalUrl) {
            setAdFormData(prev => ({
              ...prev,
              video_url: finalUrl,
              media_gallery: [{
                id: `vid-${Date.now()}`,
                url: finalUrl,
                type: 'video',
                caption: ''
              }]
            }));
            setVideoMetadataInfo(prev => ({
              ...prev,
              processingStage: 'done',
              uploadProgress: 100
            }));
          }
        } catch (_) {}
      }
    };

    xhr.send(formDataUpload);

    // 5. Extract metadata & thumbnail
    extractVideoMetadata(file).then(meta => {
      if (meta) {
        setAdFormData(prev => ({
          ...prev,
          image_url: prev.image_url || meta.thumbnail,
          aspect_ratio: '9:16'
        }));
        setVideoMetadataInfo(prev => ({
          ...prev,
          duration: meta.duration || prev.duration,
          resolution: meta.width && meta.height ? `${meta.width}x${meta.height}` : prev.resolution
        }));
      }
    }).catch(err => console.warn('Instant video metadata extraction notice:', err));

    // 6. Direct transition to VideoTrimmerModal editor
    setTrimmerVideoUrl(localUrl);
    setIsTrimmerModalOpen(true);
    e.target.value = '';
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }

    setIsSubmittingPage(true);
    try {
      const res = await fetch('/api/bulletin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pageFormData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'مبروك! تم إنشاء صفحتك التجارية وتفعيلها بنجاح 🏪' : 'Merchant page created successfully!');
        setIsPageModalOpen(false);
        setPageFormData({
          name: '',
          category: 'تجارة إلكترونية / E-Commerce',
          city: 'غزة',
          address: '',
          description: '',
          avatar_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
          cover_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
          whatsapp_number: '',
          phone_number: '',
          website_url: ''
        });
        fetchPages();
        fetchMyPages();
      } else {
        toast.error(data.error || 'فشل إنشاء الصفحة التجارية');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إنشاء الصفحة');
    } finally {
      setIsSubmittingPage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingProfile(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileFormData.name,
          email: profileFormData.email,
          avatar: profileFormData.avatar,
          cover_image: profileFormData.cover_image,
          occupation: profileFormData.occupation,
          location: profileFormData.location,
          bio: profileFormData.bio,
          custom_instructions: profileFormData.bio,
          website_url: profileFormData.website_url,
          custom_domain: profileFormData.custom_domain,
          is_domain_verified: profileFormData.is_domain_verified,
          social_links: profileFormData.social_links,
          verified_links: profileFormData.verified_links
        })
      });
      if (res.ok) {
        toast.success(isRtl ? 'تم تحديث الملف الشخصي والإعدادات بنجاح! ✨' : 'Profile & settings updated successfully!');
        await refreshUser();
        if (selectedUserDetail && user && selectedUserDetail.user.id === user.id) {
          setSelectedUserDetail(prev => prev ? {
            ...prev,
            user: {
              ...prev.user,
              name: profileFormData.name,
              avatar: profileFormData.avatar,
              cover_image: profileFormData.cover_image,
              occupation: profileFormData.occupation,
              location: profileFormData.location,
              bio: profileFormData.bio,
              website_url: profileFormData.website_url,
              custom_domain: profileFormData.custom_domain,
              is_domain_verified: profileFormData.is_domain_verified,
              social_links: profileFormData.social_links,
              verified_links: profileFormData.verified_links
            }
          } : null);
        }
        setIsProfileEditModalOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || (isRtl ? 'فشل تعديل الملف الشخصي' : 'Failed to update profile'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 400, maxHeight: 400, aspectRatio: 1 });
      const url = await handleUploadFile(optimized);
      setProfileFormData(prev => ({ ...prev, avatar: url }));
      toast.success(isRtl ? 'تم قص وتجهيز الصورة الشخصية بنجاح 📸' : 'Avatar optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الصورة' : 'Failed to upload image'));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 1200, maxHeight: 400, aspectRatio: 3 });
      const url = await handleUploadFile(optimized);
      setProfileFormData(prev => ({ ...prev, cover_image: url }));
      toast.success(isRtl ? 'تم قص وتجهيز صورة الغلاف بنجاح 🖼️' : 'Cover image optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع صورة الغلاف' : 'Failed to upload cover image'));
    }
  };

  const handleKycSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleUploadFile(file);
      setKycSelfieUrl(url);
      toast.success(isRtl ? 'تم رفع مستند التوثيق بنجاح' : 'KYC document uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع المستند' : 'Failed to upload document'));
    }
  };

  const handleEditPageAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 400, maxHeight: 400, aspectRatio: 1 });
      const url = await handleUploadFile(optimized);
      setEditPageFormData(prev => ({ ...prev, avatar_url: url }));
      toast.success(isRtl ? 'تم قص وتجهيز شعار الصفحة بنجاح 🎯' : 'Page avatar optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الشعار' : 'Failed to upload avatar'));
    }
  };

  const handleEditPageCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageUpload(file, { maxWidth: 1200, maxHeight: 400, aspectRatio: 3 });
      const url = await handleUploadFile(optimized);
      setEditPageFormData(prev => ({ ...prev, cover_url: url }));
      toast.success(isRtl ? 'تم قص وتجهيز غلاف الصفحة بنجاح 🖼️' : 'Page cover optimized & uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || (isRtl ? 'فشل رفع الغلاف' : 'Failed to upload cover'));
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!kycFullName.trim() || !kycSelfieUrl.trim()) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول المطلوبة لتوثيق الهوية' : 'Please fill in all required fields');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: kycFullName.trim(),
          selfie: kycSelfieUrl.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم إرسال طلب التوثيق بنجاح! قيد المراجعة 🛡️' : 'Verification request submitted successfully!');
        await refreshUser();
        setIsProfileEditModalOpen(false);
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال طلب التوثيق' : 'Failed to submit verification'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleSavePageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPageData) return;
    setIsSubmittingPageEdit(true);
    try {
      const payload: any = {
        ...editPageFormData,
        managers: editPageManagers
      };

      const res = await fetch(`/api/bulletin/pages/${editingPageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isRtl ? 'تم حفظ تعديلات الصفحة التجارية بنجاح! 🏪' : 'Page edited successfully!');
        setIsEditPageModalOpen(false);
        setEditingPageData(null);
        await fetchPages();
        await fetchMyPages();

        if (selectedPageDetail && selectedPageDetail.page.id === data.page.id) {
          setSelectedPageDetail(prev => prev ? { ...prev, page: data.page } : null);
        }
      } else {
        toast.error(data.error || (isRtl ? 'فشل تعديل الصفحة التجارية' : 'Failed to edit page'));
      }
    } catch (e) {
      toast.error(isRtl ? 'حدث خطأ أثناء تعديل الصفحة' : 'Error updating page');
    } finally {
      setIsSubmittingPageEdit(false);
    }
  };

  const handleShareAd = async (ad: BulletinAd) => {
    const shareUrl = getPostShareUrl(ad);

    try {
      await fetch(`/api/bulletin/ads/${ad.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user?.id,
          sharer_name: user?.name || user?.email || (isRtl ? 'أحد المستخدمين' : 'A user'),
        }),
      });
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: ad.description,
          url: shareUrl
        });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(isRtl ? 'تم نسخ رابط المنشور بنجاح' : 'Post link copied to clipboard');
    } catch (err) {}
  };

  const handleWhatsAppClick = (ad: BulletinAd, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad.whatsapp_number) return;

    fetch(`/api/bulletin/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});

    let cleanPhone = ad.whatsapp_number.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `مرحباً! أود الاستفسار عن إعلانك "${ad.title}" على المنصة التجارية.`
    )}`;
    window.open(waUrl, '_blank');
  };

  const filteredInquiriesList = inquiriesList.filter(inq => {
    const term = inquiriesSearchTerm.toLowerCase();
    return (
      (inq.sender_name && inq.sender_name.toLowerCase().includes(term)) ||
      (inq.message && inq.message.toLowerCase().includes(term)) ||
      (inq.ad_title && inq.ad_title.toLowerCase().includes(term)) ||
      (inq.sender_phone && inq.sender_phone.toLowerCase().includes(term))
    );
  });

  const orderedStories = useMemo(() => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    const activeStories = (stories || []).filter((story: any) => {
      if (story.expires_at) {
        return new Date(story.expires_at).getTime() > now;
      }
      if (story.created_at) {
        return (now - new Date(story.created_at).getTime()) <= TWENTY_FOUR_HOURS_MS;
      }
      return true;
    });

    const groups: { [key: string]: any[] } = {};
    activeStories.forEach((story: any) => {
      const key = story.page_id ? `page-${story.page_id}` : `user-${story.author_id || story.user_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(story);
    });

    const result: any[] = [];
    Object.values(groups).forEach(group => {
      const sorted = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      result.push(...sorted.slice(0, 10));
    });
    return result;
  }, [stories]);

  const representativeStories = useMemo(() => {
    const seen = new Set();
    return orderedStories.filter((story: any) => {
      const key = story.page_id ? `page-${story.page_id}` : `user-${story.author_id || story.user_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [orderedStories]);

  const handleMobileBack = () => {
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
      return;
    }
    if (selectedPageDetail) {
      handleBackToBoard();
      return;
    }
    if (activeTab !== 'board') {
      setActiveTab('board');
      return;
    }
    navigate('/chat');
  };

  return (
    <div className="min-h-screen-safe w-full bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme pb-24 overflow-x-clip">

      {/* Main Persistent ViralBook Top Header */}
      <header
        dir={isRtl ? 'rtl' : 'ltr'}
        className="sticky top-0 z-[160] w-full shrink-0 h-[calc(52px+env(safe-area-inset-top,0px))] lg:h-[calc(56px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)] transition-theme shadow-xs select-none"
      >
        <div className="w-full max-w-[1536px] 2xl:max-w-[1680px] mx-auto h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4">

          {}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            {}
            <NavLink
              to="/"
              onClick={() => {
                triggerHaptic('light');
              }}
              className="group/logo-link relative w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] transition-all duration-150 flex items-center justify-center flex-shrink-0 active:scale-95 cursor-pointer shadow-2xs before:absolute before:-inset-1.5 before:content-['']"
              title={t('appName') || siteSettings?.siteName || "Perplexta"}
              aria-label={t('appName') || siteSettings?.siteName || "Perplexta"}
            >
              {(siteSettings?.logoBase64 || siteSettings?.logoLightBase64) ? (
                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                  <NotificationIconRenderer
                    src={resolveImageUrl((theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings?.logoBase64, 'general')}
                    alt={t('appName') || siteSettings?.siteName || "Perplexta"}
                    size={32}
                    className="w-full h-full object-contain block"
                    fallbackIcon={<Cpu size={14} className="text-[var(--accent)]" />}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-[var(--text-primary)]">
                  <Cpu size={14} className="text-[var(--accent)]" />
                </div>
              )}
            </NavLink>

            {}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] select-none">
                {isRtl ? 'فيرال بوك' : 'ViralBook'}
              </span>
              {selectedPageDetail ? (
                <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
                  <span className="text-[var(--border-default)]">/</span>
                  <span className="truncate max-w-[140px] text-accent font-bold">{selectedPageDetail.page.name}</span>
                </span>
              ) : activeTab !== 'board' ? (
                <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
                  <span className="text-[var(--border-default)]">/</span>
                  <span className="truncate">
                    {activeTab === 'pages' && (isRtl ? 'الصفحات التجارية' : 'Merchant Pages')}
                    {activeTab === 'inquiries' && (isRtl ? 'الرسائل والاستفسارات' : 'Inquiries')}
                    {activeTab === 'my_ads' && (isRtl ? 'حملاتي وإعلاناتي' : 'My Campaigns')}
                    {activeTab === 'analytics' && (isRtl ? 'التحليلات' : 'Analytics')}
                    {activeTab === 'saved' && (isRtl ? 'المحفوظات' : 'Saved')}
                    {activeTab === 'reels' && (isRtl ? 'مقاطع ريلز' : 'Reels')}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-1 justify-center max-w-xl mx-auto min-w-0">
            {/* Dropdown 1: Categories */}
            {activeTab === 'board' && (
              <div ref={categoryDropdownRef} className="relative hidden md:block shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className="group h-8 px-2.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  title={isRtl ? 'تصفية حسب الفئة' : 'Filter by Category'}
                >
                  <Tag size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                  <span className="truncate max-w-[85px]">{currentCategoryLabel}</span>
                  <ChevronDown size={11} className={`transition-transform duration-150 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCategoryDropdownOpen && (() => {
                    const sortedCategories = [...VIRALBOOK_CATEGORIES].sort((a, b) => {
                      const labelA = (isRtl ? a.labelAr : a.labelEn).trim();
                      const labelB = (isRtl ? b.labelAr : b.labelEn).trim();
                      const lenA = labelA.length;
                      const lenB = labelB.length;
                      return lenA !== lenB ? lenA - lenB : labelA.localeCompare(labelB);
                    });

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute top-full mt-1.5 ${isRtl ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} w-max min-w-[190px] p-1 rounded-shape-md border border-[var(--border-default)] shadow-lg flex flex-col gap-0.5 z-[100] bg-[var(--surface-card)] backdrop-blur-xl max-h-64 overflow-y-auto overscroll-contain custom-scrollbar`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] mb-0.5">
                          {isRtl ? 'تصفية حسب الفئة' : 'Filter by Category'}
                        </div>
                        {sortedCategories.map((cat) => {
                          const isSelected = selectedCategory === cat.id;
                          const label = isRtl ? cat.labelAr : cat.labelEn;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none group ${
                                isSelected
                                  ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)] font-bold'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <span className="truncate min-w-0 transition-colors">{label}</span>
                              {isSelected && <Check size={12} className="text-[var(--accent)] shrink-0 ms-1.5" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Dropdown 2: Sort */}
            {activeTab === 'board' && (
              <div ref={sortDropdownRef} className="relative hidden sm:block shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="group h-8 px-2.5 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  title={isRtl ? 'ترتيب المنشورات' : 'Sort Posts'}
                >
                  <ArrowUpDown size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                  <span className="truncate max-w-[80px]">{currentSortLabel}</span>
                  <ChevronDown size={11} className={`transition-transform duration-150 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSortDropdownOpen && (() => {
                    const sortedSortOptions = [...VIRALBOOK_SORT_OPTIONS].sort((a, b) => {
                      const labelA = (isRtl ? a.labelAr : a.labelEn).trim();
                      const labelB = (isRtl ? b.labelAr : b.labelEn).trim();
                      const lenA = labelA.length;
                      const lenB = labelB.length;
                      return lenA !== lenB ? lenA - lenB : labelA.localeCompare(labelB);
                    });

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                         className={`absolute top-full mt-1.5 ${isRtl ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} w-max min-w-[160px] p-1 rounded-shape-md border border-[var(--border-default)] shadow-lg flex flex-col gap-0.5 z-[100] bg-[var(--surface-card)] backdrop-blur-xl overscroll-contain`}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] mb-0.5">
                          {isRtl ? 'ترتيب المنشورات' : 'Sort Posts'}
                        </div>
                        {sortedSortOptions.map((opt) => {
                          const isSelected = sortBy === opt.id;
                          const label = isRtl ? opt.labelAr : opt.labelEn;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id as 'latest' | 'popular');
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none group ${
                                isSelected
                                  ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)] font-bold'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <span className="truncate min-w-0 transition-colors">{label}</span>
                              {isSelected && <Check size={12} className="text-[var(--accent)] shrink-0 ms-1.5" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center md:w-60 lg:w-72 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus-within:border-[var(--border-accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all duration-150 shadow-2xs group">
              <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none transition-colors group-focus-within:text-[var(--accent)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث...' : 'Search...'}
                className="w-full h-full ps-8 pe-6 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-theme font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-shape-sm hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                  title={isRtl ? 'مسح البحث' : 'Clear search'}
                >
                  <X size={12} />
                </button>
              )}
            </form>


          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-3">
            {/* Inquiries / Chat Inbox Trigger */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  if (selectedPageDetail) setSelectedPageDetail(null);
                  setActiveTab('inquiries');
                }}
                className="group hidden sm:flex w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs relative"
                title={isRtl ? 'الرسائل والاستفسارات' : 'Inquiries & Messages'}
              >
                <MessageSquare size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
                {inquiriesList.length > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 rounded-shape-xs bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--surface-page)]">
                    {inquiriesList.length}
                  </span>
                )}
              </button>
            )}

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLanguage(language === 'ar' ? 'en' : 'ar');
              }}
              className="group w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Languages size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggleButton variant="icon-button" size="sm" className="!w-8 !h-8 !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)] !bg-transparent hover:!bg-[var(--surface-subtle)] !text-[var(--text-muted)] hover:!text-[var(--text-primary)] shadow-2xs transition-all duration-150" />

            <div className="w-px h-5 bg-[var(--border-default)] shrink-0 hidden xs:block" />

            {/* Back to Chat / Feed */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                if (selectedPageDetail) {
                  setSelectedPageDetail(null);
                  return;
                }
                navigate('/chat');
              }}
              className="group h-8 px-2.5 sm:px-3 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-2xs cursor-pointer shrink-0"
              title={selectedPageDetail ? (isRtl ? 'رجوع إلى الخلاصة' : 'Back to Feed') : (isRtl ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home')}
            >
              {isRtl ? (
                <ArrowLeft size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-150 group-hover:-translate-x-0.5" />
              ) : (
                <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-150 group-hover:translate-x-0.5" />
              )}
              <span className="hidden xs:inline font-sans text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                {selectedPageDetail ? (isRtl ? 'رجوع' : 'Back') : (isRtl ? 'الرئيسية' : 'Home')}
              </span>
            </button>
          </div>

        </div>

        {}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="md:hidden w-full border-t border-[var(--border-default)] bg-[var(--surface-page)]/98 backdrop-blur-md px-3 py-2 overflow-hidden shadow-md"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-9 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
                <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-accent shrink-0 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في المنشورات، الإعلانات، والصفحات...' : 'Search posts, ads, pages...'}
                  className="w-full h-full ps-8 pe-16 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-12 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    title={isRtl ? 'مسح' : 'Clear'}
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-extrabold text-accent hover:bg-accent/10 rounded-shape-xs transition-colors cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-transform duration-100 flex flex-col items-center justify-center"
          style={{
            top: isRefreshing ? '76px' : `${Math.min(pullDistance + 50, 115)}px`,
            opacity: isRefreshing ? 1 : Math.min(pullDistance / 35, 1)
          }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-shape-sm bg-[var(--surface-card)]/95 backdrop-blur-md border border-[var(--border-main)] shadow-xl text-xs font-bold text-[var(--text-primary)]">
            <RefreshCw
              size={16}
              className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`
              }}
            />
            <span>
              {isRefreshing
                ? (isRtl ? 'جارٍ تحديث المحتوى...' : 'Refreshing feed...')
                : pullDistance >= 55
                  ? (isRtl ? 'اترك للتحديث الفوري' : 'Release to refresh')
                  : (isRtl ? 'اسحب للتحديث' : 'Pull down to refresh')}
            </span>
          </div>
        </div>
      )}

      {}
      <div className="w-full max-w-[1536px] 2xl:max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-5 pb-28 lg:pb-8">

        {}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: isRtl ? '100%' : '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? '100%' : '-100%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute top-0 bottom-0 ${isRtl ? 'end-0' : 'start-0'} w-80 max-w-[85%] bg-[var(--surface-card)] shadow-2xl z-10 flex flex-col`}
              >
                <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent font-bold">
                      <SlidersHorizontal size={14} />
                    </div>
                    <h3 className="text-xs font-extrabold">{isRtl ? 'قائمة بيربليكستا بورد والتحكم' : 'Perplexta Board Menu & Controls'}</h3>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-theme"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {}
                  <div className="space-y-1.5 pb-2 border-b border-[var(--border-default)]">
                    <h4 className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-2">{isRtl ? 'أقسام المنصة' : 'Platform Sections'}</h4>
                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('board'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'board' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Megaphone size={16} className={`transition-theme ${activeTab === 'board' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'الإعلانات والمنشورات' : 'Ads & Posts'}</span>
                    </button>

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('pages'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'pages' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Building2 size={16} className={`transition-theme ${activeTab === 'pages' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'الصفحات التجارية' : 'Merchant Pages'}</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); setIsMobileSidebarOpen(false); }}
                        className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center justify-between transition-theme ${
                          activeTab === 'inquiries' && !selectedPageDetail
                            ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                            : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Inbox size={16} className={`transition-theme ${activeTab === 'inquiries' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                          <span>{isRtl ? 'الرسائل والاستفسارات' : 'Inquiries & Messages'}</span>
                        </div>
                        {inquiriesList.length > 0 && (
                          <span className="px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent text-[10px] font-black">
                            {inquiriesList.length}
                          </span>
                        )}
                      </button>
                    )}

                    {user && (
                      <button
                        onClick={() => { setSelectedPageDetail(null); setActiveTab('my_ads'); setIsMobileSidebarOpen(false); }}
                        className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                          activeTab === 'my_ads' && !selectedPageDetail
                            ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                            : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <Tag size={16} className={`transition-theme ${activeTab === 'my_ads' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                        <span>{isRtl ? 'إعلاناتي وإدارتها' : 'My Advertisements'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('analytics'); setIsMobileSidebarOpen(false); }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'analytics' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <BarChart2 size={16} className={`transition-theme ${activeTab === 'analytics' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'تحليلات الأداء' : 'Performance Analytics'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setSelectedPageDetail(null);
                        setActiveTab('saved');
                        setIsMobileSidebarOpen(false);
                        fetchSavedAds();
                      }}
                      className={`group w-full px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-bold flex items-center gap-2.5 transition-theme ${
                        activeTab === 'saved' && !selectedPageDetail
                          ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
                          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <Bookmark size={16} className={`transition-theme ${activeTab === 'saved' && !selectedPageDetail ? 'text-accent' : 'text-[var(--text-muted)] group-hover:text-accent'}`} />
                      <span>{isRtl ? 'المحفوظات' : 'Saved Items'}</span>
                    </button>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setIsPageModalOpen(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Building2 size={14} className="text-accent" />
                      <span>{isRtl ? 'إنشاء صفحة' : 'Create Page'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!token) { setIsAuthModalOpen(true); return; }
                        setIsAdModalOpen(true);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="p-2.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-none"
                    >
                      <Plus size={14} />
                      <span>{isRtl ? 'نشر إعلان' : 'Publish Ad'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {boostingAd ? (
          <AdPromotionStudioView
            ad={boostingAd}
            walletBalance={walletBalance}
            token={token}
            isRtl={isRtl}
            onBack={() => {
              setBoostingAd(null);
              setIsBoostModalOpen(false);
            }}
            onSuccess={handleBoostSuccess}
            onNavigateToWallet={() => { window.location.href = '/wallet'; }}
            onRequestDepositModal={() => { window.location.href = '/wallet'; }}
          />
        ) : activeTab === 'analytics' && !selectedPageDetail ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('board')}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 shadow transition-theme active:scale-95"
                >
                  {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRtl ? 'رجوع إلى خلاصة الإعلانات' : 'Back to Feed'}</span>
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <BarChart2 size={18} className="text-accent" />
                    <span>{isRtl ? 'تحليلات نتائج الإعلانات وأداء الحملات' : 'Ad Performance Analytics'}</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {isRtl ? 'متابعة تفصيلية لنسب المشاهدة، التفاعلات، والنقرات المباشرة' : 'Detailed conversion metrics, impressions, and engagement'}
                  </p>
                </div>
              </div>
            </div>

            <UserAdAnalyticsView />
          </div>
        ) : activeTab === 'reels' ? (
          <div className="w-full h-full">
            {}
            <ReelsFeed
              ads={combinedReelsAds.length > 0 ? combinedReelsAds : ads}
              isRtl={isRtl}
              token={token}
              user={user}
              commentsMap={commentsMap}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onAddComment={handleAddComment}
              onToggleCommentLike={handleToggleCommentLike}
              onMessageAdvertiser={handleMessageAdvertiser}
              onShare={handleShareAd}
              onBoostAd={handleOpenBoostModal}
              onDeleteReel={(id) => {
                const ad = ads.find(a => a.id === id);
                if (ad) handleDeleteAd(ad);
              }}
              onEditReel={handleEditAd}
              onOpenPageDetail={handleOpenPageDetail}
              onClose={() => setActiveTab('board')}
              onOpenUploadReels={openReelUploadModal}
              onUploadReelClick={openReelUploadModal}
              onViewPost={handleNavigateToPost}
              onArchiveAd={(archivedAd) => {
                setAds(prev => prev.filter(a => a.id !== archivedAd.id));
                setSavedAds(prev => prev.filter(a => a.id !== archivedAd.id));
              }}
              onTrashAd={(trashedAd) => {
                setAds(prev => prev.filter(a => a.id !== trashedAd.id));
                setSavedAds(prev => prev.filter(a => a.id !== trashedAd.id));
              }}
              onUpdateAd={(updatedAd) => {
                setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
                setSavedAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
              }}
              onReportAd={handleReportAd}
              initialAdId={activeReelModalId || undefined}
              isLoading={loading}
            />
          </div>
        ) : activeTab === 'pages' && !selectedPageDetail ? (
          <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
            {}
            <div className="ui-card-container flex flex-col sm:flex-row items-center justify-between gap-3 text-start">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('board')}
                  className="ui-btn-secondary text-xs shrink-0 cursor-pointer"
                >
                  {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  <span>{isRtl ? 'رجوع إلى خلاصة الإعلانات' : 'Back to Feed'}</span>
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                    <Building2 size={18} className="text-accent shrink-0" />
                    <span>{isRtl ? 'دليل الصفحات والأنشطة التجارية' : 'Commercial Pages & Business Directory'}</span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {isRtl ? 'تصفح واستكشف كافة الكيانات والأنشطة التجارية الموثوقة' : 'Explore all verified business profiles and commercial entities'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!token) {
                    toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                    return;
                  }
                  setIsPageModalOpen(true);
                }}
                className="ui-btn-primary text-xs w-full sm:w-auto shrink-0 cursor-pointer"
              >
                <Plus size={15} />
                <span>{isRtl ? 'أنشئ صفحتك التجارية' : 'Create Merchant Page'}</span>
              </button>
            </div>

            {}
            {pagesLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(n => (
                  <div key={`bulletin-skel-pages-${n}`} className="rounded-[var(--radius-md)] bg-[var(--surface-card)] h-72 border border-[var(--border-default)] animate-pulse"></div>
                ))}
              </div>
            ) : pagesList.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Building2 size={32} className="text-[var(--text-muted)] mx-auto" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{isRtl ? 'لا توجد صفحات تجارية مطابقة' : 'No Merchant Pages Found'}</h3>
                <button
                  onClick={() => setIsPageModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-accent transition-theme cursor-pointer border border-[var(--border-default)] rounded-[var(--radius-full)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)]"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>{isRtl ? 'إنشاء صفحة تجارية' : 'Create Merchant Page'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                {pagesList.map((page, pIdx) => (
                  <motion.div
                    key={`page-item-${page.id}-${pIdx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] transition-theme space-y-4"
                  >
                    {}
                    <div className="h-32 sm:h-52 w-full bg-[var(--surface-subtle)] relative cursor-pointer overflow-hidden rounded-t-xl" onClick={() => handleOpenPageDetail(page.id)}>
                      <img src={getMediaUrl(page.cover_url)} alt={page.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <span className="absolute top-3 start-3 px-3 py-1 rounded-shape-xs bg-black/60 text-[var(--text-primary)] text-[11px] font-bold backdrop-blur-md">
                        {page.category}
                      </span>
                    </div>

                    {}
                    <div className="px-4 sm:px-6 -mt-12 sm:-mt-16 space-y-3 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex items-end gap-3 cursor-pointer min-w-0" onClick={() => handleOpenPageDetail(page.id)}>
                          <BulletinAvatar
                            src={page.avatar_url}
                            alt={page.name}
                            size="lg"
                            isPage={true}
                          />
                          <div className="mb-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] truncate hover:text-accent transition-colors">{page.name}</h3>
                              <CheckCircle2 size={16} className="text-[var(--fg-accent)] shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span className="flex items-center gap-1"><MapPin size={12} className="text-accent" /> {page.city}</span>
                              <span>•</span>
                              <span>{page.followers_count} {isRtl ? 'متابع' : 'Followers'}</span>
                            </div>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => handleToggleFollowPage(page.id)}
                            className={`px-3 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-theme flex items-center gap-1 shadow shrink-0 ${
                              page.user_is_following
                                ? 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                                : 'bg-accent text-[var(--text-primary)] hover:bg-accent'
                            }`}
                          >
                            {page.user_is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                            <span>{page.user_is_following ? (isRtl ? 'متابع' : 'Following') : (isRtl ? 'متابعة' : '+ Follow')}</span>
                          </button>

                          <button
                            onClick={() => handleOpenPageDetail(page.id)}
                            className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--surface-page)] font-black text-xs flex items-center gap-1 shadow shrink-0"
                          >
                            <Globe size={14} />
                            <span>{isRtl ? 'زيارة' : 'Visit'}</span>
                          </button>

                          {page.whatsapp_number && (
                            <a
                              href={`https://wa.me/${page.whatsapp_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-9 h-9 rounded-[var(--radius-xs)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center transition-theme shadow-2xs shrink-0 cursor-pointer" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                              title={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                              aria-label={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                            >
                              <Phone size={15} />
                            </a>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-1 line-clamp-3">
                        {page.description}
                      </p>
                    </div>

                    <div className="px-4 sm:px-6 pb-3 pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Tag size={13} className="text-accent" />
                        <span className="font-semibold text-[var(--text-secondary)]">{page.ads_count || 0} {isRtl ? 'إعلان نشط' : 'active ads'}</span>
                      </span>

                      <button
                        onClick={() => handleOpenPageDetail(page.id)}
                        className="text-accent font-bold hover:underline flex items-center gap-1 text-xs"
                      >
                        <span>{isRtl ? 'استعراض المنتجات' : 'Browse'}</span>
                        {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 2xl:gap-7 items-start justify-center w-full">

          {}
          <div className="hidden lg:flex flex-col w-full lg:w-64 xl:w-[290px] 2xl:w-[320px] shrink-0 gap-4 order-1 sticky top-[calc(60px+env(safe-area-inset-top,0px))] max-h-[calc(100vh-5.5rem)] overflow-y-auto scrollbar-none overscroll-contain">

            {}
            <div className="ui-card-container flex flex-col gap-3 w-full">
              {user ? (
                <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-[var(--border-default)] gap-2.5 w-full">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity group"
                    onClick={() => user?.id && handleOpenUserDetail(user.id)}
                    title={isRtl ? 'عرض حائط الملف الشخصي المستقل' : 'View Profile Wall'}
                  >
                    <BulletinAvatar
                      src={user.avatar}
                      alt={user.name}
                      size="md"
                      isOnline={true}
                    />
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-xs font-extrabold truncate group-hover:text-accent transition-colors">{user.name}</h3>
                        <ShieldCheck size={14} className="text-accent shrink-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => setIsProfileEditModalOpen(true)}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'إعدادات الحساب وتوثيق الهوية' : 'Account Settings & Verification'}
                    >
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-45" />
                    </button>

                    <button
                      onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); }}
                      className={`w-8 h-8 rounded-shape-sm border transition-all duration-150 relative active:scale-95 group shrink-0 cursor-pointer flex items-center justify-center ${
                        activeTab === 'inquiries' && !selectedPageDetail
                          ? 'bg-accent/15 border-accent/30 text-accent font-bold'
                          : 'bg-transparent border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent'
                      }`}
                      title={isRtl ? 'صندوق محادثات المسنجر' : 'Messenger Chats'}
                    >
                      <MessageSquare size={14} />
                      {inquiriesList.length > 0 && (
                        <span className="absolute -top-1 -end-1 w-4 h-4 rounded-shape-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-[var(--surface-card)]">
                          {inquiriesList.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 text-center space-y-2">
                  <p className="text-xs font-bold text-accent">
                    {isRtl ? 'سجل الدخول لنشر وتفاعل كامل مع الإعلانات!' : 'Sign in to publish and interact!'}
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="platform-action-btn w-full py-2"
                  >
                    {isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In'}
                  </button>
                </div>
              )}

              {}
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => { setSelectedPageDetail(null); setActiveTab('board'); }}
                  className={`platform-tab-btn ${activeTab === 'board' && !selectedPageDetail ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Megaphone size={16} className="text-accent" />
                    <span>{isRtl ? 'الإعلانات والمنشورات' : 'Ads & Posts'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent font-bold">
                    {ads.length}
                  </span>
                </button>

                <button
                  onClick={() => { setSelectedPageDetail(null); setActiveTab('pages'); }}
                  className={`platform-tab-btn ${activeTab === 'pages' && !selectedPageDetail ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 size={16} className="text-accent" />
                    <span>{isRtl ? 'الصفحات التجارية' : 'Merchant Pages'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent font-bold">
                    {pagesList.length}
                  </span>
                </button>

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('inquiries'); }}
                    className={`platform-tab-btn ${activeTab === 'inquiries' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Inbox size={16} className="text-amber-500" />
                      <span>{isRtl ? 'الرسائل والاستفسارات' : 'Inquiries'}</span>
                    </span>
                    {inquiriesList.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-amber-500 text-white font-extrabold">
                        {inquiriesList.length}
                      </span>
                    )}
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('saved'); fetchSavedAds(); }}
                    className={`platform-tab-btn ${activeTab === 'saved' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark size={16} className="text-accent" />
                      <span>{isRtl ? 'المنشورات المحفوظة' : 'Saved Posts'}</span>
                    </span>
                    {savedAds.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent font-bold">
                        {savedAds.length}
                      </span>
                    )}
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('my_ads'); }}
                    className={`platform-tab-btn ${activeTab === 'my_ads' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={16} className="text-accent" />
                      <span>{isRtl ? 'حملاتي وإعلاناتي' : 'My Campaigns'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-accent/10 text-accent font-bold">
                      {myAds.length}
                    </span>
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { setSelectedPageDetail(null); setActiveTab('analytics'); }}
                    className={`platform-tab-btn ${activeTab === 'analytics' && !selectedPageDetail ? 'active' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-accent" />
                      <span>{isRtl ? 'تحليلات نتائج الأداء' : 'Analytics'}</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="xl:hidden">
              <RecommendationWidget
                variant="bulletin"
                filterType="bulletin"
                limit={3}
                title={isRtl ? 'إعلانات موصى بها' : 'Recommended Ads'}
                subtitle={isRtl ? 'مقترحات مخصصة بناءً على سلوكك واهتماماتك' : 'Tailored ad suggestions'}
                className="ui-card-container"
                onAdClick={handleRecommendationAdClick}
              />
            </div>

            {}
            {user && (
              <div className="ui-card-container flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                        <span>{isRtl ? 'إعدادات التاجر' : 'Merchant Settings'}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => {
                        if (myPagesList.length > 0) {
                          setEditingPageData(myPagesList[0]);
                          setIsEditPageModalOpen(true);
                        } else {
                          setIsPageModalOpen(true);
                        }
                      }}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'إعدادات التاجر وتحديد الموقع' : 'Merchant & Location Settings'}
                      aria-label={isRtl ? 'إعدادات التاجر وتحديد الموقع' : 'Merchant & Location Settings'}
                    >
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-45" />
                    </button>
                  </div>
                </div>

                {myPagesList.length === 0 ? (
                  <div className="text-center py-3 text-xs text-[var(--text-muted)] space-y-2">
                    <p>{isRtl ? 'لم تقم بإعداد ملفك التجاري بعد. افصل هويتك الشخصية عن الإعلانات.' : 'No commercial profile setup yet. Separate your personal identity from your ads.'}</p>
                    <button
                      onClick={() => setIsPageModalOpen(true)}
                      className="platform-action-btn px-3.5 py-1.5 text-[11px]"
                    >
                      {isRtl ? 'إعداد الملف التجاري الآن' : 'Setup Commercial Profile'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    {myPagesList.map((page, idx) => (
                      <div
                        key={`my-page-${page.id}-${idx}`}
                        onClick={() => handleOpenPageDetail(page.id)}
                        className={`group relative platform-tab-btn cursor-pointer ${
                          selectedPageDetail?.page.id === page.id
                            ? 'active'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <BulletinAvatar
                              src={page.avatar_url}
                              alt={page.name}
                              size="sm"
                              isPage={true}
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-shape-xs bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                                {isRtl ? 'إدارة' : 'Manage'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {}
            <div className="xl:hidden">
              <div className="ui-card-container flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                      <span>{isRtl ? 'صفحات موصى بها' : 'Recommended Pages'}</span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                  <button
                    onClick={() => setActiveTab('pages')}
                    className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                    title={isRtl ? 'عرض كافة الصفحات التجارية' : 'View All Pages'}
                  >
                    <ArrowLeft size={14} className={`transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5 rotate-180'}`} />
                  </button>

                  <button
                    onClick={() => fetchPages()}
                    disabled={pagesLoading}
                    className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                    title={isRtl ? 'تحديث' : 'Refresh'}
                  >
                    <RefreshCw size={14} className={pagesLoading ? 'animate-spin text-accent' : 'transition-transform duration-300 group-hover:rotate-180'} />
                  </button>
                </div>
              </div>

              {pagesLoading ? (
                <div className="flex flex-col gap-1.5 w-full">
                  {[1, 2, 3].map(n => (
                    <div key={`bulletin-skel-rec-${n}`} className="h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] animate-pulse"></div>
                  ))}
                </div>
              ) : pagesList.slice(0, 5).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">{isRtl ? 'لا توجد صفحات حالياً' : 'No pages'}</p>
              ) : (
                <div className="flex flex-col gap-1 w-full">
                  {pagesList.slice(0, 5).map((page, idx) => (
                    <div
                      key={`rec-page-${page.id}-${idx}`}
                      onClick={() => handleOpenPageDetail(page.id)}
                      className="group relative platform-tab-btn cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <BulletinAvatar
                            src={page.avatar_url}
                            alt={page.name}
                            size="sm"
                            isPage={true}
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                              <CheckCircle2 size={12} className="text-[var(--fg-accent)] shrink-0" />
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-shape-xs bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                              {isRtl ? 'زيارة' : 'Visit'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>

          </div>

          {}
          <div
            className="flex-1 flex flex-col space-y-4 sm:space-y-5 lg:space-y-6 order-2 relative max-w-2xl xl:max-w-[650px] 2xl:max-w-[720px] min-w-0 w-full min-h-[500px]"
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: Math.max(10, Math.min(e.clientX - rect.left, rect.width - 200)),
                y: Math.max(10, Math.min(e.clientY - rect.top, rect.height - 150)),
                isOpen: true
              });
            }}
            onClick={() => {
              if (contextMenu.isOpen) setContextMenu(prev => ({ ...prev, isOpen: false }));
            }}
            style={{
              transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.28, 26)}px)` : 'none',
              transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
            }}
          >
            {}
            <AnimatePresence>
              {contextMenu.isOpen && (() => {
                const rawContextActions = [
                  {
                    id: 'refresh',
                    label: isRtl ? 'تحديث المحتوى' : 'Refresh Feed',
                    icon: RefreshCw,
                    action: () => {
                      triggerFeedRefresh();
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }
                  },
                  {
                    id: 'copy',
                    label: isRtl ? 'نسخ رابط الصفحة' : 'Copy Page Link',
                    icon: Copy,
                    action: () => {
                      navigator.clipboard.writeText(window.location.href);
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }
                  },
                  {
                    id: 'clear',
                    label: isRtl ? 'إعادة ضبط الجلسة' : 'Clear Session',
                    icon: Trash2,
                    isDestructive: true,
                    action: () => {
                      sessionStorage.clear();
                      sessionStorage.removeItem('perplexta_bulletin_scroll_y');
                      secureStorage.remove('perplexta_bulletin_scroll_y');
                      window.location.reload();
                    }
                  }
                ];

                const sortedActions = [...rawContextActions].sort((a, b) => {
                  const lenA = a.label.trim().length;
                  const lenB = b.label.trim().length;
                  return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
                });

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute z-50 w-max min-w-[190px] rounded-[var(--radius-md)] shadow-2xl border border-[var(--border-default)] p-1 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 select-none bg-[var(--surface-card)] text-[var(--text-primary)] flex flex-col gap-0.5"
                    style={{
                      left: `${contextMenu.x}px`,
                      top: `${contextMenu.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)]/50 mb-0.5">
                      {isRtl ? 'إجراءات سريعة' : 'Quick Actions'}
                    </div>
                    {sortedActions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                            item.isDestructive
                              ? 'text-rose-500 hover:bg-rose-500/10 font-bold'
                              : 'text-[var(--text-primary)] hover:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] hover:text-[var(--accent)] group'
                          }`}
                        >
                          <span className={`truncate min-w-0 ${item.isDestructive ? '' : 'group-hover:text-[var(--accent)] transition-colors'}`}>
                            {item.label}
                          </span>
                          <Icon size={14} className={`${item.isDestructive ? 'text-rose-500' : 'text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-all duration-150'} shrink-0 ms-2`} />
                        </button>
                      );
                    })}
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {}
            <AnimatePresence>
              {(pullDistance > 0 || isRefreshing) && (
                <motion.div
                  initial={{ opacity: 0, y: -25, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: isRefreshing ? 12 : Math.min(pullDistance * 0.55, 42),
                    scale: pullDistance >= 55 || isRefreshing ? 1.05 : 0.95
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-shape-xs border shadow-xl backdrop-blur-md transition-theme pointer-events-none ${
                    isRefreshing || pullDistance >= 55
                      ? 'bg-accent/10 dark:bg-accent/40 border-accent/40 text-accent shadow-none'
                      : 'bg-[var(--surface-card)]/90 border-[var(--border-default)] text-[var(--fg-secondary)]'
                  }`}
                >
                  {isRefreshing ? (
                    <RefreshCw size={15} className="animate-spin text-accent shrink-0" />
                  ) : pullDistance >= 55 ? (
                    <ArrowUp size={15} className="text-accent shrink-0 transition-transform duration-200" />
                  ) : (
                    <ArrowDown
                      size={15}
                      className="text-[var(--text-muted)] shrink-0 transition-transform duration-200"
                      style={{ transform: `rotate(${Math.min(pullDistance * 3, 180)}deg)` }}
                    />
                  )}
                  <span className="text-[11px] font-extrabold tracking-tight">
                    {isRefreshing
                      ? (isRtl ? 'جاري تحديث الخلاصة...' : 'Refreshing feed...')
                      : pullDistance >= 55
                        ? (isRtl ? 'اترك للتحديث الآن' : 'Release to refresh')
                        : (isRtl ? 'اسحب لأسفل لتحديث الإعلانات' : 'Pull down to refresh')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {}
            {}
            {}
            {selectedUserDetail ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden space-y-4"
              >
                {/* Header Back Bar */}
                <div className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between">
                  <button
                    onClick={handleBackToBoard}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-theme shadow"
                  >
                    {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    <span>{isRtl ? 'العودة إلى خلاصة بيربليكستا بورد' : 'Back to Perplexta Board Feed'}</span>
                  </button>
                  <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-card)] px-2.5 py-1 rounded-shape-sm border border-[var(--border-default)] flex items-center gap-1.5">
                    <User size={14} className="text-accent" />
                    <span>{isRtl ? 'حائط ملف شخصي مستقل' : 'Independent Profile Wall'}</span>
                  </span>
                </div>

                {/* Profile Card Header */}
                <div className="px-4 pt-2 pb-4 border-b border-[var(--border-default)] space-y-4">
                  {/* Cover Image Header */}
                  <div className="relative h-32 sm:h-44 w-full rounded-shape-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden mb-12 shadow-sm border border-[var(--border-default)]">
                    {selectedUserDetail.user.cover_image ? (
                      <img
                        src={resolveImageUrl(selectedUserDetail.user.cover_image)}
                        alt="Profile Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    )}
                    <div className="absolute -bottom-10 right-4 sm:right-6 border-4 border-[var(--surface-card)] rounded-shape-sm shadow-lg bg-[var(--surface-card)]">
                      <BulletinAvatar
                        src={selectedUserDetail.user.avatar}
                        alt={selectedUserDetail.user.name}
                        size="xl"
                        fallbackText={selectedUserDetail.user.name}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[var(--text-primary)]">{selectedUserDetail.user.name}</h2>
                        {selectedUserDetail.user.kyc_status === 'verified' && (
                          <span title={isRtl ? 'حساب موثق' : 'Verified Account'} className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-shape-xs text-accent font-extrabold text-[11px]">
                            <ShieldCheck size={15} />
                            <span>{isRtl ? 'حساب موثق' : 'Verified'}</span>
                          </span>
                        )}
                        {selectedUserDetail.user.occupation && (
                          <span className="inline-flex items-center gap-1 bg-[var(--surface-subtle)] border border-[var(--border-default)] px-2.5 py-0.5 rounded-shape-xs text-xs font-bold text-[var(--text-primary)]">
                            <Briefcase size={12} className="text-accent" />
                            <span>{selectedUserDetail.user.occupation}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        {selectedUserDetail.user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-accent" />
                            <span>{selectedUserDetail.user.location}</span>
                          </span>
                        )}
                        {selectedUserDetail.user.email && (
                          <span className="flex items-center gap-1">
                            <AtSign size={13} />
                            <span>{selectedUserDetail.user.email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user && user.id === selectedUserDetail.user.id && (
                        <button
                          onClick={() => setIsProfileEditModalOpen(true)}
                          className="px-3.5 py-2 rounded-lg bg-accent text-[var(--text-primary)] text-xs font-bold shadow hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <Settings size={14} />
                          <span>{isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/viralbook/u/${selectedUserDetail.user.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success(isRtl ? 'تم نسخ رابط الحائط الشخصي' : 'Profile wall link copied');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-default)] hover:bg-[var(--surface-card)] transition-colors flex items-center gap-1.5"
                      >
                        <Share2 size={14} className="text-accent" />
                        <span>{isRtl ? 'مشاركة الحائط' : 'Share Wall'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bio Overview */}
                  {selectedUserDetail.user.bio && (
                    <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                      {selectedUserDetail.user.bio}
                    </div>
                  )}

                  {/* Website & Verified Domain Links */}
                  {(selectedUserDetail.user.website_url || selectedUserDetail.user.custom_domain) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {selectedUserDetail.user.website_url && (
                        <a
                          href={selectedUserDetail.user.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-accent font-bold hover:underline"
                        >
                          <Globe size={13} />
                          <span>{selectedUserDetail.user.website_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {selectedUserDetail.user.custom_domain && (
                        <a
                          href={`https://${selectedUserDetail.user.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 text-xs text-[var(--fg-success)] dark:text-[var(--fg-success)] font-extrabold hover:underline"
                        >
                          <ShieldCheck size={14} />
                          <span>{selectedUserDetail.user.custom_domain}</span>
                          {selectedUserDetail.user.is_domain_verified && (
                            <span className="bg-[var(--fg-success)] text-white text-[10px] px-1.5 py-0.5 rounded-shape-xs font-black">
                              {isRtl ? 'دومين موثق' : 'Verified Domain'}
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Social Media Links */}
                  {selectedUserDetail.user.social_links && Object.values(selectedUserDetail.user.social_links).some(link => Boolean(link)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-default)]/60">
                      <span className="text-[11px] font-bold text-[var(--text-muted)] me-1">{isRtl ? 'التواصل:' : 'Social:'}</span>
                      {Object.entries(selectedUserDetail.user.social_links).map(([platform, rawLink]) => {
                        const linkStr = String(rawLink || '').trim();
                        if (!linkStr) return null;
                        const url = linkStr.startsWith('http') ? linkStr : `https://${linkStr}`;
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-accent hover:border-accent/30 transition-colors flex items-center gap-1"
                          >
                            <Share2 size={11} />
                            <span className="capitalize">{platform}</span>
                            <ExternalLink size={10} />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Badges & Stats */}
                  <div className="mt-2 pt-3 border-t border-[var(--border-default)]/60 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-default)]">
                      <Megaphone size={14} className="text-accent" />
                      <span className="font-bold text-[var(--text-primary)]">{selectedUserDetail.ads.length}</span>
                      <span>{isRtl ? 'منشور شخصي' : 'Personal Posts'}</span>
                    </div>

                    {selectedUserDetail.user.created_at && (
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        <Calendar size={13} />
                        <span>{isRtl ? 'انضم منذ' : 'Joined'}: {new Date(selectedUserDetail.user.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Posts Section Title */}
                <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <User size={16} className="text-accent" />
                    <span>{isRtl ? 'منشورات الحائط الشخصي' : 'Personal Wall Posts'}</span>
                  </h3>
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {selectedUserDetail.ads.length} {isRtl ? 'منشور' : 'posts'}
                  </span>
                </div>

                {/* Feed or Empty State */}
                <div className="p-3">
                  {selectedUserDetail.ads.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-default)]">
                      <User size={40} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {isRtl ? 'لا توجد منشورات شخصية لهذا المستخدم حالياً' : 'No personal posts for this user yet'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {isRtl ? 'المنشورات المعروضة هنا تقتصر فقط على المنشورات الشخصية المستقلة' : 'Only personal independent posts are displayed here'}
                      </p>
                    </div>
                  ) : (
                    <PostFeed
                      ads={selectedUserDetail.ads}
                      loading={false}
                      isRtl={isRtl}
                      token={token}
                      user={user}
                      onReportAd={handleReportAd}
                      onToggleLike={handleToggleLike}
                      onToggleComments={toggleComments}
                      onToggleCommentLike={handleToggleCommentLike}
                      expandedAdId={expandedAdId}
                      commentsMap={commentsMap}
                      loadingCommentsAdId={loadingCommentsAdId}
                      newCommentText={newCommentText}
                      setNewCommentText={setNewCommentText}
                      onAddComment={handleAddComment}
                      replyToCommentId={replyToCommentId}
                      setReplyToCommentId={setReplyToCommentId}
                      onMessageAdvertiser={handleMessageAdvertiser}
                      messagingAdId={messagingAdId}
                      onInquire={setInquireAd}
                      onWhatsApp={handleWhatsAppClick}
                      onShare={handleShareAd}
                      onOpenPageDetail={handleOpenPageDetail}
                      onOpenUserDetail={handleOpenUserDetail}
                      onOpenLightbox={handleOpenLightbox}
                      onCreateAdClick={openPostUploadModal}
                      onBoostAd={handleOpenBoostModal}
                      onEditAd={handleEditAd}
                      onDeleteAd={handleDeleteAd}
                      onToggleSave={handleToggleSave}
                      onArchiveAd={(archivedAd) => {
                        setSelectedUserDetail(prev => prev ? {
                          ...prev,
                          ads: prev.ads.filter(a => a.id !== archivedAd.id)
                        } : null);
                      }}
                      onTrashAd={(trashedAd) => {
                        setSelectedUserDetail(prev => prev ? {
                          ...prev,
                          ads: prev.ads.filter(a => a.id !== trashedAd.id)
                        } : null);
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ) : selectedPageDetail ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden space-y-4"
              >
                {}
                <div className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between">
                  <button
                    onClick={handleBackToBoard}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 hover:bg-accent transition-theme shadow"
                  >
                    {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    <span>{isRtl ? 'العودة إلى خلاصة بيربليكستا بورد' : 'Back to Perplexta Board Feed'}</span>
                  </button>

                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {isRtl ? 'عرض كامل للصفحة التجارية' : 'Merchant Page View'}
                  </span>
                </div>

                {/* Page Cover Banner */}
                <div className="h-44 sm:h-56 md:h-64 w-full bg-[var(--surface-subtle)] relative overflow-hidden rounded-t-[var(--radius-md)] border-b border-[var(--border-default)]">
                  <img
                    src={getMediaUrl(selectedPageDetail.page.cover_url)}
                    alt={selectedPageDetail.page.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 start-3 px-3 py-1 rounded-shape-xs bg-black/70 text-white text-xs font-bold backdrop-blur-md border border-white/20">
                    {selectedPageDetail.page.category}
                  </span>
                </div>

                {/* Profile Avatar & Action Buttons Bar */}
                <div className="px-4 sm:px-6 pb-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 -mt-12 sm:-mt-14 relative z-10">
                    {/* Avatar Container with crisp elevation */}
                    <div className="shrink-0 p-1 bg-[var(--surface-card)] rounded-2xl shadow-xl border border-[var(--border-default)] inline-block w-fit">
                      <BulletinAvatar
                        src={selectedPageDetail.page.avatar_url}
                        alt={selectedPageDetail.page.name}
                        size="lg"
                        isPage={true}
                      />
                    </div>

                    {/* Action Buttons - Cleanly outside & below cover image */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                      <button
                        onClick={() => handleToggleFollowPage(selectedPageDetail.page.id)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 shadow-sm ${
                          selectedPageDetail.page.user_is_following
                            ? 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)]'
                            : 'bg-accent text-[var(--text-primary)] hover:opacity-90'
                        }`}
                      >
                        {selectedPageDetail.page.user_is_following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        <span>{selectedPageDetail.page.user_is_following ? (isRtl ? 'تتابعها' : 'Following') : (isRtl ? '+ متابعة الصفحة' : '+ Follow Page')}</span>
                      </button>

                      <button
                        onClick={async () => {
                          const shareUrl = getPageShareUrl(selectedPageDetail.page);
                          const shareText = getPageShareText(selectedPageDetail.page, isRtl);
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: selectedPageDetail.page.name,
                                text: shareText,
                                url: shareUrl
                              });
                              return;
                            } catch (e: any) {
                              if (e?.name === 'AbortError') return;
                            }
                          }
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success(isRtl ? 'تم نسخ رابط الصفحة بنجاح' : 'Page link copied!');
                          }
                        }}
                        className="px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] shadow-sm cursor-pointer border border-[var(--border-default)]"
                        title={isRtl ? 'مشاركة رابط هذه الصفحة' : 'Share Page Link'}
                      >
                        <Share2 size={16} className="text-accent" />
                        <span>{isRtl ? 'مشاركة الصفحة' : 'Share Page'}</span>
                      </button>

                      {(() => {
                        const isPageOwnerOrManager = user && (
                          selectedPageDetail.page.user_id === user.id ||
                          selectedPageDetail.page.owner_id === user.id ||
                          user.role === 'admin' ||
                          (selectedPageDetail.page.managers && (
                            (() => {
                              try {
                                const list = typeof selectedPageDetail.page.managers === 'string'
                                  ? JSON.parse(selectedPageDetail.page.managers)
                                  : selectedPageDetail.page.managers;
                                return Array.isArray(list) && list.some((m: any) => m.userId === user.id || m.email === user.email);
                              } catch (e) {
                                return false;
                              }
                            })()
                          ))
                        );
                        if (!isPageOwnerOrManager) return null;
                        return (
                          <button
                            onClick={() => {
                              setEditingPageData(selectedPageDetail.page);
                              setIsEditPageModalOpen(true);
                            }}
                            className="px-4 py-2.5 min-h-[44px] rounded-[var(--radius-md)] text-xs font-extrabold transition-theme flex items-center gap-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] shadow-sm cursor-pointer border border-[var(--border-default)]"
                          >
                            <Settings size={16} />
                            <span>{isRtl ? 'إدارة وتعديل الصفحة' : 'Manage & Edit Page'}</span>
                          </button>
                        );
                      })()}

                      {selectedPageDetail.page.whatsapp_number && (
                        <a
                          href={`https://wa.me/${selectedPageDetail.page.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 min-h-[44px] rounded-[var(--radius-md)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center gap-1.5 transition-theme shadow-2xs cursor-pointer font-extrabold text-xs" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                          title={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                          aria-label={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                        >
                          <Phone size={16} />
                          <span className="hidden sm:inline">{isRtl ? 'واتساب' : 'WhatsApp'}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold">{selectedPageDetail.page.name}</h2>
                      <CheckCircle2 size={20} className="text-[var(--fg-accent)] shrink-0" />
                      <span className="px-2.5 py-0.5 rounded-shape-xs text-[11px] font-bold bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/30">
                        {isRtl ? 'صفحة تجارية موثقة' : 'Commercial Page'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                      {selectedPageDetail.page.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {selectedPageDetail.page.city}</span>
                      {selectedPageDetail.page.owner_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                            <UserCheck size={13} className="text-accent" />
                            {isRtl ? 'المالك:' : 'Owner:'} {selectedPageDetail.page.owner_name}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{selectedPageDetail.page.followers_count} {isRtl ? 'متابع' : 'Followers'}</span>
                      <span>•</span>
                      <span className="font-bold text-accent">{selectedPageDetail.ads.length} {isRtl ? 'منشور إعلاني خاص بالصفحة' : 'Page Posts'}</span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-2 border-b border-[var(--border-default)] pt-3">
                    <button
                      onClick={() => setPageDetailTab('ads')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'ads'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'إعلانات ومنشورات الصفحة' : 'Page Posts & Ads'}
                    </button>
                    <button
                      onClick={() => setPageDetailTab('about')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'about'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'معلومات الشركة والتواصل' : 'About & Contact'}
                    </button>
                    <button
                      onClick={() => setPageDetailTab('media')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-theme ${
                        pageDetailTab === 'media'
                          ? 'border-accent text-accent'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isRtl ? 'معرض التصاميم والصور' : 'Media Gallery'}
                    </button>
                  </div>

                  {}
                  {pageDetailTab === 'ads' && (
                    <div className="pt-2 space-y-4">
                      {user && myPagesList.some(p => p.id === selectedPageDetail.page.id) && (
                        <div className="p-3.5 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-accent">
                            {isRtl ? 'أنت مالك هذه الصفحة التجارية! يمكنك إضافة منشور إعلاني جديد باسمها.' : 'You own this page! Add a new ad post.'}
                          </span>
                          <button
                            onClick={() => {
                              setAdFormData(prev => ({ ...prev, page_id: selectedPageDetail.page.id }));
                              setIsAdModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent text-[var(--text-primary)] font-bold text-xs"
                          >
                            + {isRtl ? 'نشر إعلان باسم الصفحة' : 'Post as Page'}
                          </button>
                        </div>
                      )}

                      {selectedPageDetail.ads.length === 0 ? (
                        <div className="text-center py-12 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-[var(--radius-md)] space-y-2">
                          <Megaphone size={32} className="text-[var(--text-secondary)] mx-auto" />
                          <p className="text-xs text-[var(--text-muted)] italic">
                            {isRtl ? 'لا توجد إعلانات نشطة لهذه الصفحة حالياً' : 'No active ads for this page yet.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full">
                          {selectedPageDetail.ads.map((ad, adIdx) => (
                            <div key={`page-ad-${ad.id}-${adIdx}`} className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2.5">
                              <div className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer" onClick={() => handleOpenLightbox(getMediaUrl(ad.image_url), ad.media_gallery, 0, ad.title, ad.author_name, ad)}>
                                <img
                                  src={getMediaUrl(ad.image_url)}
                                  alt={ad.title || 'Ad thumbnail'}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.dataset.fallback) {
                                      target.dataset.fallback = 'true';
                                      target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
                                    }
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <h4 className="text-xs font-extrabold line-clamp-1">{ad.title}</h4>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{ad.description}</p>

                              <div className="flex items-center justify-end pt-1 gap-1.5 ms-auto">
                                <button
                                  onClick={() => handleMessageAdvertiser(ad)}
                                  disabled={messagingAdId === ad.id}
                                  className="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-accent/40 flex items-center justify-center transition-theme shadow-2xs disabled:opacity-50 cursor-pointer"
                                  title={isRtl ? 'مراسلة المعلن في محادثة خاصة' : 'Message Advertiser'}
                                  aria-label={isRtl ? 'مراسلة المعلن في محادثة خاصة' : 'Message Advertiser'}
                                >
                                  {messagingAdId === ad.id ? (
                                    <Loader2 size={14} className="animate-spin text-accent" />
                                  ) : (
                                    <MessageCircle size={14} className="text-accent shrink-0" />
                                  )}
                                </button>

                                {ad.whatsapp_number && (
                                  <button
                                    onClick={(e) => handleWhatsAppClick(ad, e)}
                                    className="w-8 h-8 rounded-[var(--radius-xs)] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center transition-theme shadow-2xs cursor-pointer" style={{ color: SOCIAL_COLORS.whatsapp.base }}
                                    title={isRtl ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                                    aria-label={isRtl ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                                  >
                                    <Phone size={14} className="shrink-0" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {}
                  {pageDetailTab === 'about' && (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3 text-xs">
                      <h4 className="font-extrabold text-sm border-b border-[var(--border-default)] pb-2">
                        {isRtl ? 'تفاصيل الصفحة التجارية:' : 'Business Details:'}
                      </h4>
                      <p className="text-[var(--text-secondary)] leading-relaxed">{selectedPageDetail.page.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                          <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'المحافظة / المدينة:' : 'City:'}</span>
                          <strong className="font-bold text-xs">{selectedPageDetail.page.city}</strong>
                        </div>

                        {selectedPageDetail.page.address && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'العنوان التفصيلي:' : 'Address:'}</span>
                            <strong className="font-bold text-xs">{selectedPageDetail.page.address}</strong>
                          </div>
                        )}

                        {selectedPageDetail.page.whatsapp_number && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'الواتساب الرسمي:' : 'WhatsApp:'}</span>
                            <strong className="font-bold text-xs text-accent">{selectedPageDetail.page.whatsapp_number}</strong>
                          </div>
                        )}

                        {selectedPageDetail.page.website_url && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                            <span className="text-[var(--text-muted)] text-[10px] block">{isRtl ? 'الموقع الإلكتروني:' : 'Website:'}</span>
                            <a href={selectedPageDetail.page.website_url} target="_blank" rel="noreferrer" className="font-bold text-xs text-blue-500 hover:underline">
                              {selectedPageDetail.page.website_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {}
                  {pageDetailTab === 'media' && (
                    <div className="pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedPageDetail.ads.map((ad, gIdx) => (
                          <div
                            key={`page-gallery-ad-${ad.id}-${gIdx}`}
                            onClick={() => handleOpenLightbox(getMediaUrl(ad.image_url), ad.media_gallery, 0, ad.title, ad.author_name, ad)}
                            className="aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer relative group bg-[var(--surface-subtle)]"
                          >
                            <img
                              src={getMediaUrl(ad.image_url)}
                              alt={ad.title || 'Ad gallery image'}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = 'true';
                                  target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
                                }
                              }}
                              className="w-full h-full object-cover transition-theme"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-theme flex items-end p-2 text-[var(--text-primary)] text-[10px] font-bold">
                              {ad.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            ) : (
              <>
                {}
                {}
                {}
                {activeTab === 'board' && (
                  <BoardFeed
                    isRtl={isRtl}
                    selectedCity={selectedCity}
                    selectedRadius={selectedRadius}
                    selectedCities={selectedCities}
                    selectedCountries={selectedCountries}
                    setIsLocationFlyoutOpen={setIsLocationFlyoutOpen}
                    handleDetectGpsLocation={handleDetectGpsLocation}
                    isDetectingGps={isDetectingGps}
                    triggerFeedRefresh={triggerFeedRefresh}
                    isRefreshing={isRefreshing}
                    storiesProps={{
                      isRtl,
                      activeTab,
                      setActiveTab,
                      token,
                      user,
                      setIsStoryModalOpen,
                      onOpenUploadStory: (mode: 'media' | 'text' = 'media') => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        setStoryUploadMode(mode);
                        setIsStoryModalOpen(true);
                      },
                      onOpenUploadReel: () => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        openReelUploadModal();
                      },
                      representativeStories,
                      orderedStories,
                      previewingVideoStoryId,
                      setPreviewingVideoStoryId,
                      setSelectedStoryIndex,
                      setIsStoryViewerOpen,
                      storyPressTimerRef,
                      getMediaUrl,
                    }}
                    composerProps={{
                      user,
                      token,
                      isRtl,
                      setIsAdModalOpen,
                      setIsStreamSetupOpen,
                      openPostUploadModal,
                      openReelUploadModal,
                      openStudioModal: () => setIsStudioModalOpen(true),
                    }}
                    ads={ads}
                    loading={loading}
                    hasMoreAds={hasMoreAds}
                    loadingMoreAds={loadingMoreAds}
                    handleLoadMoreAds={handleLoadMoreAds}
                    setActiveReelModalId={setActiveReelModalId}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    token={token}
                    user={user}
                    handleReportAd={handleReportAd}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleToggleCommentLike={handleToggleCommentLike}
                    expandedAdId={expandedAdId}
                    commentsMap={commentsMap}
                    loadingCommentsAdId={loadingCommentsAdId}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    handleAddComment={handleAddComment}
                    replyToCommentId={replyToCommentId}
                    setReplyToCommentId={setReplyToCommentId}
                    handleMessageAdvertiser={handleMessageAdvertiser}
                    messagingAdId={messagingAdId}
                    setInquireAd={setInquireAd}
                    handleWhatsAppClick={handleWhatsAppClick}
                    handleShareAd={handleShareAd}
                    handleOpenPageDetail={handleOpenPageDetail}
                    handleOpenUserDetail={handleOpenUserDetail}
                    handleOpenLightbox={handleOpenLightbox}
                    openPostUploadModal={openPostUploadModal}
                    handleOpenBoostModal={handleOpenBoostModal}
                    handleEditAd={handleEditAd}
                    handleDeleteAd={handleDeleteAd}
                    handleToggleSave={handleToggleSave}
                    setAds={setAds}
                    setSavedAds={setSavedAds}
                  />
                )}



                {}
                {}
                {}
                {activeTab === 'saved' && (
                  <SavedPostsTab
                    savedAds={savedAds}
                    loadingSaved={loadingSaved}
                    isRtl={isRtl}
                    token={token}
                    user={user}
                    setActiveTab={setActiveTab}
                    handleReportAd={handleReportAd}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleToggleCommentLike={handleToggleCommentLike}
                    expandedAdId={expandedAdId}
                    commentsMap={commentsMap}
                    loadingCommentsAdId={loadingCommentsAdId}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    handleAddComment={handleAddComment}
                    replyToCommentId={replyToCommentId}
                    setReplyToCommentId={setReplyToCommentId}
                    handleMessageAdvertiser={handleMessageAdvertiser}
                    messagingAdId={messagingAdId}
                    setInquireAd={setInquireAd}
                    handleWhatsAppClick={handleWhatsAppClick}
                    handleShareAd={handleShareAd}
                    handleOpenPageDetail={handleOpenPageDetail}
                    handleOpenUserDetail={handleOpenUserDetail}
                    handleOpenLightbox={handleOpenLightbox}
                    openPostUploadModal={openPostUploadModal}
                    handleOpenBoostModal={handleOpenBoostModal}
                    handleEditAd={handleEditAd}
                    handleDeleteAd={handleDeleteAd}
                    handleToggleSave={handleToggleSave}
                    setAds={setAds}
                    setSavedAds={setSavedAds}
                  />
                )}

                {}
                {}
                {}
                {activeTab === 'inquiries' && (
                  <InquiriesTab
                    isRtl={isRtl}
                    setActiveTab={setActiveTab}
                    selectedInboxAd={selectedInboxAd}
                    setSelectedInboxAd={setSelectedInboxAd}
                    inquiriesSearchTerm={inquiriesSearchTerm}
                    setInquiriesSearchTerm={setInquiriesSearchTerm}
                    inquiriesLoading={inquiriesLoading}
                    inquiriesList={inquiriesList}
                    filteredInquiriesList={filteredInquiriesList}
                    fetchInquiries={fetchInquiries}
                  />
                )}
                </>
              )}
            </div>

            {}
            <div className="hidden xl:flex flex-col w-64 xl:w-[290px] 2xl:w-[320px] shrink-0 gap-4 order-3 sticky top-[calc(60px+env(safe-area-inset-top,0px))] max-h-[calc(100vh-5.5rem)] overflow-y-auto scrollbar-none overscroll-contain">
              {}
              <RecommendationWidget
                variant="bulletin"
                filterType="bulletin"
                limit={3}
                title={isRtl ? 'إعلانات جانبية موصى بها' : 'Recommended Side Ads'}
                subtitle={isRtl ? 'مقترحات مخصصة بناءً على سلوكك واهتماماتك' : 'Tailored ad suggestions'}
                className="ui-card-container"
                onAdClick={handleRecommendationAdClick}
              />

              {}
              <div className="ui-card-container flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <UserPlus size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
                        <span>{isRtl ? 'صفحات موصى بها' : 'Recommended Pages'}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                    <button
                      onClick={() => setActiveTab('pages')}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'عرض كافة الصفحات التجارية' : 'View All Pages'}
                    >
                      <ArrowLeft size={14} className={`transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5 rotate-180'}`} />
                    </button>

                    <button
                      onClick={() => fetchPages()}
                      disabled={pagesLoading}
                      className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
                      title={isRtl ? 'تحديث' : 'Refresh'}
                    >
                      <RefreshCw size={14} className={pagesLoading ? 'animate-spin text-accent' : 'transition-transform duration-300 group-hover:rotate-180'} />
                    </button>
                  </div>
                </div>

                {pagesLoading ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    {[1, 2, 3].map(n => (
                      <div key={`bulletin-skel-rec-col3-${n}`} className="h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] animate-pulse"></div>
                    ))}
                  </div>
                ) : pagesList.slice(0, 5).length === 0 ? (
                  <div className="text-center py-3 space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">{isRtl ? 'لا توجد صفحات حالياً' : 'No pages currently'}</p>
                    <button
                      onClick={() => {
                        if (!token) {
                          toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
                          return;
                        }
                        setIsPageModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/10 transition-colors border border-accent/30 rounded-shape-sm cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{isRtl ? 'إنشاء صفحة تجارية' : 'Create Merchant Page'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    {pagesList.slice(0, 5).map((page, idx) => (
                      <div
                        key={`rec-page-col3-${page.id}-${idx}`}
                        onClick={() => handleOpenPageDetail(page.id)}
                        className="group relative platform-tab-btn cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <BulletinAvatar
                              src={page.avatar_url}
                              alt={page.name}
                              size="sm"
                              isPage={true}
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">{page.name}</h4>
                                <CheckCircle2 size={12} className="text-[var(--fg-accent)] shrink-0" />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{page.city} • {page.followers_count} {isRtl ? 'متابع' : 'followers'}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-shape-xs bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-all shrink-0">
                                {isRtl ? 'زيارة' : 'Visit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {}
      {}
      <LiveStreamModal
        isOpen={isLiveStreamOpen}
        onClose={() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          setIsLiveStreamOpen(false);
        }}
        isRtl={isRtl}
        user={user}
        walletBalance={walletBalance}
        streamTitleInput={streamTitleInput}
        streamFeed={streamFeed}
        currentFeedIndex={currentFeedIndex}
        setCurrentFeedIndex={setCurrentFeedIndex}
        streamRef={streamRef}
        videoRef={videoRef}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        liveViewers={liveViewers}
        liveLikes={liveLikes}
        handleLiveLike={handleLiveLike}
        showLikeAnimation={showLikeAnimation}
        liveComments={liveComments}
        newLiveComment={newLiveComment}
        setNewLiveComment={setNewLiveComment}
        handleSendLiveComment={handleSendLiveComment}
        isGiftModalOpen={isGiftModalOpen}
        setIsGiftModalOpen={setIsGiftModalOpen}
        giftsCatalog={giftsCatalog}
        handleSendGift={handleSendGift}
      />

      {}
      {}
      {}
      <AppModal
        open={isAdModalOpen}
        onClose={() => {
          cleanupComposerMediaUrls();
          setIsAdModalOpen(false);
        }}
        size="md"
        layer="modal"
        closeOnBackdrop={false}
        contentClassName="!p-0 !space-y-0 max-w-[480px] w-full h-fit max-h-[86vh] sm:max-h-[82vh] flex flex-col justify-start overflow-hidden rounded-[var(--radius-lg)] shadow-2xl bg-[var(--surface-card)] border border-[var(--border-default)]"
      >
              {/* Modal Header - Streamlined & Compact */}
              <div className="bg-[var(--surface-card)] border-b border-[var(--border-default)] px-3 py-2 text-[var(--text-primary)] relative shrink-0">
                {composerView !== 'main' ? (
                  <div className="flex items-center justify-between w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setComposerView('main');
                        setCustomLocationSearch('');
                        setLocationSuggestions([]);
                      }}
                      className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] transition-all border border-[var(--border-default)] flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                      title={isRtl ? 'رجوع' : 'Back'}
                    >
                      <ArrowLeft size={13} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] text-center flex-1 px-1 truncate">
                      {composerView === 'location'
                        ? (isRtl ? 'البحث عن موقع' : 'Search Location')
                        : composerView === 'feelings'
                        ? (isRtl ? 'الشعور أو النشاط' : 'Feeling / Activity')
                        : composerView === 'tagging'
                        ? (isRtl ? 'الإشارة إلى أشخاص' : 'Tag People')
                        : (isRtl ? 'الرموز التعبيرية' : 'Emojis')}
                    </h3>
                    {composerView === 'location' && adFormData.location_city ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAdFormData(prev => ({ ...prev, location_city: '' }));
                          toast.success(isRtl ? 'تمت إزالة الموقع' : 'Location cleared');
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-1.5 py-0.5 rounded-shape-xs hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      >
                        {isRtl ? 'إزالة' : 'Clear'}
                      </button>
                    ) : composerView === 'feelings' && adFormData.feeling ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAdFormData(prev => ({ ...prev, feeling: '' }));
                          toast.success(isRtl ? 'تمت إزالة الشعور' : 'Feeling cleared');
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-1.5 py-0.5 rounded-shape-xs hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      >
                        {isRtl ? 'إزالة' : 'Clear'}
                      </button>
                    ) : (
                      <div className="w-6 shrink-0" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full gap-2">
                    {/* Left / Start: Avatar & User Name */}
                    <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                      <BulletinAvatar
                        src={adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.avatar_url : user?.avatar}
                        alt={adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.name : user?.name}
                        size="sm"
                        isPage={Boolean(adFormData.page_id)}
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] truncate max-w-[100px] sm:max-w-[130px]">
                        {adFormData.page_id ? myPagesList.find(p => p.id === Number(adFormData.page_id))?.name : user?.name}
                      </span>
                    </div>

                    {/* Center: Title */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] text-center truncate flex-1 px-1">
                      {isEditMode ? (isRtl ? 'تعديل المنشور' : 'Edit Post') : (isRtl ? 'إنشاء منشور' : 'Create Post')}
                    </h3>

                    {/* Right / End: Close Button */}
                    <button
                      type="button"
                      onClick={() => {
                        cleanupComposerMediaUrls();
                        setIsAdModalOpen(false);
                      }}
                      className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-default)] flex items-center justify-center cursor-pointer shrink-0"
                      title={isRtl ? 'إغلاق' : 'Close'}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 scrollbar-thin flex flex-col justify-start">
                {composerView === 'main' && (
                  <form onSubmit={handleCreateCampaign} className="flex flex-col gap-2 justify-start flex-1">
                    {/* Single-Line Compact Toolbar for Selectors & Tags */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 border-b border-[var(--border-default)]/40 whitespace-nowrap text-[10px] sm:text-[11px] font-bold shrink-0">
                      {/* 1. Page Selector (if user manages pages) */}
                      {myPagesList.length > 0 && (
                        <div className="relative shrink-0">
                          <select
                            value={String(adFormData.page_id || '')}
                            onChange={(e) => setAdFormData({ ...adFormData, page_id: e.target.value })}
                            className="appearance-none text-[10px] font-bold ps-2 pe-4 py-0.5 h-6 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/70 transition-colors cursor-pointer outline-none max-w-[110px] truncate relative before:absolute before:-inset-2 before:content-['']"
                          >
                            <option value="">{isRtl ? 'شخصي' : 'Personal'}</option>
                            {myPagesList.map((p) => (
                              <option key={p.id} value={String(p.id)}>{p.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute end-1 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                      )}

                      {/* 2. Audience Selector Button (Icons only - no text) */}
                      <button
                        type="button"
                        onClick={() => setIsAudienceModalOpen(true)}
                        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 h-6 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/70 transition-colors cursor-pointer relative before:absolute before:-inset-2 before:content-['']"
                        title={
                          adFormData.audience === 'friends'
                            ? (isRtl ? 'الأصدقاء' : 'Friends')
                            : adFormData.audience === 'only_me'
                            ? (isRtl ? 'أنا فقط' : 'Only Me')
                            : (isRtl ? 'العامة' : 'Public')
                        }
                      >
                        {adFormData.audience === 'friends' ? (
                          <Users size={12} className="text-[var(--fg-accent)] shrink-0" />
                        ) : adFormData.audience === 'only_me' ? (
                          <Lock size={12} className="text-amber-500 shrink-0" />
                        ) : (
                          <Globe size={12} className="text-[var(--text-muted)] shrink-0" />
                        )}
                        <ChevronDown size={10} className="text-[var(--text-muted)]" />
                      </button>

                      {/* 3. Post Format Selector */}
                      <button
                        type="button"
                        onClick={() => {
                          setAdFormData(prev => ({
                            ...prev,
                            ad_format: prev.ad_format === 'post' ? 'reel' : prev.ad_format === 'reel' ? 'story' : 'post'
                          }));
                        }}
                        className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 h-6 rounded-shape-xs bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] hover:opacity-90 border border-[var(--border-accent)]/30 transition-colors cursor-pointer relative before:absolute before:-inset-2 before:content-['']"
                        title={isRtl ? 'تغيير التنسيق' : 'Change format'}
                      >
                        <Clapperboard size={11} className="shrink-0 text-[var(--fg-accent)]" />
                        <span>
                          {adFormData.ad_format === 'reel' ? (isRtl ? 'ريلز' : 'Reel') :
                           adFormData.ad_format === 'story' ? (isRtl ? 'قصة' : 'Story') :
                           (isRtl ? 'منشور' : 'Post')}
                        </span>
                        <ChevronDown size={10} className="text-[var(--fg-accent)]/70" />
                      </button>

                      {/* 4. AI Tag Toggle (AI label only) */}
                      <button
                        type="button"
                        onClick={() => setAdFormData(prev => ({ ...prev, is_ai_generated: !prev.is_ai_generated }))}
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 h-6 rounded-shape-xs transition-colors cursor-pointer border relative before:absolute before:-inset-2 before:content-[''] ${
                          adFormData.is_ai_generated
                            ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border-[var(--border-accent)]/40'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-inset)] border-[var(--border-default)]/70'
                        }`}
                        title={isRtl ? 'محتوى مُنشأ بالذكاء الاصطناعي' : 'AI generated content'}
                      >
                        <Sparkles size={11} className={adFormData.is_ai_generated ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'} />
                        <span>AI</span>
                      </button>

                      {/* 5. Location Tag / Button (Icon only or compact city badge) */}
                      {adFormData.location_city ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 h-6 rounded-shape-xs bg-rose-500/15 text-rose-500 border border-rose-500/30 relative before:absolute before:-inset-2 before:content-['']">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate max-w-[80px]">{adFormData.location_city}</span>
                          <button
                            type="button"
                            onClick={() => setAdFormData(prev => ({ ...prev, location_city: '' }))}
                            className="hover:text-red-500 transition-colors cursor-pointer ms-0.5 p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setComposerView('location')}
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 h-6 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/70 transition-colors cursor-pointer relative before:absolute before:-inset-2 before:content-['']"
                          title={isRtl ? 'إضافة موقع' : 'Add location'}
                        >
                          <MapPin size={11} className="shrink-0 text-rose-500" />
                        </button>
                      )}

                      {/* Active Feeling Tag (if selected) */}
                      {adFormData.feeling && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 h-6 rounded-shape-xs bg-amber-500/15 text-amber-500 border border-amber-500/30 relative before:absolute before:-inset-2 before:content-['']">
                          <span>{FEELINGS.find(f => f.id === adFormData.feeling)?.icon}</span>
                          <span className="truncate max-w-[70px]">{isRtl ? FEELINGS.find(f => f.id === adFormData.feeling)?.labelAr : FEELINGS.find(f => f.id === adFormData.feeling)?.labelEn}</span>
                          <button
                            type="button"
                            onClick={() => setAdFormData(prev => ({ ...prev, feeling: '' }))}
                            className="hover:text-red-500 transition-colors cursor-pointer p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Textarea Input - Dynamic Compact Sizing */}
                    <div className={`flex flex-col gap-1 flex-1 ${Boolean(adFormData.media_gallery?.length || adFormData.image_url || adFormData.video_url || videoMetadataInfo.localVideoUrl) ? 'min-h-[44px] sm:min-h-[52px]' : 'min-h-[80px] sm:min-h-[100px]'} pt-0.5`}>
                      <textarea
                        value={adFormData.description}
                        onChange={(e) => handleComposerTextChange(e.target.value)}
                        placeholder={
                          isRtl
                            ? `بمَ تفكر، ${user?.name ? user.name.split(' ')[0] : ''}؟`
                            : `What's on your mind, ${user?.name ? user.name.split(' ')[0] : ''}?`
                        }
                        className="w-full text-sm sm:text-base bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none flex-1 min-h-[40px] text-[var(--text-primary)] p-0 placeholder-[var(--text-muted)] font-normal leading-relaxed"
                        rows={Boolean(adFormData.media_gallery?.length || adFormData.image_url || adFormData.video_url || videoMetadataInfo.localVideoUrl) ? 2 : 3}
                        autoFocus
                      />

                      {/* Character Counter */}
                      <div className="flex justify-end text-[9px] text-[var(--text-muted)] font-mono">
                        <span dir="ltr" className={`font-mono ${adFormData.description.length >= 900 ? 'text-[var(--fg-danger)] font-bold' : ''}`}>
                          {adFormData.description.length} / 1000
                        </span>
                      </div>

                      {/* Hashtag & Mention Auto-complete */}
                      {suggestionType !== 'none' && (
                        <div className="my-2 p-1.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl shadow-lg max-h-[150px] overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="flex items-center justify-between px-2 pb-1 border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] font-bold">
                            <span>
                              {suggestionType === 'hashtag'
                                ? (isRtl ? 'وسوم شائعة (#)' : 'Trending Hashtags (#)')
                                : (isRtl ? 'إشارة إلى مستخدم (@)' : 'Mentions (@)')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSuggestionType('none');
                                setSuggestionQuery('');
                              }}
                              className="hover:text-red-500 font-bold text-xs cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                          <div className="divide-y divide-[var(--border-default)] mt-1">
                            {suggestionType === 'hashtag' && (
                              trendingHashtags
                                .filter(tag => !suggestionQuery || tag.toLowerCase().includes(suggestionQuery.toLowerCase()))
                                .map((tag, idx) => (
                                  <button
                                    key={`has-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(tag)}
                                    className="w-full text-start px-2 py-1.5 text-xs hover:bg-accent/10 hover:text-accent transition-colors font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span className="text-accent font-bold">#</span>
                                    <span>{tag}</span>
                                  </button>
                                ))
                            )}

                            {suggestionType === 'mention' && (
                              mentionSuggestions
                                .filter(item => {
                                  const q = suggestionQuery.toLowerCase();
                                  return !suggestionQuery || item.name.toLowerCase().includes(q) || item.username.toLowerCase().includes(q);
                                })
                                .map((item, idx) => {
                                  const isBroadcast = item.type === 'broadcast';
                                  return (
                                    <button
                                      key={`men-${idx}`}
                                      type="button"
                                      onClick={() => handleSelectSuggestion(item.username)}
                                      className="w-full text-start px-2 py-1.5 text-xs hover:bg-accent/10 hover:text-accent transition-colors font-semibold text-[var(--text-secondary)] flex items-center justify-between cursor-pointer"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-accent font-bold">{isBroadcast ? '📢' : '@'}</span>
                                        <span>{isRtl && item.labelAr ? item.labelAr : item.name}</span>
                                      </div>
                                      {!isBroadcast && (
                                        <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                          @{item.username}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload progress & transcoding status */}
                    {(videoMetadataInfo.processingStage === 'uploading' || videoMetadataInfo.processingStage === 'transcoding') && (
                      <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                          <span className="flex items-center gap-1.5">
                            <Loader2 size={13} className="animate-spin text-accent" />
                            <span>
                              {videoMetadataInfo.processingStage === 'uploading'
                                ? (isRtl ? 'جاري رفع الفيديو...' : 'Uploading video...')
                                : (isRtl ? 'جاري معالجة الفيديو...' : 'Processing video...')}
                            </span>
                          </span>
                          <span className="font-mono text-accent text-xs">{Math.round(videoMetadataInfo.uploadProgress || 0)}%</span>
                        </div>
                        <div className="w-full bg-[var(--surface-card)] rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-accent h-full transition-all duration-200"
                            style={{ width: `${videoMetadataInfo.uploadProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Always-present hidden file input for native device upload */}
                    <input
                      id="composer-mixed-media-input"
                      type="file"
                      multiple
                      accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.3gp,.m4v,.wmv,.flv,.ogv,.ts,.mts,.m2ts"
                      onChange={handleMixedMediaSelect}
                      className="hidden"
                    />

                    {/* Media Loaded State: Single Video or Collage Preview */}
                    {Boolean(
                      (adFormData.media_gallery && adFormData.media_gallery.length > 0) ||
                      adFormData.image_url ||
                      adFormData.video_url ||
                      videoMetadataInfo.localVideoUrl
                    ) && (
                      <div>
                        <ComposerMediaPreview
                          mediaItems={
                            adFormData.video_url || videoMetadataInfo.localVideoUrl
                              ? [
                                  {
                                    id: 'vid-0',
                                    url: adFormData.video_url || videoMetadataInfo.localVideoUrl || '',
                                    type: 'video' as const,
                                    caption: '',
                                    thumbnailUrl: adFormData.image_url || undefined
                                  }
                                ]
                              : adFormData.media_gallery && adFormData.media_gallery.length > 0
                                ? adFormData.media_gallery
                                : (adFormData.image_url
                                    ? adFormData.image_url.split(',').map((u, i) => ({
                                        id: `img-${i}`,
                                        url: u.trim(),
                                        type: 'image' as const,
                                        caption: ''
                                      }))
                                    : [])
                          }
                          onOpenMediaManager={() => setIsMediaManagerOpen(true)}
                          onClearAll={() => {
                            cleanupComposerMediaUrls();
                            setAdFormData(prev => ({
                              ...prev,
                              image_url: '',
                              video_url: '',
                              media_gallery: []
                            }));
                            setVideoMetadataInfo({ processingStage: 'done' });
                          }}
                          onAddMoreClick={() => {
                            const input = document.getElementById('composer-mixed-media-input') as HTMLInputElement;
                            if (input) input.click();
                          }}
                          onSelectCover={(coverUrl, file) => {
                            setAdFormData(prev => ({
                              ...prev,
                              image_url: coverUrl,
                              media_gallery: prev.media_gallery?.map(item =>
                                item.type === 'video' ? { ...item, thumbnailUrl: coverUrl } : item
                              )
                            }));
                            toast.success(isRtl ? 'تم تعيين صورة الغلاف' : 'Cover image selected');
                            if (file) {
                              const formData = new FormData();
                              formData.append('file', file);
                              fetch('/api/files/upload', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token || secureStorage.getSync('app_token') || ''}`
                                },
                                body: formData
                              })
                                .then(res => res.json())
                                .then(data => {
                                  const uploadedUrl = data.fileUrl || data.file?.file_url || data.file?.url || data.url;
                                  if (uploadedUrl) {
                                    const finalUrl = getMediaUrl(uploadedUrl);
                                    setAdFormData(prev => ({
                                      ...prev,
                                      image_url: finalUrl,
                                      media_gallery: prev.media_gallery?.map(item =>
                                        item.type === 'video' ? { ...item, thumbnailUrl: finalUrl } : item
                                      )
                                    }));
                                  }
                                })
                                .catch(() => {});
                            }
                          }}
                          onOpenTrimmer={() => {
                            setTrimmerVideoUrl(adFormData.video_url || videoMetadataInfo.localVideoUrl || '');
                            setIsTrimmerModalOpen(true);
                          }}
                          isRtl={isRtl}
                        />
                      </div>
                    )}

                    {/* WhatsApp CTA Action Card (if enabled) */}
                    {adFormData.has_whatsapp_button && (
                      <div className="p-1.5 sm:p-2 bg-[#25D366]/5 rounded-shape-xs border border-[#25D366]/20 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-shape-xs bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
                            <MessageCircle size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={adFormData.whatsapp_number}
                              onChange={(e) => setAdFormData({ ...adFormData, whatsapp_number: e.target.value })}
                              placeholder={isRtl ? 'رقم الواتساب (مثال: 970599000000+)' : 'WhatsApp (e.g. +970599000000)'}
                              className="w-full text-[11px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 text-[var(--text-primary)] font-bold placeholder-[var(--text-muted)]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAdFormData(prev => ({ ...prev, has_whatsapp_button: false }))}
                          className="w-5 h-5 rounded hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-[var(--text-muted)] transition-colors cursor-pointer shrink-0"
                          title={isRtl ? 'إزالة زر الواتساب' : 'Remove WhatsApp CTA'}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}

                    {/* Attached Audio Preview Card (if selected) */}
                    {adFormData.audio_url && (
                      <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-shape-xs border border-purple-500/25 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-shape-xs bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                            <Music size={14} className="animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                              {adFormData.audio_title || (isRtl ? 'مقطع صوتي / موسيقى' : 'Audio Track')}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] truncate">
                              {adFormData.audio_artist ? `${adFormData.audio_artist} • ` : ''}{isRtl ? 'مكتبة بيربليكستا' : 'Perplexta Audio'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsAudioPickerOpen(true)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors cursor-pointer"
                          >
                            {isRtl ? 'تغيير' : 'Change'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdFormData(prev => ({
                                ...prev,
                                audio_url: '',
                                audio_title: '',
                                audio_artist: '',
                                audio_track_id: ''
                              }));
                              setSelectedAudioTrack(null);
                            }}
                            className="w-5 h-5 rounded hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-[var(--text-muted)] transition-colors cursor-pointer"
                            title={isRtl ? 'إزالة الموسيقى' : 'Remove Audio'}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* "Add to Your Post" Toolbar (Facebook Standard - Compact & Crisp) */}
                    <div className="px-2.5 py-1.5 rounded-shape-xs border border-[var(--border-default)] bg-[var(--surface-subtle)]/40 flex items-center justify-between shadow-2xs">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] shrink-0">
                        {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Media Upload Icon */}
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('composer-mixed-media-input') as HTMLInputElement;
                            if (input) input.click();
                          }}
                          className={`w-7 h-7 rounded-shape-xs flex items-center justify-center cursor-pointer transition-colors ${
                            Boolean(adFormData.media_gallery?.length || adFormData.image_url || adFormData.video_url)
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : 'hover:bg-[var(--surface-card)] text-[#22c55e]'
                          }`}
                          title={isRtl ? 'صور أو فيديو' : 'Photos or Video'}
                        >
                          <ImageIcon size={15} />
                        </button>

                        {/* Music / Audio Library */}
                        <button
                          type="button"
                          onClick={() => setIsAudioPickerOpen(true)}
                          className={`w-7 h-7 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                            adFormData.audio_url ? 'bg-purple-500/25 text-purple-400 ring-1 ring-purple-500/40' : 'hover:bg-[var(--surface-card)] text-purple-400'
                          }`}
                          title={isRtl ? 'موسيقى ومؤثرات صوتية' : 'Music & Audio'}
                        >
                          <Music size={15} />
                        </button>

                        {/* Tag People */}
                        <button
                          type="button"
                          onClick={() => setComposerView('tagging')}
                          className="w-7 h-7 rounded-shape-xs hover:bg-[var(--surface-card)] text-[var(--accent)] flex items-center justify-center transition-colors cursor-pointer"
                          title={isRtl ? 'إشارة إلى أشخاص' : 'Tag people'}
                        >
                          <Users size={15} />
                        </button>

                        {/* WhatsApp CTA Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setAdFormData(prev => ({
                              ...prev,
                              has_whatsapp_button: !prev.has_whatsapp_button,
                              whatsapp_number: prev.whatsapp_number || (user as any)?.phone || ''
                            }));
                            if (!adFormData.has_whatsapp_button) {
                              toast.success(isRtl ? 'تم إرفاق زر الواتساب' : 'WhatsApp CTA attached');
                            }
                          }}
                          className={`w-7 h-7 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                            adFormData.has_whatsapp_button ? 'bg-[#25D366]/20 text-[#25D366]' : 'hover:bg-[var(--surface-card)] text-[#25D366]'
                          }`}
                          title={isRtl ? 'زر مراسلة واتساب' : 'WhatsApp Button'}
                        >
                          <MessageCircle size={15} />
                        </button>

                        {/* Location */}
                        <button
                          type="button"
                          onClick={() => setComposerView('location')}
                          className={`w-7 h-7 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                            adFormData.location_city ? 'bg-rose-500/20 text-rose-500' : 'hover:bg-[var(--surface-card)] text-rose-500'
                          }`}
                          title={isRtl ? 'الموقع' : 'Location'}
                        >
                          <MapPin size={15} />
                        </button>

                        {/* Feelings / Activity */}
                        <button
                          type="button"
                          onClick={() => setComposerView('feelings')}
                          className={`w-7 h-7 rounded-shape-xs flex items-center justify-center transition-colors cursor-pointer ${
                            adFormData.feeling ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-[var(--surface-card)] text-amber-500'
                          }`}
                          title={isRtl ? 'الشعور / النشاط' : 'Feeling / Activity'}
                        >
                          <Smile size={15} />
                        </button>

                        {/* More Options */}
                        <button
                          type="button"
                          onClick={() => setIsAddToPostModalOpen(true)}
                          className="w-7 h-7 rounded-shape-xs hover:bg-[var(--surface-card)] text-[var(--text-secondary)] flex items-center justify-center transition-colors cursor-pointer"
                          title={isRtl ? 'المزيد' : 'More'}
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-0.5">
                      <button
                        type="submit"
                        disabled={isSubmittingAd || (!adFormData.description && !adFormData.image_url && !adFormData.video_url)}
                        className="w-full py-2 sm:py-2.5 rounded-shape-xs bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSubmittingAd ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>{isRtl ? 'جاري النشر...' : 'Publishing...'}</span>
                          </>
                        ) : isEditMode ? (
                          isRtl ? 'حفظ التعديلات' : 'Save Changes'
                        ) : (
                          isRtl ? 'نشر' : 'Post'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {composerView === 'feelings' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[340px] overflow-y-auto custom-scrollbar p-0.5">
                      {FEELINGS.map((f, fIdx) => (
                        <button
                          key={`bulletin-feel-${f.id}-${fIdx}`}
                          type="button"
                          onClick={() => {
                            setAdFormData({ ...adFormData, feeling: f.id });
                            setComposerView('main');
                          }}
                          className={`p-2 rounded-shape-xs border flex items-center gap-2 transition-all cursor-pointer ${
                            adFormData.feeling === f.id
                              ? 'border-accent bg-accent/10 text-accent font-bold ring-1 ring-accent/30'
                              : 'border-[var(--border-default)] bg-[var(--surface-subtle)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <span className="text-lg shrink-0">{f.icon}</span>
                          <span className="text-xs truncate">{isRtl ? f.labelAr : f.labelEn}</span>
                        </button>
                      ))}
                    </div>
                    {adFormData.feeling && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdFormData({ ...adFormData, feeling: '' });
                          setComposerView('main');
                        }}
                        className="w-full py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-shape-xs transition-colors border border-rose-500/20 cursor-pointer"
                      >
                        {isRtl ? 'إزالة الشعور' : 'Remove Feeling'}
                      </button>
                    )}
                  </div>
                )}

                {composerView === 'location' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2 text-start"
                  >
                    {/* Search Input Bar */}
                    <div className="relative">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          autoFocus
                          value={customLocationSearch}
                          onChange={(e) => setCustomLocationSearch(e.target.value)}
                          placeholder={isRtl ? 'أين أنت؟ ابحث عن مدينة أو مكان...' : 'Where are you? Search city or place...'}
                          className="w-full ps-8 pe-8 py-1.5 text-xs rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] focus:bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] font-medium outline-none transition-all shadow-2xs"
                        />
                        {isSearchingLocation ? (
                          <Loader2 size={14} className="absolute start-2.5 text-accent animate-spin pointer-events-none" />
                        ) : (
                          <Search size={14} className="absolute start-2.5 text-[var(--text-muted)] pointer-events-none" />
                        )}
                        {customLocationSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLocationSearch('');
                            }}
                            className="absolute end-2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-shape-xs hover:bg-[var(--surface-card)] cursor-pointer"
                            title={isRtl ? 'مسح' : 'Clear'}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Section: Empty Search vs Search Results */}
                    {!customLocationSearch.trim() ? (
                      <div className="space-y-2">
                        {/* Tagged Location (If Selected) */}
                        {adFormData.location_city && (
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-[var(--text-muted)] px-1">
                              {isRtl ? 'الموقع المحدد حالياً' : 'Current Tagged Location'}
                            </h4>
                            <div className="flex items-center justify-between p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-shape-xs bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                  <MapPin size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                    {adFormData.location_city}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdFormData(prev => ({ ...prev, location_city: '' }));
                                  toast.success(isRtl ? 'تمت إزالة الموقع' : 'Location removed');
                                }}
                                className="w-6 h-6 rounded-shape-xs hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title={isRtl ? 'إزالة' : 'Remove'}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Use Current GPS Location */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.geolocation) {
                              toast.error(isRtl ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported');
                              return;
                            }
                            setIsSearchingLocation(true);
                            const toastId = toast.loading(isRtl ? 'جاري تحديد موقعك الجغرافي...' : 'Detecting GPS location...');
                            navigator.geolocation.getCurrentPosition(
                              async (position) => {
                                toast.dismiss(toastId);
                                setIsSearchingLocation(false);
                                const { latitude, longitude } = position.coords;
                                try {
                                  const res = await fetch(`/api/bulletin/geocoding/reverse?lat=${latitude}&lon=${longitude}&lang=${isRtl ? 'ar' : 'en'}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    const place = data.result?.city || data.result?.display_name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                                    setAdFormData(prev => ({ ...prev, location_city: place }));
                                    setComposerView('main');
                                    toast.success(isRtl ? `تم تحديد الموقع: ${place}` : `Location set: ${place}`);
                                    return;
                                  }
                                } catch (e) {}
                                const fallbackLoc = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
                                setAdFormData(prev => ({ ...prev, location_city: fallbackLoc }));
                                setComposerView('main');
                                toast.success(isRtl ? `تم إضافة الموقع: ${fallbackLoc}` : `Coords added: ${fallbackLoc}`);
                              },
                              () => {
                                toast.dismiss(toastId);
                                setIsSearchingLocation(false);
                                toast.error(isRtl ? 'تعذر الوصول لموقع الجهاز' : 'Could not detect location');
                              },
                              { timeout: 8000 }
                            );
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer text-start border border-[var(--border-default)]/60 hover:border-accent/40 group shadow-2xs"
                        >
                          <div className="w-7 h-7 rounded-shape-xs bg-accent/15 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Compass size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-accent truncate">
                              {isRtl ? 'استخدام موقعي الجغرافي الحالي' : 'Use Current Location (GPS)'}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {isRtl ? 'تحديد الموقع المباشر والدقيق لجهازك' : 'Accurate real-time device location'}
                            </p>
                          </div>
                        </button>

                        {/* Suggestions Section */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-[var(--text-muted)] px-1 flex items-center justify-between">
                            <span>{isRtl ? 'أماكن مقترحة' : 'Suggested Locations'}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] font-medium">
                              {locationSuggestions.length}
                            </span>
                          </h4>

                          <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar pe-1">
                            {locationSuggestions.map((item: any, idx: number) => {
                              const title = item.title || item.city || item.display_name?.split(',')[0] || item.display_name;
                              const subtitle = item.subtitle || (item.state ? `${item.state}، ${item.country}` : item.country) || '';

                              return (
                                <button
                                  key={`pop-sugg-${idx}-${title}`}
                                  type="button"
                                  onClick={() => {
                                    setAdFormData(prev => ({ ...prev, location_city: title }));
                                    setComposerView('main');
                                    toast.success(isRtl ? `تم اختيار: ${title}` : `Location set: ${title}`);
                                  }}
                                  className="w-full group flex items-center gap-2 p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] transition-colors border border-transparent hover:border-[var(--border-default)] cursor-pointer text-start"
                                >
                                  <div className="w-6 h-6 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] flex items-center justify-center group-hover:text-accent shrink-0">
                                    <MapPin size={12} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                                      {title}
                                    </p>
                                    {subtitle && (
                                      <p className="text-[9px] text-[var(--text-muted)] truncate">
                                        {subtitle}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Live Search Results */
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] px-1 flex items-center justify-between">
                          <span>{isRtl ? 'نتائج البحث' : 'Search Results'}</span>
                          {isSearchingLocation && (
                            <span className="text-[9px] text-accent font-bold flex items-center gap-1 animate-pulse">
                              <Loader2 size={10} className="animate-spin" />
                              <span>{isRtl ? 'جاري البحث...' : 'Searching...'}</span>
                            </span>
                          )}
                        </h4>

                        {isSearchingLocation && locationSuggestions.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)] gap-1">
                            <Loader2 size={16} className="animate-spin text-accent" />
                            <p className="text-[11px] font-medium">{isRtl ? 'جاري البحث في الأماكن والمعالم...' : 'Searching locations & landmarks...'}</p>
                          </div>
                        ) : locationSuggestions.length > 0 ? (
                          <div className="space-y-0.5 max-h-[260px] overflow-y-auto custom-scrollbar pe-1">
                            {locationSuggestions.map((item: any, idx: number) => {
                              const title = item.title || item.city || item.display_name?.split(',')[0] || item.display_name;
                              const subtitle = item.subtitle || (item.state ? `${item.state}، ${item.country}` : item.country) || '';

                              return (
                                <button
                                  key={`loc-result-${idx}-${item.place_id || idx}`}
                                  type="button"
                                  onClick={() => {
                                    setAdFormData(prev => ({ ...prev, location_city: title }));
                                    setCustomLocationSearch('');
                                    setLocationSuggestions([]);
                                    setComposerView('main');
                                    toast.success(isRtl ? `تم اختيار: ${title}` : `Location set: ${title}`);
                                  }}
                                  className="w-full group flex items-center gap-2 p-1.5 rounded-shape-xs hover:bg-[var(--surface-subtle)] transition-colors border border-transparent hover:border-[var(--border-default)] cursor-pointer text-start"
                                >
                                  <div className="w-6 h-6 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] flex items-center justify-center group-hover:text-accent shrink-0">
                                    <MapPin size={12} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                                      {title}
                                    </p>
                                    {subtitle && (
                                      <p className="text-[9px] text-[var(--text-muted)] truncate">
                                        {subtitle}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Fallback custom place entry */
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                const customPlace = customLocationSearch.trim();
                                setAdFormData(prev => ({ ...prev, location_city: customPlace }));
                                setCustomLocationSearch('');
                                setLocationSuggestions([]);
                                setComposerView('main');
                                toast.success(isRtl ? `تم تثبيت الموقع: ${customPlace}` : `Location set: ${customPlace}`);
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-shape-xs hover:bg-accent/10 transition-colors cursor-pointer text-start border border-dashed border-accent/40"
                            >
                              <div className="w-6 h-6 rounded-shape-xs bg-accent/15 text-accent flex items-center justify-center shrink-0">
                                <MapPin size={13} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-accent truncate">
                                  {isRtl ? `تثبيت الموقع: "${customLocationSearch.trim()}"` : `Use location: "${customLocationSearch.trim()}"`}
                                </p>
                                <p className="text-[9px] text-[var(--text-muted)]">
                                  {isRtl ? 'حفظ هذا الاسم كموقع للمنشور' : 'Set as post location'}
                                </p>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                 {composerView === 'tagging' && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-shape-xs bg-accent/5 border border-accent/10 text-[10px] font-bold text-accent">
                      {isRtl ? 'ميزة الإشارة تتيح لك تنبيه المستخدمين الآخرين حول منشورك.' : 'Tagging allows you to notify other users about your post.'}
                    </div>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={isRtl ? 'اكتب أسماء المستخدمين (مفصولة بفاصلة)...' : 'Enter usernames (comma separated)...'}
                      className="w-full px-2.5 py-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tags = userSearch.split(',').map(s => s.trim()).filter(Boolean);
                        setAdFormData({ ...adFormData, tagged_users: tags });
                        setComposerView('main');
                      }}
                      className="w-full py-2 rounded-shape-xs bg-accent text-slate-950 font-black text-xs active:scale-98 transition-all cursor-pointer"
                    >
                      {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {composerView === 'emojis' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-[280px] overflow-y-auto custom-scrollbar p-1">
                      {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','🤠','🥳','🤖','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🧠','👀','👁️','👅','👄','💋','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞','💓','💗','💖','💘','💝','✨','⭐','🌟','💫','🔥','💥','💯','💢','💬','💭','💤','🚀','💡','🎉','🏆','🥇','💎'].map((emoji, idx) => (
                        <button
                          key={`bulletin-emoji-${idx}`}
                          type="button"
                          onClick={() => {
                            setAdFormData(prev => ({ ...prev, description: prev.description + emoji }));
                            setComposerView('main');
                          }}
                          className="h-8 text-base flex items-center justify-center rounded-shape-xs hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        </AppModal>

      {}
      <AppModal
        open={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        size="sm"
        layer="nested"
        contentClassName="!p-0 !space-y-0 max-w-[315px] sm:max-w-[335px] w-[90vw] overflow-hidden rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl"
      >
        <div className="bg-[var(--surface-card)] text-[var(--text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-shape-xs bg-accent/15 text-accent flex items-center justify-center shadow-2xs">
                <Globe size={13} />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
                {isRtl ? 'تحديد جمهور المنشور' : 'Select Audience'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAudienceModalOpen(false)}
              className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={13} />
            </button>
          </div>

          {/* Options List */}
          <div className="p-2 space-y-1.5">
            {/* 1. Public Option */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, audience: 'public' }));
                setIsAudienceModalOpen(false);
              }}
              className={`w-full p-2 rounded-shape-xs border text-start transition-all cursor-pointer flex items-center justify-between gap-2 group shadow-2xs select-none ${
                adFormData.audience === 'public'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                  : 'border-[var(--border-default)] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]'
              }`}
            >
              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-shape-xs flex items-center justify-center shrink-0 transition-all ${
                  adFormData.audience === 'public'
                    ? 'bg-accent text-slate-950 font-black shadow-2xs'
                    : 'border border-[var(--border-default)] bg-[var(--surface-card)]'
                }`}
              >
                {adFormData.audience === 'public' && <Check size={12} strokeWidth={3} />}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <h4 className="text-xs font-extrabold text-[var(--text-primary)] group-hover:text-accent transition-colors">
                    {isRtl ? 'العامة' : 'Public'}
                  </h4>
                  <span className="text-[8px] bg-accent/20 text-accent px-1 py-0.2 rounded-shape-xs font-bold">
                    {isRtl ? 'موصى به' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-tight truncate">
                  {isRtl ? 'أي شخص داخل المنصة أو خارجها' : 'Anyone on or off the platform'}
                </p>
              </div>

              {/* Icon Container */}
              <div
                className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  adFormData.audience === 'public'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)]'
                }`}
              >
                <Globe size={14} />
              </div>
            </button>

            {/* 2. Friends Option */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, audience: 'friends' }));
                setIsAudienceModalOpen(false);
              }}
              className={`w-full p-2 rounded-shape-xs border text-start transition-all cursor-pointer flex items-center justify-between gap-2 group shadow-2xs select-none ${
                adFormData.audience === 'friends'
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-[var(--border-default)] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]'
              }`}
            >
              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-shape-xs flex items-center justify-center shrink-0 transition-all ${
                  adFormData.audience === 'friends'
                    ? 'bg-blue-500 text-white font-black shadow-2xs'
                    : 'border border-[var(--border-default)] bg-[var(--surface-card)]'
                }`}
              >
                {adFormData.audience === 'friends' && <Check size={12} strokeWidth={3} />}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors mb-0.5">
                  {isRtl ? 'الأصدقاء' : 'Friends'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-tight truncate">
                  {isRtl ? 'المستخدمون والمسجلون فقط' : 'Registered members & friends only'}
                </p>
              </div>

              {/* Icon Container */}
              <div
                className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  adFormData.audience === 'friends'
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)]'
                }`}
              >
                <Users size={14} />
              </div>
            </button>

            {/* 3. Only Me Option */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, audience: 'only_me' }));
                setIsAudienceModalOpen(false);
              }}
              className={`w-full p-2 rounded-shape-xs border text-start transition-all cursor-pointer flex items-center justify-between gap-2 group shadow-2xs select-none ${
                adFormData.audience === 'only_me'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-[var(--border-default)] bg-[var(--surface-subtle)]/50 hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]'
              }`}
            >
              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-shape-xs flex items-center justify-center shrink-0 transition-all ${
                  adFormData.audience === 'only_me'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                    : 'border border-[var(--border-default)] bg-[var(--surface-card)]'
                }`}
              >
                {adFormData.audience === 'only_me' && <Check size={12} strokeWidth={3} />}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors mb-0.5">
                  {isRtl ? 'أنا فقط' : 'Only Me'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-tight truncate">
                  {isRtl ? 'منشور خاص بك فقط' : 'Private post visible only to you'}
                </p>
              </div>

              {/* Icon Container */}
              <div
                className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  adFormData.audience === 'only_me'
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)]'
                }`}
              >
                <Lock size={14} />
              </div>
            </button>
          </div>
        </div>
      </AppModal>

      {}
      {/* Add to Post Expanded Menu Modal (Sleek Compact Grid) */}
      <AppModal
        open={isAddToPostModalOpen}
        onClose={() => setIsAddToPostModalOpen(false)}
        size="sm"
        layer="nested"
        contentClassName="!p-0 !space-y-0 max-w-[315px] sm:max-w-[335px] w-[90vw] overflow-hidden rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl"
      >
        <div className="bg-[var(--surface-card)] text-[var(--text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
            <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
              {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAddToPostModalOpen(false)}
              className="w-6 h-6 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={13} />
            </button>
          </div>

          {/* Grid of Compact, Zero-Deadspace Items (5 Rows x 2 Columns) */}
          <div className="p-2 sm:p-2.5 grid grid-cols-2 gap-1.5">
            {/* 1. Photo / Video */}
            <label
              onClick={() => setIsAddToPostModalOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-[var(--status-success-subtle)] text-[var(--fg-success)] group-hover:scale-105 transition-transform">
                <ImageIcon size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'صورة / فيديو' : 'Photo / Video'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.3gp,.m4v,.wmv,.flv,.ogv,.ts,.mts,.m2ts"
                onChange={handleMixedMediaSelect}
                className="hidden"
              />
            </label>

            {/* 2. Tag People */}
            <button
              type="button"
              onClick={() => {
                setComposerView('tagging');
                setIsAddToPostModalOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-blue-500/15 text-blue-500 group-hover:scale-105 transition-transform">
                <Users size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'إشارة لأشخاص' : 'Tag People'}
              </span>
            </button>

            {/* 3. Feelings / Activity */}
            <button
              type="button"
              onClick={() => {
                setComposerView('feelings');
                setIsAddToPostModalOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-amber-500/15 text-amber-500 group-hover:scale-105 transition-transform">
                <Smile size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'شعور / نشاط' : 'Feeling / Activity'}
              </span>
            </button>

            {/* 4. Check in / Location */}
            <button
              type="button"
              onClick={() => {
                setComposerView('location');
                setIsAddToPostModalOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-rose-500/15 text-rose-500 group-hover:scale-105 transition-transform">
                <MapPin size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'تسجيل زيارة' : 'Check In'}
              </span>
            </button>

            {/* 5. WhatsApp / Calls */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, has_whatsapp_button: !prev.has_whatsapp_button }));
                setIsAddToPostModalOpen(false);
                toast.success(isRtl ? 'تم تفعيل زر تلقي المكالمات/واتساب' : 'Call/WhatsApp button activated');
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-[var(--comp-button-primary-bg)]/15 text-[var(--fg-success)] group-hover:scale-105 transition-transform">
                <Phone size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'تلقي مكالمات' : 'Get Calls'}
              </span>
            </button>

            {/* 6. GIF Image */}
            <button
              type="button"
              onClick={async () => {
                const gifUrl = await confirm({
                  title: isRtl ? 'إضافة صورة GIF' : 'Add GIF Image',
                  description: isRtl ? 'أدخل رابط صورة GIF المتحركة:' : 'Enter GIF image URL:',
                  hasInput: true,
                  inputPlaceholder: 'https://...',
                  confirmLabel: isRtl ? 'إضافة' : 'Add',
                  variant: 'info',
                  requiredInput: true,
                });
                if (gifUrl && typeof gifUrl === 'string') {
                  setAdFormData(prev => ({ ...prev, image_url: gifUrl }));
                  toast.success(isRtl ? 'تمت إضافة صورة GIF بنجاح' : 'GIF added successfully');
                }
                setIsAddToPostModalOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-purple-500/15 text-purple-500 font-black text-[9px] group-hover:scale-105 transition-transform">
                GIF
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'صورة GIF' : 'GIF'}
              </span>
            </button>

            {/* 7. Live Video */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, description: (prev.description ? prev.description + '\n' : '') + '🔴 [بث مباشر / Live Broadcast]' }));
                setIsAddToPostModalOpen(false);
                toast.success(isRtl ? 'تمت إضافة علامة البث المباشر' : 'Live video badge added');
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-red-600/15 text-red-500 group-hover:scale-105 transition-transform">
                <Radio size={13} className="animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'بث مباشر' : 'Live Video'}
              </span>
            </button>

            {/* 8. Life Event */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({ ...prev, description: (prev.description ? prev.description + '\n' : '') + '🎉 [مناسبة خاصة / Life Event]' }));
                setIsAddToPostModalOpen(false);
                toast.success(isRtl ? 'تمت إضافة علامة المناسبة الشخصية' : 'Life event badge added');
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-accent/15 text-accent group-hover:scale-105 transition-transform">
                <Bookmark size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'مناسبة شخصية' : 'Life Event'}
              </span>
            </button>

            {/* 9. Music */}
            <button
              type="button"
              onClick={() => {
                setIsAddToPostModalOpen(false);
                setIsAudioPickerOpen(true);
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-purple-500/15 text-purple-400 group-hover:scale-105 transition-transform">
                <Music size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'موسيقى' : 'Music'}
              </span>
            </button>

            {/* 10. Q&A / Poll */}
            <button
              type="button"
              onClick={() => {
                setAdFormData(prev => ({
                  ...prev,
                  quick_questions: prev.quick_questions && prev.quick_questions.some(q => q.trim())
                    ? prev.quick_questions
                    : [isRtl ? 'هل المنتج متوفر؟' : 'Is this available?', isRtl ? 'ما هي طريقة الاستلام؟' : 'How to pick up?', '']
                }));
                setIsAddToPostModalOpen(false);
                toast.success(isRtl ? 'تم تفعيل خيارات الأسئلة السريعة' : 'Quick questions enabled');
              }}
              className="flex items-center gap-2 px-2 py-1.5 h-9 rounded-shape-xs bg-[var(--surface-subtle)]/70 hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 hover:border-accent/40 transition-all cursor-pointer group shadow-2xs text-start select-none"
            >
              <div className="w-6 h-6 rounded-shape-xs shrink-0 flex items-center justify-center bg-indigo-500/15 text-indigo-400 group-hover:scale-105 transition-transform">
                <HelpCircle size={13} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                {isRtl ? 'استطلاع / أسئلة' : 'Q&A / Poll'}
              </span>
            </button>
          </div>
        </div>
      </AppModal>

      {/* Perplexta Media Audio Library Picker Modal */}
      <AudioLibraryPickerModal
        open={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onBack={() => {
          setIsAudioPickerOpen(false);
          setIsAddToPostModalOpen(true);
        }}
        selectedTrackId={adFormData.audio_track_id}
        onSelectTrack={(track) => {
          setSelectedAudioTrack(track);
          setAdFormData(prev => ({
            ...prev,
            audio_url: track.file_url || track.audio_url || '',
            audio_title: track.title,
            audio_artist: track.artist || '',
            audio_track_id: String(track.id)
          }));
          toast.success(isRtl ? `تم اختيار: ${track.title}` : `Selected: ${track.title}`);
        }}
        isRtl={isRtl}
      />

      {}
      {}
      {}
      <AppModal
        open={isPageModalOpen}
        onClose={() => setIsPageModalOpen(false)}
        size="lg"
        layer="modal"
        contentClassName="p-6 space-y-4"
      >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-accent" />
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{isRtl ? 'إنشاء صفحة تجارية جديدة' : 'Create Merchant Page'}</h3>
                </div>
                <button onClick={() => setIsPageModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'اسم الشركة / المتجر:' : 'Page Name:'}</label>
                    <input
                      type="text"
                      required
                      value={pageFormData.name}
                      onChange={(e) => setPageFormData({ ...pageFormData, name: e.target.value })}
                      placeholder={isRtl ? 'شركة القدس للتكنولوجيا' : 'Name...'}
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'الصنف التجاري / الفئة المعتمدة:' : 'Business Category:'}</label>
                    <CategoryAutocompleteInput
                      value={pageFormData.category}
                      onChange={(category) => setPageFormData(prev => ({ ...prev, category }))}
                      required
                      isRtl={isRtl}
                      placeholder={isRtl ? 'ابحث أو اختر الفئة (مثل: بناء، تكنولوجيا، تجارة، مطاعم...)' : 'Search category (e.g. Construction, Tech...)'}
                    />
                  </div>
                </div>

                {/* Merchant High-Precision Location & Address */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-primary)]">
                      <MapPin size={16} className="text-accent" />
                      <span>{isRtl ? 'الموقع والعنوان التجاري بدقة عالية' : 'High-Precision Business Location & Address'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] font-bold border border-[var(--fg-success)]/20">
                      {isRtl ? 'GPS اختياري (مطفي افتراضياً)' : 'GPS Opt-In (Off by default)'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">
                        {isRtl ? 'تحديد المدينة / المحافظة أو المنطقة الرئيسية:' : 'City / Governorate or Main Area:'}
                      </label>
                      <LocationAutocompleteInput
                        value={pageFormData.city}
                        onChange={(city) => setPageFormData(prev => ({ ...prev, city }))}
                        selectedCity={pageFormData.city}
                        onCityChange={(city) => setPageFormData(prev => ({ ...prev, city }))}
                        onSelectLocation={(loc) => {
                          setPageFormData(prev => ({
                            ...prev,
                            city: loc.city || loc.state || loc.title,
                            address: loc.full_address || loc.title || prev.address
                          }));
                        }}
                        placeholder={isRtl ? 'ابحث عن المدينة، المحافظة أو المعلم التجاري...' : 'Search city, state or commercial hub...'}
                        addressPlaceholder={isRtl ? 'الشارع أو الحي بدقة...' : 'Specific street or district...'}
                        isRtl={isRtl}
                        showGpsButton={true}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">
                        {isRtl ? 'العنوان الفعلي والتفصيلي (الشارع، المبنى، الطابق، المعلم):' : 'Detailed Street Address (Building, Floor, Landmark):'}
                      </label>
                      <input
                        type="text"
                        value={pageFormData.address}
                        onChange={(e) => setPageFormData({ ...pageFormData, address: e.target.value })}
                        placeholder={isRtl ? 'مثال: شارع عمر المختار - عمارة الشروق - الطابق الثاني' : 'E.g., Omar Al-Mukhtar St, Shorouk Tower, 2nd Fl'}
                        className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'نبذة عن الشركة والخدمات:' : 'About Business:'}</label>
                  <textarea
                    rows={3}
                    required
                    value={pageFormData.description}
                    onChange={(e) => setPageFormData({ ...pageFormData, description: e.target.value })}
                    placeholder={isRtl ? 'صف خدماتك ومنتجاتك وساعات العمل بالتفصيل...' : 'Description...'}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] resize-none"
                  />
                </div>

                {/* Image Specs Guidance Box */}
                <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-accent flex items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>{isRtl ? 'قياسات الصور الموصى بها والقص الذكي' : 'Recommended Image Dimensions & Smart Crop'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">
                      {isRtl ? 'قص تلقائي + ضغط عالي السرعة' : 'Auto Crop & Speed Optimized'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[var(--text-secondary)]">
                    <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                      <strong className="block text-[var(--text-primary)] font-bold mb-0.5">{isRtl ? 'غلاف الصفحة:' : 'Banner Cover:'}</strong>
                      <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? RECOMMENDED_IMAGE_SPECS.cover.labelAr : RECOMMENDED_IMAGE_SPECS.cover.labelEn}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                      <strong className="block text-[var(--text-primary)] font-bold mb-0.5">{isRtl ? 'شعار الصفحة:' : 'Avatar Logo:'}</strong>
                      <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? RECOMMENDED_IMAGE_SPECS.avatar.labelAr : RECOMMENDED_IMAGE_SPECS.avatar.labelEn}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <ImageUploadDropzone
                      label={isRtl ? 'صورة الشعار:' : 'Avatar (Profile Logo):'}
                      value={pageFormData.avatar_url}
                      onChange={(url) => setPageFormData({ ...pageFormData, avatar_url: url })}
                      aspectRatio={1}
                      targetWidth={400}
                      targetHeight={400}
                      placeholderText={isRtl ? 'رفع صورة الشعار (400×400 - 1:1)' : 'Upload Avatar Image (1:1)'}
                      isRtl={isRtl}
                    />

                    <ImageUploadDropzone
                      label={isRtl ? 'صورة الغلاف:' : 'Cover Banner:'}
                      value={pageFormData.cover_url}
                      onChange={(url) => setPageFormData({ ...pageFormData, cover_url: url })}
                      aspectRatio={3}
                      targetWidth={1200}
                      targetHeight={400}
                      placeholderText={isRtl ? 'رفع صورة الغلاف (1200×400 - 3:1)' : 'Upload Cover Banner (3:1)'}
                      isRtl={isRtl}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رقم الواتساب الرسمي:' : 'Official WhatsApp:'}</label>
                    <input
                      type="text"
                      value={pageFormData.whatsapp_number}
                      onChange={(e) => setPageFormData({ ...pageFormData, whatsapp_number: e.target.value })}
                      placeholder="+970599000000"
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'الموقع الإلكتروني أو الرابط (اختياري):' : 'Website / Link (Optional):'}</label>
                    <input
                      type="text"
                      value={pageFormData.website_url}
                      onChange={(e) => setPageFormData({ ...pageFormData, website_url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-default)] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPage}
                    className="px-6 py-2.5 rounded-[var(--radius-md)] bg-accent hover:bg-accent text-[var(--text-primary)] font-bold text-xs shadow-lg shadow-none transition-theme"
                  >
                    {isSubmittingPage ? (isRtl ? 'جاري الإنشاء...' : 'Creating...') : (isRtl ? 'تفعيل الصفحة التجارية' : 'Create Page')}
                  </button>
                </div>
              </form>
        </AppModal>

      {}
      {}
      {}
      {/* Inquire Ad Direct Message AppModal */}
      <AppModal
        open={!!inquireAd}
        onClose={() => setInquireAd(null)}
        size="md"
        layer="modal"
      >
        {inquireAd && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-accent" />
                <h3 className="text-xs font-extrabold text-[var(--text-primary)]">{isRtl ? 'إرسال استفسار مباشر للتاجر' : 'Direct Merchant Inquiry'}</h3>
              </div>
              <button onClick={() => setInquireAd(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-2.5 rounded-shape-md bg-[var(--surface-subtle)] flex items-center gap-2.5 border border-[var(--border-default)]">
              <img src={getMediaUrl(inquireAd.image_url)} alt={inquireAd.title} className="w-12 h-12 rounded-shape-sm object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate text-[var(--text-primary)]">{inquireAd.title}</h4>
                <p className="text-[10px] text-[var(--text-muted)]">{inquireAd.author_name}</p>
              </div>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رسالتك واستفسارك:' : 'Your Inquiry:'}</label>
                <textarea
                  rows={3}
                  required
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder={isRtl ? 'مرحباً، أود معرفة أسعار ومكونات هذا المنتج...' : 'Message...'}
                  className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] resize-none focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رقم هاتفك / الواتساب للتواصل معك:' : 'Your Phone/WhatsApp:'}</label>
                <input
                  type="text"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+970599111222"
                  className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-accent outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border-default)] space-y-2">
                <button
                  type="button"
                  onClick={() => handleMessageAdvertiser(inquireAd, inquiryText)}
                  disabled={messagingAdId === inquireAd.id}
                  className="w-full min-h-[40px] py-2.5 rounded-shape-sm bg-accent text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-all duration-fast hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs border border-[var(--border-main)]"
                >
                  {messagingAdId === inquireAd.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MessageCircle size={14} />
                  )}
                  <span>{isRtl ? 'مراسلة المعلن مباشرة (فتح محادثة خاصة)' : 'Message Advertiser (Open Direct Chat)'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSendingInquiry}
                  className="w-full min-h-[38px] py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-all duration-fast active:scale-95 border border-[var(--border-default)] cursor-pointer"
                >
                  <Send size={13} />
                  <span>{isSendingInquiry ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال كاستفسار سريع فقط' : 'Send Quick Inquiry Only')}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </AppModal>

      {/* Stream Setup AppModal */}
      <AppModal
        open={isStreamSetupOpen}
        onClose={() => setIsStreamSetupOpen(false)}
        size="sm"
        layer="modal"
      >
        <div className="space-y-6 text-[var(--text-primary)]">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-shape-sm bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-xs">
              <Radio size={28} className="text-red-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-black tracking-tight">{isRtl ? 'إعداد البث المباشر' : 'Live Stream Setup'}</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {isRtl ? 'أدخل عنواناً جذاباً لمتابعيك قبل البدء' : 'Enter a catchy title for your audience before starting'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                value={streamTitleInput}
                onChange={(e) => setStreamTitleInput(e.target.value)}
                placeholder={isRtl ? 'مثلاً: جولة في مكتبي الجديد...' : 'e.g., Tour of my new office...'}
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-theme font-bold"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none transition-colors group-focus-within:text-red-500/50">
                <Type size={18} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsStreamSetupOpen(false);
                  setStreamTitleInput('');
                }}
                className="flex-1 min-h-[40px] py-2.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs transition-theme active:scale-95 border border-[var(--border-default)] cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!streamTitleInput.trim()) {
                    toast.error(isRtl ? 'يرجى إدخال عنوان للبث' : 'Please enter a stream title');
                    return;
                  }
                  setIsStreamSetupOpen(false);
                  setIsLiveStreamOpen(true);
                }}
                className="flex-[2] min-h-[40px] py-2.5 rounded-shape-sm bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-theme active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isRtl ? 'بدء البث المباشر 🚀' : 'Start Streaming 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      </AppModal>

      {/* Universal Direct Location Filter Modal (Matching Video Standard) */}
      <UniversalLocationModal
        isOpen={isLocationFlyoutOpen}
        onClose={() => setIsLocationFlyoutOpen(false)}
        anchorRef={headerLocationButtonRef}
        placement="auto"
        onSelectLocation={(loc) => {
          if (!loc.city && !loc.title) {
            setSelectedCities([]);
            setSelectedCountries([]);
            secureStorage.set('perplexta_user_cities', JSON.stringify([]));
            secureStorage.set('perplexta_user_countries', JSON.stringify([]));
          } else {
            const cityName = loc.title || loc.city;
            setSelectedCities([cityName]);
            setSelectedCountries(loc.country ? [loc.country] : []);
            secureStorage.set('perplexta_user_cities', JSON.stringify([cityName]));
            if (loc.country) {
              secureStorage.set('perplexta_user_countries', JSON.stringify([loc.country]));
            } else {
              secureStorage.set('perplexta_user_countries', JSON.stringify([]));
            }
          }
        }}
        currentValue={selectedCities.length > 0 ? selectedCities[0] : (selectedCountries.length > 0 ? selectedCountries[0] : '')}
        allowGlobalOption={true}
        onSelectGlobal={() => {
          setSelectedCities([]);
          setSelectedCountries([]);
          secureStorage.set('perplexta_user_cities', JSON.stringify([]));
          secureStorage.set('perplexta_user_countries', JSON.stringify([]));
        }}
        isRtl={isRtl}
        title={isRtl ? 'البحث عن موقع' : 'Search for Location'}
        placeholder={isRtl ? 'أين أنت؟' : 'Where are you?'}
      />

      {}
      {createPortal(
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              onClick={() => {
                const container = document.querySelector('.main-scroll-container');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                document.body.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hidden md:flex fixed bottom-8 end-6 z-40 min-h-[44px] h-11 px-4 rounded-[var(--comp-button-radius,6px)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-main)] hover:border-accent shadow-xl transition-all items-center gap-2 text-xs font-bold cursor-pointer active:scale-98 backdrop-blur-md"
              title={isRtl ? 'العودة لأعلى الصفحة' : 'Scroll to top'}
              aria-label={isRtl ? 'العودة لأعلى الصفحة' : 'Scroll to top'}
            >
              <ArrowUp size={16} className="text-accent" />
              <span>{isRtl ? 'أعلى الصفحة' : 'Top'}</span>
            </motion.button>
          )}
        </AnimatePresence>,
        document.body
      )}

      {}
      {}
      {}
      {}
      <nav
        dir={isRtl ? 'rtl' : 'ltr'}
        className="lg:hidden fixed bottom-0 inset-x-0 z-[150] w-full bg-[var(--surface-page)]/95 backdrop-blur-md border-t border-[var(--border-default)] transition-theme shadow-md pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="w-full max-w-md mx-auto h-[56px] px-3 flex items-center justify-between">
          {/* Feed */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setSelectedPageDetail(null);
              setActiveTab('board');
              setIsMobileSearchOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`group flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-shape-md transition-all duration-150 active:scale-90 cursor-pointer touch-manipulation select-none ${
              activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'الرئيسية' : 'Feed'}
            aria-label={isRtl ? 'الرئيسية' : 'Feed'}
          >
            <div className={`px-3 py-1 rounded-shape-sm flex items-center justify-center transition-all ${
              activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                : 'bg-transparent'
            }`}>
              <Megaphone size={16} className={activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              activeTab === 'board' && !selectedPageDetail && !isMobileSearchOpen
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}>
              {isRtl ? 'الرئيسية' : 'Feed'}
            </span>
          </button>

          {/* Reels Tab Navigation */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setSelectedPageDetail(null);
              setActiveTab('reels');
              setIsMobileSearchOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`group flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-shape-md transition-all duration-150 active:scale-90 cursor-pointer touch-manipulation select-none ${
              activeTab === 'reels' && !selectedPageDetail
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'مقاطع ريلز' : 'Reels'}
            aria-label={isRtl ? 'مقاطع ريلز' : 'Reels'}
          >
            <div className={`px-3 py-1 rounded-shape-sm flex items-center justify-center transition-all ${
              activeTab === 'reels' && !selectedPageDetail
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                : 'bg-transparent'
            }`}>
              <Clapperboard size={16} className={activeTab === 'reels' && !selectedPageDetail ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              activeTab === 'reels' && !selectedPageDetail
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}>
              {isRtl ? 'ريلز' : 'Reels'}
            </span>
          </button>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setIsMobileSearchOpen(prev => !prev);
              if (!isMobileSearchOpen) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`group flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-shape-md transition-all duration-150 active:scale-90 cursor-pointer touch-manipulation select-none ${
              isMobileSearchOpen
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'البحث' : 'Search'}
            aria-label={isRtl ? 'البحث' : 'Search'}
          >
            <div className={`px-3 py-1 rounded-shape-sm flex items-center justify-center transition-all ${
              isMobileSearchOpen
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                : 'bg-transparent'
            }`}>
              <Search size={16} className={isMobileSearchOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              isMobileSearchOpen
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}>
              {isRtl ? 'بحث' : 'Search'}
            </span>
          </button>

          {/* Inquiries / Chats */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              if (!token) {
                setIsAuthModalOpen(true);
                return;
              }
              setSelectedPageDetail(null);
              setActiveTab('inquiries');
              setIsMobileSearchOpen(false);
            }}
            className={`group flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-shape-md transition-all duration-150 active:scale-90 cursor-pointer touch-manipulation select-none relative ${
              activeTab === 'inquiries' && !selectedPageDetail
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={isRtl ? 'المحادثات' : 'Chats'}
            aria-label={isRtl ? 'المحادثات' : 'Chats'}
          >
            <div className={`px-3 py-1 rounded-shape-sm flex items-center justify-center transition-all relative ${
              activeTab === 'inquiries' && !selectedPageDetail
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                : 'bg-transparent'
            }`}>
              <MessageSquareText size={16} className={activeTab === 'inquiries' && !selectedPageDetail ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
              {inquiriesList.length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-shape-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center ring-1 ring-[var(--surface-page)]">
                  {inquiriesList.length > 9 ? '9+' : inquiriesList.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              activeTab === 'inquiries' && !selectedPageDetail
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}>
              {isRtl ? 'المحادثات' : 'Chats'}
            </span>
          </button>

          {/* Menu Drawer */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsMobileSidebarOpen(true);
            }}
            className="group flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-shape-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-90 cursor-pointer touch-manipulation select-none"
            title={isRtl ? 'القائمة' : 'Menu'}
            aria-label={isRtl ? 'القائمة' : 'Menu'}
          >
            <div className="px-3 py-1 rounded-shape-sm flex items-center justify-center bg-transparent group-hover:bg-[var(--surface-subtle)] transition-all">
              <Menu size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
            </div>
            <span className="text-[10px] font-bold tracking-tight text-[var(--text-muted)]">
              {isRtl ? 'القائمة' : 'Menu'}
            </span>
          </button>
        </div>
      </nav>



      {}
      <StoryUploadModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        isRtl={isRtl}
        token={token}
        user={user}
        userPages={myPagesList}
        initialMode={storyUploadMode}
        onStoryCreated={(newStory) => {
          fetchStories();
          toast.success(isRtl ? 'تم النشر' : 'Published');
          setSelectedStoryIndex(0);
        }}
      />

      <StoryViewerModal
        isOpen={isStoryViewerOpen}
        onClose={() => {
          setIsStoryViewerOpen(false);
          setPreviewingVideoStoryId(null);
        }}
        stories={orderedStories}
        initialStoryIndex={selectedStoryIndex}
        currentUser={user}
        isRtl={isRtl}
        onStoryViewed={handleStoryViewed}
        onStoryDeleted={handleStoryDeleted}
      />

      {/* Hidden File Input for Direct Instant Reels Upload */}
      <input
        ref={directReelInputRef}
        id="direct-reel-video-input"
        type="file"
        accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.3gp,.m4v,.wmv,.flv,.ogv,.ts,.mts,.m2ts"
        onChange={handleReelFileUpload}
        className="hidden"
      />

      {/* Video Trimmer Modal */}
      <VideoTrimmerModal
        isOpen={isTrimmerModalOpen}
        onClose={() => setIsTrimmerModalOpen(false)}
        videoUrl={trimmerVideoUrl || adFormData.video_url || videoMetadataInfo.localVideoUrl || ''}
        serverVideoUrl={adFormData.video_url && !adFormData.video_url.startsWith('blob:') ? adFormData.video_url : undefined}
        videoDuration={videoMetadataInfo.duration || 0}
        isRtl={isRtl}
        token={token}
        onTrimComplete={(trimmed) => {
          setAdFormData(prev => ({
            ...prev,
            video_url: trimmed.videoUrl,
            image_url: trimmed.thumbnailUrl || prev.image_url,
            ad_format: (trimmed.adFormat as any) || 'reel',
            aspect_ratio: trimmed.aspectRatio || '9:16',
            media_gallery: [{
              id: `vid-${Date.now()}`,
              url: trimmed.videoUrl,
              type: 'video',
              caption: ''
            }],
            ...(trimmed.audioTrack ? {
              audio_url: trimmed.audioTrack.audio_url || trimmed.audioTrack.file_url || '',
              audio_title: trimmed.audioTrack.title || '',
              audio_artist: trimmed.audioTrack.artist || '',
              audio_track_id: trimmed.audioTrack.id || ''
            } : {})
          }));
          toast.success(isRtl ? 'تم تحرير وقص الفيديو بنجاح! جاهز للنشر' : 'Reel trimmed & ready to publish!');
          setIsAdModalOpen(true);
        }}
      />

      {/* ViralMedia Studio Master Interactive Studio Modal */}
      <ViralMediaStudioModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        isRtl={isRtl}
        token={token}
        user={user}
        onPublish={async (project: MediaProjectState, renderedVideoUrl?: string, thumbnail?: string) => {
          setIsStudioModalOpen(false);
          const finalVideoUrl = renderedVideoUrl || (project.visual?.sourceType === 'video' ? project.visual.url : '');
          const finalImageUrl = thumbnail || (project.visual?.sourceType === 'image' ? project.visual.url : '');

          try {
            const res = await fetch('/api/bulletin/ads', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || secureStorage.getSync('app_token') || ''}`
              },
              body: JSON.stringify({
                title: isRtl ? 'مقطع ريلز تم إنتاجه باستوديو الوسائط' : 'ViralMedia Studio Creation',
                description: '',
                ad_format: 'reel',
                video_url: finalVideoUrl,
                image_url: finalImageUrl,
                audio_url: project.musicTrack?.url || '',
                audio_title: project.musicTrack?.title || '',
                audio_artist: project.musicTrack?.author || '',
                audio_track_id: project.musicTrack?.id || '',
                aspect_ratio: '9:16',
                audience: 'public',
                location_city: 'القدس الشريف'
              })
            });
            const data = await res.json();
            if (data.success) {
              toast.success(isRtl ? 'تم نشر الفيديو في ريلز بنجاح! 🚀' : 'Reel published successfully! 🚀');
              fetchAds(1, false);
              fetchMyAds();
              setActiveTab('reels');
            } else {
              toast.error(data.error || (isRtl ? 'تعذر نشر الريلز' : 'Failed to publish reel'));
            }
          } catch (e) {
            toast.error(isRtl ? 'حدث خطأ أثناء النشر' : 'Error publishing reel');
          }
        }}
      />

      <MediaManagerModal
        isOpen={isMediaManagerOpen}
        onClose={() => setIsMediaManagerOpen(false)}
        mediaItems={adFormData.media_gallery || []}
        onChangeMediaItems={(updatedMedia) => {
          setAdFormData(prev => {
            const allImages = updatedMedia.filter(m => m.type === 'image').map(m => m.url);
            const firstVideo = updatedMedia.find(m => m.type === 'video');
            return {
              ...prev,
              media_gallery: updatedMedia,
              image_url: allImages.join(','),
              video_url: firstVideo ? firstVideo.url : ''
            };
          });
        }}
        onAddMoreFiles={handleMixedMediaUpload}
        isRtl={isRtl}
      />

      {}
      <MediaLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => {
          setLightboxState(prev => ({ ...prev, isOpen: false }));
          updateUrlWithPost(null);
        }}
        items={lightboxState.items}
        initialIndex={lightboxState.initialIndex}
        onToggleCommentLike={handleToggleCommentLike}
        isRtl={isRtl}
        postTitle={lightboxState.postTitle}
        authorName={lightboxState.authorName}
        ad={lightboxState.ad}
        comments={lightboxState.ad ? commentsMap[lightboxState.ad.id] : undefined}
        loadingComments={lightboxState.ad ? loadingCommentsAdId === lightboxState.ad.id : false}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        onShare={handleShareAd}
        onBoostAd={handleOpenBoostModal}
        onEditAd={handleEditAd}
        onViewPost={handleNavigateToPost}
        onOpenPageDetail={handleOpenPageDetail}
        user={user}
        token={token}
      />

      {}
      <AnimatePresence>
        {activeReelModalId !== null && (
          <ReelsFeed
            ads={combinedReelsAds.length > 0 ? combinedReelsAds : ads}
            initialAdId={activeReelModalId}
            isRtl={isRtl}
            token={token}
            user={user}
            commentsMap={commentsMap}
            onToggleLike={handleToggleLike}
            onToggleSave={handleToggleSave}
            onAddComment={handleAddComment}
            onToggleCommentLike={handleToggleCommentLike}
            onMessageAdvertiser={handleMessageAdvertiser}
            onShare={handleShareAd}
            onBoostAd={handleOpenBoostModal}
            onDeleteReel={(id) => {
              const ad = ads.find(a => a.id === id);
              if (ad) handleDeleteAd(ad);
            }}
            onEditReel={handleEditAd}
            onOpenPageDetail={handleOpenPageDetail}
            onOpenUploadReels={() => {
              stopAllMedia('reel_upload_preview');
              openReelUploadModal();
            }}
            onUploadReelClick={() => {
              stopAllMedia('reel_upload_preview');
              openReelUploadModal();
            }}
            onClose={() => {
              stopAllMedia();
              setActiveReelModalId(null);
            }}
            onViewPost={handleNavigateToPost}
            onArchiveAd={(archivedAd) => {
              setAds(prev => prev.filter(a => a.id !== archivedAd.id));
              setSavedAds(prev => prev.filter(a => a.id !== archivedAd.id));
            }}
            onTrashAd={(trashedAd) => {
              setAds(prev => prev.filter(a => a.id !== trashedAd.id));
              setSavedAds(prev => prev.filter(a => a.id !== trashedAd.id));
            }}
            onUpdateAd={(updatedAd) => {
              setAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
              setSavedAds(prev => prev.map(a => a.id === updatedAd.id ? { ...a, ...updatedAd } : a));
            }}
            onReportAd={handleReportAd}
            isLoading={loading}
          />
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {previewingVideoStoryId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 z-10 bg-black">
              {getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.video_url) ? (
                <video
                  src={getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.video_url)}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={getMediaUrl(stories.find(s => s.id === previewingVideoStoryId)?.image_url)}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-4 start-4 flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 pr-3 rounded-shape-xs">
                <BulletinAvatar
                  src={stories.find(s => s.id === previewingVideoStoryId)?.author_avatar}
                  alt={stories.find(s => s.id === previewingVideoStoryId)?.author_name}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="text-[var(--text-primary)] text-[11px] font-bold drop-shadow-md leading-none">
                    {stories.find(s => s.id === previewingVideoStoryId)?.author_name}
                  </span>
                  <span className="text-[var(--text-primary)]/60 text-[9px] drop-shadow-md">
                    {isRtl ? 'معاينة سريعة' : 'Quick Preview'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      {}
      {}
      {/* Account Settings & KYC AppModal */}
      <AppModal
        open={isProfileEditModalOpen && !!user}
        onClose={() => setIsProfileEditModalOpen(false)}
        size="lg"
        layer="modal"
      >
        {user && (
          <div className="space-y-4 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-accent" />
                <h3 className="text-sm font-extrabold">{isRtl ? 'إعدادات الحساب وتوثيق الهوية' : 'Account Settings & KYC'}</h3>
              </div>
              <button onClick={() => setIsProfileEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>

              {}
              <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
                <button
                  type="button"
                  onClick={() => setKycTab('info')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] transition-theme ${
                    kycTab === 'info'
                      ? 'bg-accent/10 text-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  {isRtl ? 'المعلومات الشخصية' : 'Personal Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setKycTab('kyc')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-sm)] transition-theme flex items-center gap-1 ${
                    kycTab === 'kyc'
                      ? 'bg-accent/10 text-accent'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>{isRtl ? 'طلب توثيق الحساب' : 'Get Verified (KYC)'}</span>
                </button>
              </div>

              {kycTab === 'info' ? (
                <form onSubmit={handleSaveProfile} className="space-y-5 max-h-[75vh] overflow-y-auto pe-1">
                  {/* Banner & Avatar Upload Box with Smart Crop */}
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-inset)] p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-accent">
                        <Sparkles size={15} />
                        <span>{isRtl ? 'صورة البروفايل والغلاف مع القص والضغط الذكي' : 'Profile Avatar & Cover Image'}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {isRtl ? 'يتم القص التلقائي مجاناً لحجم خفيف' : 'Auto Smart Crop Enabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ImageUploadDropzone
                        label={isRtl ? 'الصورة الشخصية:' : 'Avatar (Profile Photo):'}
                        value={profileFormData.avatar}
                        onChange={(url) => setProfileFormData(prev => ({ ...prev, avatar: url }))}
                        aspectRatio={1}
                        targetWidth={400}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع صورة شخصية (400×400 - 1:1)' : 'Upload Avatar (400×400)'}
                        isRtl={isRtl}
                      />

                      <ImageUploadDropzone
                        label={isRtl ? 'صورة الغلاف:' : 'Cover Banner:'}
                        value={profileFormData.cover_image}
                        onChange={(url) => setProfileFormData(prev => ({ ...prev, cover_image: url }))}
                        aspectRatio={3}
                        targetWidth={1200}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع غلاف الحائط (1200×400 - 3:1)' : 'Upload Cover Banner (1200×400)'}
                        isRtl={isRtl}
                      />
                    </div>
                  </div>

                  {/* Section 1: Basic Professional Info */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <User size={14} />
                      <span>{isRtl ? 'المعلومات الشخصية والمهنية' : 'Personal & Professional Info'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'الاسم المعروض:' : 'Display Name:'}</label>
                        <input
                          type="text"
                          required
                          value={profileFormData.name}
                          onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                          placeholder={isRtl ? 'اسمك الكامل' : 'Your full name'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المهنة / المسمى الوظيفي:' : 'Occupation / Title:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileFormData.occupation}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, occupation: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder={isRtl ? 'مثال: مهندس برمجيات، تاجر معتمد، رائد أعمال' : 'e.g., Software Engineer, Merchant'}
                          />
                          <Briefcase size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={profileFormData.email}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="name@example.com"
                          />
                          <AtSign size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'المدينة / الموقع:' : 'City / Location:'}</label>
                        <LocationAutocompleteInput
                          value={profileFormData.location}
                          onChange={(val) => setProfileFormData(prev => ({ ...prev, location: val }))}
                          placeholder={isRtl ? 'القدس الشريف، الخليل، رام الله، عمان...' : 'City, region or GPS...'}
                          isRtl={isRtl}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'النبذة التعريفية:' : 'Bio / Overview:'}</label>
                      <textarea
                        rows={2}
                        value={profileFormData.bio}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, bio: e.target.value, custom_instructions: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                        placeholder={isRtl ? 'اكتب نبذة تعريفية قصيرة تظهر على حائطك الشخصي...' : 'Brief description about yourself...'}
                      />
                    </div>
                  </div>

                  {/* Section 2: Website & Custom Domain */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <Globe size={14} />
                      <span>{isRtl ? 'الموقع الإلكتروني والدومين الخاص' : 'Website & Custom Domain'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'رابط الموقع الشخصي:' : 'Website URL:'}</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profileFormData.website_url}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, website_url: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="https://mywebsite.com"
                          />
                          <Link size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">{isRtl ? 'اسم الدومين الخاص:' : 'Custom Domain Name:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileFormData.custom_domain}
                            onChange={(e) => setProfileFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                            className="w-full px-3 py-2 ps-8 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent outline-none"
                            placeholder="username.com"
                          />
                          <Globe size={14} className="absolute start-2.5 top-2.5 text-[var(--text-muted)]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[var(--fg-success)] shrink-0" />
                        <div>
                          <p className="font-bold text-[var(--fg-success)] dark:text-[var(--fg-success)]">{isRtl ? 'علامة توثيق النطاق والموقع' : 'Verified Domain Badge'}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{isRtl ? 'إظهار شارة النطاق الموثق على حائطك الشخصي' : 'Show verified domain badge on profile'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileFormData(prev => ({ ...prev, is_domain_verified: !prev.is_domain_verified }))}
                        className={`px-3 py-1 rounded-shape-sm font-bold text-[11px] transition-colors ${
                          profileFormData.is_domain_verified
                            ? 'bg-[var(--fg-success)] text-white'
                            : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)]'
                        }`}
                      >
                        {profileFormData.is_domain_verified ? (isRtl ? '✓ موثق' : '✓ Verified') : (isRtl ? 'تفعيل' : 'Enable')}
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Social Media Links */}
                  <div className="space-y-3 bg-[var(--surface-inset)] p-3.5 rounded-xl border border-[var(--border-default)]">
                    <h4 className="text-xs font-black text-accent flex items-center gap-1.5 border-b border-[var(--border-default)] pb-2">
                      <Share2 size={14} />
                      <span>{isRtl ? 'حسابات التواصل الاجتماعي الإضافية' : 'Social Media Accounts'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">Facebook</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.facebook || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, facebook: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://facebook.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">Instagram</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.instagram || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, instagram: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">LinkedIn</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.linkedin || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, linkedin: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">X / Twitter</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.twitter || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, twitter: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://x.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">WhatsApp</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.whatsapp || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, whatsapp: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="+970599000000"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-muted)]">YouTube / GitHub</label>
                        <input
                          type="text"
                          value={profileFormData.social_links.youtube || profileFormData.social_links.github || ''}
                          onChange={(e) => setProfileFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, youtube: e.target.value, github: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--surface-card)] border border-[var(--border-default)]"
                          placeholder="https://youtube.com/@channel or github"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3 sticky bottom-0 bg-[var(--surface-card)] p-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileEditModalOpen(false)}
                      className="min-h-[38px] px-4 py-2 rounded-shape-sm border border-[var(--border-default)] text-xs font-bold hover:bg-[var(--surface-subtle)] active:scale-95 transition-all cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="min-h-[38px] px-5 py-2 rounded-shape-sm bg-accent text-[var(--text-primary)] text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-[var(--border-main)]"
                    >
                      {isSubmittingProfile ? (isRtl ? 'جاري حفظ التغييرات...' : 'Saving...') : (isRtl ? 'حفظ إعدادات الملف الشخصي ✨' : 'Save Profile Settings')}
                    </button>
                  </div>
                </form>
              ) : user && (
                <div className="space-y-4">
                  {user.kyc_status === 'verified' && (
                    <div className="p-4 rounded-shape-md bg-accent/10 border border-accent/20 text-center space-y-2">
                      <div className="flex justify-center">
                        <ShieldCheck size={40} className="text-accent" />
                      </div>
                      <h4 className="text-sm font-extrabold text-accent">{isRtl ? 'حسابك موثق بالشارة الزرقاء' : 'Account Verified'}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {isRtl ? 'لقد قمنا بالتحقق من هويتك بنجاح. تتمتع الآن بثقة كاملة في جميع صفقاتك ونشراتك.' : 'Your identity is fully verified.'}
                      </p>
                    </div>
                  )}

                  {user.kyc_status === 'pending' && (
                    <div className="p-4 rounded-shape-md bg-yellow-500/10 border border-yellow-500/20 text-center space-y-2">
                      <div className="flex justify-center">
                        <div className="w-10 h-10 rounded-shape-full border-4 border-yellow-500 border-t-transparent animate-spin" />
                      </div>
                      <h4 className="text-sm font-extrabold text-yellow-500">{isRtl ? 'طلب التوثيق قيد المراجعة' : 'Verification Pending'}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {isRtl ? 'طلبك الآن قيد التدقيق لدى الإدارة. سيتم إخطارك وتفعيل الشارة الزرقاء فوراً بعد التحقق.' : 'Your request is under review.'}
                      </p>
                    </div>
                  )}

                  {(user.kyc_status === 'none' || user.kyc_status === 'rejected' || !user.kyc_status) && (
                    <form onSubmit={handleKycSubmit} className="space-y-4">
                      {user.kyc_status === 'rejected' && (
                        <div className="p-3 rounded-shape-sm bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                          {isRtl ? 'تم رفض طلب التوثيق السابق. يرجى تقديم الاسم الحقيقي ومستند واضح للتحقق.' : 'Previous verification request was rejected. Please submit valid documents.'}
                        </div>
                      )}

                      <div className="p-3.5 rounded-shape-md bg-accent/5 border border-accent/10 space-y-1">
                        <h4 className="text-xs font-extrabold text-accent">{isRtl ? 'احصل على الشارة الزرقاء في بيربليكستا بورد 🛡️' : 'Get the Blue Verification Badge on Perplexta Board'}</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                          {isRtl ? 'توثيق الهوية يضمن للعملاء سلامة الصفقات ويمنح منشوراتك الأولوية التامة في محركات البحث والتوصيات بالمنصة.' : 'Verifying your identity builds trust and boosts search priority.'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'الاسم الكامل القانوني (مطابق للهوية):' : 'Legal Full Name:'}</label>
                          <input
                            type="text"
                            required
                            value={kycFullName}
                            onChange={(e) => setKycFullName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)]"
                            placeholder={isRtl ? 'مثال: محمد أحمد علي' : 'Legal Name'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'رقم الهوية الوطنية / جواز السفر:' : 'ID / Passport Number:'}</label>
                          <input
                            type="text"
                            required
                            value={kycIDNumber}
                            onChange={(e) => setKycIDNumber(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)]"
                            placeholder="E.g., 401234567"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">{isRtl ? 'صورة الهوية أو مستند رسمي للتوثيق:' : 'Official Identity Document or Selfie with ID:'}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={kycSelfieUrl}
                              onChange={(e) => setKycSelfieUrl(e.target.value)}
                              className="flex-1 px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)]"
                              placeholder="https://..."
                            />
                            <label className="px-3 py-2 rounded-shape-sm bg-accent text-[var(--text-primary)] text-xs font-bold cursor-pointer flex items-center justify-center shrink-0 border border-[var(--border-main)]">
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleKycSelfieUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                        <button
                          type="button"
                          onClick={() => setIsProfileEditModalOpen(false)}
                          className="min-h-[38px] px-4 py-2 rounded-shape-sm border border-[var(--border-default)] text-xs font-bold hover:bg-[var(--surface-subtle)] active:scale-95 transition-all cursor-pointer"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingProfile}
                          className="min-h-[38px] px-4 py-2 rounded-shape-sm bg-accent text-[var(--text-primary)] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-[var(--border-main)]"
                        >
                          {isSubmittingProfile ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال طلب التوثيق' : 'Submit Verification')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
          </div>
        )}
      </AppModal>

      {/* Manage Merchant Page & Admins AppModal */}
      <AppModal
        open={isEditPageModalOpen && !!editingPageData}
        onClose={() => { setIsEditPageModalOpen(false); setEditingPageData(null); }}
        size="lg"
        layer="modal"
      >
        {editingPageData && (
          <div className="space-y-4 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-accent" />
                <h3 className="text-sm font-extrabold">{isRtl ? 'إدارة وتعديل الصفحة التجارية والمسؤولين' : 'Manage Merchant Page & Admins'}</h3>
              </div>
              <button onClick={() => { setIsEditPageModalOpen(false); setEditingPageData(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>

              <form onSubmit={handleSavePageEdit} className="space-y-4">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">

                  {}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'اسم الشركة / المتجر:' : 'Page Name:'}</label>
                      <input
                        type="text"
                        required
                        value={editPageFormData.name}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الصنف التجاري / الفئة المعتمدة:' : 'Business Category:'}</label>
                      <CategoryAutocompleteInput
                        value={editPageFormData.category}
                        onChange={(category) => setEditPageFormData(prev => ({ ...prev, category }))}
                        required
                        isRtl={isRtl}
                        placeholder={isRtl ? 'ابحث أو اختر الفئة (مثل: بناء، تكنولوجيا، تجارة، مطاعم...)' : 'Search category (e.g. Construction, Tech...)'}
                      />
                    </div>
                  </div>

                  {/* Merchant High-Precision Location & Address Container */}
                  <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-primary)]">
                        <MapPin size={16} className="text-accent" />
                        <span>{isRtl ? 'الموقع والعنوان التجاري للشركة بدقة عالية' : 'High-Precision Business Location & Address'}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] font-bold border border-[var(--fg-success)]/20">
                        {isRtl ? 'GPS اختياري (مطفي افتراضياً)' : 'GPS Opt-In (Off by default)'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">
                          {isRtl ? 'المدينة / المحافظة أو المنطقة الرئيسية:' : 'City / Governorate or Main Area:'}
                        </label>
                        <LocationAutocompleteInput
                          value={editPageFormData.city}
                          onChange={(city) => setEditPageFormData(prev => ({ ...prev, city }))}
                          selectedCity={editPageFormData.city}
                          onCityChange={(city) => setEditPageFormData(prev => ({ ...prev, city }))}
                          onSelectLocation={(loc) => {
                            setEditPageFormData(prev => ({
                              ...prev,
                              city: loc.city || loc.state || loc.title,
                              address: loc.full_address || loc.title || prev.address,
                              lat: loc.lat || prev.lat,
                              lon: loc.lon || prev.lon
                            }));
                          }}
                          placeholder={isRtl ? 'ابحث عن المدينة، المحافظة أو المعلم التجاري...' : 'Search city, state or commercial hub...'}
                          addressPlaceholder={isRtl ? 'الشارع أو الحي بدقة...' : 'Specific street or district...'}
                          isRtl={isRtl}
                          showGpsButton={true}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">
                          {isRtl ? 'العنوان الفعلي والتفصيلي (الشارع، المبنى، الطابق، المعلم):' : 'Detailed Street Address (Building, Floor, Landmark):'}
                        </label>
                        <input
                          type="text"
                          value={editPageFormData.address}
                          onChange={(e) => setEditPageFormData({ ...editPageFormData, address: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] font-medium text-[var(--text-primary)] focus:border-accent outline-none"
                          placeholder={isRtl ? 'مثال: شارع عمر المختار - عمارة الشروق - الطابق الثاني' : 'E.g., Remal Street, Shorouk Tower, 2nd Fl'}
                        />
                      </div>

                      {/* Manual GPS Coordinates (Latitude & Longitude) Inputs */}
                      <div className="pt-2 border-t border-[var(--border-default)] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                            <Crosshair size={14} className="text-accent" />
                            <span>{isRtl ? 'إحداثيات الموقع الجغرافي الدقيقة:' : 'Exact Business GPS Coordinates (Lat/Lon):'}</span>
                          </label>
                          {editPageFormData.lat && editPageFormData.lon && (
                            <span className="text-[10px] font-mono font-bold text-accent px-2 py-0.5 rounded-shape-full bg-accent/10 border border-accent/20 flex items-center gap-1">
                              <Check size={11} />
                              <span>{editPageFormData.lat}, {editPageFormData.lon}</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">
                              {isRtl ? 'خط العرض (مثلاً 31.7683):' : 'Latitude (e.g. 31.7683):'}
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="-90"
                              max="90"
                              value={editPageFormData.lat}
                              onChange={(e) => setEditPageFormData({ ...editPageFormData, lat: e.target.value })}
                              placeholder="31.768319"
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1">
                              {isRtl ? 'خط الطول (مثلاً 35.2137):' : 'Longitude (e.g. 35.2137):'}
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="-180"
                              max="180"
                              value={editPageFormData.lon}
                              onChange={(e) => setEditPageFormData({ ...editPageFormData, lon: e.target.value })}
                              placeholder="35.213710"
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                            />
                          </div>
                        </div>

                        {/* Helper Action Buttons for Merchant GPS */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!navigator.geolocation) {
                                toast.error(isRtl ? 'تحديد الموقع الجغرافي غير مدعوم في متصفحك' : 'Geolocation not supported');
                                return;
                              }
                              toast.loading(isRtl ? 'جاري قراءة مستشعر GPS للجهاز...' : 'Reading device GPS...');
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  toast.dismiss();
                                  const { latitude, longitude } = pos.coords;
                                  setEditPageFormData(prev => ({
                                    ...prev,
                                    lat: String(latitude.toFixed(6)),
                                    lon: String(longitude.toFixed(6))
                                  }));
                                  toast.success(isRtl ? 'تم التقاط الإحداثيات من الجهاز بنجاح!' : 'Captured device coordinates!');
                                },
                                () => {
                                  toast.dismiss();
                                  toast.error(isRtl ? 'تعذر الحصول على موقع الجهاز' : 'Failed to capture GPS');
                                },
                                { timeout: 8000 }
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--border-default)] hover:border-[var(--fg-success)]/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Compass size={13} />
                            <span>{isRtl ? 'التقاط موقع الجهاز الحالي' : 'Capture Current Device GPS'}</span>
                          </button>

                          {editPageFormData.lat && editPageFormData.lon && (
                            <button
                              type="button"
                              onClick={async () => {
                                const latNum = parseFloat(editPageFormData.lat);
                                const lonNum = parseFloat(editPageFormData.lon);
                                if (isNaN(latNum) || isNaN(lonNum)) return;
                                toast.loading(isRtl ? 'جاري التحقق من الإحداثيات...' : 'Lookup location from coordinates...');
                                try {
                                  const res = await fetch(`/api/bulletin/geocoding/reverse?lat=${latNum}&lon=${lonNum}&lang=${isRtl ? 'ar' : 'en'}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    const resData = data.result || data;
                                    const detectedCity = resData.city || resData.display_name?.split(',')[0] || '';
                                    const fullAddr = resData.display_name || '';
                                    setEditPageFormData(prev => ({
                                      ...prev,
                                      city: detectedCity || prev.city,
                                      address: fullAddr || prev.address
                                    }));
                                    toast.dismiss();
                                    toast.success(isRtl ? `تم جلب العنوان: ${detectedCity || fullAddr}` : `Resolved: ${detectedCity || fullAddr}`);
                                    return;
                                  }
                                } catch (e) {
                                  console.warn(e);
                                }
                                toast.dismiss();
                                toast.error(isRtl ? 'تعذر جلب الاسم التلقائي للإحداثيات' : 'Could not resolve address name');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Navigation size={13} />
                              <span>{isRtl ? 'جلب الاسم والعنوان من الإحداثيات' : 'Reverse Geocode Address'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">{isRtl ? 'نبذة ووصف الشركة:' : 'Description:'}</label>
                    <textarea
                      rows={2}
                      required
                      value={editPageFormData.description}
                      onChange={(e) => setEditPageFormData({ ...editPageFormData, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'رقم الواتساب:' : 'WhatsApp:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.whatsapp_number}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, whatsapp_number: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                        placeholder="970599..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الهاتف للتواصل:' : 'Phone:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.phone_number}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, phone_number: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">{isRtl ? 'الموقع الإلكتروني:' : 'Website URL:'}</label>
                      <input
                        type="text"
                        value={editPageFormData.website_url}
                        onChange={(e) => setEditPageFormData({ ...editPageFormData, website_url: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Image Specifications & Upload Section */}
                  <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-accent">
                      <Sparkles size={16} />
                      <span>{isRtl ? 'قياسات الصور الموصى بها والقص الذكي الخفيف' : 'Recommended Dimensions & Smart Crop'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[var(--text-secondary)]">
                      <div className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <ImageIcon size={13} className="text-accent" />
                          <span>{isRtl ? 'غلاف الصفحة' : 'Cover Banner'}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {isRtl ? RECOMMENDED_IMAGE_SPECS.cover.labelAr : RECOMMENDED_IMAGE_SPECS.cover.labelEn}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] space-y-1">
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <User size={13} className="text-accent" />
                          <span>{isRtl ? 'شعار الصفحة' : 'Avatar Logo'}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {isRtl ? RECOMMENDED_IMAGE_SPECS.avatar.labelAr : RECOMMENDED_IMAGE_SPECS.avatar.labelEn}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <ImageUploadDropzone
                        label={isRtl ? 'شعار الصفحة:' : 'Page Avatar (1:1):'}
                        value={editPageFormData.avatar_url}
                        onChange={(url) => setEditPageFormData({ ...editPageFormData, avatar_url: url })}
                        aspectRatio={1}
                        targetWidth={400}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع الشعار المربع (400×400)' : 'Upload Avatar (400×400)'}
                        isRtl={isRtl}
                      />

                      <ImageUploadDropzone
                        label={isRtl ? 'غلاف الصفحة:' : 'Cover Banner (3:1):'}
                        value={editPageFormData.cover_url}
                        onChange={(url) => setEditPageFormData({ ...editPageFormData, cover_url: url })}
                        aspectRatio={3}
                        targetWidth={1200}
                        targetHeight={400}
                        placeholderText={isRtl ? 'رفع البانير الأفقي (1200×400)' : 'Upload Banner (1200×400)'}
                        isRtl={isRtl}
                      />
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-accent">
                      <Users size={16} />
                      <span>{isRtl ? 'إدارة المسؤولين والأدوار' : 'Manage Page Admins/Managers'}</span>
                    </h4>

                    {}
                    {user && (editingPageData.user_id === user.id || editingPageData.owner_id === user.id || user.role === 'admin') ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold mb-0.5 text-[var(--text-muted)]">{isRtl ? 'البريد الإلكتروني للمسؤول الجديد:' : 'New Manager Email:'}</label>
                            <input
                              type="email"
                              value={newManagerEmail}
                              onChange={(e) => setNewManagerEmail(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] focus:border-accent outline-none"
                              placeholder="manager@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-0.5 text-[var(--text-muted)]">{isRtl ? 'الصلاحية:' : 'Permission Role:'}</label>
                            <SearchableSelect
                              value={newManagerRole}
                              onChange={(val) => setNewManagerRole(val as 'full' | 'limited')}
                              options={[
                                { value: 'limited', label: isRtl ? 'مدير محدود المهام' : 'Limited Admin' },
                                { value: 'full', label: isRtl ? 'مدير كامل الصلاحيات' : 'Full Admin' }
                              ]}
                              searchable={false}
                              dir={isRtl ? 'rtl' : 'ltr'}
                              className="w-full min-w-[140px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newManagerEmail.trim()) {
                                toast.error(isRtl ? 'يرجى إدخال البريد الإلكتروني للمسؤول' : 'Email is required');
                                return;
                              }
                              const emailClean = newManagerEmail.trim().toLowerCase();
                              if (editPageManagers.some(m => m.email === emailClean)) {
                                toast.error(isRtl ? 'هذا البريد الإلكتروني مضاف بالفعل كمسؤول' : 'Manager already exists');
                                return;
                              }
                              const newMgr = {
                                email: emailClean,
                                name: emailClean.split('@')[0],
                                role: newManagerRole
                              };
                              setEditPageManagers([...editPageManagers, newMgr]);
                              setNewManagerEmail('');
                              toast.success(isRtl ? 'تمت إضافة المسؤول للقائمة مؤقتاً! يرجى حفظ الصفحة لتأكيد الحفظ بالخادم.' : 'Manager added to list! Save page to persist.');
                            }}
                            className="px-3 py-2 bg-accent text-[var(--text-primary)] text-xs font-bold rounded-shape-sm h-9 flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all border border-[var(--border-main)]"
                          >
                            <span>{isRtl ? 'إضافة' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] text-center text-xs text-[var(--text-muted)]">
                        {isRtl ? 'صلاحية إضافة وإزالة المسؤولين مقتصرة على مالك الصفحة الأساسي.' : 'Only page owner can manage managers.'}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">{isRtl ? 'قائمة المسؤولين الحاليين:' : 'Current Managers List:'}</p>
                      {editPageManagers.length === 0 ? (
                        <p className="text-[10px] text-[var(--text-muted)] italic">{isRtl ? 'لا يوجد مسؤولين إضافيين لهذه الصفحة حالياً.' : 'No additional managers.'}</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5">
                          {editPageManagers.map((mgr, mIdx) => (
                            <div key={`edit-mgr-${mIdx}`} className="p-2.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-inset)] flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-extrabold truncate block">{mgr.name || mgr.email}</span>
                                <span className="text-[10px] text-[var(--text-muted)] truncate block">{mgr.email}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-shape-full ${
                                  mgr.role === 'full'
                                    ? 'bg-accent/10 text-accent border border-accent/20'
                                    : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                }`}>
                                  {mgr.role === 'full'
                                    ? (isRtl ? 'مدير كامل' : 'Full Admin')
                                    : (isRtl ? 'مدير محدود' : 'Limited Admin')}
                                </span>
                                {user && (editingPageData.user_id === user.id || editingPageData.owner_id === user.id || user.role === 'admin') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditPageManagers(editPageManagers.filter((_, idx) => idx !== mIdx));
                                      toast.info(isRtl ? 'تم حذف المسؤول من القائمة! يرجى حفظ الصفحة لتأكيد التغيير.' : 'Manager removed! Save page to persist.');
                                    }}
                                    className="p-1 rounded-shape-sm text-red-500 hover:bg-red-500/10 transition-theme cursor-pointer"
                                    title={isRtl ? 'إزالة المسؤول' : 'Remove Manager'}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                  <button
                    type="button"
                    onClick={() => { setIsEditPageModalOpen(false); setEditingPageData(null); }}
                    className="min-h-[38px] px-4 py-2 rounded-shape-sm border border-[var(--border-default)] text-xs font-bold hover:bg-[var(--surface-subtle)] active:scale-95 transition-all cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPageEdit}
                    className="min-h-[38px] px-4 py-2 rounded-shape-sm bg-accent text-[var(--text-primary)] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-[var(--border-main)]"
                  >
                    {isSubmittingPageEdit ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </div>
              </form>
          </div>
        )}
      </AppModal>

    </div>
  );
};

export default BulletinBoardPage;
