import { pool, ledgerPool, externalPool, securityPool, mediaPool } from '../index.js';
import type { DatabasePoolKey, SchemaTable, ForeignKeyRelation, QueryClient, MigrationMetrics } from './types.js';
import { TABLE_POOL_REGISTRY, hashStringToAdvisoryLockKey } from './types.js';
import { ensureColumnsBulk, ensureForeignKey, tableExists, columnExists, sanitizeForLogging, isValidIdentifier } from './helpers.js';

import {
  CORE_SCHEMA_TABLES,
  applyCoreColumnEnforcements,
  CORE_INDEXES,
  CORE_RELATIONS,
  applyCoreRelations,
  seedCoreDatabase
} from './core.schema.js';

import {
  LEDGER_SCHEMA_TABLES,
  applyLedgerColumnEnforcements,
  LEDGER_INDEXES,
  LEDGER_RELATIONS,
  applyLedgerRelations,
  seedLedgerDatabase
} from './ledger.schema.js';

import {
  EXTERNAL_SCHEMA_TABLES,
  applyExternalColumnEnforcements,
  EXTERNAL_INDEXES
} from './external.schema.js';

import {
  SECURITY_SCHEMA_TABLES,
  applySecurityColumnEnforcements,
  SECURITY_INDEXES
} from './security.schema.js';

import {
  MEDIA_SCHEMA_TABLES,
  applyMediaColumnEnforcements,
  MEDIA_INDEXES,
  applyMediaRelations
} from './media.schema.js';

import { runVersionedMigrations } from './versioned.js';
import { verifySchemaIntegrity, queryColumns, monitorDatabases } from './integrity.js';
import { setIo, getIo, runSystemMaintenance } from './maintenance.js';

// Re-export everything for consumers
export * from './types.js';
export * from './helpers.js';
export * from './core.schema.js';
export * from './ledger.schema.js';
export * from './external.schema.js';
export * from './security.schema.js';
export * from './media.schema.js';
export * from './versioned.js';
export * from './integrity.js';
export * from './maintenance.js';

// ===== PRODUCTION SAFETY: FORBID DROPS =====
export function assertNoDropInProduction(sql: string) {
  if (process.env.NODE_ENV === 'production' && /DROP\s+TABLE/i.test(sql)) {
    throw new Error('[Migrations] DROP TABLE is FORBIDDEN in production migrations');
  }
}
// ===========================================

/**
 * Checks if two pool objects connect to the same physical database.
 */
function isSameDb(poolA: any, poolB: any): boolean {
  if (!poolA || !poolB) return false;
  if (poolA === poolB) return true;
  const configA = poolA.options || {};
  const configB = poolB.options || {};
  if (configA.connectionString && configB.connectionString) {
    return configA.connectionString === configB.connectionString;
  }
  return (
    configA.host === configB.host &&
    configA.port === configB.port &&
    configA.database === configB.database
  );
}

/**
 * Initializes the database tables, columns, indexes, and relations across all 4 pools.
 */
