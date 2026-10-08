import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Search, 
  X, 
  Compass, 
  Loader2, 
  Check, 
  Globe, 
  Building2, 
  Navigation,
  ChevronDown,
  Crosshair
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getCachedGeoResults, 
  setCachedGeoResults, 
  type StandardGeoResult 
} from '../utils/geoAutocompleteCache';

export type { StandardGeoResult };

export interface SelectedLocationData {
  title: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  lat?: string;
  lon?: string;
  full_address?: string;
  place_id?: string;
  category_label?: string;
  raw_type?: string;
  flag?: string;
}

export interface LocationAutocompleteInputProps {
  value: string;
  onChange?: (value: string) => void;
  onSelectLocation?: (location: SelectedLocationData) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
  placeholder?: string;
  addressPlaceholder?: string;
  isRtl?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  countryFilter?: string;
  showGpsButton?: boolean;
  compact?: boolean;
}

/**
 * Helper to parse a combined location string (e.g., "القدس الشريف", "فلسطين - رام الله", "شارع صلاح الدين، القدس")
 * into structured city/country and specific address without static lists.
 */
function parseLocationText(val: string): { cityOrCountry: string; specificAddress: string } {
  if (!val || typeof val !== 'string') {
    return { cityOrCountry: '', specificAddress: '' };
  }
  const clean = val.trim();
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    return { cityOrCountry: parts[0]?.trim() || '', specificAddress: parts.slice(1).join(' - ').trim() };
  }
  if (clean.includes('،')) {
    const parts = clean.split('،');
    if (parts.length >= 2) {
      // e.g. "شارع يافا، القدس" -> city: "القدس", address: "شارع يافا"
      const lastPart = parts[parts.length - 1].trim();
      const firstParts = parts.slice(0, -1).join('، ').trim();
      return { cityOrCountry: lastPart, specificAddress: firstParts };
    }
  }
  return { cityOrCountry: clean, specificAddress: '' };
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectLocation,
  selectedCity: controlledCity,
  onCityChange,
  selectedCountry: controlledCountry,
  onCountryChange,
  placeholder,
  addressPlaceholder,
  isRtl = true,
  disabled = false,
  className = '',
  id: customId,
  required = false,
  countryFilter,
  showGpsButton = true,
  compact = false,
}) => {
  const generatedId = useId();
  const comboboxId = customId || `loc-combobox-${generatedId}`;
  const listboxId = `loc-listbox-${generatedId}`;
  const inputId = `loc-input-${generatedId}`;

  // Internal state for selected Region/City and Address search query
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    if (controlledCity) return controlledCity;
    if (controlledCountry) return controlledCountry;
    const parsed = parseLocationText(value);
    return parsed.cityOrCountry;
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const parsed = parseLocationText(value);
    return parsed.specificAddress;
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [results, setResults] = useState<StandardGeoResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [showManualGps, setShowManualGps] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [isManualGpsLoading, setIsManualGpsLoading] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external props with local state
  useEffect(() => {
    if (controlledCity !== undefined) {
      setSelectedRegion(controlledCity);
    } else if (value) {
      const parsed = parseLocationText(value);
      if (parsed.cityOrCountry && !selectedRegion) {
        setSelectedRegion(parsed.cityOrCountry);
      }
      if (parsed.specificAddress && !searchQuery) {
        setSearchQuery(parsed.specificAddress);
      }
    } else if (!value) {
      setSelectedRegion('');
      setSearchQuery('');
    }
  }, [value, controlledCity, controlledCountry]);

  // Click outside to close combobox popup
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dynamic location & address suggestions via geocoding API + LRU Cache
  const fetchSuggestions = useCallback((query: string, regionScope: string) => {
    const lang = isRtl ? 'ar' : 'en';
    const effectiveCountry = countryFilter || '';
    const combinedQuery = [query.trim(), regionScope.trim()].filter(Boolean).join(' ');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Check client-side persistent cache first (0ms latency)
    const cached = getCachedGeoResults(combinedQuery, effectiveCountry || 'all', lang);
    if (cached && cached.length > 0) {
      setResults(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const delay = query.trim() ? 300 : 0;
    const timer = setTimeout(async () => {
      try {
        const queryParam = combinedQuery ? `q=${encodeURIComponent(combinedQuery)}&` : '';
        const res = await fetch(
          `/api/bulletin/geocoding/search?${queryParam}country=${encodeURIComponent(
            effectiveCountry
          )}&limit=20&lang=${lang}`,
          { signal: controller.signal }
        );

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            setCachedGeoResults(combinedQuery, data.results, effectiveCountry || 'all', lang);
            setResults(data.results);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[LocationCombobox] Suggestions fetch warning:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [countryFilter, isRtl]);

  // Trigger search on query / scope / open changes
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = fetchSuggestions(searchQuery, selectedRegion);
    return cleanup;
  }, [searchQuery, selectedRegion, isOpen, fetchSuggestions]);

  // Update composite location string and notify parents
  const emitLocationChange = (region: string, address: string, rawItem?: StandardGeoResult) => {
    const parts = [address.trim(), region.trim()].filter(Boolean);
    let fullText = '';

    if (address.trim() && region.trim()) {
      fullText = isRtl ? `${address.trim()}، ${region.trim()}` : `${address.trim()}, ${region.trim()}`;
    } else if (region.trim()) {
      fullText = region.trim();
    } else if (address.trim()) {
      fullText = address.trim();
    }

    if (onChange) {
      onChange(fullText);
    }

    if (onCityChange && region) {
      onCityChange(region);
    }
    if (onCountryChange && rawItem?.country) {
      onCountryChange(rawItem.country);
    }

    if (onSelectLocation) {
      onSelectLocation({
        title: fullText || region || address,
        city: region || rawItem?.city || '',
        state: rawItem?.state,
        country: rawItem?.country,
        country_code: rawItem?.country_code,
        lat: rawItem?.lat,
        lon: rawItem?.lon,
        full_address: rawItem?.display_name || fullText,
        place_id: rawItem?.place_id,
        category_label: rawItem?.category_label,
        raw_type: rawItem?.raw_type,
        flag: rawItem?.flag
      });
    }
  };

  // Handle selecting a dynamic result item
  const handleSelectItem = (item: StandardGeoResult) => {
    const itemTitle = item.title?.trim() || item.city || '';
    const itemCity = item.city?.trim() || '';
    const itemCountry = item.country?.trim() || '';
    const isAdministrative = item.raw_type === 'city' || 
                            item.raw_type === 'state' || 
                            item.raw_type === 'country' || 
                            item.category_label?.includes('مدينة') || 
                            item.category_label?.includes('محافظة') ||
                            item.category_label?.includes('دولة');

    if (isAdministrative && !searchQuery.trim()) {
      // Set region badge and keep input active for specific street/landmark
      setSelectedRegion(itemTitle);
      emitLocationChange(itemTitle, searchQuery, item);
      setIsOpen(false);
      toast.success(isRtl ? `تم اختيار المنطقة: ${itemTitle}` : `Region selected: ${itemTitle}`);
    } else {
      // Specific street, place or landmark selected
      const chosenCity = itemCity || selectedRegion || itemCountry;
      const specificName = itemTitle !== chosenCity ? itemTitle : (item.subtitle?.split('،')[0] || itemTitle);
      
      if (chosenCity && chosenCity !== specificName) {
        setSelectedRegion(chosenCity);
        setSearchQuery(specificName);
        emitLocationChange(chosenCity, specificName, item);
      } else {
        setSelectedRegion(itemTitle);
        setSearchQuery('');
        emitLocationChange(itemTitle, '', item);
      }
      setIsOpen(false);
      toast.success(isRtl ? `تم تحديد الموقع: ${itemTitle}` : `Location pinned: ${itemTitle}`);
    }
  };

  // Handle clearing region badge
  const handleClearRegion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRegion('');
    emitLocationChange('', searchQuery);
    inputRef.current?.focus();
    if (!isOpen) setIsOpen(true);
  };

  // Handle clearing specific address query
  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    emitLocationChange(selectedRegion, '');
    inputRef.current?.focus();
  };

  // Handle manual custom entry commit
  const handleCommitCustomAddress = () => {
    if (!searchQuery.trim() && !selectedRegion.trim()) return;
    emitLocationChange(selectedRegion, searchQuery);
    setIsOpen(false);
    toast.success(isRtl ? 'تم تثبيت العنوان المدخل' : 'Custom address saved');
  };

  // Keyboard Navigation for ARIA Combobox
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectItem(results[highlightedIndex]);
        } else if (searchQuery.trim()) {
          handleCommitCustomAddress();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Real-time GPS device location lookup
  const handleDetectGps = (e: React.MouseEvent) => {
    e.stopPropagation();
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
            const resData = data.result || data;
            const detectedCity = resData.city || resData.display_name?.split(',')[0] || '';
            const detectedCountry = resData.country || '';
            const specificAddr = resData.display_name && resData.display_name !== detectedCity 
              ? resData.display_name.split(',')[0] 
              : '';

            const cityToSet = detectedCity || detectedCountry || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
            setSelectedRegion(cityToSet);
            setSearchQuery(specificAddr);

            emitLocationChange(cityToSet, specificAddr, {
              title: resData.display_name || cityToSet,
              city: detectedCity,
              country: detectedCountry,
              country_code: resData.country_code,
              lat: String(latitude),
              lon: String(longitude),
              display_name: resData.display_name,
              category_label: isRtl ? 'موقع GPS مباشر' : 'Live GPS Pin',
              raw_type: 'gps_device'
            });

            toast.success(isRtl ? `تم التحديد: ${cityToSet}` : `Located: ${cityToSet}`);
            setIsOpen(false);
            return;
          }
        } catch (err) {
          console.warn('[LocationCombobox] GPS reverse geocoding warning:', err);
        }

        const fallback = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
        setSelectedRegion(fallback);
        emitLocationChange(fallback, '');
        toast.success(isRtl ? `تم حفظ الإحداثيات: ${fallback}` : `GPS Coordinates: ${fallback}`);
        setIsOpen(false);
      },
      () => {
        toast.dismiss();
        setIsGpsLoading(false);
        toast.error(isRtl ? 'تعذر الحصول على الموقع الجغرافي للجهاز' : 'Could not detect device location');
      },
      { timeout: 8000 }
    );
  };

  // Manual GPS Coordinates Pin Handler
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
    toast.loading(isRtl ? 'جاري تثبيت موقع الإحداثيات اليدوية...' : 'Resolving manual GPS coordinates...');

    try {
      const lang = isRtl ? 'ar' : 'en';
      const res = await fetch(`/api/bulletin/geocoding/reverse?lat=${latNum}&lon=${lonNum}&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const resData = data.result || data;
        const detectedCity = resData.city || resData.display_name?.split(',')[0] || '';
        const detectedCountry = resData.country || '';
        const specificAddr = resData.display_name && resData.display_name !== detectedCity 
          ? resData.display_name.split(',')[0] 
          : coordStr;

        const cityToSet = detectedCity || detectedCountry || coordStr;
        setSelectedRegion(cityToSet);
        setSearchQuery(specificAddr);

        emitLocationChange(cityToSet, specificAddr, {
          title: resData.display_name || cityToSet,
          city: detectedCity,
          country: detectedCountry,
          country_code: resData.country_code,
          lat: String(latNum),
          lon: String(lonNum),
          full_address: resData.display_name,
          category_label: isRtl ? 'إحداثيات GPS يدوية' : 'Manual GPS Pin',
          raw_type: 'gps_manual'
        });

        toast.dismiss();
        toast.success(isRtl ? `تم اختيار الإحداثيات اليدوية: ${cityToSet}` : `GPS Pinned: ${cityToSet}`);
        setShowManualGps(false);
        setIsOpen(false);
        return;
      }
    } catch (err) {
      console.warn('[LocationCombobox] Manual GPS reverse geocode notice:', err);
    } finally {
      setIsManualGpsLoading(false);
      toast.dismiss();
    }

    setSelectedRegion(coordStr);
    emitLocationChange(coordStr, '', {
      title: `GPS (${coordStr})`,
      lat: String(latNum),
      lon: String(lonNum),
      category_label: isRtl ? 'إحداثيات GPS يدوية' : 'Manual GPS Pin',
      raw_type: 'gps_manual'
    });

    toast.success(isRtl ? `تم حفظ الإحداثيات اليدوية: ${coordStr}` : `GPS Saved: ${coordStr}`);
    setShowManualGps(false);
    setIsOpen(false);
  };

  const activeOptionId = highlightedIndex >= 0 ? `loc-opt-${highlightedIndex}` : undefined;

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${className}`}
      id={comboboxId}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      aria-owns={listboxId}
    >
      {/* Combobox Main Frame */}
      <div 
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`relative flex flex-wrap items-center gap-1.5 min-h-[44px] px-2.5 py-1.5 rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] focus-within:bg-[var(--surface-card)] border transition-all cursor-text ${
          isOpen 
            ? 'border-accent ring-2 ring-accent/20 shadow-sm' 
            : 'border-[var(--border-default)]'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {/* Dynamic Selected City / Country Badge */}
        {selectedRegion && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold shrink-0 max-w-[200px]"
          >
            <MapPin size={13} className="shrink-0 text-accent" />
            <span className="truncate">{selectedRegion}</span>
            <button
              type="button"
              onClick={handleClearRegion}
              disabled={disabled}
              className="p-0.5 rounded-full hover:bg-accent/20 text-accent transition-colors cursor-pointer"
              title={isRtl ? 'تغيير المنطقة' : 'Change region'}
              aria-label={isRtl ? `إزالة ${selectedRegion}` : `Remove ${selectedRegion}`}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}

        {/* Active Input Field for Specific Address / Search */}
        <div className="flex-1 flex items-center min-w-[140px] relative">
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-activedescendant={activeOptionId}
            required={required && !selectedRegion && !searchQuery}
            disabled={disabled}
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(-1);
              if (!isOpen) setIsOpen(true);
              emitLocationChange(selectedRegion, e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedRegion 
                ? (addressPlaceholder || (isRtl ? 'ابحث عن شارع، حي، أو معلم محدد...' : 'Search street, district, or landmark...'))
                : (placeholder || (isRtl ? 'ابحث عن دولة، مدينة، أو عنوان تفصيلي...' : 'Search country, city, or address...'))
            }
            className="w-full bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-medium outline-none py-1"
          />

          {isLoading && (
            <Loader2 size={14} className="text-accent animate-spin shrink-0 me-1 pointer-events-none" />
          )}
        </div>

        {/* Action Buttons: Clear Query + GPS Detect + Dropdown Arrow */}
        <div className="flex items-center gap-1 shrink-0 ms-auto">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
              title={isRtl ? 'مسح البحث' : 'Clear search'}
              aria-label={isRtl ? 'مسح نص البحث' : 'Clear search text'}
            >
              <X size={14} />
            </button>
          )}

          {showGpsButton && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isGpsLoading || disabled}
                className={`min-h-[32px] px-2 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                  isGpsLoading
                    ? 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30 text-[var(--fg-success)] dark:text-[var(--fg-success)]'
                    : 'bg-[var(--surface-card)] hover:bg-[var(--status-success-subtle)] border-[var(--border-default)] hover:border-[var(--fg-success)]/30 text-[var(--text-secondary)] hover:text-[var(--fg-success)] dark:hover:text-[var(--fg-success)]'
                }`}
                title={isRtl ? 'تحديد الموقع الدقيق بالجهاز عبر GPS (مطفي افتراضياً - تشغيل يدوي عند الرغبة)' : 'Auto-detect GPS (Off by default - click to run)'}
                aria-label={isRtl ? 'تحديد الموقع بالـ GPS (مطفي افتراضياً)' : 'Detect GPS (Off by default)'}
              >
                {isGpsLoading ? (
                  <Loader2 size={13} className="animate-spin text-[var(--fg-success)]" />
                ) : (
                  <Compass size={13} className="text-[var(--fg-success)]" />
                )}
                {!compact && <span className="hidden sm:inline">{isRtl ? 'GPS' : 'GPS'}</span>}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManualGps(prev => !prev);
                  if (!isOpen) setIsOpen(true);
                }}
                disabled={disabled}
                className={`min-h-[32px] px-2 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                  showManualGps
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-[var(--surface-card)] hover:bg-accent/10 border-[var(--border-default)] hover:border-accent/30 text-[var(--text-secondary)] hover:text-accent'
                }`}
                title={isRtl ? 'إدخال إحداثيات GPS يدوياً (خط العرض وخط الطول)' : 'Enter manual GPS coordinates (Lat/Lon)'}
                aria-label={isRtl ? 'إدخال إحداثيات GPS يدوياً' : 'Manual GPS Coordinates'}
              >
                <Crosshair size={13} className="text-accent" />
                {!compact && <span className="hidden sm:inline">{isRtl ? 'إحداثيات' : 'Lat/Lon'}</span>}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(prev => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-transform rounded-full"
            aria-label={isOpen ? (isRtl ? 'إغلاق القائمة' : 'Close list') : (isRtl ? 'فتح القائمة' : 'Open list')}
          >
            <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Progress Indicator Line */}
      <div className="absolute inset-x-3 -bottom-0.5 h-0.5 overflow-hidden rounded-full pointer-events-none">
        {isLoading && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '100%', opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-accent to-transparent rounded-full"
          />
        )}
      </div>

      {/* Combobox Dynamic Results Listbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            id={listboxId}
            role="listbox"
            aria-label={isRtl ? 'اقتراحات العناوين والمواقع' : 'Location and address suggestions'}
            className="absolute z-50 start-0 end-0 mt-1.5 max-h-72 overflow-hidden flex flex-col rounded-2xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-2 space-y-1.5 text-start"
          >
            {/* Quick GPS Action in Dropdown Header */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleDetectGps}
                className="w-full group flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer text-start"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 text-[var(--fg-success)] dark:text-[var(--fg-success)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {isGpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Compass size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--fg-success)] dark:group-hover:text-[var(--fg-success)] truncate">
                      {isRtl ? 'تحديد الموقع الفعلي عبر GPS' : 'Use Current Device Location (GPS)'}
                    </p>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20 shrink-0">
                      {isRtl ? 'مطفي افتراضياً' : 'Off by default'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {isRtl ? 'انقر لتشغيل المستشعر وقراءة الإحداثيات عند رغبتك فقط' : 'Click to run GPS sensor only when desired'}
                  </p>
                </div>
              </button>

              {/* Manual GPS Expandable Card */}
              {showManualGps && (
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-accent/40 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-accent">
                      <Crosshair size={15} />
                      <span>{isRtl ? 'إدخال إحداثيات GPS يدوياً (Latitude & Longitude)' : 'Manual GPS Coordinates Pin'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualGps(false)}
                      className="p-1 rounded-full hover:bg-accent/10 text-[var(--text-muted)] hover:text-accent cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                        {isRtl ? 'خط العرض (Lat):' : 'Latitude (Lat):'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        placeholder="e.g. 31.768319"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                        {isRtl ? 'خط الطول (Lon):' : 'Longitude (Lon):'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        placeholder="e.g. 35.213710"
                        value={manualLon}
                        onChange={(e) => setManualLon(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)] focus:border-accent text-[var(--text-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualGps(false)}
                      className="px-2.5 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={!manualLat || !manualLon || isManualGpsLoading}
                      onClick={handleApplyManualGps}
                      className="px-3 py-1 rounded-lg bg-accent text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {isManualGpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      <span>{isRtl ? 'تثبيت الإحداثيات' : 'Apply Coordinates'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Manual Address Tag Button */}
            {searchQuery.trim().length >= 2 && (
              <button
                type="button"
                onClick={handleCommitCustomAddress}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-dashed border-accent/40 text-accent transition-colors cursor-pointer text-start"
              >
                <div className="flex items-center gap-2 truncate">
                  <Navigation size={14} className="shrink-0" />
                  <span className="text-xs font-bold truncate">
                    {isRtl 
                      ? `تثبيت العنوان المدخل: "${searchQuery.trim()}"${selectedRegion ? ` (${selectedRegion})` : ''}`
                      : `Pin Custom Address: "${searchQuery.trim()}"${selectedRegion ? ` (${selectedRegion})` : ''}`
                    }
                  </span>
                </div>
                <span className="text-[10px] bg-accent text-white px-2.5 py-0.5 rounded-full font-black shrink-0">
                  {isRtl ? '+ اعتماد' : '+ Select'}
                </span>
              </button>
            )}

            {/* Listbox Header Info */}
            <div className="text-[10px] font-bold text-[var(--text-muted)] px-1.5 flex items-center justify-between">
              <span>
                {searchQuery.trim() || selectedRegion
                  ? (isRtl ? 'العناوين والأماكن المطابقة' : 'Matching Locations & Addresses')
                  : (isRtl ? 'المدن والمواقع المقترحة' : 'Suggested Hubs')}
              </span>
              {isLoading && <Loader2 size={11} className="text-accent animate-spin" />}
            </div>

            {/* Dynamic Results Scroll Container */}
            <div className="overflow-y-auto custom-scrollbar overscroll-contain max-h-48 space-y-0.5 pe-0.5">
              {isLoading && results.length === 0 && (
                <div className="text-center py-6 px-3 text-[var(--text-muted)] space-y-2">
                  <Loader2 size={20} className="mx-auto text-accent animate-spin" />
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    {isRtl ? 'جاري البحث في قاعدة البيانات والمحركات الجغرافية...' : 'Searching geo-engines & places...'}
                  </p>
                </div>
              )}

              {results.map((item, idx) => {
                const title = item.title;
                const subtitle = item.subtitle || (item.state ? `${item.state}، ${item.country}` : item.country) || '';
                const isSelected = (value && value.includes(title)) || (selectedRegion === title);
                const isHighlighted = highlightedIndex === idx;

                const isCountryOrCity = item.raw_type === 'city' || 
                                       item.raw_type === 'state' || 
                                       item.raw_type === 'country' || 
                                       item.category_label?.includes('مدينة') || 
                                       item.category_label?.includes('دولة');

                return (
                  <button
                    key={`combobox-opt-${idx}-${item.place_id || title}`}
                    id={`loc-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected || isHighlighted}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full group flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-start ${
                      isSelected
                        ? 'bg-accent/15 border border-accent/30 text-accent font-bold'
                        : isHighlighted
                        ? 'bg-[var(--surface-subtle)] border border-[var(--border-default)]'
                        : 'hover:bg-[var(--surface-subtle)] border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform ${
                      isCountryOrCity 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' 
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] group-hover:text-accent'
                    }`}>
                      {isCountryOrCity ? <Building2 size={14} /> : <MapPin size={14} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-accent truncate">
                          {title}
                        </p>
                        {item.category_label && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--surface-subtle)] text-[var(--text-muted)] font-medium shrink-0">
                            {item.category_label}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                );
              })}

              {results.length === 0 && !isLoading && (
                <div className="text-center py-5 px-3 text-[var(--text-muted)] space-y-1">
                  <MapPin size={20} className="mx-auto text-accent opacity-50" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {isRtl ? 'لم يتم العثور على عنوان مطابق' : 'No matching locations found'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {isRtl ? 'يمكنك كتابة العنوان المخصص واعتماده مباشرة' : 'You can type and pin a custom address'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
