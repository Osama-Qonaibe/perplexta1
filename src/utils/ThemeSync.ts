import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from '../components/admin/theme/tokens/defaultTokens';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedThemeMode = 'dark' | 'light';
export type ThemeTokens = Record<string, string>;

export const THEME_STORAGE_KEY = 'perplexta_theme';
export const THEME_BOOTSTRAP_STORAGE_KEY = 'perplexta.theme.bootstrap.v5';
export const THEME_MODE_STORAGE_KEY = 'perplexta.theme.mode.v1';

export type ThemeBootstrapPayload = {
  version: 4 | 5;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  tokens: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
  updatedAt: number;
};

export const resolveThemeMode = (mode?: ThemeMode | null): ResolvedThemeMode => {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem(THEME_MODE_STORAGE_KEY) ||
      localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored as ThemeMode;
    }
  } catch {}
  return 'light';
};

export const mergeTokens = (base: ThemeTokens, overrides?: ThemeTokens | null): ThemeTokens => {
  const merged: ThemeTokens = { ...base };
  if (overrides && typeof overrides === 'object') {
    for (const [key, value] of Object.entries(overrides)) {
      if (
        typeof key === 'string' &&
        key.startsWith('--') &&
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= 250
      ) {
        merged[key] = value;
      }
    }
  }
  return merged;
};

export const getCachedBootstrapPayload = (): ThemeBootstrapPayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.removeItem('perplexta.theme.bootstrap.v1');
    localStorage.removeItem('perplexta.theme.bootstrap.v2');
    localStorage.removeItem('perplexta.theme.bootstrap.v3');
    const raw = localStorage.getItem(THEME_BOOTSTRAP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const mode: ThemeMode = parsed.mode === 'dark' || parsed.mode === 'light' || parsed.mode === 'system' ? parsed.mode : 'light';
        const lightTokens = mergeTokens(DEFAULT_LIGHT_TOKENS, parsed.tokens?.light);
        const darkTokens = mergeTokens(DEFAULT_DARK_TOKENS, parsed.tokens?.dark);
        return {
          version: 5,
          mode,
          resolvedMode: resolveThemeMode(mode),
          tokens: {
            light: lightTokens,
            dark: darkTokens
          },
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
        };
      }
    }
    const simpleMode = getStoredThemeMode();
    return {
      version: 5,
      mode: simpleMode,
      resolvedMode: resolveThemeMode(simpleMode),
      tokens: {
        light: { ...DEFAULT_LIGHT_TOKENS },
        dark: { ...DEFAULT_DARK_TOKENS }
      },
      updatedAt: Date.now()
    };
  } catch {}
  return null;
};

export const persistBootstrapPayload = (payload: ThemeBootstrapPayload): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, payload.mode);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, payload.mode);
    localStorage.setItem(THEME_BOOTSTRAP_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
};

let transitionTimeout: any = null;

export const applyThemeRoot = (
  resolvedMode: ResolvedThemeMode,
  tokens?: ThemeTokens | null
): void => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = resolvedMode === 'dark';

  root.classList.add('theme-transitioning');
  if (transitionTimeout) clearTimeout(transitionTimeout);
  transitionTimeout = setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 160);

  root.dataset.theme = resolvedMode;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  root.style.colorScheme = resolvedMode;

  const meta =
    document.getElementById('theme-color-meta') ||
    document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0d1117' : '#ffffff');
  }

  const effectiveTokens = tokens
    ? mergeTokens(isDark ? DEFAULT_DARK_TOKENS : DEFAULT_LIGHT_TOKENS, tokens)
    : (isDark ? DEFAULT_DARK_TOKENS : DEFAULT_LIGHT_TOKENS);

  for (const [key, value] of Object.entries(effectiveTokens)) {
    if (
      typeof key === 'string' &&
      key.startsWith('--') &&
      typeof value === 'string' &&
      value.length <= 250
    ) {
      root.style.setProperty(key, value);
    }
  }

  if (root.classList.contains('theme-booting')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-booting');
      });
    });
  }
};

export const applyThemeWithRAF = (
  theme: ThemeMode,
  customTokens?: { light?: ThemeTokens; dark?: ThemeTokens } | null
): void => {
  if (typeof window === 'undefined') return;

  const resolved = resolveThemeMode(theme);
  const cached = getCachedBootstrapPayload();

  const lightTokens = mergeTokens(
    DEFAULT_LIGHT_TOKENS,
    customTokens?.light || cached?.tokens?.light
  );
  const darkTokens = mergeTokens(
    DEFAULT_DARK_TOKENS,
    customTokens?.dark || cached?.tokens?.dark
  );

  const activeTokens = resolved === 'dark' ? darkTokens : lightTokens;
  applyThemeRoot(resolved, activeTokens);

  persistBootstrapPayload({
    version: 5,
    mode: theme,
    resolvedMode: resolved,
    tokens: {
      light: lightTokens,
      dark: darkTokens
    },
    updatedAt: Date.now()
  });
};

export const syncWithServer = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/theme-customizations');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.customizations) {
      const savedMode = getStoredThemeMode();
      const resolved = resolveThemeMode(savedMode);
      const lightTokens = mergeTokens(DEFAULT_LIGHT_TOKENS, data.customizations.light);
      const darkTokens = mergeTokens(DEFAULT_DARK_TOKENS, data.customizations.dark);
      const activeTokens = resolved === 'dark' ? darkTokens : lightTokens;

      applyThemeRoot(resolved, activeTokens);

      persistBootstrapPayload({
        version: 5,
        mode: savedMode,
        resolvedMode: resolved,
        tokens: {
          light: lightTokens,
          dark: darkTokens
        },
        updatedAt: Date.now()
      });
    }
  } catch {}
};

if (typeof window !== 'undefined') {
  window.addEventListener('perplexta_theme_updated', () => {
    const savedMode = getStoredThemeMode();
    applyThemeWithRAF(savedMode);
  });
}

export const ThemeSync = {
  apply: applyThemeWithRAF,
  resolve: resolveThemeMode,
  applyRoot: applyThemeRoot,
  syncWithServer,
  persistPayload: persistBootstrapPayload,
  getCachedPayload: getCachedBootstrapPayload,
  mergeTokens,
  getStoredMode: getStoredThemeMode
};

export default ThemeSync;
