/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — ELEVATION, GLASS & LAYERS CONSTITUTION
 * 
 * Strict elevation levels, glassmorphism treatments, and authoritative Z-Index hierarchy.
 */

export const Z_INDEX = {
  BASE: 0,
  STICKY_CONTENT: 20,
  FLOATING_ACTION: 40,
  SIDEBAR: 150,
  HEADER: 160,
  DROPDOWN: 200,
  POPOVER: 300,
  MODAL_BACKDROP: 1000,
  MODAL_CONTENT: 1010,
  NESTED_MODAL: 1100,
  LIGHTBOX: 1200,
  STORY_VIEWER: 1210,
  REELS_VIEWER: 1220,
  TOAST: 1300,
  TOOLTIP: 1400,
} as const;

export const ELEVATION = {
  level0: 'shadow-none',
  level1: 'shadow-sm',
  level2: 'shadow-md',
  level3: 'shadow-lg',
  level4: 'shadow-xl',
  level5: 'shadow-2xl',
} as const;

/**
 * Concentric Radii Scale
 */
export const CONCENTRIC_RADII = {
  button: 'rounded-[var(--radius-sm)]',       // 8px - buttons, inputs, menu action items
  input: 'rounded-[var(--radius-sm)]',
  actionItem: 'rounded-[var(--radius-sm)]',
  popover: 'rounded-[var(--radius-md)]',      // 12px - popovers, modals, containers, floating cards
  modal: 'rounded-[var(--radius-md)]',
  container: 'rounded-[var(--radius-md)]',
  card: 'rounded-[var(--radius-md)]',
  badge: 'rounded-[var(--radius-xs)]',        // 4px-6px - mini badges, segmented control chips
  chip: 'rounded-[var(--radius-xs)]',
  avatar: 'rounded-full',                     // 9999px - live status dots, user avatars
  statusDot: 'rounded-full',
} as const;

export const GLASSMORPHIC_LAYERS = {
  default: 'backdrop-blur-md ring-1 ring-white/5 shadow-2xl',
  popover: 'backdrop-blur-md ring-1 ring-white/5 shadow-2xl',
  modal: 'backdrop-blur-md ring-1 ring-white/5 shadow-2xl',
} as const;

/**
 * Standardized Glassmorphism Classes for Menus, Cards & Modals
 */
export const GLASS_SURFACE = {
  // Popovers, Dropdowns, Floating Menus
  popover: 'backdrop-blur-xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
  // Modals & Dialogs
  modal: 'backdrop-blur-2xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl ring-1 ring-black/10 dark:ring-white/15',
  // Navigation & Headers
  header: 'backdrop-blur-md bg-[var(--surface-page)]/80 border-b border-[var(--border-default)]',
  // Inactive / subtle backdrop
  backdrop: 'backdrop-blur-sm bg-black/60',
} as const;
