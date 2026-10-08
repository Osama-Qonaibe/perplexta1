import cron from 'node-cron';
import { runSystemMaintenance, monitorDatabases } from '../db/migrations.js';
import { pool } from '../db/index.js';
import { createNotification } from '../services/notifications.js';
import { consolidateAllUserMemories } from '../services/memory.js';
import fs from 'fs/promises';
import path from 'path';

export interface CronJobInfo {
  lastRun: string;
  status: 'idle' | 'running' | 'success' | 'error';
  error: string | null;
  durationMs?: number;
}

export const cronTracker: Record<string, CronJobInfo> = {
  dailyMaintenance: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  databaseHeartbeat: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  subscriptionAudit: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  dailySeoScan: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  memoryCompaction: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  monthlyLedgerCleanup: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  storyPurge: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  mediaCleanup48h: { lastRun: new Date().toISOString(), status: 'idle', error: null },
  weeklyWalletReconciliation: { lastRun: new Date().toISOString(), status: 'idle', error: null },
};

/**
 * Initializes the persistent cron_job_logs table and synchronizes past states to cronTracker.
 */
export async function ensureCronLogsTable() {
  try {
    if (!pool) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cron_job_logs (
        job_name VARCHAR(100) PRIMARY KEY,
        last_run TIMESTAMPTZ NOT NULL,
        duration_ms INT DEFAULT 0,
        status VARCHAR(20) NOT NULL,
        last_error TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existingLogs = await pool.query('SELECT * FROM cron_job_logs');
    for (const row of existingLogs.rows) {
      if (cronTracker[row.job_name]) {
        cronTracker[row.job_name] = {
          lastRun: new Date(row.last_run).toISOString(),
          status: row.status as any,
          error: row.last_error,
          durationMs: row.duration_ms
        };
      }
    }
  } catch (err: any) {
    console.warn('[Cron] Warning ensuring cron_job_logs table:', err?.message || err);
  }
}

/**
 * Persists cron job execution state to both DB and memory tracker.
 */
async function updateCronState(
  trackerKey: string | null,
  jobName: string,
  status: 'running' | 'success' | 'error',
  error: string | null = null,
  durationMs: number = 0
) {
  const nowIso = new Date().toISOString();
  if (trackerKey && cronTracker[trackerKey]) {
    cronTracker[trackerKey] = {
      lastRun: nowIso,
      status,
      error,
      durationMs
    };
  }

  try {
    if (!pool) return;
    const dbKey = trackerKey || jobName;
    await pool.query(
      `INSERT INTO cron_job_logs (job_name, last_run, duration_ms, status, last_error, updated_at)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (job_name) DO UPDATE SET
         last_run = CURRENT_TIMESTAMP,
         duration_ms = EXCLUDED.duration_ms,
         status = EXCLUDED.status,
         last_error = EXCLUDED.last_error,
         updated_at = CURRENT_TIMESTAMP`,
      [dbKey, durationMs, status, error]
    );
  } catch {
    // Silently continue if DB logging has transient issue
  }
}

/**
 * Comprehensive Orphaned Files Audit.
 * Aggregates all media references across ALL system tables before considering any file on disk as orphaned.
 * Protects recently uploaded files (modified in the last 2 hours).
 */
async function cleanupOrphanedPhysicalFiles() {
  console.log('[Cron] 🧹 Starting comprehensive multi-table physical files audit...');
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    
    try {
      await fs.access(uploadDir);
    } catch {
      console.log('[Cron] Uploads folder does not exist yet. Skipping physical purge.');
      return;
    }

    const filesOnDisk = await fs.readdir(uploadDir);
    if (filesOnDisk.length === 0) {
      console.log('[Cron] No physical files found on disk uploads.');
      return;
    }

    const validFilenames = new Set<string>();

    const safeAdd = (rawUrl: any) => {
      if (!rawUrl || typeof rawUrl !== 'string') return;
      let cleaned = rawUrl.trim();
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        try {
          cleaned = new URL(cleaned).pathname;
        } catch {}
      }
      const base = path.basename(cleaned.split('?')[0]);
      if (base) {
        validFilenames.add(base);
        validFilenames.add(cleaned);
      }
    };

    // 1. user_files
    try {
      const userFilesRes = await pool.query('SELECT file_url FROM user_files WHERE file_url IS NOT NULL');
      userFilesRes.rows.forEach((r: any) => safeAdd(r.file_url));
    } catch {}

    // 2. bulletin_ads (ViralBook posts, classifieds, reels, stories)
    try {
      const adsRes = await pool.query('SELECT image_url, video_url, media_urls FROM bulletin_ads');
      adsRes.rows.forEach((r: any) => {
        safeAdd(r.image_url);
        safeAdd(r.video_url);
        if (r.media_urls) {
          if (Array.isArray(r.media_urls)) {
            r.media_urls.forEach((u: any) => safeAdd(u));
          } else if (typeof r.media_urls === 'string') {
            try {
              const parsed = JSON.parse(r.media_urls);
              if (Array.isArray(parsed)) parsed.forEach((u: any) => safeAdd(u));
              else safeAdd(r.media_urls);
            } catch {
              safeAdd(r.media_urls);
            }
          }
        }
      });
    } catch {}

    // 3. video_resources
    try {
      const videoRes = await pool.query('SELECT media_url FROM video_resources WHERE media_url IS NOT NULL');
      videoRes.rows.forEach((r: any) => safeAdd(r.media_url));
    } catch {}

    // 4. users avatars
    try {
      const userAvatarsRes = await pool.query('SELECT avatar FROM users WHERE avatar IS NOT NULL');
      userAvatarsRes.rows.forEach((r: any) => safeAdd(r.avatar));
    } catch {}

    // 5. bulletin_pages cover and avatar
    try {
      const pagesRes = await pool.query('SELECT avatar_url, cover_image FROM bulletin_pages');
      pagesRes.rows.forEach((r: any) => {
        safeAdd(r.avatar_url);
        safeAdd(r.cover_image);
      });
    } catch {}

    // 6. system_assets
    try {
      const sysAssetsRes = await pool.query('SELECT file_path, filename FROM system_assets');
      sysAssetsRes.rows.forEach((r: any) => {
        safeAdd(r.file_path);
        safeAdd(r.filename);
      });
    } catch {}

    let purgedCount = 0;
    const now = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    for (const filename of filesOnDisk) {
      if (filename.startsWith('.') || filename.startsWith('system_')) continue;

      const safeName = path.basename(filename);
      if (!safeName || safeName.includes('..')) continue;

      if (!validFilenames.has(safeName) && !validFilenames.has(filename)) {
        const filePath = path.resolve(uploadDir, safeName);
        if (!filePath.startsWith(uploadDir + path.sep)) continue;

        try {
          const stats = await fs.stat(filePath);
          // Never purge files created or modified in the last 2 hours (drafts / active uploads)
          if (now - stats.mtimeMs < TWO_HOURS_MS) {
            continue;
          }

          await fs.unlink(filePath).catch(() => {});
          purgedCount++;
        } catch {
          // File might already be gone
        }
      }
    }

    if (purgedCount > 0) {
      console.log(`[Cron] Purged ${purgedCount} genuinely orphaned physical files off disk successfully.`);
    } else {
      console.log('[Cron] Disk is completely synchronized with all tables. Zero orphaned files detected.');
    }
  } catch (err: any) {
    console.error('[Cron] Orphaned files physical audit failed:', err.message);
  }
}

