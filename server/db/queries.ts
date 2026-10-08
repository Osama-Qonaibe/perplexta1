import { pool, ledgerPool } from './index.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import NodeCache from 'node-cache';


type BatchLoadFn<K, V> = (keys: readonly K[]) => Promise<readonly V[]>;

export class DataLoader<K, V> {
  private batchLoadFn: BatchLoadFn<K, V>;
  private cache = new Map<K, V>();
  private queue: { key: K; resolve: (val: V) => void; reject: (err: Error) => void }[] = [];
  private hasScheduled = false;
  private ttl: number;
  private cacheTimestamps = new Map<K, number>();

  constructor(batchLoadFn: BatchLoadFn<K, V>, options?: { ttl?: number }) {
    this.batchLoadFn = batchLoadFn;
    this.ttl = options?.ttl ?? 0; // 0 means no TTL (unlimited cache)
  }

  async load(key: K): Promise<V> {
    const now = Date.now();
    this.pruneStaleKeys(now);

    if (this.ttl > 0 && this.cache.has(key)) {
      const created = this.cacheTimestamps.get(key) || 0;
      if (now - created < this.ttl) {
        return this.cache.get(key)!;
      } else {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    } else if (this.ttl === 0 && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    return new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      if (!this.hasScheduled) {
        this.hasScheduled = true;
        process.nextTick(() => this.dispatchBatch());
      }
    });
  }

