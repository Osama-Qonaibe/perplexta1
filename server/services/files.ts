import { pool, mediaPool } from '../db/index.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { triggerFileCacheInvalidation } from './fileValidationService.js';

export async function registerMediaAsset(data: {
  userId?: string | number | null;
  storedPath: string;
  originalFilename: string;
  context: string;
  format: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  fileData?: Buffer;
  metadata?: any;
}) {
  const targetMediaPool = mediaPool || pool;
  if (!targetMediaPool) return;

  try {
    const numericUserId = data.userId && !isNaN(Number(data.userId)) ? Number(data.userId) : null;
    const sha256Hash = data.fileData ? crypto.createHash('sha256').update(data.fileData).digest('hex') : '';
    const cleanStoredPath = data.storedPath.replace(/^\/+/, '');

    const existing = await targetMediaPool.query(
      'SELECT id FROM media_assets WHERE stored_path = $1 OR (sha256_hash = $2 AND sha256_hash != \'\') LIMIT 1',
      [cleanStoredPath, sha256Hash]
    );

    if (existing.rows.length > 0) {
      await targetMediaPool.query(`
        UPDATE media_assets SET
          stored_path = $1,
          original_filename = $2,
          context = $3,
          format = $4,
          width = COALESCE($5, width),
          height = COALESCE($6, height),
          size_bytes = $7,
          file_data = COALESCE($8, file_data),
          user_id = COALESCE($9, user_id),
          metadata = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
      `, [
        cleanStoredPath,
        data.originalFilename,
        data.context,
        data.format,
        data.width || 0,
        data.height || 0,
        data.sizeBytes,
        data.fileData || null,
        numericUserId,
        JSON.stringify(data.metadata || {}),
        existing.rows[0].id
      ]);
    } else {
      const newAssetId = crypto.randomUUID();
      await targetMediaPool.query(`
        INSERT INTO media_assets (
          id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public,
          user_id, metadata, file_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (stored_path) DO UPDATE SET
          context = EXCLUDED.context,
          user_id = COALESCE(EXCLUDED.user_id, media_assets.user_id),
          file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
          updated_at = CURRENT_TIMESTAMP
      `, [
        newAssetId,
        cleanStoredPath,
        data.originalFilename,
        data.context,
        data.format,
        data.width || 0,
        data.height || 0,
        data.sizeBytes,
        sha256Hash,
        true,
        numericUserId,
        JSON.stringify(data.metadata || {}),
        data.fileData || null
      ]);
    }
  } catch (err: any) {
    console.warn(`[File Service] registerMediaAsset notice (${data.storedPath}):`, err.message);
  }
}

export async function getUserFiles(userId: string) {
  if (!pool) throw new Error('Database initializing');
  const numericUserId = !isNaN(Number(userId)) ? Number(userId) : null;
  const result = await pool.query(
    'SELECT * FROM user_files WHERE user_id = $1 OR ($2::INTEGER IS NOT NULL AND user_id = $2::INTEGER) ORDER BY created_at DESC', 
    [userId, numericUserId]
  );
  return result.rows;
}

export async function saveFileMetadata(userId: string, data: {
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  metadata: any;
  file_data?: Buffer;
}) {
  if (!pool) throw new Error('Database initializing');

  const existing = await pool.query(
    'SELECT id, file_version FROM user_files WHERE user_id = $1 AND file_url = $2 LIMIT 1',
    [userId, data.file_url]
  );

  let result;
  if (existing.rows.length > 0) {
    const newVersion = (existing.rows[0].file_version || 1) + 1;
    result = await pool.query(
      `UPDATE user_files 
       SET file_name = $1, file_size = $2, mime_type = $3, file_type = $4, metadata = $5, file_version = $6, file_data = COALESCE($7, file_data), updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8 AND file_url = $9 RETURNING *`,
      [data.file_name, data.file_size, data.mime_type, data.file_type, JSON.stringify(data.metadata), newVersion, data.file_data || null, userId, data.file_url]
    );
  } else {
    result = await pool.query(
      `INSERT INTO user_files (user_id, file_name, file_url, file_size, mime_type, file_type, metadata, file_version, file_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8) RETURNING *`,
      [userId, data.file_name, data.file_url, data.file_size, data.mime_type, data.file_type, JSON.stringify(data.metadata), data.file_data || null]
    );
  }

  triggerFileCacheInvalidation(data.file_url);
  return result.rows[0];
}

