import pkg from 'pg';
const { Pool } = pkg;

// Globally patch Pool.prototype.connect to handle errors on checked-out clients
// and prevent Uncaught Exceptions on unexpected connection drops.
const originalConnect = Pool.prototype.connect as any;
(Pool.prototype as any).connect = function(cb?: any) {
  if (typeof cb === 'function') {
    return originalConnect.call(this, (err: any, client: any, release: any) => {
      if (client && typeof client.on === 'function' && !client._errorListenerAttached) {
        client._errorListenerAttached = true;
        // Prevent unhandled exception if client connection drops while checked out
        client.on('error', (clientErr: any) => {
          const msg = clientErr?.message || String(clientErr);
          if (!/Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection/i.test(msg)) {
            console.warn('[DB Client] Checked-out client connection error:', msg);
          }
        });
      }
      cb(err, client, release);
    });
  }
  
  return originalConnect.call(this).then((client: any) => {
    if (client && typeof client.on === 'function' && !client._errorListenerAttached) {
      client._errorListenerAttached = true;
      // Prevent unhandled exception if client connection drops while checked out
      client.on('error', (clientErr: any) => {
        const msg = clientErr?.message || String(clientErr);
        if (!/Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection/i.test(msg)) {
          console.warn('[DB Client] Checked-out client connection error:', msg);
        }
      });
    }
    return client;
  });
};

import { decrypt, encrypt } from "../utils/crypto.js";

const fallbackPool = {
  query: async (text: any, params?: any) => {
    const queryStr = typeof text === 'string' ? text.trim().toLowerCase() : (text?.text ? text.text.trim().toLowerCase() : '');
    if (queryStr.includes('select 1') || queryStr.includes('select version')) {
      return { rows: [{ '?column?': 1 }], raw: [], rowCount: 1 };
    }
    return { rows: [], raw: [], rowCount: 0 };
  },
  connect: async () => ({
    query: async () => ({ rows: [], raw: [], rowCount: 0 }),
    release: () => {}
  }),
  end: async () => {},
  on: () => {},
  emit: () => {},
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
  options: { max: 20 }
};

let rawPool: any = null;
let rawLedgerPool: any = null;
let rawExternalPool: any = null;
let rawSecurityPool: any = null;
let rawMediaPool: any = null;