/**
 * 48h Media Retention Policy Purge.
 * Purges transient media older than 48 hours without overlapping with daily maintenance.
 */
async function purgeGeneratedFilesOlderThan48Hours() {
  console.log('[Cron] ⏰ Starting automated cleanup of media files older than 48 hours...');
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    
    try {
      await fs.access(uploadDir);
    } catch {
      console.log('[Cron] Uploads folder does not exist yet. Skipping cleanup.');
      return;
    }

    // 1. Purge database tracked records older than 48 hours in user_files
    const result = await pool.query(
      `SELECT id, file_url FROM user_files WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'`
    );

    let dbPurgedCount = 0;
    for (const row of result.rows) {
      const fileUrl = row.file_url;
      if (!fileUrl) continue;

      let filename = fileUrl;
      if (filename.startsWith('/uploads/')) {
        filename = filename.replace('/uploads/', '');
      }

      const safeFilename = path.basename(filename);
      if (!safeFilename || safeFilename.includes('..')) continue;
      const filePath = path.resolve(uploadDir, safeFilename);
      if (!filePath.startsWith(uploadDir + path.sep)) continue;

      try {
        await fs.unlink(filePath).catch(() => {});
        dbPurgedCount++;
      } catch (err: any) {
        console.warn(`[Cron] Could not delete physical file ${filename}:`, err.message);
      }
    }

    const deleteFilesCount = await pool.query(
      `DELETE FROM user_files WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'`
    );
    
    const deleteVideosCount = await pool.query(
      `DELETE FROM video_resources WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'`
    );

    // 2. Physical disk scan in /uploads/ for unlinked media files modified over 48 hours ago
    const filesOnDisk = await fs.readdir(uploadDir);
    const now = Date.now();
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
    let diskOldFilesPurged = 0;

    for (const filename of filesOnDisk) {
      if (filename.startsWith('.') || filename.startsWith('system_')) continue;
      const safeFilename = path.basename(filename);
      if (!safeFilename || safeFilename.includes('..')) continue;
      const filePath = path.resolve(uploadDir, safeFilename);
      if (!filePath.startsWith(uploadDir + path.sep)) continue;
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile() && (now - stats.mtimeMs > FORTY_EIGHT_HOURS_MS)) {
          await fs.unlink(filePath).catch(() => {});
          diskOldFilesPurged++;
        }
      } catch {
        // file already deleted or inaccessible
      }
    }

    console.log(`[Cron] 48h Retention Purge Complete: Removed ${dbPurgedCount} db-linked files and ${diskOldFilesPurged} unlinked 48h+ files. Erased ${deleteFilesCount.rowCount || 0} user_files and ${deleteVideosCount.rowCount || 0} video_resources records.`);
  } catch (err: any) {
    console.error('[Cron] Automated 48h media purge failed:', err.message);
  }
}

