import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import crypto from 'crypto';
import { pool, mediaPool } from '../db/index.js';
import { getCachedSystemSettings, invalidateSystemSettingsCache } from '../db/queries.js';

export interface IconVariantSpec {
  id: string;
  filename: string;
  width: number;
  height: number;
  format: 'png' | 'ico' | 'webp';
  purpose?: 'any' | 'maskable';
  description: string;
  category: 'favicon' | 'apple' | 'pwa' | 'tile';
  paddingPercent?: number; // e.g. 0.15 for 15% safe-zone margin
  background?: string;
}

export interface GeneratedAssetMeta {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  exists?: boolean;
  purpose?: 'any' | 'maskable';
  category: 'favicon' | 'apple' | 'pwa' | 'tile';
  description: string;
  dataUri?: string;
  generatedAt: string;
}

export interface SystemAssetStatusReport {
  success?: boolean;
  source: 'logo_url' | 'favicon_url' | 'default-logo';
  generatedAt: string | null;
  generatedCount?: number;
  timestamp?: number;
  favicon: boolean;
  appleTouchIcon: boolean;
  pwa192: boolean;
  pwa512: boolean;
  pwaMaskable: boolean;
  isReady: boolean;
  totalAssets: number;
  assets: GeneratedAssetMeta[];
  errors: string[];
}

export interface AssetGenerationResult {
  success: boolean;
  sourceType: string;
  sourceHash: string;
  generatedCount: number;
  assets: GeneratedAssetMeta[];
  timestamp: number;
}

/**
 * Standard specification for generated brand and PWA assets.
 * All output files are persisted strictly inside `uploads/brand/`.
 */
export const SYSTEM_ASSET_SPECS: IconVariantSpec[] = [
  // Browser Tab Favicons
  {
    id: 'favicon-16',
    filename: 'favicon-16x16.png',
    width: 16,
    height: 16,
    format: 'png',
    category: 'favicon',
    description: 'Crisp 16x16 browser tab favicon'
  },
  {
    id: 'favicon-32',
    filename: 'favicon-32x32.png',
    width: 32,
    height: 32,
    format: 'png',
    category: 'favicon',
    description: 'Standard 32x32 desktop & bookmark favicon'
  },
  {
    id: 'favicon-ico',
    filename: 'favicon.ico',
    width: 48,
    height: 48,
    format: 'ico',
    category: 'favicon',
    description: 'Multi-resolution Windows & browser ICO container (16/32/48)'
  },

  // Apple Touch Icon (iOS Safari & iPadOS)
  {
    id: 'apple-touch-icon',
    filename: 'apple-touch-icon.png',
    width: 180,
    height: 180,
    format: 'png',
    category: 'apple',
    description: 'iOS Safari home screen icon (180x180 PNG)'
  },

  // PWA Manifest Any-Purpose Icons
  {
    id: 'pwa-192',
    filename: 'pwa-192x192.png',
    width: 192,
    height: 192,
    format: 'png',
    purpose: 'any',
    category: 'pwa',
    description: 'Standard Android home screen & PWA launcher icon (192x192)'
  },
  {
    id: 'pwa-512',
    filename: 'pwa-512x512.png',
    width: 512,
    height: 512,
    format: 'png',
    purpose: 'any',
    category: 'pwa',
    description: 'High-resolution PWA splash screen & installer icon (512x512)'
  },

  // PWA Maskable Icon (Android Adaptive Icon with Safe-Zone Padding)
  {
    id: 'pwa-maskable-512',
    filename: 'pwa-maskable-512x512.png',
    width: 512,
    height: 512,
    format: 'png',
    purpose: 'maskable',
    category: 'pwa',
    paddingPercent: 0.15,
    description: 'Android adaptive maskable icon with 15% safe-zone margin (512x512)'
  },

  // Perplexta Sovereign AI Assistant Icons
  {
    id: 'assistant-icon-32',
    filename: 'assistant-icon-32x32.png',
    width: 32,
    height: 32,
    format: 'png',
    category: 'favicon',
    description: 'Sovereign AI Assistant compact header and response icon (32x32)'
  },
  {
    id: 'assistant-icon-64',
    filename: 'assistant-icon-64x64.png',
    width: 64,
    height: 64,
    format: 'png',
    category: 'pwa',
    description: 'Sovereign AI Assistant medium turbine icon (64x64)'
  },
  {
    id: 'assistant-icon-128',
    filename: 'assistant-icon-128x128.png',
    width: 128,
    height: 128,
    format: 'png',
    category: 'pwa',
    description: 'Sovereign AI Assistant high-res display turbine icon (128x128)'
  }
];