export async function getUserStorageUsage(userId: string): Promise<number> {
  if (!pool) return 0;
  const result = await pool.query('SELECT SUM(file_size) as total FROM user_files WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0].total || '0');
}

function isBufferValidImage(
  buffer: Buffer,
  fallbackMimeType?: string
): { isValid: boolean; mimeType: string; fileExtension: string } {
  if (!buffer || buffer.length < 100) {
    return { isValid: false, mimeType: '', fileExtension: '' };
  }

  // Reject text / HTML / JSON error payloads immediately
  const textSample = buffer.toString('utf8', 0, Math.min(buffer.length, 256)).trim().toLowerCase();
  if (
    textSample.startsWith('<html') ||
    textSample.startsWith('<!doctype') ||
    textSample.startsWith('{"') ||
    textSample.startsWith('[{') ||
    textSample.startsWith('internal server error') ||
    textSample.startsWith('error') ||
    textSample.startsWith('access denied') ||
    textSample.startsWith('unauthorized') ||
    textSample.startsWith('<error')
  ) {
    return { isValid: false, mimeType: '', fileExtension: '' };
  }

  const hex = buffer.toString('hex', 0, 12).toLowerCase();

  // PNG
  if (hex.startsWith('89504e47')) {
    return { isValid: true, mimeType: 'image/png', fileExtension: 'png' };
  }
  // JPEG (starts with FF D8)
  if (hex.startsWith('ffd8')) {
    return { isValid: true, mimeType: 'image/jpeg', fileExtension: 'jpg' };
  }
  // GIF (starts with 47 49 46 38 -> 'GIF8')
  if (hex.startsWith('47494638')) {
    return { isValid: true, mimeType: 'image/gif', fileExtension: 'gif' };
  }
  // WEBP (starts with 52 49 46 46 and 8-12 is 57 45 42 50 -> 'RIFF' ... 'WEBP')
  if (hex.startsWith('52494646')) {
    const webpIndicator = buffer.subarray(8, 12).toString('ascii');
    if (webpIndicator === 'WEBP') {
      return { isValid: true, mimeType: 'image/webp', fileExtension: 'webp' };
    }
  }
  // AVIF / HEIC (ftyp at bytes 4-7)
  const ftyp = buffer.subarray(4, 8).toString('ascii');
  if (ftyp === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (brand.includes('avif') || brand.includes('avis')) {
      return { isValid: true, mimeType: 'image/avif', fileExtension: 'avif' };
    }
    if (brand.includes('heic') || brand.includes('heif') || brand.includes('mif1')) {
      return { isValid: true, mimeType: 'image/heic', fileExtension: 'heic' };
    }
  }
  // BMP (starts with 42 4d -> 'BM')
  if (hex.startsWith('424d')) {
    return { isValid: true, mimeType: 'image/bmp', fileExtension: 'bmp' };
  }
  // TIFF (49 49 2a 00 or 4d 4d 00 2a)
  if (hex.startsWith('49492a00') || hex.startsWith('4d4d002a')) {
    return { isValid: true, mimeType: 'image/tiff', fileExtension: 'tiff' };
  }
  // ICO / CUR (00 00 01 00 or 00 00 02 00)
  if (hex.startsWith('00000100') || hex.startsWith('00000200')) {
    return { isValid: true, mimeType: 'image/x-icon', fileExtension: 'ico' };
  }
  // SVG (XML starts with '<' or '<?xml' or '<svg')
  if (textSample.startsWith('<svg') || textSample.startsWith('<?xml') || textSample.includes('<svg')) {
    return { isValid: true, mimeType: 'image/svg+xml', fileExtension: 'svg' };
  }

  // Fallback for valid binary buffers with known image HTTP Content-Type (minimum 500 bytes)
  if (buffer.length >= 500 && fallbackMimeType && fallbackMimeType.startsWith('image/')) {
    const cleanMime = fallbackMimeType.split(';')[0].trim().toLowerCase();
    let ext = cleanMime.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    return { isValid: true, mimeType: cleanMime, fileExtension: ext };
  }

  return { isValid: false, mimeType: '', fileExtension: '' };
}

function isBufferValidVideo(buffer: Buffer): { isValid: boolean; mimeType: string; fileExtension: string } {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, mimeType: '', fileExtension: '' };
  }
  const hex = buffer.toString('hex', 0, 12).toLowerCase();

  // MP4 has 'ftyp' at bytes 4-7
  const ftypBox = buffer.subarray(4, 8).toString('ascii');
  if (ftypBox === 'ftyp' || ftypBox === 'moov' || ftypBox === 'mdat' || ftypBox === 'wide') {
    return { isValid: true, mimeType: 'video/mp4', fileExtension: 'mp4' };
  }

  // WebM/MKV starts with EBML (1a 45 df a3)
  if (hex.startsWith('1a45dfa3')) {
    return { isValid: true, mimeType: 'video/webm', fileExtension: 'webm' };
  }

  // OGG (OggS container, starts with 4f 67 67 53)
  if (hex.startsWith('4f676753')) {
    return { isValid: true, mimeType: 'video/ogg', fileExtension: 'ogg' };
  }

  // AVI (RIFF and AVI List, starts with 52 49 46 46)
  if (hex.startsWith('52494646')) {
    const aviIndicator = buffer.subarray(8, 12).toString('ascii');
    if (aviIndicator === 'AVI ') {
      return { isValid: true, mimeType: 'video/x-msvideo', fileExtension: 'avi' };
    }
  }

  return { isValid: false, mimeType: '', fileExtension: '' };
}

