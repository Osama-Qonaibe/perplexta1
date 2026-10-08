import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';
import { mediaPool, pool } from '../db/index.js';

export interface ImageOptimizationResult {
  assetId?: string;
  filename: string;
  fileUrl: string;
  storedPath: string;
  width: number;
  height: number;
  size: number;
  format: string;
  sha256Hash: string;
}

const CONTEXT_CONSTRAINTS: Record<string, { maxWidth: number; maxHeight: number; quality: number }> = {
  avatar: { maxWidth: 512, maxHeight: 512, quality: 85 },
  bulletin: { maxWidth: 1200, maxHeight: 1200, quality: 85 },
  ad: { maxWidth: 1200, maxHeight: 1200, quality: 85 },
  seo: { maxWidth: 1200, maxHeight: 630, quality: 90 },
  general: { maxWidth: 1920, maxHeight: 1080, quality: 85 }
};

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Validates and optimizes uploaded image files:
 * - Checks validity using sharp
 * - Resizes according to context bounds
 * - Strips EXIF/metadata for privacy
 * - Outputs clean WebP
 * - Calculates SHA-256 and registers into media_assets table
 */
export async function optimizeUploadedImage(
  filePath: string,
  originalFilename: string,
  context: string = 'general',
  isPublic: boolean = true,
  associations?: { userId?: number }
): Promise<ImageOptimizationResult> {
  const ext = path.extname(originalFilename).toLowerCase();
  const safeBase = path.basename(filePath, ext).replace(/[^a-zA-Z0-9_-]/g, '');
  const baseName = safeBase || 'img';
  const constraints = CONTEXT_CONSTRAINTS[context] || CONTEXT_CONSTRAINTS.general;

  try {
    const fileBuffer = await fs.readFile(filePath);
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Deduplication check: if asset with same hash exists in media_assets
    if (mediaPool) {
      try {
        const existingAsset = await mediaPool.query(
          'SELECT id, stored_path, format, width, height, size_bytes FROM media_assets WHERE sha256_hash = $1 LIMIT 1',
          [sha256Hash]
        );
        if (existingAsset.rows.length > 0) {
          const row = existingAsset.rows[0];
          const filename = path.basename(row.stored_path);
          const fullDiskPath = path.resolve(uploadsDir, filename);
          if (fullDiskPath.startsWith(uploadsDir + path.sep) && existsSync(fullDiskPath)) {
            // Delete the temporary uploaded file
            if (path.resolve(filePath) !== fullDiskPath) {
              await fs.unlink(filePath).catch(() => {});
            }
            return {
              assetId: row.id,
              filename,
              fileUrl: `/uploads/${filename}`,
              storedPath: `uploads/${filename}`,
              width: row.width,
              height: row.height,
              size: row.size_bytes,
              format: row.format,
              sha256Hash
            };
          }
        }
      } catch (dbErr: any) {
        console.warn('[Media Optimization] Deduplication check warning:', dbErr.message);
      }
    }

    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    const origWidth = metadata.width || 800;
    const origHeight = metadata.height || 600;

    let targetFormat = 'webp';
    let optimizedFilename: string;
    let optimizedFilePath: string;

    if (ext === '.svg' || ext === '.gif') {
      targetFormat = ext.replace('.', '');
      optimizedFilename = `${baseName}_opt${ext}`;
      optimizedFilePath = path.resolve(uploadsDir, optimizedFilename);
      if (!optimizedFilePath.startsWith(uploadsDir + path.sep)) {
        throw new Error('Path traversal detected');
      }
      await fs.copyFile(filePath, optimizedFilePath);
    } else {
      optimizedFilename = `${baseName}_opt.webp`;
      optimizedFilePath = path.resolve(uploadsDir, optimizedFilename);
      if (!optimizedFilePath.startsWith(uploadsDir + path.sep)) {
        throw new Error('Path traversal detected');
      }

      let pipeline = sharp(fileBuffer).rotate(); // auto-rotate based on EXIF before stripping

      if (context === 'seo') {
        pipeline = pipeline.resize({
          width: 1200,
          height: 630,
          fit: 'cover'
        });
      } else if (origWidth > constraints.maxWidth || origHeight > constraints.maxHeight) {
        pipeline = pipeline.resize({
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      await pipeline
        .webp({ quality: constraints.quality })
        .toFile(optimizedFilePath);
    }

    // Remove original file if different
    if (filePath !== optimizedFilePath) {
      await fs.unlink(filePath).catch(() => {});
    }

    const finalStats = await fs.stat(optimizedFilePath);
    const finalMetadata = await sharp(optimizedFilePath).metadata().catch(() => ({ width: origWidth, height: origHeight }));
    const finalWidth = finalMetadata.width || origWidth;
    const finalHeight = finalMetadata.height || origHeight;
    const storedPath = `uploads/${optimizedFilename}`;

    let assetId: string | undefined;

    // Register in media_assets table in target media pool
    const targetMediaDb = mediaPool || pool;
    if (targetMediaDb) {
      try {
        const optBuffer = await fs.readFile(optimizedFilePath).catch(() => null);
        const generatedAssetId = crypto.randomUUID();
        const insertRes = await targetMediaDb.query(`
          INSERT INTO media_assets (
            id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public,
            user_id, metadata, file_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (stored_path) DO UPDATE SET
            context = EXCLUDED.context,
            format = EXCLUDED.format,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            size_bytes = EXCLUDED.size_bytes,
            sha256_hash = EXCLUDED.sha256_hash,
            user_id = COALESCE(EXCLUDED.user_id, media_assets.user_id),
            file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          generatedAssetId,
          storedPath,
          originalFilename,
          context,
          targetFormat,
          finalWidth,
          finalHeight,
          finalStats.size,
          sha256Hash,
          isPublic,
          associations?.userId || null,
          JSON.stringify({ originalWidth: origWidth, originalHeight: origHeight }),
          optBuffer
        ]);
        if (insertRes.rows.length > 0) {
          assetId = insertRes.rows[0].id;
        }
      } catch (insertErr: any) {
        console.warn('[Media Optimization] media_assets insert warning:', insertErr.message);
      }
    }

    return {
      assetId,
      filename: optimizedFilename,
      fileUrl: `/uploads/${optimizedFilename}`,
      storedPath,
      width: finalWidth,
      height: finalHeight,
      size: finalStats.size,
      format: targetFormat,
      sha256Hash
    };
  } catch (err: any) {
    console.warn('[Media Optimization] Image processing warning (falling back to original):', err.message);
    const stats = await fs.stat(filePath).catch(() => ({ size: 0 }));
    const filename = path.basename(filePath);
    const storedPath = `uploads/${filename}`;
    const hash = crypto.createHash('sha256').update(filePath).digest('hex');

    return {
      filename,
      fileUrl: `/uploads/${filename}`,
      storedPath,
      width: 800,
      height: 600,
      size: stats.size,
      format: ext.replace('.', '') || 'unknown',
      sha256Hash: hash
    };
  }
}

/**
 * Optimizes a base64 encoded image string, writes it as a WebP file in uploads,
 * records it into media_assets, and returns the public relative URL.
 */
export async function optimizeBase64Image(
  base64Data: string,
  context: string = 'general',
  originalFilename: string = 'image.png',
  isPublic: boolean = true
): Promise<ImageOptimizationResult> {
  const match = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  const rawBase64 = match ? match[2] : base64Data;
  const buffer = Buffer.from(rawBase64, 'base64');
  const tempName = `temp_${crypto.randomUUID()}.png`;
  const tempPath = path.join(uploadsDir, tempName);

  await fs.writeFile(tempPath, buffer);
  return optimizeUploadedImage(tempPath, originalFilename, context, isPublic);
}

/**
 * Verifies and normalizes media path strings across DB and response payloads
 */
export function normalizeMediaUrl(urlOrPath: string | null | undefined): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  let clean = urlOrPath.split('?')[0].trim();

  // Strip duplicate /uploads/ prefixes
  clean = clean.replace(/^(\/)?(uploads\/)+/i, 'uploads/');

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }

  if (clean.startsWith('uploads/')) {
    return `/${clean}`;
  }

  if (clean.startsWith('/')) {
    return clean;
  }

  return `/uploads/${clean}`;
}

/**
 * Alias for normalizeMediaUrl providing comprehensive image URL normalization
 */
export function normalizeImageUrl(urlOrPath: string | null | undefined): string {
  return normalizeMediaUrl(urlOrPath);
}

/**
 * Retrieves a media asset by its UUID
 */
export async function getMediaAssetById(id: string) {
  if (!mediaPool) return null;
  try {
    const res = await mediaPool.query('SELECT * FROM media_assets WHERE id = $1', [id]);
    return res.rows[0] || null;
  } catch (err: any) {
    console.error('[Media Optimization] getMediaAssetById error:', err.message);
    return null;
  }
}

export async function findOrphanedMediaAssets() {
  if (!mediaPool) return [];
  try {
    const res = await mediaPool.query('SELECT * FROM media_assets ORDER BY created_at DESC');
    const allAssets = res.rows;
    if (allAssets.length === 0) return [];

    const referencedPaths = new Set<string>();
    if (pool) {
      const [usersRes, adsRes, advertsRes, settingsRes] = await Promise.all([
        pool.query('SELECT avatar FROM users WHERE avatar IS NOT NULL').catch(() => ({ rows: [] })),
        pool.query('SELECT image_url, media_urls FROM bulletin_ads').catch(() => ({ rows: [] })),
        pool.query('SELECT image_url FROM advertisements').catch(() => ({ rows: [] })),
        pool.query('SELECT logo_url, logo_light_url, seo_image_url, favicon_url FROM system_settings').catch(() => ({ rows: [] }))
      ]);

      for (const row of usersRes.rows) {
        if (row.avatar) referencedPaths.add(String(row.avatar));
      }
      for (const row of adsRes.rows) {
        if (row.image_url) referencedPaths.add(String(row.image_url));
        if (Array.isArray(row.media_urls)) {
          for (const u of row.media_urls) {
            if (u) referencedPaths.add(String(u));
          }
        }
      }
      for (const row of advertsRes.rows) {
        if (row.image_url) referencedPaths.add(String(row.image_url));
      }
      for (const row of settingsRes.rows) {
        if (row.logo_url) referencedPaths.add(String(row.logo_url));
        if (row.logo_light_url) referencedPaths.add(String(row.logo_light_url));
        if (row.seo_image_url) referencedPaths.add(String(row.seo_image_url));
        if (row.favicon_url) referencedPaths.add(String(row.favicon_url));
      }
    }

    const referencedAgg = Array.from(referencedPaths).join(' ');
    return allAssets.filter((m: any) => !referencedAgg.includes(m.stored_path));
  } catch (err: any) {
    console.error('[Media Optimization] findOrphanedMediaAssets error:', err.message);
    return [];
  }
}

/**
 * Deletes a media asset by ID and unlinks its physical file
 */
export async function deleteMediaAsset(id: string): Promise<boolean> {
  if (!mediaPool) return false;
  try {
    const res = await mediaPool.query('DELETE FROM media_assets WHERE id = $1 RETURNING stored_path', [id]);
    if (res.rows.length > 0) {
      const storedPath = res.rows[0].stored_path;
      const filename = path.basename(storedPath);
      const absPath = path.resolve(uploadsDir, filename);
      if (absPath.startsWith(uploadsDir + path.sep)) {
        await fs.unlink(absPath).catch(() => {});
      }
      return true;
    }
    return false;
  } catch (err: any) {
    console.error('[Media Optimization] deleteMediaAsset error:', err.message);
    return false;
  }
}