export async function initDb(
  mode: 'additive' | 'full' | 'scratch' = 'additive',
  targetPoolParam?: any,
  targetLedgerPoolParam?: any,
  targetExternalPoolParam?: any,
  targetSecurityPoolParam?: any,
  targetMediaPoolParam?: any
) {
  const targetPool = targetPoolParam || pool;
  const targetLedgerPool = targetLedgerPoolParam || ledgerPool || targetPool;
  const targetExternalPool = targetExternalPoolParam || externalPool || targetPool;
  const targetSecurityPool = targetSecurityPoolParam || securityPool || targetPool;
  const targetMediaPool = targetMediaPoolParam || mediaPool || targetPool;

  if (!targetPool) {
    console.warn('[initDb] Skipping: No database pool provided or active.');
    return;
  }

  // 1. Core Schema Tables (base tables first, then dependent tables in parallel)
  const baseTableNames = new Set(['users', 'plans', 'gpu_providers', 'chats', 'bulletin_pages', 'bulletin_ads', 'support_tickets']);
  const baseTables = CORE_SCHEMA_TABLES.filter(t => baseTableNames.has(t.name));
  const dependentTables = CORE_SCHEMA_TABLES.filter(t => !baseTableNames.has(t.name));

  for (const table of baseTables) {
    try {
      await targetPool.query(table.query);
    } catch (tblErr: any) {
      console.warn(`[initDb Core Base Table ${table.name}] Notice:`, tblErr?.message || tblErr);
    }
  }

  await Promise.all(
    dependentTables.map(table =>
      targetPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Core Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 2. Ledger Schema Tables
  const ledgerBaseTableNames = new Set(['wallets', 'economy_settings']);
  const ledgerBaseTables = LEDGER_SCHEMA_TABLES.filter(t => ledgerBaseTableNames.has(t.name));
  const ledgerDependentTables = LEDGER_SCHEMA_TABLES.filter(t => !ledgerBaseTableNames.has(t.name));

  for (const table of ledgerBaseTables) {
    try {
      await targetLedgerPool.query(table.query);
    } catch (tblErr: any) {
      console.warn(`[initDb Ledger Base Table ${table.name}] Notice:`, tblErr?.message || tblErr);
    }
  }

  await Promise.all(
    ledgerDependentTables.map(table =>
      targetLedgerPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Ledger Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 3. External Schema Tables
  await Promise.all(
    EXTERNAL_SCHEMA_TABLES.map(table =>
      targetExternalPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb External Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 4. Security Schema Tables
  await Promise.all(
    SECURITY_SCHEMA_TABLES.map(table =>
      targetSecurityPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Security Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 4b. Media Schema Tables
  await Promise.all(
    MEDIA_SCHEMA_TABLES.map(table =>
      targetMediaPool.query(table.query).catch((tblErr: any) => {
        console.warn(`[initDb Media Table ${table.name}] Notice:`, tblErr?.message || tblErr);
      })
    )
  );

  // 5. Apply Column Enforcements across all pools (skip in scratch mode as tables were freshly created with complete schema)
  if (mode !== 'scratch') {
    await applyCoreColumnEnforcements(targetPool);
    await applyLedgerColumnEnforcements(targetLedgerPool);
    await applyExternalColumnEnforcements(targetExternalPool);
    await applySecurityColumnEnforcements(targetSecurityPool);
    await applyMediaColumnEnforcements(targetMediaPool);
  }

  // 6. Apply Seeds
  await seedCoreDatabase(targetPool, targetLedgerPool);
  await seedLedgerDatabase(targetLedgerPool);

  // 7. Apply Indexes across all pools (sequential per pool to prevent deadlocks)
  for (const idxQuery of CORE_INDEXES) {
    await targetPool.query(idxQuery).catch((idxErr: any) => {
      console.warn('[initDb Core Index] Notice:', idxErr?.message || idxErr);
    });
  }

  for (const idxQuery of LEDGER_INDEXES) {
    await targetLedgerPool.query(idxQuery).catch((idxErr: any) => {
      console.warn('[initDb Ledger Index] Notice:', idxErr?.message || idxErr);
    });
  }

  for (const idxQuery of EXTERNAL_INDEXES) {
    await targetExternalPool.query(idxQuery).catch((idxErr: any) => {
      console.warn('[initDb External Index] Notice:', idxErr?.message || idxErr);
    });
  }

  for (const idxQuery of SECURITY_INDEXES) {
    await targetSecurityPool.query(idxQuery).catch((idxErr: any) => {
      console.warn('[initDb Security Index] Notice:', idxErr?.message || idxErr);
    });
  }

  for (const idxQuery of MEDIA_INDEXES) {
    await targetMediaPool.query(idxQuery).catch((idxErr: any) => {
      console.warn('[initDb Media Index] Notice:', idxErr?.message || idxErr);
    });
  }

  // 8. Apply Relations
  await applyCoreRelations(targetPool);
  await applyLedgerRelations(targetLedgerPool);
  await applyMediaRelations(targetMediaPool);
}

/**
 * Main Database Migration Runner with Advisory Locks, Versioned Migrations, and Integrity Audit.
 */
export async function runDatabaseMigrations(targetId?: string, type: 'additive' | 'scratch' = 'additive') {
  if (!pool) {
    console.warn('[Migrations] Skipping: No core database pool active.');
    return { success: false, reason: 'No pool' };
  }

  const migrationMetrics: MigrationMetrics = {
    total: 0,
    successful: 0,
    failed: 0,
    totalDuration: 0,
    perMigration: new Map()
  };

  const client = await pool.connect();
  let ledgerClient: any = null;
  let externalClient: any = null;
  let securityClient: any = null;
  let mediaClient: any = null;

  const connectToPool = async (p: any, poolName: string) => {
    if (!p || p === pool || isSameDb(pool, p)) return null;
    try {
      const c = await p.connect();
      try {
        await c.query('SELECT 1');
        return c;
      } catch (testErr: any) {
        c.release();
        console.warn(`[Migrations] Optional ${poolName} DB pool test query failed: ${testErr.message}. Using Core pool fallback.`);
        return null;
      }
    } catch (err: any) {
      console.warn(`[Migrations] Optional ${poolName} DB pool unreachable: ${err.message}. Using Core pool fallback.`);
      return null;
    }
  };

  const safeQueryClient = async (targetClient: any, fallbackClient: any, queryStr: string, params?: unknown[]) => {
    assertNoDropInProduction(queryStr);
    const activeClient = targetClient || fallbackClient;
    try {
      return await activeClient.query(queryStr, params);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (/not queryable|connection error|closed|terminated/i.test(msg) && activeClient !== fallbackClient) {
        console.warn(`[Migrations] Target client encountered error (${msg}), falling back to core client.`);
        return fallbackClient.query(queryStr, params);
      }
      throw err;
    }
  };

  ledgerClient = await connectToPool(ledgerPool, 'Ledger');
  externalClient = await connectToPool(externalPool, 'External');
  securityClient = await connectToPool(securityPool, 'Security');
  mediaClient = await connectToPool(mediaPool, 'Media');

  let lockAcquired = false;

  try {
    // Attempt non-blocking advisory lock with retry polling to handle transient restart overlaps
    const maxLockRetries = 10;
    for (let attempt = 1; attempt <= maxLockRetries; attempt++) {
      const lockRes = await client.query('SELECT pg_try_advisory_lock(74635291)').catch((err: any) => {
        console.warn('[Migrations] Advisory lock acquisition attempt error:', err.message);
        return { rows: [{ pg_try_advisory_lock: false }] };
      });

      if (lockRes.rows?.[0]?.pg_try_advisory_lock === true) {
        lockAcquired = true;
        break;
      }

      if (attempt < maxLockRetries) {
        await new Promise((res) => setTimeout(res, 400));
      }
    }

    if (!lockAcquired) {
      console.warn('[Migrations] Global advisory lock (74635291) is currently held by another active process. Skipping redundant concurrent run.');
      return {
        success: true,
        target: targetId || 'all',
        type,
        totalMigrations: 0,
        skipped: true,
        reason: 'Concurrent migration execution in progress'
      };
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        checksum VARCHAR(64),
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS checksum VARCHAR(64)`).catch(() => {});
    await client.query(`ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_security_audit (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        sql_state VARCHAR(20),
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_migration_security_audit_created_at ON migration_security_audit(created_at)`);

    try {
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS security_alerts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          type VARCHAR(100) NOT NULL,
          severity VARCHAR(50) DEFAULT 'medium',
          description TEXT,
          metadata JSONB DEFAULT '{}',
          is_resolved BOOLEAN DEFAULT false,
          ip_address VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER,
          admin_email VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          target_resource VARCHAR(100),
          details JSONB DEFAULT '{}',
          ip_address VARCHAR(100),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS registered_agents (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR(255) UNIQUE NOT NULL,
          client_secret VARCHAR(255),
          api_key_hash VARCHAR(255),
          client_name VARCHAR(255) NOT NULL,
          identity_type VARCHAR(50) DEFAULT 'agent',
          credential_type VARCHAR(50) DEFAULT 'client_credentials',
          redirect_uris TEXT[],
          jwks_uri VARCHAR(500),
          user_agent VARCHAR(500),
          signature_keys JSONB,
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          user_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (securityClient && securityClient !== client) {
        try {
          // Safe transition (F-05): Transfer existing compliance and audit records before cleaning duplicates
          for (const tbl of ['token_blacklist', 'security_alerts', 'admin_audit_logs', 'registered_agents']) {
            const hasCoreTable = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'`, [tbl]).catch(() => ({ rowCount: 0 }));
            if (hasCoreTable.rowCount > 0) {
              const countCore = await client.query(`SELECT COUNT(*) FROM "${tbl}"`).catch(() => ({ rows: [{ count: '0' }] }));
              const total = parseInt(countCore.rows[0]?.count || '0', 10);
              if (total > 0) {
                console.log(`[Migrations] Transferring ${total} legacy records for ${tbl} from Core DB to Security DB...`);
                const rows = await client.query(`SELECT * FROM "${tbl}"`);
                for (const row of rows.rows) {
                  const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
                  const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
                  const values = Object.values(row);
                  await securityClient.query(`INSERT INTO "${tbl}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values).catch(() => {});
                }
                const countSec = await securityClient.query(`SELECT COUNT(*) FROM "${tbl}"`).catch(() => ({ rows: [{ count: '0' }] }));
                console.log(`[Migrations] Transferred ${tbl}. Security DB now has ${countSec.rows[0]?.count} records.`);
              }
            }
          }
          await client.query(`DROP TABLE IF EXISTS token_blacklist, security_alerts, admin_audit_logs, registered_agents CASCADE;`);
          console.log('[Migrations] Successfully cleaned up 4 legacy duplicate security tables from Core DB.');
        } catch (dropErr: any) {
          console.warn('[Migrations] Warning during Core DB duplicate table cleanup:', dropErr?.message || dropErr);
        }
      }
    } catch (error) {
      console.warn('[Migrations] Failed to inspect/initialize security database tables:', error instanceof Error ? error.message : 'Unknown error');
    }

    if (type === 'scratch') {
      console.warn(`[Migrations] RUNNING IN SCRATCH MODE FOR TARGET: ${targetId || 'ALL'}`);

      await client.query("SET lock_timeout = '5s'").catch(() => {});

      const coreTables = CORE_SCHEMA_TABLES.map(t => t.name);
      const ledgerTables = LEDGER_SCHEMA_TABLES.map(t => t.name);
      const externalTables = EXTERNAL_SCHEMA_TABLES.map(t => t.name);
      const securityTables = SECURITY_SCHEMA_TABLES.map(t => t.name);
      const mediaTables = MEDIA_SCHEMA_TABLES.map(t => t.name);

      if (!targetId || targetId === 'all' || targetId === 'core') {
        if (coreTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Core tables...');
          const dropList = coreTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(client, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Core tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Core tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'ledger') {
        if (ledgerTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Ledger tables...');
          const dropList = ledgerTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(ledgerClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Ledger tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Ledger tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'external') {
        if (externalTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping External tables...');
          const dropList = externalTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(externalClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping External tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: External tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'security') {
        if (securityTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Security tables...');
          const dropList = securityTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(securityClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Security tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Security tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'media') {
        if (mediaTables.length > 0) {
          console.log('[Migrations] Scratch: Dropping Media tables...');
          const dropList = mediaTables.map(t => `"${t}"`).join(', ');
          await safeQueryClient(mediaClient, client, `DROP TABLE IF EXISTS ${dropList} CASCADE`).catch((err: any) => {
            console.warn('[Migrations] Notice dropping Media tables:', err?.message || err);
          });
          console.log('[Migrations] Scratch: Media tables dropped.');
        }
      }
      if (!targetId || targetId === 'all' || targetId === 'core') {
        await client.query('DELETE FROM migration_history').catch(() => {});
      } else if (targetId === 'ledger') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'ledger|wallet|kyc|economy|payout|coupon|stripe'").catch(() => {});
      } else if (targetId === 'external') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'blog|article'").catch(() => {});
      } else if (targetId === 'security') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'security|token_blacklist|audit|agent'").catch(() => {});
      } else if (targetId === 'media') {
        await client.query("DELETE FROM migration_history WHERE migration_name ~* 'media|canvas|audio'").catch(() => {});
      }

      console.log('[Migrations] Scratch: Re-initializing schemas via initDb...');
      await initDb('scratch', pool, ledgerPool || pool, externalPool || pool, securityPool || pool, mediaPool || pool);
      console.log('[Migrations] Scratch: Schema re-initialization completed.');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS db_connections_registry (
        id VARCHAR(50) PRIMARY KEY,
        provider VARCHAR(50),
        type VARCHAR(20) DEFAULT 'postgres',
        host VARCHAR(255),
        port VARCHAR(10),
        db_name VARCHAR(100),
        username VARCHAR(100),
        password TEXT,
        connection_string TEXT,
        ssl_mode VARCHAR(20) DEFAULT 'disable',
        pool_size INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'unknown',
        last_checked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (type !== 'scratch') {
      console.log('[Migrations] Running dynamic schema auto-repair...');
      await initDb('additive', pool, ledgerPool, externalPool, securityPool, mediaPool);
    }

    // Run all versioned migrations (v1 - v117)
    await runVersionedMigrations(
      client,
      externalClient,
      ledgerClient,
      securityClient,
      mediaClient,
      pool,
      ledgerPool || pool,
      externalPool || pool,
      securityPool || pool,
      mediaPool || pool,
      migrationMetrics
    );

    if (migrationMetrics.total > 0) {
      const slowest = [...migrationMetrics.perMigration.entries()]
        .sort((a, b) => b[1].duration - a[1].duration)
        .slice(0, 5);
      console.log('[Migrations] 📊 Migration Metrics:', {
        total: migrationMetrics.total,
        successful: migrationMetrics.successful,
        failures: migrationMetrics.failed,
        totalDuration: `${(migrationMetrics.totalDuration / 1000).toFixed(2)}s`,
        averageDuration: `${(migrationMetrics.totalDuration / migrationMetrics.total / 1000).toFixed(2)}s`,
        slowest: slowest.map(([name, data]) => ({ name, duration: `${(data.duration / 1000).toFixed(2)}s` }))
      });
    }

    // Verify integrity across all pools
    await verifySchemaIntegrity();

    return {
      success: true,
      target: targetId || 'all',
      type,
      totalMigrations: migrationMetrics.total
    };
  } catch (error) {
    const err = error as Error;
    console.error('[CRITICAL] Database Migration failed:', err.message);
    if (process.env.NODE_ENV === 'production') throw err;
  } finally {
    if (lockAcquired) {
      await client.query('SELECT pg_advisory_unlock(74635291)').catch(() => {});
    }
    client.release();
    if (ledgerClient) ledgerClient.release();
    if (externalClient) externalClient.release();
    if (securityClient) securityClient.release();
    if (mediaClient) mediaClient.release();
  }
}
