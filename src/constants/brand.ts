import { PERPLEXTA_PALETTE } from '../design-system/tokens/colors';

export const PRIMITIVE_TOKENS = {
  gray: PERPLEXTA_PALETTE.slate,
  brand: PERPLEXTA_PALETTE.brand,
  accent: {
    green: {
      light: '#1a7f37',
      default: '#1a7f37',
      dark: '#238636',
      hover: '#2ea043',
    },
    blue: {
      light: '#0969da',
      default: '#0969da',
      dark: '#58a6ff',
      hover: '#0550ae',
    },
    purple: {
      light: '#8250df',
      default: '#8250df',
      dark: '#a371f7',
    },
    orange: {
      light: '#bc4c00',
      default: '#bc4c00',
      dark: '#db6d28',
    },
    pink: {
      light: '#bf3989',
      default: '#bf3989',
      dark: '#db61a2',
    },
  },
  status: {
    success: {
      light: PERPLEXTA_PALETTE.status.success.light,
      default: PERPLEXTA_PALETTE.status.success.default,
      muted: PERPLEXTA_PALETTE.status.success.surface,
    },
    danger: {
      light: PERPLEXTA_PALETTE.status.danger.light,
      default: PERPLEXTA_PALETTE.status.danger.default,
      muted: PERPLEXTA_PALETTE.status.danger.surface,
    },
    warning: {
      light: PERPLEXTA_PALETTE.status.warning.light,
      default: PERPLEXTA_PALETTE.status.warning.default,
      muted: PERPLEXTA_PALETTE.status.warning.surface,
    },
    info: {
      light: PERPLEXTA_PALETTE.status.info.light,
      default: PERPLEXTA_PALETTE.status.info.default,
      muted: PERPLEXTA_PALETTE.status.info.surface,
    },
  },
} as const;

export type PrimitiveTokenType = typeof PRIMITIVE_TOKENS;

export const LIGHT_MODE = {
  surface: {
    page: '#ffffff',
    card: '#ffffff',
    subtle: '#f6f8fa',
    inset: '#f6f8fa',
    sidebar: '#ffffff',
    code: '#161b22',
  },
  fg: {
    default: '#1f2328',
    muted: '#656d76',
    disabled: '#afb8c1',
    onEmphasis: '#ffffff',
    accent: '#0969da',
  },
  bg: {
    accent: '#1a7f37',
    accentMuted: 'rgba(9, 105, 218, 0.12)',
  },
  border: {
    default: '#d0d7de',
    accent: '#0969da',
    subtle: 'rgba(208, 215, 222, 0.8)',
  },
} as const;

export const DARK_MODE = {
  surface: {
    page: '#0d1117',
    card: '#161b22',
    subtle: '#161b22',
    inset: '#010409',
    sidebar: '#0d1117',
    code: '#010409',
  },
  fg: {
    default: '#e6edf3',
    muted: '#8b949e',
    disabled: '#484f58',
    onEmphasis: '#ffffff',
    accent: '#58a6ff',
  },
  bg: {
    accent: '#238636',
    accentMuted: 'rgba(88, 166, 255, 0.15)',
  },
  border: {
    default: '#3d444d',
    accent: '#58a6ff',
    subtle: 'rgba(61, 68, 77, 0.6)',
  },
} as const;
