import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js';
import { checkDiskSpace } from '../middleware/checkDiskSpace.js';
import { uploadValidator } from '../middleware/uploadValidator.js';
import { extractTextFromFile, forensicScanPDF } from '../services/extractor.js';
import { logSystemActivity } from '../services/notifications.js';
import { getUserFiles, saveFileMetadata, getUserStorageUsage } from '../services/files.js';
import { auditFilePipeline, resolveMediaAbsolutePath } from '../services/fileValidationService.js';
import { processUploadedVideo } from '../services/videoProcessor.js';
import { optimizeUploadedImage } from '../services/mediaOptimizationService.js';
import { pool, mediaPool } from '../db/index.js';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

router.post("/upload", authenticateToken, checkDiskSpace, (upload.single('file') as any), handleMulterError, uploadValidator, async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file attached' });

    const userId = req.user.id;
    const { originalname, filename, path: filePath, mimetype, size } = req.file;

    const [subRes, currentUsage] = await Promise.all([
      pool.query(`
        SELECT u.role, s.plan_id, s.status, p.limits 
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE u.id = $1
        ORDER BY CASE WHEN s.status = 'active' THEN 0 ELSE 1 END, s.current_period_end DESC NULLS LAST
        LIMIT 1
      `, [userId]),
      getUserStorageUsage(userId)
    ]);

    const row = subRes.rows[0] || {};
    const hasActiveSub = row.plan_id && row.status === 'active';
    const limits = typeof row.limits === 'object' && row.limits !== null ? row.limits : (typeof row.limits === 'string' ? JSON.parse(row.limits || '{}') : {});
    const storageLimit = limits['storage_mb'];
    
    let limitMb = typeof storageLimit === 'object' ? (storageLimit.monthly || storageLimit.daily) : storageLimit;
    
    if (row.role === 'admin') {
      limitMb = 'unlimited';
    } else if (!hasActiveSub) {
      limitMb = '20';
    }
    
    if (limitMb !== 'unlimited') {
      const allowedMb = limitMb ? parseInt(limitMb, 10) : 0;
      const limitBytes = allowedMb * 1024 * 1024;
      if (currentUsage + size > limitBytes) {
        return res.status(402).json({ 
          error: 'You have reached the cloud storage limit', 
          error_ar: 'لقد استنفدت سعة التخزين السحابي المتاحة',
          message: 'You have reached the cloud storage limit',
          message_ar: 'لقد استنفدت سعة التخزين السحابي المتاحة',
          message_en: 'You have reached the cloud storage limit',
          limit_mb: allowedMb,
          type: 'STORAGE_QUOTA_EXCEEDED'
        });
      }
    }

    let fileType = 'other';
    if (mimetype.startsWith('image/')) fileType = 'image';
    else if (mimetype === 'application/pdf') fileType = 'document';
    else if (mimetype.startsWith('text/')) fileType = 'document';
    else if (mimetype.startsWith('video/')) fileType = 'video';
    else if (mimetype.startsWith('audio/')) fileType = 'audio';

    let finalFilename = filename;
    let videoMetadata: any = {};
    let imageMetadata: any = {};
    let processedFileSize = size;

    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv', '3gp', 'm4v', '3g2', 'ogv', 'ts', 'mts', 'm2ts', 'vob'];
    const isVideoExtension = videoExtensions.some(ext => originalname.toLowerCase().endsWith('.' + ext));

    if (mimetype.startsWith('image/')) {
      try {
        console.log(`[File Router] Optimizing uploaded image with sharp: ${originalname}`);
        const optResult = await optimizeUploadedImage(filePath, originalname);
        finalFilename = optResult.filename;
        processedFileSize = optResult.size;
        imageMetadata = {
          width: optResult.width,
          height: optResult.height,
          format: optResult.format,
          isStandardized: true
        };
        console.log(`[File Router] Image optimized successfully. Resolution: ${optResult.width}x${optResult.height}, Size: ${optResult.size} bytes`);
      } catch (imgErr: any) {
        console.error('[File Router] Sharp image optimization error:', imgErr.message);
      }
    } else if (mimetype.startsWith('video/') || isVideoExtension) {
      try {
        const maxDuration = req.query.maxDuration ? parseInt(req.query.maxDuration as string, 10) : undefined;
        console.log(`[File Router] Processing uploaded video with FFmpeg: ${originalname}${maxDuration ? ` (Max duration: ${maxDuration}s)` : ''}`);
        const result = await processUploadedVideo(filePath, path.dirname(filePath), 'pvid', maxDuration);
        if (result.success && result.processedVideoUrl) {
          finalFilename = result.processedVideoUrl.replace('/uploads/', '');
          if (result.fileSize) processedFileSize = result.fileSize;
          videoMetadata = {
            thumbnailUrl: result.thumbnailUrl,
            duration: result.duration,
            width: result.width,
            height: result.height,
            resolution: result.resolution || `${result.width || 1280}x${result.height || 720}`,
            aspectRatio: result.aspectRatio,
            isVertical: result.isVertical,
            bitrate: result.bitrate,
            fileSize: result.fileSize,
            format: result.format,
            isStandardized: true
          };
          console.log(`[File Router] Video standardized successfully. Resolution: ${videoMetadata.resolution}, Duration: ${videoMetadata.duration}s, Bitrate: ${videoMetadata.bitrate}`);
        }
      } catch (videoErr: any) {
        console.error('[File Router] FFmpeg video processing error:', videoErr.message);
      }
    }

    const safeFilename = path.basename(finalFilename);
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const currentFilePath = path.resolve(uploadsDir, safeFilename);
    if (!currentFilePath.startsWith(uploadsDir + path.sep)) {
      throw new Error('Path traversal detected in file upload');
    }

    // Performance Optimization: Never run heavy multimodal AI extraction during upload for video/audio/image files
    const isVideoFile = mimetype.startsWith('video/') || isVideoExtension;
    const isAudioFile = mimetype.startsWith('audio/');
    let extractedText = '';
    if (isVideoFile) {
      extractedText = `[Video Asset: ${originalname}, Resolution: ${videoMetadata?.resolution || 'N/A'}, Duration: ${videoMetadata?.duration || 0}s]`;
    } else if (isAudioFile) {
      extractedText = `[Audio Asset: ${originalname}]`;
    } else if (mimetype.startsWith('image/')) {
      extractedText = `[Image Asset: ${originalname}]`;
    } else {
      extractedText = await extractTextFromFile(currentFilePath, mimetype, originalname);
    }
    
    let forensic = null;
    if (mimetype === 'application/pdf') {
      try {
        const fileBuffer = await fs.readFile(currentFilePath);
        forensic = forensicScanPDF(fileBuffer);
      } catch (err: any) {
        console.error('[PDF Bridge Ingest] File forensic scan failed:', err.message);
      }
    }

    const isPublicMedia = mimetype.startsWith('image/') || mimetype.startsWith('video/') || mimetype.startsWith('audio/') || isVideoExtension;
    const file = await saveFileMetadata(userId, {
      file_name: originalname,
      file_url: finalFilename,
      file_size: processedFileSize,
      mime_type: mimetype,
      file_type: fileType,
      metadata: { 
        is_public: isPublicMedia,
        isPublic: isPublicMedia,
        extractedText: extractedText.substring(0, 5000), 
        isProcessed: extractedText.length > 0,
        forensic,
        ...videoMetadata,
        ...imageMetadata
      }
    });

    const fileUrl = `/uploads/${finalFilename}`;
    const thumbnailUrl = videoMetadata.thumbnailUrl || '';

    try {
      const isLargeMedia = processedFileSize > 100 * 1024 * 1024;
      let fileBuf: Buffer | null = null;
      let sha256Hash = '';

      if (!isLargeMedia) {
        try {
          fileBuf = await fs.readFile(currentFilePath);
          sha256Hash = crypto.createHash('sha256').update(fileBuf).digest('hex');
          await pool.query('UPDATE user_files SET file_data = $1 WHERE id = $2', [fileBuf, file.id]);
        } catch (_) {}
      } else {
        // Fast streaming hash calculation without loading 100MB into memory or blocking event loop
        try {
          const hash = crypto.createHash('sha256');
          const stream = createReadStream(currentFilePath);
          for await (const chunk of stream) {
            hash.update(chunk);
          }
          sha256Hash = hash.digest('hex');
        } catch (_) {
          sha256Hash = crypto.randomUUID();
        }
      }

      // Ensure all media types (images, videos, audio, pdfs, documents) are stored in media_assets in the Media DB
      const targetMediaPool = mediaPool || pool;
      if (targetMediaPool) {
        const storedPath = `uploads/${finalFilename}`;
        let mContext = 'general';
        if (mimetype.startsWith('image/')) mContext = 'image';
        else if (mimetype.startsWith('video/') || isVideoExtension) mContext = 'video';
        else if (mimetype.startsWith('audio/')) mContext = 'audio';
        else if (mimetype.startsWith('application/pdf')) mContext = 'document';
        
        // Handle deduplication by sha256_hash or stored_path
        const existingAsset = sha256Hash
          ? await targetMediaPool.query('SELECT id, stored_path FROM media_assets WHERE sha256_hash = $1 LIMIT 1', [sha256Hash])
          : { rows: [] };

        if (existingAsset.rows.length > 0) {
          await targetMediaPool.query(`
            UPDATE media_assets SET
              stored_path = $1,
              original_filename = $2,
              context = $3,
              format = $4,
              width = COALESCE($5, width),
              height = COALESCE($6, height),
              size_bytes = $7,
              user_id = COALESCE($8, user_id),
              metadata = $9,
              file_data = COALESCE($10, file_data),
              is_public = $11,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
          `, [
            storedPath, originalname, mContext, fileType,
            videoMetadata.width || imageMetadata.width || 0,
            videoMetadata.height || imageMetadata.height || 0,
            processedFileSize, userId, JSON.stringify(file.metadata), fileBuf,
            isPublicMedia, existingAsset.rows[0].id
          ]);
        } else {
          const filesRouteAssetId = crypto.randomUUID();
          await targetMediaPool.query(`
            INSERT INTO media_assets (
              id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public,
              user_id, metadata, file_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (stored_path) DO UPDATE SET
              original_filename = EXCLUDED.original_filename,
              context = EXCLUDED.context,
              format = EXCLUDED.format,
              width = COALESCE(EXCLUDED.width, media_assets.width),
              height = COALESCE(EXCLUDED.height, media_assets.height),
              size_bytes = EXCLUDED.size_bytes,
              sha256_hash = COALESCE(EXCLUDED.sha256_hash, media_assets.sha256_hash),
              user_id = COALESCE(EXCLUDED.user_id, media_assets.user_id),
              metadata = EXCLUDED.metadata,
              file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
              is_public = EXCLUDED.is_public,
              updated_at = CURRENT_TIMESTAMP
          `, [
            filesRouteAssetId,
            storedPath, originalname, mContext, fileType, 
            videoMetadata.width || imageMetadata.width || 0,
            videoMetadata.height || imageMetadata.height || 0,
            processedFileSize, sha256Hash || null, isPublicMedia,
            userId, JSON.stringify(file.metadata), fileBuf
          ]);
        }
        console.log(`[File Router] Registered asset in media_assets (${mContext}) for ${finalFilename}`);
      }
    } catch (dbErr: any) {
      console.error('[File Router] Failed to save file data to DB:', dbErr.message);
    }

    res.status(201).json({ 
      success: true, 
      file: { 
        ...file, 
        url: fileUrl, 
        thumbnailUrl, 
        resolution: videoMetadata.resolution,
        duration: videoMetadata.duration,
        bitrate: videoMetadata.bitrate,
        fileSize: processedFileSize
      }, 
      url: fileUrl,
      fileUrl, 
      thumbnailUrl,
      resolution: videoMetadata.resolution,
      duration: videoMetadata.duration,
      bitrate: videoMetadata.bitrate,
      fileSize: processedFileSize
    });
    await logSystemActivity(userId, 'file_upload', `Uploaded file: ${originalname}`, { fileId: file.id }, req);
  } catch (error: any) {
    console.error('File upload failed:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message || String(error) });
  }
});