// In-memory cache of generated asset buffers for zero-latency HTTP serving
const assetMemoryCache = new Map<string, {
  buffer: Buffer;
  mime: string;
  etag: string;
  width: number;
  height: number;
  updatedAt: number;
}>();

let lastGenerationTimestamp = 0;
let lastSourceHash = '';
let activeSourceType: 'logo_url' | 'favicon_url' | 'default-logo' = 'default-logo';

/**
 * Flushes in-memory asset cache so that newly generated or uploaded brand assets
 * are served immediately with updated ETags.
 */
export function invalidateSystemAssetCache(): void {
  assetMemoryCache.clear();
  lastSourceHash = '';
  lastGenerationTimestamp = 0;
  console.log('[AssetManager] In-memory system asset cache invalidated.');
}

/**
 * Builds a binary ICO container packing multiple PNG frames (16x16, 32x32, 48x48)
 * strictly adhering to Windows ICO specification.
 */
export function buildIcoFromPngBuffers(pngFrames: { width: number; height: number; buffer: Buffer }[]): Buffer {
  const numImages = pngFrames.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalHeaderAndDirSize = headerSize + (numImages * dirEntrySize);

  let currentOffset = totalHeaderAndDirSize;
  const dirEntries: Buffer[] = [];

  for (const frame of pngFrames) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(frame.width >= 256 ? 0 : frame.width, 0);
    entry.writeUInt8(frame.height >= 256 ? 0 : frame.height, 1);
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(frame.buffer.length, 8); // Size
    entry.writeUInt32LE(currentOffset, 12); // Offset

    dirEntries.push(entry);
    currentOffset += frame.buffer.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(numImages, 4); // Count

  return Buffer.concat([header, ...dirEntries, ...pngFrames.map(f => f.buffer)]);
}

/**
 * Resolves source image input into a clean Buffer following the strict priority contract:
 * 1. favicon_url (if specifically requested for favicon generation)
 * 2. logo_url (primary source for all web and PWA icons)
 * 3. public/brand/default-logo.svg (the singular static fallback on disk)
 */
