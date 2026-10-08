import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  X,
  Globe,
  Navigation,
  Check,
  Loader2,
  Layers,
  Maximize2,
  Plus,
  Compass,
  Map as MapIcon
} from 'lucide-react';
import { PALESTINE_GEO } from '../constants/geoData';

export interface LocationItem {
  id?: string | number;
  name: string;
  nameAr: string;
  nameEn?: string;
  type: 'city' | 'country' | 'state' | 'region';
  country?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  flag?: string;
}

interface DynamicLocationTargetingSelectorProps {
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
  isRtl?: boolean;
}

// Popular quick presets to choose from instantly
const POPULAR_LOCATION_PRESETS: LocationItem[] = [
  { name: 'Palestinian Territory', nameAr: 'الأراضي الفلسطينية', nameEn: 'Palestinian Territory', type: 'country', countryCode: 'PS', flag: '🇵🇸', lat: 31.9522, lon: 35.2332 },
  { name: 'القدس الشريف', nameAr: 'القدس الشريف', nameEn: 'Jerusalem', type: 'city', country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', lat: 31.7683, lon: 35.2137 },
  { name: 'رام الله والبيرة', nameAr: 'رام الله والبيرة', nameEn: 'Ramallah & Al-Bireh', type: 'city', country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', lat: 31.9038, lon: 35.2034 },
  { name: 'الخليل', nameAr: 'الخليل', nameEn: 'Hebron', type: 'city', country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', lat: 31.5326, lon: 35.0998 },
  { name: 'غزة', nameAr: 'غزة', nameEn: 'Gaza', type: 'city', country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', lat: 31.5017, lon: 34.4668 },
  { name: 'نابلس', nameAr: 'نابلس', nameEn: 'Nablus', type: 'city', country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', lat: 32.2211, lon: 35.2544 },
  { name: 'الأردن', nameAr: 'المملكة الأردنية الهاشمية', nameEn: 'Jordan', type: 'country', countryCode: 'JO', flag: '🇯🇴', lat: 30.5852, lon: 36.2384 },
  { name: 'مصر', nameAr: 'جمهورية مصر العربية', nameEn: 'Egypt', type: 'country', countryCode: 'EG', flag: '🇪🇬', lat: 26.8206, lon: 30.8025 },
  { name: 'الإمارات', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', type: 'country', countryCode: 'AE', flag: '🇦🇪', lat: 23.4241, lon: 53.8478 },
  { name: 'السعودية', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', type: 'country', countryCode: 'SA', flag: '🇸🇦', lat: 23.8859, lon: 45.0792 }
];

export const DynamicLocationTargetingSelector: React.FC<DynamicLocationTargetingSelectorProps> = ({
  selectedLocations,
  onChange,
  isRtl = true
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapZoom, setMapZoom] = useState(8);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Live Location Query debounced to backend /api/system/location-sync
  useEffect(() => {
    if (!query.trim()) {
      // Show default top recommendations
      setSuggestions(POPULAR_LOCATION_PRESETS);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/system/location-sync?q=${encodeURIComponent(query.trim())}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.results && Array.isArray(data.results)) {
            const mapped: LocationItem[] = data.results.map((r: any) => ({
              id: r.id || r.place_id,
              name: r.title || r.city,
              nameAr: r.title || r.city,
              nameEn: r.city || r.title,
              type: r.category_label === 'country' ? 'country' : 'city',
              country: r.country,
              countryCode: r.country_code,
              flag: r.flag || (r.country_code === 'PS' ? '🇵🇸' : '📍'),
              lat: r.lat ? Number(r.lat) : undefined,
              lon: r.lon ? Number(r.lon) : undefined
            }));

            // If empty from database, fallback to local geo dataset filter
            if (mapped.length === 0) {
              const localFiltered = filterLocalGeo(query);
              setSuggestions(localFiltered);
            } else {
              setSuggestions(mapped);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[LocationTargeting] Backend query fallback:', err);
      }

      if (!isCancelled) {
        setSuggestions(filterLocalGeo(query));
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchLocations, 140);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Helper for fast client-side fallback matching
  const filterLocalGeo = (term: string): LocationItem[] => {
    const q = term.toLowerCase().trim();
    const results: LocationItem[] = [];

    // Check popular presets
    for (const p of POPULAR_LOCATION_PRESETS) {
      if (p.nameAr.toLowerCase().includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q))) {
        results.push(p);
      }
    }

    // Check Palestinian Cities
    for (const c of PALESTINE_GEO.cities) {
      if (c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)) {
        if (!results.some(r => r.nameAr === c.nameAr)) {
          results.push({
            name: c.nameAr,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            type: 'city',
            country: 'فلسطين',
            countryCode: 'PS',
            flag: '🇵🇸'
          });
        }
      }
    }

    return results;
  };

  const handleAddLocation = (loc: LocationItem) => {
    const key = loc.nameAr || loc.name;
    if (!selectedLocations.includes(key)) {
      onChange([...selectedLocations, key]);
    }
    setQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveLocation = (locName: string) => {
    onChange(selectedLocations.filter(l => l !== locName));
  };

  return (
    <div className="space-y-3.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
          <MapPin size={14} className="text-purple-600 dark:text-purple-400" />
          <span>{isRtl ? 'المواقع المستهدفة:' : 'Target Locations:'}</span>
        </label>

        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 transition-colors"
        >
          <MapIcon size={13} />
          <span>{isRtl ? (showMap ? 'إخفاء الخريطة' : 'عرض الخريطة التفاعلية') : (showMap ? 'Hide Map' : 'Interactive Map')}</span>
        </button>
      </div>

      {/* Dynamic Search Box with Real-Time Dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-purple-600 dark:text-purple-400">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </span>
          <input
            type="text"
            value={query}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            placeholder={isRtl ? 'اكتب للبحث وإضافة مدن أو دول بالوقت الحي...' : 'Type to search and add cities or countries...'}
            className="w-full ps-10 pe-10 py-2.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden transition-all placeholder:text-[var(--text-muted)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions(POPULAR_LOCATION_PRESETS);
              }}
              className="absolute inset-y-0 end-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Live Auto-Complete Suggestions Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 start-0 end-0 mt-1 max-h-60 overflow-y-auto bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-md shadow-xl divide-y divide-[var(--border-main)]/50"
            >
              <div className="px-3 py-1 bg-[var(--surface-subtle)]/80 text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
                <span>{isRtl ? 'اقتراحات الأماكن والمناطق المتاحة' : 'Available Locations & Regions'}</span>
                {isLoading && <span className="flex items-center gap-1 text-purple-600 font-normal"><Loader2 size={10} className="animate-spin" /> {isRtl ? 'جاري البحث...' : 'Searching...'}</span>}
              </div>

              {suggestions.length === 0 && !isLoading ? (
                <div className="p-3 text-center text-xs text-[var(--text-muted)]">
                  {isRtl ? 'لم يتم العثور على مناطق مطابقة.' : 'No matching locations found.'}
                </div>
              ) : (
                suggestions.map((loc, idx) => {
                  const isSelected = selectedLocations.includes(loc.nameAr || loc.name);
                  return (
                    <button
                      key={`${loc.name}-${idx}`}
                      type="button"
                      onClick={() => handleAddLocation(loc)}
                      className={`w-full text-start px-3 py-1.5 text-xs flex items-center justify-between transition-colors hover:bg-purple-500/10 ${
                        isSelected ? 'bg-purple-500/5 text-purple-700 dark:text-purple-300 font-bold' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{loc.flag || '📍'}</span>
                        <div className="truncate">
                          <div className="font-bold flex items-center gap-1.5 leading-tight">
                            <span>{isRtl ? loc.nameAr : (loc.nameEn || loc.nameAr)}</span>
                            {loc.nameEn && isRtl && (
                              <span className="text-[9.5px] font-normal text-[var(--text-muted)]">({loc.nameEn})</span>
                            )}
                          </div>
                          <span className="text-[9.5px] text-[var(--text-muted)] block leading-tight mt-0.5">
                            {loc.type === 'country' ? (isRtl ? 'دولة كاملة' : 'Country') : (loc.country || (isRtl ? 'مدينة / محافظة' : 'City'))}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-1.5 py-0.5 rounded-shape-xs bg-purple-600 text-white text-[9px] font-bold flex items-center gap-1 shrink-0">
                          <Check size={10} />
                          {isRtl ? 'مُحدد' : 'Selected'}
                        </span>
                      ) : (
                        <span className="text-purple-600 hover:text-purple-700 p-0.5 shrink-0">
                          <Plus size={13} />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Locations Interactive Chips */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-main)]">
          {selectedLocations.map((locName) => (
            <motion.span
              layout
              key={locName}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--surface-card)] border border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-xs flex items-center gap-1.5 transition-all hover:border-purple-500"
            >
              <MapPin size={12} className="text-purple-500 shrink-0" />
              <span>{locName}</span>
              <button
                type="button"
                onClick={() => handleRemoveLocation(locName)}
                className="p-0.5 hover:bg-purple-500/20 rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors"
                title={isRtl ? 'إزالة' : 'Remove'}
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* Interactive Map Visualizer (Satellite/Roadmap) */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--border-main)] bg-slate-900 text-white relative shadow-inner"
          >
            {/* Map Header Controls */}
            <div className="p-2.5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-xs border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-purple-400" />
                <span className="font-bold text-[11px]">
                  {isRtl ? 'نطاق الاستهداف الجغرافي الحي' : 'Live Geographic Radius'}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                  {selectedLocations.length} {isRtl ? 'مواقع' : 'locations'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.min(14, prev + 1))}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center transition-colors"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.max(4, prev - 1))}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center transition-colors"
                >
                  -
                </button>
              </div>
            </div>

            {/* Stylized Interactive Map Canvas Display */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden">
              {/* Radar Grid Graphic */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              {/* Pulsing Concentric Range Rings */}
              <div className="absolute w-44 h-44 rounded-full border border-purple-500/30 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-32 h-32 rounded-full border border-purple-500/50 bg-purple-500/10 backdrop-blur-xs flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-purple-400 bg-purple-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-pulse" />
                </div>
              </div>

              {/* Location Pins Visualization */}
              <div className="relative z-10 text-center space-y-1 max-w-xs px-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-purple-500/40 text-xs font-bold shadow-xl">
                  <MapPin size={13} className="text-purple-400 shrink-0" />
                  <span className="truncate">
                    {selectedLocations[0] || (isRtl ? 'الأراضي الفلسطينية والشرق الأوسط' : 'Target Region')}
                  </span>
                  {selectedLocations.length > 1 && (
                    <span className="text-[10px] text-purple-300 font-mono">+{selectedLocations.length - 1}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {isRtl ? 'يتم توجيه الإعلان بدقة للمستخدمين المتواجدين في هذه النطاقات الجغرافية' : 'Ads are delivered specifically to users within this boundary'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