async function resolveRunPodApiKey(customHeaders?: Record<string, string>): Promise<string | null> {
  if (customHeaders?.['Authorization']) {
    const raw = customHeaders['Authorization'].replace(/^Bearer\s+/i, '').trim();
    if (raw) return raw;
  }
  if (customHeaders?.['X-RunPod-Serverless-Auth']) {
    const raw = customHeaders['X-RunPod-Serverless-Auth'].trim();
    if (raw) return raw;
  }
  try {
    const { getCachedGpuProviders } = await import('./gpuVaultService.js');
    const gpuMap = await getCachedGpuProviders();
    for (const p of gpuMap.values()) {
      if (p.provider_type === 'runpod_serverless' || p.provider_id.toLowerCase().includes('runpod') || (p.base_url && p.base_url.includes('runpod.ai'))) {
        if (p.decryptedKey) return p.decryptedKey.trim().replace(/^Bearer\s+/i, '');
      }
    }
  } catch (e) {}
  try {
    const { getProviderKey } = await import('./ai.js');
    const key = await getProviderKey('runpod');
    if (key) return key.trim().replace(/^Bearer\s+/i, '');
  } catch (e) {}
  return null;
}

async function fetchRemoteMediaWithFallback(
  mediaUrl: string, 
  customHeaders?: Record<string, string>,
  mediaType: 'image' | 'video' = 'video'
): Promise<Response> {
  const hostname = new URL(mediaUrl).hostname.toLowerCase();
  const isRunPod = hostname.includes('runpod.ai');

  if (isRunPod) {
    const runpodKey = await resolveRunPodApiKey(customHeaders);
    console.log(`[File Service] Fetching RunPod media [${hostname}], Key available: ${!!runpodKey}`);

    if (runpodKey) {
      // 1. RunPod Standard Gateway Header (Bearer + Serverless-Auth)
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(mediaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Authorization': `Bearer ${runpodKey}`,
            'X-RunPod-Serverless-Auth': runpodKey,
            'Accept': mediaType === 'video' ? 'video/*, application/json, text/event-stream, */*' : 'image/*, application/json, */*'
          },
          signal: controller.signal,
          redirect: 'follow'
        });
        clearTimeout(tId);
        if (res.ok) return res;
      } catch (e: any) {
        console.warn(`[File Service] RunPod standard header fetch error: ${e.message}`);
      }

      // 2. RunPod URL with api_key Query Parameter
      try {
        const separator = mediaUrl.includes('?') ? '&' : '?';
        const urlWithKey = mediaUrl.includes('api_key=') ? mediaUrl : `${mediaUrl}${separator}api_key=${encodeURIComponent(runpodKey)}`;
        const controller2 = new AbortController();
        const tId2 = setTimeout(() => controller2.abort(), 25000);
        const res2 = await fetch(urlWithKey, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Authorization': `Bearer ${runpodKey}`,
            'Accept': mediaType === 'video' ? 'video/*, application/json, text/event-stream, */*' : 'image/*, application/json, */*'
          },
          signal: controller2.signal,
          redirect: 'follow'
        });
        clearTimeout(tId2);
        if (res2.ok) return res2;
      } catch (e: any) {
        console.warn(`[File Service] RunPod query param fetch error: ${e.message}`);
      }
    }
  }

  // Generic / Non-RunPod / Fallback Sequence:
  // Strategy 1: Raw fetch with standard User-Agent (crucial for signed S3/GCS buckets)
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(tId);
    if (res.ok) return res;

    // Strategy 2: If auth error and custom headers provided, retry with custom headers
    if ((res.status === 401 || res.status === 403) && customHeaders && Object.keys(customHeaders).length > 0) {
      console.warn(`[File Service] Raw fetch failed (HTTP ${res.status}). Retrying with custom headers...`);
      const controller2 = new AbortController();
      const tId2 = setTimeout(() => controller2.abort(), 20000);
      const res2 = await fetch(mediaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...customHeaders
        },
        signal: controller2.signal,
        redirect: 'follow'
      });
      clearTimeout(tId2);
      if (res2.ok) return res2;
    }
  } catch (e: any) {
    console.warn(`[File Service] Initial fetch attempt failed: ${e.message}`);
  }

  // Strategy 3: Pure zero-header raw fetch
  const controller3 = new AbortController();
  const tId3 = setTimeout(() => controller3.abort(), 20000);
  const finalRes = await fetch(mediaUrl, { signal: controller3.signal, redirect: 'follow' });
  clearTimeout(tId3);
  return finalRes;
}

