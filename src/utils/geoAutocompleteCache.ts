/**
 * geoAutocompleteCache.ts
 * High-performance client-side multi-tier caching layer for Google Maps Place autocomplete
 * and geocoding search results.
 * 
 * Features:
 * - Tier 1: In-Memory Map for instant 0ms access within the active session.
 * - Tier 2: Persistent localStorage with safe fallback for cross-session caching.
 * - LRU (Least Recently Used) automatic pruning to cap storage footprint (<150 entries).
 * - Automatic TTL (Time-To-Live) expiration (default: 48 hours).
 * - Sovereign query normalization for Arabic & English inputs.
 */

import { safeStorageGet, safeStorageSet } from './safeStorage';

export interface StandardGeoResult {
  place_id?: string;
  display_name?: string;
  title: string;
  subtitle?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  flag?: string;
  lat?: string;
  lon?: string;
  full_address?: string;
  raw_type?: string;
  category_label?: string;
  source?: string;
}

interface CacheEntry {
  results: StandardGeoResult[];
  timestamp: number;
  lastAccessed: number;
  hits: number;
  ttl: number;
}

interface SerializedStorageSchema {
  version: number;
  entries: Record<string, CacheEntry>;
}

const STORAGE_KEY = 'perplexta_geo_autocomplete_cache_v2';
const CURRENT_CACHE_VERSION = 2;
const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000; // 48 Hours
const MAX_CACHE_ENTRIES = 150; // Keep footprint tiny (<60KB)

// Tier 1: In-Memory Fast Cache Map
const memoryCache = new Map<string, CacheEntry>();
let isInitializedFromStorage = false;
let sessionHitCounter = 0;

/**
 * Normalizes query string, country code, and language into a canonical cache key
 */
export function normalizeGeoCacheKey(query: string, countryFilter: string = 'all', lang: string = 'ar'): string {
  const normQ = (query || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics
    .replace(/[\s\-_,]+/g, '_');
  
  const normCountry = (countryFilter || 'all').trim().toLowerCase();
  const normLang = (lang || 'ar').trim().toLowerCase();

  return `geo:${normQ || '__default__'}::${normCountry}::${normLang}`;
}

/**
 * Loads and hydrates the in-memory cache from persistent localStorage
 */
function hydrateFromStorage(): void {
  if (isInitializedFromStorage || typeof window === 'undefined') return;
  isInitializedFromStorage = true;

  try {
    const raw = safeStorageGet(STORAGE_KEY);
    if (!raw) return;

    const parsed: SerializedStorageSchema = JSON.parse(raw);
    if (parsed && parsed.version === CURRENT_CACHE_VERSION && parsed.entries) {
      const now = Date.now();
      let hasExpired = false;

      for (const [key, entry] of Object.entries(parsed.entries)) {
        // Check if expired
        if (now - entry.timestamp > (entry.ttl || DEFAULT_TTL_MS)) {
          hasExpired = true;
          continue;
        }
        memoryCache.set(key, entry);
      }

      // If any expired entries were purged, sync back to storage
      if (hasExpired) {
        persistToStorage();
      }
    }
  } catch (err) {
    console.warn('[GeoCache] Failed to hydrate from storage:', err);
  }
}

/**
 * Persists current in-memory cache to localStorage with LRU eviction
 */
function persistToStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // If cache exceeds limit, prune oldest/least accessed entries
    if (memoryCache.size > MAX_CACHE_ENTRIES) {
      const sortedEntries = Array.from(memoryCache.entries()).sort(
        (a, b) => b[1].lastAccessed - a[1].lastAccessed
      );
      memoryCache.clear();
      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        if (sortedEntries[i]) {
          memoryCache.set(sortedEntries[i][0], sortedEntries[i][1]);
        }
      }
    }

    const payload: SerializedStorageSchema = {
      version: CURRENT_CACHE_VERSION,
      entries: Object.fromEntries(memoryCache.entries())
    };

    safeStorageSet(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[GeoCache] Failed to persist to storage:', err);
  }
}

/**
 * Retrieves cached autocomplete results for a query
 */
export function getCachedGeoResults(
  query: string,
  countryFilter: string = 'all',
  lang: string = 'ar'
): StandardGeoResult[] | null {
  hydrateFromStorage();

  const key = normalizeGeoCacheKey(query, countryFilter, lang);
  const entry = memoryCache.get(key);

  if (!entry) return null;

  const now = Date.now();
  // Check TTL expiration
  if (now - entry.timestamp > (entry.ttl || DEFAULT_TTL_MS)) {
    memoryCache.delete(key);
    persistToStorage();
    return null;
  }

  // Update access metadata (LRU tracking)
  entry.lastAccessed = now;
  entry.hits = (entry.hits || 0) + 1;
  sessionHitCounter++;

  return entry.results;
}

/**
 * Stores autocomplete results in the client-side cache
 */
export function setCachedGeoResults(
  query: string,
  results: StandardGeoResult[],
  countryFilter: string = 'all',
  lang: string = 'ar',
  customTtlMs: number = DEFAULT_TTL_MS
): void {
  if (!Array.isArray(results)) return;

  hydrateFromStorage();

  const key = normalizeGeoCacheKey(query, countryFilter, lang);
  const now = Date.now();

  const entry: CacheEntry = {
    results,
    timestamp: now,
    lastAccessed: now,
    hits: 1,
    ttl: customTtlMs
  };

  memoryCache.set(key, entry);
  persistToStorage();
}

/**
 * Clears the client-side geocoding cache
 */
export function clearGeoCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    safeStorageSet(STORAGE_KEY, JSON.stringify({ version: CURRENT_CACHE_VERSION, entries: {} }));
  }
}

/**
 * Returns cache statistics for telemetry and diagnostics
 */
export function getGeoCacheStats(): {
  cachedQueriesCount: number;
  sessionHits: number;
  version: number;
} {
  hydrateFromStorage();
  return {
    cachedQueriesCount: memoryCache.size,
    sessionHits: sessionHitCounter,
    version: CURRENT_CACHE_VERSION
  };
}
