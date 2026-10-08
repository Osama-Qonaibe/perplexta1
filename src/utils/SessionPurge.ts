import { secureStorage } from "@/lib/storage";
import { QueryClient } from '@tanstack/react-query';

export interface PurgeSessionOptions {
  queryClient?: QueryClient | null;
  preserveTheme?: boolean;
  preserveLanguage?: boolean;
  onStateReset?: () => void;
}

export const SessionPurge = {
  /**
   * Clears local browser storage (localStorage, sessionStorage) and browser caches,
   * preserving only user preferences like theme or language if desired.
   */
  purgeStorage: (options: { preserveTheme?: boolean; preserveLanguage?: boolean } = {}) => {
    if (typeof window === 'undefined') return;

    const preserveTheme = options.preserveTheme ?? true;
    const preserveLanguage = options.preserveLanguage ?? true;

    const preservedKeys: string[] = ['last_active_tool', 'last_active_model'];
    if (preserveTheme) preservedKeys.push('perplexta_theme');
    if (preserveLanguage) preservedKeys.push('language');

    try {
      secureStorage.clearSync(preservedKeys);
      sessionStorage.clear();
    } catch (e) {
      console.error('SessionPurge: Failed to clear local or session storage', e);
    }

    // Purge browser CacheStorage if available
    if ('caches' in window) {
      try {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        }).catch(() => {});
      } catch (e) {}
    }
  },

  /**
   * Clears React Query cache to invalidate all cached queries and mutations across sessions.
   */
  purgeQueryCache: (queryClient?: QueryClient | null) => {
    if (!queryClient) return;
    try {
      queryClient.cancelQueries();
      queryClient.removeQueries();
      queryClient.clear();
      queryClient.resetQueries();
    } catch (e) {
      console.error('SessionPurge: Failed to clear React Query cache', e);
    }
  },

  /**
   * Performs a complete, dedicated session purge across local browser cache, React Query cache,
   * storage keys, and resets UI state.
   */
  purgeAll: (options: PurgeSessionOptions = {}) => {
    SessionPurge.purgeStorage({
      preserveTheme: options.preserveTheme,
      preserveLanguage: options.preserveLanguage,
    });

    if (options.queryClient) {
      SessionPurge.purgeQueryCache(options.queryClient);
    }

    if (options.onStateReset) {
      try {
        options.onStateReset();
      } catch (e) {
        console.error('SessionPurge: Error during onStateReset callback', e);
      }
    }
  },
};

export default SessionPurge;
