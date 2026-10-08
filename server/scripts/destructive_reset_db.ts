import '../bootstrapEnv.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

// ===== DESTRUCTIVE OPERATION - FORBIDDEN IN PRODUCTION =====
if (process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] destructive_reset_db.ts is FORBIDDEN in production');
}
// ============================================================

import { pool, initializePerplextaPools } from '../db/index.js';
import { runDatabaseMigrations, verifySchemaIntegrity } from '../db/migrations.js';
import { syncSystemTemplates } from '../services/email.js';
import { refreshCachedAppName } from '../services/system.js';
import { ensureAdsSeedData } from '../routes/ads.js';
import { ensureBulletinSeedData } from '../routes/bulletin.js';

async function destructiveResetDatabases() {
  console.log('================================================================');
  console.log('[PERPLEXTA DESTRUCTIVE RESET RUNNER] 🔥 WARNING: THIS WILL DESTROY AND SCRATCH RECREATE ALL TABLES!');
  console.log('================================================================');

  if (process.env.CONFIRM_DESTRUCTIVE_RESET !== 'YES') {
    console.error('❌ ERROR: Destructive reset aborted because confirmation safety environment variable is not set.');
    console.error('To run this script, you MUST set CONFIRM_DESTRUCTIVE_RESET=YES in your environment or command line.');
    console.error('Example: CONFIRM_DESTRUCTIVE_RESET=YES npm run db:reset:destructive');
    process.exit(1);
  }

  const coreUrl = process.env.DATABASE_URL || '';
  const ledgerUrl = process.env.LEDGER_DATABASE_URL || coreUrl;
  const externalUrl = process.env.EXTERNAL_DATABASE_URL || coreUrl;
  const securityUrl = process.env.SECURITY_DATABASE_URL || coreUrl;
  const mediaUrl = process.env.MEDIA_DATABASE_URL || coreUrl;

  console.log('[DB Reset] Initializing connection pools...');
  await initializePerplextaPools(coreUrl, ledgerUrl, externalUrl, securityUrl, mediaUrl);

  if (!pool) {
    console.error('[DB Reset] ❌ Critical: Database pool could not be established. Aborting.');
    process.exit(1);
  }

  console.log('\n[DB Reset] 🔄 Executing destructive scratch migrations on all pools...');
  const migrationResult = await runDatabaseMigrations('all', 'scratch');
  
  if (!migrationResult || !migrationResult.success) {
    console.error('[DB Reset] ❌ Destructive migration failed:', migrationResult);
    process.exit(1);
  }

  console.log('\n[DB Reset] ✅ Scratch database reconstruction complete.');
  console.log(`[DB Reset] Total migrations executed: ${migrationResult.totalMigrations ?? 0}`);

  console.log('\n[DB Reset] 🚀 Synchronizing System Templates & Seed Data...');
  try {
    await syncSystemTemplates();
  } catch (e: any) {
    console.warn('[DB Reset] Email templates sync notice:', e?.message || e);
  }

  try {
    await refreshCachedAppName();
  } catch (e: any) {
    console.warn('[DB Reset] App name refresh notice:', e?.message || e);
  }

  try {
    await ensureAdsSeedData();
  } catch (e: any) {
    console.warn('[DB Reset] Ads seed notice:', e?.message || e);
  }

  try {
    await ensureBulletinSeedData();
  } catch (e: any) {
    console.warn('[DB Reset] Bulletin seed notice:', e?.message || e);
  }

  console.log('\n[DB Reset] 🔍 Verifying schema integrity...');
  await verifySchemaIntegrity();

  console.log('\n================================================================');
  console.log('[PERPLEXTA DESTRUCTIVE RESET RUNNER] 🎉 DESTRUCTIVE DATABASE RESET COMPLETED SUCCESSFULY!');
  console.log('================================================================');

  process.exit(0);
}

destructiveResetDatabases().catch((err) => {
  console.error('[DB Reset] ❌ FATAL ERROR during destructive reset:', err);
  process.exit(1);
});
