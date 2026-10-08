import '../bootstrapEnv.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { pool, initializePerplextaPools } from '../db/index.js';
import { runDatabaseMigrations, verifySchemaIntegrity } from '../db/migrations.js';
import { syncSystemTemplates } from '../services/email.js';
import { refreshCachedAppName } from '../services/system.js';
import { ensureAdsSeedData } from '../routes/ads.js';
import { ensureBulletinSeedData } from '../routes/bulletin.js';

async function migrateAndVerifyDatabases() {
  console.log('================================================================');
  console.log('[PERPLEXTA DB MIGRATION RUNNER] Running Sequential Migrations via Migration History...');
  console.log('================================================================');

  // ===== STEP 0: MULTI-DATABASE BACKUP BEFORE MIGRATIONS =====
  const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
  const coreUrl = process.env.DATABASE_URL || '';
  const ledgerUrl = process.env.LEDGER_DATABASE_URL || coreUrl;
  const externalUrl = process.env.EXTERNAL_DATABASE_URL || coreUrl;
  const securityUrl = process.env.SECURITY_DATABASE_URL || coreUrl;
  const mediaUrl = process.env.MEDIA_DATABASE_URL || coreUrl;

  if (process.env.NODE_ENV === 'production') {
    const timestamp = Date.now();
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const uniqueDbUrls: { name: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    const candidateDbs = [
      { name: 'core', url: coreUrl },
      { name: 'ledger', url: ledgerUrl },
      { name: 'external', url: externalUrl },
      { name: 'security', url: securityUrl },
      { name: 'media', url: mediaUrl }
    ];

    for (const db of candidateDbs) {
      if (db.url && !seenUrls.has(db.url)) {
        seenUrls.add(db.url);
        uniqueDbUrls.push(db);
      }
    }

    for (const db of uniqueDbUrls) {
      const backupFile = path.join(BACKUP_DIR, `backup_${db.name}_${timestamp}.sql`);
      try {
        console.log(`[Migrate] Creating backup for ${db.name} DB to ${backupFile}...`);
        await execAsync(`pg_dump "${db.url}" > "${backupFile}"`);
        console.log(`[Migrate] ✅ Backup created for ${db.name}: ${backupFile}`);
      } catch (bkErr: any) {
        console.warn(`[Migrate] Backup warning for ${db.name}:`, bkErr?.message || bkErr);
      }
    }
  }
  // ============================================

  console.log('[DB Migration] Initializing connection pools for Core, Ledger, External, Security, and Media databases...');
  await initializePerplextaPools(coreUrl, ledgerUrl, externalUrl, securityUrl, mediaUrl);

  if (!pool) {
    console.error('[DB Migration] ❌ Critical: Database pool could not be established. Aborting.');
    process.exit(1);
  }

  console.log('\n[DB Migration] 🔄 Executing sequential migration chain across all pools...');
  console.log('[DB Migration] Running runDatabaseMigrations("all", "additive")...');
  
  const migrationResult = await runDatabaseMigrations('all', 'additive');
  
  if (!migrationResult || !migrationResult.success) {
    console.error('[DB Migration] ❌ Sequential migration execution failed:', migrationResult);
    process.exit(1);
  }

  console.log('\n[DB Migration] ✅ Sequential migrations applied successfully.');
  console.log(`[DB Migration] Total migrations evaluated/executed: ${migrationResult.totalMigrations ?? 0}`);

  console.log('\n[DB Migration] 🚀 Synchronizing System Templates & Seed Data...');
  try {
    await syncSystemTemplates();
    console.log('[DB Migration] ✓ Email system templates synchronized.');
  } catch (e: any) {
    console.warn('[DB Migration] Notice on email templates sync:', e?.message || e);
  }

  try {
    await refreshCachedAppName();
    console.log('[DB Migration] ✓ System name cache refreshed.');
  } catch (e: any) {
    console.warn('[DB Migration] Notice on app name refresh:', e?.message || e);
  }

  try {
    await ensureAdsSeedData();
    console.log('[DB Migration] ✓ Ads system seed data ensured.');
  } catch (e: any) {
    console.warn('[DB Migration] Notice on ads seed:', e?.message || e);
  }

  try {
    await ensureBulletinSeedData();
    console.log('[DB Migration] ✓ Bulletin board seed data ensured.');
  } catch (e: any) {
    console.warn('[DB Migration] Notice on bulletin seed:', e?.message || e);
  }

  console.log('\n[DB Migration] 🔍 Verifying multi-pool schema integrity...');
  await verifySchemaIntegrity();

  console.log('\n================================================================');
  console.log('[PERPLEXTA DB MIGRATION RUNNER] 🎉 ALL DATABASES SYNCHRONIZED AND VERIFIED TO IDENTICAL TARGET STATE!');
  console.log('================================================================');

  process.exit(0);
}

migrateAndVerifyDatabases().catch((err) => {
  console.error('[DB Migration] ❌ FATAL ERROR during database migration:', err);
  process.exit(1);
});
