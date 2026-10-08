import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { QueryClient, WrappedClient, MigrationMetrics } from "./types.js";
import { TABLE_POOL_REGISTRY, hashStringToAdvisoryLockKey } from "./types.js";
import { ensureColumnsBulk, ensureForeignKey, tableExists, columnExists, sanitizeForLogging, isValidIdentifier, safeQueryClient } from "./helpers.js";
import { encrypt, decrypt } from "../../utils/crypto.js";
import { syncAllContentSeoMetadata } from "../../services/seoSync.js";
import { syncMasterCategoriesToDatabase } from "../../services/system.js";

export async function runVersionedMigrations(
  client: any,
  externalClient: any,
  ledgerClient: any,
  securityClient: any,
  mediaClient: any,
  targetPool: QueryClient,
  targetLedgerPool: QueryClient,
  targetExternalPool: QueryClient,
  targetSecurityPool: QueryClient,
  targetMediaPool: QueryClient,
  migrationMetrics: MigrationMetrics = { total: 0, successful: 0, failed: 0, totalDuration: 0, perMigration: new Map() }
) {
  if (!migrationMetrics) {
    migrationMetrics = { total: 0, successful: 0, failed: 0, totalDuration: 0, perMigration: new Map() };
  }
  const extTarget = externalClient || client;
  const ledgerTarget = ledgerClient || client;
  const secTarget = securityClient || client;
  const mediaTarget = mediaClient || client;

  const existingMigrationsRes = await client.query("SELECT migration_name FROM migration_history").catch(() => ({ rows: [] }));
  const existingMigrations = new Set(existingMigrationsRes.rows.map((r: any) => r.migration_name));

  const runVersioned = async (name: string, description: string, fn: (tx: WrappedClient, ledgerTx: WrappedClient) => Promise<void>) => {
    if (existingMigrations.has(name)) {
      return;
    }
    const lockKey = hashStringToAdvisoryLockKey(name);
    const startTime = Date.now();
    console.log(`[Migrations] Applying ${name}: ${description}...`);
    
    await client.query("BEGIN");
    if (ledgerClient) await ledgerClient.query("BEGIN");
    if (externalClient) await externalClient.query("BEGIN");
    if (securityClient) await securityClient.query("BEGIN");
    if (mediaClient) await mediaClient.query("BEGIN");
    try {
      const lockRes = await client.query(`SELECT pg_try_advisory_xact_lock($1)`, [lockKey]).catch(() => ({ rows: [] }));
      if (lockRes.rows?.[0]?.pg_try_advisory_xact_lock === false) {
        throw new Error(`[Migrations] Advisory transaction lock unavailable for ${name}. Another process is migrating.`);
      }
        const doubleCheck = await client.query("SELECT 1 FROM migration_history WHERE migration_name = $1", [name]);
        if (doubleCheck.rows.length > 0) {
          existingMigrations.add(name);
          if (ledgerClient) await ledgerClient.query("COMMIT");
          if (externalClient) await externalClient.query("COMMIT");
          if (securityClient) await securityClient.query("COMMIT");
          if (mediaClient) await mediaClient.query("COMMIT");
          await client.query("COMMIT");
          return;
        }

        const findClientForQuery = (sql: string, params?: unknown[]) => {
          const queryLower = sql.toLowerCase();
          for (const [tableName, targetPoolType] of Object.entries(TABLE_POOL_REGISTRY)) {
            if (targetPoolType === "core") continue;
            const regex = new RegExp(`\\b${tableName}\\b`, "i");
            if (regex.test(queryLower) || (params && params.some(p => typeof p === "string" && p.toLowerCase() === tableName))) {
              switch (targetPoolType) {
                case "ledger":
                  return ledgerClient || client;
                case "external":
                  return externalClient || client;
                case "security":
                  return securityClient || client;
                case "media":
                  return mediaClient || client;
              }
            }
          }
          return client;
        };

        const wrappedClient: WrappedClient = {
          release: () => {},
          query: async (text: string | { text: string }, params?: unknown[]) => {
            let sqlString = "";
            if (typeof text === "string") {
              sqlString = text;
            } else if (text && typeof text === "object" && text.text) {
              sqlString = text.text;
            }
            if (process.env.NODE_ENV === 'production' && /DROP\s+TABLE/i.test(sqlString)) {
              throw new Error(`[Migrations] DROP TABLE is FORBIDDEN in production migrations: ${sqlString.slice(0, 100)}`);
            }
            const targetClient = findClientForQuery(sqlString, params);
            return targetClient.query(text, params);
          }
        };

        const wrappedLedgerClient: WrappedClient = {
          release: () => {},
          query: async (text: string | { text: string }, params?: unknown[]) => {
            let sqlString = "";
            if (typeof text === "string") {
              sqlString = text;
            } else if (text && typeof text === "object" && text.text) {
              sqlString = text.text;
            }
            if (process.env.NODE_ENV === 'production' && /DROP\s+TABLE/i.test(sqlString)) {
              throw new Error(`[Migrations] DROP TABLE is FORBIDDEN in production migrations: ${sqlString.slice(0, 100)}`);
            }
            const targetClient = findClientForQuery(sqlString, params);
            const finalClient = targetClient === client ? (ledgerClient || client) : targetClient;
            return finalClient.query(text, params);
          }
        };

        await fn(wrappedClient, wrappedLedgerClient);
        const checksum = crypto.createHash('sha256').update(fn.toString()).digest('hex');
        await client.query(
          "INSERT INTO migration_history (migration_name, checksum, executed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (migration_name) DO UPDATE SET checksum = EXCLUDED.checksum",
          [name, checksum]
        ).catch(() => {
          return client.query("INSERT INTO migration_history (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING", [name]);
        });
        existingMigrations.add(name);
        if (ledgerClient) await ledgerClient.query("COMMIT");
        if (externalClient) await externalClient.query("COMMIT");
        if (securityClient) await securityClient.query("COMMIT");
        if (mediaClient) await mediaClient.query("COMMIT");
        await client.query("COMMIT");
        const duration = Date.now() - startTime;
        migrationMetrics.total++;
        migrationMetrics.successful++;
        migrationMetrics.totalDuration += duration;
        migrationMetrics.perMigration.set(name, { duration, status: "success" });
        console.log(`[Migrations] Successfully applied ${name} (${duration}ms).`);
      } catch (error) {
        await client.query("ROLLBACK");
        if (ledgerClient) await ledgerClient.query("ROLLBACK");
        if (externalClient) await externalClient.query("ROLLBACK");
        if (securityClient) await securityClient.query("ROLLBACK");
        if (mediaClient) await mediaClient.query("ROLLBACK");
        const err = error as Error & { code?: string };
        console.error(`[Migrations] Failed to apply ${name}:`, err.message);
        migrationMetrics.total++;
        migrationMetrics.failed++;
        const duration = Date.now() - startTime;
        migrationMetrics.perMigration.set(name, { duration, status: "failed" });
        try {
          await client.query(`
            INSERT INTO migration_security_audit (migration_name, status, error_message, sql_state, details)
            VALUES ($1, 'failed', $2, $3, $4)
          `, [
            name,
            err.message || "Unknown error",
            err.code || null,
            JSON.stringify(sanitizeForLogging({ stack: err.stack, phase: "runVersioned" }))
          ]);
        } catch {
          console.error("[Migrations] Failed to write failure audit log");
        }
        throw error;
      }
  };

    // Placeholder: Initial schema is created declaratively via createCoreTables() during bootstrapping.
    await runVersioned('v1_core_schema', 'Initial core database schema', async () => {});

    await runVersioned('v2_additive_columns', 'Ensuring idempotent columns and constraints', async (tx) => {
      await ensureColumnsBulk(tx, 'users', {
        last_active_at: { type: 'TIMESTAMP' },
        theme: { type: 'VARCHAR(10)', default: `'dark'` },
        updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        referred_by: { type: 'INTEGER' },
        kyc_submitted_at: { type: 'TIMESTAMP' },
        kyc_rejection_reason: { type: 'TEXT' },
        memory: { type: 'TEXT' },
        support_notes: { type: 'TEXT' },
        password_hash: { type: 'TEXT' },
        status: { type: 'VARCHAR(20)', default: `'active'` },
        avatar: { type: 'TEXT' },
        referral_code: { type: 'VARCHAR(6)' },
        email_notifications: { type: 'BOOLEAN', default: 'true' }
      });

      await ensureColumnsBulk(tx, 'chats', {
        updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        context_summary: { type: 'TEXT' }
      });

      await ensureColumnsBulk(tx, 'messages', {
        thinking_steps: { type: 'JSONB', default: `'[]'` },
        citations: { type: 'JSONB', default: `'[]'` },
        follow_ups: { type: 'JSONB', default: `'[]'` },
        feedback: { type: 'SMALLINT', default: '0' },
        generation_time: { type: 'NUMERIC' },
        is_pinned: { type: 'BOOLEAN', default: 'false' },
        updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      });

      await ensureColumnsBulk(tx, 'api_keys_vault', {
        updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        model_list: { type: 'JSONB', default: `'[]'` },
        last_reset_date: { type: 'DATE', default: 'CURRENT_DATE' },
        protocol_config: { type: 'JSONB', default: `'{}'` }
      });

      await ensureColumnsBulk(tx, 'subscriptions', {
        stripe_customer_id: { type: 'VARCHAR(255)' },
        stripe_subscription_id: { type: 'VARCHAR(255)' },
        billing_period: { type: 'VARCHAR(20)', default: `'monthly'` },
        last_period_start: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      });

      await ensureColumnsBulk(tx, 'user_files', {
        file_type: { type: 'VARCHAR(100)' },
        file_size: { type: 'INTEGER' },
        file_url: { type: 'TEXT' },
        file_content: { type: 'TEXT' },
        mime_type: { type: 'VARCHAR(100)' },
        file_version: { type: 'INTEGER', default: '1' }
      });

      await ensureColumnsBulk(tx, 'system_settings', {
        stripe_status: { type: 'VARCHAR(20)', default: `'pending'` },
        stripe_last_verified_at: { type: 'TIMESTAMP' },
        stripe_secret_key: { type: 'TEXT' },
        stripe_publishable_key: { type: 'TEXT' },
        stripe_webhook_secret: { type: 'TEXT' },
        stripe_live_mode: { type: 'BOOLEAN', default: 'false' },
        paypal_client_id: { type: 'TEXT' },
        paypal_client_secret: { type: 'TEXT' },
        paypal_mode: { type: 'VARCHAR(20)', default: `'sandbox'` },
        paypal_status: { type: 'VARCHAR(50)', default: `'pending'` },
        paypal_last_verified_at: { type: 'TIMESTAMP' },
        image_prompt_pref_threshold: { type: 'INTEGER', default: '150' },
        blocked_paths: { type: 'TEXT', default: `''` },
        seo_site_name_en: { type: 'TEXT' },
        seo_site_name_ar: { type: 'TEXT' },
        logo_light_url: { type: 'TEXT' },
        font_loading_config: { type: 'TEXT' },
        font_config_ar: { type: 'TEXT' },
        font_config_en: { type: 'TEXT' },
        bulletin_ad_daily_price: { type: 'NUMERIC(10,2)', default: '5.00' },
        live_gift_commission_percent: { type: 'INTEGER', default: '30' },
        sidebar_ad_impression_price: { type: 'NUMERIC(10,4)', default: '0.0100' },
        sidebar_ad_click_price: { type: 'NUMERIC(10,2)', default: '0.10' },
        sidebar_ads_enabled: { type: 'BOOLEAN', default: 'true' },
        require_2fa_for_economy: { type: 'BOOLEAN', default: 'false' }
      });

      await ensureColumnsBulk(tx, 'tool_orchestrator', {
        fallback_1_provider: { type: 'VARCHAR(50)' },
        fallback_1_model: { type: 'VARCHAR(255)' },
        fallback_2_provider: { type: 'VARCHAR(50)' },
        fallback_2_model: { type: 'VARCHAR(255)' },
        fallback_3_provider: { type: 'VARCHAR(50)' },
        fallback_3_model: { type: 'VARCHAR(255)' },
        max_history_depth: { type: 'INTEGER', default: '16' },
        protocol_config: { type: 'JSONB', default: `'{}'` },
        cost_per_1k_input_tokens: { type: 'INTEGER', default: '5' },
        cost_per_1k_output_tokens: { type: 'INTEGER', default: '15' }
      });

      await ensureColumnsBulk(tx, 'system_broadcasts', {
        admin_id: { type: 'INTEGER' },
        broadcast_type: { type: 'VARCHAR(50)', default: `'system'` },
        type: { type: 'VARCHAR(50)', default: `'system'` },
        target_group: { type: 'VARCHAR(50)', default: `'all'` },
        target_role: { type: 'VARCHAR(20)', default: `'all'` },
        status: { type: 'VARCHAR(20)', default: `'completed'` },
        sent_count: { type: 'INTEGER', default: '0' }
      });

      await ensureColumnsBulk(tx, 'system_logs', {
        type: { type: 'VARCHAR(50)', default: `'system'` },
        details: { type: 'JSONB', default: `'{}'` }
      });

      await ensureColumnsBulk(tx, 'security_alerts', {
        type: { type: 'VARCHAR(50)', default: `'security'` }
      });

      await ensureColumnsBulk(tx, 'plans', {
        plan_type: { type: 'VARCHAR(100)', default: `'user'` }
      });

      await ensureColumnsBulk(tx, 'registered_agents', {
        user_id: { type: 'INTEGER' },
        api_key_hash: { type: 'VARCHAR(255)' },
        permissions: { type: 'JSONB', default: `'[]'` },
        is_active: { type: 'BOOLEAN', default: 'true' }
      });

      await ensureColumnsBulk(tx, 'referral_invitations', {
        referred_email: { type: 'VARCHAR(255)' },
        invite_code: { type: 'VARCHAR(100)' }
      });

      await ensureColumnsBulk(tx, 'route_seo_settings', {
        alt_text_ar: { type: 'TEXT' },
        alt_text_en: { type: 'TEXT' }
      });

      await ensureColumnsBulk(tx, 'asset_metadata', {
        visual_summary: { type: 'TEXT' },
        ai_analysis_raw: { type: 'JSONB', default: `'{}'` }
      });

      await ensureColumnsBulk(tx, 'bulletin_ads', {
        ad_format: { type: 'VARCHAR(50)', default: `'post'` },
        quick_questions: { type: 'JSONB', default: `'[]'` },
        feeling: { type: 'VARCHAR(255)' },
        tagged_users: { type: 'JSONB', default: `'[]'` },
        is_ai_generated: { type: 'BOOLEAN', default: 'false' },
        has_whatsapp_button: { type: 'BOOLEAN', default: 'false' }
      });

      await ensureColumnsBulk(tx, 'bulletin_ad_comments', {
        parent_id: { type: 'INTEGER' }
      });
    });

    await runVersioned('v3_ledger_schema_v1', 'Initial Ledger DB schema and hardened transactions', async (tx, ledgerTx) => {
      const ledgerTarget = ledgerTx || tx;

      await ensureColumnsBulk(ledgerTarget, 'wallets', {
        balance: { type: 'DECIMAL(15,4)', default: '0.0000' },
        updated_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        referral_activated: { type: 'BOOLEAN', default: 'false' }
      });

      await ensureColumnsBulk(ledgerTarget, 'ledger_transactions', {
        user_id: { type: 'INTEGER' },
        status: { type: 'VARCHAR(20)', default: `'success'` },
        metadata: { type: 'JSONB', default: `'{}'` },
        ip_address: { type: 'VARCHAR(45)' },
        is_hidden: { type: 'BOOLEAN', default: 'false' }
      });

      await ensureColumnsBulk(ledgerTarget, 'economy_settings', {
        referral_activation_min_deposit: { type: 'NUMERIC(10,2)', default: `'10.00'` },
        crypto_address: { type: 'TEXT' },
        bank_name: { type: 'VARCHAR(255)' },
        bank_recipient: { type: 'VARCHAR(255)' },
        bank_iban: { type: 'VARCHAR(255)' },
        bank_swift: { type: 'VARCHAR(100)' },
        paypal_email: { type: 'VARCHAR(255)' }
      });
    });

    await runVersioned('v4_registry_seed', 'Seeding database connections', async (tx) => {
      const coreUrl = process.env.DATABASE_URL;
      const ledgerUrl = process.env.LEDGER_DATABASE_URL;

      if (coreUrl) {
        const coreEncrypted = encrypt(coreUrl);
        await tx.query(
          `INSERT INTO db_connections_registry (id, provider, connection_string, is_active) VALUES ('core', 'core', $1, true) ON CONFLICT (id) DO NOTHING`,
          [coreEncrypted]
        );
      }
      if (ledgerUrl) {
        const ledgerEncrypted = encrypt(ledgerUrl);
        await tx.query(
          `INSERT INTO db_connections_registry (id, provider, connection_string, is_active) VALUES ('ledger', 'ledger', $1, true) ON CONFLICT (id) DO NOTHING`,
          [ledgerEncrypted]
        );
      }

      const externalUrl = process.env.EXTERNAL_DATABASE_URL || coreUrl;
      const securityUrl = process.env.SECURITY_DATABASE_URL || coreUrl;

      if (externalUrl) {
        const externalEncrypted = encrypt(externalUrl);
        await tx.query(
          `INSERT INTO db_connections_registry (id, provider, connection_string, is_active) VALUES ('external', 'external', $1, true) ON CONFLICT (id) DO NOTHING`,
          [externalEncrypted]
        );
      }
      if (securityUrl) {
        const securityEncrypted = encrypt(securityUrl);
        await tx.query(
          `INSERT INTO db_connections_registry (id, provider, connection_string, is_active) VALUES ('security', 'security', $1, true) ON CONFLICT (id) DO NOTHING`,
          [securityEncrypted]
        );
      }
    });

    await runVersioned('v5_orchestrator_cleanup', 'Cleaning up legacy orchestrator columns', async (tx) => {
      const dropColumns = [
        'fallback1_provider', 'fallback1_model',
        'fallback2_provider', 'fallback2_model',
        'fallback3_provider', 'fallback3_model'
      ];
      for (const col of dropColumns) {
        await tx.query(`ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS "${col}"`);
      }

      const dropUsageConstraints = ['user_usage_tool_id_key', 'user_usage_usage_date_key'];
      for (const constr of dropUsageConstraints) {
        await tx.query(`ALTER TABLE user_usage DROP CONSTRAINT IF EXISTS "${constr}"`);
      }
    });

    await runVersioned('v6_coupon_system_expansion', 'Adding detailed coupon tracking', async (tx, ledgerTx) => {
      const ledgerTarget = ledgerTx || tx;
      await ensureColumnsBulk(ledgerTarget, 'coupons', {
        usage_limit: { type: 'INTEGER', default: '0' },
        usage_count: { type: 'INTEGER', default: '0' },
        is_active: { type: 'BOOLEAN', default: 'true' }
      });
    });

    await runVersioned('v7_finance_expansion', 'Adding deposit requests', async (tx, ledgerTx) => {
      const ledgerTarget = ledgerTx || tx;
      await ledgerTarget.query(`
        CREATE TABLE IF NOT EXISTS deposit_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          amount NUMERIC(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          method VARCHAR(50) NOT NULL,
          proof_url TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          rejection_reason TEXT,
          admin_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v9_route_seo_metadata_table', 'Creating route_seo_metadata table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS route_seo_metadata (
          route_path VARCHAR(255) PRIMARY KEY,
          title_ar TEXT,
          title_en TEXT,
          description_ar TEXT,
          description_en TEXT,
          og_image_url TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v8_security_hardening', 'Enforcing encryption on all sensitive system settings', async (tx) => {
      const settingsRes = await tx.query('SELECT id, stripe_secret_key, stripe_publishable_key, stripe_webhook_secret FROM system_settings');
      const encryptionPattern = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;

      for (const row of settingsRes.rows) {
        let needsUpdate = false;
        const updates: Record<string, string> = {};

        const keysToCheck = ['stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret'];
        for (const key of keysToCheck) {
          const val = row[key];
          if (val && val.trim() !== '' && !encryptionPattern.test(val)) {
            updates[key] = encrypt(val);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await tx.query(
            `UPDATE system_settings 
             SET stripe_publishable_key = COALESCE($1, stripe_publishable_key),
                 stripe_secret_key = COALESCE($2, stripe_secret_key),
                 stripe_webhook_secret = COALESCE($3, stripe_webhook_secret),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4`,
            [
              updates['stripe_publishable_key'] ?? null,
              updates['stripe_secret_key'] ?? null,
              updates['stripe_webhook_secret'] ?? null,
              row.id
            ]
          );
        }
      }
    });

    await runVersioned('v9_filler_reconciliation', 'Reconciling migration index sequence', async (tx) => {
      await tx.query(`SELECT 1`);
    });

    await runVersioned('v10_economy_refactor', 'Removing redundant economy columns from system_settings', async (tx, ledgerTx) => {
      const dropCols = [
        'points_per_dollar', 'min_payout_usd', 'min_deposit_usd',
        'referral_bonus_percent', 'welcome_bonus_points', 'referral_bonus_points',
        'conversion_rate', 'min_withdrawal_cents', 'referral_activation_min_deposit'
      ];
      for (const col of dropCols) {
        await tx.query(`ALTER TABLE system_settings DROP COLUMN IF EXISTS "${col}"`);
      }
    });

    await runVersioned('v11_ensure_baseline_tables', 'Ensuring critical tables exist', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS password_resets_pkey ON password_resets(id)`);

      await safeQueryClient(securityClient, client, `
        CREATE TABLE IF NOT EXISTS token_blacklist (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v12_token_blacklist_security_hardening', 'Hardening token_blacklist indexes', async () => {
      await safeQueryClient(securityClient, client, `CREATE UNIQUE INDEX IF NOT EXISTS token_blacklist_pkey ON token_blacklist(id)`);
      await safeQueryClient(securityClient, client, `CREATE UNIQUE INDEX IF NOT EXISTS token_blacklist_token_key ON token_blacklist(token)`);
      await safeQueryClient(securityClient, client, `CREATE INDEX IF NOT EXISTS idx_token_blacklist_active_expires ON token_blacklist(expires_at)`);
    });

    await runVersioned('v13_payment_gateways_expansion', 'Adding payment gateway fields', async (tx, ledgerTx) => {
      const ledgerTarget = ledgerTx || tx;

      await ensureColumnsBulk(ledgerTarget, 'economy_settings', {
        crypto_address: { type: 'TEXT' },
        bank_name: { type: 'VARCHAR(255)' },
        bank_recipient: { type: 'VARCHAR(255)' },
        bank_iban: { type: 'VARCHAR(255)' },
        bank_swift: { type: 'VARCHAR(100)' },
        paypal_email: { type: 'VARCHAR(255)' }
      });

      const encAddress = encrypt(process.env.DEFAULT_CRYPTO_ADDRESS || '');
      const encBankName = encrypt(process.env.DEFAULT_BANK_NAME || '');
      const encBankRecipient = encrypt(process.env.DEFAULT_BANK_RECIPIENT || '');
      const encBankIBAN = encrypt(process.env.DEFAULT_BANK_IBAN || '');
      const encBankSwift = encrypt(process.env.DEFAULT_BANK_SWIFT || '');
      const encPaypalEmail = encrypt(process.env.DEFAULT_PAYPAL_EMAIL || '');

      await ledgerTarget.query(`
        UPDATE economy_settings 
        SET 
          crypto_address = COALESCE(crypto_address, $1),
          bank_name = COALESCE(bank_name, $2),
          bank_recipient = COALESCE(bank_recipient, $3),
          bank_iban = COALESCE(bank_iban, $4),
          bank_swift = COALESCE(bank_swift, $5),
          paypal_email = COALESCE(paypal_email, $6)
      `, [encAddress, encBankName, encBankRecipient, encBankIBAN, encBankSwift, encPaypalEmail]);
    });

    await runVersioned('v14_paypal_settings', 'Adding PayPal credential columns', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        paypal_client_id: { type: 'TEXT' },
        paypal_client_secret: { type: 'TEXT' },
        paypal_mode: { type: 'VARCHAR(20)', default: `'sandbox'` },
        paypal_status: { type: 'VARCHAR(50)', default: `'pending'` },
        paypal_last_verified_at: { type: 'TIMESTAMP' }
      });
    });

    await runVersioned('v15_transaction_hide_column', 'Adding is_hidden column to ledger_transactions', async (tx, ledgerTx) => {
      const ledgerTarget = ledgerTx || tx;
      await ensureColumnsBulk(ledgerTarget, 'ledger_transactions', {
        is_hidden: { type: 'BOOLEAN', default: 'false' }
      });
    });

    await runVersioned('v16_user_referral_code', 'Adding unique referral_code to users', async (tx) => {
      await ensureColumnsBulk(tx, 'users', {
        referral_code: { type: 'VARCHAR(6)' }
      });

      await tx.query(`
        WITH RECURSIVE generate_codes AS (
          SELECT 
            id,
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6)) as code,
            1 as attempt
          FROM users 
          WHERE referral_code IS NULL OR referral_code = ''
          
          UNION ALL
          
          SELECT 
            u.id,
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT || u.id::TEXT), 1, 6)),
            gc.attempt + 1
          FROM users u
          JOIN generate_codes gc ON u.id = gc.id
          WHERE gc.attempt < 10 
            AND EXISTS (
              SELECT 1 FROM users u2 
              WHERE u2.referral_code = gc.code 
                AND u2.id != gc.id
            )
        ),
        unique_codes AS (
          SELECT DISTINCT ON (id) id, code
          FROM generate_codes
          ORDER BY id, attempt
        )
        UPDATE users u
        SET referral_code = uc.code
        FROM unique_codes uc
        WHERE u.id = uc.id 
          AND (u.referral_code IS NULL OR u.referral_code = '')
      `);

      await tx.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)');
    });

    await runVersioned('v17_messages_schema_update', 'Ensuring tracking and generation metadata columns', async (tx) => {
      await ensureColumnsBulk(tx, 'messages', {
        thinking_steps: { type: 'JSONB', default: `'[]'` },
        citations: { type: 'JSONB', default: `'[]'` },
        follow_ups: { type: 'JSONB', default: `'[]'` },
        feedback: { type: 'SMALLINT', default: '0' },
        generation_time: { type: 'NUMERIC' },
        is_pinned: { type: 'BOOLEAN', default: 'false' }
      });
    });

    await runVersioned('v18_user_sessions_schema', 'Creating user_sessions table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_token TEXT UNIQUE NOT NULL,
          ip_address VARCHAR(100),
          user_agent TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);
    });

    await runVersioned('v19_seo_upgrade', 'Ensuring SEO columns', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        seo_description_en: { type: 'TEXT' },
        seo_description_ar: { type: 'TEXT' },
        keywords_en: { type: 'TEXT' },
        keywords_ar: { type: 'TEXT' },
        site_description_en: { type: 'TEXT' },
        site_description_ar: { type: 'TEXT' }
      });
    });

    await runVersioned('v20_seo_image', 'Adding seo_image_url column', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        seo_image_url: { type: 'TEXT' }
      });
    });

    await runVersioned('v21_google_site_verification', 'Adding google_site_verification column', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        google_site_verification: { type: 'VARCHAR(255)' }
      });
    });

    await runVersioned('v22_forum_and_blog_schema', 'Created Forum and Blog core tables', async (tx) => {
      const extTarget = externalClient || tx;

      try {
        await extTarget.query(`
          CREATE TABLE IF NOT EXISTS blog_articles (
            id SERIAL PRIMARY KEY,
            author_id INTEGER NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            content_en TEXT NOT NULL,
            content_ar TEXT NOT NULL,
            image_url TEXT,
            category_en VARCHAR(100) NOT NULL,
            category_ar VARCHAR(100) NOT NULL,
            views INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e: any) {
        console.warn('[Migration v22] Notice on blog_articles table:', e?.message || e);
      }

      try {
        await extTarget.query(`
          CREATE TABLE IF NOT EXISTS blog_comments (
            id SERIAL PRIMARY KEY,
            article_id INTEGER NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (e: any) {
        console.warn('[Migration v22] Notice on blog_comments table:', e?.message || e);
      }
    });

    await runVersioned('v23_blog_ratings_and_sharing', 'Creating blog ratings', async (tx) => {
      const extTarget = externalClient || tx;
      await extTarget.query(`
        CREATE TABLE IF NOT EXISTS blog_ratings (
          id SERIAL PRIMARY KEY,
          article_id INTEGER NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (article_id, user_id)
        )
      `);
    });

    await runVersioned('v24_seed_blog_platform_data', 'Seeding blog articles', async (tx) => {
      // Seed articles removed to rely solely on user published content
    });

    await runVersioned('v25_marketplace_schema', 'Created Marketplace core tables', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS marketplace_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title_en VARCHAR(255) NOT NULL,
          title_ar VARCHAR(255) NOT NULL,
          description_en TEXT NOT NULL,
          description_ar TEXT NOT NULL,
          price NUMERIC(15, 2) NOT NULL,
          category_en VARCHAR(100) NOT NULL,
          category_ar VARCHAR(100) NOT NULL,
          image_url TEXT,
          status VARCHAR(20) DEFAULT 'approved',
          views INTEGER DEFAULT 0,
          contact_link TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v26_marketplace_seed_extension_v2', 'Added third marketplace item', async (tx) => {
      // Seed marketplace items removed to rely solely on user published content
    });

    await runVersioned('v27_update_forum_categories_for_pioneers_and_developers', 'Upgrading forum categories', async (tx) => {
    });

    await runVersioned('v28_refine_forum_categories_names', 'Shortening forum categories names', async (tx) => {
    });

    await runVersioned('v30_forum_category_colors_differentiation', 'Applying distinctive colors to forum categories', async (tx) => {
    });

    await runVersioned('v31_marketplace_purchases_and_referrals', 'Enabling real transactional purchases', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS marketplace_purchases (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
          price_paid NUMERIC(10, 2) NOT NULL,
          license_type VARCHAR(50) DEFAULT 'standard',
          referrer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          commission_paid NUMERIC(10, 2) DEFAULT 0.00,
          download_token VARCHAR(100) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await tx.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user ON marketplace_purchases(user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_item ON marketplace_purchases(item_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_referrer ON marketplace_purchases(referrer_id)`);
    });

    await runVersioned('v32_marketplace_referral_percent', 'Adding referral_percent to marketplace_items', async (tx) => {
      await ensureColumnsBulk(tx, 'marketplace_items', {
        referral_percent: { type: 'NUMERIC(5,2)' }
      });
    });

    await runVersioned('v33_marketplace_highlights_and_licenses', 'Adding highlight_tag and license_type', async (tx) => {
      await ensureColumnsBulk(tx, 'marketplace_items', {
        highlight_tag: { type: 'VARCHAR(50)' },
        license_type: { type: 'VARCHAR(50)' }
      });
    });

    await runVersioned('v34_default_language_en', 'Changing default user language to English', async (tx) => {
      await tx.query("ALTER TABLE users ALTER COLUMN language SET DEFAULT 'en'");
    });

    await runVersioned('v35_logo_light_theme', 'Adding logo_light_url column', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        logo_light_url: { type: 'TEXT' }
      });
    });

    await runVersioned('v36_agent_auth', 'Creating registered_agents table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS registered_agents (
          id SERIAL PRIMARY KEY,
          client_id VARCHAR(255) UNIQUE NOT NULL,
          client_secret VARCHAR(255) NOT NULL,
          client_name VARCHAR(255),
          identity_type VARCHAR(50) DEFAULT 'agent',
          credential_type VARCHAR(50) DEFAULT 'client_credentials',
          redirect_uris TEXT[],
          jwks_uri VARCHAR(500),
          user_agent VARCHAR(500),
          signature_keys JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v37_agent_auth_user_id', 'Adding user_id to registered_agents', async (tx) => {
      await ensureColumnsBulk(tx, 'registered_agents', {
        user_id: { type: 'INTEGER' }
      });
    });

    await runVersioned('v38_admin_audit_logs', 'Creating admin_audit_logs table', async (tx) => {
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
    });

    await runVersioned('v39_ensure_plan_type_column', 'Ensure plan_type column exists', async (tx) => {
      await ensureColumnsBulk(tx, 'plans', {
        plan_type: { type: 'VARCHAR(100)', default: `'user'` }
      });
    });

    await runVersioned('v40_video_resources_table', 'Creating video_resources table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS video_resources (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          chat_id INTEGER,
          message_id INTEGER,
          file_url TEXT NOT NULL,
          prompt TEXT,
          provider VARCHAR(100),
          model VARCHAR(100),
          duration INTEGER,
          aspect_ratio VARCHAR(50),
          resolution VARCHAR(50),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_video_resources_chat_id ON video_resources(chat_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_video_resources_user_id ON video_resources(user_id)`);
    });

    await runVersioned('v41_hash_existing_tokens', 'Clearing token_blacklist for SHA-256 migration', async (tx) => {
      await tx.query(`DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP`);
      await tx.query(`DELETE FROM token_blacklist`);
      console.log('[Migrations] token_blacklist cleared for SHA-256 migration.');
    });

    await runVersioned('v42_performance_audit_additive', 'Adding critical performance indexes and blog tables', async (tx) => {
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)`);

      if (await tableExists(tx, 'marketplace_items')) {
        await tx.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status)`);
        await tx.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_items_user_id ON marketplace_items(user_id)`);
      }

      const extTarget = externalClient || client;
      try {
        await extTarget.query(`CREATE INDEX IF NOT EXISTS idx_blog_comments_article_id ON blog_comments(article_id)`);
      } catch (e: any) {
        console.warn('[Migrations v42] Notice on blog_comments setup:', e?.message || e);
      }

      const lTarget = ledgerClient || client;
      await lTarget.query(`CREATE INDEX IF NOT EXISTS idx_ledger_tx_user_id ON ledger_transactions(user_id)`);
      await lTarget.query(`CREATE INDEX IF NOT EXISTS idx_ledger_tx_status ON ledger_transactions(status)`);

      const sTarget = securityClient || client;
      await sTarget.query(`CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id)`);
      await sTarget.query(`CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(is_resolved)`);
      await sTarget.query(`CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at)`);
    });

    await runVersioned('v43_forum_fk_integrity', 'Adding foreign keys to forum tables', async (tx) => {
    });

    await runVersioned('v44_encrypt_registry_passwords', 'Encrypting plaintext passwords in db_connections_registry', async (tx) => {
      const encryptionPattern = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;
      const rows = await tx.query('SELECT id, password FROM db_connections_registry WHERE password IS NOT NULL');
      
      const updates = rows.rows.filter((row: any) => row.password && !encryptionPattern.test(row.password));
      
      if (updates.length > 0) {
        // Use a single query with CASE to update multiple rows
        const values: any[] = [];
        let sql = 'UPDATE db_connections_registry SET password = CASE id ';
        
        updates.forEach((row: any, index: number) => {
          sql += `WHEN $${index * 2 + 1} THEN $${index * 2 + 2} `;
          values.push(row.id, encrypt(row.password));
        });
        
        sql += 'END WHERE id IN (' + updates.map((_: any, i: number) => `$${i * 2 + 1}`).join(',') + ')';
        await tx.query(sql, values);
      }
    });

    await runVersioned('v45_orchestrator_max_history_depth', 'Adding max_history_depth and memory_limit_per_user', async (tx) => {
      await ensureColumnsBulk(tx, 'tool_orchestrator', {
        max_history_depth: { type: 'INTEGER', default: '16' }
      });
      await ensureColumnsBulk(tx, 'system_settings', {
        memory_limit_per_user: { type: 'INTEGER', default: '50' }
      });
    });

    await runVersioned('v46_protocol_config', 'Adding protocol_config columns', async (tx) => {
      await ensureColumnsBulk(tx, 'tool_orchestrator', {
        protocol_config: { type: 'JSONB', default: `'{}'` }
      });
      await ensureColumnsBulk(tx, 'api_keys_vault', {
        protocol_config: { type: 'JSONB', default: `'{}'` }
      });
      await tx.query(`UPDATE tool_orchestrator SET protocol_config = '{}' WHERE protocol_config IS NULL`);
      await tx.query(`UPDATE api_keys_vault SET protocol_config = '{}' WHERE protocol_config IS NULL`);
    });

    await runVersioned('v47_image_prompt_pref_threshold', 'Adding image_prompt_pref_threshold', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        image_prompt_pref_threshold: { type: 'INTEGER', default: '150' }
      });
    });

    await runVersioned('v48_marketplace_reviews_and_ratings', 'Creating marketplace_reviews table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS marketplace_reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_reviews_user_item ON marketplace_reviews(user_id, item_id)`);
    });

    await runVersioned('v49_forum_categories_control', 'Adding post limit constraints to forum categories', async (tx) => {
    });

    await runVersioned('v50_forum_images_and_ratings', 'Adding cover image support to forum posts', async (tx) => {
    });

    await runVersioned('v51_dynamic_seo_blocking', 'Adding blocked_paths column', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        blocked_paths: { type: 'TEXT', default: `''` }
      });
    });

    await runVersioned('v52_token_based_billing', 'Adding cost_per_1k_input_tokens and cost_per_1k_output_tokens', async (tx) => {
      await ensureColumnsBulk(tx, 'tool_orchestrator', {
        cost_per_1k_input_tokens: { type: 'INTEGER', default: '5' },
        cost_per_1k_output_tokens: { type: 'INTEGER', default: '15' }
      });
    });

    await runVersioned('v53_referral_invitations', 'Ensuring referral_invitations table exists', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS referral_invitations (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'sent',
          subject VARCHAR(255),
          body TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_referral_invitations_referrer ON referral_invitations(referrer_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_referral_invitations_email ON referral_invitations(email)`);
    });

    await runVersioned('v54_referral_invitations_fields_v2', 'Adding referred_email and invite_code columns', async (tx) => {
      await ensureColumnsBulk(tx, 'referral_invitations', {
        referred_email: { type: 'VARCHAR(255)' },
        invite_code: { type: 'VARCHAR(100)' }
      });
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_referral_invitations_referred_email ON referral_invitations(referred_email)`);
    });

    await runVersioned('v55_seo_site_name_fields', 'Adding seo_site_name columns', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        seo_site_name_en: { type: 'TEXT' },
        seo_site_name_ar: { type: 'TEXT' }
      });
    });

    await runVersioned('v56_shared_snapshots', 'Creating shared_snapshots table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS shared_snapshots (
          id VARCHAR(100) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          title TEXT,
          content TEXT NOT NULL,
          model_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          views_count INTEGER DEFAULT 0
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_shared_snapshots_user_id ON shared_snapshots(user_id)`);
    });

    await runVersioned('v57_permanently_drop_forum_tables', 'Dropping forum tables', async (tx) => {
      const extTarget = externalClient || tx;
      await extTarget.query(`DROP TABLE IF EXISTS forum_post_ratings CASCADE`);
      await extTarget.query(`DROP TABLE IF EXISTS forum_comments CASCADE`);
      await extTarget.query(`DROP TABLE IF EXISTS forum_posts CASCADE`);
      await extTarget.query(`DROP TABLE IF EXISTS forum_categories CASCADE`);
    });

    await runVersioned('v58_gifts_and_ads_pricing', 'Adding gift_catalog table and ad pricing', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS gift_catalog (
          id SERIAL PRIMARY KEY,
          name_ar VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          icon TEXT NOT NULL,
          points INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await ensureColumnsBulk(tx, 'system_settings', {
        bulletin_ad_daily_price: { type: 'NUMERIC(10,2)', default: '5.00' },
        live_gift_commission_percent: { type: 'INTEGER', default: '30' },
        sidebar_ad_impression_price: { type: 'NUMERIC(10,4)', default: '0.0100' },
        sidebar_ad_click_price: { type: 'NUMERIC(10,2)', default: '0.10' }
      });

      const giftsCount = await tx.query('SELECT COUNT(*) FROM gift_catalog');
      if (parseInt(giftsCount.rows[0].count, 10) === 0) {
        await tx.query(`
          INSERT INTO gift_catalog (name_ar, name_en, icon, points) VALUES
          ('وردة', 'Rose', '🌹', 10),
          ('قهوة', 'Coffee', '☕', 50),
          ('ألماسة', 'Diamond', '💎', 200),
          ('تاج', 'Crown', '👑', 1000),
          ('صاروخ', 'Rocket', '🚀', 5000),
          ('احتفال', 'Party', '🎉', 100),
          ('سيارة', 'Car', '🚗', 2000),
          ('أسد', 'Lion', '🦁', 10000)
        `);
      }
    });

    await runVersioned('v59_admin_approval_queue', 'Adding admin_approval_queue table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS admin_approval_queue (
          id SERIAL PRIMARY KEY,
          requester_id INTEGER NOT NULL,
          action_type VARCHAR(100) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          verification_code VARCHAR(10),
          approver_id INTEGER,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await ensureColumnsBulk(tx, 'system_settings', {
        require_2fa_for_economy: { type: 'BOOLEAN', default: 'false' }
      });
    });

    await runVersioned('v60_ad_pricing_audit', 'Creating ad_pricing_audit table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS ad_pricing_audit (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          old_value NUMERIC(10,4),
          new_value NUMERIC(10,4),
          change_type VARCHAR(50) DEFAULT 'manual',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v61_ad_performance_stats', 'Creating ad_stats table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS ad_stats (
          id SERIAL PRIMARY KEY,
          ad_id INTEGER NOT NULL,
          type VARCHAR(20) NOT NULL,
          user_id INTEGER,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_ad_stats_ad_id ON ad_stats(ad_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_ad_stats_type ON ad_stats(type)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_ad_stats_created_at ON ad_stats(created_at)`);
    });

    await runVersioned('v62_bulletin_social_features', 'Adding social fields to bulletin_ads', async (tx) => {
      await tx.query(`
        ALTER TABLE bulletin_ads 
        ADD COLUMN IF NOT EXISTS feeling VARCHAR(255),
        ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS tagged_users JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS has_whatsapp_button BOOLEAN DEFAULT FALSE
      `);
    });

    await runVersioned('v63_bulletin_ad_features', 'Adding ad_format and parent_id', async (tx) => {
      await ensureColumnsBulk(tx, 'bulletin_ads', {
        ad_format: { type: 'VARCHAR(50)', default: `'post'` }
      });
      await ensureColumnsBulk(tx, 'bulletin_ad_comments', {
        parent_id: { type: 'INTEGER' }
      });
    });

    await runVersioned('v64_bulletin_quick_questions', 'Adding quick_questions to bulletin_ads', async (tx) => {
      await ensureColumnsBulk(tx, 'bulletin_ads', {
        quick_questions: { type: 'JSONB', default: `'[]'` }
      });
    });

    await runVersioned('v65_route_seo_settings', 'Creating route_seo_settings table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS route_seo_settings (
          id SERIAL PRIMARY KEY,
          route VARCHAR(255) NOT NULL UNIQUE,
          title_ar TEXT,
          title_en TEXT,
          description_ar TEXT,
          description_en TEXT,
          keywords_ar TEXT,
          keywords_en TEXT,
          og_image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const existing = await tx.query('SELECT COUNT(*) as count FROM route_seo_settings');
      if (parseInt(existing.rows[0].count, 10) === 0) {
        await tx.query(`
          INSERT INTO route_seo_settings (route, title_ar, title_en, description_ar, description_en, keywords_ar, keywords_en, is_active)
          VALUES
          ('/', 'منصة بيربليكستا - التحليل والاستشراف الفني المتقدم', 'Perplexta Platform - Proactive Technical Analysis', 'المنصة الرائدة في التحليل والاستشراف الفني واستثمار الذكاء الاصطناعي.', 'Leading platform for technical intelligence and proactive AI capabilities.', 'ذكاء اصطناعي, تحليل, استشراف, تحليلات', 'ai, analytics, intelligence, perplexta', true),
          ('/subscription', 'خطط الاشتراكات - منصة بيربليكستا', 'Subscription Plans - Perplexta Platform', 'استكشف الباقات والاشتراكات والوصول الكامل لأدوات التحليل الذكي.', 'Explore subscription plans and full access to intelligence models.', 'اشتراكات, خطط, باقات', 'subscriptions, pricing, plans', true),
          ('/marketplace', 'متجر الإضافات والنماذج - منصة بيربليكستا', 'AI Marketplace - Perplexta Platform', 'تصفح المتجر الرقمي للإضافات والأدوات الذكية المعتمدة.', 'Browse our digital marketplace for artificial intelligence add-ons.', 'متجر, نماذج, أدوات', 'marketplace, tools, plugins', true),
          ('/blog', 'المدونة التقنية والأبحاث - بيربليكستا', 'Technical Blog & Research - Perplexta', 'قراءة أحدث المقالات التقنية والدراسات التحليلية.', 'Read the latest technical publications and deep research insights.', 'مقالات, مدونة, أبحاث', 'blog, articles, research', true),
          ('/viralbook', 'فيرال بوك والمنشورات - بيربليكستا', 'ViralBook Feed & Ads - Perplexta', 'تصفح منشورات فيرال بوك التفاعلية والعروض التجارية.', 'Browse ViralBook commercial ads and interactive public posts.', 'فيرال بوك, منشورات, إعلانات', 'viralbook, ads, posts', true),
          ('/rewards', 'نظام المكافآت والأرباح - بيربليكستا', 'Rewards & Referral Program - Perplexta', 'احصل على مكافآت ونقاط عند مشاركة ودعوة الأصدقاء.', 'Earn rewards and commission by referring friends and partners.', 'مكافآت, إحالة, أرباح', 'rewards, referral, affiliate', true),
          ('/about', 'عن منصة بيربليكستا والرؤية المستقبلية', 'About Perplexta - Vision & Mission', 'تعرف على رؤية فريق بيربليكستا وتاريخ تطوير المنصة.', 'Discover the history, tech vision, and team behind Perplexta.', 'عن المنصة, رؤية, فريق', 'about, vision, company', true),
          ('/terms', 'شروط الخدمة والاستخدام - بيربليكستا', 'Terms of Service - Perplexta', 'اطّلع على شروط وأحكام استخدام منصة بيربليكستا.', 'Read our official terms and conditions governing platform usage.', 'شروط, أحكام, اتفاقية', 'terms, conditions, legal', true),
          ('/privacy', 'سياسة الخصوصية وأمان البيانات - بيربليكستا', 'Privacy Policy - Perplexta', 'تعرّف على كيفية حماية وتشفير وتخزين بياناتك.', 'Learn how we protect, encrypt, and store user data safely.', 'خصوصية, أمان, بيانات', 'privacy, policy, security', true)
        `);
      }
    });

    await runVersioned('v66_asset_metadata_and_seo_integrity', 'Creating asset_metadata table', async (tx) => {
      await ensureColumnsBulk(tx, 'route_seo_settings', {
        alt_text_ar: { type: 'TEXT' },
        alt_text_en: { type: 'TEXT' }
      });

      await tx.query(`
        CREATE TABLE IF NOT EXISTS asset_metadata (
          id SERIAL PRIMARY KEY,
          file_url TEXT UNIQUE NOT NULL,
          asset_name VARCHAR(255),
          mime_type VARCHAR(100),
          file_size BIGINT,
          alt_text_ar TEXT,
          alt_text_en TEXT,
          og_title_ar TEXT,
          og_title_en TEXT,
          og_description_ar TEXT,
          og_description_en TEXT,
          keywords_ar TEXT,
          keywords_en TEXT,
          visual_summary TEXT,
          ai_analysis_raw JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v67_recommendation_engine', 'Creating recommendation engine tables', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS user_recommendation_interactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          item_type VARCHAR(50) NOT NULL,
          item_id INTEGER,
          item_key VARCHAR(255),
          action_type VARCHAR(50) NOT NULL,
          category VARCHAR(100),
          weight NUMERIC(5,2) DEFAULT 1.0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_rec_interactions_user ON user_recommendation_interactions(user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_rec_interactions_type_item ON user_recommendation_interactions(item_type, item_id)`);

      await tx.query(`
        CREATE TABLE IF NOT EXISTS user_recommendation_preferences (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          preferred_categories JSONB DEFAULT '[]',
          preferred_price_range JSONB DEFAULT '{"min": 0, "max": 10000}',
          excluded_item_types JSONB DEFAULT '[]',
          explicit_interests JSONB DEFAULT '[]',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await tx.query(`
        CREATE TABLE IF NOT EXISTS recommendation_feedback (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          item_type VARCHAR(50) NOT NULL,
          item_id INTEGER,
          item_key VARCHAR(255),
          feedback_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON recommendation_feedback(user_id)`);
    });

    await runVersioned('v68_ensure_chat_memories_and_shortcuts', 'Ensuring chat_memories and user_shortcuts exist', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS chat_memories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
          fact TEXT NOT NULL,
          source VARCHAR(20) DEFAULT 'ai',
          category VARCHAR(50) DEFAULT 'general',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`
        CREATE TABLE IF NOT EXISTS user_shortcuts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          query TEXT NOT NULL,
          category VARCHAR(50) DEFAULT 'general',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    await runVersioned('v69_add_user_shortcuts_fk', 'Add foreign key to user_shortcuts', async (tx) => {
      await tx.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_shortcuts_user_id_fkey') THEN
                ALTER TABLE user_shortcuts ADD CONSTRAINT user_shortcuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
        END;
        $$
      `);
    });

    await runVersioned('v70_encrypt_smtp_password', 'Encrypting smtp_password in email_settings', async (tx) => {
      const settingsRes = await tx.query('SELECT id, smtp_password FROM email_settings');
      const encryptionPattern = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;

      for (const row of settingsRes.rows) {
        if (row.smtp_password && row.smtp_password.trim() !== '' && !encryptionPattern.test(row.smtp_password)) {
          await tx.query('UPDATE email_settings SET smtp_password = $1 WHERE id = $2', [encrypt(row.smtp_password), row.id]);
        }
      }
    });

    await runVersioned('v71_add_fks', 'Add foreign key constraints', async (tx) => {
      // Intentionally left blank to avoid cross-db foreign keys
    });
    
    await runVersioned('v72_registered_agents_schema_fix', 'Ensuring registered_agents table has all required columns', async (tx) => {
      await ensureColumnsBulk(tx, 'registered_agents', {
        api_key_hash: { type: 'VARCHAR(255)' },
        permissions: { type: 'JSONB', default: `'[]'` },
        is_active: { type: 'BOOLEAN', default: 'true' }
      });
    });

    await runVersioned('v73_add_file_url_indexes', 'Adding indexes on file_url columns', async (tx) => {
      const safeIndex = async (clientObj: any, table: string, column: string, indexName: string) => {
        try {
          const colCheck = await clientObj.query(
            `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
            [table, column]
          );
          if (colCheck.rows.length > 0) {
            await clientObj.query(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${column}) WHERE length(${column}) <= 1000`);
          }
        } catch (idxErr) {
          console.warn(`[Migrations v73] Could not create index ${indexName}:`, idxErr instanceof Error ? idxErr.message : 'Unknown error');
        }
      };

      await safeIndex(tx, 'user_files', 'file_url', 'idx_user_files_file_url');
      await safeIndex(tx, 'asset_metadata', 'file_url', 'idx_asset_metadata_file_url');

      const extTarget = externalClient || tx;
      await safeIndex(extTarget, 'blog_articles', 'image_url', 'idx_blog_articles_image_url');

      await safeIndex(tx, 'bulletin_ads', 'image_url', 'idx_bulletin_ads_image_url');
      await safeIndex(tx, 'bulletin_ads', 'video_url', 'idx_bulletin_ads_video_url');
      await safeIndex(tx, 'bulletin_ads', 'author_avatar', 'idx_bulletin_ads_author_avatar');

      await safeIndex(tx, 'marketplace_items', 'image_url', 'idx_marketplace_items_image_url');
      await safeIndex(tx, 'marketplace_items', 'preview_url', 'idx_marketplace_items_preview_url');
      await safeIndex(tx, 'marketplace_items', 'video_url', 'idx_marketplace_items_video_url');
      await safeIndex(tx, 'marketplace_items', 'download_url', 'idx_marketplace_items_download_url');

      await safeIndex(tx, 'advertisements', 'image_url', 'idx_advertisements_image_url');
      await safeIndex(tx, 'users', 'avatar', 'idx_users_avatar');

      await safeIndex(tx, 'bulletin_pages', 'avatar_url', 'idx_bulletin_pages_avatar_url');
      await safeIndex(tx, 'bulletin_pages', 'cover_url', 'idx_bulletin_pages_cover_url');
    });

    await runVersioned('v74_google_tool_connections', 'Creating google_tool_connections table', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS google_tool_connections (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tool_id VARCHAR(100) NOT NULL,
          is_connected BOOLEAN DEFAULT false,
          config JSONB DEFAULT '{}',
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMP,
          scopes TEXT[],
          last_connected_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, tool_id)
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_google_tool_connections_user_id ON google_tool_connections(user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_google_tool_connections_tool_id ON google_tool_connections(tool_id)`);
    });

    await runVersioned('v75_language_font_config', 'Adding font config columns', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        font_loading_config: { type: 'TEXT' },
        font_config_ar: { type: 'TEXT' },
        font_config_en: { type: 'TEXT' }
      });
    });
    await runVersioned('v76_ensure_email_notifications', 'Ensuring email_notifications column exists on users', async (tx) => {
      await ensureColumnsBulk(tx, 'users', {
        email_notifications: { type: 'BOOLEAN', default: 'true' }
      });
    });
    await runVersioned('v77_custom_thresholds', 'Adding custom quota notification warning thresholds to system_settings', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        quota_warning_threshold_low: { type: 'INTEGER', default: '50' },
        quota_warning_threshold_high: { type: 'INTEGER', default: '80' }
      });
    });
    await runVersioned('v78_drop_system_settings_logo_indexes', 'Dropping system_settings image indexes to support base64 logos', async (tx) => {
      await tx.query(`DROP INDEX IF EXISTS idx_system_settings_logo_url`);
      await tx.query(`DROP INDEX IF EXISTS idx_system_settings_logo_light_url`);
      await tx.query(`DROP INDEX IF EXISTS idx_system_settings_seo_image_url`);
      await tx.query(`DROP INDEX IF EXISTS idx_system_settings_favicon_url`);
    });
    await runVersioned('v79_sync_content_seo_metadata', 'Syncing missing SEO metadata for Bulletin Board', async () => {
      await syncAllContentSeoMetadata().catch((err) => {
        console.warn('[Migrations] Non-fatal SEO metadata sync warning:', err.message || err);
      });
    });

        await runVersioned('v81_advertisements_format_column', 'Adding format column to advertisements', async (tx) => {
      await ensureColumnsBulk(tx, 'advertisements', {
        format: { type: 'VARCHAR(50)', default: "'sidebar'" },
        video_url: { type: 'TEXT' },
        poster_url: { type: 'TEXT' }
      });
    });

    await runVersioned('v80_sidebar_ads_columns', 'Ensure sidebar ads columns exist on system_settings', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        sidebar_ads_enabled: { type: 'BOOLEAN', default: 'true' },
        sidebar_ad_impression_price: { type: 'NUMERIC(10,4)', default: '0.0100' },
        sidebar_ad_click_price: { type: 'NUMERIC(10,2)', default: '0.10' }
      });
    });

    await runVersioned('v82_update_blog_article_images', 'Updating blog articles to use valid Unsplash images', async (tx) => {
      const extTarget = externalClient || tx;
      
      // Check if blog_articles table exists
      const tableCheck = await extTarget.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'blog_articles'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.warn('[Migrations] Skipping v82: blog_articles table does not exist.');
        return;
      }

      await extTarget.query(`
        UPDATE blog_articles 
        SET image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1080&fit=crop'
        WHERE slug = 'algorithmic-scaling-quantum-modeling-2026'
      `);
      await extTarget.query(`
        UPDATE blog_articles 
        SET image_url = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1080&h=1080&fit=crop'
        WHERE slug = 'decentralized-ledger-cryptography-threat-vectors'
      `);
      await extTarget.query(`
        UPDATE blog_articles 
        SET image_url = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1080&h=1080&fit=crop'
        WHERE slug = 'geopolitical-liquidity-fractures-multi-asset-hedging'
      `);
    });

    await runVersioned('v83_media_assets_table_and_constraints', 'Creating media_assets table, context constraints, and foreign key columns for users, blog_articles, and marketplace_items', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS media_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          stored_path TEXT NOT NULL UNIQUE,
          original_filename TEXT NOT NULL,
          context TEXT NOT NULL DEFAULT 'general',
          format TEXT NOT NULL DEFAULT 'webp',
          width INT NOT NULL DEFAULT 0,
          height INT NOT NULL DEFAULT 0,
          size_bytes INT NOT NULL DEFAULT 0,
          sha256_hash TEXT NOT NULL UNIQUE,
          is_public BOOLEAN DEFAULT FALSE,
          user_id INTEGER,
          blog_article_id INTEGER,
          marketplace_item_id INTEGER,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ensure any legacy restrictive constraint for context values is dropped so all contexts (pwa_asset, brand, video, etc.) are valid
      await tx.query(`ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context`).catch(() => {});
      await tx.query(`ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check`).catch(() => {});

      // Ensure columns exist on media_assets if table already existed previously
      await tx.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS user_id INTEGER`);
      await tx.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS blog_article_id INTEGER`);
      await tx.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS marketplace_item_id INTEGER`);
      await tx.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);

      // === Core DB Columns ===
      await tx.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_asset_id UUID`);
      
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS image_asset_id UUID;
          END IF;
        END $$;
      `);

      // === External DB Columns ===
      const extTarget = externalClient || tx;
      const blogArticlesExists = await extTarget.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'blog_articles'
        )
      `);

      if (blogArticlesExists.rows[0].exists) {
        await extTarget.query(`ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS image_asset_id UUID`);
      } else {
        console.warn('[Migrations] Skipping blog_articles image_asset_id column in v83: table does not exist.');
      }

      // === Indexes (After columns are guaranteed) ===
      
      // Core Indexes
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_context ON media_assets(context)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(sha256_hash)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_stored_path ON media_assets(stored_path)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_media_assets_marketplace_item_id ON media_assets(marketplace_item_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_users_avatar_asset_id ON users(avatar_asset_id)`);
      
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            CREATE INDEX IF NOT EXISTS idx_marketplace_items_image_asset_id ON marketplace_items(image_asset_id);
          END IF;
        END $$;
      `);

      // External Indexes
      if (blogArticlesExists.rows[0].exists) {
        await extTarget.query(`CREATE INDEX IF NOT EXISTS idx_blog_articles_image_asset_id ON blog_articles(image_asset_id)`);
      }

      // === Foreign Keys (Only within the same database) ===
      await ensureForeignKey(tx, 'users', 'fk_users_avatar_asset_id', 'avatar_asset_id', 'media_assets', 'id', 'SET NULL');
      
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_marketplace_items_image_asset_id') THEN
              ALTER TABLE marketplace_items ADD CONSTRAINT fk_marketplace_items_image_asset_id FOREIGN KEY (image_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;
            END IF;
          END IF;
        END $$;
      `);

      await ensureForeignKey(tx, 'media_assets', 'fk_media_assets_user_id', 'user_id', 'users', 'id', 'SET NULL');
      
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_media_assets_marketplace_item_id') THEN
              ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_marketplace_item_id FOREIGN KEY (marketplace_item_id) REFERENCES marketplace_items(id) ON DELETE SET NULL;
            END IF;
          END IF;
        END $$;
      `);
    });

    await runVersioned('v84_media_player_mute_defaults', 'Ensure media_muted default columns on users and system_settings', async (tx) => {
      await tx.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS media_muted BOOLEAN DEFAULT true`);
      await tx.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS media_muted_default BOOLEAN DEFAULT true`);
    });

    await runVersioned('v85_bulletin_ads_nullable_image_url', 'Drop NOT NULL constraint on image_url in bulletin_ads', async (tx) => {
      await tx.query('ALTER TABLE bulletin_ads ALTER COLUMN image_url DROP NOT NULL');
    });

    await runVersioned('v86_bulletin_post_options_features', 'Add who_can_comment, allow_translation, partnership, archive, trash fields and notifications table to bulletin_ads', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS who_can_comment VARCHAR(50) DEFAULT 'anyone'`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS allow_translation BOOLEAN DEFAULT true`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS partnership_code VARCHAR(100)`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS is_partnership BOOLEAN DEFAULT false`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS partnership_brand VARCHAR(255)`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`);

      await tx.query(`
        CREATE TABLE IF NOT EXISTS bulletin_ad_muted_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          ad_id INTEGER NOT NULL REFERENCES bulletin_ads(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, ad_id)
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_bulletin_ad_muted_notif ON bulletin_ad_muted_notifications(user_id, ad_id)`);
    });

    await runVersioned('v87_create_seo_metadata_table', 'Create seo_metadata table for dynamic routes and populate initial metadata', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS seo_metadata (
          id SERIAL PRIMARY KEY,
          route_path VARCHAR(255) UNIQUE NOT NULL,
          entity_type VARCHAR(50),
          entity_id VARCHAR(100),
          title_en VARCHAR(255),
          title_ar VARCHAR(255),
          description_en TEXT,
          description_ar TEXT,
          og_image_url TEXT,
          og_image_alt_en TEXT,
          og_image_alt_ar TEXT,
          keywords_en TEXT,
          keywords_ar TEXT,
          canonical_url TEXT,
          structured_data JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_seo_metadata_route_path ON seo_metadata(route_path)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_seo_metadata_entity ON seo_metadata(entity_type, entity_id)`);

      // Ensure bulletin_ads has SEO columns before querying
      await ensureColumnsBulk(tx, 'bulletin_ads', {
        meta_title_en: { type: 'VARCHAR(255)' },
        meta_title_ar: { type: 'VARCHAR(255)' },
        meta_description_en: { type: 'TEXT' },
        meta_description_ar: { type: 'TEXT' },
        keywords_en: { type: 'TEXT' },
        keywords_ar: { type: 'TEXT' },
        og_image_url: { type: 'TEXT' }
      });

      // Seed/populate dynamic routes for existing bulletin ads
      await tx.query(`
        INSERT INTO seo_metadata (route_path, entity_type, entity_id, title_en, title_ar, description_en, description_ar, og_image_url, keywords_en, keywords_ar, updated_at)
        SELECT 
          CONCAT('/bulletin/', id) as route_path,
          'bulletin' as entity_type,
          CAST(id AS VARCHAR(100)) as entity_id,
          COALESCE(meta_title_en, title, 'Bulletin Ad') as title_en,
          COALESCE(meta_title_ar, title, 'إعلان في النشرة') as title_ar,
          COALESCE(meta_description_en, SUBSTRING(description FROM 1 FOR 160), '') as description_en,
          COALESCE(meta_description_ar, SUBSTRING(description FROM 1 FOR 160), '') as description_ar,
          COALESCE(og_image_url, image_url, '') as og_image_url,
          COALESCE(keywords_en, 'bulletin, perplexta, advertisement') as keywords_en,
          COALESCE(keywords_ar, 'إعلانات, بيربليكستا, خدمات') as keywords_ar,
          CURRENT_TIMESTAMP as updated_at
        FROM bulletin_ads
        ON CONFLICT (route_path) DO NOTHING
      `).catch((err: any) => console.warn('[Migration v87] Bulletin ads initial SEO sync note:', err.message));

      // Seed/populate dynamic routes for existing marketplace items (by ID and by slug)
      const hasCol = async (clientObj: any, table: string, col: string) => {
        try {
          const res = await clientObj.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, col]);
          return res.rows.length > 0;
        } catch { return false; }
      };

      if (await hasCol(tx, 'marketplace_items', 'title_en')) {
        await tx.query(`
          INSERT INTO seo_metadata (route_path, entity_type, entity_id, title_en, title_ar, description_en, description_ar, og_image_url, keywords_en, keywords_ar, updated_at)
          SELECT 
            CONCAT('/marketplace/', id) as route_path,
            'marketplace' as entity_type,
            CAST(id AS VARCHAR(100)) as entity_id,
            COALESCE(title_en, 'Marketplace Item') as title_en,
            COALESCE(title_ar, 'منتج في المتجر') as title_ar,
            COALESCE(SUBSTRING(description_en FROM 1 FOR 160), '') as description_en,
            COALESCE(SUBSTRING(description_ar FROM 1 FOR 160), '') as description_ar,
            COALESCE(image_url, '') as og_image_url,
            'marketplace, products, perplexta' as keywords_en,
            'متجر, منتجات, حلول برمجية' as keywords_ar,
            CURRENT_TIMESTAMP as updated_at
          FROM marketplace_items
          ON CONFLICT (route_path) DO NOTHING
        `);
      }

      // Seed/populate dynamic routes for existing blog articles if accessible on extTarget
      const extTarget = externalClient || tx;
      if (await hasCol(extTarget, 'blog_articles', 'title_en')) {
        try {
          const blogRows = await extTarget.query(`
            SELECT id, title_en, title_ar, content_en, content_ar, image_url
            FROM blog_articles
          `);
          for (const row of blogRows.rows) {
            const titleEn = row.title_en || 'Blog Post';
            const titleAr = row.title_ar || 'مقال في المدونة';
            const descEn = row.content_en ? row.content_en.slice(0, 160).replace(/[#*`_\\[\\]()]/g, '') : '';
            const descAr = row.content_ar ? row.content_ar.slice(0, 160).replace(/[#*`_\\[\\]()]/g, '') : '';
            const imgUrl = row.image_url || '';
            const kwEn = 'blog, articles, analysis';
            const kwAr = 'مدونة, مقالات, تحليلات';

            await tx.query(`
              INSERT INTO seo_metadata (route_path, entity_type, entity_id, title_en, title_ar, description_en, description_ar, og_image_url, keywords_en, keywords_ar, updated_at)
              VALUES ($1, 'blog', $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
              ON CONFLICT (route_path) DO NOTHING
            `, [`/blog/${row.id}`, String(row.id), titleEn, titleAr, descEn, descAr, imgUrl, kwEn, kwAr]);
          }
        } catch (blogErr: any) {
          console.warn('[Migration v87] Blog initial SEO sync note:', blogErr.message);
        }
      }
    });

    await runVersioned('v88_create_gpu_providers_infrastructure', 'Create and enforce gpu_providers table with security protocols, load capacity, metadata, and model relations', async (tx) => {
      // 1. Create gpu_providers table if not exists with strict security and required fields
      await tx.query(`
        CREATE TABLE IF NOT EXISTS gpu_providers (
          id SERIAL PRIMARY KEY,
          provider_id VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          provider_type VARCHAR(100) NOT NULL,
          endpoint_id VARCHAR(150),
          base_url TEXT NOT NULL,
          api_url TEXT,
          encrypted_api_key TEXT NOT NULL,
          current_load_capacity INTEGER DEFAULT 100,
          status VARCHAR(50) DEFAULT 'active',
          metadata JSONB DEFAULT '{}',
          health_status VARCHAR(50) DEFAULT 'offline',
          latency_ms INTEGER DEFAULT 0,
          capabilities TEXT[] DEFAULT ARRAY['vision']::TEXT[],
          daily_budget NUMERIC(15, 4) DEFAULT '0',
          used_today NUMERIC(15, 4) DEFAULT '0',
          last_reset_date DATE DEFAULT CURRENT_DATE,
          config JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Ensure columns exist if table was already created earlier (defensive additive migration)
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS base_url TEXT`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS api_url TEXT`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS current_load_capacity INTEGER DEFAULT 100`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'`);
      await tx.query(`ALTER TABLE gpu_providers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);

      // Keep api_url in sync with base_url and status with is_active for legacy entries
      await tx.query(`UPDATE gpu_providers SET api_url = base_url WHERE (api_url IS NULL OR api_url = '') AND base_url IS NOT NULL`);
      await tx.query(`UPDATE gpu_providers SET base_url = api_url WHERE (base_url IS NULL OR base_url = '') AND api_url IS NOT NULL`);
      await tx.query(`UPDATE gpu_providers SET status = CASE WHEN is_active = false THEN 'inactive' ELSE 'active' END WHERE status IS NULL`);
      await tx.query(`UPDATE gpu_providers SET metadata = config WHERE (metadata IS NULL OR metadata = '{}'::jsonb) AND config IS NOT NULL AND config != '{}'::jsonb`);
      await tx.query(`UPDATE gpu_providers SET config = metadata WHERE (config IS NULL OR config = '{}'::jsonb) AND metadata IS NOT NULL AND metadata != '{}'::jsonb`);

      // 3. Create gpu_provider_models table
      await tx.query(`
        CREATE TABLE IF NOT EXISTS gpu_provider_models (
          id SERIAL PRIMARY KEY,
          provider_id INTEGER NOT NULL REFERENCES gpu_providers(id) ON DELETE CASCADE,
          model_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          task_type VARCHAR(100) NOT NULL,
          context_window INTEGER DEFAULT 32768,
          max_output_tokens INTEGER DEFAULT 4096,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`ALTER TABLE gpu_provider_models ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);

      // 4. Create Indexes
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS gpu_providers_pkey ON gpu_providers(id)`);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS gpu_providers_provider_id_key ON gpu_providers(provider_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_providers_status ON gpu_providers(status)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_providers_is_active ON gpu_providers(is_active)`);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS gpu_provider_models_pkey ON gpu_provider_models(id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_provider_models_provider_id ON gpu_provider_models(provider_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_provider_models_task_type ON gpu_provider_models(task_type)`);
    });

    await runVersioned('v89_create_gpu_execution_jobs', 'Create and enforce gpu_execution_jobs table for task queue, metrics, and audit logs', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS gpu_execution_jobs (
          id SERIAL PRIMARY KEY,
          job_id VARCHAR(120) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          provider_id INTEGER REFERENCES gpu_providers(id) ON DELETE SET NULL,
          model_id VARCHAR(255) NOT NULL,
          task_type VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          prompt TEXT,
          parameters JSONB DEFAULT '{}',
          remote_job_id VARCHAR(255),
          result_url TEXT,
          result_data JSONB DEFAULT '{}',
          latency_ms INTEGER DEFAULT 0,
          error_message TEXT,
          attempts INTEGER DEFAULT 1,
          failover_count INTEGER DEFAULT 0,
          cost_charged NUMERIC(15, 4) DEFAULT '0',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        )
      `);

      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES gpu_providers(id) ON DELETE SET NULL`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS remote_job_id VARCHAR(255)`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS result_url TEXT`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS result_data JSONB DEFAULT '{}'`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS error_message TEXT`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS failover_count INTEGER DEFAULT 0`);
      await tx.query(`ALTER TABLE gpu_execution_jobs ADD COLUMN IF NOT EXISTS cost_charged NUMERIC(15, 4) DEFAULT '0'`);

      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS gpu_execution_jobs_pkey ON gpu_execution_jobs(id)`);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS gpu_execution_jobs_job_id_key ON gpu_execution_jobs(job_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_execution_jobs_user_id ON gpu_execution_jobs(user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_execution_jobs_provider_id ON gpu_execution_jobs(provider_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_execution_jobs_task_type ON gpu_execution_jobs(task_type)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_execution_jobs_status ON gpu_execution_jobs(status)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_gpu_execution_jobs_created_at ON gpu_execution_jobs(created_at DESC)`);
    });

    await runVersioned('v90_add_pages_and_marketplace_owner_id', 'Add owner_id column and foreign key link to bulletin_pages and marketplace_items for exclusive content management', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_pages ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE`);
      await tx.query(`UPDATE bulletin_pages SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_bulletin_pages_owner_id ON bulletin_pages(owner_id)`);

      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
            UPDATE marketplace_items SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_marketplace_items_owner_id ON marketplace_items(owner_id);
          END IF;
        END $$;
      `);
    });

    await runVersioned('v91_create_og_preview_cache', 'Create dedicated cache table for Open Graph social media previews with lightning-fast metadata storage', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS og_preview_cache (
          id SERIAL PRIMARY KEY,
          route_path VARCHAR(500) UNIQUE NOT NULL,
          title VARCHAR(500),
          description TEXT,
          image_url TEXT,
          meta_data JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_og_preview_cache_route_path ON og_preview_cache(route_path)`);
    });

    await runVersioned('v92_add_meta_tags_updated_at', 'Add meta_tags_updated_at timestamp column to bulletin_pages, marketplace_items, and blog_articles for crawler priority re-indexing', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_pages ADD COLUMN IF NOT EXISTS meta_tags_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_bulletin_pages_meta_tags_updated_at ON bulletin_pages(meta_tags_updated_at DESC)`);

      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_items') THEN
            ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS meta_tags_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            CREATE INDEX IF NOT EXISTS idx_marketplace_items_meta_tags_updated_at ON marketplace_items(meta_tags_updated_at DESC);
          END IF;
        END $$;
      `);

      const extTarget = externalClient || tx;
      await extTarget.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_articles') THEN
            ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS meta_tags_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            CREATE INDEX IF NOT EXISTS idx_blog_articles_meta_tags_updated_at ON blog_articles(meta_tags_updated_at DESC);
          END IF;
        END $$;
      `);
    });

    await runVersioned('v93_purge_mock_gpu_providers', 'Purge mock and hardcoded GPU providers to ensure sovereign and dynamic custom cluster registration', async (tx) => {
      await tx.query(`
        DELETE FROM gpu_providers 
        WHERE provider_id IN ('runpod_ai', 'pruna___p_video', 'fal_ai', 'perplexta_vision')
      `);
    });

    await runVersioned('v94_purge_preprogrammed_tool_models', 'Clean pre-programmed models and obsolete provider references from tool_orchestrator for complete administrative sovereignty', async (tx) => {
      await tx.query(`
        UPDATE tool_orchestrator
        SET primary_provider = '', primary_model = ''
        WHERE primary_provider IN ('runpod_ai', 'pruna___p_video', 'fal_ai', 'perplexta_vision')
           OR (primary_provider != '' AND tool_id IN ('image', 'video', 'vision', 'perplexta_vision') 
               AND NOT EXISTS (SELECT 1 FROM gpu_providers gp WHERE gp.provider_id = tool_orchestrator.primary_provider))
      `);
      await tx.query(`
        UPDATE tool_orchestrator
        SET fallback_1_provider = '', fallback_1_model = ''
        WHERE fallback_1_provider IN ('runpod_ai', 'pruna___p_video', 'fal_ai', 'perplexta_vision')
      `);
      await tx.query(`
        UPDATE tool_orchestrator
        SET fallback_2_provider = '', fallback_2_model = ''
        WHERE fallback_2_provider IN ('runpod_ai', 'pruna___p_video', 'fal_ai', 'perplexta_vision')
      `);
      await tx.query(`
        UPDATE tool_orchestrator
        SET fallback_3_provider = '', fallback_3_model = ''
        WHERE fallback_3_provider IN ('runpod_ai', 'pruna___p_video', 'fal_ai', 'perplexta_vision')
      `);
    });

    await runVersioned('v95_reconcile_admin_seeded_wallet', 'Correcting the seeded admin wallet balance from $10,000 USD to 10,000 points (PTS)', async (tx, ledgerTx) => {
      // 1. Fetch all admin user IDs from the core DB
      const adminRes = await tx.query(`SELECT id FROM users WHERE role = 'admin'`);
      const adminIds = adminRes.rows.map((r: any) => r.id);

      if (adminIds.length > 0 && ledgerTx) {
        for (const adminId of adminIds) {
          // 2. Fetch wallet for each admin from ledger DB
          const walletCheck = await ledgerTx.query(`SELECT id, balance, points FROM wallets WHERE user_id = $1`, [adminId]);
          if (walletCheck.rows.length > 0) {
            const wallet = walletCheck.rows[0];
            const currentBalance = parseFloat(wallet.balance || '0');
            const currentPoints = parseInt(wallet.points || '0', 10);

            // If the wallet has exactly 10000.00 USD and 0 points, perform correction
            if (Math.abs(currentBalance - 10000.0) < 0.01 && currentPoints === 0) {
              await ledgerTx.query(`
                UPDATE wallets
                SET balance = 0.0000, points = 10000, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
              `, [wallet.id]);

              // Record a correcting transaction in the ledger for transparency
              await ledgerTx.query(`
                INSERT INTO ledger_transactions (user_id, wallet_id, amount, points, transaction_type, status, description)
                VALUES ($1, $2, -10000.00, 10000, 'reconciliation', 'success', $3)
              `, [
                adminId,
                wallet.id,
                'تحديث تصحيح رصيد البذر التلقائي: تعديل من $10,000.00 دولار إلى 10,000 نقطة PTS / Seed balance correction: $10,000.00 USD adjusted to 10,000 PTS'
              ]);

              console.log(`[Migrations] Successfully corrected admin ${adminId} wallet: adjusted balance to 0 and awarded 10,000 PTS.`);
            }
          }
        }
      }
    });

    await runVersioned('v84_add_file_data_columns_to_user_files_and_media_assets', 'Ensure file_data BYTEA columns exist in user_files and media_assets for binary file DB fallback storage', async (tx) => {
      await tx.query(`
        ALTER TABLE user_files ADD COLUMN IF NOT EXISTS file_data BYTEA;
      `);
      await tx.query(`
        ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS file_data BYTEA;
      `);
      console.log('[Migrations] Successfully ensured file_data BYTEA columns in user_files and media_assets.');
    });

    await runVersioned('v85_safely_remove_marketplace_ecosystem', 'Safely decommission and drop marketplace tables, constraints, foreign keys, and route metadata', async (tx) => {
      // Drop dependent marketplace tables with cascade
      await tx.query(`DROP TABLE IF EXISTS marketplace_reviews CASCADE;`);
      await tx.query(`DROP TABLE IF EXISTS marketplace_purchases CASCADE;`);
      await tx.query(`DROP TABLE IF EXISTS marketplace_items CASCADE;`);

      // Clean media_assets references to marketplace safely
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets') THEN
            ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS fk_media_assets_marketplace_item_id;
            DROP INDEX IF EXISTS idx_media_assets_marketplace_item_id;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'marketplace_item_id') THEN
              ALTER TABLE media_assets DROP COLUMN marketplace_item_id;
            END IF;
          END IF;
        END $$;
      `);

      // Clean SEO metadata and routes related to marketplace safely
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_metadata') THEN
            DELETE FROM seo_metadata WHERE route_path LIKE '/marketplace%';
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_seo_metadata') THEN
            DELETE FROM route_seo_metadata WHERE route_path LIKE '/marketplace%';
          END IF;
        END $$;
      `);

      console.log('[Migrations] Successfully removed all marketplace tables, columns, constraints, and SEO paths.');
    });
    
    await runVersioned('v99_clean_slate_and_deep_architecture_purge', 'Deep Architecture Purge & Dead Code Elimination for Market and Blog sections across Core and External pools', async (tx) => {
      // 1. Drop all legacy tables from Core pool
      const legacyTables = [
        'marketplace_reviews',
        'marketplace_purchases',
        'marketplace_items',
        'blog_ratings',
        'blog_comments',
        'blog_articles',
        'forum_post_ratings',
        'forum_comments',
        'forum_posts',
        'forum_categories'
      ];

      for (const tbl of legacyTables) {
        await tx.query(`DROP TABLE IF EXISTS ${tbl} CASCADE;`).catch(() => {});
      }

      // 2. Drop all legacy tables from External pool if accessible
      if (extTarget) {
        for (const tbl of legacyTables) {
          await extTarget.query(`DROP TABLE IF EXISTS ${tbl} CASCADE;`).catch(() => {});
        }
      }

      // 3. Clean media_assets constraints and legacy columns
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_assets') THEN
            ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS fk_media_assets_marketplace_item_id;
            ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS fk_media_assets_blog_article_id;
            DROP INDEX IF EXISTS idx_media_assets_marketplace_item_id;
            DROP INDEX IF EXISTS idx_media_assets_blog_article_id;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'marketplace_item_id') THEN
              ALTER TABLE media_assets DROP COLUMN marketplace_item_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'blog_article_id') THEN
              ALTER TABLE media_assets DROP COLUMN blog_article_id;
            END IF;
            -- Ensure restrictive context check constraints are dropped so all media contexts are accepted
            ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check;
            ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context;
          END IF;
        END $$;
      `).catch(() => {});

      // 4. Clean SEO metadata and routes related to legacy sections
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_metadata') THEN
            DELETE FROM seo_metadata WHERE route_path LIKE '/marketplace%' OR route_path LIKE '/blog%' OR route_path LIKE '/forum%';
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_seo_metadata') THEN
            DELETE FROM route_seo_metadata WHERE route_path LIKE '/marketplace%' OR route_path LIKE '/blog%' OR route_path LIKE '/forum%';
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_seo_settings') THEN
            DELETE FROM route_seo_settings WHERE route LIKE '/marketplace%' OR route LIKE '/blog%' OR route LIKE '/forum%';
          END IF;
        END $$;
      `).catch(() => {});

      console.log('[Migrations] [Clean Slate] Deep architecture purge completed cleanly.');
    });

    await runVersioned('v100_restore_registry_database_connections', 'Ensure core, ledger, external, security, and media connection strings in db_connections_registry are valid and active', async (tx) => {
      const coreUrl = process.env.DATABASE_URL;
      const ledgerUrl = process.env.LEDGER_DATABASE_URL;
      const externalUrl = process.env.EXTERNAL_DATABASE_URL || coreUrl;
      const securityUrl = process.env.SECURITY_DATABASE_URL || coreUrl;
      const mediaUrl = process.env.MEDIA_DATABASE_URL || coreUrl;

      const entries = [
        { id: 'core', url: coreUrl },
        { id: 'ledger', url: ledgerUrl },
        { id: 'external', url: externalUrl },
        { id: 'security', url: securityUrl },
        { id: 'media', url: mediaUrl }
      ];

      for (const entry of entries) {
        if (!entry.url) continue;
        const encrypted = encrypt(entry.url);
        await tx.query(`
          INSERT INTO db_connections_registry (id, provider, connection_string, is_active, status)
          VALUES ($1, $1, $2, true, 'healthy')
          ON CONFLICT (id) DO UPDATE SET
            connection_string = CASE 
              WHEN db_connections_registry.connection_string IS NULL OR db_connections_registry.connection_string = '' 
              THEN EXCLUDED.connection_string 
              ELSE db_connections_registry.connection_string 
            END,
            is_active = CASE 
              WHEN db_connections_registry.is_active = false AND (db_connections_registry.connection_string IS NULL OR db_connections_registry.connection_string = '')
              THEN true
              ELSE db_connections_registry.is_active
            END,
            status = 'healthy';
        `, [entry.id, encrypted]);
      }
      console.log('[Migrations] Database connections registry restored and verified.');
    });

    await runVersioned('v101_add_bulletin_pages_managers', 'Add managers JSONB column to bulletin_pages for granular page management', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_pages ADD COLUMN IF NOT EXISTS managers JSONB DEFAULT '[]'::JSONB`);
    });

    await runVersioned('v102_control_panel_unified_keys_schema', 'Ensure Google OAuth and Firebase Admin columns exist on system_settings for unified Control Panel key management', async (tx) => {
      await ensureColumnsBulk(tx, 'system_settings', {
        google_client_id: { type: 'VARCHAR(255)' },
        google_client_secret: { type: 'TEXT' },
        github_client_id: { type: 'VARCHAR(255)' },
        github_client_secret: { type: 'TEXT' },
        apple_client_id: { type: 'VARCHAR(255)' },
        apple_team_id: { type: 'VARCHAR(255)' },
        apple_key_id: { type: 'VARCHAR(255)' },
        apple_private_key: { type: 'TEXT' },
        microsoft_client_id: { type: 'VARCHAR(255)' },
        microsoft_client_secret: { type: 'TEXT' },
        oauth_providers_config: { type: 'JSONB', default: "'{}'" },
        firebase_project_id: { type: 'VARCHAR(255)' },
        firebase_client_email: { type: 'VARCHAR(255)' },
        firebase_private_key: { type: 'TEXT' },
        firebase_service_account_path: { type: 'TEXT' }
      });
    });

    await runVersioned('v105_canonical_theme_bootstrap', 'Seed admin_theme_customizations and system_settings with unified default tokens if empty', async (tx) => {
      const defaultLightTokens = JSON.stringify({
        '--surface-page': '#f8fafc',
        '--surface-canvas': '#f8fafc',
        '--surface-card': '#ffffff',
        '--surface-raised': '#ffffff',
        '--surface-subtle': '#f1f5f9',
        '--surface-inset': '#f1f5f9',
        '--fg-primary': '#0f172a',
        '--fg-secondary': '#64748b',
        '--fg-muted': '#94a3b8',
        '--accent': '#0284c7',
        '--accent-hover': '#0369a1',
        '--fg-accent': '#0284c7',
        '--bg-accent-emphasis': '#0284c7',
        '--bg-accent-muted': 'rgba(2, 132, 199, 0.12)',
        '--border-accent-emphasis': '#0284c7',
        '--focus-outline': '#0284c7',
        '--border-default': '#e2e8f0',
        '--border-outer-input': '#cbd5e1',
        '--border-inner-input': '#e2e8f0',
        '--border-subtle': '#e2e8f0',
        '--border-strong': '#94a3b8',
        '--border-accent': '#0284c7',
        '--bg-btn-primary': '#0284c7',
        '--fg-btn-primary': '#ffffff',
        '--bg-btn-secondary': '#ffffff',
        '--border-btn-secondary': '#e2e8f0',
        '--control-active-bg': '#0284c7',
        '--control-active-fg': '#ffffff',
        '--bg-input': '#ffffff',
        '--border-focus': '#0284c7',
        '--chat-bubble-user': '#f1f5f9',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#0f172a',
        '--chat-bubble-assistant-text': '#0f172a'
      });

      const defaultDarkTokens = JSON.stringify({
        '--surface-page': '#080c15',
        '--surface-canvas': '#080c15',
        '--surface-card': '#0f172a',
        '--surface-raised': '#0f172a',
        '--surface-subtle': '#1e293b',
        '--surface-inset': '#1e293b',
        '--fg-primary': '#ffffff',
        '--fg-secondary': '#94a3b8',
        '--fg-muted': '#94a3b8',
        '--accent': '#38bdf8',
        '--accent-hover': '#0ea5e9',
        '--fg-accent': '#38bdf8',
        '--bg-accent-emphasis': '#38bdf8',
        '--bg-accent-muted': 'rgba(56, 189, 248, 0.18)',
        '--border-accent-emphasis': '#38bdf8',
        '--focus-outline': '#38bdf8',
        '--border-default': '#1e293b',
        '--border-outer-input': '#1e293b',
        '--border-inner-input': '#1e293b',
        '--border-subtle': '#1e293b',
        '--border-strong': '#475569',
        '--border-accent': '#38bdf8',
        '--bg-btn-primary': '#38bdf8',
        '--fg-btn-primary': '#080c15',
        '--bg-btn-secondary': '#0f172a',
        '--border-btn-secondary': '#1e293b',
        '--control-active-bg': '#1e293b',
        '--control-active-fg': '#ffffff',
        '--bg-input': '#0f172a',
        '--border-focus': '#38bdf8',
        '--chat-bubble-user': '#1e293b',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#ffffff',
        '--chat-bubble-assistant-text': '#ffffff'
      });

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('light', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO NOTHING
      `, [defaultLightTokens]);

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('dark', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO NOTHING
      `, [defaultDarkTokens]);

      const columnsCheck = await tx.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'system_settings' AND column_name IN ('theme_tokens_light', 'theme_tokens_dark')
      `);
      if (columnsCheck.rows && columnsCheck.rows.length > 0) {
        const updateFields = columnsCheck.rows.map((r: any) => `${r.column_name} = NULL`);
        await tx.query(`
          UPDATE system_settings
          SET ${updateFields.join(', ')}
        `);
      }
    });

    await runVersioned('v106_bulk_route_seo_metadata', 'Add is_dynamic and route_pattern columns to route_seo_settings for advanced template-based dynamic SEO mapping', async (tx) => {
      await tx.query(`
        ALTER TABLE route_seo_settings 
        ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS route_pattern VARCHAR(255)
      `);
      await tx.query(`
        CREATE INDEX IF NOT EXISTS idx_route_seo_settings_pattern ON route_seo_settings (route_pattern)
      `);
    });

    await runVersioned('v107_perplexta_unified_ai_tokens', 'Harmonize admin_theme_customizations with canonical Perplexta Cyan Design System and clean up legacy visual tokens', async (tx) => {
      const canonicalLightTokens = JSON.stringify({
        '--surface-page': '#f8fafc',
        '--surface-canvas': '#f8fafc',
        '--surface-card': '#ffffff',
        '--surface-raised': '#ffffff',
        '--surface-subtle': '#f1f5f9',
        '--surface-inset': '#f1f5f9',
        '--fg-primary': '#0f172a',
        '--fg-secondary': '#475569',
        '--fg-muted': '#64748b',
        '--accent': '#06b6d4',
        '--accent-hover': '#0891b2',
        '--fg-accent': '#0891b2',
        '--bg-accent-emphasis': '#06b6d4',
        '--bg-accent-muted': 'rgba(6, 182, 212, 0.12)',
        '--border-accent-emphasis': '#06b6d4',
        '--focus-outline': '#06b6d4',
        '--border-default': '#e2e8f0',
        '--border-outer-input': '#cbd5e1',
        '--border-inner-input': '#e2e8f0',
        '--border-subtle': '#e2e8f0',
        '--border-strong': '#94a3b8',
        '--border-accent': '#06b6d4',
        '--bg-btn-primary': '#06b6d4',
        '--fg-btn-primary': '#020617',
        '--bg-btn-secondary': '#f1f5f9',
        '--border-btn-secondary': '#e2e8f0',
        '--control-active-bg': '#06b6d4',
        '--control-active-fg': '#020617',
        '--bg-input': '#ffffff',
        '--border-focus': '#06b6d4',
        '--chat-bubble-user': '#f1f5f9',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#0f172a',
        '--chat-bubble-assistant-text': '#0f172a'
      });

      const canonicalDarkTokens = JSON.stringify({
        '--surface-page': '#080c14',
        '--surface-canvas': '#080c14',
        '--surface-card': '#0d131f',
        '--surface-raised': '#0d131f',
        '--surface-subtle': '#090d16',
        '--surface-inset': '#070a10',
        '--fg-primary': '#ffffff',
        '--fg-secondary': '#94a3b8',
        '--fg-muted': '#64748b',
        '--accent': '#06b6d4',
        '--accent-hover': '#22d3ee',
        '--fg-accent': '#06b6d4',
        '--bg-accent-emphasis': '#06b6d4',
        '--bg-accent-muted': 'rgba(6, 182, 212, 0.15)',
        '--border-accent-emphasis': '#06b6d4',
        '--focus-outline': '#06b6d4',
        '--border-default': '#1e293b',
        '--border-outer-input': '#1e293b',
        '--border-inner-input': '#1e293b',
        '--border-subtle': '#1e293b',
        '--border-strong': '#334155',
        '--border-accent': '#06b6d4',
        '--bg-btn-primary': '#06b6d4',
        '--fg-btn-primary': '#020617',
        '--bg-btn-secondary': '#0d131f',
        '--border-btn-secondary': '#1e293b',
        '--control-active-bg': '#0d131f',
        '--control-active-fg': '#ffffff',
        '--bg-input': '#0d131f',
        '--border-focus': '#06b6d4',
        '--chat-bubble-user': '#090d16',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#ffffff',
        '--chat-bubble-assistant-text': '#ffffff'
      });

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('light', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO UPDATE
        SET tokens = $1::jsonb, updated_at = CURRENT_TIMESTAMP
      `, [canonicalLightTokens]);

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('dark', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO UPDATE
        SET tokens = $1::jsonb, updated_at = CURRENT_TIMESTAMP
      `, [canonicalDarkTokens]);
    });

    await runVersioned('v108_allow_null_user_id_in_media_assets', 'Ensure user_id in media_assets table is nullable and does not enforce a NOT NULL constraint', async (tx) => {
      await tx.query(`
        ALTER TABLE media_assets ALTER COLUMN user_id DROP NOT NULL
      `);
    });

    await runVersioned('v109_sanitize_registry_db_connections', 'Sanitize localhost connection strings in db_connections_registry when core DB is remote', async (tx) => {
      const coreUrl = process.env.DATABASE_URL;
      if (coreUrl && !coreUrl.includes('localhost') && !coreUrl.includes('127.0.0.1')) {
        const encryptedCore = encrypt(coreUrl);
        const rows = await tx.query(`SELECT id, connection_string, host FROM db_connections_registry WHERE id IN ('ledger', 'external', 'security', 'media')`);
        for (const row of rows.rows) {
          let shouldUpdate = false;
          if (row.host === 'localhost' || row.host === '127.0.0.1') {
            shouldUpdate = true;
          } else if (row.connection_string) {
            try {
              const dec = decrypt(row.connection_string);
              if (dec && (dec.includes('localhost') || dec.includes('127.0.0.1'))) {
                shouldUpdate = true;
              }
            } catch {}
          }
          if (shouldUpdate) {
            await tx.query(
              `UPDATE db_connections_registry SET connection_string = $1, host = NULL, status = 'healthy' WHERE id = $2`,
              [encryptedCore, row.id]
            );
          }
        }
      }
    });

    await runVersioned('v110_apply_sovereign_identity_v4_tokens', 'Apply Perplexta Sovereign Identity v4.0 design tokens to database tables and system settings', async (tx) => {
      const canonicalLightTokens = JSON.stringify({
        '--surface-page': '#ffffff',
        '--surface-canvas': '#ffffff',
        '--surface-card': '#ffffff',
        '--surface-raised': '#ffffff',
        '--surface-subtle': '#f6f8fa',
        '--surface-inset': '#f6f8fa',
        '--fg-primary': '#1f2328',
        '--fg-secondary': '#656d76',
        '--fg-muted': '#656d76',
        '--accent': '#0969da',
        '--accent-hover': '#0550ae',
        '--fg-accent': '#0969da',
        '--bg-accent-emphasis': '#1a7f37',
        '--bg-accent-muted': 'rgba(9, 105, 218, 0.12)',
        '--border-accent-emphasis': '#0969da',
        '--focus-outline': '#0969da',
        '--border-default': '#d0d7de',
        '--border-outer-input': '#d0d7de',
        '--border-inner-input': '#d0d7de',
        '--border-subtle': '#d0d7de',
        '--border-strong': '#656d76',
        '--border-accent': '#0969da',
        '--bg-btn-primary': '#1a7f37',
        '--fg-btn-primary': '#ffffff',
        '--bg-btn-secondary': '#f6f8fa',
        '--border-btn-secondary': '#d0d7de',
        '--control-active-bg': '#f6f8fa',
        '--control-active-fg': '#0969da',
        '--bg-input': '#ffffff',
        '--border-focus': '#0969da',
        '--chat-bubble-user': '#f6f8fa',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#1f2328',
        '--chat-bubble-assistant-text': '#1f2328'
      });

      const canonicalDarkTokens = JSON.stringify({
        '--surface-page': '#0d1117',
        '--surface-canvas': '#0d1117',
        '--surface-card': '#161b22',
        '--surface-raised': '#161b22',
        '--surface-subtle': '#161b22',
        '--surface-inset': '#010409',
        '--fg-primary': '#e6edf3',
        '--fg-secondary': '#8b949e',
        '--fg-muted': '#8b949e',
        '--accent': '#58a6ff',
        '--accent-hover': '#79c0ff',
        '--fg-accent': '#58a6ff',
        '--bg-accent-emphasis': '#238636',
        '--bg-accent-muted': 'rgba(88, 166, 255, 0.15)',
        '--border-accent-emphasis': '#58a6ff',
        '--focus-outline': '#58a6ff',
        '--border-default': '#3d444d',
        '--border-outer-input': '#3d444d',
        '--border-inner-input': '#3d444d',
        '--border-subtle': '#3d444d',
        '--border-strong': '#8b949e',
        '--border-accent': '#58a6ff',
        '--bg-btn-primary': '#238636',
        '--fg-btn-primary': '#ffffff',
        '--bg-btn-secondary': '#161b22',
        '--border-btn-secondary': '#3d444d',
        '--control-active-bg': '#161b22',
        '--control-active-fg': '#58a6ff',
        '--bg-input': '#21262d',
        '--border-focus': '#58a6ff',
        '--chat-bubble-user': '#161b22',
        '--chat-bubble-assistant': 'transparent',
        '--chat-bubble-user-text': '#e6edf3',
        '--chat-bubble-assistant-text': '#e6edf3'
      });

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('light', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO UPDATE
        SET tokens = $1::jsonb, updated_at = CURRENT_TIMESTAMP
      `, [canonicalLightTokens]);

      await tx.query(`
        INSERT INTO admin_theme_customizations (theme_mode, tokens, updated_at)
        VALUES ('dark', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (theme_mode) DO UPDATE
        SET tokens = $1::jsonb, updated_at = CURRENT_TIMESTAMP
      `, [canonicalDarkTokens]);

      const fontConfigJson = JSON.stringify({
        ar: { fontFamily: 'Tajawal', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap' },
        en: { fontFamily: 'Geist', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
        dynamicLoading: true
      });

      await tx.query(`
        UPDATE system_settings
        SET 
          font_loading_config = $1::jsonb,
          font_config_ar = $2::jsonb,
          font_config_en = $3::jsonb,
          site_name_en = CASE WHEN site_name_en = 'Perplexa' THEN 'Perplexta' ELSE site_name_en END,
          site_name_ar = CASE WHEN site_name_ar = 'بيربليكسا' THEN 'بيربليكستا' ELSE site_name_ar END
        WHERE id = (SELECT id FROM system_settings ORDER BY id ASC LIMIT 1)
      `, [
        fontConfigJson,
        JSON.stringify({ fontFamily: 'Tajawal', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap' }),
        JSON.stringify({ fontFamily: 'Geist', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' })
      ]).catch(() => {});
    });

    await runVersioned('v111_add_data_saver_column_to_users', 'Ensure data_saver BOOLEAN column exists on users table for aggressive content compression', async (tx) => {
      await tx.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS data_saver BOOLEAN DEFAULT false`);
    });

    await runVersioned('v112_finalize_perplexta_identity', 'Ensure official Perplexta branding across system settings and metadata', async (tx) => {
      await tx.query(`
        UPDATE system_settings
        SET 
          site_name_en = CASE WHEN site_name_en = 'Perplexa' OR site_name_en IS NULL OR site_name_en = '' THEN 'Perplexta' ELSE site_name_en END,
          site_name_ar = CASE WHEN site_name_ar = 'بيربليكسا' OR site_name_ar IS NULL OR site_name_ar = '' THEN 'بيربليكستا' ELSE site_name_ar END,
          seo_site_name_en = CASE WHEN seo_site_name_en = 'Perplexa' OR seo_site_name_en IS NULL OR seo_site_name_en = '' THEN 'Perplexta' ELSE seo_site_name_en END,
          seo_site_name_ar = CASE WHEN seo_site_name_ar = 'بيربليكسا' OR seo_site_name_ar IS NULL OR seo_site_name_ar = '' THEN 'بيربليكستا' ELSE seo_site_name_ar END
        WHERE id = (SELECT id FROM system_settings ORDER BY id ASC LIMIT 1)
      `).catch(() => {});
    });

    // v113 is enabled per Audit Plan Phase 3 (confirmed 0 live consumers in codebase)
    await runVersioned('v113_drop_legacy_cost_columns', 'Drop legacy point deduction and wallet cost columns and indices from tool_orchestrator table', async (tx) => {
      await tx.query(`
        ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS wallet_cost;
        ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS points_required;
        ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS cost_per_usage;
        ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS cost_per_1k_input_tokens;
        ALTER TABLE tool_orchestrator DROP COLUMN IF EXISTS cost_per_1k_output_tokens;
      `).catch((err) => {
        console.warn('[Migration v113] Warning during legacy cost columns dropping:', err.message);
      });
    });

    await runVersioned('v114_unrestrict_media_assets_context', 'Drop restrictive context check constraints on media_assets to allow all media types and contexts', async (tx) => {
      await tx.query(`
        ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS chk_media_assets_context;
        ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_context_check;
      `).catch((err) => {
        console.warn('[Migration v114] Warning dropping media_assets context check on primary pool:', err.message);
      });
    });

    // Phase 2 & 4 Reconciliation Migrations
    await runVersioned('v115_unify_media_assets_storage', 'Reconcile and unify media_assets into dedicated Media DB and clean orphaned columns', async (tx) => {
      await tx.query(`
        ALTER TABLE media_assets DROP COLUMN IF EXISTS blog_article_id;
        ALTER TABLE media_assets DROP COLUMN IF EXISTS marketplace_item_id;
      `).catch((err) => {
        console.warn('[Migration v115] Warning cleaning media_assets columns:', err.message);
      });
    });

    await runVersioned('v116_security_split_data_reconciliation', 'Verify and reconcile security audit indexes and integrity across Security DB split', async (tx) => {
      await tx.query(`
        CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
        CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id);
        CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at);
      `).catch((err) => {
        console.warn('[Migration v116] Warning during security split index reconciliation:', err.message);
      });
    });

    await runVersioned('v117_drop_ghost_external_tables', 'Drop decommissioned ghost external tables (external_articles, external_categories, external_sync_logs)', async (tx) => {
      const ext = externalClient || tx;
      await ext.query(`DROP TABLE IF EXISTS external_sync_logs, external_categories, external_articles CASCADE`).catch((err: any) => {
        console.warn('[Migration v117] Notice during external ghost tables cleanup:', err.message);
      });
    });

    await runVersioned('v118_migrate_deprecated_orchestrator_gemini_models', 'Migrate deprecated Gemini models in tool_orchestrator to active models (gemini-3.6-flash / gemini-3.1-pro-preview)', async (tx) => {
      await tx.query(`
        UPDATE tool_orchestrator
        SET primary_model = 'models/gemini-3.6-flash'
        WHERE primary_model IN ('models/gemini-2.5-flash', 'gemini-2.5-flash', 'models/gemini-2.0-flash', 'gemini-2.0-flash', 'models/gemini-1.5-flash', 'gemini-1.5-flash');

        UPDATE tool_orchestrator
        SET primary_model = 'models/gemini-3.1-pro-preview'
        WHERE primary_model IN ('models/gemini-2.5-pro', 'gemini-2.5-pro', 'models/gemini-2.0-pro', 'gemini-2.0-pro', 'models/gemini-1.5-pro', 'gemini-1.5-pro');

        UPDATE tool_orchestrator
        SET fallback_1_model = 'models/gemini-3.6-flash'
        WHERE fallback_1_model IN ('models/gemini-2.5-flash', 'gemini-2.5-flash', 'models/gemini-2.0-flash', 'gemini-2.0-flash', 'models/gemini-1.5-flash', 'gemini-1.5-flash');

        UPDATE tool_orchestrator
        SET fallback_2_model = 'models/gemini-3.6-flash'
        WHERE fallback_2_model IN ('models/gemini-2.5-flash', 'gemini-2.5-flash', 'models/gemini-2.0-flash', 'gemini-2.0-flash', 'models/gemini-1.5-flash', 'gemini-1.5-flash');
      `).catch((err: any) => {
        console.warn('[Migration v118] Notice migrating deprecated models:', err.message);
      });
    });

    await runVersioned('v119_isolate_gpu_tools_and_clean_orchestrator', 'Enforce absolute GPU and media compute isolation by purging text LLM fallbacks from media/vision tools', async (tx) => {
      await tx.query(`
        UPDATE tool_orchestrator
        SET fallback_1_provider = '', fallback_1_model = '',
            fallback_2_provider = '', fallback_2_model = '',
            fallback_3_provider = '', fallback_3_model = ''
        WHERE tool_id IN ('vision', 'perplexta_vision', 'image', 'video', 'canvas', 'stt', 'tts', 'perplexta_music')
          AND (fallback_1_provider IN ('google', 'openai', 'anthropic', 'deepseek', 'groq')
               OR fallback_2_provider IN ('google', 'openai', 'anthropic', 'deepseek', 'groq')
               OR fallback_3_provider IN ('google', 'openai', 'anthropic', 'deepseek', 'groq'));

        UPDATE tool_orchestrator
        SET primary_provider = '', primary_model = ''
        WHERE tool_id IN ('vision', 'perplexta_vision', 'image', 'video')
          AND primary_provider IN ('google', 'openai', 'anthropic', 'deepseek', 'groq');
      `).catch((err: any) => {
        console.warn('[Migration v119] Notice isolating GPU tools:', err.message);
      });
    });

    await runVersioned('v120_add_post_code_and_ownership_metadata', 'Add post_code and author_username to bulletin_ads and page slug/owner columns for privacy and ownership', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS post_code VARCHAR(50)`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS author_username VARCHAR(100)`);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bulletin_ads_post_code ON bulletin_ads(post_code) WHERE post_code IS NOT NULL`);
      
      await tx.query(`ALTER TABLE bulletin_pages ADD COLUMN IF NOT EXISTS slug VARCHAR(120)`);
      await tx.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bulletin_pages_slug ON bulletin_pages(slug) WHERE slug IS NOT NULL`);

      // Auto-generate post_code for existing ads where post_code is NULL
      const existingAds = await tx.query(`SELECT id FROM bulletin_ads WHERE post_code IS NULL OR post_code = ''`);
      for (const ad of existingAds.rows) {
        const code = 'PX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await tx.query(`UPDATE bulletin_ads SET post_code = $1 WHERE id = $2 AND (post_code IS NULL OR post_code = '')`, [code, ad.id]).catch(() => {});
      }

      // Auto-generate slug for existing bulletin_pages where slug is NULL
      const existingPages = await tx.query(`SELECT id, name FROM bulletin_pages WHERE slug IS NULL OR slug = ''`);
      for (const pg of existingPages.rows) {
        const cleanSlug = (pg.name || 'page')
          .toLowerCase()
          .trim()
          .replace(/[^\w\u0600-\u06FF\s-]/g, '')
          .replace(/[\s_]+/g, '-') + '-' + pg.id;
        await tx.query(`UPDATE bulletin_pages SET slug = $1 WHERE id = $2 AND (slug IS NULL OR slug = '')`, [cleanSlug, pg.id]).catch(() => {});
      }
    });

    await runVersioned('v121_production_query_indexes_optimization', 'Create composite indexes on bulletin_ads, messages, and ledger_transactions for high-concurrency production', async (tx) => {
      // 1. Core DB: Feed & Location composite indexes
      await tx.query(`
        CREATE INDEX IF NOT EXISTS idx_bulletin_ads_feed ON bulletin_ads (status, is_boosted DESC, created_at DESC) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_bulletin_ads_location ON bulletin_ads (location_city, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages (chat_id, created_at ASC);
      `).catch((err: any) => {
        console.warn('[Migration v121] Notice creating core production indexes:', err.message);
      });

      // 2. Ledger DB: Ledger transactions composite index (strict segregation)
      await ledgerTarget.query(`
        CREATE INDEX IF NOT EXISTS idx_ledger_tx_user_created ON ledger_transactions (user_id, created_at DESC) WHERE is_hidden IS NOT TRUE;
      `).catch((err: any) => {
        console.warn('[Migration v121] Notice creating ledger production indexes:', err.message);
      });
    });

    await runVersioned('v122_repair_gemini_orchestrator_fallbacks', 'Configure multi-layer silent fallbacks and update primary models in tool_orchestrator for 503 high-demand resilience', async (tx) => {
      await tx.query(`
        -- Fast chat & search tools: Primary gemini-3.8-flash, Fallback 1 gemini-3.6-flash, Fallback 2 gemini-3.1-flash-lite
        UPDATE tool_orchestrator
        SET primary_provider = 'google',
            primary_model = 'models/gemini-3.8-flash',
            fallback_1_provider = 'google',
            fallback_1_model = 'models/gemini-3.6-flash',
            fallback_2_provider = 'google',
            fallback_2_model = 'models/gemini-3.1-flash-lite'
        WHERE tool_id IN ('chat_fast', 'sovereign_search', 'ads_copilot', 'x402_api');

        -- Deep reasoning & code tools: Primary gemini-3.8-flash, Fallback 1 gemini-3.1-pro-preview, Fallback 2 gemini-3.6-flash
        UPDATE tool_orchestrator
        SET primary_provider = 'google',
            primary_model = 'models/gemini-3.8-flash',
            fallback_1_provider = 'google',
            fallback_1_model = 'models/gemini-3.1-pro-preview',
            fallback_2_provider = 'google',
            fallback_2_model = 'models/gemini-3.6-flash'
        WHERE tool_id IN ('chat_pro', 'chat_reasoning', 'code', 'perplexta_analysis');

        -- Ensure any other tool currently stuck on only gemini-3.6-flash has fallback protection
        UPDATE tool_orchestrator
        SET primary_model = 'models/gemini-3.8-flash',
            fallback_1_provider = 'google',
            fallback_1_model = 'models/gemini-3.6-flash'
        WHERE primary_model = 'models/gemini-3.6-flash'
          AND (fallback_1_model IS NULL OR fallback_1_model = '' OR fallback_1_model = 'models/gemini-3.6-flash')
          AND tool_id NOT IN ('vision', 'perplexta_vision', 'image', 'video', 'canvas', 'stt', 'tts', 'perplexta_music');
      `).catch((err: any) => {
        console.warn('[Migration v122] Notice configuring orchestrator fallbacks:', err.message);
      });
    });

    await runVersioned('v123_bulletin_ad_boost_settings', 'Add boost_goal, boost_daily_budget, boost_settings to bulletin_ads', async (tx) => {
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS boost_goal VARCHAR(100) DEFAULT 'whatsapp_leads'`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS boost_daily_budget NUMERIC(10,2) DEFAULT 2.00`);
      await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS boost_settings JSONB DEFAULT '{}'`);
    });

    await runVersioned('v124_platform_categories_and_targeting', 'Create and populate platform_categories table for rich business and interest targeting', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS platform_categories (
          id VARCHAR(100) PRIMARY KEY,
          name_ar VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          group_id VARCHAR(100) NOT NULL,
          group_ar VARCHAR(255) NOT NULL,
          group_en VARCHAR(255) NOT NULL,
          icon VARCHAR(50) DEFAULT 'Layers',
          audience_reach BIGINT DEFAULT 150000,
          keywords TEXT[] DEFAULT '{}',
          is_featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_platform_categories_group ON platform_categories (group_id);
        CREATE INDEX IF NOT EXISTS idx_platform_categories_featured ON platform_categories (is_featured);
      `);
    });

    await runVersioned('v125_ad_targeting_categories_seed', 'Seed master business and technology categories into platform_categories table for targeted advertising', async (tx) => {
      await syncMasterCategoriesToDatabase(tx);
    });

    await runVersioned('v126_plans_custom_billing_cycles', 'Add custom billing cycles (days, monthly control, annual control) to plans table', async (tx) => {
      await tx.query(`
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_monthly_enabled BOOLEAN DEFAULT true;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_annual_enabled BOOLEAN DEFAULT true;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_daily_enabled BOOLEAN DEFAULT false;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS daily_price NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS daily_days INTEGER DEFAULT 7;
      `);
    });

    await runVersioned('v127_email_logs_and_notification_delivery_tracking', 'Add email tracking columns (is_sent, retry_count, last_error, sent_at) to notifications and create user_email_logs table', async (tx) => {
      await tx.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT false`);
      await tx.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP`);
      await tx.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0`);
      await tx.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS last_error TEXT`);

      await tx.query(`
        CREATE TABLE IF NOT EXISTS user_email_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          recipient_email VARCHAR(255) NOT NULL,
          template_name VARCHAR(255) NOT NULL DEFAULT 'custom',
          subject VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          sent_at TIMESTAMP,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await tx.query(`CREATE INDEX IF NOT EXISTS idx_user_email_logs_recipient ON user_email_logs (recipient_email)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_user_email_logs_status ON user_email_logs (status)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_user_email_logs_template ON user_email_logs (template_name)`);
    });

    await runVersioned('v128_email_logs_deliverability_table', 'Create email_logs table for email deliverability tracking with user_id, template_name, status, is_sent, retry_count, last_error, created_at', async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          recipient VARCHAR(255),
          template_name VARCHAR(255) NOT NULL DEFAULT 'custom',
          status VARCHAR(50) DEFAULT 'pending',
          is_sent BOOLEAN DEFAULT false,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await tx.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs (user_id)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON email_logs (template_name)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status)`);
      await tx.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_is_sent ON email_logs (is_sent)`);
    });

    await runVersioned('v129_consolidate_email_logs', 'Consolidate user_email_logs into single unified email_logs table with recipient_email, subject, sent_at and status indexes', async (tx) => {
      await tx.query(`ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255)`);
      await tx.query(`ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT ''`);
      await tx.query(`ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP`);

      // Populate recipient_email from recipient if empty (safely checking if column exists first)
      const hasRecipient = await columnExists(tx, 'email_logs', 'recipient');
      if (hasRecipient) {
        await tx.query(`UPDATE email_logs SET recipient_email = recipient WHERE recipient_email IS NULL AND recipient IS NOT NULL`);
      }

      // Migrate records from user_email_logs if table exists
      await tx.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_email_logs') THEN
            INSERT INTO email_logs (user_id, recipient_email, template_name, subject, status, is_sent, retry_count, last_error, sent_at, metadata, created_at, updated_at)
            SELECT user_id, recipient_email, template_name, subject, status, (status = 'sent'), retry_count, last_error, sent_at, metadata, created_at, updated_at
            FROM user_email_logs
            ON CONFLICT DO NOTHING;
          END IF;
        END $$;
      `);

      await tx.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs (recipient_email)`);
    });

    if (!existingMigrations.has('v121_bulletin_schema_perfection')) {
      await runVersioned('v130_bulletin_schema_perfection', 'Synchronize media_urls, reaction, managers and audio metadata across bulletin tables', async (tx) => {
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::JSONB`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS post_code VARCHAR(50)`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS author_username VARCHAR(100)`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS audio_url TEXT`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS audio_title VARCHAR(255)`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS audio_artist VARCHAR(255)`);
        await tx.query(`ALTER TABLE bulletin_ads ADD COLUMN IF NOT EXISTS audio_track_id VARCHAR(100)`);
        await tx.query(`ALTER TABLE bulletin_pages ADD COLUMN IF NOT EXISTS managers JSONB DEFAULT '[]'::JSONB`);
        await tx.query(`ALTER TABLE bulletin_ad_likes ADD COLUMN IF NOT EXISTS reaction VARCHAR(20) DEFAULT 'like'`);
        await tx.query(`ALTER TABLE bulletin_comment_likes ADD COLUMN IF NOT EXISTS reaction VARCHAR(20) DEFAULT 'like'`);
        
        await tx.query(`
          UPDATE bulletin_ads 
          SET media_urls = jsonb_build_array(image_url) 
          WHERE (media_urls IS NULL OR media_urls = '[]'::jsonb) 
            AND image_url IS NOT NULL 
            AND image_url != ''
        `);
      });
    }

    await runVersioned('v131_plans_and_subscriptions_credit_engine', 'Add daily_credits, monthly_credits, annual_credits to plans and cycle_credits, used_credits, last_reset_at to subscriptions', async (tx) => {
      await tx.query(`
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS daily_credits INTEGER DEFAULT 0;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 0;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS annual_credits INTEGER DEFAULT 0;

        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cycle_credits INTEGER DEFAULT 0;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        UPDATE plans SET
          monthly_credits = CASE 
            WHEN monthly_credits > 0 THEN monthly_credits
            WHEN monthly_price > 0 THEN ROUND(COALESCE(monthly_price, 0) * 1000)
            ELSE 100
          END,
          annual_credits = CASE 
            WHEN annual_credits > 0 THEN annual_credits
            WHEN annual_price > 0 THEN ROUND(COALESCE(annual_price, 0) * 1000)
            WHEN monthly_price > 0 THEN ROUND(COALESCE(monthly_price, 0) * 12 * 1000)
            ELSE 1200
          END,
          daily_credits = CASE 
            WHEN daily_credits > 0 THEN daily_credits
            WHEN daily_price > 0 THEN ROUND(COALESCE(daily_price, 0) * 1000)
            ELSE 0
          END;
      `);
    });
    
  console.log("[Migrations] All versioned migrations completed successfully.");
}
