import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { pool, mediaPool } from '../db/index.js';
import { optimizeUploadedImage } from './mediaOptimizationService.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

/**
 * Proactively scans the /uploads directory for non-optimized images (.jpg, .jpeg, .png)
 * and automatically generates:
 * 1. Compressed WebP versions
 * 2. High-speed .webp thumbnails/previews
 * 
 * Then updates all referencing database tables (user_files, bulletin_ads, advertisements, users)
 * with the optimized file paths and sizes to maximize page-load efficiency.
 */
let isScanningUploads = false;

export async function auditAndOptimizeUploadsFolder(): Promise<{ scanned: number; optimized: number; errors: number }> {
  if (isScanningUploads) {
    return { scanned: 0, optimized: 0, errors: 0 };
  }
  isScanningUploads = true;

  let scanned = 0;
  let optimized = 0;
  let errors = 0;

  try {
    await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});
    const files = await fs.readdir(uploadsDir);

    const imageFiles = files.filter(f => {
      const lower = f.toLowerCase();
      return (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) &&
             !lower.includes('_opt') &&
             !lower.includes('_thumb') &&
             !lower.endsWith('.webp') &&
             !lower.startsWith('brand_') &&
             !lower.startsWith('pwa-') &&
             !lower.startsWith('favicon') &&
             !lower.startsWith('apple-touch');
    });

    scanned = imageFiles.length;
    if (scanned === 0) {
      return { scanned: 0, optimized: 0, errors: 0 };
    }

    console.log(`[Uploads Monitor] Found ${scanned} non-optimized images in /uploads. Starting WebP auto-compression...`);

    for (const file of imageFiles) {
      const filePath = path.join(uploadsDir, file);
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      const expectedWebp = `${baseName}_opt.webp`;
      const expectedWebpPath = path.join(uploadsDir, expectedWebp);

      const thumbFilename = `${baseName}_thumb.webp`;
      const thumbFilePath = path.join(uploadsDir, thumbFilename);

      try {
        const stats = await fs.stat(expectedWebpPath).catch(() => null);
        let optResult;

        if (stats && stats.isFile()) {
          console.log(`[Uploads Monitor] Optimized WebP already exists for ${file}. Verifying database registration...`);
          // We can generate fallback metadata if already optimized
          const webpStats = await fs.stat(expectedWebpPath);
          const metadata = await sharp(expectedWebpPath).metadata().catch(() => ({ width: 800, height: 600 }));
          optResult = {
            filename: expectedWebp,
            fileUrl: `/uploads/${expectedWebp}`,
            storedPath: `uploads/${expectedWebp}`,
            width: metadata.width || 800,
            height: metadata.height || 600,
            size: webpStats.size,
            format: 'webp',
          };
        } else {
          console.log(`[Uploads Monitor] Optimizing image: ${file} -> WebP`);
          optResult = await optimizeUploadedImage(filePath, file);
          optimized++;
        }

        // Generate high-speed preview/thumbnail (width 250px) if not exists
        const thumbStats = await fs.stat(thumbFilePath).catch(() => null);
        if (!thumbStats) {
          try {
            const finalWebpPath = path.join(uploadsDir, optResult.filename);
            const webpBuffer = await fs.readFile(finalWebpPath);
            await sharp(webpBuffer)
              .rotate()
              .resize({
                width: 250,
                height: 250,
                fit: 'inside',
                withoutEnlargement: true
              })
              .webp({ quality: 65 })
              .toFile(thumbFilePath);
            console.log(`[Uploads Monitor] Generated low-latency thumbnail: ${thumbFilename}`);
          } catch (thumbErr: any) {
            console.warn(`[Uploads Monitor] Thumbnail generation failed for ${file}:`, thumbErr.message);
          }
        }

        // Synchronize Database Records for Maximum Page Load Efficiency
        if (pool) {
          const oldUrl = `/uploads/${file}`;
          const oldRelative = `uploads/${file}`;
          const newUrl = `/uploads/${optResult.filename}`;
          const newRelative = `uploads/${optResult.filename}`;
          const thumbUrl = `/uploads/${thumbFilename}`;

          // A. Update user_files table (including the BYTEA file_data binary for DB sync)
          try {
            const optimizedFileBuffer = await fs.readFile(expectedWebpPath).catch(() => null);
            if (optimizedFileBuffer) {
              const fileRes = await pool.query(
                `UPDATE user_files 
                 SET file_url = $1, 
                     file_size = $2, 
                     mime_type = 'image/webp',
                     file_data = $3,
                     metadata = jsonb_set(
                       jsonb_set(
                         COALESCE(metadata, '{}'::jsonb), 
                         '{optimized}', 
                         'true'::jsonb
                       ),
                       '{thumbnail_url}',
                       $4::jsonb
                     ),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE file_url = $5 OR file_url = $6 OR file_url = $7 OR file_url = $8
                 RETURNING id`,
                [optResult.filename, optResult.size, optimizedFileBuffer, JSON.stringify(thumbUrl), file, oldUrl, oldRelative, optResult.filename]
              );
              if (fileRes.rows.length > 0) {
                console.log(`[Uploads Monitor] Updated user_files row IDs [${fileRes.rows.map((r: any) => r.id).join(', ')}] with WebP meta.`);
              }
            }

            // Sync with media_assets in the Media DB
            const targetMediaPool = mediaPool || pool;
            if (targetMediaPool && optimizedFileBuffer) {
              const sha256Hash = crypto.createHash('sha256').update(optimizedFileBuffer).digest('hex');
              const monitorAssetId = crypto.randomUUID();
              await targetMediaPool.query(`
                INSERT INTO media_assets (
                  id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public, file_data, metadata
                ) VALUES ($1, $2, $3, 'general', 'webp', $4, $5, $6, $7, true, $8, $9)
                ON CONFLICT (stored_path) DO UPDATE SET
                  format = 'webp',
                  size_bytes = EXCLUDED.size_bytes,
                  file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
                  sha256_hash = EXCLUDED.sha256_hash,
                  updated_at = CURRENT_TIMESTAMP
              `, [
                monitorAssetId, newRelative, file, optResult.width || 0, optResult.height || 0, optResult.size || 0, sha256Hash, optimizedFileBuffer,
                JSON.stringify({ autoOptimized: true, thumbnail_url: thumbUrl })
              ]).catch(() => {});
            }
          } catch (dbErr: any) {
            console.warn(`[Uploads Monitor] Failed to update user_files database metadata for ${file}:`, dbErr.message);
          }

          // B. Update bulletin_ads images
          try {
            const adRes = await pool.query(
              `UPDATE bulletin_ads 
               SET image_url = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE image_url = $2 OR image_url = $3 OR image_url = $4
               RETURNING id`,
              [newUrl, oldUrl, oldRelative, file]
            );
            if (adRes.rows.length > 0) {
              console.log(`[Uploads Monitor] Updated bulletin_ads IDs [${adRes.rows.map((r: any) => r.id).join(', ')}] image_url to optimized WebP.`);
            }
          } catch (dbErr: any) {
            console.warn(`[Uploads Monitor] Failed to update bulletin_ads for ${file}:`, dbErr.message);
          }

          // C. Update advertisements images
          try {
            const advertRes = await pool.query(
              `UPDATE advertisements 
               SET image_url = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE image_url = $2 OR image_url = $3 OR image_url = $4
               RETURNING id`,
              [newUrl, oldUrl, oldRelative, file]
            );
            if (advertRes.rows.length > 0) {
              console.log(`[Uploads Monitor] Updated advertisements IDs [${advertRes.rows.map((r: any) => r.id).join(', ')}] image_url to optimized WebP.`);
            }
          } catch (dbErr: any) {
            console.warn(`[Uploads Monitor] Failed to update advertisements for ${file}:`, dbErr.message);
          }

          // D. Update users avatars
          try {
            const userRes = await pool.query(
              `UPDATE users 
               SET avatar = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE avatar = $2 OR avatar = $3 OR avatar = $4
               RETURNING id`,
              [newUrl, oldUrl, oldRelative, file]
            );
            if (userRes.rows.length > 0) {
              console.log(`[Uploads Monitor] Updated users avatar for IDs [${userRes.rows.map((r: any) => r.id).join(', ')}] to optimized WebP.`);
            }
          } catch (dbErr: any) {
            console.warn(`[Uploads Monitor] Failed to update users avatar for ${file}:`, dbErr.message);
          }
        }

      } catch (err: any) {
        errors++;
        console.error(`[Uploads Monitor] Failed to process/optimize ${file}:`, err?.message || err);
      }
    }

    if (optimized > 0) {
      console.log(`[Uploads Monitor] Successfully auto-optimized ${optimized} images to WebP and generated thumbnails.`);
    }
  } catch (err: any) {
    console.error('[Uploads Monitor] Error reading uploads directory:', err?.message || err);
  } finally {
    isScanningUploads = false;
  }

  return { scanned, optimized, errors };
}

/**
 * Initializes proactive background monitoring for the /uploads folder.
 * Runs an initial check after 5 seconds, then every 15 minutes.
 */
export function initUploadsMonitor() {
  setTimeout(() => {
    auditAndOptimizeUploadsFolder().catch(err => {
      console.error('[Uploads Monitor] Initial audit failed:', err);
    });
  }, 5000);

  setInterval(() => {
    auditAndOptimizeUploadsFolder().catch(err => {
      console.error('[Uploads Monitor] Periodic audit failed:', err);
    });
  }, 15 * 60 * 1000);

  console.log('[Uploads Monitor] Background image optimizer & database sync service initialized.');
}
