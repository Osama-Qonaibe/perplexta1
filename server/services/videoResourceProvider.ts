import { pool, mediaPool } from '../db/index.js';
import { saveFileMetadata } from './files.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface VideoResource {
  id?: number;
  user_id: number;
  chat_id: number | null;
  message_id: number | null;
  file_url: string;
  prompt: string | null;
  provider: string | null;
  model: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  resolution: string | null;
  metadata: any;
  created_at?: Date;
}

// In-memory caching layers to prevent database thrashing during frequent polling
const messageResourceCache = new Map<number, { resource: VideoResource | null; cachedAt: number }>();
const chatResourcesCache = new Map<number, { resources: VideoResource[]; cachedAt: number }>();
const userResourcesCache = new Map<string, { resources: VideoResource[]; cachedAt: number }>();

const MESSAGE_POSITIVE_TTL_MS = 10 * 60 * 1000; // 10 minutes for resolved resources
const MESSAGE_NEGATIVE_TTL_MS = 2000;          // 2 seconds for polling in-flight jobs
const LIST_CACHE_TTL_MS = 3000;                // 3 seconds for lists

function cleanExpiredEntries() {
  const now = Date.now();
  if (messageResourceCache.size > 2000) {
    for (const [key, val] of messageResourceCache.entries()) {
      const ttl = val.resource ? MESSAGE_POSITIVE_TTL_MS : MESSAGE_NEGATIVE_TTL_MS;
      if (now - val.cachedAt > ttl) messageResourceCache.delete(key);
    }
  }
  if (chatResourcesCache.size > 500) {
    for (const [key, val] of chatResourcesCache.entries()) {
      if (now - val.cachedAt > LIST_CACHE_TTL_MS) chatResourcesCache.delete(key);
    }
  }
}

