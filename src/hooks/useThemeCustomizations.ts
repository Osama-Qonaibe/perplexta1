import { useEffect, useState, useCallback, useRef } from 'react';
import {
  resolveThemeMode,
  getStoredThemeMode,
  ThemeMode,
  ResolvedThemeMode,
  ThemeTokens,
  ThemeSync,
  getCachedBootstrapPayload,
  persistBootstrapPayload,
  mergeTokens
} from '../utils/ThemeSync';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from '../components/admin/theme/tokens/defaultTokens';

export interface ThemeCustomizationsResponse {
  success: boolean;
  customizations: {
    light?: ThemeTokens;
    dark?: ThemeTokens;
  };
  updated_at?: string | null;
}

export interface ThemeDiagnosticReport {
  timestamp: string;
  source: 'api_fetch' | 'cache_bootstrap' | 'storage_event' | 'mode_override';
  endpoint?: string;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  isFullyApplied: boolean;
  hasConflict: boolean;
  totalProperties: number;
  verifiedCount: number;
  conflicts: Array<{ key: string; expected: string; actual: string }>;
  updatedFromInitial: Array<{ key: string; initial: string; runtime: string }>;
  verifiedSample: Record<string, string>;
  domState: {
    datasetTheme: string | undefined;
    classList: string[];
    colorScheme: string;
    bootingClassActive: boolean;
  };
  initialScriptHarmony: {
    bootstrapPayloadFound: boolean;
    initialMode: string | null;
    scriptInjectedCount: number;
    conflictWithScript: boolean;
    status: 'HARMONIZED' | 'INITIAL_BOOTSTRAP_OVERRIDDEN' | 'CONFLICT_DETECTED';
  };
}

declare global {
  interface Window {
    __PERPLEXTA_THEME_DIAGNOSTIC__?: ThemeDiagnosticReport;
  }
}

export interface UseThemeCustomizationsReturn {
  customizations: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
  lightTokens: ThemeTokens;
  darkTokens: ThemeTokens;
  activeTokens: ThemeTokens;
  resolvedMode: ResolvedThemeMode;
  isLoading: boolean;
  error: Error | null;
  diagnostic: ThemeDiagnosticReport | null;
  refetch: () => Promise<void>;
  applyTokensToRoot: (tokens: ThemeTokens) => void;
}

function captureRootStyleSnapshot(): {
  datasetTheme?: string;
  classList: string[];
  colorScheme: string;
  properties: Record<string, string>;
} {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { classList: [], colorScheme: '', properties: {} };
  }
  const root = document.documentElement;
  const properties: Record<string, string> = {};

  for (let i = 0; i < root.style.length; i++) {
    const propName = root.style[i];
    if (propName && propName.startsWith('--')) {
      properties[propName] = root.style.getPropertyValue(propName).trim();
    }
  }

  return {
    datasetTheme: root.dataset.theme,
    classList: Array.from(root.classList),
    colorScheme: root.style.colorScheme,
    properties
  };
}