export const pool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawPool || fallbackPool;
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const ledgerPool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawLedgerPool || rawPool || fallbackPool;
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const externalPool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawExternalPool || rawPool || fallbackPool;
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const securityPool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawSecurityPool || rawPool || fallbackPool;
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export const mediaPool: any = new Proxy({}, {
  get(target, prop) {
    const p = rawMediaPool || rawPool || fallbackPool;
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export function getDatabasePool(poolName: 'core' | 'ledger' | 'external' | 'security' | 'media' = 'core') {
  if (poolName === 'ledger') return rawLedgerPool || rawPool || fallbackPool;
  if (poolName === 'external') return rawExternalPool || rawPool || fallbackPool;
  if (poolName === 'security') return rawSecurityPool || rawPool || fallbackPool;
  if (poolName === 'media') return rawMediaPool || rawPool || fallbackPool;
  return rawPool || fallbackPool;
}

let currentCoreUrl     = '';
let currentLedgerUrl   = '';
let currentExternalUrl = '';
let currentSecurityUrl = '';
let currentMediaUrl    = '';
let currentCoreMax     = 0;
let currentLedgerMax   = 0;
let currentExternalMax = 0;
let currentSecurityMax = 0;
let currentMediaMax    = 0;
let poolInitPromise: Promise<void> | null = null;
let lastInitUrls = { core: '', ledger: '', external: '', security: '', media: '', coreMax: 0, ledgerMax: 0, externalMax: 0, securityMax: 0, mediaMax: 0 };


export function getSslConfig(urlStr?: string) {
  const finalUrl = urlStr || process.env.DATABASE_URL || '';
  if (!finalUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[DB SSL] No database URL provided in production environment.');
    }
    return undefined;
  }
  try {
    const u = new URL(finalUrl);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      if (process.env.DB_SSL_REQUIRED === 'true' || u.searchParams.get('sslmode') === 'require') {
        return { rejectUnauthorized: false };
      }
      return undefined; // SSL is disabled for localhost
    }
  } catch {
    // Fallback if URL parsing fails
  }
  if (process.env.DB_SSL_REQUIRED === 'false') {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

/** Resolve pool-size defaults from environment variables — single source of truth. */
function getPoolSizesFromEnv(): { coreMax: number; ledgerMax: number; externalMax: number; securityMax: number; mediaMax: number } {
  const defaultBase = process.env.NODE_ENV === 'production' ? 10 : 20;
  const base = Number(process.env.DB_MAX_CONNECTIONS) || defaultBase;
  return {
    coreMax:     Number(process.env.DB_CORE_MAX_POOL_SIZE     || process.env.DB_CORE_MAX_CONNECTIONS)     || base,
    ledgerMax:   Number(process.env.DB_LEDGER_MAX_POOL_SIZE   || process.env.DB_LEDGER_MAX_CONNECTIONS)   || base,
    externalMax: Number(process.env.DB_EXTERNAL_MAX_POOL_SIZE || process.env.DB_EXTERNAL_MAX_CONNECTIONS) || base,
    securityMax: Number(process.env.DB_SECURITY_MAX_POOL_SIZE || process.env.DB_SECURITY_MAX_CONNECTIONS) || base,
    mediaMax:    Number(process.env.DB_MEDIA_MAX_POOL_SIZE    || process.env.DB_MEDIA_MAX_CONNECTIONS)    || base,
  };
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    u.password = '****';
    return u.toString();
  } catch {
    return 'invalid-url';
  }
}

function validateDatabaseUrl(url: any, name: string) {
  if (!url || typeof url !== 'string') throw new Error(`[DB] ${name} environment variable is missing or not a string.`);
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error(`[DB] Invalid ${name} format. Expected a valid postgresql:// connection string.`);
  try {
    const u = new URL(url);
    if (!u.hostname) throw new Error(`Missing hostname in ${name}`);
  } catch (err: any) {
    throw new Error(`[DB] ${name} is not a valid URL: ${err.message}`);
  }
}

export function isLocalhost(urlStr?: string): boolean {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/** Check if database URL is a mock/placeholder/dummy or unreachable host (e.g. host:5432, example.com, user:pass) */
export function isPlaceholderOrUnreachableUrl(urlStr?: string): boolean {
  if (!urlStr) return true;
  try {
    const u = new URL(urlStr);
    const host = u.hostname?.toLowerCase() || '';
    if (!host || host === 'host' || host === 'example.com' || host === 'base') {
      return true;
    }
    // Check dummy user:pass credentials commonly set in demo/placeholder envs
    if (u.username === 'user' && u.password === 'pass') {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/** Normalize database URL to ensure sslmode=verify-full and strip unsupported params */
export function normalizeDatabaseUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    
    // Many cloud providers (Supabase, Neon) require SSL but fail on verify-full without proper certs.
    // So we use sslmode=require for remote hosts unless explicitly disabled.
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      if (process.env.DB_SSL_REQUIRED !== 'false') {
        u.searchParams.set('sslmode', 'require');
      }
    } else {
       // For localhost, allow user to force require if their local setup demands it
       if (process.env.DB_SSL_REQUIRED === 'true') {
         u.searchParams.set('sslmode', 'require');
       } else {
         u.searchParams.delete('sslmode');
       }
    }
    
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return url;
  }
}

export function getBasePoolConfig(max: number, connectionTimeoutMillis = 15000, urlStr?: string) {
  return {
    ssl: getSslConfig(urlStr),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis,
    max,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    allowExitOnIdle: false,
  };
}

function handleIdleClientError(poolName: string, err: any) {
  const msg = (err?.message || err?.code || String(err || '')).toLowerCase();
  // Remote serverless Postgres instances (e.g. Neon, Supabase, Cloud SQL scale-to-zero)
  // routinely terminate idle pooled TCP sockets via ECONNRESET, ETIMEDOUT, or "Connection terminated unexpectedly".
  // pg-pool automatically destroys dead idle clients and spawns fresh ones upon query arrival.
  if (
    /connection terminated unexpectedly|econnreset|etimedout|terminating connection|socket closed|broken pipe|econnrefused|closed/i.test(msg) ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'ETIMEDOUT'
  ) {
    // Suppress from stderr; log only when DEBUG_DB is enabled to keep terminal error-free
    if (process.env.DEBUG_DB === 'true') {
      console.log(`[DB] Idle ${poolName} socket closed by remote host (normal lifecycle event):`, err?.message || msg);
    }
    return;
  }
  console.error(`[DB] Idle ${poolName} client error:`, err?.message || msg);
}

export function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || String(err)).toLowerCase();
  const code = String(err?.code || '');
  return code === '53000' || /quota|exceeded the quota|exceeded the data transfer|upgrade your plan/i.test(msg);
}

function patchPoolQuery(p: any) {
  if (!p || p._queryPatched) return p;
  const originalQuery = p.query.bind(p);
  p.query = async function(text: any, params: any) {
    const maxRetries = 3;
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await originalQuery(text, params);
      } catch (err: any) {
        const msg = err?.message || String(err);
        const isQuotaExceeded = isQuotaExceededError(err);
        const isTransient = !isQuotaExceeded && /Connection terminated unexpectedly|ECONNRESET|ETIMEDOUT|terminating connection|closed|SSL|too many connections|connection slots reserved|remaining connection slots reserved|timeout/i.test(msg);
        if (isTransient && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 300);
          console.warn(`[DB] Transient connection error ("${msg}"). Retrying query (attempt ${attempt}/${maxRetries}) in ${delay + jitter}ms...`);
          await new Promise(r => setTimeout(r, delay + jitter));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  };
  p._queryPatched = true;
  return p;
}

export function resetPoolsToDegradedMode() {
  if (rawPool) { try { rawPool.end().catch(() => {}); } catch {} }
  if (rawLedgerPool && rawLedgerPool !== rawPool) { try { rawLedgerPool.end().catch(() => {}); } catch {} }
  if (rawExternalPool && rawExternalPool !== rawPool) { try { rawExternalPool.end().catch(() => {}); } catch {} }
  if (rawSecurityPool && rawSecurityPool !== rawPool) { try { rawSecurityPool.end().catch(() => {}); } catch {} }
  if (rawMediaPool && rawMediaPool !== rawPool) { try { rawMediaPool.end().catch(() => {}); } catch {} }
  rawPool = null;
  rawLedgerPool = null;
  rawExternalPool = null;
  rawSecurityPool = null;
  rawMediaPool = null;
  currentCoreUrl = '';
  currentLedgerUrl = '';
  currentExternalUrl = '';
  currentSecurityUrl = '';
  currentMediaUrl = '';
  currentCoreMax = 0;
  currentLedgerMax = 0;
  currentExternalMax = 0;
  currentSecurityMax = 0;
  currentMediaMax = 0;
}

export function createInternalPool(connectionString: string, max = 1, connectionTimeoutMillis = 15000) {
  const safeConnStr = typeof connectionString === 'string' ? connectionString : String(connectionString || '');
  const p = new Pool({
    connectionString: safeConnStr,
    ...getBasePoolConfig(max, connectionTimeoutMillis, safeConnStr),
  });
  p.on('error', (e: any) => {
    handleIdleClientError('internal', e);
  });
  return patchPoolQuery(p);
}

export function getLedgerPool() { return ledgerPool || pool; }
export function getExternalPool() { return externalPool || pool; }
export function getSecurityPool() { return securityPool || pool; }
export function getMediaPool() { return mediaPool || pool; }

export function isMediaPoolDistinct(): boolean {
  const m = rawMediaPool || rawPool;
  const c = rawPool;
  return m !== null && c !== null && m !== c;
}

export function isDatabaseConnected(): boolean {
  return rawPool !== null;
}


export async function initializePerplextaPools(
  coreUrl: string,
  ledgerUrl: string,
  externalUrl?: string,
  securityUrl?: string,
  mediaUrl?: string,
  coreMaxOverride?: number,
  ledgerMaxOverride?: number,
  externalMaxOverride?: number,
  securityMaxOverride?: number,
  mediaMaxOverride?: number,
): Promise<void> {
  // Helper to discover if a valid remote cloud database exists in any env or param
  const findRemoteDatabase = (...candidates: (string | undefined)[]): string | null => {
    for (const c of candidates) {
      if (c && typeof c === 'string' && /^postgres(ql)?:\/\//.test(c)) {
        if (!isPlaceholderOrUnreachableUrl(c)) {
          return c;
        }
      }
    }
    return null;
  };

  const detectedRemote = findRemoteDatabase(
    coreUrl,
    securityUrl,
    ledgerUrl,
    externalUrl,
    mediaUrl,
    process.env.DATABASE_URL,
    process.env.SECURITY_DATABASE_URL,
    process.env.LEDGER_DATABASE_URL,
    process.env.EXTERNAL_DATABASE_URL,
    process.env.MEDIA_DATABASE_URL
  );

  let effectiveCoreUrl = coreUrl;
  if ((!effectiveCoreUrl || isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) && detectedRemote) {
    console.log(`[DB] Notice: Core DB URL is localhost/missing/placeholder; adopting detected active remote cloud database: ${redactUrl(detectedRemote)}`);
    effectiveCoreUrl = detectedRemote;
  }

  let finalLedgerUrl = ledgerUrl || effectiveCoreUrl;
  if (isPlaceholderOrUnreachableUrl(finalLedgerUrl) && !isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) {
    finalLedgerUrl = effectiveCoreUrl;
  }
  let finalExternalUrl = externalUrl || effectiveCoreUrl;
  if (isPlaceholderOrUnreachableUrl(finalExternalUrl) && !isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) {
    finalExternalUrl = effectiveCoreUrl;
  }
  let finalSecurityUrl = securityUrl || effectiveCoreUrl;
  if (isPlaceholderOrUnreachableUrl(finalSecurityUrl) && !isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) {
    finalSecurityUrl = effectiveCoreUrl;
  }
  let finalMediaUrl = mediaUrl || process.env.MEDIA_DATABASE_URL || effectiveCoreUrl;
  if (isPlaceholderOrUnreachableUrl(finalMediaUrl) && !isPlaceholderOrUnreachableUrl(effectiveCoreUrl)) {
    finalMediaUrl = effectiveCoreUrl;
  }

  const envSizes = getPoolSizesFromEnv();
  const finalCoreMax     = coreMaxOverride     || envSizes.coreMax;
  const finalLedgerMax   = ledgerMaxOverride   || envSizes.ledgerMax;
  const finalExternalMax = externalMaxOverride || envSizes.externalMax;
  const finalSecurityMax = securityMaxOverride || envSizes.securityMax;
  const finalMediaMax    = mediaMaxOverride    || envSizes.mediaMax;

  if (
    rawPool &&
    currentCoreUrl     === effectiveCoreUrl  &&
    currentLedgerUrl   === finalLedgerUrl    &&
    currentExternalUrl === finalExternalUrl  &&
    currentSecurityUrl === finalSecurityUrl  &&
    currentMediaUrl    === finalMediaUrl     &&
    currentCoreMax     === finalCoreMax      &&
    currentLedgerMax   === finalLedgerMax    &&
    currentExternalMax === finalExternalMax  &&
    currentSecurityMax === finalSecurityMax  &&
    currentMediaMax    === finalMediaMax
  ) {
    console.log('[DB] Pools already initialized with matching configuration. Skipping.');
    return;
  }

  if (
    poolInitPromise &&
    lastInitUrls.core        === effectiveCoreUrl  &&
    lastInitUrls.ledger      === finalLedgerUrl    &&
    lastInitUrls.external    === finalExternalUrl  &&
    lastInitUrls.security    === finalSecurityUrl  &&
    lastInitUrls.media       === finalMediaUrl     &&
    lastInitUrls.coreMax     === finalCoreMax      &&
    lastInitUrls.ledgerMax   === finalLedgerMax    &&
    lastInitUrls.externalMax === finalExternalMax  &&
    lastInitUrls.securityMax === finalSecurityMax  &&
    lastInitUrls.mediaMax    === finalMediaMax
  ) {
    console.log('[DB] Identical pool initialization already in progress. Re-using active promise.');
    return poolInitPromise;
  }

  lastInitUrls = {
    core: effectiveCoreUrl, ledger: finalLedgerUrl, external: finalExternalUrl, security: finalSecurityUrl, media: finalMediaUrl,
    coreMax: finalCoreMax, ledgerMax: finalLedgerMax, externalMax: finalExternalMax, securityMax: finalSecurityMax, mediaMax: finalMediaMax,
  };

  poolInitPromise = (async () => {
    console.log('[DB] Initializing Perplexta Pools...');
    if (effectiveCoreUrl) console.log(`[DB] Core Target: ${redactUrl(effectiveCoreUrl)}`);
    console.log(`[DB] Pool Sizes — Core: ${finalCoreMax}, Ledger: ${finalLedgerMax}, External: ${finalExternalMax}, Security: ${finalSecurityMax}, Media: ${finalMediaMax}`);

    if (!effectiveCoreUrl) {
      console.warn('[DB] ⚠️ DATABASE_URL missing. Operating in Degraded Mode.');
      rawPool = rawLedgerPool = rawExternalPool = rawSecurityPool = rawMediaPool = null;
      return;
    }

    try {
      validateDatabaseUrl(effectiveCoreUrl, 'DATABASE_URL');
      validateDatabaseUrl(finalLedgerUrl,   'LEDGER_DATABASE_URL');
      validateDatabaseUrl(finalExternalUrl, 'EXTERNAL_DATABASE_URL');
      validateDatabaseUrl(finalSecurityUrl, 'SECURITY_DATABASE_URL');
      validateDatabaseUrl(finalMediaUrl,    'MEDIA_DATABASE_URL');
    } catch (err: any) {
      console.error(`[DB] Validation failed: ${err.message}`);
      if (process.env.NODE_ENV === 'production' && effectiveCoreUrl) throw err;
      rawPool = rawLedgerPool = rawExternalPool = rawSecurityPool = rawMediaPool = null;
      return;
    }

    const prevPool = rawPool;
    const prevLedger = rawLedgerPool;
    const prevExternal = rawExternalPool;
    const prevSecurity = rawSecurityPool;
    const prevMedia = rawMediaPool;

    try {
      const normCoreUrl     = normalizeDatabaseUrl(effectiveCoreUrl);
      const normLedgerUrl   = normalizeDatabaseUrl(finalLedgerUrl);
      const normExternalUrl = normalizeDatabaseUrl(finalExternalUrl);
      const normSecurityUrl = normalizeDatabaseUrl(finalSecurityUrl);
      const normMediaUrl    = normalizeDatabaseUrl(finalMediaUrl);

      let newPool = patchPoolQuery(new Pool({
        connectionString: normCoreUrl,
        ...getBasePoolConfig(finalCoreMax, 15000, normCoreUrl),
      }));
      const newLedgerPool = normLedgerUrl === normCoreUrl ? newPool : patchPoolQuery(new Pool({
        connectionString: normLedgerUrl,
        ...getBasePoolConfig(finalLedgerMax, 15000, normLedgerUrl),
      }));
      const newExternalPool = normExternalUrl === normCoreUrl ? newPool : patchPoolQuery(new Pool({
        connectionString: normExternalUrl,
        ...getBasePoolConfig(finalExternalMax, 15000, normExternalUrl),
      }));
      const newSecurityPool = normSecurityUrl === normCoreUrl ? newPool : patchPoolQuery(new Pool({
        connectionString: normSecurityUrl,
        ...getBasePoolConfig(finalSecurityMax, 15000, normSecurityUrl),
      }));
      const newMediaPool = normMediaUrl === normCoreUrl ? newPool : patchPoolQuery(new Pool({
        connectionString: normMediaUrl,
        ...getBasePoolConfig(finalMediaMax, 15000, normMediaUrl),
      }));

      newPool.on('error', (e: any) => handleIdleClientError('core', e));
      if (newLedgerPool   !== newPool) newLedgerPool.on('error',   (e: any) => handleIdleClientError('ledger', e));
      if (newExternalPool !== newPool) newExternalPool.on('error', (e: any) => handleIdleClientError('external', e));
      if (newSecurityPool !== newPool) newSecurityPool.on('error', (e: any) => handleIdleClientError('security', e));
      if (newMediaPool    !== newPool) newMediaPool.on('error',    (e: any) => handleIdleClientError('media', e));

      console.log('[DB] Pools created. Verifying connectivity...');

      const verify = async (p: any, name: string, retries: number = 3): Promise<boolean> => {
        let delay = 1000;
        for (let attempt = 1; attempt <= retries; attempt++) {
          let fatalErr: string | null = null;
          const success = await new Promise<boolean>((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
              if (!settled) {
                settled = true;
                resolve(false);
              }
            }, 8000);
            p.query('SELECT 1')
              .then(() => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  resolve(true);
                }
              })
              .catch((e: any) => {
                if (!settled) {
                  settled = true;
                  clearTimeout(timer);
                  const msg = e?.message || String(e);
                  if (msg.includes('password authentication failed') || msg.includes('does not exist') || msg.includes('ECONNREFUSED') || isQuotaExceededError(e)) {
                    fatalErr = msg;
                  }
                  resolve(false);
                }
              });
          });

          if (success) return true;

          if (fatalErr) {
            console.warn(`[DB] ${name} connectivity check failed: ${fatalErr}.`);
            return false;
          }

          if (attempt < retries) {
            console.warn(`[DB] ${name} connectivity check failed on attempt ${attempt}/${retries}. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
          }
        }
        console.warn(`[DB] ${name} connectivity check failed after ${retries} attempts.`);
        return false;
      };

      let coreOk = await verify(newPool, 'Core DB', 2);
      if (!coreOk && process.env.EXTERNAL_DATABASE_URL && effectiveCoreUrl !== process.env.EXTERNAL_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.EXTERNAL_DATABASE_URL)) {
        console.warn(`[DB Failover] ⚠️ Core DB (${redactUrl(effectiveCoreUrl)}) failed check. Testing failover to active External database (${redactUrl(process.env.EXTERNAL_DATABASE_URL)})...`);
        const failoverUrl = normalizeDatabaseUrl(process.env.EXTERNAL_DATABASE_URL);
        const failoverPool = patchPoolQuery(new Pool({
          connectionString: failoverUrl,
          ...getBasePoolConfig(finalCoreMax, 15000, failoverUrl),
        }));
        failoverPool.on('error', (e: any) => handleIdleClientError('core-failover', e));
        const failoverOk = await verify(failoverPool, 'Failover Core DB', 2);
        if (failoverOk) {
          console.log('[DB Failover] ✅ Successfully activated healthy failover database as Core DB.');
          try { await newPool.end(); } catch {}
          newPool = failoverPool;
          effectiveCoreUrl = process.env.EXTERNAL_DATABASE_URL;
          coreOk = true;
        } else {
          try { await failoverPool.end(); } catch {}
        }
      }

      if (coreOk) {
        console.log('[DB] Core DB connection verified.');
        // Safe swap
        rawPool = newPool;
        rawLedgerPool = newLedgerPool;
        rawExternalPool = newExternalPool;
        rawSecurityPool = newSecurityPool;
        rawMediaPool = newMediaPool;

        currentCoreUrl = effectiveCoreUrl; currentLedgerUrl = finalLedgerUrl;
        currentExternalUrl = finalExternalUrl; currentSecurityUrl = finalSecurityUrl;
        currentMediaUrl = finalMediaUrl;
        currentCoreMax = finalCoreMax; currentLedgerMax = finalLedgerMax;
        currentExternalMax = finalExternalMax; currentSecurityMax = finalSecurityMax;
        currentMediaMax = finalMediaMax;
      } else {
        console.error('[DB] ❌ Core DB unreachable or data quota exceeded. Operating in Degraded Mode.');
        newPool.end().catch(() => {});
        if (newLedgerPool !== newPool) newLedgerPool.end().catch(() => {});
        if (newExternalPool !== newPool) newExternalPool.end().catch(() => {});
        if (newSecurityPool !== newPool) newSecurityPool.end().catch(() => {});
        if (newMediaPool !== newPool) newMediaPool.end().catch(() => {});
        resetPoolsToDegradedMode();
        throw new Error('Core DB is unreachable or data transfer quota exceeded.');
      }

      if (rawLedgerPool !== rawPool) {
        if (isPlaceholderOrUnreachableUrl(finalLedgerUrl) || !await verify(rawLedgerPool, 'Ledger DB', 2)) {
          if (process.env.STRICT_DB_SEGREGATION === 'true') {
            resetPoolsToDegradedMode();
            throw new Error('[DB FATAL] STRICT_DB_SEGREGATION is active: Ledger DB is unreachable or misconfigured. Silent fallback to Core pool is prohibited.');
          }
          console.warn('[DB ARCHITECTURE ALERT] ⚠️ Ledger DB unreachable or placeholder — falling back to Core pool. (To strictly forbid fallback, enable STRICT_DB_SEGREGATION=true).');
          const oldLedger = rawLedgerPool;
          rawLedgerPool = rawPool;
          currentLedgerUrl = currentCoreUrl;
          if (oldLedger && oldLedger !== rawPool) {
            try { await oldLedger.end(); } catch {}
          }
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'down' WHERE id = 'ledger'");
            } catch {}
          }
        } else {
          console.log('[DB] Ledger DB connection verified.');
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'healthy' WHERE id = 'ledger'");
            } catch {}
          }
        }
      } else { 
        if (process.env.STRICT_DB_SEGREGATION === 'true') {
          resetPoolsToDegradedMode();
          throw new Error('[DB FATAL] STRICT_DB_SEGREGATION is active: Ledger DB URL is identical to or sharing Core pool. Absolute separation is required.');
        }
        console.log('[DB] Ledger DB sharing Core pool (Unified Mode).'); 
      }

      if (rawExternalPool !== rawPool) {
        if (isPlaceholderOrUnreachableUrl(finalExternalUrl) || !await verify(rawExternalPool, 'External DB', 2)) {
          console.warn('[DB] External DB unreachable or placeholder — falling back to Core pool.');
          const oldExternal = rawExternalPool;
          rawExternalPool = rawPool;
          currentExternalUrl = currentCoreUrl;
          if (oldExternal && oldExternal !== rawPool) {
            try { await oldExternal.end(); } catch {}
          }
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'down' WHERE id = 'external'");
            } catch {}
          }
        } else {
          console.log('[DB] External DB connection verified.');
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'healthy' WHERE id = 'external'");
            } catch {}
          }
        }
      } else { console.log('[DB] External DB sharing Core pool.'); }

      if (rawSecurityPool !== rawPool) {
        if (isPlaceholderOrUnreachableUrl(finalSecurityUrl) || !await verify(rawSecurityPool, 'Security DB', 2)) {
          if (process.env.STRICT_DB_SEGREGATION === 'true') {
            resetPoolsToDegradedMode();
            throw new Error('[DB FATAL] STRICT_DB_SEGREGATION is active: Security DB is unreachable or misconfigured. Silent fallback to Core pool is prohibited.');
          }
          console.warn('[DB ARCHITECTURE ALERT] ⚠️ Security DB unreachable or placeholder — falling back to Core pool. (To strictly forbid fallback, enable STRICT_DB_SEGREGATION=true).');
          const oldSecurity = rawSecurityPool;
          rawSecurityPool = rawPool;
          currentSecurityUrl = currentCoreUrl;
          if (oldSecurity && oldSecurity !== rawPool) {
            try { await oldSecurity.end(); } catch {}
          }
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'down' WHERE id = 'security'");
            } catch {}
          }
        } else {
          console.log('[DB] Security DB connection verified.');
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'healthy' WHERE id = 'security'");
            } catch {}
          }
        }
      } else { 
        if (process.env.STRICT_DB_SEGREGATION === 'true') {
          resetPoolsToDegradedMode();
          throw new Error('[DB FATAL] STRICT_DB_SEGREGATION is active: Security DB URL is identical to or sharing Core pool. Absolute separation is required.');
        }
        console.log('[DB] Security DB sharing Core pool (Unified Mode).'); 
      }

      if (rawMediaPool !== rawPool) {
        if (isPlaceholderOrUnreachableUrl(finalMediaUrl) || !await verify(rawMediaPool, 'Media DB', 2)) {
          console.warn('[DB] Media DB unreachable or placeholder — falling back to Core pool.');
          const oldMedia = rawMediaPool;
          rawMediaPool = rawPool;
          currentMediaUrl = currentCoreUrl;
          if (oldMedia && oldMedia !== rawPool) {
            try { await oldMedia.end(); } catch {}
          }
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'down' WHERE id = 'media'");
            } catch {}
          }
        } else {
          console.log('[DB] Media DB connection verified.');
          if (rawPool) {
            try {
              await rawPool.query("UPDATE db_connections_registry SET status = 'healthy' WHERE id = 'media'");
            } catch {}
          }
        }
      } else { console.log('[DB] Media DB sharing Core pool.'); }

      console.log('[DB] Pool initialization complete.');
    } catch (err: any) {
      console.error('[DB] Critical error during pool creation:', err.message);
      resetPoolsToDegradedMode();
      console.warn('[DB] Database is unreachable or quota exceeded. Operating in Resilient Degraded Mode with safe in-memory fallbacks.');
    }
  })();

  try {
    await poolInitPromise;
  } finally {
    poolInitPromise = null;
  }
}


export async function synchronizePerplextaPoolsFromRegistry() {
  if (!pool) return;
  console.log('[DB] Checking for active remote database overrides...');

  try {
    await pool.query("UPDATE db_connections_registry SET is_active = false, host = NULL WHERE host = 'base'");

    const findCloudRemote = (...candidates: (string | undefined)[]) => {
      for (const c of candidates) {
        if (c && typeof c === 'string' && /^postgres(ql)?:\/\//.test(c)) {
          if (!isPlaceholderOrUnreachableUrl(c)) return c;
        }
      }
      return null;
    };
    const detectedCloudDb = findCloudRemote(
      process.env.DATABASE_URL,
      process.env.SECURITY_DATABASE_URL,
      process.env.LEDGER_DATABASE_URL,
      process.env.EXTERNAL_DATABASE_URL,
      process.env.MEDIA_DATABASE_URL
    );
    const rawDefaultCore  = currentCoreUrl || process.env.DATABASE_URL || '';
    const defaultCore     = (isPlaceholderOrUnreachableUrl(rawDefaultCore) || !rawDefaultCore) && detectedCloudDb ? detectedCloudDb : rawDefaultCore;
    const defaultLedger   = (process.env.LEDGER_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.LEDGER_DATABASE_URL)) ? process.env.LEDGER_DATABASE_URL : defaultCore;
    const defaultExternal = (process.env.EXTERNAL_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.EXTERNAL_DATABASE_URL)) ? process.env.EXTERNAL_DATABASE_URL : defaultCore;
    const defaultSecurity = (process.env.SECURITY_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.SECURITY_DATABASE_URL)) ? process.env.SECURITY_DATABASE_URL : defaultCore;
    const defaultMedia    = (process.env.MEDIA_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.MEDIA_DATABASE_URL)) ? process.env.MEDIA_DATABASE_URL : defaultCore;

    // Self-healing: If Core is cloud/remote, ensure registry rows do not store stale/unreachable placeholder URLs
    if (defaultCore && !isPlaceholderOrUnreachableUrl(defaultCore) && !isLocalhost(defaultCore)) {
      const encryptedCore = encrypt(defaultCore);
      const regRows = await pool.query(
        "SELECT id, connection_string, host FROM db_connections_registry WHERE id IN ('ledger', 'external', 'security', 'media')"
      );
      for (const row of regRows.rows) {
        let isStaleLocal = false;
        if (row.host === 'host' || row.host === 'base' || row.host === 'example.com') {
          isStaleLocal = true;
        } else if (row.connection_string) {
          try {
            const decrypted = decrypt(row.connection_string);
            if (decrypted && isPlaceholderOrUnreachableUrl(decrypted)) isStaleLocal = true;
          } catch {}
        }
        if (isStaleLocal) {
          await pool.query(
            "UPDATE db_connections_registry SET connection_string = $1, host = NULL, status = 'healthy' WHERE id = $2",
            [encryptedCore, row.id]
          ).catch(() => {});
        }
      }
    }

    const result = await pool.query(
      "SELECT * FROM db_connections_registry WHERE is_active = true AND id IN ('core','ledger','external','security','media')"
    );

    if (result.rows.length === 0) {
      console.log('[DB] No active registry overrides found.');
      const env = getPoolSizesFromEnv();

      if (
        currentCoreUrl     !== defaultCore     ||
        currentLedgerUrl   !== defaultLedger   ||
        currentExternalUrl !== defaultExternal ||
        currentSecurityUrl !== defaultSecurity ||
        currentMediaUrl    !== defaultMedia    ||
        currentCoreMax     !== env.coreMax     ||
        currentLedgerMax   !== env.ledgerMax   ||
        currentExternalMax !== env.externalMax ||
        currentSecurityMax !== env.securityMax ||
        currentMediaMax    !== env.mediaMax
      ) {
        console.log('[DB] Reverting pools to environment defaults.');
        await initializePerplextaPools(defaultCore, defaultLedger, defaultExternal, defaultSecurity, defaultMedia,
          env.coreMax, env.ledgerMax, env.externalMax, env.securityMax, env.mediaMax);
      } else {
        console.log('[DB] Already using environment defaults. No action needed.');
      }
      return;
    }

    const coreReg     = result.rows.find((r: any) => r.id === 'core');
    const ledgerReg   = result.rows.find((r: any) => r.id === 'ledger');
    const externalReg = result.rows.find((r: any) => r.id === 'external');
    const securityReg = result.rows.find((r: any) => r.id === 'security');
    const mediaReg    = result.rows.find((r: any) => r.id === 'media');

    const safeDecrypt = (val: any): string => {
      if (!val) return '';
      try {
        const res = decrypt(typeof val === 'string' ? val : String(val));
        return typeof res === 'string' ? res : String(res || '');
      } catch {
        return typeof val === 'string' ? val : String(val || '');
      }
    };

    const getUrlFromReg = (reg: any, fallback: string): string => {
      if (!reg) return fallback;
      if (reg.connection_string) {
        const decrypted = safeDecrypt(reg.connection_string);
        if (decrypted && decrypted.trim() !== '') return decrypted;
      }
      if (reg.host && reg.host !== 'base') {
        const u = encodeURIComponent(reg.username || '');
        const rawPass = safeDecrypt(reg.password);
        const p = rawPass ? encodeURIComponent(rawPass) : '';
        const port = reg.port || '5432';
        const connBase = `postgres://${u}${p ? `:${p}` : ''}@${reg.host}:${port}/${reg.db_name}`;
        return reg.ssl_mode && reg.ssl_mode !== 'disable' ? `${connBase}?sslmode=${reg.ssl_mode}` : connBase;
      }
      return fallback;
    };

    const envSizes        = getPoolSizesFromEnv();

    const coreUrl     = getUrlFromReg(coreReg,     defaultCore);
    const ledgerRaw   = getUrlFromReg(ledgerReg,   defaultLedger);
    const externalRaw = getUrlFromReg(externalReg, defaultExternal);
    const securityRaw = getUrlFromReg(securityReg, defaultSecurity);
    const mediaRaw    = getUrlFromReg(mediaReg,    defaultMedia);
    
    if (!coreUrl) {
      return;
    }

    if (coreUrl !== defaultCore) {
      try {
        validateDatabaseUrl(coreUrl, 'REGISTRY_CORE_URL');
      } catch (err: any) {
        return;
      }
    }

    const coreMax     = Number(coreReg?.pool_size)     || envSizes.coreMax;
    const ledgerMax   = Number(ledgerReg?.pool_size)   || envSizes.ledgerMax;
    const externalMax = Number(externalReg?.pool_size) || envSizes.externalMax;
    const securityMax = Number(securityReg?.pool_size) || envSizes.securityMax;
    const mediaMax    = Number(mediaReg?.pool_size)    || envSizes.mediaMax;

    if (
      coreUrl     === currentCoreUrl     && ledgerRaw   === currentLedgerUrl   &&
      externalRaw === currentExternalUrl && securityRaw === currentSecurityUrl &&
      mediaRaw    === currentMediaUrl    &&
      coreMax     === currentCoreMax     && ledgerMax   === currentLedgerMax   &&
      externalMax === currentExternalMax && securityMax === currentSecurityMax &&
      mediaMax    === currentMediaMax
    ) {
      console.log('[DB] In-memory pools already match active registry configuration.');
      return;
    }

    const testAndResolveUrl = async (id: string, url: string, defaultUrl: string): Promise<string> => {
      if (!url) return coreUrl;
      const normUrl = normalizeDatabaseUrl(url);
      const normCore = normalizeDatabaseUrl(coreUrl);
      if (normUrl === normCore) return coreUrl;

      // If core is remote and url is localhost/placeholder/unreachable, skip test and immediately use defaultUrl/coreUrl
      if (!isPlaceholderOrUnreachableUrl(normCore) && isPlaceholderOrUnreachableUrl(normUrl)) {
        if (pool) {
          try {
            const encryptedCore = encrypt(coreUrl);
            await pool.query(
              "UPDATE db_connections_registry SET connection_string = $1, host = NULL, status = 'healthy' WHERE id = $2",
              [encryptedCore, id]
            );
          } catch {}
        }
        return coreUrl;
      }

      let p: any = null;
      try {
        p = createInternalPool(url, 1, 15000);
        await p.query('SELECT 1');
        await p.end().catch(() => {});
        if (pool) {
          try {
            await pool.query("UPDATE db_connections_registry SET status = 'healthy' WHERE id = $1", [id]);
          } catch {}
        }
        return url;
      } catch (e: any) {
        if (p) {
          await p.end().catch(() => {});
        }
        console.warn(`[DB] Registry ${id} DB check failed: ${e.message}. Falling back to Core.`);
        if (pool) {
          try {
            const isFatalQuotaOrUnreachable = /quota|limit|exceeded|disabled|suspended|terminated|ECONNREFUSED|ENOTFOUND/i.test(e.message || '');
            if (isFatalQuotaOrUnreachable) {
              const encryptedCore = encrypt(coreUrl);
              await pool.query(
                "UPDATE db_connections_registry SET connection_string = $1, host = NULL, status = 'down' WHERE id = $2",
                [encryptedCore, id]
              );
            } else {
              await pool.query("UPDATE db_connections_registry SET status = 'down' WHERE id = $1", [id]);
            }
          } catch {}
        }
        return coreUrl;
      }
    };

    const ledgerUrl   = await testAndResolveUrl('ledger', ledgerRaw, defaultLedger);
    const externalUrl = await testAndResolveUrl('external', externalRaw, defaultExternal);
    const securityUrl = await testAndResolveUrl('security', securityRaw, defaultSecurity);
    const mediaUrl    = await testAndResolveUrl('media', mediaRaw, defaultMedia);

    if (
      coreUrl     === currentCoreUrl     && ledgerUrl   === currentLedgerUrl   &&
      externalUrl === currentExternalUrl && securityUrl === currentSecurityUrl &&
      mediaUrl    === currentMediaUrl    &&
      coreMax     === currentCoreMax     && ledgerMax   === currentLedgerMax   &&
      externalMax === currentExternalMax && securityMax === currentSecurityMax &&
      mediaMax    === currentMediaMax
    ) {
      console.log('[DB] In-memory pools already match active registry configuration.');
      return;
    }

    console.log('[DB] Registry connections verified. Swapping pools...');
    await initializePerplextaPools(coreUrl, ledgerUrl, externalUrl, securityUrl, mediaUrl,
      coreMax, ledgerMax, externalMax, securityMax, mediaMax);
    console.log('[DB] Pools synchronized with active registry configuration.');

  } catch (syncErr: any) {
    console.warn('[DB] Registry synchronization skipped:', syncErr.message);
  }
}

const poolLeakHistory: Record<string, number[]> = {
  core: [],
  ledger: [],
  external: [],
  security: [],
  media: []
};
const lastSampleTime: Record<string, number> = {
  core: 0,
  ledger: 0,
  external: 0,
  security: 0,
  media: 0
};

export function getPoolMetrics(p: any, name?: string) {
  if (!p) {
    return {
      total: 0,
      idle: 0,
      active: 0,
      waiting: 0,
      max: 0,
      utilization_percent: 0,
      backpressure_level: 'normal' as 'normal' | 'elevated' | 'critical' | 'saturated',
      saturated: false,
      available: false,
      connection_leak_risk: false
    };
  }
  const total = p.totalCount ?? 0;
  const idle = p.idleCount ?? 0;
  const waiting = p.waitingCount ?? 0;
  const max = Math.max(1, p.options?.max ?? 20);
  const active = Math.max(0, total - idle);
  const utilization_percent = Math.min(100, Math.round((active / max) * 100));

  // Dynamic backpressure thresholds relative to max pool capacity
  const queueThreshold = Math.max(2, Math.floor(max * 0.35));
  const saturationQueueThreshold = Math.max(3, Math.floor(max * 0.4));

  let backpressure_level: 'normal' | 'elevated' | 'critical' | 'saturated' = 'normal';
  let saturated = false;

  if (total >= max && waiting >= saturationQueueThreshold) {
    backpressure_level = 'saturated';
    saturated = true;
  } else if (waiting >= queueThreshold || utilization_percent >= 90) {
    backpressure_level = 'critical';
  } else if (waiting > 0 || utilization_percent >= 75) {
    backpressure_level = 'elevated';
  }

  let connection_leak_risk = false;
  if (name) {
    if (!poolLeakHistory[name]) poolLeakHistory[name] = [];
    if (!lastSampleTime[name]) lastSampleTime[name] = 0;

    const now = Date.now();
    if (now - lastSampleTime[name] > 3000) {
      lastSampleTime[name] = now;
      const history = poolLeakHistory[name];
      if (waiting <= 1) {
        history.push(active);
        if (history.length > 5) {
          history.shift();
        }
      }
    }
    const history = poolLeakHistory[name];
    const threshold = Math.max(3, Math.floor(max * 0.7));
    if (history.length >= 3 && history.every(v => v >= threshold)) {
      connection_leak_risk = true;
    }
  }

  return {
    total,
    idle,
    active,
    waiting,
    max,
    utilization_percent,
    backpressure_level,
    saturated,
    connection_leak_risk,
    available: true
  };
}

/**
 * Executes a query or database task on the external database pool with adaptive backpressure protection.
 * Prevents queue buildup during high concurrency spikes by enforcing queue timeouts and priority-based shedding.
 */
export async function executeWithExternalBackpressure<T>(
  task: (poolInstance: any) => Promise<T>,
  options?: {
    timeoutMs?: number;
    priority?: 'high' | 'normal' | 'low';
    fallback?: () => Promise<T>;
  }
): Promise<T> {
  const targetPool = rawExternalPool || rawPool || fallbackPool;
  const metrics = getPoolMetrics(targetPool, 'external');
  const priority = options?.priority || 'normal';
  const timeoutMs = options?.timeoutMs || 10000;

  // Shed low-priority background external tasks if pool is in critical or saturated backpressure state
  if ((metrics.saturated || metrics.backpressure_level === 'critical') && priority === 'low') {
    console.warn(`[External Backpressure] Low-priority external task shed due to pool saturation (active: ${metrics.active}/${metrics.max}, waiting: ${metrics.waiting}).`);
    if (options?.fallback) {
      return await options.fallback();
    }
    throw new Error('External database pool is under heavy backpressure. Task shed.');
  }

  // Wrap execution in a hard connection queue timeout to prevent connection starvation
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`External DB pool backpressure queue timeout after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      task(targetPool),
      timeoutPromise
    ]);
    return result;
  } catch (err: any) {
    if (options?.fallback && (metrics.saturated || /backpressure|timeout/i.test(err?.message || ''))) {
      console.warn(`[External Backpressure] Falling back to secondary handler for external pool query due to: ${err?.message}`);
      return await options.fallback();
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function forceReconnectPool(poolName: 'core' | 'ledger' | 'external' | 'security' | 'media'): Promise<void> {
  console.log(`[DB] Force reconnect requested for pool: ${poolName}`);
  const envSizes = getPoolSizesFromEnv();

  if (poolLeakHistory[poolName]) {
    poolLeakHistory[poolName] = [];
  }

  if (poolName === 'core') {
    let url = currentCoreUrl || process.env.DATABASE_URL;
    if (!url) throw new Error('Core DB URL not found');
    const oldPool = rawPool;
    let testPool = patchPoolQuery(new Pool({
      connectionString: url,
      ...getBasePoolConfig(currentCoreMax || envSizes.coreMax, 10000, url),
    }));
    testPool.on('error', (e: any) => handleIdleClientError('core', e));
    try {
      await testPool.query('SELECT 1');
      rawPool = testPool;
      if (oldPool && oldPool !== testPool) {
        await oldPool.end().catch((e: any) => console.error('[DB] Error ending old core pool:', e.message));
      }
      console.log('[DB] Core pool reconnected successfully.');
    } catch (err: any) {
      try { await testPool.end(); } catch {}
      const isQuota = isQuotaExceededError(err);
      if (isQuota && process.env.EXTERNAL_DATABASE_URL && url !== process.env.EXTERNAL_DATABASE_URL && !isPlaceholderOrUnreachableUrl(process.env.EXTERNAL_DATABASE_URL)) {
        console.warn(`[DB Failover] Primary Core DB exceeded quota. Reconnecting to failover database...`);
        const failoverUrl = normalizeDatabaseUrl(process.env.EXTERNAL_DATABASE_URL);
        const failoverPool = patchPoolQuery(new Pool({
          connectionString: failoverUrl,
          ...getBasePoolConfig(currentCoreMax || envSizes.coreMax, 10000, failoverUrl),
        }));
        failoverPool.on('error', (e: any) => handleIdleClientError('core-failover', e));
        try {
          await failoverPool.query('SELECT 1');
          currentCoreUrl = process.env.EXTERNAL_DATABASE_URL;
          rawPool = failoverPool;
          if (oldPool && oldPool !== failoverPool) {
            await oldPool.end().catch(() => {});
          }
          console.log('[DB Failover] ✅ Core pool reconnected successfully via active failover database.');
          return;
        } catch (failoverErr) {
          try { await failoverPool.end(); } catch {}
        }
      }
      resetPoolsToDegradedMode();
      if (isQuota) {
        console.warn(`[DB] Notice: Remote database account exceeded cloud quota. Running in Degraded Mode.`);
        return;
      }
      throw err;
    }
  } else if (poolName === 'ledger') {
    const url = currentLedgerUrl || process.env.LEDGER_DATABASE_URL || currentCoreUrl || process.env.DATABASE_URL;
    if (!url) throw new Error('Ledger DB URL not found');
    const oldPool = rawLedgerPool;
    if (url === (currentCoreUrl || process.env.DATABASE_URL)) {
      rawLedgerPool = rawPool;
      if (oldPool && oldPool !== rawPool) {
        await oldPool.end().catch(() => {});
      }
      return;
    }
    const testPool = patchPoolQuery(new Pool({
      connectionString: url,
      ...getBasePoolConfig(currentLedgerMax || envSizes.ledgerMax, 5000, url),
    }));
    testPool.on('error', (e: any) => handleIdleClientError('ledger', e));
    try {
      await testPool.query('SELECT 1');
      rawLedgerPool = testPool;
      if (oldPool && oldPool !== rawPool && oldPool !== testPool) {
        await oldPool.end().catch((e: any) => console.error('[DB] Error ending old ledger pool:', e.message));
      }
      console.log('[DB] Ledger pool reconnected successfully.');
    } catch (err) {
      try { await testPool.end(); } catch {}
      rawLedgerPool = rawPool;
      throw err;
    }
  } else if (poolName === 'external') {
    const url = currentExternalUrl || process.env.EXTERNAL_DATABASE_URL || currentCoreUrl || process.env.DATABASE_URL;
    if (!url) throw new Error('External DB URL not found');
    const oldPool = rawExternalPool;
    if (url === (currentCoreUrl || process.env.DATABASE_URL)) {
      rawExternalPool = rawPool;
      if (oldPool && oldPool !== rawPool) {
        await oldPool.end().catch(() => {});
      }
      return;
    }
    const testPool = patchPoolQuery(new Pool({
      connectionString: url,
      ...getBasePoolConfig(currentExternalMax || envSizes.externalMax, 5000, url),
    }));
    testPool.on('error', (e: any) => handleIdleClientError('external', e));
    try {
      await testPool.query('SELECT 1');
      rawExternalPool = testPool;
      if (oldPool && oldPool !== rawPool && oldPool !== testPool) {
        await oldPool.end().catch((e: any) => console.error('[DB] Error ending old external pool:', e.message));
      }
      console.log('[DB] External pool reconnected successfully.');
    } catch (err) {
      try { await testPool.end(); } catch {}
      rawExternalPool = rawPool;
      throw err;
    }
  } else if (poolName === 'security') {
    const url = currentSecurityUrl || process.env.SECURITY_DATABASE_URL || currentCoreUrl || process.env.DATABASE_URL;
    if (!url) throw new Error('Security DB URL not found');
    const oldPool = rawSecurityPool;
    if (url === (currentCoreUrl || process.env.DATABASE_URL)) {
      rawSecurityPool = rawPool;
      if (oldPool && oldPool !== rawPool) {
        await oldPool.end().catch(() => {});
      }
      return;
    }
    const testPool = patchPoolQuery(new Pool({
      connectionString: url,
      ...getBasePoolConfig(currentSecurityMax || envSizes.securityMax, 5000, url),
    }));
    testPool.on('error', (e: any) => handleIdleClientError('security', e));
    try {
      await testPool.query('SELECT 1');
      rawSecurityPool = testPool;
      if (oldPool && oldPool !== rawPool && oldPool !== testPool) {
        await oldPool.end().catch((e: any) => console.error('[DB] Error ending old security pool:', e.message));
      }
      console.log('[DB] Security pool reconnected successfully.');
    } catch (err) {
      try { await testPool.end(); } catch {}
      rawSecurityPool = rawPool;
      throw err;
    }
  } else if (poolName === 'media') {
    const url = currentMediaUrl || process.env.MEDIA_DATABASE_URL || currentCoreUrl || process.env.DATABASE_URL;
    if (!url) throw new Error('Media DB URL not found');
    const oldPool = rawMediaPool;
    if (url === (currentCoreUrl || process.env.DATABASE_URL)) {
      rawMediaPool = rawPool;
      if (oldPool && oldPool !== rawPool) {
        await oldPool.end().catch(() => {});
      }
      return;
    }
    const testPool = patchPoolQuery(new Pool({
      connectionString: url,
      ...getBasePoolConfig(currentMediaMax || envSizes.mediaMax, 5000, url),
    }));
    testPool.on('error', (e: any) => handleIdleClientError('media', e));
    try {
      await testPool.query('SELECT 1');
      rawMediaPool = testPool;
      if (oldPool && oldPool !== rawPool && oldPool !== testPool) {
        await oldPool.end().catch((e: any) => console.error('[DB] Error ending old media pool:', e.message));
      }
      console.log('[DB] Media pool reconnected successfully.');
    } catch (err) {
      try { await testPool.end(); } catch {}
      rawMediaPool = rawPool;
      throw err;
    }
  }
}

let healthCheckInterval: NodeJS.Timeout | null = null;
let poolSaturationGuardianInterval: NodeJS.Timeout | null = null;

export async function cleanupAbandonedConnections(poolInstance: any, poolName: string): Promise<number> {
  if (!poolInstance) return 0;
  try {
    // Aggressive stale-connection-reaper for orphaned or idle-in-transaction connections > 60 seconds
    const res = await poolInstance.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
        AND pid <> pg_backend_pid()
        AND (
          state = 'idle in transaction' 
          OR state = 'idle in transaction (aborted)'
        )
        AND state_change < current_timestamp - interval '60 seconds'
    `).catch(() => null);

    if (res && res.rowCount > 0) {
      console.warn(`[Stale-Connection-Reaper] ⚡ Terminated ${res.rowCount} orphaned/lingering >60s connections on pool '${poolName}' during high-concurrency spike.`);
      if (typeof poolInstance.emit === 'function') {
        poolInstance.emit('pool_saturation_event', {
          poolName,
          terminatedCount: res.rowCount,
          triggeredAt: new Date().toISOString(),
          metrics: getPoolMetrics(poolInstance, poolName)
        });
      }
      return res.rowCount;
    }
    return 0;
  } catch (err: any) {
    // Non-fatal if lacking superuser permissions on certain hosted database managed plans
    return 0;
  }
}