export async function resolveSourceImageBuffer(
  sourceInput?: string | Buffer | null,
  options: { preferFavicon?: boolean } = {}
): Promise<{ buffer: Buffer; format: string; hash: string; resolvedSource: 'logo_url' | 'favicon_url' | 'default-logo' } | null> {
  const defaultSvgPath = path.join(process.cwd(), 'public', 'brand', 'default-logo.svg');

  let rawBuffer: Buffer | null = null;
  let detectedFormat = 'png';
  let resolvedSource: 'logo_url' | 'favicon_url' | 'default-logo' = 'default-logo';

  // 1. Direct Buffer input
  if (Buffer.isBuffer(sourceInput) && sourceInput.length > 0) {
    rawBuffer = sourceInput;
    resolvedSource = 'logo_url';
  } else if (typeof sourceInput === 'string' && sourceInput.trim()) {
    const trimmed = sourceInput.trim();
    if (trimmed.startsWith('data:image/')) {
      const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        detectedFormat = match[1].toLowerCase() === 'svg+xml' ? 'svg' : match[1].toLowerCase();
        rawBuffer = Buffer.from(match[2], 'base64');
        resolvedSource = 'logo_url';
      }
    } else {
      // Disk path or relative URL
      if (!trimmed.includes('..') && !trimmed.includes('\0')) {
        const cleanPath = trimmed.replace(/^\//, '');
        const filename = path.basename(cleanPath);
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const brandUploadsDir = path.resolve(process.cwd(), 'uploads', 'brand');
        const publicDir = path.resolve(process.cwd(), 'public');

        const candidatePaths = [
          path.resolve(brandUploadsDir, filename),
          path.resolve(uploadsDir, filename),
          path.resolve(publicDir, filename)
        ];

        for (const p of candidatePaths) {
          if (
            (p.startsWith(uploadsDir + path.sep) || p.startsWith(publicDir + path.sep)) &&
            existsSync(p)
          ) {
            try {
              rawBuffer = await fs.readFile(p);
              const ext = path.extname(p).replace('.', '').toLowerCase();
              detectedFormat = ext === 'svg' ? 'svg' : (ext || 'png');
              resolvedSource = 'logo_url';
              break;
            } catch {
              // continue
            }
          }
        }
      }
    }
  }

  // 2. Query system_settings from database
  if (!rawBuffer) {
    try {
      const settings = await getCachedSystemSettings();
      
      // If preferFavicon is requested and favicon_url is defined, test it
      if (options.preferFavicon && settings?.favicon_url && typeof settings.favicon_url === 'string') {
        const res = await resolveSourceImageBuffer(settings.favicon_url);
        if (res) {
          return { ...res, resolvedSource: 'favicon_url' };
        }
      }

      // Main source: logo_url
      if (settings?.logo_url && typeof settings.logo_url === 'string' && settings.logo_url.trim()) {
        const res = await resolveSourceImageBuffer(settings.logo_url);
        if (res) {
          return { ...res, resolvedSource: 'logo_url' };
        }
      }
    } catch (e: any) {
      console.warn('[AssetManager] DB source logo resolution warning:', e.message);
    }
  }

  // 3. Fallback to public/brand/default-logo.svg
  if (!rawBuffer) {
    if (existsSync(defaultSvgPath)) {
      try {
        rawBuffer = await fs.readFile(defaultSvgPath);
        detectedFormat = 'svg';
        resolvedSource = 'default-logo';
      } catch (err: any) {
        console.error('[AssetManager] Failed to read default-logo.svg from disk:', err.message);
      }
    }
  }

  if (!rawBuffer || rawBuffer.length === 0) {
    return null;
  }

  const hash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
  return { buffer: rawBuffer, format: detectedFormat, hash, resolvedSource };
}

/**
 * Generates all favicon, apple-touch-icon, and PWA manifest icon sizes strictly from the approved source logo.
 * Writes outputs exclusively to `uploads/brand/` without touching `public/` or `public/manifest.json`.
 */