function verifyAndLogThemeDiagnostics(params: {
  source: 'api_fetch' | 'cache_bootstrap' | 'storage_event' | 'mode_override';
  endpoint?: string;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  appliedTokens: ThemeTokens;
  initialSnapshot?: {
    datasetTheme?: string;
    classList: string[];
    colorScheme: string;
    properties: Record<string, string>;
  };
}): ThemeDiagnosticReport {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      timestamp: new Date().toISOString(),
      source: params.source,
      endpoint: params.endpoint,
      mode: params.mode,
      resolvedMode: params.resolvedMode,
      isFullyApplied: false,
      hasConflict: false,
      totalProperties: 0,
      verifiedCount: 0,
      conflicts: [],
      updatedFromInitial: [],
      verifiedSample: {},
      domState: { datasetTheme: undefined, classList: [], colorScheme: '', bootingClassActive: false },
      initialScriptHarmony: {
        bootstrapPayloadFound: false,
        initialMode: null,
        scriptInjectedCount: 0,
        conflictWithScript: false,
        status: 'HARMONIZED'
      }
    };
  }

  const root = document.documentElement;
  const appliedEntries = Object.entries(params.appliedTokens);
  const conflicts: Array<{ key: string; expected: string; actual: string }> = [];
  const updatedFromInitial: Array<{ key: string; initial: string; runtime: string }> = [];
  const verifiedSample: Record<string, string> = {};
  let verifiedCount = 0;

  appliedEntries.forEach(([key, expectedValue], idx) => {
    const actualValue = root.style.getPropertyValue(key).trim();
    const expectedTrimmed = expectedValue.trim();

    if (actualValue === expectedTrimmed) {
      verifiedCount++;
      if (
        idx < 5 ||
        key.includes('accent') ||
        key.includes('surface-page') ||
        key.includes('surface-card') ||
        key.includes('fg-primary') ||
        key.includes('border-default')
      ) {
        verifiedSample[key] = actualValue;
      }
    } else {
      conflicts.push({
        key,
        expected: expectedTrimmed,
        actual: actualValue
      });
    }

    if (params.initialSnapshot?.properties[key]) {
      const initVal = params.initialSnapshot.properties[key].trim();
      if (initVal !== expectedTrimmed && actualValue === expectedTrimmed) {
        updatedFromInitial.push({
          key,
          initial: initVal,
          runtime: actualValue
        });
      }
    }
  });

  const datasetTheme = root.dataset.theme;
  const classList = Array.from(root.classList);
  const colorScheme = root.style.colorScheme;
  const bootingClassActive = root.classList.contains('theme-booting');

  const domModeMatches =
    datasetTheme === params.resolvedMode &&
    (params.resolvedMode === 'dark' ? classList.includes('dark') : classList.includes('light'));

  const hasConflict = conflicts.length > 0 || !domModeMatches;
  const isFullyApplied = !hasConflict && verifiedCount === appliedEntries.length;

  const cachedPayload = getCachedBootstrapPayload();
  const initialScriptTokens = cachedPayload?.tokens?.[params.resolvedMode] || {};
  const scriptInjectedCount = Object.keys(initialScriptTokens).length;

  const report: ThemeDiagnosticReport = {
    timestamp: new Date().toISOString(),
    source: params.source,
    endpoint: params.endpoint,
    mode: params.mode,
    resolvedMode: params.resolvedMode,
    isFullyApplied,
    hasConflict,
    totalProperties: appliedEntries.length,
    verifiedCount,
    conflicts,
    updatedFromInitial,
    verifiedSample,
    domState: {
      datasetTheme,
      classList,
      colorScheme,
      bootingClassActive
    },
    initialScriptHarmony: {
      bootstrapPayloadFound: !!cachedPayload,
      initialMode: cachedPayload?.mode || null,
      scriptInjectedCount,
      conflictWithScript: conflicts.length > 0,
      status: conflicts.length > 0
        ? 'CONFLICT_DETECTED'
        : updatedFromInitial.length > 0
          ? 'INITIAL_BOOTSTRAP_OVERRIDDEN'
          : 'HARMONIZED'
    }
  };

  window.__PERPLEXTA_THEME_DIAGNOSTIC__ = report;

  const badgeStyle = hasConflict
    ? 'background: #dc2626; color: #ffffff; font-weight: 800; padding: 2px 8px; border-radius: 4px;'
    : 'background: #059669; color: #ffffff; font-weight: 800; padding: 2px 8px; border-radius: 4px;' ;

  const groupLabel = `%c[Theme Diagnostic: useThemeCustomizations]%c ${
    hasConflict ? '⚠️ CONFLICT DETECTED' : '✅ VERIFIED HARMONY'
  } (${params.resolvedMode.toUpperCase()} Mode • ${verifiedCount}/${appliedEntries.length} CSS Variables)`;

  if (hasConflict) {
    console.group(groupLabel, badgeStyle, 'color: inherit; font-weight: bold;');
    console.warn(`[Theme Diagnostic] Property mismatch detected between server theme and document.documentElement.style:`, conflicts);
    console.table(conflicts);
  } else {
    console.groupCollapsed(groupLabel, badgeStyle, 'color: inherit; font-weight: bold;');
    console.info(`[Theme Diagnostic] Endpoint: ${params.endpoint || '/api/theme-customizations'} (${params.source})`);
    console.info(`[Theme Diagnostic] Target Mode: requested="${params.mode}", resolved="${params.resolvedMode}"`);
    console.info(`[Theme Diagnostic] DOM State: data-theme="${datasetTheme}", classList=[${classList.join(', ')}], colorScheme="${colorScheme}"`);
    console.info(`[Theme Diagnostic] CSS Variables Applied: ${verifiedCount} of ${appliedEntries.length} verified on document.documentElement.style`);
    console.info(`[Theme Diagnostic] Initial Script Harmony: ${report.initialScriptHarmony.status} (Initial properties: ${scriptInjectedCount}, Dynamic updates: ${updatedFromInitial.length}, Conflicts: ${conflicts.length})`);
    if (updatedFromInitial.length > 0) {
      console.info(`[Theme Diagnostic] Runtime updates successfully updated initial bootstrap tokens for ${updatedFromInitial.length} properties:`, updatedFromInitial);
    }
    console.info(`[Theme Diagnostic] Sample Verified Properties:`);
    console.table(verifiedSample);
  }
  console.groupEnd();

  return report;
}

