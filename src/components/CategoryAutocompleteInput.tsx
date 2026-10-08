import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Layers, ChevronDown } from 'lucide-react';
import { PlatformCategory, CATEGORY_GROUPS, searchCategories } from '../constants/categories';

interface CategoryAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRtl?: boolean;
  required?: boolean;
  className?: string;
}

export const CategoryAutocompleteInput: React.FC<CategoryAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder,
  isRtl = true,
  required = false,
  className = ''
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [suggestions, setSuggestions] = useState<PlatformCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input when external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch or filter suggestions on query/group change
  useEffect(() => {
    let isCancelled = false;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (selectedGroup !== 'all') params.append('group', selectedGroup);
        params.append('limit', '40');

        const res = await fetch(`/api/bulletin/categories?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.categories) {
            setSuggestions(data.categories);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local dataset on error
      }
      if (!isCancelled) {
        setSuggestions(searchCategories(query, selectedGroup, 40));
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedGroup]);

  const handleSelect = (cat: PlatformCategory) => {
    const displayValue = isRtl ? `${cat.nameAr} / ${cat.nameEn}` : `${cat.nameEn} / ${cat.nameAr}`;
    setQuery(displayValue);
    onChange(displayValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative w-full z-20">
      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            placeholder ||
            (isRtl
              ? 'ابحث أو اختر الفئة (مثل: تجارة إلكترونية، مقاولات، برمجيات، مطاعم...)'
              : 'Search or select category (e.g. E-Commerce, Construction, Software...)')
          }
          className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-accent ps-9 pe-16 transition-all ${className}`}
        />

        <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} pointer-events-none text-accent`}>
          <Search size={15} />
        </div>

        <div className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} flex items-center gap-1`}>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] transition-colors"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-accent hover:bg-accent/10 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-[var(--surface-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden max-h-80 flex flex-col ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-sm">
          {/* Sector Quick Filters */}
          <div className="p-2 border-b border-[var(--border-main)] bg-[var(--surface-subtle)] overflow-x-auto flex gap-1.5 scrollbar-none items-center">
            <button
              type="button"
              onClick={() => setSelectedGroup('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedGroup === 'all'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border border-[var(--border-main)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isRtl ? 'كافة القطاعات' : 'All Sectors'}
            </button>
            {CATEGORY_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedGroup === g.id
                    ? 'bg-accent text-white border-accent shadow-xs'
                    : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-accent hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{isRtl ? g.nameAr : g.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Suggestions List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-[var(--border-main)]/20">
            {isLoading && suggestions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>{isRtl ? 'جاري جلب الفئات المعتمدة...' : 'Loading categories...'}</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-6 px-4 text-center space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  {isRtl ? 'لم يتم العثور على فئة مطابقة، يمكنك استخدام النص المكتوب مباشرة.' : 'No matching category found, you can use your custom text.'}
                </p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(query.trim());
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                  >
                    {isRtl ? `استخدام "${query.trim()}" كفئة مخصصة` : `Use "${query.trim()}" as custom category`}
                  </button>
                )}
              </div>
            ) : (
              suggestions.map((cat) => {
                const isSelected = query.includes(cat.nameAr) || query.includes(cat.nameEn);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full p-2.5 rounded-xl text-start flex items-center justify-between transition-all border ${
                      isSelected
                        ? 'bg-accent/10 border-accent/30 text-accent font-bold'
                        : 'border-transparent hover:border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-subtle)] flex items-center justify-center shrink-0 text-accent">
                        <Layers size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {isRtl ? cat.nameAr : cat.nameEn}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <span className="text-accent font-semibold">{isRtl ? cat.groupAr : cat.groupEn}</span>
                          <span>•</span>
                          <span>{isRtl ? cat.nameEn : cat.nameAr}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check size={14} className="text-accent shrink-0 ms-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
