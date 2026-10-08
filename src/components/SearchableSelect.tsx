import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { SCROLL_STYLES } from '../styles/scrollStyles';

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr' | string;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  dir = 'ltr',
  dropdownPosition = 'auto',
  searchable,
  size = 'md',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearchEnabled = searchable !== undefined ? searchable : options.length > 6;

  const calculatePosition = useCallback(() => {
    if (dropdownPosition === 'top') {
      setOpenUpward(true);
      return;
    }
    if (dropdownPosition === 'bottom') {
      setOpenUpward(false);
      return;
    }
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > 180) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [dropdownPosition]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      const handleScrollOrResize = () => calculatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && isSearchEnabled && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isSearchEnabled]);

  const validOptions = options.filter(option => option.value !== '');

  const filteredOptions = validOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = validOptions.find(o => o.value === value);

  const heightClass = size === 'sm' ? 'h-8 text-xs' : size === 'lg' ? 'h-11 text-sm' : 'h-10 text-xs';

  return (
    <div 
      id={id}
      className={`relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} 
      ref={wrapperRef} 
      dir={dir}
      data-dropdown-open={isOpen ? "true" : "false"}
    >
      <div
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        className={`w-full ${heightClass} px-3 rounded-[var(--radius-sm)] border flex items-center justify-between cursor-pointer select-none transition-all duration-fast ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        } ${
          isOpen
            ? 'border-[var(--border-accent)] bg-[var(--surface-subtle)] ring-1 ring-[var(--border-accent)]/20 shadow-2xs'
            : 'bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-[var(--border-accent)]/50 hover:bg-[var(--surface-card)]'
        } text-[var(--text-primary)]`}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) calculatePosition();
            setIsOpen(!isOpen);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) {
              if (!isOpen) calculatePosition();
              setIsOpen(!isOpen);
            }
          } else if (e.key === 'Escape' && isOpen) {
            setIsOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[var(--fg-accent)]">{selectedOption.icon}</span>
          )}
          <span className={`truncate font-bold text-start ${selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`opacity-60 transition-transform duration-base shrink-0 ms-1.5 text-[var(--text-muted)] ${
            isOpen ? 'rotate-180 text-[var(--fg-accent)] opacity-100' : ''
          }`} 
        />
      </div>

      {isOpen && (
        <div 
          className={`absolute z-[110] w-full min-w-[200px] ${
            openUpward 
              ? (dir === 'rtl' ? 'bottom-full mb-1.5 right-0 origin-bottom-right' : 'bottom-full mb-1.5 left-0 origin-bottom-left') 
              : (dir === 'rtl' ? 'top-full mt-1.5 right-0 origin-top-right' : 'top-full mt-1.5 left-0 origin-top-left')
          } bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 overscroll-contain`}
        >
          {isSearchEnabled && (
            <div className="p-2 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--surface-subtle)]">
               <Search size={14} className="text-[var(--text-muted)] shrink-0" />
               <input
                 ref={inputRef}
                 type="text"
                 className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)]"
                 placeholder={dir === 'rtl' ? 'بحث...' : 'Search...'}
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 onClick={(e) => e.stopPropagation()}
               />
            </div>
          )}
          <div className={`divide-y divide-[var(--border-default)]/30 ${SCROLL_STYLES.dropdown} max-h-60 p-1 space-y-0.5`}>
            {placeholder && !validOptions.some(o => o.value === '') && (
              <div 
                className={`group px-3 py-2 text-xs rounded-[var(--radius-xs)] cursor-pointer transition-colors duration-fast flex items-center justify-between ${
                  !value 
                    ? 'font-bold bg-[var(--bg-accent-muted)] text-[var(--fg-accent)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
              >
                <span className="truncate">{placeholder}</span>
                {!value && <Check size={14} className="shrink-0 text-[var(--fg-accent)] ms-2" />}
              </div>
            )}
            {filteredOptions.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  className={`group px-3 py-2 text-xs rounded-[var(--radius-xs)] font-semibold cursor-pointer transition-colors duration-fast flex items-center justify-between ${
                    isSelected 
                      ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-bold' 
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                  onClick={() => { onChange(option.value); setIsOpen(false); setSearchTerm(''); }}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 text-[var(--fg-accent)] ms-2" />}
                </div>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-3 text-xs font-medium text-[var(--text-muted)] text-center">
                {dir === 'rtl' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

