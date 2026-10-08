import { pool } from '../db/index.js';

export interface SyncedLocationData {
  id?: string | number;
  title: string;
  city: string;
  state?: string;
  country?: string;
  countryCode?: string;
  lat?: string | number;
  lon?: string | number;
  fullAddress?: string;
  placeId?: string;
  source?: string;
  categoryLabel?: string;
  rawType?: string;
  flag?: string;
  syncedAt?: string;
  hits?: number;
}

// In-Memory Fast Cache Map (Keyed by placeId or normalized title_country)
const inMemoryLocationCache = new Map<string, SyncedLocationData>();
let cacheHitCounter = 0;
let isTableInitialized = false;

/**
 * Initialize cached_locations table in PostgreSQL if not present
 */
export async function ensureLocationCacheTable() {
  if (isTableInitialized || !pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cached_locations (
        id SERIAL PRIMARY KEY,
        place_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255),
        country VARCHAR(255),
        country_code VARCHAR(10),
        lat NUMERIC(10, 7),
        lon NUMERIC(10, 7),
        full_address TEXT,
        category_label VARCHAR(100),
        raw_type VARCHAR(100),
        flag VARCHAR(20),
        source VARCHAR(100) DEFAULT 'user_sync',
        hits INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_cached_locations_place_id ON cached_locations(place_id);
      CREATE INDEX IF NOT EXISTS idx_cached_locations_title ON cached_locations(title);
      CREATE INDEX IF NOT EXISTS idx_cached_locations_city ON cached_locations(city);
      CREATE INDEX IF NOT EXISTS idx_cached_locations_country ON cached_locations(country);
      CREATE INDEX IF NOT EXISTS idx_cached_locations_country_code ON cached_locations(country_code);
    `);
    isTableInitialized = true;

    // Preload up to 500 popular/recent cached locations into memory for instant sub-millisecond retrieval
    const res = await pool.query(`
      SELECT * FROM cached_locations 
      ORDER BY hits DESC, updated_at DESC 
      LIMIT 500
    `);

    for (const row of res.rows) {
      const item: SyncedLocationData = {
        id: row.id,
        title: row.title,
        city: row.city,
        state: row.state || '',
        country: row.country || '',
        countryCode: row.country_code || '',
        lat: row.lat !== null ? String(row.lat) : undefined,
        lon: row.lon !== null ? String(row.lon) : undefined,
        fullAddress: row.full_address || '',
        placeId: row.place_id || undefined,
        categoryLabel: row.category_label || '',
        rawType: row.raw_type || 'locality',
        flag: row.flag || '',
        source: row.source || 'db_preload',
        hits: row.hits || 1,
        syncedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
      
      const key1 = generateCacheKey(item.title, item.country);
      inMemoryLocationCache.set(key1, item);
      if (item.placeId) {
        inMemoryLocationCache.set(`place:${item.placeId}`, item);
      }
    }
  } catch (err: any) {
    console.warn('[LocationCache] Table initialization or preload notice:', err?.message || err);
  }
}

// Generate consistent lookup cache keys
export function generateCacheKey(title: string, country?: string): string {
  const normTitle = (title || '').trim().toLowerCase();
  const normCountry = (country || '').trim().toLowerCase();
  return `loc:${normTitle}__${normCountry}`;
}

/**
 * Validate and sanitize incoming location sync data
 */
export function validateLocationData(input: any): { valid: boolean; error?: string; error_ar?: string; data?: SyncedLocationData } {
  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      error: 'Invalid payload: Location data must be a JSON object.',
      error_ar: 'بيانات غير صالحة: يجب إرسال كائن موقع صالح بصيغة JSON.'
    };
  }

  // Handle nested or flat payloads (e.g. { location: { ... } } vs { title: ... })
  const raw = input.location && typeof input.location === 'object' ? input.location : input;

  const rawTitle = typeof raw.title === 'string' ? raw.title.trim() : '';
  const rawCity = typeof raw.city === 'string' ? raw.city.trim() : '';

  if (!rawTitle && !rawCity) {
    return {
      valid: false,
      error: 'Validation failed: Location title or city is required.',
      error_ar: 'فشل التحقق: اسم الموقع أو المدينة مطلوب.'
    };
  }

  // Clean strings (strip dangerous control characters and limit length)
  const sanitize = (val: any, maxLen = 250): string => {
    if (typeof val !== 'string') return '';
    return val
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/<[^>]*>/g, '') // strip HTML tags
      .trim()
      .slice(0, maxLen);
  };

  const title = sanitize(rawTitle || rawCity, 150);
  const city = sanitize(rawCity || rawTitle, 150);
  const state = sanitize(raw.state || '', 150);
  let country = sanitize(raw.country || '', 100);
  let countryCode = sanitize(raw.countryCode || raw.country_code || '', 10).toLowerCase();
  const fullAddress = sanitize(raw.fullAddress || raw.display_name || `${title}${state ? `، ${state}` : ''}${country ? `، ${country}` : ''}`, 400);
  const placeId = sanitize(raw.placeId || raw.place_id || '', 200);
  const source = sanitize(raw.source || 'client_sync', 50);
  const categoryLabel = sanitize(raw.categoryLabel || raw.category_label || '', 50);
  const rawType = sanitize(raw.rawType || raw.raw_type || 'locality', 50);
  let flag = sanitize(raw.flag || '', 20);

  // Validate coordinates if provided
  let latNum: number | undefined;
  let lonNum: number | undefined;

  const rawLat = raw.lat !== undefined && raw.lat !== null && raw.lat !== '' ? Number(raw.lat) : undefined;
  const rawLon = (raw.lon !== undefined && raw.lon !== null && raw.lon !== '') ? Number(raw.lon) : 
                 (raw.lng !== undefined && raw.lng !== null && raw.lng !== '' ? Number(raw.lng) : undefined);

  if (rawLat !== undefined && !isNaN(rawLat)) {
    if (rawLat >= -90 && rawLat <= 90) {
      latNum = rawLat;
    }
  }

  if (rawLon !== undefined && !isNaN(rawLon)) {
    if (rawLon >= -180 && rawLon <= 180) {
      lonNum = rawLon;
    }
  }

  // Sovereign Palestine normalization
  const isPalestine = title.includes('فلسطين') || city.includes('فلسطين') || country.includes('فلسطين') || 
                      title.toLowerCase().includes('palestine') || city.toLowerCase().includes('palestine') || country.toLowerCase().includes('palestine') ||
                      countryCode === 'ps';

  if (isPalestine) {
    if (!country || country.toLowerCase().includes('israel') || country.includes('إسرائيل') || country.includes('الأراضي الفلسطينية')) {
      country = 'فلسطين';
    }
    countryCode = 'ps';
    flag = '🇵🇸';
  }

  const validatedData: SyncedLocationData = {
    title,
    city,
    state: state || undefined,
    country: country || undefined,
    countryCode: countryCode || undefined,
    lat: latNum !== undefined ? latNum : undefined,
    lon: lonNum !== undefined ? lonNum : undefined,
    fullAddress: fullAddress || undefined,
    placeId: placeId || undefined,
    source,
    categoryLabel: categoryLabel || undefined,
    rawType: rawType || undefined,
    flag: flag || undefined,
    syncedAt: new Date().toISOString()
  };

  return {
    valid: true,
    data: validatedData
  };
}

/**
 * Cache validated location in-memory and persist to PostgreSQL
 */
export async function cacheLocation(data: SyncedLocationData): Promise<SyncedLocationData> {
  const cacheKey = generateCacheKey(data.title, data.country);
  
  // Check if exists in memory to increment hits
  const existing = inMemoryLocationCache.get(cacheKey);
  const currentHits = (existing?.hits || 0) + 1;

  const cachedItem: SyncedLocationData = {
    ...data,
    hits: currentHits,
    syncedAt: new Date().toISOString()
  };

  inMemoryLocationCache.set(cacheKey, cachedItem);
  if (data.placeId) {
    inMemoryLocationCache.set(`place:${data.placeId}`, cachedItem);
  }

  // Also cache by title alone if no country
  if (!data.country) {
    inMemoryLocationCache.set(`loc:${data.title.toLowerCase().trim()}__`, cachedItem);
  }

  // Persist / Upsert into PostgreSQL database asynchronously
  if (pool) {
    try {
      await ensureLocationCacheTable();
      const query = `
        INSERT INTO cached_locations (
          place_id, title, city, state, country, country_code,
          lat, lon, full_address, category_label, raw_type, flag, source, hits, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `;
      // Check if item exists by place_id or title+country to increment hits
      const checkRes = data.placeId 
        ? await pool.query('SELECT id, hits FROM cached_locations WHERE place_id = $1 LIMIT 1', [data.placeId])
        : await pool.query('SELECT id, hits FROM cached_locations WHERE title = $1 AND (country = $2 OR (country IS NULL AND $2 IS NULL)) LIMIT 1', [data.title, data.country || null]);

      if (checkRes.rows.length > 0) {
        const rowId = checkRes.rows[0].id;
        const newHits = (checkRes.rows[0].hits || 1) + 1;
        await pool.query(`
          UPDATE cached_locations 
          SET hits = $1, 
              lat = COALESCE($2, lat), 
              lon = COALESCE($3, lon), 
              full_address = COALESCE($4, full_address),
              category_label = COALESCE($5, category_label),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [
          newHits,
          data.lat !== undefined ? Number(data.lat) : null,
          data.lon !== undefined ? Number(data.lon) : null,
          data.fullAddress || null,
          data.categoryLabel || null,
          rowId
        ]);
        cachedItem.id = rowId;
        cachedItem.hits = newHits;
      } else {
        const insertRes = await pool.query(`
          INSERT INTO cached_locations (
            place_id, title, city, state, country, country_code,
            lat, lon, full_address, category_label, raw_type, flag, source, hits
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1)
          RETURNING id
        `, [
          data.placeId || null,
          data.title,
          data.city,
          data.state || null,
          data.country || null,
          data.countryCode || null,
          data.lat !== undefined ? Number(data.lat) : null,
          data.lon !== undefined ? Number(data.lon) : null,
          data.fullAddress || null,
          data.categoryLabel || null,
          data.rawType || 'locality',
          data.flag || null,
          data.source || 'user_sync'
        ]);
        if (insertRes.rows.length > 0) {
          cachedItem.id = insertRes.rows[0].id;
        }
      }
    } catch (dbErr: any) {
      console.warn('[LocationCache] Database save warning:', dbErr?.message || dbErr);
    }
  }

  return cachedItem;
}

