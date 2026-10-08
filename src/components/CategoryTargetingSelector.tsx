import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Layers, Plus, Sparkles, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { MASTER_PLATFORM_CATEGORIES, PlatformCategory, CATEGORY_GROUPS, searchCategories } from '../constants/categories';

interface CategoryTargetingSelectorProps {
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
  isRtl?: boolean;
}

export const CategoryTargetingSelector: React.FC<CategoryTargetingSelectorProps> = ({
  selectedCategoryIds,
  onChange,
  isRtl = true
}) => {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [suggestions, setSuggestions] = useState<PlatformCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Fetch categories from API with debounce & local fallback
  useEffect(() => {
    let isCancelled = false;
    const fetchCats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (selectedGroup !== 'all') params.append('group', selectedGroup);
        params.append('limit', '50');

        const res = await fetch(`/api/bulletin/categories?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.categories)) {
            setSuggestions(data.categories);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback silently
      }
      if (!isCancelled) {
        setSuggestions(searchCategories(query, selectedGroup, 50));
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCats, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedGroup]);

  // Handle toggle category selection
  const handleToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onChange(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategoryIds, categoryId]);
    }
  };

  const handleRemove = (categoryId: string) => {
    onChange(selectedCategoryIds.filter(id => id !== categoryId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Resolve selected category items for pills
  const selectedCategoriesList = selectedCategoryIds.map(id => {
    const found = MASTER_PLATFORM_CATEGORIES.find(c => c.id === id);
    if (found) return found;
    // Map legacy string interest IDs
    if (id === 'ecommerce') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'ecom_general_store') || null;
    if (id === 'tech') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'tech_software_dev') || null;
    if (id === 'services') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'biz_digital_marketing') || null;
    if (id === 'realestate') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'realestate_residential_sales') || null;
    if (id === 'fashion') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'ecom_fashion_clothing') || null;
    if (id === 'food') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'food_restaurants_fastfood') || null;
    if (id === 'education') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'edu_elearning_courses') || null;
    if (id === 'cars') return MASTER_PLATFORM_CATEGORIES.find(c => c.id === 'auto_car_dealers') || null;
    return {
      id,
      nameAr: id.replace('custom_', ''),
      nameEn: id.replace('custom_', ''),
      groupId: 'custom',
      groupAr: 'فئة مخصصة',
      groupEn: 'Custom Category',
      icon: 'Tag',
      audienceReach: 150000,
      keywords: []
    } as PlatformCategory;
  }).filter(Boolean) as PlatformCategory[];

  // Calculate estimated total target audience based on selected categories
  const totalAudienceEstimate = selectedCategoriesList.reduce((acc, curr) => acc + (curr.audienceReach || 150000), 0);
  const formattedAudience = totalAudienceEstimate > 1000000
    ? `${(totalAudienceEstimate / 1000000).toFixed(1)}M`
    : `${Math.round(totalAudienceEstimate / 1000)}K`;

  return (
    <div className="space-y-3.5">
      {/* Header with Title and Estimated Reach Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)]">
            {isRtl ? 'الاستهداف التفصيلي والاهتمامات' : 'Detailed Targeting & Categories'}
          </label>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {isRtl
              ? 'اختر بدقة المجالات والاهتمامات المتوافقة مع جمهور إعلانك لرفع جودة التحويل والوصول'
              : 'Target specific business sectors and user interests to optimize campaign delivery'}
          </p>
        </div>

        {selectedCategoriesList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1.5 shadow-2xs">
              <Users size={13} className="text-purple-600 dark:text-purple-400" />
              <span>{isRtl ? `جمهور مستهدف: ~${formattedAudience}` : `Reach: ~${formattedAudience}`}</span>
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              {isRtl ? 'تفريغ الكل' : 'Clear all'}
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Search Autocomplete Box & Prominent Dropdown Layer */}
      <div ref={dropdownRef} className="relative z-30">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={
              isRtl
                ? 'ابحث في الفئات والقطاعات (مثال: بناء، تكنولوجيا، عقارات، ملابس، مطاعم، سيارات، ديكور...)'
                : 'Search categories (e.g. Technology, Construction, Real Estate, Fashion, Dining...)'
            }
            className="w-full px-4 py-2.5 text-xs rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ps-9 pe-12 shadow-xs transition-all"
          />

          <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} pointer-events-none text-purple-600 dark:text-purple-400`}>
            <Search size={16} />
          </div>

          <div className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} flex items-center gap-1`}>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors"
                title={isRtl ? 'مسح البحث' : 'Clear search'}
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
              title={isRtl ? 'تبديل القائمة' : 'Toggle dropdown'}
            >
              <ChevronDown size={15} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Floating High-Z-Index Front Layer Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-50 mt-1.5 w-full rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-main)] shadow-xl overflow-hidden flex flex-col max-h-80 ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-sm">
            {/* Clean Sector Tabs Bar */}
            <div className="p-2 border-b border-[var(--border-main)] bg-[var(--surface-subtle)] overflow-x-auto flex gap-1 scrollbar-none items-center">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-2.5 py-1 rounded-shape-xs text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGroup === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border-main)] hover:border-purple-300 hover:text-[var(--text-primary)]'
                }`}
              >
                {isRtl ? 'كافة القطاعات' : 'All Sectors'}
              </button>
              {CATEGORY_GROUPS.map((g) => {
                const isCurrent = selectedGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={`px-2.5 py-1 rounded-shape-xs text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                      isCurrent
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-purple-300 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{isRtl ? g.nameAr : g.nameEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Suggestions Scrollable List with Generous Spacing */}
            <div className="overflow-y-auto flex-1 p-1.5 space-y-1 max-h-60">
              {isLoading && suggestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>{isRtl ? 'جاري تحميل الفئات المعتمدة...' : 'Loading verified categories...'}</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {isRtl ? 'لم يتم العثور على فئة مسجلة مطابقة لبحثك.' : 'No registered categories found matching your query.'}
                  </p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const customId = `custom_${encodeURIComponent(query.trim().toLowerCase())}`;
                        handleToggle(customId);
                        setQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs transition-all"
                    >
                      {isRtl ? `+ إضافة "${query.trim()}" كاهتمام مخصص` : `+ Add "${query.trim()}" as custom interest`}
                    </button>
                  )}
                </div>
              ) : (
                suggestions.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const reachFormatted = cat.audienceReach > 1000000
                    ? `${(cat.audienceReach / 1000000).toFixed(1)}M`
                    : `${Math.round(cat.audienceReach / 1000)}K`;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggle(cat.id)}
                      className={`w-full p-2 rounded-shape-xs text-start flex items-center justify-between transition-all border ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200'
                          : 'bg-[var(--surface-card)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white shadow-2xs' : 'bg-[var(--surface-subtle)] text-purple-600 dark:text-purple-400'
                        }`}>
                          <Layers size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
                            {cat.isFeatured && (
                              <span className="text-[9px] px-1 py-0.2 rounded-shape-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                {isRtl ? 'رائج 🔥' : 'Popular 🔥'}
                              </span>
                            )}
                          </div>
                          <div className="text-[9.5px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">{isRtl ? cat.groupAr : cat.groupEn}</span>
                            <span>•</span>
                            <span>{isRtl ? `وصول: ~${reachFormatted}` : `Reach: ~${reachFormatted}`}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ms-2 shrink-0">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-shape-xs bg-purple-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-shape-xs border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-purple-500 hover:text-purple-600 transition-colors">
                            <Plus size={12} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Summary with Done Button */}
            <div className="p-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)]/70 flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">
                {isRtl ? `${suggestions.length} فئة مقترحة متاحة` : `${suggestions.length} categories available`}
              </span>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>{isRtl ? 'تم وحفظ الاختيارات' : 'Done'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Categories Chips / Badges Container */}
      {selectedCategoriesList.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-[var(--text-secondary)] flex items-center justify-between">
            <span>{isRtl ? 'الفئات والاهتمامات المحددة حالياً:' : 'Selected Targeting Categories:'}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              ({selectedCategoriesList.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
            {selectedCategoriesList.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-2xs group hover:border-purple-500 transition-all"
              >
                <Layers size={13} className="text-purple-600 dark:text-purple-400" />
                <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
                <span className="text-[10px] opacity-80 font-normal px-1.5 py-0.2 rounded-md bg-purple-500/10">
                  {isRtl ? cat.groupAr : cat.groupEn}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(cat.id)}
                  className="p-0.5 rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-600 transition-colors ms-0.5"
                  title={isRtl ? 'إزالة الفئة' : 'Remove category'}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Featured Suggestions Tags */}
      {selectedCategoriesList.length < 6 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
            <Sparkles size={13} className="text-amber-500" />
            <span>{isRtl ? 'فئات شائعة لتعزيز استهداف إعلانك بنقرة واحدة:' : 'Popular one-click targeting categories:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MASTER_PLATFORM_CATEGORIES.filter(c => c.isFeatured && !selectedCategoryIds.includes(c.id)).slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggle(cat.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--surface-card)] border border-[var(--border-main)] hover:border-purple-500 text-[var(--text-secondary)] hover:text-purple-600 transition-all flex items-center gap-1 shadow-2xs"
              >
                <Plus size={11} className="text-purple-500" />
                <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
