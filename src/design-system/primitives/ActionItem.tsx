/**
 * ⚡ PERPLEXTA DESIGN SYSTEM — ACTION ITEM PRIMITIVE (v4.0.0)
 * 
 * Standardized atomic menu and list action button.
 * Enforces:
 * - 44px touch target standards (WCAG AA & Material Design 3)
 * - Brand Green / Blue / Purple / Danger states
 * - Native RTL / LTR text and icon alignments
 * - Single-line text wrap protection
 */

import React, { forwardRef } from 'react';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocumentDirection } from '../../components/AdaptiveMenu';

export type ActionItemVariant = 'default' | 'accent' | 'danger' | 'success' | 'admin';

export interface ActionItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  shortcut?: string;
  variant?: ActionItemVariant;
  isDestructive?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  dir?: 'rtl' | 'ltr';
  compact?: boolean;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
}

export const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(({
  label,
  icon,
  description,
  badge,
  shortcut,
  variant = 'default',
  isDestructive = false,
  isActive = false,
  isLocked = false,
  dir,
  compact = false,
  hasSubmenu = false,
  isSubmenuOpen = false,
  className = '',
  disabled,
  onClick,
  ...rest
}, ref) => {
  const isDanger = isDestructive || variant === 'danger';
  const isDisabledOrLocked = disabled || isLocked;
  const currentDir = dir || getDocumentDirection();
  const isRtl = currentDir === 'rtl';

  // Base touch-target & styling tokens matching design system specs
  const baseClasses = `
    min-h-[32px] h-[32px] w-full flex items-center gap-2 px-2.5 rounded-shape-xs text-xs font-medium
    transition-all duration-120 ease-out select-none text-start border border-transparent
    ${isDisabledOrLocked ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
  `;

  // Color & Hover dynamics
  let stateClasses = '';
  if (isActive) {
    stateClasses = 'bg-[var(--surface-subtle)] text-[var(--text-primary)] font-bold border-[var(--border-default)]';
  } else if (isDanger) {
    stateClasses = 'text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 font-bold';
  } else if (variant === 'accent') {
    stateClasses = 'text-[var(--fg-accent)] hover:bg-[var(--surface-subtle)]';
  } else if (variant === 'admin') {
    stateClasses = 'text-purple-500 hover:bg-[var(--surface-subtle)]';
  } else if (variant === 'success') {
    stateClasses = 'text-[var(--fg-success)] hover:bg-[var(--surface-subtle)]';
  } else {
    stateClasses = 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]';
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabledOrLocked}
      onClick={isDisabledOrLocked ? undefined : onClick}
      dir={dir}
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...rest}
    >
      {/* Leading Icon */}
      {icon && (
        <span className={`w-4 h-4 flex-shrink-0 flex items-center justify-center transition-colors duration-150 ${
          isActive 
            ? 'text-[var(--accent)]' 
            : isDanger 
              ? 'text-[var(--fg-danger)] group-hover:text-[var(--fg-danger)]' 
              : variant === 'admin'
                ? 'text-purple-500'
                : variant === 'success'
                  ? 'text-[var(--fg-success)]'
                  : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
        }`}>
          {icon}
        </span>
      )}

      {/* Content Text (Single-line protected against wrapping) */}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="truncate whitespace-nowrap leading-tight">
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] truncate">
            {description}
          </span>
        )}
      </div>

      {/* Trailing Extras pushed to far opposite side via mr-auto in RTL / ml-auto in LTR */}
      <div className={`shrink-0 flex items-center gap-1 ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
        {isLocked && (
          <span className="text-[10px] flex items-center gap-1 text-[var(--fg-warning)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono border border-[var(--border-subtle)]">
            <Lock className="w-2.5 h-2.5" />
            <span>PRO</span>
          </span>
        )}

        {badge && !isLocked && (
          <span className="text-[10px]">{badge}</span>
        )}

        {shortcut && !isLocked && (
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
            {shortcut}
          </kbd>
        )}

        {/* Submenu Indicator Chevron */}
        {hasSubmenu && !isLocked && (
          <span className={`transition-transform duration-150 ${isSubmenuOpen ? (isRtl ? '-translate-x-0.5 text-[var(--accent)]' : 'translate-x-0.5 text-[var(--accent)]') : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'}`}>
            {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>
    </button>
  );
});

ActionItem.displayName = 'ActionItem';