router.post("/analyze-forensic", authenticateToken, checkDiskSpace, (upload.single('file') as any), handleMulterError, uploadValidator, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document attached for diagnostic audit.' });
    }
    const { path: filePath, mimetype } = req.file;
    if (!filePath || typeof filePath !== 'string' || filePath.includes('..') || filePath.includes('\0')) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
      return res.status(400).json({ error: 'File path outside permitted directory.' });
    }

    if (mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Forensic mode analytical scanner is restricted to PDF binary documents.' });
    }

    const fileBuffer = await fs.readFile(resolvedPath);
    const forensicReport = forensicScanPDF(fileBuffer);

    await fs.unlink(resolvedPath).catch(() => {});

    res.json({ success: true, forensic: forensicReport });
  } catch (error: any) {
    res.status(500).json({ error: 'Forensic diagnostic mapping failed.', details: error.message });
  }
});

router.get("/audit", authenticateToken, async (req: any, res: any) => {
  try {
    const report = await auditFilePipeline();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'File pipeline audit failed', details: error.message });
  }
});

router.post("/resolve-path", authenticateToken, async (req: any, res: any) => {
  try {
    const { url } = req.body;
    const resolved = await resolveMediaAbsolutePath(url);
    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ error: 'Path resolution failed', details: error.message });
  }
});

router.get("/", authenticateToken, async (req: any, res: any) => {
  try {
    const files = await getUserFiles(req.user.id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
});

export default router;
