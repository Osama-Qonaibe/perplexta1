/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — BUTTON PRIMITIVE (v4.0.0)
 * 
 * Strict implementation of Perplexta Brand Guide v4.0.0:
 * - Primary: var(--github-green) with translateY(-1px) hover and Oklab brightness mix
 * - Secondary: var(--muted) with border hover
 * - Focus: 3px box-shadow with var(--github-blue) 18% opacity (no outline)
 * - Transitions: <= 0.15s ease
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'destructive' | 'danger' | 'outline' | 'ghost' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<string, string> = {
  primary: `
    h-8 px-3.5 bg-[var(--github-green)] text-white font-semibold text-xs rounded-lg
    border border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]
    hover:bg-[color-mix(in_oklab,var(--github-green)_88%,white)] hover:-translate-y-px
    hover:shadow-[0_2px_6px_0_color-mix(in_oklab,var(--github-green)_30%,transparent)]
    active:translate-y-0 active:shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]
    focus-visible:outline-none focus-visible:border-[var(--github-blue)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  secondary: `
    h-8 px-2.5 bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]
    font-semibold text-xs rounded-lg shadow-xs
    hover:bg-[color-mix(in_oklab,var(--muted)_80%,transparent)]
    hover:border-[color-mix(in_oklab,var(--border)_70%,var(--foreground)_30%)] hover:-translate-y-px
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--github-blue)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  icon: `
    w-8 h-8 flex items-center justify-center bg-[var(--muted)] text-[var(--foreground)]
    border border-[var(--border)] rounded-lg
    hover:bg-[color-mix(in_oklab,var(--muted)_80%,transparent)]
    hover:border-[color-mix(in_oklab,var(--border)_70%,var(--foreground)_30%)] hover:-translate-y-px
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--github-blue)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  destructive: `
    h-8 px-3.5 bg-[var(--destructive)] text-white font-semibold text-xs rounded-lg
    border border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]
    hover:bg-[color-mix(in_oklab,var(--destructive)_88%,white)] hover:-translate-y-px
    hover:shadow-[0_2px_6px_0_color-mix(in_oklab,var(--destructive)_30%,transparent)]
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--destructive)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  danger: `
    h-8 px-3.5 bg-[var(--destructive)] text-white font-semibold text-xs rounded-lg
    border border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]
    hover:bg-[color-mix(in_oklab,var(--destructive)_88%,white)] hover:-translate-y-px
    hover:shadow-[0_2px_6px_0_color-mix(in_oklab,var(--destructive)_30%,transparent)]
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--destructive)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  outline: `
    h-8 px-3 bg-transparent text-[var(--foreground)] border border-[var(--border)]
    font-semibold text-xs rounded-lg
    hover:bg-[var(--muted)] hover:border-[color-mix(in_oklab,var(--border)_70%,var(--foreground)_30%)] hover:-translate-y-px
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--github-blue)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  ghost: `
    h-8 px-2.5 bg-transparent text-[var(--muted-foreground)] border border-transparent
    font-semibold text-xs rounded-lg
    hover:bg-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]
    active:scale-[0.98]
    focus-visible:outline-none focus-visible:border-[var(--github-blue)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-blue)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
  admin: `
    h-8 px-3.5 bg-[color-mix(in_oklab,var(--github-purple)_12%,transparent)]
    text-[var(--github-purple)] border border-[color-mix(in_oklab,var(--github-purple)_25%,var(--border))]
    font-semibold text-xs rounded-lg
    hover:bg-[color-mix(in_oklab,var(--github-purple)_20%,transparent)] hover:-translate-y-px
    active:translate-y-0
    focus-visible:outline-none focus-visible:border-[var(--github-purple)]
    focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--github-purple)_18%,transparent)]
    transition-all duration-150 ease-out
  `,
};

const SIZE_OVERRIDES: Record<string, string> = {
  sm: 'h-7 px-2 text-[11px]',
  md: '', // Default h-8
  lg: 'h-10 px-4 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, disabled, className = '', children, ...props }, ref) => {
    const isIconOnly = variant === 'icon';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 select-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${VARIANT_STYLES[variant] || VARIANT_STYLES.primary}
          ${size !== 'md' && !isIconOnly ? SIZE_OVERRIDES[size] : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading && <Loader2 size={14} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