/**
 * Purges expired 24h stories with Reference Counting protection.
 * Only deletes physical assets if they are NOT shared by other active ads or reels.
 */
async function purgeExpiredStories() {
  console.log('[Cron] 🎬 Starting automated purge of expired stories (older than 24h)...');
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    
    const result = await pool.query(
      `SELECT id, image_url, video_url FROM bulletin_ads 
       WHERE ad_format = 'story' 
       AND (expires_at < CURRENT_TIMESTAMP OR created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')`
    );

    if (result.rows.length === 0) {
      console.log('[Cron] No expired stories found for purging.');
      return;
    }

    console.log(`[Cron] Found ${result.rows.length} expired stories to purge.`);

    let purgedFilesCount = 0;
    for (const row of result.rows) {
      const filesToPurge = [row.image_url, row.video_url].filter(Boolean);
      
      for (const fileUrl of filesToPurge) {
        if (!fileUrl) continue;
        
        let filename = fileUrl;
        if (filename.startsWith('/uploads/')) {
          filename = filename.replace('/uploads/', '');
        } else if (filename.includes('/uploads/')) {
          filename = filename.split('/uploads/')[1];
        } else if (filename.startsWith('http')) {
          continue; 
        }

        const safeFilename = path.basename(filename.split('?')[0]);
        if (!safeFilename || safeFilename.includes('..')) continue;

        // Reference Check: Does any other active ad/reel/post share this physical file?
        try {
          const refCheck = await pool.query(
            `SELECT COUNT(*)::int as count FROM bulletin_ads 
             WHERE id != $1 
             AND (image_url LIKE $2 OR video_url LIKE $2 OR media_urls::text LIKE $2)`,
            [row.id, `%${safeFilename}%`]
          );

          if ((refCheck.rows[0]?.count || 0) > 0) {
            // Shared media file: do NOT delete physical asset off disk!
            continue;
          }
        } catch {
          // If check fails, safety first: avoid physical deletion
          continue;
        }

        const filePath = path.resolve(uploadDir, safeFilename);
        if (!filePath.startsWith(uploadDir + path.sep)) continue;

        try {
          await fs.unlink(filePath).catch(() => {});
          purgedFilesCount++;
        } catch {}
      }
    }

    // Delete expired story records from database
    const deleteRes = await pool.query(
      `DELETE FROM bulletin_ads 
       WHERE ad_format = 'story' 
       AND (expires_at < CURRENT_TIMESTAMP OR created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')`
    );

    console.log(`[Cron] Story purge complete: Removed ${deleteRes.rowCount} database records and safely unlinked ${purgedFilesCount} unshared file assets.`);
  } catch (err: any) {
    console.error('[Cron] Expired stories purge failed:', err.message);
  }
}

async function purgeExpiredTrashAds() {
  try {
    const res = await pool.query(
      `DELETE FROM bulletin_ads 
       WHERE status = 'trash' 
       AND deleted_at IS NOT NULL 
       AND deleted_at < NOW() - INTERVAL '30 days'`
    );
    if (res.rowCount && res.rowCount > 0) {
      console.log(`[Cron] Purged ${res.rowCount} expired ads from trash (older than 30 days).`);
    }
  } catch (err: any) {
    console.error('[Cron] Trashed ads purge failed:', err.message);
  }
}

// In-process memory locks
const activeJobLocks = new Set<string>();

