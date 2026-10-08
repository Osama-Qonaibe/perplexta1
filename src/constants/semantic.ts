/**
 * 🎯 SEMANTIC TOKENS
 * 
 * Intent-based aliases that work in both light and dark modes.
 * Use ONLY these in components, never primitives.
 */

export const SEMANTIC_COLORS = {
  // Surfaces
  surface: {
    page: 'var(--surface-page)',
    card: 'var(--surface-card)',
    subtle: 'var(--surface-subtle)',
    inset: 'var(--surface-inset)',
  },

  // Foreground (Text)
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    disabled: 'var(--fg-disabled)',
    onEmphasis: 'var(--fg-on-emphasis)',
    accent: 'var(--fg-accent)',
  },

  // Background
  bg: {
    primary: 'var(--bg-default)',
    secondary: 'var(--bg-muted)',
    accent: 'var(--bg-accent-emphasis)',
    accentMuted: 'var(--bg-accent-muted)',
    inset: 'var(--bg-inset)',
  },

  // Borders
  border: {
    main: 'var(--border-main)',
    default: 'var(--border-main)',
    subtle: 'var(--border-subtle)',
    muted: 'var(--border-muted)',
    accent: 'var(--border-accent)',
  },

  // Status (Semantic)
  success: {
    fg: 'var(--fg-success)',
    bg: 'var(--bg-success-muted)',
    bgEmphasis: 'var(--bg-success-emphasis)',
  },
  danger: {
    fg: 'var(--fg-danger)',
    bg: 'var(--bg-danger-muted)',
    bgEmphasis: 'var(--bg-danger-emphasis)',
  },
  warning: {
    fg: 'var(--fg-warning)',
    bg: 'var(--bg-warning-muted)',
    bgEmphasis: 'var(--bg-warning-emphasis)',
    attentionFg: 'var(--fg-warning)',
    attentionBg: 'var(--bg-warning-muted)',
  },
  info: {
    fg: 'var(--fg-info)',
    bg: 'var(--bg-info-muted)',
  },
} as const;

export type SemanticToken = typeof SEMANTIC_COLORS;

/**
 * 🏛️ MATERIAL 3 ELEVATION SCALE
 * Structured elevation levels replacing arbitrary opacities (/90, /95, /80)
 */
export const ELEVATION = {
  level0: 'shadow-none',
  level1: 'shadow-sm bg-opacity-95',   // Cards & Content Blocks
  level2: 'shadow-md bg-opacity-90',   // Sticky Header / Footer / Toolbars
  level3: 'shadow-lg bg-opacity-85',   // Modals & Floating Dialogs
  level4: 'shadow-xl bg-opacity-80',   // Drawers, Sheets & Action Bars
  level5: 'shadow-2xl',                // Floating System Toasts
} as const;

/**
 * 📐 MATERIAL 3 SHAPE SCALE
 * Exactly 5 discrete radii replacing ad-hoc rounded-[Npx]
 */
export const SHAPE = {
  xs: 'rounded-shape-xs',     // 4px - Micro badges & tags
  sm: 'rounded-shape-sm',     // 8px - Buttons & input fields (replaces rounded-[8px])
  md: 'rounded-shape-md',     // 12px - Standard cards & dialogs (default)
  lg: 'rounded-shape-lg',     // 16px - Large modals & drawers (replaces rounded-2xl)
  full: 'rounded-shape-full', // 9999px - Capsule navigation, pills & circular avatars
} as const;

/**
 * 🔤 MATERIAL 3 TYPE SCALE
 * 5 discrete typographic levels replacing arbitrary text-[8.5px]
 */
export const TYPE_SCALE = {
  display: 'font-display text-4xl sm:text-5xl font-bold tracking-tight',
  headline: 'font-sans text-2xl sm:text-3xl font-bold tracking-tight',
  title: 'font-sans text-base sm:text-lg font-semibold',
  body: 'font-sans text-sm sm:text-base font-normal leading-relaxed',
  label: 'font-sans text-xs sm:text-sm font-medium tracking-wide',
  labelSmall: 'font-sans text-[11px] font-bold tracking-wider',
} as const;

/**
 * 👆 MANDATORY TOUCH TARGET STANDARDS (WCAG AA & Material 3)
 * Enforces minimum 44x44px interactive physical touch boundaries
 */
export const TOUCH_TARGET = {
  min: 'min-w-[44px] min-h-[44px]',
  hitBox: 'relative before:absolute before:-inset-1.5 before:content-[\'\']',
} as const;

