import { pool, mediaPool } from '../db/index.js';
import { tools } from '../config/constants.js';
import { encrypt } from '../utils/crypto.js';
import { syncProviderModelsInternal } from './ai.js';
import { invalidateApiKeysVaultCache, invalidateOrchestratorConfigCache } from '../db/queries.js';
import { ensureMapProvidersTable } from './mapProvidersService.js';
import { ensureLocationCacheTable } from './locationCache.js';

/**
 * Ensures the media_assets table exists on the media database (or core pool)
 * with all required columns, indexes, and correct public defaults.
 */
export async function ensureMediaAssetsTable(): Promise<void> {
  const targetMediaPool = mediaPool || pool;
  if (!targetMediaPool) return;

  try {
    await targetMediaPool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stored_path TEXT NOT NULL UNIQUE,
        original_filename TEXT NOT NULL,
        context TEXT NOT NULL DEFAULT 'general',
        format TEXT NOT NULL DEFAULT 'webp',
        width INT NOT NULL DEFAULT 0,
        height INT NOT NULL DEFAULT 0,
        size_bytes BIGINT NOT NULL DEFAULT 0,
        sha256_hash TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        user_id INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_data BYTEA
      );
    `);

    // Ensure columns exist if table was previously created with older schema
    await targetMediaPool.query(`
      ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS file_data BYTEA;
      ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
      ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS size_bytes BIGINT DEFAULT 0;
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context;
      ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check;
    `).catch(() => {});

    // Ensure indexes for fast query resolution
    await targetMediaPool.query(`
      CREATE INDEX IF NOT EXISTS idx_media_assets_stored_path ON media_assets(stored_path);
      CREATE INDEX IF NOT EXISTS idx_media_assets_sha256 ON media_assets(sha256_hash);
      CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
      CREATE INDEX IF NOT EXISTS idx_media_assets_context ON media_assets(context);
      CREATE INDEX IF NOT EXISTS idx_media_assets_is_public ON media_assets(is_public);
    `).catch(() => {});

    console.log('[DatabaseInitializer] Successfully ensured media_assets table and indexes in Media Database.');
  } catch (err: any) {
    console.warn('[DatabaseInitializer] Warning ensuring media_assets table:', err?.message || err);
  }
}

/**
 * Database Initializer Service
 * Ensures essential database tables (such as studio_workspaces, studio_snapshots, tool_orchestrator, map_providers, and api_keys_vault)
 * are initialized and synchronized before incoming requests arrive.
 */
export async function ensureDatabaseTables(): Promise<void> {
  try {
    const targetPool = pool;
    if (!targetPool) {
      console.warn('[DatabaseInitializer] Database pool not available for table initialization.');
      return;
    }

    // Ensure map providers & cached locations tables
    await ensureMapProvidersTable().catch(err => console.warn('[DatabaseInitializer] Map providers table notice:', err?.message));
    await ensureLocationCacheTable().catch(err => console.warn('[DatabaseInitializer] Location cache table notice:', err?.message));
    await ensureMediaAssetsTable().catch(err => console.warn('[DatabaseInitializer] Media assets table notice:', err?.message));

    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS studio_workspaces (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        framework_mode VARCHAR(50) DEFAULT 'html',
        files JSONB DEFAULT '{}',
        chat_history JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE studio_workspaces ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE studio_workspaces ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
      ALTER TABLE studio_workspaces ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

      CREATE TABLE IF NOT EXISTS studio_snapshots (
        id SERIAL PRIMARY KEY,
        workspace_id VARCHAR(255) REFERENCES studio_workspaces(id) ON DELETE CASCADE,
        version_name VARCHAR(255) NOT NULL,
        files JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DatabaseInitializer] Successfully ensured studio_workspaces and studio_snapshots tables.');

    // Ensure all tool definitions exist in tool_orchestrator
    for (const t of tools) {
      await targetPool.query(`
        INSERT INTO tool_orchestrator (tool_id, primary_provider, primary_model, is_active, task_description, task_description_ar)
        VALUES ($1, '', '', true, $2, $3)
        ON CONFLICT (tool_id) DO UPDATE SET
          is_active = true,
          task_description = EXCLUDED.task_description,
          task_description_ar = EXCLUDED.task_description_ar
      `, [t.id, t.desc, t.descAr]).catch(() => {});
    }

    // Auto-sync Google API Key from environment into api_keys_vault and sync models dynamically
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        await targetPool.query(`
          INSERT INTO api_keys_vault (provider, encrypted_key, is_active, models, model_list, updated_at)
          VALUES ('google', $1, true, '[]', '[]', CURRENT_TIMESTAMP)
          ON CONFLICT (provider) DO UPDATE SET
            encrypted_key = CASE 
              WHEN api_keys_vault.encrypted_key IS NULL OR api_keys_vault.encrypted_key = '' 
              THEN EXCLUDED.encrypted_key 
              ELSE api_keys_vault.encrypted_key 
            END,
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        `, [encrypt(geminiKey)]);
        invalidateApiKeysVaultCache();

        // Perform dynamic model discovery and tool auto-routing
        await syncProviderModelsInternal('google', geminiKey).catch((syncErr: any) => {
          console.warn('[DatabaseInitializer] Dynamic Google model sync warning:', syncErr?.message || syncErr);
        });
        invalidateOrchestratorConfigCache();
        console.log('[DatabaseInitializer] Successfully synchronized Google provider and tool orchestrator routes.');
      } catch (keyErr: any) {
        console.warn('[DatabaseInitializer] Google key sync notice:', keyErr?.message || keyErr);
      }
    }
  } catch (err: any) {
    console.error('[DatabaseInitializer] Failed to ensure core tables:', err?.message || err);
    throw err;
  }
}