export async function saveGeneratedImageToDisk(userId: string, imageData: string, customHeaders?: Record<string, string>): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  // Confirm uploads directory exists
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

  let buffer: Buffer;
  let fileExtension = 'jpg';
  let mimeType = 'image/jpeg';

  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      throw new Error('Invalid base64 data image formatting');
    }
    mimeType = matches[1];
    fileExtension = mimeType.split('/')[1] || 'jpg';
    buffer = Buffer.from(matches[2], 'base64');
  } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    const response = await fetchRemoteMediaWithFallback(imageData, customHeaders, 'image');

    if (!response.ok) {
      throw new Error(`Failed to download image from URL (${imageData}): ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');
    if (contentType) {
      mimeType = contentType.split(';')[0].trim().toLowerCase();
      fileExtension = mimeType.split('/')[1] || 'jpg';
    }
  } else {
    const cleanB64 = imageData.trim().replace(/^["']|["']$/g, '');
    buffer = Buffer.from(cleanB64, 'base64');
  }

  // Validate buffer integrity & format
  const validation = isBufferValidImage(buffer, mimeType);
  if (!validation.isValid) {
    throw new Error('Generated file payload is not a valid or supported image format (محتوى الصورة غير صالح أو غير مدعوم)');
  }
  mimeType = validation.mimeType;
  fileExtension = validation.fileExtension;

  const safeExt = (fileExtension || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
  const randomFilename = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
  const safeUploadDir = path.resolve(process.cwd(), 'uploads');
  const filePath = path.resolve(safeUploadDir, randomFilename);
  if (!filePath.startsWith(safeUploadDir + path.sep)) {
    throw new Error('Path traversal detected');
  }

  await fs.writeFile(filePath, buffer);

  // Register the file metadata with byte buffer
  const savedFile = await saveFileMetadata(userId, {
    file_name: `Perplexta_Gen_${Date.now()}.${safeExt}`,
    file_url: randomFilename,
    file_size: buffer.length,
    mime_type: mimeType,
    file_type: 'image',
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Studio',
      is_public: true
    },
    file_data: buffer
  });

  // Register into sovereign media_assets
  await registerMediaAsset({
    userId,
    storedPath: `uploads/${randomFilename}`,
    originalFilename: `Perplexta_Gen_${Date.now()}.${safeExt}`,
    context: 'image',
    format: safeExt,
    sizeBytes: buffer.length,
    fileData: buffer,
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Studio',
      fileId: savedFile?.id,
      is_public: true
    }
  });

  return `/uploads/${randomFilename}`;
}

export async function saveGeneratedVideoToDisk(userId: string, videoData: string, customHeaders?: Record<string, string>): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  // Confirm uploads directory exists
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
  
  console.log(`[File Service] Attempting to save video from URL: ${videoData}`);

  let buffer: Buffer;
  let fileExtension = 'mp4';
  let mimeType = 'video/mp4';

  if (videoData.startsWith('data:')) {
    try {
      const commaIndex = videoData.indexOf(',');
      if (commaIndex !== -1) {
        const header = videoData.substring(0, commaIndex);
        const rawBase64 = videoData.substring(commaIndex + 1).replace(/\s+/g, '');
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch && mimeMatch[1]) {
          mimeType = mimeMatch[1];
          const ext = mimeType.split('/')[1];
          if (ext) fileExtension = ext.split('+')[0];
        }
        buffer = Buffer.from(rawBase64, 'base64');
      } else {
        const cleanData = videoData.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
        buffer = Buffer.from(cleanData, 'base64');
      }
    } catch (b64Err: any) {
      console.error(`[File Service] Base64 video parsing failed: ${b64Err.message}`);
      return videoData;
    }
  } else if (videoData.startsWith('http://') || videoData.startsWith('https://')) {
    // If it's a known public sample video or is already perfectly publicly hosted, we don't need to cache/write it to disk
    if (videoData.includes('commondatastorage.googleapis.com') || videoData.includes('gtv-videos-bucket') || videoData.includes('sample')) {
      console.log(`[File Service] Video is from a standard public sample bucket. Bypassing disk save and returning original URL.`);
      return videoData;
    }

    let response: Response | null = null;
    const hostname = new URL(videoData).hostname;
    
    try {
      response = await fetchRemoteMediaWithFallback(videoData, customHeaders, 'video');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} at ${hostname}`);
      }
    } catch (err: any) {
      console.error(`[File Service] Video fetch failed for ${videoData.slice(0, 50)}...: ${err.message}. Returning original URL.`);
      return videoData;
    }

    try {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type');
      if (contentType) {
        mimeType = contentType;
        fileExtension = contentType.split('/')[1] || 'mp4';
      }
    } catch (bufferErr: any) {
      console.error(`[File Service] Failed to read arrayBuffer from response: ${bufferErr.message}. Returning original URL.`);
      return videoData;
    }
  } else {
    buffer = Buffer.from(videoData, 'base64');
  }

  // Intercept JSON or SSE responses
  if (buffer.length > 0 && (buffer[0] === 123 || buffer.toString('utf8', 0, 10).includes('data:') || buffer.toString('utf8', 0, 10).includes('event:'))) {
    try {
      const text = buffer.toString('utf8');
      let jsonText = text;
      
      // If SSE, extract the last 'data: {...}' block or data line
      if (text.includes('data:')) {
        const matches = text.match(/data:\s*(\{.*?\})/g) || text.match(/data:\s*([^\r\n]+)/g);
        if (matches && matches.length > 0) {
          jsonText = matches[matches.length - 1].replace(/^data:\s*/, '').trim();
        }
      }
      
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (e) {
        if (jsonText.startsWith('http') || jsonText.startsWith('data:')) {
          return await saveGeneratedVideoToDisk(userId, jsonText, customHeaders);
        }
      }

      if (parsedJson) {
        console.log('[File Service] Downloaded content was JSON/SSE, attempting to extract nested media URL.');
        
        let nestedUrl = null;
        if (Array.isArray(parsedJson.stream) && parsedJson.stream.length > 0) {
          nestedUrl = parsedJson.stream[0].output || parsedJson.stream[0].video_url || parsedJson.stream[0].image_url || parsedJson.stream[0].video;
        } else if (Array.isArray(parsedJson.output) && parsedJson.output.length > 0) {
          nestedUrl = parsedJson.output[0].video || parsedJson.output[0].image || parsedJson.output[0].url || parsedJson.output[0];
        }
        nestedUrl = nestedUrl || parsedJson.output_video || parsedJson.video_url || parsedJson.url || parsedJson.output || parsedJson.file || parsedJson.media_url || parsedJson.result_url;
        
        if (typeof nestedUrl === 'string') {
          if (nestedUrl.startsWith('http') || nestedUrl.startsWith('data:')) {
            console.log(`[File Service] Found nested video URL in JSON/SSE: ${nestedUrl.slice(0, 80)}. Recursively saving...`);
            return await saveGeneratedVideoToDisk(userId, nestedUrl, customHeaders);
          } else if (nestedUrl.length > 100 && !nestedUrl.includes(' ')) {
            console.log(`[File Service] Found nested base64 video in JSON/SSE. Recursively saving...`);
            return await saveGeneratedVideoToDisk(userId, `data:video/mp4;base64,${nestedUrl}`, customHeaders);
          }
        } else {
           console.warn('[File Service] JSON/SSE response did not contain a recognizable video URL.');
        }
      }
    } catch (e) {}
  }

  // Validate video buffer integrity & format
  const validation = isBufferValidVideo(buffer);
  if (!validation.isValid) {
    throw new Error('Generated file payload is not a valid or supported video format (محتوى الفيديو غير صالح أو غير مدعوم)');
  }
  mimeType = validation.mimeType;
  fileExtension = validation.fileExtension;

  const safeExt = (fileExtension || 'mp4').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'mp4';
  const randomFilename = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
  const safeUploadDir = path.resolve(process.cwd(), 'uploads');
  const filePath = path.resolve(safeUploadDir, randomFilename);
  if (!filePath.startsWith(safeUploadDir + path.sep)) {
    throw new Error('Path traversal detected');
  }

  await fs.writeFile(filePath, buffer);

  // Register the file metadata
  const savedVideo = await saveFileMetadata(userId, {
    file_name: `Perplexta_Video_${Date.now()}.${safeExt}`,
    file_url: randomFilename,
    file_size: buffer.length,
    mime_type: mimeType,
    file_type: 'video',
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Studio',
      is_public: true
    },
    file_data: buffer
  });

  await registerMediaAsset({
    userId,
    storedPath: `uploads/${randomFilename}`,
    originalFilename: `Perplexta_Video_${Date.now()}.${safeExt}`,
    context: 'video',
    format: safeExt,
    sizeBytes: buffer.length,
    fileData: buffer,
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Studio',
      fileId: savedVideo?.id,
      is_public: true
    }
  });

  return `/uploads/${randomFilename}`;
}