export function startPoolSaturationGuardian(intervalMs = 30000) {
  if (poolSaturationGuardianInterval) return;
  poolSaturationGuardianInterval = setInterval(async () => {
    if (!rawPool) return;

    const poolsToCheck: Array<{ name: 'core' | 'ledger' | 'external' | 'security' | 'media'; poolInstance: any }> = [
      { name: 'core', poolInstance: pool },
      { name: 'ledger', poolInstance: ledgerPool },
      { name: 'external', poolInstance: externalPool },
      { name: 'security', poolInstance: securityPool },
      { name: 'media', poolInstance: mediaPool },
    ];

    for (const { name, poolInstance } of poolsToCheck) {
      if (!poolInstance) continue;

      const metrics = getPoolMetrics(poolInstance, name);

      // 1. Terminate abandoned or lingering idle-in-transaction connections if waiting count or active connections are elevated
      if (metrics.waiting > 0 || metrics.active >= Math.floor(metrics.max * 0.8)) {
        await cleanupAbandonedConnections(poolInstance, name);
      }

      // 2. Analyze pool metrics for saturation, leaks, or sustained queue buildup
      if (metrics.saturated || metrics.backpressure_level === 'critical' || (metrics.connection_leak_risk && metrics.waiting > 1)) {
        console.warn(`[Pool Guardian] ⚠️ Pool '${name}' backpressure alert (level: ${metrics.backpressure_level}, waiting: ${metrics.waiting}, active: ${metrics.active}/${metrics.max}, utilization: ${metrics.utilization_percent}%). Initiating emergency pool recycling...`);
        try {
          await forceReconnectPool(name);
        } catch (reconnectErr: any) {
          console.error(`[Pool Guardian] Failed to recycle pool '${name}':`, reconnectErr?.message || reconnectErr);
        }
      }
    }
  }, intervalMs);

  if (typeof poolSaturationGuardianInterval.unref === 'function') {
    poolSaturationGuardianInterval.unref();
  }
}

