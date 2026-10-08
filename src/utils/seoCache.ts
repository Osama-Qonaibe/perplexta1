/**
 * Client-Side Caching Layer for SEO Route Data
 * Ensures zero-latency synchronous reads and deduplicates network requests
 * across repeated SPA navigations.
 */

export interface CachedSeoEntry<T = any> {
  data: T;
  timestamp: number;
}

const SEO_CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minutes TTL
const STORAGE_KEY_ROUTES = 'perplexta_seo_routes_cache_v2';
const STORAGE_KEY_METADATA_PREFIX = 'perplexta_seo_meta_v2:';

// In-memory instant lookup maps (zero serialization overhead)
const memoryRouteListCache: { data: any[] | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

const memoryMetadataCache = new Map<string, CachedSeoEntry<any | null>>();

// In-flight network request deduplication
const inFlightMetadataRequests = new Map<string, Promise<any | null>>();
let inFlightRouteListRequest: Promise<any[]> | null = null;

function normalizeRoutePath(route: string): string {
  if (!route || route === '/') return '/';
  return route.trim().replace(/\/+$/, '');
}

/**
 * Retrieve cached route metadata from memory or sessionStorage synchronously
 */
export function getCachedSeoMetadata(route: string): { hit: boolean; data: any | null } {
  const normRoute = normalizeRoutePath(route);
  const now = Date.now();

  // 1. Check in-memory fast map
  const mem = memoryMetadataCache.get(normRoute);
  if (mem && (now - mem.timestamp < SEO_CACHE_TTL_MS)) {
    return { hit: true, data: mem.data };
  }

  // 2. Check sessionStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`${STORAGE_KEY_METADATA_PREFIX}${normRoute}`);
      if (raw) {
        const parsed: CachedSeoEntry<any | null> = JSON.parse(raw);
        if (parsed && (now - parsed.timestamp < SEO_CACHE_TTL_MS)) {
          memoryMetadataCache.set(normRoute, parsed);
          return { hit: true, data: parsed.data };
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  return { hit: false, data: null };
}

/**
 * Save metadata into both memory and sessionStorage
 */
export function setCachedSeoMetadata(route: string, data: any | null): void {
  const normRoute = normalizeRoutePath(route);
  const entry: CachedSeoEntry<any | null> = {
    data,
    timestamp: Date.now()
  };

  memoryMetadataCache.set(normRoute, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${STORAGE_KEY_METADATA_PREFIX}${normRoute}`, JSON.stringify(entry));
    } catch {
      // Storage might be full or disabled
    }
  }
}

/**
 * Fetches SEO metadata for a route with automatic in-flight deduplication and caching
 */
export async function fetchSeoMetadataWithCache(route: string, forceRefresh = false): Promise<any | null> {
  const normRoute = normalizeRoutePath(route);

  if (!forceRefresh) {
    const cached = getCachedSeoMetadata(normRoute);
    if (cached.hit) {
      return cached.data;
    }
  }

  // Check if an in-flight request already exists for this route
  if (inFlightMetadataRequests.has(normRoute)) {
    return inFlightMetadataRequests.get(normRoute)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/seo-metadata?route=${encodeURIComponent(normRoute)}`);
      if (!res.ok) {
        // Cache negative response (null) to prevent repeated 404/500 fetch storms
        setCachedSeoMetadata(normRoute, null);
        return null;
      }
      const data = await res.json();
      const metadata = (data && data.metadata) ? data.metadata : null;
      setCachedSeoMetadata(normRoute, metadata);
      return metadata;
    } catch (err) {
      console.warn('[SeoCache] Error fetching route metadata for', normRoute, err);
      return null;
    } finally {
      inFlightMetadataRequests.delete(normRoute);
    }
  })();

  inFlightMetadataRequests.set(normRoute, fetchPromise);
  return fetchPromise;
}

/**
 * Retrieve cached full SEO routes list
 */
export function getCachedSeoRoutesList(): { hit: boolean; data: any[] } {
  const now = Date.now();

  if (memoryRouteListCache.data && (now - memoryRouteListCache.timestamp < SEO_CACHE_TTL_MS)) {
    return { hit: true, data: memoryRouteListCache.data };
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_ROUTES);
      if (raw) {
        const parsed: CachedSeoEntry<any[]> = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.data) && (now - parsed.timestamp < SEO_CACHE_TTL_MS)) {
          memoryRouteListCache.data = parsed.data;
          memoryRouteListCache.timestamp = parsed.timestamp;
          return { hit: true, data: parsed.data };
        }
      }
    } catch {}
  }

  return { hit: false, data: [] };
}

/**
 * Fetches the global SEO routes list with caching and request deduplication
 */
export async function fetchSeoRoutesListWithCache(forceRefresh = false): Promise<any[]> {
  if (!forceRefresh) {
    const cached = getCachedSeoRoutesList();
    if (cached.hit) {
      return cached.data;
    }
  }

  if (inFlightRouteListRequest) {
    return inFlightRouteListRequest;
  }

  inFlightRouteListRequest = (async () => {
    try {
      const res = await fetch('/api/seo-routes');
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data)) {
        memoryRouteListCache.data = data;
        memoryRouteListCache.timestamp = Date.now();

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify({
              data,
              timestamp: Date.now()
            }));
          } catch {}
        }
        return data;
      }
      return [];
    } catch (err) {
      console.warn('[SeoCache] Error fetching SEO routes list:', err);
      return [];
    } finally {
      inFlightRouteListRequest = null;
    }
  })();

  return inFlightRouteListRequest;
}

/**
 * Invalidate specific route or entire SEO cache (e.g., on Admin updates)
 */
export function invalidateSeoCache(route?: string): void {
  if (route) {
    const norm = normalizeRoutePath(route);
    memoryMetadataCache.delete(norm);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`${STORAGE_KEY_METADATA_PREFIX}${norm}`);
      } catch {}
    }
  } else {
    memoryMetadataCache.clear();
    memoryRouteListCache.data = null;
    memoryRouteListCache.timestamp = 0;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY_ROUTES);
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith(STORAGE_KEY_METADATA_PREFIX)) {
            sessionStorage.removeItem(k);
          }
        });
      } catch {}
    }
  }
}