export class VideoResourceProvider {
  /**
   * Store a brand-new generated video clip with full metadata and message/chat associations.
   */
  static async storeVideoResource(
    userId: string,
    chatId: number | null,
    messageId: number | null,
    fileUrl: string,
    prompt: string,
    provider: string,
    model: string,
    duration: number,
    aspectRatio: string,
    resolution: string,
    metadata: any = {}
  ): Promise<VideoResource> {
    if (!pool) throw new Error('Database initializing');

    console.log(`[VideoResourceProvider] Storing video resource: url=${fileUrl}, userId=${userId}, chatId=${chatId}, messageId=${messageId}`);

    // Parse numeric user ID
    const uId = parseInt(userId);
    if (isNaN(uId)) {
      throw new Error(`Invalid non-numeric user_id: ${userId}`);
    }

    // 1. Insert into the standardized video_resources table
    const query = `
      INSERT INTO video_resources (
        user_id, chat_id, message_id, file_url, prompt, provider, model, duration, aspect_ratio, resolution, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      uId,
      chatId || null,
      messageId || null,
      fileUrl,
      prompt || '',
      provider || '',
      model || '',
      duration || 5,
      aspectRatio || '16:9',
      resolution || '1080p',
      JSON.stringify(metadata)
    ];

    const result = await pool.query(query, values);
    const storedResource: VideoResource = result.rows[0];

    // Immediately cache in-memory to resolve ongoing frontend polling without DB lag
    if (messageId) {
      messageResourceCache.set(messageId, { resource: storedResource, cachedAt: Date.now() });
    }
    if (chatId) {
      chatResourcesCache.delete(chatId);
    }
    userResourcesCache.delete(String(uId));
    cleanExpiredEntries();

    // 2. Register under user_files as well for global document library compatibility
    try {
      const filename = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : fileUrl;
      await saveFileMetadata(userId, {
        file_name: `AI_Video_${Date.now()}.mp4`,
        file_url: filename,
        file_size: 1024 * 1024 * (duration || 5), // Estimate size for display/listing if not computed
        mime_type: 'video/mp4',
        file_type: 'video',
        metadata: {
          generated: true,
          videoResourceId: storedResource.id,
          prompt,
          provider,
          model,
          chat_id: chatId
        }
      });
    } catch (err: any) {
      console.warn('[VideoResourceProvider] Failed to register video under user_files, ignoring.', err.message);
    }

    // 3. Register under media_assets in the Media DB
    try {
      const targetMediaPool = mediaPool || pool;
      if (targetMediaPool) {
        const storedPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : (fileUrl.startsWith('uploads/') ? fileUrl : `uploads/${fileUrl}`);
        const diskPath = path.resolve(process.cwd(), storedPath);
        const fileBuf = await fs.readFile(diskPath).catch(() => null);
        const shaHash = fileBuf ? crypto.createHash('sha256').update(fileBuf).digest('hex') : crypto.createHash('sha256').update(storedPath).digest('hex');

        const vidAssetUuid = crypto.randomUUID();
        await targetMediaPool.query(`
          INSERT INTO media_assets (
            id, stored_path, original_filename, context, format, width, height, size_bytes, sha256_hash, is_public, user_id, metadata, file_data
          ) VALUES ($1, $2, $3, 'video', 'mp4', 0, 0, $4, $5, true, $6, $7, $8)
          ON CONFLICT (stored_path) DO UPDATE SET
            file_data = COALESCE(EXCLUDED.file_data, media_assets.file_data),
            user_id = COALESCE(EXCLUDED.user_id, media_assets.user_id),
            updated_at = CURRENT_TIMESTAMP
        `, [
          vidAssetUuid,
          storedPath,
          `AI_Video_${Date.now()}.mp4`,
          1024 * 1024 * (duration || 5),
          shaHash,
          userId || null,
          JSON.stringify({ prompt, provider, model, chatId, generated: true }),
          fileBuf
        ]).catch(() => {});
      }
    } catch (mErr: any) {
      console.warn('[VideoResourceProvider] Failed to register video under media_assets, ignoring.', mErr.message);
    }

    return storedResource;
  }

  /**
   * Retrieve all video resources associated with a specific chat session with caching.
   */
  static async getResourcesByChat(chatId: number): Promise<VideoResource[]> {
    if (!pool) throw new Error('Database initializing');

    const cached = chatResourcesCache.get(chatId);
    if (cached && Date.now() - cached.cachedAt < LIST_CACHE_TTL_MS) {
      return cached.resources;
    }

    const result = await pool.query(
      'SELECT * FROM video_resources WHERE chat_id = $1 ORDER BY created_at DESC',
      [chatId]
    );

    const resources = result.rows;
    chatResourcesCache.set(chatId, { resources, cachedAt: Date.now() });
    return resources;
  }

  /**
   * Retrieve all video resources generated by/for a specific user with caching.
   */
  static async getResourcesByUser(userId: string): Promise<VideoResource[]> {
    if (!pool) throw new Error('Database initializing');
    const uId = parseInt(userId);
    if (isNaN(uId)) return [];

    const cached = userResourcesCache.get(String(uId));
    if (cached && Date.now() - cached.cachedAt < LIST_CACHE_TTL_MS) {
      return cached.resources;
    }

    const result = await pool.query(
      'SELECT * FROM video_resources WHERE user_id = $1 ORDER BY created_at DESC',
      [uId]
    );

    const resources = result.rows;
    userResourcesCache.set(String(uId), { resources, cachedAt: Date.now() });
    return resources;
  }

  /**
   * Retrieve the video resource associated directly with a single chat message.
   * Uses an in-memory short-TTL cache for negative lookups and persistent cache for positives.
   */
  static async getResourceByMessage(messageId: number): Promise<VideoResource | null> {
    if (!pool) throw new Error('Database initializing');

    const cached = messageResourceCache.get(messageId);
    if (cached) {
      const ttl = cached.resource ? MESSAGE_POSITIVE_TTL_MS : MESSAGE_NEGATIVE_TTL_MS;
      if (Date.now() - cached.cachedAt < ttl) {
        return cached.resource;
      }
    }

    const result = await pool.query(
      'SELECT * FROM video_resources WHERE message_id = $1 LIMIT 1',
      [messageId]
    );

    const resource = result.rows[0] || null;
    messageResourceCache.set(messageId, { resource, cachedAt: Date.now() });
    return resource;
  }

  /**
   * Relink or update an existing video resource's association to a chat message.
   */
  static async associateMessageWithVideo(messageId: number, videoUrl: string): Promise<boolean> {
    if (!pool) throw new Error('Database initializing');
    if (!messageId || !videoUrl) return false;

    // Check if the message is already associated in memory
    const existing = messageResourceCache.get(messageId);
    if (existing?.resource && existing.resource.file_url === videoUrl) {
      return true;
    }

    // Clean exact file url from full URL tags if formatted as a markdown tag
    let cleanedUrl = videoUrl;
    if (videoUrl.includes('](')) {
      const match = videoUrl.match(/\]\((.*?)\)/);
      if (match && match[1]) {
        cleanedUrl = match[1];
      }
    }
    // strip out aspect ratios or hash indicators
    cleanedUrl = cleanedUrl.split('#')[0];

    // Only perform the UPDATE if message_id is not already set to this messageId
    const result = await pool.query(
      'UPDATE video_resources SET message_id = $1 WHERE (file_url = $2 OR file_url LIKE $3) AND (message_id IS NULL OR message_id != $1) RETURNING *',
      [messageId, cleanedUrl, `%${cleanedUrl.replace('/uploads/', '')}`]
    );

    if (result.rowCount && result.rowCount > 0) {
      messageResourceCache.set(messageId, { resource: result.rows[0], cachedAt: Date.now() });
      return true;
    }

    return false;
  }
}
