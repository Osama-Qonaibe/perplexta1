export const SURFACES = {
  canvas: { dark: '#0d1117', light: '#ffffff' },
  panel: { dark: '#161b22', light: '#ffffff' },
  surface: { dark: '#161b22', light: '#ffffff' },
  surfaceElevated: { dark: '#21262d', light: '#f6f8fa' },
  codeBg: { dark: '#010409', light: '#161b22' },
} as const;

export const BRAND_ACCENTS = {
  primary: '#1a7f37',
  primaryHover: '#2ea043',
  link: '#0969da',
  ai: '#8250df',
  success: '#1a7f37',
  destructive: '#cf222e',
  warning: '#bc4c00',
} as const;

export const BORDER_TOKENS = {
  dark: 'border-[#3d444d]',
  light: 'border-[#d0d7de]',
} as const;

export const PERPLEXTA_PALETTE = {
  brand: {
    green: { light: '#1a7f37', dark: '#238636' },
    blue: { light: '#0969da', dark: '#58a6ff' },
    purple: { light: '#8250df', dark: '#a371f7' },
    orange: { light: '#bc4c00', dark: '#db6d28' },
    pink: { light: '#bf3989', dark: '#db61a2' },
  },

  neutral: {
    canvasLight: '#ffffff',
    subtleLight: '#f6f8fa',
    borderLight: '#d0d7de',
    textPrimaryLight: '#1f2328',
    textSecondaryLight: '#656d76',
    
    canvasDark: '#0d1117',
    subtleDark: '#161b22',
    borderDark: '#3d444d',
    textPrimaryDark: '#e6edf3',
    textSecondaryDark: '#8b949e',
    insetDark: '#010409',
  },

  slate: {
    0: '#ffffff',
    50: '#f6f8fa',
    100: '#f6f8fa',
    150: '#eaeef2',
    200: '#d0d7de',
    300: '#afb8c1',
    400: '#8b949e',
    500: '#656d76',
    600: '#484f58',
    700: '#32383f',
    800: '#3d444d',
    850: '#1f2328',
    900: '#161b22',
    920: '#161b22',
    950: '#0d1117',
    990: '#010409',
  },

  cyan: {
    50: '#ddf4ff',
    100: '#b6e3ff',
    200: '#80ccff',
    300: '#54aeff',
    400: '#58a6ff',
    500: '#0969da',
    600: '#0550ae',
    700: '#033d8b',
    800: '#0a3069',
    900: '#002155',
    glow: 'rgba(9, 105, 218, 0.25)',
    subtle: 'rgba(9, 105, 218, 0.10)',
    surface: 'rgba(9, 105, 218, 0.15)',
  },

  status: {
    success: {
      light: '#1a7f37',
      default: '#1a7f37',
      dark: '#238636',
      surface: 'rgba(26, 127, 55, 0.12)',
    },
    danger: {
      light: '#cf222e',
      default: '#cf222e',
      dark: '#f85149',
      surface: 'rgba(207, 34, 46, 0.12)',
    },
    warning: {
      light: '#bc4c00',
      default: '#bc4c00',
      dark: '#db6d28',
      surface: 'rgba(188, 76, 0, 0.12)',
    },
    info: {
      light: '#0969da',
      default: '#0969da',
      dark: '#58a6ff',
      surface: 'rgba(9, 105, 218, 0.12)',
    },
    ai: {
      light: '#8250df',
      default: '#8250df',
      dark: '#a371f7',
      surface: 'rgba(130, 80, 223, 0.12)',
    },
  },
} as const;

export const SEMANTIC_CSS_VARS = {
  surface: {
    page: 'var(--surface-page)',
    card: 'var(--surface-card)',
    subtle: 'var(--surface-subtle)',
    inset: 'var(--surface-inset)',
    sidebar: 'var(--surface-sidebar, var(--surface-page))',
    container: 'var(--surface-card)',
  },
  text: {
    primary: 'var(--fg-primary, var(--text-primary))',
    secondary: 'var(--fg-secondary, var(--text-secondary))',
    muted: 'var(--fg-muted, var(--text-muted))',
    accent: 'var(--fg-accent, var(--accent))',
    onEmphasis: 'var(--fg-on-emphasis, #ffffff)',
  },
  border: {
    default: 'var(--border-default)',
    subtle: 'var(--border-subtle, rgba(208,215,222,0.8))',
    accent: 'var(--border-accent, #0969da)',
  },
  action: {
    hoverBg: 'hover:bg-[var(--surface-subtle)]',
    hoverText: 'hover:text-[var(--accent)]',
    selectedBg: 'bg-[var(--surface-subtle)] text-[var(--accent)] font-bold',
  },
} as const;

export const colors = {
  surfaces: SURFACES,
  brand: BRAND_ACCENTS,
  borders: BORDER_TOKENS,
  palette: PERPLEXTA_PALETTE,
} as const;

export type ColorPalette = typeof PERPLEXTA_PALETTE;
