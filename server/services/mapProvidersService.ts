import { pool } from '../db/index.js';
import { encrypt, decrypt } from '../utils/crypto.js';

export interface MapProviderRecord {
  id: number;
  provider_key: string;
  name: string;
  name_ar?: string;
  description_ar?: string;
  portal_url?: string;
  api_key_masked?: string;
  has_key: boolean;
  is_enabled: boolean;
  is_primary: boolean;
  priority: number;
  config: Record<string, any>;
  status: 'healthy' | 'degraded' | 'error' | 'untested' | 'free_tier';
  last_tested_at: string | null;
  last_error: string | null;
  latency_ms: number | null;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

// In-Memory Fast Cache Map (Key -> Decrypted API Key & Metadata)
interface CachedProvider {
  id: number;
  provider_key: string;
  name: string;
  apiKeyDecrypted: string;
  is_enabled: boolean;
  is_primary: boolean;
  priority: number;
  config: Record<string, any>;
  status: string;
}

const inMemoryProviders = new Map<string, CachedProvider>();
let isTableEnsured = false;

const DEFAULT_MAP_PROVIDERS = [
  {
    provider_key: 'openstreetmap',
    name: 'OpenStreetMap & Photon Engine',
    name_ar: 'محرك أوبن ستريت ماب وفوتون (OpenStreetMap & Photon)',
    description_ar: 'محرك مجاني ومفتوح المصدر 100% لتحديد المواقع وعناوين المدن والقرى دون أي حدود أو تكاليف.',
    portal_url: 'https://photon.komoot.io/',
    is_enabled: true,
    is_primary: true,
    priority: 1,
    status: 'free_tier',
    capabilities: ['geocoding', 'reverse_geocoding', 'autocomplete', 'routing', 'free_unlimited'],
    config: { free_tier: true, rate_limit_rps: 10, source: 'community_open_source', portal_url: 'https://photon.komoot.io/' }
  },
  {
    provider_key: 'mapbox',
    name: 'Mapbox GL Platform',
    name_ar: 'منصة ماب بوكس (Mapbox GL Platform)',
    description_ar: 'خرائط متجهة وتصميم فائق السرعة مع بحث جغرافي وتوجيه دقيق.',
    portal_url: 'https://account.mapbox.com/access-tokens/',
    is_enabled: false,
    is_primary: false,
    priority: 3,
    status: 'untested',
    capabilities: ['vector_tiles', 'geocoding', 'navigation', 'satellite_imagery'],
    config: { free_tier_monthly_requests: 100000, requires_key: true, portal_url: 'https://account.mapbox.com/access-tokens/' }
  },
  {
    provider_key: 'locationiq',
    name: 'LocationIQ Geocoding',
    name_ar: 'محرك لوكيشن آي كيو (LocationIQ)',
    description_ar: 'محرك تجاري سريع يدعم البحث الجغرافي وعنونة الإحداثيات العكسية واقتراح المدن.',
    portal_url: 'https://my.locationiq.com/dashboard#accesstoken',
    is_enabled: false,
    is_primary: false,
    priority: 4,
    status: 'untested',
    capabilities: ['geocoding', 'reverse_geocoding', 'autocomplete'],
    config: { free_tier_daily_requests: 5000, requires_key: true, portal_url: 'https://my.locationiq.com/dashboard#accesstoken' }
  }
];

/**
 * Ensures table schema and loads hot cache
 */
export async function ensureMapProvidersTable(): Promise<void> {
  if (isTableEnsured || !pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS map_providers (
        id SERIAL PRIMARY KEY,
        provider_key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        api_key_encrypted TEXT,
        is_enabled BOOLEAN DEFAULT false,
        is_primary BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 1,
        config JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'untested',
        latency_ms INTEGER,
        last_tested_at TIMESTAMP,
        last_error TEXT,
        capabilities JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_map_providers_key ON map_providers(provider_key);
      CREATE INDEX IF NOT EXISTS idx_map_providers_enabled ON map_providers(is_enabled);
    `);
    isTableEnsured = true;

    // Seed defaults if empty
    const countRes = await pool.query('SELECT COUNT(*) as count FROM map_providers');
    if (parseInt(countRes.rows[0]?.count || '0', 10) === 0) {
      for (const def of DEFAULT_MAP_PROVIDERS) {
        await pool.query(`
          INSERT INTO map_providers (
            provider_key, name, is_enabled, is_primary, priority, status, capabilities, config
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (provider_key) DO NOTHING
        `, [
          def.provider_key,
          def.name,
          def.is_enabled,
          def.is_primary,
          def.priority,
          def.status,
          JSON.stringify(def.capabilities),
          JSON.stringify(def.config)
        ]);
      }
    }

    // Refresh memory cache
    await refreshMapProvidersCache();
  } catch (err: any) {
    console.warn('[MapProvidersService] Table ensure error:', err?.message || err);
  }
}

/**
 * Loads and decrypts active providers into fast in-memory map
 */
export async function refreshMapProvidersCache(): Promise<void> {
  if (!pool) return;
  try {
    const res = await pool.query('SELECT * FROM map_providers ORDER BY priority ASC, id ASC');
    inMemoryProviders.clear();

    for (const row of res.rows) {
      let decryptedKey = '';
      if (row.api_key_encrypted) {
        try {
          decryptedKey = decrypt(row.api_key_encrypted);
        } catch {
          decryptedKey = '';
        }
      }

      inMemoryProviders.set(row.provider_key, {
        id: row.id,
        provider_key: row.provider_key,
        name: row.name,
        apiKeyDecrypted: decryptedKey,
        is_enabled: Boolean(row.is_enabled),
        is_primary: Boolean(row.is_primary),
        priority: row.priority || 1,
        config: row.config || {},
        status: row.status || 'untested'
      });
    }
  } catch (err: any) {
    console.warn('[MapProvidersService] Cache refresh error:', err?.message || err);
  }
}

/**
 * Mask key for secure UI presentation (e.g. AIzaSy...9oESA)
 */
function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return key.slice(0, 6) + '...' + key.slice(-4);
}

/**
 * Get all map providers for the Admin Panel view (with masked keys and health status)
 */
export async function getAllMapProviders(): Promise<MapProviderRecord[]> {
  await ensureMapProvidersTable();
  if (!pool) return [];

  try {
    const res = await pool.query('SELECT * FROM map_providers ORDER BY priority ASC, id ASC');
    return res.rows.map((row: any) => {
      let decrypted = '';
      if (row.api_key_encrypted) {
        try {
          decrypted = decrypt(row.api_key_encrypted);
        } catch {
          decrypted = '';
        }
      }

      const defaultDef = DEFAULT_MAP_PROVIDERS.find(d => d.provider_key === row.provider_key);
      const conf = typeof row.config === 'object' ? row.config : {};

      return {
        id: row.id,
        provider_key: row.provider_key,
        name: row.name || defaultDef?.name || row.provider_key,
        name_ar: defaultDef?.name_ar,
        description_ar: defaultDef?.description_ar,
        portal_url: conf.portal_url || defaultDef?.portal_url,
        has_key: Boolean(decrypted),
        api_key_masked: maskApiKey(decrypted),
        is_enabled: Boolean(row.is_enabled),
        is_primary: Boolean(row.is_primary),
        priority: row.priority || 1,
        config: conf,
        status: row.status || (row.provider_key === 'openstreetmap' ? 'free_tier' : 'untested'),
        last_tested_at: row.last_tested_at ? new Date(row.last_tested_at).toISOString() : null,
        last_error: row.last_error || null,
        latency_ms: row.latency_ms || null,
        capabilities: Array.isArray(row.capabilities) ? row.capabilities : (typeof row.capabilities === 'string' ? JSON.parse(row.capabilities) : (defaultDef?.capabilities || [])),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
    });
  } catch (err: any) {
    console.error('[MapProvidersService] Failed to get map providers:', err);
    return [];
  }
}

/**
 * Get active decrypted key for any provider from the database vault
 */
export function getActiveProviderKey(providerKey: string): string {
  const cached = inMemoryProviders.get(providerKey);
  if (cached && cached.is_enabled && cached.apiKeyDecrypted) {
    return cached.apiKeyDecrypted;
  }
  return '';
}

/**
 * Pre-flight connection test (Ping) with latency calculation
 */
export async function testMapProviderConnection(
  providerKey: string,
  apiKeyToTest?: string
): Promise<{ success: boolean; latencyMs: number; message: string; message_ar: string; details?: any }> {
  let apiKey = apiKeyToTest;

  if (!apiKey) {
    const cached = inMemoryProviders.get(providerKey);
    apiKey = cached?.apiKeyDecrypted || '';
  }

  const startTime = Date.now();

  try {
    if (providerKey === 'openstreetmap') {
      const url = `https://nominatim.openstreetmap.org/search?q=Palestine&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PerplextaPlatform/1.0 (https://perplexta.app)' }
      });
      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: `Connected successfully to OpenStreetMap & Photon Engine (${latencyMs}ms)`,
          message_ar: `تم الاتصال بنجاح بمحرك OpenStreetMap & Photon الجغرافي (${latencyMs} مللي ثانية)`
        };
      }
      return {
        success: false,
        latencyMs,
        message: `HTTP error from OpenStreetMap: ${res.status}`,
        message_ar: `خطأ في الاتصال بمحرك OpenStreetMap: كود ${res.status}`
      };
    }

    if (providerKey === 'google_maps') {
      if (!apiKey) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Google Maps API Key is missing',
          message_ar: 'مفتاح Google Maps API غير موجود'
        };
      }

      // Test Geocoding endpoint
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Palestine&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(testUrl);
      const latencyMs = Date.now() - startTime;
      const data = await res.json();

      if (data && (data.status === 'OK' || data.status === 'ZERO_RESULTS')) {
        return {
          success: true,
          latencyMs,
          message: `Google Maps API authenticated successfully (${latencyMs}ms)`,
          message_ar: `تم التحقق من مفتاح Google Maps بنجاح (${latencyMs} مللي ثانية)`,
          details: { status: data.status, service: 'Geocoding & Places Verified' }
        };
      } else {
        const errorMsg = data.error_message || data.status || 'Authentication failed';
        return {
          success: false,
          latencyMs,
          message: `Google Maps Error: ${errorMsg}`,
          message_ar: `خطأ في مفتاح Google Maps: ${errorMsg}`,
          details: data
        };
      }
    }

    if (providerKey === 'mapbox') {
      if (!apiKey) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Mapbox Access Token is missing',
          message_ar: 'رمز الوصول لـ Mapbox غير موجود'
        };
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/Palestine.json?access_token=${encodeURIComponent(apiKey)}&limit=1`;
      const res = await fetch(url);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: `Mapbox API authenticated successfully (${latencyMs}ms)`,
          message_ar: `تم التحقق من رمز Mapbox بنجاح (${latencyMs} مللي ثانية)`
        };
      } else {
        return {
          success: false,
          latencyMs,
          message: `Mapbox Authentication Failed: Status ${res.status}`,
          message_ar: `فشل التحقق من Mapbox: كود الحالة ${res.status}`
        };
      }
    }

    if (providerKey === 'locationiq') {
      if (!apiKey) {
        return {
          success: false,
          latencyMs: 0,
          message: 'LocationIQ API Key is missing',
          message_ar: 'مفتاح LocationIQ API غير موجود'
        };
      }

      const url = `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(apiKey)}&q=Palestine&format=json&limit=1`;
      const res = await fetch(url);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: `LocationIQ API authenticated successfully (${latencyMs}ms)`,
          message_ar: `تم التحقق من مفتاح LocationIQ بنجاح (${latencyMs} مللي ثانية)`
        };
      } else {
        return {
          success: false,
          latencyMs,
          message: `LocationIQ Authentication Failed: Status ${res.status}`,
          message_ar: `فشل التحقق من LocationIQ: كود الحالة ${res.status}`
        };
      }
    }

    return {
      success: false,
      latencyMs: 0,
      message: `Unknown provider: ${providerKey}`,
      message_ar: `مزود غير معروف: ${providerKey}`
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: err.message || 'Network error during ping test',
      message_ar: 'حدث خطأ أثناء فحص الاتصال بالمزود'
    };
  }
}

/**
 * Save / Update a Map Provider configuration & credentials
 */
export async function saveMapProvider(data: {
  provider_key: string;
  name?: string;
  api_key?: string;
  is_enabled?: boolean;
  is_primary?: boolean;
  priority?: number;
  config?: Record<string, any>;
}): Promise<MapProviderRecord> {
  await ensureMapProvidersTable();
  if (!pool) throw new Error('Database pool not connected');

  const { provider_key, name, api_key, is_enabled, is_primary, priority, config } = data;

  let encryptedKey: string | null = null;
  if (api_key !== undefined) {
    encryptedKey = api_key ? encrypt(api_key.trim()) : null;
  }

  // If setting this provider as primary, unset other primaries
  if (is_primary) {
    await pool.query('UPDATE map_providers SET is_primary = false WHERE provider_key != $1', [provider_key]);
  }

  // Check if exists
  const existing = await pool.query('SELECT * FROM map_providers WHERE provider_key = $1', [provider_key]);

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    const finalEncrypted = encryptedKey !== null ? encryptedKey : row.api_key_encrypted;
    const finalName = name || row.name;
    // Auto-enable if a new non-empty key is provided and is_enabled was not explicitly specified
    const autoEnableOnKey = api_key && api_key.trim().length > 0;
    const finalEnabled = is_enabled !== undefined ? is_enabled : (autoEnableOnKey ? true : row.is_enabled);
    const finalPrimary = is_primary !== undefined ? is_primary : row.is_primary;
    const finalPriority = priority !== undefined ? priority : row.priority;
    const finalConfig = config !== undefined ? JSON.stringify(config) : JSON.stringify(row.config || {});

    await pool.query(`
      UPDATE map_providers 
      SET name = $1,
          api_key_encrypted = $2,
          is_enabled = $3,
          is_primary = $4,
          priority = $5,
          config = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE provider_key = $7
    `, [
      finalName,
      finalEncrypted,
      finalEnabled,
      finalPrimary,
      finalPriority,
      finalConfig,
      provider_key
    ]);
  } else {
    const autoEnable = is_enabled !== undefined ? is_enabled : Boolean(api_key && api_key.trim().length > 0);
    await pool.query(`
      INSERT INTO map_providers (
        provider_key, name, api_key_encrypted, is_enabled, is_primary, priority, config
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      provider_key,
      name || provider_key,
      encryptedKey,
      autoEnable,
      is_primary !== undefined ? is_primary : false,
      priority !== undefined ? priority : 1,
      JSON.stringify(config || {})
    ]);
  }

  await refreshMapProvidersCache();
  const all = await getAllMapProviders();
  return all.find(p => p.provider_key === provider_key)!;
}

/**
 * Update health test results in database
 */
export async function updateProviderHealthStatus(
  provider_key: string,
  status: 'healthy' | 'degraded' | 'error',
  latencyMs: number,
  errorMessage: string | null = null
): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(`
      UPDATE map_providers
      SET status = $1,
          latency_ms = $2,
          last_tested_at = CURRENT_TIMESTAMP,
          last_error = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE provider_key = $4
    `, [status, latencyMs, errorMessage, provider_key]);

    const cached = inMemoryProviders.get(provider_key);
    if (cached) {
      cached.status = status;
    }
  } catch (err: any) {
    console.warn('[MapProvidersService] Update health status error:', err?.message || err);
  }
}

/**
 * Remove or reset a provider's API key
 */
export async function resetMapProviderKey(provider_key: string): Promise<void> {
  if (!pool) return;
  await pool.query(`
    UPDATE map_providers
    SET api_key_encrypted = NULL,
        status = 'untested',
        latency_ms = NULL,
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_key = $1
  `, [provider_key]);

  await refreshMapProvidersCache();
}