export async function saveGeneratedAudioToDisk(userId: string, audioBase64: string, mimeType = 'audio/wav', prompt = 'AI_Track', lyrics = ''): Promise<string> {
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  // Confirm uploads directory exists
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

  const buffer = Buffer.from(audioBase64, 'base64');
  let fileExtension = 'wav';
  if (mimeType.includes('mp3')) fileExtension = 'mp3';
  else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
  else if (mimeType.includes('ogg')) fileExtension = 'ogg';

  const safeExt = (fileExtension || 'wav').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'wav';
  const randomFilename = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
  const filePath = path.resolve(uploadDir, randomFilename);
  if (!filePath.startsWith(uploadDir + path.sep)) {
    throw new Error('Path traversal detected');
  }

  await fs.writeFile(filePath, buffer);

  // Register the file metadata
  const savedAudio = await saveFileMetadata(userId, {
    file_name: `${prompt.replace(/[^a-zA-Z0-9\s_\u0600-\u06FF-]/g, '').substring(0, 30) || 'Perplexta_Audio'}_${Date.now()}.${fileExtension}`,
    file_url: randomFilename,
    file_size: buffer.length,
    mime_type: mimeType,
    file_type: 'audio',
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Audio_Studio',
      lyrics,
      prompt,
      is_public: true
    },
    file_data: buffer
  });

  await registerMediaAsset({
    userId,
    storedPath: `uploads/${randomFilename}`,
    originalFilename: `${prompt.replace(/[^a-zA-Z0-9\s_\u0600-\u06FF-]/g, '').substring(0, 30) || 'Perplexta_Audio'}_${Date.now()}.${fileExtension}`,
    context: 'audio',
    format: fileExtension,
    sizeBytes: buffer.length,
    fileData: buffer,
    metadata: {
      generated: true,
      origin: 'AI_Orchestrator_Audio_Studio',
      fileId: savedAudio?.id,
      is_public: true
    }
  });

  return `/uploads/${randomFilename}`;
}