/**
 * Search cached locations in-memory and database
 */
export async function findCachedLocations(
  searchTerm: string,
  countryCode?: string,
  limit: number = 10
): Promise<SyncedLocationData[]> {
  const normSearch = (searchTerm || '').trim().toLowerCase();
  if (!normSearch) return [];

  const matched: SyncedLocationData[] = [];
  const seenKeys = new Set<string>();

  // 1. Fast in-memory scan
  for (const [key, item] of inMemoryLocationCache.entries()) {
    if (key.startsWith('place:')) continue;

    const matchesTitle = item.title.toLowerCase().includes(normSearch);
    const matchesCity = item.city.toLowerCase().includes(normSearch);
    const matchesState = item.state ? item.state.toLowerCase().includes(normSearch) : false;
    const matchesCountry = item.country ? item.country.toLowerCase().includes(normSearch) : false;

    let matchesCountryCode = true;
    if (countryCode && countryCode !== 'all') {
      matchesCountryCode = item.countryCode?.toLowerCase() === countryCode.toLowerCase();
    }

    if ((matchesTitle || matchesCity || matchesState || matchesCountry) && matchesCountryCode) {
      const uKey = `${item.title.toLowerCase()}_${(item.country || '').toLowerCase()}`;
      if (!seenKeys.has(uKey)) {
        seenKeys.add(uKey);
        matched.push(item);
        cacheHitCounter++;
      }
    }

    if (matched.length >= limit) break;
  }

  // 2. If memory cache has fewer results and DB is connected, query PostgreSQL
  if (matched.length < limit && pool) {
    try {
      await ensureLocationCacheTable();
      let queryStr = `
        SELECT * FROM cached_locations 
        WHERE (
          LOWER(title) LIKE $1 
          OR LOWER(city) LIKE $1 
          OR LOWER(COALESCE(state, '')) LIKE $1 
          OR LOWER(COALESCE(country, '')) LIKE $1
        )
      `;
      const queryParams: any[] = [`%${normSearch}%`];

      if (countryCode && countryCode !== 'all') {
        queryParams.push(countryCode.toLowerCase());
        queryStr += ` AND LOWER(country_code) = $2`;
      }

      queryStr += ` ORDER BY hits DESC, updated_at DESC LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit - matched.length);

      const dbRes = await pool.query(queryStr, queryParams);
      for (const row of dbRes.rows) {
        const uKey = `${row.title.toLowerCase()}_${(row.country || '').toLowerCase()}`;
        if (!seenKeys.has(uKey)) {
          seenKeys.add(uKey);
          const item: SyncedLocationData = {
            id: row.id,
            title: row.title,
            city: row.city,
            state: row.state || '',
            country: row.country || '',
            countryCode: row.country_code || '',
            lat: row.lat !== null ? String(row.lat) : undefined,
            lon: row.lon !== null ? String(row.lon) : undefined,
            fullAddress: row.full_address || '',
            placeId: row.place_id || undefined,
            categoryLabel: row.category_label || '',
            rawType: row.raw_type || 'locality',
            flag: row.flag || '',
            source: 'db_cache',
            hits: row.hits || 1,
            syncedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
          };
          matched.push(item);
          // Add to in-memory cache for next time
          inMemoryLocationCache.set(generateCacheKey(item.title, item.country), item);
        }
      }
    } catch (e: any) {
      console.warn('[LocationCache] DB query search error:', e?.message || e);
    }
  }

  return matched.slice(0, limit);
}

/**
 * Get all cached locations
 */
export async function getAllCachedLocations(limit: number = 50): Promise<SyncedLocationData[]> {
  if (pool) {
    try {
      await ensureLocationCacheTable();
      const res = await pool.query(`
        SELECT * FROM cached_locations 
        ORDER BY hits DESC, updated_at DESC 
        LIMIT $1
      `, [limit]);

      return res.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        city: row.city,
        state: row.state || '',
        country: row.country || '',
        countryCode: row.country_code || '',
        lat: row.lat !== null ? String(row.lat) : undefined,
        lon: row.lon !== null ? String(row.lon) : undefined,
        fullAddress: row.full_address || '',
        placeId: row.place_id || undefined,
        categoryLabel: row.category_label || '',
        rawType: row.raw_type || 'locality',
        flag: row.flag || '',
        source: row.source || 'cached',
        hits: row.hits || 1,
        syncedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      }));
    } catch (e) {
      // Fallback to in-memory
    }
  }

  const results: SyncedLocationData[] = [];
  for (const [key, val] of inMemoryLocationCache.entries()) {
    if (!key.startsWith('place:')) {
      results.push(val);
    }
    if (results.length >= limit) break;
  }
  return results;
}

/**
 * Get cache performance stats
 */
export function getLocationCacheStats() {
  return {
    inMemoryCount: Array.from(inMemoryLocationCache.keys()).filter(k => !k.startsWith('place:')).length,
    totalIndexedKeys: inMemoryLocationCache.size,
    hits: cacheHitCounter,
    status: 'active'
  };
}