export async function generateAppIconsFromSource(
  sourceInput?: string | Buffer | null,
  options: { force?: boolean; registerInMediaAssets?: boolean } = {}
): Promise<AssetGenerationResult> {
  const resolved = await resolveSourceImageBuffer(sourceInput);
  if (!resolved) {
    throw new Error('Failed to resolve source logo image from system_settings or public/brand/default-logo.svg.');
  }

  const { buffer: sourceBuffer, format: sourceFormat, hash: sourceHash, resolvedSource } = resolved;
  activeSourceType = resolvedSource;

  const brandDir = path.join(process.cwd(), 'uploads', 'brand');
  if (!existsSync(brandDir)) {
    mkdirSync(brandDir, { recursive: true });
  }

  // Skip redundant generation if source hasn't changed and not forced
  if (!options.force && lastSourceHash === sourceHash && assetMemoryCache.size >= SYSTEM_ASSET_SPECS.length) {
    const cachedList: GeneratedAssetMeta[] = [];
    for (const spec of SYSTEM_ASSET_SPECS) {
      const cached = assetMemoryCache.get(spec.filename);
      if (cached) {
        cachedList.push({
          id: spec.id,
          filename: spec.filename,
          url: `/uploads/brand/${spec.filename}`,
          width: cached.width,
          height: cached.height,
          format: spec.format,
          sizeBytes: cached.buffer.length,
          purpose: spec.purpose,
          category: spec.category,
          description: spec.description,
          generatedAt: new Date(cached.updatedAt).toISOString()
        });
      }
    }
    return {
      success: true,
      sourceType: sourceFormat,
      sourceHash,
      generatedCount: cachedList.length,
      assets: cachedList,
      timestamp: lastGenerationTimestamp
    };
  }

  const isSvg = sourceFormat === 'svg' || sourceBuffer.toString('utf8', 0, 100).includes('<svg');
  
  const createSharpInstance = () => {
    return isSvg
      ? sharp(sourceBuffer, { density: 300 })
      : sharp(sourceBuffer);
  };

  const results: GeneratedAssetMeta[] = [];
  const icoFrames: { width: number; height: number; buffer: Buffer }[] = [];

  // 1. Generate individual PNG sizes first
  for (const spec of SYSTEM_ASSET_SPECS) {
    if (spec.format === 'ico') continue; // Composite ICO handled subsequently

    let outputBuffer: Buffer;
    const { width, height, paddingPercent } = spec;

    if (paddingPercent && paddingPercent > 0) {
      // Maskable icon with safe-zone padding:
      // Inner logo occupies (1 - 2 * paddingPercent) of total canvas (~70% of 512 = ~358px)
      const innerSize = Math.round(width * (1 - 2 * paddingPercent));
      const innerBuffer = await createSharpInstance()
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer();

      const baseCanvas = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background matching brand visual identity
        }
      }).png().toBuffer();

      outputBuffer = await sharp(baseCanvas)
        .composite([{ input: innerBuffer, gravity: 'center' }])
        .png({ compressionLevel: 9 })
        .toBuffer();
    } else {
      // Standard transparent fitted icon
      outputBuffer = await createSharpInstance()
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    // Collect frames for multi-res ICO container
    if (width === 16 || width === 32 || width === 48) {
      icoFrames.push({ width, height, buffer: outputBuffer });
    }

    // Save exclusively to uploads/brand/
    const brandTarget = path.join(brandDir, spec.filename);
    await fs.writeFile(brandTarget, outputBuffer);

    // Store in-memory cache with both root and brand path keys
    const etag = `"${crypto.createHash('md5').update(outputBuffer).digest('hex')}"`;
    const cacheEntry = {
      buffer: outputBuffer,
      mime: 'image/png',
      etag,
      width,
      height,
      updatedAt: Date.now()
    };
    assetMemoryCache.set(spec.filename, cacheEntry);
    assetMemoryCache.set(`brand/${spec.filename}`, cacheEntry);

    results.push({
      id: spec.id,
      filename: spec.filename,
      url: `/uploads/brand/${spec.filename}`,
      width,
      height,
      format: 'png',
      sizeBytes: outputBuffer.length,
      purpose: spec.purpose,
      category: spec.category,
      description: spec.description,
      dataUri: `data:image/png;base64,${outputBuffer.toString('base64')}`,
      generatedAt: new Date().toISOString()
    });
  }

  // 2. Generate composite multi-resolution favicon.ico
  if (icoFrames.length > 0) {
    icoFrames.sort((a, b) => a.width - b.width);
    const icoBuffer = buildIcoFromPngBuffers(icoFrames);
    const brandIco = path.join(brandDir, 'favicon.ico');
    await fs.writeFile(brandIco, icoBuffer);

    const icoEtag = `"${crypto.createHash('md5').update(icoBuffer).digest('hex')}"`;
    const icoEntry = {
      buffer: icoBuffer,
      mime: 'image/x-icon',
      etag: icoEtag,
      width: 48,
      height: 48,
      updatedAt: Date.now()
    };
    assetMemoryCache.set('favicon.ico', icoEntry);
    assetMemoryCache.set('brand/favicon.ico', icoEntry);

    results.unshift({
      id: 'favicon-ico',
      filename: 'favicon.ico',
      url: '/uploads/brand/favicon.ico',
      width: 48,
      height: 48,
      format: 'ico',
      sizeBytes: icoBuffer.length,
      category: 'favicon',
      description: 'Multi-resolution Windows & browser ICO container (16/32/48)',
      dataUri: `data:image/x-icon;base64,${icoBuffer.toString('base64')}`,
      generatedAt: new Date().toISOString()
    });
  }

  // 3. Register in media_assets database table if available
  if (options.registerInMediaAssets !== false && (mediaPool || pool)) {
    try {
      const targetPool = mediaPool || pool;
      for (const asset of results) {
        const storedPath = `uploads/brand/${asset.filename}`;
        const assetBuf = assetMemoryCache.get(asset.filename)?.buffer || null;
        const shaHash = assetBuf ? crypto.createHash('sha256').update(assetBuf).digest('hex') : crypto.createHash('sha256').update(asset.filename).digest('hex');

        const sysAssetUuid = crypto.randomUUID();
        await targetPool.query(`
          INSERT INTO media_assets (
            id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public, metadata, file_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)
          ON CONFLICT (stored_path) DO UPDATE SET
            format = EXCLUDED.format,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            size_bytes = EXCLUDED.size_bytes,
            sha256_hash = EXCLUDED.sha256_hash,
            file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
            updated_at = CURRENT_TIMESTAMP
        `, [
          sysAssetUuid,
          storedPath,
          asset.filename,
          'pwa_asset',
          asset.format,
          asset.width,
          asset.height,
          asset.sizeBytes,
          shaHash,
          JSON.stringify({ purpose: asset.purpose, category: asset.category, description: asset.description }),
          assetBuf
        ]).catch(() => {});
      }
    } catch (dbErr: any) {
      console.warn('[AssetManager] media_assets sync warning:', dbErr.message);
    }
  }

  lastGenerationTimestamp = Date.now();
  lastSourceHash = sourceHash;

  console.log(`[AssetManager] Successfully generated ${results.length} brand & PWA assets inside uploads/brand/ from source [${resolvedSource}].`);

  return {
    success: true,
    sourceType: sourceFormat,
    sourceHash,
    generatedCount: results.length,
    assets: results,
    timestamp: lastGenerationTimestamp
  };
}