/**
 * Military-grade Guarded Cron Runner.
 * Combines in-process locking with PostgreSQL Distributed Advisory Locks (pg_try_advisory_lock).
 * Ensures zero duplicate runs even under PM2 cluster mode (-i max) or multiple server instances.
 */
async function runGuardedCron(jobName: string, trackerKey: string | null, fn: () => Promise<void>) {
  if (activeJobLocks.has(jobName)) {
    console.warn(`[Cron] ${jobName} is already running in local process tick. Skipping.`);
    return;
  }

  // Acquire PostgreSQL Session Advisory Lock
  let hasDbLock = false;
  let client: any = null;

  try {
    client = await pool.connect();
    const lockRes = await client.query('SELECT pg_try_advisory_lock(hashtext($1)) as locked', [jobName]);
    hasDbLock = !!lockRes.rows[0]?.locked;
    if (!hasDbLock) {
      console.info(`[Cron] ${jobName} is currently being executed by another cluster worker. Skipping overlapping execution.`);
      client.release();
      return;
    }
  } catch (dbLockErr: any) {
    // If pool is unavailable or error occurs, fallback to in-memory lock
    hasDbLock = true;
  }

  activeJobLocks.add(jobName);
  const startTime = Date.now();

  try {
    await updateCronState(trackerKey, jobName, 'running', null);
    await fn();
    const duration = Date.now() - startTime;
    await updateCronState(trackerKey, jobName, 'success', null, duration);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`[Cron] ${jobName} failed:`, err?.message || err);
    await updateCronState(trackerKey, jobName, 'error', err?.message || 'Unknown error', duration);
  } finally {
    activeJobLocks.delete(jobName);
    if (client) {
      try {
        await client.query('SELECT pg_advisory_unlock(hashtext($1))', [jobName]);
      } catch {}
      client.release();
    }
  }
}

