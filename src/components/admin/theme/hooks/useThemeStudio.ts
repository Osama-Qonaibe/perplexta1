import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeTokensMap, TokenCategory, ThemePreset } from '../types';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from '../tokens/defaultTokens';
import { TOKEN_REGISTRY } from '../tokens/registry';
import { ThemeSync, resolveThemeMode, THEME_BOOTSTRAP_STORAGE_KEY } from '@/utils/ThemeSync';

export function useThemeStudio(
  arg1: string | null | { token: string | null; language?: string; showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void },
  arg2?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void,
  arg3?: string
) {
  let token: string | null = null;
  let showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void = () => {};
  let language = 'ar';

  if (typeof arg1 === 'object' && arg1 !== null) {
    token = arg1.token;
    language = arg1.language || 'ar';
    showToast = arg1.showToast || (() => {});
  } else {
    token = arg1 as string | null;
    showToast = arg2 || (() => {});
    language = arg3 || 'ar';
  }

  const isAr = language === 'ar';
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('dark');
  const [lightTokens, setLightTokens] = useState<ThemeTokensMap>(DEFAULT_LIGHT_TOKENS);
  const [darkTokens, setDarkTokens] = useState<ThemeTokensMap>(DEFAULT_DARK_TOKENS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'saving' | 'synced' | 'error'>('connected');
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('perplexta_theme_autosave') === 'true';
    }
    return false;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory | 'all'>('all');
  const [activePresetId, setActivePresetId] = useState<string>('perplexta_canonical_developer');

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ThemeSync.apply(activeMode);
    }
  }, [activeMode]);

  const applyTokensToDOM = useCallback((mode: 'light' | 'dark', tokens: ThemeTokensMap) => {
    if (typeof window === 'undefined' || !tokens) return;
    ThemeSync.applyRoot(mode, tokens);
  }, []);

  const fetchCustomizations = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/admin/theme-customizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbStatus('connected');
        if (data.updated_at) {
          setLastSavedAt(data.updated_at);
        }
        if (data.customizations) {
          let updatedLight = DEFAULT_LIGHT_TOKENS;
          let updatedDark = DEFAULT_DARK_TOKENS;
          if (data.customizations.light && Object.keys(data.customizations.light).length > 0) {
            updatedLight = { ...DEFAULT_LIGHT_TOKENS, ...data.customizations.light };
            setLightTokens(updatedLight);
          }
          if (data.customizations.dark && Object.keys(data.customizations.dark).length > 0) {
            updatedDark = { ...DEFAULT_DARK_TOKENS, ...data.customizations.dark };
            setDarkTokens(updatedDark);
          }
          const activeTokens = activeMode === 'light' ? updatedLight : updatedDark;
          applyTokensToDOM(activeMode, activeTokens);
        }
      } else {
        setDbStatus('error');
      }
    } catch (err) {
      setDbStatus('error');
    } finally {
      setLoading(false);
    }
  }, [token, activeMode, applyTokensToDOM]);

  useEffect(() => {
    fetchCustomizations();
  }, [fetchCustomizations]);

  const triggerDebouncedAutoSave = useCallback((mode: 'light' | 'dark', updatedTokens: ThemeTokensMap) => {
    if (!autoSave || !token) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setDbStatus('saving');
        const res = await fetch('/api/admin/theme-customizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme_mode: mode, tokens: updatedTokens }),
        });
        if (res.ok) {
          const data = await res.json();
          setDbStatus('synced');
          setLastSavedAt(data.updated_at || new Date().toISOString());
          ThemeSync.persistPayload({
            version: 4,
            mode: activeMode,
            resolvedMode: resolveThemeMode(activeMode),
            tokens: {
              light: mode === 'light' ? updatedTokens : lightTokens,
              dark: mode === 'dark' ? updatedTokens : darkTokens,
            },
            updatedAt: Date.now(),
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('perplexta_theme_updated'));
          }
        }
      } catch (e) {
        setDbStatus('error');
      }
    }, 600);
  }, [autoSave, token, activeMode, lightTokens, darkTokens]);

  const toggleAutoSave = (val: boolean) => {
    setAutoSave(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('perplexta_theme_autosave', val ? 'true' : 'false');
    }
    showToast(
      isAr
        ? val ? 'تم تفعيل الحفظ التلقائي في قاعدة البيانات' : 'تم تعطيل الحفظ التلقائي'
        : val ? 'Live Auto-Save to Database enabled' : 'Auto-Save disabled',
      'info'
    );
  };

  const handleTokenChange = (mode: 'light' | 'dark', key: string, value: string) => {
    if (mode === 'light') {
      setLightTokens((prev) => {
        const next = { ...prev, [key]: value };
        applyTokensToDOM('light', next);
        triggerDebouncedAutoSave('light', next);
        return next;
      });
    } else {
      setDarkTokens((prev) => {
        const next = { ...prev, [key]: value };
        applyTokensToDOM('dark', next);
        triggerDebouncedAutoSave('dark', next);
        return next;
      });
    }
  };

  const handleResetToken = (key: string) => {
    const defaultVal = activeMode === 'light' ? DEFAULT_LIGHT_TOKENS[key] : DEFAULT_DARK_TOKENS[key];
    if (defaultVal) {
      handleTokenChange(activeMode, key, defaultVal);
    }
  };

  const handleSelectPreset = async (preset: ThemePreset) => {
    setActivePresetId(preset.id);
    const newLight = { ...preset.tokens.light };
    const newDark = { ...preset.tokens.dark };
    setLightTokens(newLight);
    setDarkTokens(newDark);
    applyTokensToDOM(activeMode, activeMode === 'light' ? newLight : newDark);

    ThemeSync.persistPayload({
      version: 4,
      mode: activeMode,
      resolvedMode: resolveThemeMode(activeMode),
      tokens: {
        light: newLight,
        dark: newDark,
      },
      updatedAt: Date.now(),
    });

    if (token) {
      try {
        setSaving(true);
        setDbStatus('saving');
        const [resLight, resDark] = await Promise.all([
          fetch('/api/admin/theme-customizations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ theme_mode: 'light', tokens: newLight }),
          }),
          fetch('/api/admin/theme-customizations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ theme_mode: 'dark', tokens: newDark }),
          })
        ]);
        if (resLight.ok && resDark.ok) {
          const data = await resDark.json();
          setLastSavedAt(data.updated_at || new Date().toISOString());
          setDbStatus('synced');
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('perplexta_theme_updated'));
        }
      } catch (err) {
        setDbStatus('error');
      } finally {
        setSaving(false);
      }
    }

    showToast(
      isAr
        ? `تم تطبيق واعتماد قالب: ${preset.nameAr} في قاعدة البيانات بنجاح!`
        : `Applied & committed preset: ${preset.nameEn} to database!`,
      'success'
    );
  };

  const handleImportTokens = (mode: 'light' | 'dark', imported: ThemeTokensMap) => {
    if (mode === 'light') {
      setLightTokens((prev) => {
        const next = { ...prev, ...imported };
        applyTokensToDOM('light', next);
        triggerDebouncedAutoSave('light', next);
        return next;
      });
    } else {
      setDarkTokens((prev) => {
        const next = { ...prev, ...imported };
        applyTokensToDOM('dark', next);
        triggerDebouncedAutoSave('dark', next);
        return next;
      });
    }
  };

  const handleSave = async (modeToSave?: 'light' | 'dark') => {
    if (!token) return;
    try {
      setSaving(true);
      setDbStatus('saving');
      const modes = modeToSave ? [modeToSave] : (['light', 'dark'] as const);
      let latestUpdated: string | null = null;

      for (const mode of modes) {
        const tokensToSave = mode === 'light' ? lightTokens : darkTokens;
        const res = await fetch('/api/admin/theme-customizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme_mode: mode, tokens: tokensToSave }),
        });
        if (!res.ok) throw new Error(`Failed to save ${mode} theme`);
        const data = await res.json();
        if (data.updated_at) latestUpdated = data.updated_at;
      }

      setLastSavedAt(latestUpdated || new Date().toISOString());
      setDbStatus('synced');

      ThemeSync.persistPayload({
        version: 4,
        mode: activeMode,
        resolvedMode: resolveThemeMode(activeMode),
        tokens: {
          light: lightTokens,
          dark: darkTokens,
        },
        updatedAt: Date.now(),
      });

      showToast(
        isAr
          ? 'تم حفظ وتعميم خيارات الهوية البصرية في قاعدة البيانات بنجاح!'
          : 'All theme settings permanently saved to database and deployed globally!',
        'success'
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('perplexta_theme_updated'));
      }
    } catch (err: any) {
      setDbStatus('error');
      showToast(err.message || (isAr ? 'فشل حفظ تخصيصات المظهر' : 'Failed to save theme'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (mode: 'light' | 'dark') => {
    if (mode === 'light') {
      setLightTokens(DEFAULT_LIGHT_TOKENS);
      applyTokensToDOM('light', DEFAULT_LIGHT_TOKENS);
    } else {
      setDarkTokens(DEFAULT_DARK_TOKENS);
      applyTokensToDOM('dark', DEFAULT_DARK_TOKENS);
    }

    ThemeSync.persistPayload({
      version: 4,
      mode: activeMode,
      resolvedMode: resolveThemeMode(activeMode),
      tokens: {
        light: mode === 'light' ? DEFAULT_LIGHT_TOKENS : lightTokens,
        dark: mode === 'dark' ? DEFAULT_DARK_TOKENS : darkTokens,
      },
      updatedAt: Date.now(),
    });

    showToast(
      isAr
        ? `تمت استعادة القيم الافتراضية للوضع ${mode === 'light' ? 'الفاتح' : 'الداكن'}`
        : `Reset ${mode} theme to system defaults`,
      'success'
    );
  };

  const handlePurgeDatabaseOverrides = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setDbStatus('saving');
      const res = await fetch('/api/admin/theme-customizations', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to purge database theme overrides');

      setLightTokens(DEFAULT_LIGHT_TOKENS);
      setDarkTokens(DEFAULT_DARK_TOKENS);
      applyTokensToDOM('light', DEFAULT_LIGHT_TOKENS);
      applyTokensToDOM('dark', DEFAULT_DARK_TOKENS);
      setLastSavedAt(null);
      setDbStatus('connected');

      if (typeof window !== 'undefined') {
        localStorage.removeItem(THEME_BOOTSTRAP_STORAGE_KEY);
        window.dispatchEvent(new Event('perplexta_theme_updated'));
      }

      showToast(
        isAr
          ? 'تم تطهير وحذف جميع التخصيصات المحفوظة مسبقاً في قاعدة البيانات بنجاح!'
          : 'All pre-saved theme customizations successfully purged from database!',
        'success'
      );
    } catch (err: any) {
      setDbStatus('error');
      showToast(err.message || (isAr ? 'فشل تطهير قاعدة البيانات' : 'Failed to purge database overrides'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentTokens = activeMode === 'light' ? lightTokens : darkTokens;
  const currentDefaultTokens = activeMode === 'light' ? DEFAULT_LIGHT_TOKENS : DEFAULT_DARK_TOKENS;

  const modifiedCount = Object.keys(currentTokens).filter(
    (key) => currentTokens[key] && currentTokens[key] !== currentDefaultTokens[key]
  ).length;

  const filteredDefinitions = TOKEN_REGISTRY.filter((def) => {
    if (selectedCategory !== 'all' && def.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = def.key.toLowerCase().includes(q);
      const matchEn = def.labelEn.toLowerCase().includes(q);
      const matchAr = def.labelAr.toLowerCase().includes(q);
      const matchDesc = def.descriptionEn.toLowerCase().includes(q) || def.descriptionAr.toLowerCase().includes(q);
      return matchKey || matchEn || matchAr || matchDesc;
    }
    return true;
  });

  return {
    activeMode,
    setActiveMode,
    lightTokens,
    darkTokens,
    currentTokens,
    currentDefaultTokens,
    loading,
    saving,
    lastSavedAt,
    dbStatus,
    autoSave,
    toggleAutoSave,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activePresetId,
    filteredDefinitions,
    modifiedCount,
    totalTokensCount: TOKEN_REGISTRY.length,
    handleTokenChange,
    handleResetToken,
    handleSelectPreset,
    handleImportTokens,
    handleSave,
    handleReset,
    handlePurgeDatabaseOverrides,
  };
}
