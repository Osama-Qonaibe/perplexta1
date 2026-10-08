type CacheEntry<T> = {
  value: T;
  expiry: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  // Check expiry
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // 5 minutes default
) {
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

export function delCache(key: string) {
  cache.delete(key);
}

export async function connectCache(): Promise<void> {
  console.log('[Cache] Fast in-memory RAM cache initialized (Zero external dependencies)');
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

class PureMemoryCache {
  get<T>(key: string): T | null {
    return getCache<T>(key);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    setCache(key, value, Math.ceil(ttlMs / 1000));
  }

  delete(key: string): void {
    delCache(key);
  }

  deletePattern(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }

  clear(): void {
    cache.clear();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    this.set(key, fresh, ttlMs);
    return fresh;
  }
}

export const memoryCache = new PureMemoryCache();
