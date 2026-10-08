import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, X, Compass, Loader2, Globe, Check, ArrowRight, ArrowLeft, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { 
  getCachedGeoResults, 
  setCachedGeoResults, 
  type StandardGeoResult 
} from '../../utils/geoAutocompleteCache';

export type { StandardGeoResult };

export interface SelectedLocationData {
  title: string;
  city: string;
  state?: string;
  country?: string;
  countryCode?: string;
  lat?: string;
  lon?: string;
  fullAddress?: string;
}

export interface UniversalLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: SelectedLocationData) => void;
  currentValue?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  isRtl?: boolean;
  allowGlobalOption?: boolean;
  onSelectGlobal?: () => void;
  countryFilter?: string;
  showToastOnSelect?: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
  placement?: 'center' | 'dropdown' | 'auto';
}

export const UniversalLocationModal: React.FC<UniversalLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentValue = '',
  title,
  subtitle,
  placeholder,
  isRtl = true,
  allowGlobalOption = false,
  onSelectGlobal,
  countryFilter,
  showToastOnSelect = true,
  anchorRef,
  placement = 'auto',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<StandardGeoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [showManualGps, setShowManualGps] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [isManualGpsLoading, setIsManualGpsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Strictly lock background body/html scrolling while the modal or dropdown is active
  useModalScrollLock(isOpen, 'universal-location-modal');

  // Compute anchor position for desktop dropdown presentation
  useEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }

    if (anchorRef?.current && placement !== 'center') {
      const calculatePosition = () => {
        if (!anchorRef.current) return;
        const isMobile = window.innerWidth < 640;
        if (isMobile) {
          setDropdownPosition(null);
          return;
        }

        const rect = anchorRef.current.getBoundingClientRect();
        const modalWidth = Math.min(480, window.innerWidth - 32);
        const top = Math.min(rect.bottom + 8, window.innerHeight - 450);

        if (isRtl) {
          // Align right edge of dropdown near right edge of trigger button
          const rightEdge = window.innerWidth - rect.right;
          const adjustedRight = Math.max(16, Math.min(rightEdge, window.innerWidth - modalWidth - 16));
          setDropdownPosition({ top, right: adjustedRight });
        } else {
          // Align left edge of dropdown near left edge of trigger button
          const leftEdge = rect.left;
          const adjustedLeft = Math.max(16, Math.min(leftEdge, window.innerWidth - modalWidth - 16));
          setDropdownPosition({ top, left: adjustedLeft });
        }
      };

      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      return () => {
        window.removeEventListener('resize', calculatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, anchorRef, placement, isRtl]);

  // Initialize and load dynamic initial hubs/suggestions on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const lang = isRtl ? 'ar' : 'en';

      // 1. Check client-side persistent localStorage / memory cache first (Zero Latency)
      const cached = getCachedGeoResults('', countryFilter || 'all', lang);
      if (cached && cached.length > 0) {
        setResults(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetch(`/api/bulletin/geocoding/search?lang=${lang}&country=${encodeURIComponent(countryFilter || '')}&limit=15`, {
          signal: controller.signal
        })
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data.results)) {
              setCachedGeoResults('', data.results, countryFilter || 'all', lang);
              setResults(data.results);
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              console.warn('[UniversalLocationModal] Initial dynamic suggestions error:', err);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, countryFilter, isRtl]);

  // Real-time dynamic geocoding search with debouncing, request cancellation, and localStorage caching
  useEffect(() => {
    if (!isOpen) return;

    const query = searchQuery.trim();
    const lang = isRtl ? 'ar' : 'en';

    // Cancel any previous pending API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!query) {
      // If query cleared, load default suggestions from persistent cache or fetch
      const cached = getCachedGeoResults('', countryFilter || 'all', lang);
      if (cached && cached.length > 0) {
        setResults(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetch(`/api/bulletin/geocoding/search?lang=${lang}&country=${encodeURIComponent(countryFilter || '')}&limit=15`, {
          signal: controller.signal
        })
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data.results)) {
              setCachedGeoResults('', data.results, countryFilter || 'all', lang);
              setResults(data.results);
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              console.warn('[UniversalLocationModal] Suggestions error:', err);
            }
          })
          .finally(() => setIsLoading(false));
      }
      return;
    }

    // Check client-side persistent cache first (instant 0ms response for repeated searches)
    const cachedResults = getCachedGeoResults(query, countryFilter || 'all', lang);
    if (cachedResults && cachedResults.length > 0) {
      setResults(cachedResults);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce API dispatch (350ms) to avoid unnecessary API requests per keystroke
    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(
          `/api/bulletin/geocoding/search?q=${encodeURIComponent(query)}&country=${encodeURIComponent(
            countryFilter || ''
          )}&limit=25&lang=${lang}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            // Persist to client-side localStorage cache with LRU eviction and 48h TTL
            setCachedGeoResults(query, data.results, countryFilter || 'all', lang);
            setResults(data.results);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn('[UniversalLocationModal] Geocoding lookup error:', e);
        }
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, isOpen, countryFilter, isRtl]);

  const handleSelect = (item: StandardGeoResult | string) => {
    let locData: SelectedLocationData;
    if (typeof item === 'string') {
      locData = {
        title: item,
        city: item,
      };
    } else {
      locData = {
        title: item.title,
        city: item.city || item.title,
        state: item.state,
        country: item.country,
        countryCode: item.country_code,
        lat: item.lat,
        lon: item.lon,
        fullAddress: item.display_name || `${item.title}، ${item.subtitle || ''}`,
      };
    }

    onSelectLocation(locData);

    // Sync selected location to local server cache in the background to avoid redundant Google Places API calls
    try {
      fetch('/api/system/location-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: locData.title,
          city: locData.city,
          state: locData.state,
          country: locData.country,
          countryCode: locData.countryCode,
          lat: locData.lat,
          lon: locData.lon,
          fullAddress: locData.fullAddress,
          place_id: typeof item !== 'string' ? item.place_id : undefined,
          category_label: typeof item !== 'string' ? item.category_label : undefined,
          raw_type: typeof item !== 'string' ? item.raw_type : undefined,
          flag: typeof item !== 'string' ? item.flag : undefined,
          source: typeof item !== 'string' ? (item.source || 'client_modal') : 'manual_entry'
        })
      }).catch((syncErr) => console.warn('[LocationSync] Background cache sync notice:', syncErr));
    } catch {
      // Non-blocking
    }

    if (showToastOnSelect) {
      toast.success(isRtl ? `تم اختيار: ${locData.title}` : `Location set: ${locData.title}`);
    }
    onClose();
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error(isRtl ? 'تحديد الموقع غير مدعوم في متصفحك' : 'Geolocation not supported');
      return;
    }
    setIsGpsLoading(true);
    toast.loading(isRtl ? 'جاري تحديد موقعك الجغرافي...' : 'Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        toast.dismiss();
        setIsGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        try {
          const lang = isRtl ? 'ar' : 'en';
          const res = await fetch(`/api/bulletin/geocoding/reverse?lat=${latitude}&lon=${longitude}&lang=${lang}`);
          if (res.ok) {
            const data = await res.json();
            const place = data.result?.city || data.result?.display_name?.split(',')[0] || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            const countryName = data.result?.country || '';
            handleSelect({
              title: place,
              city: place,
              country: countryName,
              lat: String(latitude),
              lon: String(longitude),
              display_name: data.result?.display_name || `${place}، ${countryName}`,
              flag: '📍',
            } as StandardGeoResult);
            return;
          }
        } catch (e) {
          console.warn('GPS reverse lookup failed:', e);
        }
        handleSelect({
          title: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          city: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          lat: String(latitude),
          lon: String(longitude),
          display_name: `GPS: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          flag: '📍',
        } as StandardGeoResult);
      },
      () => {
        toast.dismiss();
        setIsGpsLoading(false);
        toast.error(isRtl ? 'تعذر الحصول على الموقع الجغرافي' : 'Could not detect location');
      },
      { timeout: 8000 }
    );
  };

  const handleApplyManualGps = async () => {
    const latNum = parseFloat(manualLat);
    const lonNum = parseFloat(manualLon);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error(isRtl ? 'خط العرض (Latitude) غير صحيح. يجب أن يكون بين -90 و 90' : 'Invalid Latitude (-90 to 90)');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      toast.error(isRtl ? 'خط الطول (Longitude) غير صحيح. يجب أن يكون بين -180 و 180' : 'Invalid Longitude (-180 to 180)');
      return;
    }

    setIsManualGpsLoading(true);
    const coordStr = `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
    toast.loading(isRtl ? 'جاري تثبيت الإحداثيات اليدوية...' : 'Resolving manual GPS pin...');

    try {
      const lang = isRtl ? 'ar' : 'en';
      const res = await fetch(`/api/bulletin/geocoding/reverse?lat=${latNum}&lon=${lonNum}&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const resData = data.result || data;
        const detectedCity = resData.city || resData.display_name?.split(',')[0] || coordStr;

        handleSelect({
          title: resData.display_name || detectedCity,
          city: detectedCity,
          country: resData.country,
          country_code: resData.country_code,
          lat: String(latNum),
          lon: String(lonNum),
          display_name: resData.display_name,
          category_label: isRtl ? 'إحداثيات GPS يدوية' : 'Manual GPS Pin',
          raw_type: 'gps_manual'
        } as any);

        setShowManualGps(false);
        return;
      }
    } catch (err) {
      console.warn('[UniversalLocationModal] Manual GPS reverse geocode warning:', err);
    } finally {
      setIsManualGpsLoading(false);
      toast.dismiss();
    }

    handleSelect({
      title: `GPS (${coordStr})`,
      city: coordStr,
      lat: String(latNum),
      lon: String(lonNum),
      category_label: isRtl ? 'إحداثيات GPS يدوية' : 'Manual GPS Pin',
      raw_type: 'gps_manual'
    } as any);

    setShowManualGps(false);
  };

  const handleSelectGlobal = () => {
    if (onSelectGlobal) {
      onSelectGlobal();
    } else {
      onSelectLocation({
        title: isRtl ? 'كافة المواقع' : 'All Locations',
        city: '',
      });
    }
    if (showToastOnSelect) {
      toast.success(isRtl ? 'تم تفعيل التغطية العامة لكافة المواقع' : 'Global coverage activated');
    }
    onClose();
  };

  const isSelected = (titleToTest: string) => {
    if (!currentValue) return false;
    const normCur = currentValue.trim().toLowerCase();
    const normTest = titleToTest.trim().toLowerCase();
    return normCur === normTest || normCur.includes(normTest) || normTest.includes(normCur);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain transition-all duration-200"
          onClick={onClose}
        >
          {dropdownPosition ? (
            /* Anchored Desktop Dropdown Flyout */
            <div
              className="fixed"
              style={{
                top: `${dropdownPosition.top}px`,
                ...(dropdownPosition.left !== undefined ? { left: `${dropdownPosition.left}px` } : {}),
                ...(dropdownPosition.right !== undefined ? { right: `${dropdownPosition.right}px` } : {}),
                width: 'calc(100vw - 32px)',
                maxWidth: '480px',
              }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-4 sm:p-5 space-y-3.5 max-h-[82vh] overflow-y-auto custom-scrollbar text-[var(--text-primary)] transform-gpu"
              >
                {/* Header: Title + GPS Action + Clear/Close */}
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-full hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      title={isRtl ? 'رجوع' : 'Back'}
                    >
                      {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                    </button>
                    <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] tracking-tight">
                      {title || (isRtl ? 'البحث عن موقع' : 'Search for Location')}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Manual GPS Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowManualGps(prev => !prev)}
                      title={isRtl ? 'إدخال إحداثيات GPS يدوياً (خط العرض وخط الطول)' : 'Enter Manual GPS Coordinates'}
                      className={`group relative h-8 px-2.5 rounded-full border flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                        showManualGps
                          ? 'bg-accent/20 border-accent text-accent shadow-xs'
                          : 'bg-[var(--surface-subtle)] hover:bg-accent/10 border-[var(--border-default)] hover:border-accent/30 text-[var(--text-secondary)] hover:text-accent'
                      }`}
                    >
                      <Crosshair size={14} className="text-accent" />
                      <span className="text-[11px] font-bold">
                        {isRtl ? 'إحداثيات' : 'Lat/Lon'}
                      </span>
                    </button>

                    {/* Professional GPS Button in Header (Inactive by default, triggers on click) */}
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isGpsLoading}
                      title={isRtl ? 'استخدام موقعي الحالي (GPS)' : 'Use Current Location (GPS)'}
                      className={`group relative h-8 px-2.5 rounded-full border flex items-center gap-1.5 transition-all text-xs cursor-pointer disabled:opacity-50 ${
                        isGpsLoading
                          ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/40 text-[var(--fg-success)] dark:text-[var(--fg-success)] shadow-xs'
                          : 'bg-[var(--surface-subtle)] hover:bg-[var(--status-success-subtle)] border-[var(--border-default)] hover:border-[var(--fg-success)]/30 text-[var(--text-secondary)] hover:text-[var(--fg-success)] dark:hover:text-[var(--fg-success)]'
                      }`}
                    >
                      {isGpsLoading ? (
                        <Loader2 size={14} className="animate-spin text-[var(--fg-success)] dark:text-[var(--fg-success)]" />
                      ) : (
                        <Compass size={14} className="text-[var(--text-muted)] group-hover:text-[var(--fg-success)] dark:group-hover:text-[var(--fg-success)] group-hover:rotate-45 transition-all" />
                      )}
                      <span className={`text-[11px] font-bold transition-colors ${
                        isGpsLoading
                          ? 'text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                          : 'text-[var(--text-secondary)] group-hover:text-[var(--fg-success)] dark:group-hover:text-[var(--fg-success)]'
                      }`}>
                        {isGpsLoading ? (isRtl ? 'جاري التحديد...' : 'Locating...') : (isRtl ? 'موقعي الحالي' : 'GPS')}
                      </span>
                    </button>

                    {currentValue && (
                      <button
                        type="button"
                        onClick={() => {
                          if (allowGlobalOption) {
                            handleSelectGlobal();
                          } else {
                            onSelectLocation({ title: '', city: '' });
                            onClose();
                          }
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={isRtl ? 'إلغاء التحديد' : 'Clear'}
                      >
                        {isRtl ? 'إلغاء' : 'Clear'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-7 h-7 rounded-full hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      title={isRtl ? 'إغلاق' : 'Close'}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Direct Search Input with Spinner & Progress Indicator */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={placeholder || (isRtl ? 'أين أنت؟' : 'Where are you?')}
                      className="w-full ps-10 pe-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] focus:bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] font-medium outline-none transition-all shadow-inner"
                    />
                    {isLoading ? (
                      <Loader2 size={17} className="absolute start-3.5 text-accent animate-spin pointer-events-none" />
                    ) : (
                      <Search size={17} className="absolute start-3.5 text-[var(--text-muted)] pointer-events-none" />
                    )}

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute end-3.5 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dynamic Loading Progress Bar */}
                  <div className="absolute inset-x-3.5 -bottom-0.5 h-0.5 overflow-hidden rounded-full pointer-events-none">
                    {isLoading && (
                      <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '100%', opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-accent to-transparent rounded-full shadow-[0_0_8px_var(--color-accent)]"
                      />
                    )}
                  </div>
                </div>

                {/* Manual GPS Input Expandable Card */}
                {showManualGps && (
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-accent/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-accent">
                        <Crosshair size={16} />
                        <span>{isRtl ? 'إدخال إحداثيات GPS يدوياً (Latitude & Longitude)' : 'Manual GPS Coordinate Pin'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowManualGps(false)}
                        className="p-1 rounded-full hover:bg-accent/10 text-[var(--text-muted)] hover:text-accent cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          {isRtl ? 'خط العرض (Latitude - مثلاً 31.7683):' : 'Latitude (e.g. 31.7683):'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          placeholder="31.768319"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          {isRtl ? 'خط الطول (Longitude - مثلاً 35.2137):' : 'Longitude (e.g. 35.2137):'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          placeholder="35.213710"
                          value={manualLon}
                          onChange={(e) => setManualLon(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowManualGps(false)}
                        className="px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        disabled={!manualLat || !manualLon || isManualGpsLoading}
                        onClick={handleApplyManualGps}
                        className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      >
                        {isManualGpsLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>{isRtl ? 'تثبيت الموقع بالإحداثيات' : 'Apply GPS Pin'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Compact All Locations Filter */}
                {allowGlobalOption && (
                  <button
                    type="button"
                    onClick={handleSelectGlobal}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl transition-all border cursor-pointer text-start ${
                      !currentValue || currentValue === 'all'
                        ? 'bg-accent/10 border-accent/30 text-accent font-bold shadow-xs'
                        : 'hover:bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/30 text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-transform shrink-0 ${
                        !currentValue || currentValue === 'all'
                          ? 'bg-accent text-white border-accent'
                          : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-accent group-hover:scale-105'
                      }`}>
                        <Globe size={15} />
                      </div>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isRtl ? 'كافة المواقع' : 'All Locations'}
                      </span>
                    </div>
                    {(!currentValue || currentValue === 'all') && (
                      <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                )}

                {/* Content: Suggestions vs Search Results */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 px-1 flex items-center justify-between">
                    <span>
                      {searchQuery.trim()
                        ? isRtl ? 'نتائج البحث' : 'Search Results'
                        : isRtl ? 'الاقتراحات' : 'Suggestions'}
                    </span>
                    {isLoading ? (
                      <Loader2 size={13} className="text-accent animate-spin" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] font-medium">
                        {results.length}
                      </span>
                    )}
                  </h4>

                  {/* Custom typed location fallback if not exact match */}
                  {searchQuery.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleSelect(searchQuery.trim())}
                      className="w-full p-2.5 mb-1.5 rounded-shape-md bg-accent/10 border border-dashed border-accent/40 text-accent hover:bg-accent/20 transition-all flex items-center justify-between text-xs font-bold cursor-pointer text-start"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin size={16} className="shrink-0" />
                        <span className="truncate">
                          {isRtl ? `تثبيت الموقع: "${searchQuery.trim()}"` : `Pin Location: "${searchQuery.trim()}"`}
                        </span>
                      </div>
                      <span className="text-[10px] bg-accent text-white px-2.5 py-1 rounded-full font-black shrink-0">
                        {isRtl ? '+ اختيار' : '+ Select'}
                      </span>
                    </button>
                  )}

                    {/* List of locations */}
                  <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar pe-1">
                    {results.map((item: StandardGeoResult, idx: number) => {
                      const title = item.title || item.city || item.display_name?.split(',')[0] || '';
                      const subtitle = item.subtitle || (item.state ? `${item.state}، ${item.country}` : item.country) || '';
                      const active = isSelected(title);
                      const isCountry = item.raw_type === 'country' || item.category_label === 'دولة' || item.category_label === 'Country';
                      const isGov = item.raw_type?.includes('administrative') || item.category_label === 'محافظة' || item.category_label === 'Governorate';

                      return (
                        <button
                          key={`uni-loc-drop-${idx}-${title}-${item.lat || ''}-${item.lon || ''}`}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={`w-full group flex items-center gap-3 p-2 sm:p-2.5 rounded-shape-md transition-colors border cursor-pointer text-start ${
                            active
                              ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30 text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                              : 'hover:bg-[var(--surface-subtle)] border-transparent hover:border-[var(--border-default)]'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full border flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
                              active
                                ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/40 text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                                : isCountry
                                  ? 'bg-accent/10 border-accent/20 text-accent'
                                  : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] group-hover:text-accent'
                            }`}
                          >
                            {isCountry ? <Globe size={17} /> : isGov ? <Compass size={17} /> : <MapPin size={17} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                                {title}
                              </p>
                              {item.category_label && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                  isCountry
                                    ? 'bg-accent/15 text-accent border border-accent/30'
                                    : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]'
                                }`}>
                                  {item.category_label}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                              {subtitle}
                            </p>
                          </div>
                          {active && (
                            <div className="w-5 h-5 rounded-full bg-[var(--fg-success)] text-white flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {isLoading && results.length === 0 && (
                      <div className="text-center py-8 px-4 space-y-2.5 text-[var(--text-muted)] animate-pulse">
                        <Loader2 size={24} className="mx-auto text-accent animate-spin" />
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          {isRtl ? 'جاري البحث عن المواقع...' : 'Searching locations...'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {isRtl ? 'يتم جلب النتائج الحية من الخرائط' : 'Fetching live map locations'}
                        </p>
                      </div>
                    )}

                    {results.length === 0 && !isLoading && (
                      <div className="text-center py-6 px-4 space-y-1 text-[var(--text-muted)]">
                        <MapPin size={24} className="mx-auto text-accent opacity-60 mb-1" />
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          {isRtl ? 'لم يتم العثور على موقع بهذا الاسم' : 'No locations found'}
                        </p>
                        {searchQuery.trim() && (
                          <p className="text-[11px]">
                            {isRtl
                              ? 'يمكنك تثبيت الاسم الذي كتبته بالضغط على الزر بالأعلى'
                              : 'You can pin the custom name using the option above'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Centered Modal Mode (Mobile or Default) */
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative w-full max-w-md sm:max-w-lg rounded-2xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-4 sm:p-5 space-y-4 my-auto max-h-[85vh] overflow-y-auto custom-scrollbar text-[var(--text-primary)] transform-gpu no-flicker"
            >
              {/* Header: Title + GPS Action + Clear/Close */}
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                    title={isRtl ? 'رجوع' : 'Back'}
                  >
                    {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                  </button>
                  <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] tracking-tight">
                    {title || (isRtl ? 'البحث عن موقع' : 'Search for Location')}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Professional GPS Button in Header (Inactive by default, triggers on click) */}
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isGpsLoading}
                    title={isRtl ? 'استخدام موقعي الحالي (GPS)' : 'Use Current Location (GPS)'}
                    className={`group relative h-8 px-2.5 rounded-full border flex items-center gap-1.5 transition-all text-xs cursor-pointer disabled:opacity-50 ${
                      isGpsLoading
                        ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/40 text-[var(--fg-success)] dark:text-[var(--fg-success)] shadow-xs'
                        : 'bg-[var(--surface-subtle)] hover:bg-[var(--status-success-subtle)] border-[var(--border-default)] hover:border-[var(--fg-success)]/30 text-[var(--text-secondary)] hover:text-[var(--fg-success)] dark:hover:text-[var(--fg-success)]'
                    }`}
                  >
                    {isGpsLoading ? (
                      <Loader2 size={14} className="animate-spin text-[var(--fg-success)] dark:text-[var(--fg-success)]" />
                    ) : (
                      <Compass size={14} className="text-[var(--text-muted)] group-hover:text-[var(--fg-success)] dark:group-hover:text-[var(--fg-success)] group-hover:rotate-45 transition-all" />
                    )}
                    <span className={`text-[11px] font-bold transition-colors ${
                      isGpsLoading
                        ? 'text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                        : 'text-[var(--text-secondary)] group-hover:text-[var(--fg-success)] dark:group-hover:text-[var(--fg-success)]'
                    }`}>
                      {isGpsLoading ? (isRtl ? 'جاري التحديد...' : 'Locating...') : (isRtl ? 'موقعي الحالي' : 'GPS')}
                    </span>
                  </button>

                  {currentValue && (
                    <button
                      type="button"
                      onClick={() => {
                        if (allowGlobalOption) {
                          handleSelectGlobal();
                        } else {
                          onSelectLocation({ title: '', city: '' });
                          onClose();
                        }
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={isRtl ? 'إلغاء التحديد' : 'Clear'}
                    >
                      {isRtl ? 'إلغاء' : 'Clear'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-full hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                    title={isRtl ? 'إغلاق' : 'Close'}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Direct Search Input with Spinner & Progress Indicator */}
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder || (isRtl ? 'أين أنت؟' : 'Where are you?')}
                    className="w-full ps-10 pe-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] focus:bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] font-medium outline-none transition-all shadow-inner"
                  />
                  {isLoading ? (
                    <Loader2 size={17} className="absolute start-3.5 text-accent animate-spin pointer-events-none" />
                  ) : (
                    <Search size={17} className="absolute start-3.5 text-[var(--text-muted)] pointer-events-none" />
                  )}

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-3.5 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dynamic Loading Progress Bar */}
                <div className="absolute inset-x-3.5 -bottom-0.5 h-0.5 overflow-hidden rounded-full pointer-events-none">
                  {isLoading && (
                    <motion.div
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '100%', opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                      className="w-1/2 h-full bg-gradient-to-r from-transparent via-accent to-transparent rounded-full shadow-[0_0_8px_var(--color-accent)]"
                    />
                  )}
                </div>
              </div>

              {/* Compact All Locations Filter */}
              {allowGlobalOption && (
                <button
                  type="button"
                  onClick={handleSelectGlobal}
                  className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl transition-all border cursor-pointer text-start ${
                    !currentValue || currentValue === 'all'
                      ? 'bg-accent/10 border-accent/30 text-accent font-bold shadow-xs'
                      : 'hover:bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/30 text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-transform shrink-0 ${
                      !currentValue || currentValue === 'all'
                        ? 'bg-accent text-white border-accent'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-accent group-hover:scale-105'
                    }`}>
                      <Globe size={15} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {isRtl ? 'كافة المواقع' : 'All Locations'}
                    </span>
                  </div>
                  {(!currentValue || currentValue === 'all') && (
                    <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                      <Check size={10} />
                    </div>
                  )}
                </button>
              )}

              {/* Content: Suggestions vs Search Results */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 px-1 flex items-center justify-between">
                  <span>
                    {searchQuery.trim()
                      ? isRtl ? 'نتائج البحث' : 'Search Results'
                      : isRtl ? 'الاقتراحات' : 'Suggestions'}
                  </span>
                  {isLoading ? (
                    <Loader2 size={13} className="text-accent animate-spin" />
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] font-medium">
                      {results.length}
                    </span>
                  )}
                </h4>

                {/* Custom typed location fallback if not exact match */}
                {searchQuery.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="w-full p-2.5 mb-1.5 rounded-shape-md bg-accent/10 border border-dashed border-accent/40 text-accent hover:bg-accent/20 transition-all flex items-center justify-between text-xs font-bold cursor-pointer text-start"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin size={16} className="shrink-0" />
                      <span className="truncate">
                        {isRtl ? `تثبيت الموقع: "${searchQuery.trim()}"` : `Pin Location: "${searchQuery.trim()}"`}
                      </span>
                    </div>
                    <span className="text-[10px] bg-accent text-white px-2.5 py-1 rounded-full font-black shrink-0">
                      {isRtl ? '+ اختيار' : '+ Select'}
                    </span>
                  </button>
                )}

                {/* List of locations */}
                <div className="space-y-0.5 max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar pe-1">
                  {results.map((item: StandardGeoResult, idx: number) => {
                    const title = item.title || item.city || item.display_name?.split(',')[0] || '';
                    const subtitle = item.subtitle || (item.state ? `${item.state}، ${item.country}` : item.country) || '';
                    const active = isSelected(title);
                    const isCountry = item.raw_type === 'country' || item.category_label === 'دولة' || item.category_label === 'Country';
                    const isGov = item.raw_type?.includes('administrative') || item.category_label === 'محافظة' || item.category_label === 'Governorate';

                    return (
                      <button
                        key={`uni-loc-${idx}-${title}-${item.lat || ''}-${item.lon || ''}`}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`w-full group flex items-center gap-3 p-2 sm:p-2.5 rounded-shape-md transition-colors border cursor-pointer text-start ${
                          active
                            ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30 text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                            : 'hover:bg-[var(--surface-subtle)] border-transparent hover:border-[var(--border-default)]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full border flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${
                            active
                              ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/40 text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                              : isCountry
                                ? 'bg-accent/10 border-accent/20 text-accent'
                                : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] group-hover:text-accent'
                          }`}
                        >
                          {isCountry ? <Globe size={17} /> : isGov ? <Compass size={17} /> : <MapPin size={17} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors truncate">
                              {title}
                            </p>
                            {item.category_label && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                isCountry
                                  ? 'bg-accent/15 text-accent border border-accent/30'
                                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]'
                              }`}>
                                {item.category_label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                            {subtitle}
                          </p>
                        </div>
                        {active && (
                          <div className="w-5 h-5 rounded-full bg-[var(--fg-success)] text-white flex items-center justify-center shrink-0">
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {isLoading && results.length === 0 && (
                    <div className="text-center py-8 px-4 space-y-2.5 text-[var(--text-muted)] animate-pulse">
                      <Loader2 size={24} className="mx-auto text-accent animate-spin" />
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {isRtl ? 'جاري البحث عن المواقع...' : 'Searching locations...'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {isRtl ? 'يتم جلب النتائج الحية من الخرائط' : 'Fetching live map locations'}
                      </p>
                    </div>
                  )}

                  {results.length === 0 && !isLoading && (
                    <div className="text-center py-6 px-4 space-y-1 text-[var(--text-muted)]">
                      <MapPin size={24} className="mx-auto text-accent opacity-60 mb-1" />
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {isRtl ? 'لم يتم العثور على موقع بهذا الاسم' : 'No locations found'}
                      </p>
                      {searchQuery.trim() && (
                        <p className="text-[11px]">
                          {isRtl
                            ? 'يمكنك تثبيت الاسم الذي كتبته بالضغط على الزر بالأعلى'
                            : 'You can pin the custom name using the option above'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