/**
 * Retrieves an in-memory or disk-persisted asset buffer for zero-latency HTTP streaming.
 */
export function getSystemAssetBuffer(filename: string): {
  buffer: Buffer;
  mime: string;
  etag: string;
} | null {
  const cleanName = path.basename(filename.split('?')[0]);
  
  // 1. In-memory cache hit
  const cached = assetMemoryCache.get(cleanName) || assetMemoryCache.get(`brand/${cleanName}`);
  if (cached) {
    return {
      buffer: cached.buffer,
      mime: cached.mime,
      etag: cached.etag
    };
  }

  // 2. Check uploads/brand/ directory
  const brandDir = path.resolve(process.cwd(), 'uploads', 'brand');
  const brandPath = path.resolve(brandDir, cleanName);
  if (brandPath.startsWith(brandDir + path.sep) && existsSync(brandPath)) {
    try {
      const buffer = readFileSync(brandPath);
      const ext = path.extname(cleanName).toLowerCase();
      const mime = ext === '.ico' ? 'image/x-icon' : (ext === '.svg' ? 'image/svg+xml' : (ext === '.webp' ? 'image/webp' : 'image/png'));
      const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;
      
      const entry = { buffer, mime, etag, width: 0, height: 0, updatedAt: Date.now() };
      assetMemoryCache.set(cleanName, entry);
      assetMemoryCache.set(`brand/${cleanName}`, entry);

      return { buffer, mime, etag };
    } catch {
      // continue
    }
  }

  // 3. Fallback check for public/brand/default-logo.svg
  if (cleanName === 'default-logo.svg') {
    const svgPath = path.join(process.cwd(), 'public', 'brand', 'default-logo.svg');
    if (existsSync(svgPath)) {
      try {
        const buffer = readFileSync(svgPath);
        const mime = 'image/svg+xml';
        const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;
        return { buffer, mime, etag };
      } catch {
        // continue
      }
    }
  }

  return null;
}

/**
 * Returns unified status of all system assets with live verification indicators.
 */