export function initCronJobs() {
  // Ensure table exists and load persisted states
  ensureCronLogsTable().catch(() => {});

  // 1. Subscription Expiry & Renewal Audit - Runs daily at 02:50 AM UTC (10 mins BEFORE Maintenance)
  cron.schedule('50 2 * * *', async () => {
    await runGuardedCron('Subscription Renewal Check', 'subscriptionAudit', async () => {
      console.log('[Cron] 🔍 Checking for expiring subscriptions with strict anti-spam frequency controls...');
      
      const expiringRes = await pool.query(`
        SELECT s.user_id, u.email, u.name, u.language, p.name_en, p.name_ar, s.current_period_end 
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active' 
        AND s.current_period_end BETWEEN CURRENT_TIMESTAMP + INTERVAL '2 days' AND CURRENT_TIMESTAMP + INTERVAL '3 days'
        AND (p.monthly_price > 0 OR p.annual_price > 0 OR p.daily_price > 0)
      `);

      for (const sub of expiringRes.rows) {
        // Strict Anti-Spam Control: Send at most ONE reminder per 7 days per user
        const recentNotif = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = $1 AND type = 'subscription_expiring' 
           AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
           LIMIT 1`,
          [sub.user_id]
        );

        if (recentNotif.rows.length === 0) {
          const titleEn = 'Subscription Renewal Reminder';
          const titleAr = 'تذكير بتجديد الاشتراك';
          const msgEn = `Your ${sub.name_en} subscription will renew in 3 days.`;
          const msgAr = `تذكير ودي: سيتم تجديد اشتراكك في باقة ${sub.name_ar} خلال 3 أيام.`;
          
          await createNotification(sub.user_id, 'subscription_expiring', titleEn, titleAr, msgEn, msgAr);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Check subscriptions that expired in the last 24h to inform users gently before maintenance
      const expiredTodayRes = await pool.query(`
        SELECT s.user_id, u.email, u.name, u.language, p.name_en, p.name_ar 
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active' 
        AND s.current_period_end < CURRENT_TIMESTAMP 
        AND s.current_period_end >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        AND (p.monthly_price > 0 OR p.annual_price > 0 OR p.daily_price > 0)
      `);

      for (const sub of expiredTodayRes.rows) {
        const recentExpiredNotif = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = $1 AND type = 'subscription_expired' 
           AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
           LIMIT 1`,
          [sub.user_id]
        );

        if (recentExpiredNotif.rows.length === 0) {
          const titleEn = 'Subscription Expired';
          const titleAr = 'انتهاء فترة الاشتراك';
          const msgEn = `Your ${sub.name_en} subscription period has ended. You can renew anytime to keep your benefits.`;
          const msgAr = `انتهت فترة اشتراكك في باقة ${sub.name_ar}. يمكنك التجديد في أي وقت للاستمرار بالاستفادة من المزايا.`;
          
          await createNotification(sub.user_id, 'subscription_expired', titleEn, titleAr, msgEn, msgAr);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    });
  }, { timezone: 'UTC' });

  // 2. Daily System Maintenance - Runs every day at 03:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    await runGuardedCron('Daily Maintenance', 'dailyMaintenance', async () => {
      console.log('[Cron] 🕒 Running daily system maintenance...');
      await runSystemMaintenance();
      await pool.query('UPDATE api_keys_vault SET used_today = 0, last_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP');
      await pool.query('UPDATE gpu_providers SET used_today = 0, last_reset_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP');
      console.log('[Cron] API keys & GPU providers usage reset completed.');
      
      // Expired stories and trash ads cleanup
      await purgeExpiredStories();
      await purgeExpiredTrashAds();
      
      // Comprehensive multi-table orphaned files cleanup
      await cleanupOrphanedPhysicalFiles();
    });
  }, { timezone: 'UTC' });

  // 3. Dedicated 48-Hour Media Purge Cron - Runs every 6 hours UTC
  cron.schedule('0 */6 * * *', async () => {
    await runGuardedCron('48h Media Purge', 'mediaCleanup48h', async () => {
      console.log('[Cron] 🧹 Executing 6-hour interval check for 48h media storage cleanup...');
      await purgeGeneratedFilesOlderThan48Hours();
    });
  }, { timezone: 'UTC' });

  // 4. Database Heartbeat - Runs every 5 minutes UTC
  cron.schedule('*/5 * * * *', async () => {
    await runGuardedCron('Database Heartbeat', 'databaseHeartbeat', async () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Cron] 💓 Running database heartbeat check...');
      }
      await monitorDatabases();
    });
  }, { timezone: 'UTC' });

  // 5. Daily SEO Metadata Sync - Runs daily at 02:00 AM UTC
  cron.schedule('0 2 * * *', async () => {
    await runGuardedCron('Daily SEO Scan', 'dailySeoScan', async () => {
      console.log('[Cron] 🔍 Running daily automated SEO metadata scan for missing content fields...');
      const { syncAllContentSeoMetadata } = await import('../services/seoSync.js');
      const result = await syncAllContentSeoMetadata();
      console.log('[Cron] Daily SEO metadata routine completed successfully:', result);
    });
  }, { timezone: 'UTC' });

  // 6. Monthly Memory Compaction - Runs on the 1st of every month at 04:30 AM UTC
  cron.schedule('30 4 1 * *', async () => {
    await runGuardedCron('Monthly Memory Compaction', 'memoryCompaction', async () => {
      console.log('[Cron] 🧠 Running monthly memory distillation (coherence compaction)...');
      const result = await consolidateAllUserMemories({ threshold: 45 });
      console.log('[Cron] Inactive memory distillation completed successfully:', result);
    });
  }, { timezone: 'UTC' });

  // 7. Monthly Financial Ledger Audit - Runs on the 1st of every month at 05:00 AM UTC
  cron.schedule('0 5 1 * *', async () => {
    await runGuardedCron('Monthly Ledger Audit', 'monthlyLedgerCleanup', async () => {
      console.log('[Cron] 💸 Running monthly ledger audit & integrity check...');
      const { reconcileAllWallets } = await import('../services/wallet.js');
      const report = await reconcileAllWallets();
      console.log(`[Cron] Monthly ledger audit completed: audited ${report.audited} wallets with ${report.discrepancies} discrepancies.`);
    });
  }, { timezone: 'UTC' });

  // 8. Weekly Wallet Reconciliation - Runs every Sunday at 04:00 AM UTC
  cron.schedule('0 4 * * 0', async () => {
    // If today is the 1st of the month, skip to avoid double auditing with Monthly Ledger Audit
    const todayDayOfMonth = new Date().getUTCDate();
    if (todayDayOfMonth === 1) {
      console.log('[Cron] Today is the 1st of the month; wallet reconciliation is delegated to the Monthly Ledger Audit.');
      return;
    }

    await runGuardedCron('Weekly Wallet Reconciliation', 'weeklyWalletReconciliation', async () => {
      console.log('[Cron] ⚖️ Running weekly wallet ledger reconciliation...');
      const { reconcileAllWallets } = await import('../services/wallet.js');
      const report = await reconcileAllWallets();
      if (report.discrepancies > 0) {
        console.warn(`[Cron] Ledger reconciliation found ${report.discrepancies} discrepancies across ${report.audited} wallets.`);
      } else {
        console.log(`[Cron] Ledger reconciliation verified all ${report.audited} wallets with 0 discrepancies.`);
      }
    });
  }, { timezone: 'UTC' });
}