  async loadMany(keys: readonly K[]): Promise<V[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  clear(key: K) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  clearAll() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  prime(key: K, value: V) {
    this.cache.set(key, value);
    if (this.ttl > 0) {
      this.cacheTimestamps.set(key, Date.now());
    }
  }

  private pruneStaleKeys(now: number) {
    if (this.ttl > 0 && this.cache.size > 100) {
      for (const [k, created] of this.cacheTimestamps.entries()) {
        if (now - created >= this.ttl) {
          this.cache.delete(k);
          this.cacheTimestamps.delete(k);
        }
      }
    }
  }

  private async dispatchBatch() {
    this.hasScheduled = false;
    const currentQueue = this.queue;
    this.queue = [];

    if (currentQueue.length === 0) return;

    const keys = currentQueue.map(q => q.key);
    try {
      const results = await this.batchLoadFn(keys);
      if (results.length !== keys.length) {
        throw new Error('DataLoader batchLoadFn returned result list length unequal to key list length.');
      }
      currentQueue.forEach((q, idx) => {
        const value = results[idx];
        if (value instanceof Error) {
          q.reject(value);
        } else {
          this.prime(q.key, value);
          q.resolve(value);
        }
      });
    } catch (err: any) {
      currentQueue.forEach(q => q.reject(err));
    }
  }
}


/**
 * Batched user loading to handle multiple parallel requests
 * (e.g. during authentication, workspace integrations, chat loops)
 */
export const userLoader = new DataLoader<number | string, any>(async (ids) => {
  if (ids.length === 0) return [];
  if (!pool) return ids.map(() => null);
  const validIds = Array.from(new Set(ids))
    .map(id => typeof id === 'number' ? id : parseInt(String(id), 10))
    .filter(id => typeof id === 'number' && !isNaN(id));
  
  if (validIds.length === 0) return ids.map(() => null);

  try {
    const res = await pool.query(
      'SELECT id, name, email, role, status, kyc_status, language, theme, memory, last_active_at, created_at, avatar FROM users WHERE id = ANY($1)',
      [validIds]
    );
    const userMap = new Map<number, any>();
    res.rows.forEach((row: any) => userMap.set(row.id, row));
    return ids.map(id => {
      const idNum = typeof id === 'number' ? id : parseInt(String(id), 10);
      return userMap.get(idNum) || null;
    });
  } catch (err: any) {
    console.warn('[DataLoader] Failed to batch load users:', err.message);
    return ids.map(() => null);
  }
}, { ttl: 15000 }); // 15-second cache for user metadata

/**
 * Batched wallet loading for ledger integrity
 */
export const walletLoader = new DataLoader<number | string, any>(async (userIds) => {
  if (userIds.length === 0) return [];
  const target = ledgerPool || pool;
  if (!target) return userIds.map(() => null);
  const validIds = Array.from(new Set(userIds))
    .map(id => typeof id === 'number' ? id : parseInt(String(id), 10))
    .filter(id => typeof id === 'number' && !isNaN(id));

  if (validIds.length === 0) return userIds.map(() => null);

  try {
    const res = await target.query(
      'SELECT id, user_id, balance, usd_balance, points, referral_activated, created_at, updated_at FROM wallets WHERE user_id = ANY($1)',
      [validIds]
    );
    const walletMap = new Map<number, any>();
    res.rows.forEach((row: any) => walletMap.set(row.user_id, row));
    return userIds.map(id => {
      const idNum = typeof id === 'number' ? id : parseInt(String(id), 10);
      return walletMap.get(idNum) || null;
    });
  } catch (err: any) {
    console.warn('[DataLoader] Failed to batch load wallets:', err.message);
    return userIds.map(() => null);
  }
}, { ttl: 5000 }); // 5-second cache for rapid point/balance changes

/**
 * Batched chat loading for dashboard and history views
 */
export const chatLoader = new DataLoader<number | string, any>(async (ids) => {
  if (ids.length === 0) return [];
  if (!pool) return ids.map(() => null);
  const validIds = Array.from(new Set(ids))
    .map(id => typeof id === 'number' ? id : parseInt(String(id), 10))
    .filter(id => typeof id === 'number' && !isNaN(id));

  if (validIds.length === 0) return ids.map(() => null);

  try {
    const res = await pool.query(
      'SELECT * FROM chats WHERE id = ANY($1)',
      [validIds]
    );
    const chatMap = new Map<number, any>();
    res.rows.forEach((row: any) => chatMap.set(row.id, row));
    return ids.map(id => {
      const idNum = typeof id === 'number' ? id : parseInt(String(id), 10);
      return chatMap.get(idNum) || null;
    });
  } catch (err: any) {
    console.warn('[DataLoader] Failed to batch load chats:', err.message);
    return ids.map(() => null);
  }
}, { ttl: 10000 }); // 10-second cache

/**
 * Invalidate all batch DataLoader caches
 */
export function invalidateAllDataLoaders() {
  userLoader.clearAll();
  walletLoader.clearAll();
  chatLoader.clearAll();
}

/**
 * Batched message loading for deep context retrievals
 */
export const messageLoader = new DataLoader<number | string, any>(async (ids) => {
  if (ids.length === 0) return [];
  if (!pool) return ids.map(() => null);
  const uniqueIds = Array.from(new Set(ids)).map(id => typeof id === 'number' ? id : parseInt(id, 10));

  try {
    const res = await pool.query(
      'SELECT * FROM messages WHERE id = ANY($1)',
      [uniqueIds]
    );
    const msgMap = new Map<number, any>();
    res.rows.forEach((row: any) => msgMap.set(row.id, row));
    return ids.map(id => {
      const idNum = typeof id === 'number' ? id : parseInt(id, 10);
      return msgMap.get(idNum) || null;
    });
  } catch (err: any) {
    console.warn('[DataLoader] Failed to batch load messages:', err.message);
    return ids.map(() => null);
  }
}, { ttl: 5000 }); // 5-second cache

/**
 * Batched subscription checking
 */
export const subscriptionLoader = new DataLoader<number | string, any>(async (userIds) => {
  if (userIds.length === 0) return [];
  if (!pool) return userIds.map(() => null);
  const uniqueIds = Array.from(new Set(userIds)).map(id => typeof id === 'number' ? id : parseInt(id, 10));

  try {
    const res = await pool.query(
      'SELECT id, user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, billing_period, current_period_end, created_at, updated_at FROM subscriptions WHERE user_id = ANY($1)',
      [uniqueIds]
    );
    const subMap = new Map<number, any>();
    res.rows.forEach((row: any) => subMap.set(row.user_id, row));
    return userIds.map(id => {
      const idNum = typeof id === 'number' ? id : parseInt(id, 10);
      return subMap.get(idNum) || null;
    });
  } catch (err: any) {
    console.warn('[DataLoader] Failed to batch load subscriptions:', err.message);
    return userIds.map(() => null);
  }
}, { ttl: 20000 }); // 20-second cache for subscription status


interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const systemSettingsCache = new Map<string, CacheEntry<any>>();
const economySettingsCache = new Map<string, CacheEntry<any>>();
const orchestratorConfigCache = new Map<string, CacheEntry<any>>();
const activePlansCache = new Map<string, CacheEntry<any>>();
const apiKeysVaultCache = new Map<string, CacheEntry<any>>();

const TTL_SYSTEM = 60000;       // 60-second TTL cache for system_settings
const TTL_ECONOMY = 60000;      // 60-second TTL cache for economy_settings
const TTL_ORCHESTRATOR = 60000; // 60-second TTL cache for tool_orchestrator
const TTL_PLANS = 60000;        // 60-second TTL cache for plans
const TTL_API_KEYS = 15000;     // 15 seconds

/** Helper to decrypt text securely */
function safeDecrypt(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try { return decrypt(value); } catch { return value; }
}

/** Get system settings from cache or DB */
export async function getCachedSystemSettings(): Promise<any> {
  const now = Date.now();
  const cached = systemSettingsCache.get('global');
  if (cached && now - cached.timestamp < TTL_SYSTEM) {
    return cached.data;
  }

  const defaultSettings: any = {
    site_name_en: 'Perplexta',
    site_name_ar: 'بيربليكستا',
    site_description_en: 'Next-Generation AI Intelligence Platform',
    site_description_ar: 'منصة الذكاء الاصطناعي الفائقة',
    seo_description_en: 'Advanced AI Tools and Neural Models',
    seo_description_ar: 'أدوات الذكاء الاصطناعي والنماذج العصبية المتقدمة',
    keywords_en: 'AI, Machine Learning, Deep Research',
    keywords_ar: 'ذكاء اصطناعي, بحث عميق, أدوات ذكية',
    google_analytics_id: '',
    google_site_verification: '',
    logo_url: null,
    logo_light_url: null,
    favicon_url: null,
    seo_image_url: null,
    stripe_status: 'inactive',
    stripe_last_verified_at: null,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_live_mode: false,
    paypal_status: 'inactive',
    paypal_last_verified_at: null,
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_mode: 'sandbox',
    image_prompt_pref_threshold: 0.7,
    blocked_paths: '',
    seo_site_name_en: 'Perplexta',
    seo_site_name_ar: 'بيربليكستا',
    font_loading_config: JSON.stringify({
      ar: { fontFamily: 'Tajawal', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap' },
      en: { fontFamily: 'Geist', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
      dynamicLoading: true
    }),
    font_config_ar: JSON.stringify({ fontFamily: 'Tajawal', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap' }),
    font_config_en: JSON.stringify({ fontFamily: 'Geist', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' })
  };

  if (!pool) {
    return defaultSettings;
  }

  try {
    const result = await pool.query(`
      SELECT *
      FROM system_settings 
      ORDER BY id ASC
      LIMIT 1
    `);

    let settings = result.rows[0];
    if (!settings) {
      await pool.query(`
        INSERT INTO system_settings (site_name_en, site_name_ar, logo_url, logo_light_url, favicon_url)
        VALUES ('Perplexta', 'بيربليكستا', null, null, null)
      `).catch(() => {});
      settings = defaultSettings;
    }

    if (!settings.font_loading_config) {
      settings.font_loading_config = defaultSettings.font_loading_config;
    }
    if (!settings.font_config_ar) {
      settings.font_config_ar = defaultSettings.font_config_ar;
    }
    if (!settings.font_config_en) {
      settings.font_config_en = defaultSettings.font_config_en;
    }

    if (settings.stripe_publishable_key) {
      settings.stripe_publishable_key = safeDecrypt(settings.stripe_publishable_key, '');
    }
    if (settings.stripe_secret_key) {
      settings.stripe_secret_key = safeDecrypt(settings.stripe_secret_key, '');
    }
    if (settings.stripe_webhook_secret) {
      settings.stripe_webhook_secret = safeDecrypt(settings.stripe_webhook_secret, '');
    }
    if (settings.paypal_client_id) {
      settings.paypal_client_id = safeDecrypt(settings.paypal_client_id, '');
    }
    if (settings.paypal_client_secret) {
      settings.paypal_client_secret = safeDecrypt(settings.paypal_client_secret, '');
    }
    if (settings.google_client_secret) {
      settings.google_client_secret = safeDecrypt(settings.google_client_secret, '');
    }
    if (settings.firebase_private_key) {
      settings.firebase_private_key = safeDecrypt(settings.firebase_private_key, '');
    }

    // Add environment variable fallbacks for Google OAuth to provide visibility in Admin Panel if DB is empty
    if (!settings.google_client_id && process.env.GOOGLE_CLIENT_ID) {
      settings.google_client_id = process.env.GOOGLE_CLIENT_ID;
    }
    if (!settings.google_client_secret && process.env.GOOGLE_CLIENT_SECRET) {
      // We provide a hint that it's set in env without revealing the full secret here 
      // if it's already masked in the UI logic. Actually, returning the value is fine 
      // as it's an admin-only endpoint.
      settings.google_client_secret = process.env.GOOGLE_CLIENT_SECRET;
    }

    systemSettingsCache.set('global', { data: settings, timestamp: now });
    return settings;
  } catch (err: any) {
    console.warn('[Queries] getCachedSystemSettings query failed, returning defaults:', err.message);
    systemSettingsCache.set('global', { data: defaultSettings, timestamp: now });
    return defaultSettings;
  }
}

export function invalidateSystemSettingsCache() {
  systemSettingsCache.delete('global');
}

/** Get economy settings from cache or DB */
export async function getCachedEconomySettings(): Promise<any> {
  const now = Date.now();
  const cached = economySettingsCache.get('global');
  if (cached && now - cached.timestamp < TTL_ECONOMY) {
    return cached.data;
  }

  const defaultSettings: any = {
    points_per_dollar:               1000,
    min_payout_usd:                  10,
    min_deposit_usd:                 5,
    referral_bonus_percent:          10,
    welcome_bonus_points:            600,
    referral_bonus_points:           1000,
    conversion_rate:                 0.001,
    min_withdrawal_cents:            1000,
    referral_activation_min_deposit: 10,
    crypto_address:  '',
    bank_name:       '',
    bank_recipient:  '',
    bank_iban:       '',
    bank_swift:      '',
    paypal_email:    '',
  };

  const target = ledgerPool || pool;
  if (!target) {
    economySettingsCache.set('global', { data: defaultSettings, timestamp: now });
    return defaultSettings;
  }

  try {
    const res = await target.query('SELECT * FROM economy_settings LIMIT 1');

    let settings: any;
    if (res.rows.length > 0) {
      settings = { ...res.rows[0] };
    } else {
      settings = defaultSettings;
    }

    settings.crypto_address  = safeDecrypt(settings.crypto_address,  '');
    settings.bank_name       = safeDecrypt(settings.bank_name,       '');
    settings.bank_recipient  = safeDecrypt(settings.bank_recipient,  '');
    settings.bank_iban       = safeDecrypt(settings.bank_iban,       '');
    settings.bank_swift      = safeDecrypt(settings.bank_swift,      '');
    settings.paypal_email    = safeDecrypt(settings.paypal_email,    '');

    economySettingsCache.set('global', { data: settings, timestamp: now });
    return settings;
  } catch (err: any) {
    console.warn('[Queries] getCachedEconomySettings query failed, returning defaults:', err.message);
    economySettingsCache.set('global', { data: defaultSettings, timestamp: now });
    return defaultSettings;
  }
}

export function invalidateEconomySettingsCache() {
  economySettingsCache.delete('global');
}

/** Get cached tool orchestrator configurations */
export async function getCachedOrchestratorConfig(toolId: string): Promise<any> {
  const now = Date.now();
  const cached = orchestratorConfigCache.get(toolId);
  if (cached && now - cached.timestamp < TTL_ORCHESTRATOR) {
    return cached.data;
  }

  if (!pool) {
    orchestratorConfigCache.set(toolId, { data: null, timestamp: now });
    return null;
  }
  try {
    const res = await pool.query('SELECT * FROM tool_orchestrator WHERE tool_id = $1 AND is_active = true', [toolId]);
    const config = res.rows[0] || null;

    orchestratorConfigCache.set(toolId, { data: config, timestamp: now });
    return config;
  } catch (err: any) {
    console.warn('[Queries] getCachedOrchestratorConfig failed:', err.message);
    orchestratorConfigCache.set(toolId, { data: null, timestamp: now });
    return null;
  }
}

export function invalidateOrchestratorConfigCache(toolId?: string) {
  if (toolId) {
    orchestratorConfigCache.delete(toolId);
  } else {
    orchestratorConfigCache.clear();
  }
}

export const DEFAULT_FALLBACK_PLANS = [
  {
    id: 1,
    name_ar: 'الخطة المجانية',
    name_en: 'Starter Free',
    description_ar: 'الوصول الأساسي للنماذج والأدوات المجانية',
    description_en: 'Basic access to essential tools and community models',
    desc_ar: 'الوصول الأساسي للنماذج والأدوات المجانية',
    desc_en: 'Basic access to essential tools and community models',
    monthly_price: 0,
    annual_price: 0,
    is_monthly_enabled: true,
    is_annual_enabled: false,
    is_daily_enabled: false,
    daily_price: 0,
    daily_days: 7,
    daily_credits: 0,
    monthly_credits: 500,
    annual_credits: 6000,
    hide_tools: false,
    plan_type: 'user',
    color: '#334155',
    features: ['Access to Standard Models', 'Community Support', 'Basic Search'],
    limits: {
      chat_fast: { daily: 15, monthly: 450, isHidden: false },
      sovereign_search: { daily: 10, monthly: 300, isHidden: false },
      image: { daily: 2, monthly: 30, isHidden: false }
    },
    is_active: true,
    is_visible: true,
    badge: 'free',
    badge_ar: 'مجاني',
    badge_en: 'Free'
  },
  {
    id: 2,
    name_ar: 'الخطة الاحترافية',
    name_en: 'Professional Pro',
    description_ar: 'أعلى سرعة مع وصول غير محدود وأدوات النخبة',
    description_en: 'High speed, elite neural models, and priority support',
    desc_ar: 'أعلى سرعة مع وصول غير محدود وأدوات النخبة',
    desc_en: 'High speed, elite neural models, and priority support',
    monthly_price: 19,
    annual_price: 190,
    is_monthly_enabled: true,
    is_annual_enabled: true,
    is_daily_enabled: false,
    daily_price: 0,
    daily_days: 7,
    daily_credits: 0,
    monthly_credits: 19000,
    annual_credits: 190000,
    hide_tools: false,
    plan_type: 'user',
    color: '#0284c7',
    features: ['All Neural Models', 'Priority Processing', 'GPU Acceleration', 'Dedicated Support'],
    limits: {
      chat_fast: 'unlimited',
      chat_pro: { daily: 50, monthly: 1500, isHidden: false },
      chat_reasoning: { daily: 25, monthly: 750, isHidden: false },
      sovereign_search: { daily: 50, monthly: 1500, isHidden: false },
      image: { daily: 20, monthly: 500, isHidden: false },
      video: { daily: 5, monthly: 60, isHidden: false },
      code: { daily: 50, monthly: 1500, isHidden: false }
    },
    is_active: true,
    is_visible: true,
    badge: 'popular',
    badge_ar: 'الأكثر شيوعاً',
    badge_en: 'Popular'
  },
  {
    id: 3,
    name_ar: 'خطة المؤسسات',
    name_en: 'Enterprise Ultra',
    description_ar: 'حلول الشركات المخصصة وسعة معالجة قصوى',
    description_en: 'Custom enterprise quotas, dedicated infrastructure and SLA',
    desc_ar: 'حلول الشركات المخصصة وسعة معالجة قصوى',
    desc_en: 'Custom enterprise quotas, dedicated infrastructure and SLA',
    monthly_price: 49,
    annual_price: 490,
    is_monthly_enabled: true,
    is_annual_enabled: true,
    is_daily_enabled: false,
    daily_price: 0,
    daily_days: 7,
    daily_credits: 0,
    monthly_credits: 49000,
    annual_credits: 490000,
    hide_tools: false,
    plan_type: 'user',
    color: '#7c3aed',
    features: ['Custom Orchestrator', 'Unlimited Ingest & GPU API', 'Dedicated Account Manager'],
    limits: {
      chat_fast: 'unlimited',
      chat_pro: 'unlimited',
      chat_reasoning: 'unlimited',
      sovereign_search: 'unlimited',
      image: { daily: 100, monthly: 3000, isHidden: false },
      video: { daily: 20, monthly: 300, isHidden: false },
      code: 'unlimited'
    },
    is_active: true,
    is_visible: true,
    badge: 'enterprise',
    badge_ar: 'المؤسسات',
    badge_en: 'Enterprise'
  }
];

/** Get active subscription plans from cache */
export async function getCachedActivePlans(): Promise<any[]> {
  const now = Date.now();
  const cached = activePlansCache.get('global');
  if (cached && now - cached.timestamp < TTL_PLANS) {
    return cached.data;
  }

  if (!pool) {
    activePlansCache.set('global', { data: DEFAULT_FALLBACK_PLANS, timestamp: now });
    return DEFAULT_FALLBACK_PLANS;
  }
  try {
    const res = await pool.query('SELECT * FROM plans WHERE is_active = true ORDER BY monthly_price ASC');
    const plans = res.rows.length > 0 ? res.rows.map((p: any) => ({
      ...p,
      is_monthly_enabled: p.is_monthly_enabled !== false,
      is_annual_enabled: p.is_annual_enabled !== false,
      is_daily_enabled: !!p.is_daily_enabled,
      daily_price: p.daily_price !== undefined ? parseFloat(p.daily_price) : 0,
      daily_days: p.daily_days ? parseInt(p.daily_days, 10) : 7,
      daily_credits: p.daily_credits ? parseInt(p.daily_credits, 10) : 0,
      monthly_credits: p.monthly_credits ? parseInt(p.monthly_credits, 10) : 0,
      annual_credits: p.annual_credits ? parseInt(p.annual_credits, 10) : 0,
      description_en: p.description_en || p.desc_en,
      description_ar: p.description_ar || p.desc_ar,
      desc_en: p.desc_en || p.description_en,
      desc_ar: p.desc_ar || p.description_ar,
      hide_tools: Boolean(p.hide_tools === true || p.hide_tools === 'true'),
      limits: typeof p.limits === 'string' ? JSON.parse(p.limits || '{}') : (p.limits || {})
    })) : DEFAULT_FALLBACK_PLANS;

    activePlansCache.set('global', { data: plans, timestamp: now });
    return plans;
  } catch (err: any) {
    console.warn('[Queries] getCachedActivePlans failed, returning default plans:', err.message);
    activePlansCache.set('global', { data: DEFAULT_FALLBACK_PLANS, timestamp: now });
    return DEFAULT_FALLBACK_PLANS;
  }
}

export function invalidatePlansCache() {
  activePlansCache.delete('global');
}

/** Get cached active API Key records from vault */
export async function getCachedApiKeysVault(): Promise<any[]> {
  const now = Date.now();
  const cached = apiKeysVaultCache.get('global');
  if (cached && now - cached.timestamp < TTL_API_KEYS) {
    return cached.data;
  }

  if (!pool) {
    apiKeysVaultCache.set('global', { data: [], timestamp: now });
    return [];
  }
  try {
    const res = await pool.query('SELECT * FROM api_keys_vault WHERE is_active = true');
    let keys = res.rows.map((row: any) => {
      const dec = { ...row };
      if (dec.encrypted_key) {
        try {
          dec.decrypted_key = decrypt(dec.encrypted_key);
        } catch (e) {
          dec.decrypted_key = dec.encrypted_key;
        }
      }
      return dec;
    });

    if (process.env.GEMINI_API_KEY && keys.length === 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      const defaultModels = '[]';

      keys.push({
        id: 99999,
        provider: 'google',
        encrypted_key: encrypt(geminiKey),
        decrypted_key: geminiKey,
        is_active: true,
        daily_budget: 0,
        used_today: 0,
        models: defaultModels
      });

      // Auto-seed google provider into api_keys_vault table in PostgreSQL if vault is completely empty
      pool.query(
        `INSERT INTO api_keys_vault (provider, encrypted_key, is_active, models, updated_at)
         VALUES ('google', $1, true, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (provider) DO NOTHING`,
        [encrypt(geminiKey), defaultModels]
      ).catch((err: any) => console.warn('[Queries] Failed to auto-sync GEMINI_API_KEY into api_keys_vault:', err.message));
    }

    apiKeysVaultCache.set('global', { data: keys, timestamp: now });
    return keys;
  } catch (err: any) {
    console.warn('[Queries] getCachedApiKeysVault failed:', err.message);
    apiKeysVaultCache.set('global', { data: [], timestamp: now });
    return [];
  }
}

export function invalidateApiKeysVaultCache() {
  apiKeysVaultCache.delete('global');
}

const seoNodeCache = new NodeCache({ stdTTL: 3600, checkperiod: 60 });

// Custom per-route hit/miss metrics tracker
interface CacheStats {
  hits: number;
  misses: number;
}

const seoRouteStats = new Map<string, CacheStats>();

function trackSeoCache(route: string, type: string, isHit: boolean) {
  let stats = seoRouteStats.get(route);
  if (!stats) {
    stats = { hits: 0, misses: 0 };
    seoRouteStats.set(route, stats);
  }
  if (isHit) {
    stats.hits++;
  } else {
    stats.misses++;
  }

  const total = stats.hits + stats.misses;
  const hitRatio = ((stats.hits / total) * 100).toFixed(1);

  // Get node-cache global stats
  const globalStats = seoNodeCache.getStats();
  const globalTotal = globalStats.hits + globalStats.misses;
  const globalHitRatio = globalTotal > 0 ? ((globalStats.hits / globalTotal) * 100).toFixed(1) : '0.0';

  console.log(
    `\x1b[35m[SEO Cache Metrics]\x1b[0m Route: "\x1b[33m${route}\x1b[0m" | Type: \x1b[36m${type}\x1b[0m | Result: ${isHit ? '\x1b[32mHIT (Memory)\x1b[0m' : '\x1b[31mMISS (DB)\x1b[0m'} | ` +
    `Route Efficiency: \x1b[32m${hitRatio}%\x1b[0m (Hits: ${stats.hits}, Misses: ${stats.misses}) | ` +
    `Overall Cache Efficiency: \x1b[36m${globalHitRatio}%\x1b[0m (Total Hits: ${globalStats.hits}, Total Misses: ${globalStats.misses})`
  );
}

/** Preload and warm up all SEO routes, metadata, and preview cache into memory on server startup */
export async function warmupSeoAndSystemCache(): Promise<void> {
  if (!pool) return;
  try {
    const startTime = Date.now();
    let routesCount = 0;
    let metaCount = 0;
    let dynamicCount = 0;
    let ogCount = 0;

    // 1. Warm-up route_seo_settings (both individual routes and all_active list)
    try {
      const activeRes = await pool.query('SELECT * FROM route_seo_settings WHERE is_active = true ORDER BY id ASC');
      seoNodeCache.set('all_active', activeRes.rows);
      for (const row of activeRes.rows) {
        if (row.route) {
          const norm = row.route === '/' ? '/' : row.route.replace(/\/$/, '');
          seoNodeCache.set(`route:${norm}`, row);
          routesCount++;
        }
      }
      const allRoutesRes = await pool.query('SELECT * FROM route_seo_settings');
      for (const row of allRoutesRes.rows) {
        if (row.route) {
          const norm = row.route === '/' ? '/' : row.route.replace(/\/$/, '');
          if (!seoNodeCache.has(`route:${norm}`)) {
            seoNodeCache.set(`route:${norm}`, row);
          }
        }
      }
    } catch (e: any) {
      console.warn('[SEO Warmup] route_seo_settings preload notice:', e.message);
    }

    // 2. Warm-up route_seo_metadata
    try {
      const routeMetaRes = await pool.query('SELECT * FROM route_seo_metadata');
      for (const row of routeMetaRes.rows) {
        if (row.route_path) {
          const norm = row.route_path === '/' ? '/' : row.route_path.replace(/\/$/, '');
          seoNodeCache.set(`meta:${norm}`, row);
          metaCount++;
        }
      }
    } catch (e: any) {
      console.warn('[SEO Warmup] route_seo_metadata preload notice:', e.message);
    }

    // 3. Warm-up dynamic SEO metadata (seo_metadata table)
    try {
      const dynamicSeoRes = await pool.query('SELECT * FROM seo_metadata WHERE is_active = true');
      for (const row of dynamicSeoRes.rows) {
        if (row.route_path) {
          const norm = row.route_path === '/' ? '/' : row.route_path.replace(/\/$/, '');
          seoNodeCache.set(`dynamic_seo:${norm}`, row);
          dynamicCount++;
        }
      }
    } catch (e: any) {
      console.warn('[SEO Warmup] dynamic seo_metadata preload notice:', e.message);
    }

    // 4. Warm-up og_preview_cache
    try {
      const ogRes = await pool.query('SELECT title, description, image_url, meta_data, route_path FROM og_preview_cache');
      for (const row of ogRes.rows) {
        if (row.route_path) {
          const norm = row.route_path === '/' ? '/' : row.route_path.replace(/\/$/, '');
          seoNodeCache.set(`og_preview:${norm}`, {
            title: row.title,
            description: row.description,
            image_url: row.image_url,
            meta_data: row.meta_data
          });
          ogCount++;
        }
      }
    } catch (e: any) {
      console.warn('[SEO Warmup] og_preview_cache preload notice:', e.message);
    }

    // 5. Pre-warm active subscription plans and system settings
    await getCachedActivePlans().catch(() => {});
    await getCachedSystemSettings().catch(() => {});

    const duration = Date.now() - startTime;
    console.log(
      `\x1b[35m[SEO Cache Warm-up]\x1b[0m 🚀 Pre-warmed SEO & metadata memory cache in \x1b[32m${duration}ms\x1b[0m ` +
      `(${routesCount} routes, ${metaCount} route meta, ${dynamicCount} dynamic entities, ${ogCount} OG previews ready in memory)`
    );
  } catch (err: any) {
    console.warn('[SEO Cache Warm-up] Non-fatal warm-up error:', err.message);
  }
}

/** Get cached SEO settings for a specific route */
export async function getCachedRouteSeo(route: string): Promise<any> {
  const cleanTrimmed = (route || '/').toLowerCase().trim();
  const stripped = cleanTrimmed.replace(/^\/+|\/+$/g, '');
  const withLeading = stripped ? `/${stripped}` : '/';
  const withTrailing = stripped ? `${stripped}/` : '/';
  const withBoth = stripped ? `/${stripped}/` : '/';

  const cacheKey = `route:${withLeading}`;
  const cached = seoNodeCache.get<any>(cacheKey);
  if (cached !== undefined) {
    trackSeoCache(route, 'Settings', true);
    return cached;
  }

  trackSeoCache(route, 'Settings', false);
  if (!pool) {
    seoNodeCache.set(cacheKey, null);
    return null;
  }
  try {
    const result = await pool.query(
      `SELECT * FROM route_seo_settings 
       WHERE TRIM(BOTH '/' FROM LOWER(route)) = $1 
          OR LOWER(route) = $2 
          OR LOWER(route) = $3 
          OR LOWER(route) = $4 
          OR LOWER(route) = $5 
       ORDER BY (og_image_url IS NOT NULL) DESC, id ASC 
       LIMIT 1`,
      [stripped, withLeading, withTrailing, withBoth, cleanTrimmed]
    );
    const data = result.rows[0] || null;
    seoNodeCache.set(cacheKey, data);
    seoNodeCache.set(`route:${cleanTrimmed}`, data);
    seoNodeCache.set(`route:${stripped}`, data);
    return data;
  } catch (err: any) {
    console.warn('[Queries] getCachedRouteSeo failed:', err.message);
    seoNodeCache.set(cacheKey, null);
    return null;
  }
}

/** Get cached SEO metadata for a specific route */
export async function getCachedRouteSeoMetadata(routePath: string): Promise<any> {
  const cleanTrimmed = (routePath || '/').toLowerCase().trim();
  const stripped = cleanTrimmed.replace(/^\/+|\/+$/g, '');
  const withLeading = stripped ? `/${stripped}` : '/';
  const withTrailing = stripped ? `${stripped}/` : '/';
  const withBoth = stripped ? `/${stripped}/` : '/';

  const cacheKey = `meta:${withLeading}`;
  const cached = seoNodeCache.get<any>(cacheKey);
  if (cached !== undefined) {
    trackSeoCache(routePath, 'Metadata', true);
    return cached;
  }

  trackSeoCache(routePath, 'Metadata', false);
  if (!pool) {
    seoNodeCache.set(cacheKey, null);
    return null;
  }
  try {
    const result = await pool.query(
      `SELECT * FROM route_seo_metadata 
       WHERE TRIM(BOTH '/' FROM LOWER(route_path)) = $1 
          OR LOWER(route_path) = $2 
          OR LOWER(route_path) = $3 
          OR LOWER(route_path) = $4 
          OR LOWER(route_path) = $5 
       LIMIT 1`,
      [stripped, withLeading, withTrailing, withBoth, cleanTrimmed]
    );
    const data = result.rows[0] || null;
    seoNodeCache.set(cacheKey, data);
    seoNodeCache.set(`meta:${cleanTrimmed}`, data);
    seoNodeCache.set(`meta:${stripped}`, data);
    return data;
  } catch (err: any) {
    console.warn('[Queries] getCachedRouteSeoMetadata failed:', err.message);
    seoNodeCache.set(cacheKey, null);
    return null;
  }
}

/** Get cached list of all active route SEO settings */
export async function getCachedAllActiveRouteSeo(): Promise<any[]> {
  const cached = seoNodeCache.get<any[]>('all_active');
  if (cached !== undefined) {
    trackSeoCache('all_active', 'AllActiveList', true);
    return cached;
  }

  trackSeoCache('all_active', 'AllActiveList', false);
  if (!pool) {
    seoNodeCache.set('all_active', []);
    return [];
  }
  try {
    const result = await pool.query('SELECT * FROM route_seo_settings WHERE is_active = true ORDER BY id ASC');
    const data = result.rows;
    seoNodeCache.set('all_active', data);
    return data;
  } catch (err: any) {
    console.warn('[Queries] getCachedAllActiveRouteSeo failed:', err.message);
    seoNodeCache.set('all_active', []);
    return [];
  }
}

/** Get cached Open Graph preview cache for social media / SSR */
export async function getCachedOgPreview(routePath: string): Promise<any> {
  const normalized = routePath === '/' ? '/' : routePath.replace(/\/$/, '');
  const cached = seoNodeCache.get<any>(`og_preview:${normalized}`);
  if (cached !== undefined) {
    return cached;
  }

  if (!pool) {
    seoNodeCache.set(`og_preview:${normalized}`, null);
    return null;
  }
  try {
    const result = await pool.query(
      'SELECT title, description, image_url, meta_data FROM og_preview_cache WHERE route_path = $1 LIMIT 1',
      [normalized]
    );
    const data = result.rows[0] || null;
    seoNodeCache.set(`og_preview:${normalized}`, data);
    return data;
  } catch {
    seoNodeCache.set(`og_preview:${normalized}`, null);
    return null;
  }
}

/** Invalidate entire route SEO cache */
export function invalidateRouteSeoCache(routePath?: string) {
  if (routePath) {
    const normalized = routePath === '/' ? '/' : routePath.replace(/\/$/, '');
    seoNodeCache.del(`route:${normalized}`);
    seoNodeCache.del(`meta:${normalized}`);
    seoNodeCache.del(`dynamic_seo:${normalized}`);
    seoNodeCache.del(`og_preview:${normalized}`);
  } else {
    seoNodeCache.flushAll();
  }
}

/** Get cached SEO metadata for dynamic routes from seo_metadata table */
export async function getCachedSeoMetadata(routePath: string): Promise<any> {
  const cleanTrimmed = (routePath || '/').toLowerCase().trim();
  const stripped = cleanTrimmed.replace(/^\/+|\/+$/g, '');
  const withLeading = stripped ? `/${stripped}` : '/';
  const withTrailing = stripped ? `${stripped}/` : '/';
  const withBoth = stripped ? `/${stripped}/` : '/';

  const cacheKey = `dynamic_seo:${withLeading}`;
  const cached = seoNodeCache.get<any>(cacheKey);
  if (cached !== undefined) {
    trackSeoCache(withLeading, 'DynamicSeoMetadata', true);
    return cached;
  }

  trackSeoCache(withLeading, 'DynamicSeoMetadata', false);
  if (!pool) {
    seoNodeCache.set(cacheKey, null);
    return null;
  }
  try {
    const result = await pool.query(
      `SELECT * FROM seo_metadata 
       WHERE (TRIM(BOTH '/' FROM LOWER(route_path)) = $1 
          OR LOWER(route_path) = $2 
          OR LOWER(route_path) = $3 
          OR LOWER(route_path) = $4 
          OR LOWER(route_path) = $5) 
         AND is_active = true 
       ORDER BY (og_image_url IS NOT NULL) DESC, id ASC 
       LIMIT 1`,
      [stripped, withLeading, withTrailing, withBoth, cleanTrimmed]
    );
    const data = result.rows[0] || null;
    seoNodeCache.set(cacheKey, data);
    seoNodeCache.set(`dynamic_seo:${cleanTrimmed}`, data);
    seoNodeCache.set(`dynamic_seo:${stripped}`, data);
    return data;
  } catch (err: any) {
    console.warn('[Queries] getCachedSeoMetadata failed:', err.message);
    seoNodeCache.set(cacheKey, null);
    return null;
  }
}

/** Upsert dynamic route SEO metadata into seo_metadata table */
export async function upsertSeoMetadata(data: {
  route_path: string;
  entity_type?: string;
  entity_id?: string;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  og_image_url?: string;
  og_image_alt_en?: string;
  og_image_alt_ar?: string;
  keywords_en?: string;
  keywords_ar?: string;
  canonical_url?: string;
  structured_data?: any;
  is_active?: boolean;
}): Promise<any> {
  if (!pool) return null;
  const normalizedPath = data.route_path === '/' ? '/' : (data.route_path || '/').replace(/\/$/, '');
  try {
    const result = await pool.query(`
      INSERT INTO seo_metadata (
        route_path, entity_type, entity_id,
        title_en, title_ar, description_en, description_ar,
        og_image_url, og_image_alt_en, og_image_alt_ar,
        keywords_en, keywords_ar, canonical_url, structured_data, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      ON CONFLICT (route_path) DO UPDATE SET
        entity_type = COALESCE(EXCLUDED.entity_type, seo_metadata.entity_type),
        entity_id = COALESCE(EXCLUDED.entity_id, seo_metadata.entity_id),
        title_en = COALESCE(EXCLUDED.title_en, seo_metadata.title_en),
        title_ar = COALESCE(EXCLUDED.title_ar, seo_metadata.title_ar),
        description_en = COALESCE(EXCLUDED.description_en, seo_metadata.description_en),
        description_ar = COALESCE(EXCLUDED.description_ar, seo_metadata.description_ar),
        og_image_url = COALESCE(EXCLUDED.og_image_url, seo_metadata.og_image_url),
        og_image_alt_en = COALESCE(EXCLUDED.og_image_alt_en, seo_metadata.og_image_alt_en),
        og_image_alt_ar = COALESCE(EXCLUDED.og_image_alt_ar, seo_metadata.og_image_alt_ar),
        keywords_en = COALESCE(EXCLUDED.keywords_en, seo_metadata.keywords_en),
        keywords_ar = COALESCE(EXCLUDED.keywords_ar, seo_metadata.keywords_ar),
        canonical_url = COALESCE(EXCLUDED.canonical_url, seo_metadata.canonical_url),
        structured_data = COALESCE(EXCLUDED.structured_data, seo_metadata.structured_data),
        is_active = COALESCE(EXCLUDED.is_active, seo_metadata.is_active),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      normalizedPath,
      data.entity_type || 'custom',
      data.entity_id || null,
      data.title_en || null,
      data.title_ar || null,
      data.description_en || null,
      data.description_ar || null,
      data.og_image_url || null,
      data.og_image_alt_en || null,
      data.og_image_alt_ar || null,
      data.keywords_en || null,
      data.keywords_ar || null,
      data.canonical_url || null,
      JSON.stringify(data.structured_data || {}),
      data.is_active !== false
    ]);
    seoNodeCache.del(`dynamic_seo:${normalizedPath}`);
    return result.rows[0];
  } catch (err: any) {
    console.warn('[Queries] upsertSeoMetadata failed:', err.message);
    return null;
  }
}

/** Get list of all dynamic SEO metadata records */
export async function getAllSeoMetadata(filters?: { entity_type?: string; limit?: number; offset?: number }): Promise<any[]> {
  if (!pool) return [];
  try {
    let query = 'SELECT * FROM seo_metadata';
    const params: any[] = [];
    if (filters?.entity_type) {
      params.push(filters.entity_type);
      query += ` WHERE entity_type = $${params.length}`;
    }
    query += ' ORDER BY updated_at DESC';
    if (filters?.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }
    if (filters?.offset) {
      params.push(filters.offset);
      query += ` OFFSET $${params.length}`;
    }
    const res = await pool.query(query, params);
    return res.rows;
  } catch (err: any) {
    console.warn('[Queries] getAllSeoMetadata failed:', err.message);
    return [];
  }
}

/** Delete a dynamic SEO metadata record */
export async function deleteSeoMetadata(id: number | string): Promise<boolean> {
  if (!pool) return false;
  try {
    const res = await pool.query('DELETE FROM seo_metadata WHERE id = $1 RETURNING route_path', [id]);
    if (res.rows[0]?.route_path) {
      seoNodeCache.del(`dynamic_seo:${res.rows[0].route_path}`);
    }
    return (res.rowCount || 0) > 0;
  } catch (err: any) {
    console.warn('[Queries] deleteSeoMetadata failed:', err.message);
    return false;
  }
}