export async function getSystemAssetsStatus(): Promise<SystemAssetStatusReport> {
  const brandDir = path.join(process.cwd(), 'uploads', 'brand');
  const assets: GeneratedAssetMeta[] = [];
  const errors: string[] = [];

  let resolvedSource: 'logo_url' | 'favicon_url' | 'default-logo' = activeSourceType;
  try {
    const settings = await getCachedSystemSettings();
    if (settings?.logo_url) {
      resolvedSource = 'logo_url';
    } else if (settings?.favicon_url) {
      resolvedSource = 'favicon_url';
    } else {
      resolvedSource = 'default-logo';
    }
  } catch {
    // preserve activeSourceType
  }

  for (const spec of SYSTEM_ASSET_SPECS) {
    const cached = assetMemoryCache.get(spec.filename) || assetMemoryCache.get(`brand/${spec.filename}`);
    const diskPath = path.join(brandDir, spec.filename);

    let size = 0;
    let dataUri: string | undefined;

    if (cached) {
      size = cached.buffer.length;
      dataUri = `data:${cached.mime};base64,${cached.buffer.toString('base64')}`;
    } else if (existsSync(diskPath)) {
      try {
        const buf = await fs.readFile(diskPath);
        size = buf.length;
        const mime = spec.format === 'ico' ? 'image/x-icon' : 'image/png';
        dataUri = `data:${mime};base64,${buf.toString('base64')}`;
      } catch (readErr: any) {
        errors.push(`Failed reading ${spec.filename}: ${readErr.message}`);
      }
    } else {
      errors.push(`Missing file: uploads/brand/${spec.filename}`);
    }

    const fileExists = size > 0 || existsSync(diskPath) || Boolean(cached);

    assets.push({
      id: spec.id,
      filename: spec.filename,
      url: `/uploads/brand/${spec.filename}`,
      width: spec.width,
      height: spec.height,
      format: spec.format,
      sizeBytes: size,
      exists: fileExists,
      purpose: spec.purpose,
      category: spec.category,
      description: spec.description,
      dataUri,
      generatedAt: lastGenerationTimestamp ? new Date(lastGenerationTimestamp).toISOString() : new Date().toISOString()
    });
  }

  const faviconReady = existsSync(path.join(brandDir, 'favicon.ico')) || assetMemoryCache.has('favicon.ico');
  const appleTouchReady = existsSync(path.join(brandDir, 'apple-touch-icon.png')) || assetMemoryCache.has('apple-touch-icon.png');
  const pwa192Ready = existsSync(path.join(brandDir, 'pwa-192x192.png')) || assetMemoryCache.has('pwa-192x192.png');
  const pwa512Ready = existsSync(path.join(brandDir, 'pwa-512x512.png')) || assetMemoryCache.has('pwa-512x512.png');
  const pwaMaskableReady = existsSync(path.join(brandDir, 'pwa-maskable-512x512.png')) || assetMemoryCache.has('pwa-maskable-512x512.png');

  const allExist = faviconReady && appleTouchReady && pwa192Ready && pwa512Ready && pwaMaskableReady;

  return {
    success: true,
    source: resolvedSource,
    generatedAt: lastGenerationTimestamp ? new Date(lastGenerationTimestamp).toISOString() : null,
    generatedCount: assets.filter(a => a.exists).length,
    timestamp: lastGenerationTimestamp || Date.now(),
    favicon: faviconReady,
    appleTouchIcon: appleTouchReady,
    pwa192: pwa192Ready,
    pwa512: pwa512Ready,
    pwaMaskable: pwaMaskableReady,
    isReady: allExist,
    totalAssets: assets.length,
    assets,
    errors
  };
}

/**
 * System startup bootstrapper:
 * 1. Reads favicon_url then logo_url from system_settings.
 * 2. If neither exists, uses public/brand/default-logo.svg.
 * 3. Checks if uploads/brand/ contains all 5 required assets.
 * 4. Generates missing outputs from the approved source without mutating system_settings.
 */
export async function initializeSystemAssetSuite(): Promise<void> {
  try {
    const brandDir = path.join(process.cwd(), 'uploads', 'brand');
    const requiredFiles = [
      'favicon.ico',
      'apple-touch-icon.png',
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png'
    ];

    const missingAny = requiredFiles.some(f => !existsSync(path.join(brandDir, f)));

    if (missingAny || assetMemoryCache.size === 0) {
      console.log('[AssetManager] Generating missing brand and PWA assets into uploads/brand/...');
      await generateAppIconsFromSource(null, { force: false });
    }
  } catch (err: any) {
    console.warn('[AssetManager] Startup asset initialization non-blocking warning:', err.message);
  }
}