export function startConnectionHealthCheck(intervalMs = 60000) {
  if (healthCheckInterval) return;
  healthCheckInterval = setInterval(async () => {
    if (!rawPool) return;

    const poolsToCheck: Array<{ name: 'core' | 'ledger' | 'external' | 'security' | 'media'; poolInstance: any }> = [
      { name: 'core', poolInstance: pool },
      { name: 'ledger', poolInstance: ledgerPool },
      { name: 'external', poolInstance: externalPool },
      { name: 'security', poolInstance: securityPool },
      { name: 'media', poolInstance: mediaPool },
    ];

    for (const { name, poolInstance } of poolsToCheck) {
      if (!poolInstance) continue;
      try {
        await poolInstance.query('SELECT 1');
      } catch (err: any) {
        const isQuota = isQuotaExceededError(err);
        if (isQuota) {
          console.warn(`[DB Health Check] Pool '${name}' quota limit reached on cloud provider. Triggering auto-failover...`);
        } else {
          console.warn(`[DB Health Check] Pool '${name}' failed health check ("${err?.message || err}"). Attempting automatic reconnection...`);
        }
        try {
          await forceReconnectPool(name);
        } catch (reconnectErr: any) {
          if (!isQuotaExceededError(reconnectErr)) {
            console.error(`[DB Health Check] Failed to reconnect pool '${name}':`, reconnectErr?.message || reconnectErr);
          }
        }
      }
    }
  }, intervalMs);

  if (typeof healthCheckInterval.unref === 'function') {
    healthCheckInterval.unref();
  }
}