export function useThemeCustomizations(activeModeOverride?: ThemeMode): UseThemeCustomizationsReturn {
  const [cachedPayload] = useState(() => getCachedBootstrapPayload());

  const [customizations, setCustomizations] = useState<{
    light: ThemeTokens;
    dark: ThemeTokens;
  }>(() => ({
    light: cachedPayload?.tokens?.light || { ...DEFAULT_LIGHT_TOKENS },
    dark: cachedPayload?.tokens?.dark || { ...DEFAULT_DARK_TOKENS }
  }));

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [diagnostic, setDiagnostic] = useState<ThemeDiagnosticReport | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const currentMode = activeModeOverride || getStoredThemeMode();
  const resolvedMode = resolveThemeMode(currentMode);
  const activeTokens = resolvedMode === 'dark' ? customizations.dark : customizations.light;

  const applyTokensToRoot = useCallback((tokens: ThemeTokens) => {
    ThemeSync.applyRoot(resolvedMode, tokens);
  }, [resolvedMode]);

  const fetchAndApplyCustomizations = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsLoading(true);
    setError(null);

    const initialSnapshot = captureRootStyleSnapshot();
    let targetEndpoint = '/api/theme-customizations';

    try {
      let res = await fetch(targetEndpoint, {
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        targetEndpoint = '/api/admin/theme-customizations';
        res = await fetch(targetEndpoint, {
          headers: { Accept: 'application/json' }
        });
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch theme customizations: ${res.status}`);
      }

      const data: ThemeCustomizationsResponse = await res.json();

      if (data && data.success && data.customizations) {
        const mergedLight = mergeTokens(DEFAULT_LIGHT_TOKENS, data.customizations.light);
        const mergedDark = mergeTokens(DEFAULT_DARK_TOKENS, data.customizations.dark);

        if (isMountedRef.current) {
          setCustomizations({
            light: mergedLight,
            dark: mergedDark
          });
        }

        const effectiveMode = activeModeOverride || getStoredThemeMode();
        const effectiveResolved = resolveThemeMode(effectiveMode);
        const effectiveActive = effectiveResolved === 'dark' ? mergedDark : mergedLight;

        ThemeSync.applyRoot(effectiveResolved, effectiveActive);

        persistBootstrapPayload({
          version: 4,
          mode: effectiveMode,
          resolvedMode: effectiveResolved,
          tokens: {
            light: mergedLight,
            dark: mergedDark
          },
          updatedAt: Date.now()
        });

        const diagReport = verifyAndLogThemeDiagnostics({
          source: 'api_fetch',
          endpoint: targetEndpoint,
          mode: effectiveMode,
          resolvedMode: effectiveResolved,
          appliedTokens: effectiveActive,
          initialSnapshot
        });

        if (isMountedRef.current) {
          setDiagnostic(diagReport);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeModeOverride]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAndApplyCustomizations();

    const handleThemeUpdated = () => {
      const current = getCachedBootstrapPayload();
      if (current?.tokens) {
        setCustomizations({
          light: current.tokens.light,
          dark: current.tokens.dark
        });
      }
    };

    window.addEventListener('perplexta_theme_updated', handleThemeUpdated);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('perplexta_theme_updated', handleThemeUpdated);
    };
  }, [fetchAndApplyCustomizations]);

  useEffect(() => {
    if (!activeModeOverride) return;
    const mode = resolveThemeMode(activeModeOverride);
    const tokens = mode === 'dark' ? customizations.dark : customizations.light;
    ThemeSync.applyRoot(mode, tokens);

    const diagReport = verifyAndLogThemeDiagnostics({
      source: 'mode_override',
      mode: activeModeOverride,
      resolvedMode: mode,
      appliedTokens: tokens
    });

    if (isMountedRef.current) {
      setDiagnostic(diagReport);
    }
  }, [activeModeOverride, customizations]);

  return {
    customizations,
    lightTokens: customizations.light,
    darkTokens: customizations.dark,
    activeTokens,
    resolvedMode,
    isLoading,
    error,
    diagnostic,
    refetch: fetchAndApplyCustomizations,
    applyTokensToRoot
  };
}

export default useThemeCustomizations;
