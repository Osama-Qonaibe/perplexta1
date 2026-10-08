/**
 * 🏷️ PERPLEXTA DESIGN SYSTEM — BADGE PRIMITIVE (v4.0.0)
 * 
 * Strict implementation of Brand Guide v4.0.0:
 * - Green / Success: var(--github-green)
 * - Blue / Accent / Info: var(--github-blue)
 * - Purple / Admin: var(--github-purple)
 * - Orange / Warning: var(--github-orange)
 * - Pink: var(--github-pink)
 * - Destructive / Danger: var(--destructive)
 * - Default: var(--muted) + var(--muted-foreground)
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan' 
  | 'indigo' 
  | 'emerald' 
  | 'rose' 
  | 'default' 
  | 'accent' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info'
  | 'admin';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  hasPulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  size = 'xs',
  hasPulse = false,
  children,
  className,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    green: 'bg-[color-mix(in_oklab,var(--github-green)_15%,transparent)] text-[var(--github-green)] border border-[color-mix(in_oklab,var(--github-green)_30%,transparent)]',
    blue: 'bg-[color-mix(in_oklab,var(--github-blue)_15%,transparent)] text-[var(--github-blue)] border border-[color-mix(in_oklab,var(--github-blue)_30%,transparent)]',
    purple: 'bg-[color-mix(in_oklab,var(--github-purple)_15%,transparent)] text-[var(--github-purple)] border border-[color-mix(in_oklab,var(--github-purple)_30%,transparent)]',
    orange: 'bg-[color-mix(in_oklab,var(--github-orange)_15%,transparent)] text-[var(--github-orange)] border border-[color-mix(in_oklab,var(--github-orange)_30%,transparent)]',
    pink: 'bg-[color-mix(in_oklab,var(--github-pink)_15%,transparent)] text-[var(--github-pink)] border border-[color-mix(in_oklab,var(--github-pink)_30%,transparent)]',
    admin: 'bg-[color-mix(in_oklab,var(--github-purple)_15%,transparent)] text-[var(--github-purple)] border border-[color-mix(in_oklab,var(--github-purple)_30%,transparent)]',
    // Semantic mappings
    accent: 'bg-[color-mix(in_oklab,var(--github-blue)_15%,transparent)] text-[var(--github-blue)] border border-[color-mix(in_oklab,var(--github-blue)_30%,transparent)]',
    info: 'bg-[color-mix(in_oklab,var(--github-blue)_15%,transparent)] text-[var(--github-blue)] border border-[color-mix(in_oklab,var(--github-blue)_30%,transparent)]',
    success: 'bg-[color-mix(in_oklab,var(--github-green)_15%,transparent)] text-[var(--github-green)] border border-[color-mix(in_oklab,var(--github-green)_30%,transparent)]',
    danger: 'bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[var(--destructive)] border border-[color-mix(in_oklab,var(--destructive)_30%,transparent)]',
    warning: 'bg-[color-mix(in_oklab,var(--github-orange)_15%,transparent)] text-[var(--github-orange)] border border-[color-mix(in_oklab,var(--github-orange)_30%,transparent)]',
    default: 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]',
    // Legacy aliases
    cyan: 'bg-[color-mix(in_oklab,var(--github-blue)_15%,transparent)] text-[var(--github-blue)] border border-[color-mix(in_oklab,var(--github-blue)_30%,transparent)]',
    indigo: 'bg-[color-mix(in_oklab,var(--github-purple)_15%,transparent)] text-[var(--github-purple)] border border-[color-mix(in_oklab,var(--github-purple)_30%,transparent)]',
    emerald: 'bg-[color-mix(in_oklab,var(--github-green)_15%,transparent)] text-[var(--github-green)] border border-[color-mix(in_oklab,var(--github-green)_30%,transparent)]',
    rose: 'bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[var(--destructive)] border border-[color-mix(in_oklab,var(--destructive)_30%,transparent)]',
  };

  const sizeStyles = {
    xs: 'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono',
    sm: 'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono',
    md: 'rounded-md px-2.5 py-1 text-xs font-bold font-mono',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 select-none whitespace-nowrap leading-none',
        variantStyles[variant] || variantStyles.blue,
        sizeStyles[size] || sizeStyles.xs,
        className
      )}
    >
      {hasPulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            (variant === 'green' || variant === 'emerald' || variant === 'success') && 'bg-[var(--github-green)] shadow-[0_0_6px_var(--github-green)]',
            (variant === 'blue' || variant === 'cyan' || variant === 'accent' || variant === 'info') && 'bg-[var(--github-blue)] shadow-[0_0_6px_var(--github-blue)]',
            (variant === 'purple' || variant === 'indigo' || variant === 'admin') && 'bg-[var(--github-purple)] shadow-[0_0_6px_var(--github-purple)]',
            (variant === 'orange' || variant === 'warning') && 'bg-[var(--github-orange)] shadow-[0_0_6px_var(--github-orange)]',
            (variant === 'pink') && 'bg-[var(--github-pink)] shadow-[0_0_6px_var(--github-pink)]',
            (variant === 'rose' || variant === 'danger') && 'bg-[var(--destructive)] shadow-[0_0_6px_var(--destructive)]',
            variant === 'default' && 'bg-[var(--muted-foreground)]'
          )}
        />
      )}
      {children}
    </span>
  );
};
