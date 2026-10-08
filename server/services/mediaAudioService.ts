import { mediaPool, pool } from '../db/index.js';
import crypto from 'crypto';

export interface UserAudioTrack {
  id: string;
  user_id: number | null;
  user_name: string | null;
  user_avatar: string | null;
  title: string;
  artist: string | null;
  duration: number;
  audio_url: string;
  audio_type: 'music' | 'sfx' | 'voice' | 'effect';
  category: string;
  source: 'manual_upload' | 'extracted_from_ad' | 'story' | 'system_seed';
  source_ad_id: number | null;
  usage_count: number;
  likes_count: number;
  is_trending: boolean;
  is_public: boolean;
  license: string;
  metadata: Record<string, any>;
  created_at: string;
}

let isMediaTableEnsured = false;

/**
 * Ensures the user_audio_library table exists on the mediaPool database.
 */
export async function ensureUserAudioTable(): Promise<void> {
  if (isMediaTableEnsured) return;
  const targetDb = mediaPool || pool;
  if (!targetDb) return;

  try {
    await targetDb.query(`
      CREATE TABLE IF NOT EXISTS user_audio_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER,
        user_name TEXT,
        user_avatar TEXT,
        title TEXT NOT NULL,
        artist TEXT,
        duration INTEGER DEFAULT 15,
        audio_url TEXT NOT NULL,
        audio_type VARCHAR(50) DEFAULT 'music',
        category VARCHAR(50) DEFAULT 'trending',
        source VARCHAR(50) DEFAULT 'manual_upload',
        source_ad_id INTEGER,
        usage_count INTEGER DEFAULT 1,
        likes_count INTEGER DEFAULT 0,
        is_trending BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT TRUE,
        license TEXT DEFAULT 'Creative Commons CC0',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_audio_library_user_id ON user_audio_library(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_audio_library_category ON user_audio_library(category);
      CREATE INDEX IF NOT EXISTS idx_user_audio_library_type ON user_audio_library(audio_type);
      CREATE INDEX IF NOT EXISTS idx_user_audio_library_usage ON user_audio_library(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_user_audio_library_created ON user_audio_library(created_at DESC);
    `);
    isMediaTableEnsured = true;
  } catch (err: any) {
    console.warn('[MediaAudioService] ensureUserAudioTable warning:', err.message);
  }
}

/**
 * Get curated, trending, and user-uploaded audio tracks from mediaPool.
 */
export async function getMediaAudioTracks(params: {
  category?: string;
  type?: string;
  query?: string;
  filter?: 'all' | 'trending' | 'most_used' | 'my_tracks';
  userId?: number | null;
  limit?: number;
  offset?: number;
}): Promise<{ tracks: UserAudioTrack[]; total: number }> {
  await ensureUserAudioTable();
  const targetDb = mediaPool || pool;

  const {
    category = 'all',
    type = 'all',
    query = '',
    filter = 'all',
    userId = null,
    limit = 40,
    offset = 0
  } = params;

  const whereConditions: string[] = ['is_public = TRUE'];
  const values: any[] = [];
  let paramIdx = 1;

  if (filter === 'my_tracks' && userId) {
    // When filtering by my_tracks, show private tracks too
    whereConditions.pop();
    whereConditions.push(`user_id = $${paramIdx++}`);
    values.push(userId);
  }

  if (category && category !== 'all') {
    whereConditions.push(`category = $${paramIdx++}`);
    values.push(category);
  }

  if (type && type !== 'all') {
    whereConditions.push(`audio_type = $${paramIdx++}`);
    values.push(type);
  }

  if (query.trim()) {
    whereConditions.push(`(title ILIKE $${paramIdx} OR artist ILIKE $${paramIdx} OR user_name ILIKE $${paramIdx})`);
    values.push(`%${query.trim()}%`);
    paramIdx++;
  }

  let orderBy = 'created_at DESC';
  if (filter === 'trending') {
    orderBy = 'is_trending DESC, usage_count DESC, created_at DESC';
  } else if (filter === 'most_used') {
    orderBy = 'usage_count DESC, likes_count DESC, created_at DESC';
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  try {
    const countRes = await targetDb.query(
      `SELECT COUNT(*)::int as total FROM user_audio_library ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT * FROM user_audio_library
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    const dataRes = await targetDb.query(dataQuery, [...values, limit, offset]);

    return {
      tracks: dataRes.rows,
      total
    };
  } catch (err: any) {
    console.error('[MediaAudioService] Error fetching media audio tracks:', err.message);
    return { tracks: [], total: 0 };
  }
}

/**
 * Save manual audio upload to user_audio_library.
 */
export async function addAudioTrack(params: {
  userId?: number | null;
  userName: string;
  userAvatar?: string | null;
  title: string;
  artist?: string | null;
  duration?: number;
  audioUrl: string;
  audioType?: 'music' | 'sfx' | 'voice' | 'effect';
  category?: string;
  source?: 'manual_upload' | 'extracted_from_ad' | 'story' | 'system_seed';
  sourceAdId?: number | null;
  license?: string;
  metadata?: Record<string, any>;
}): Promise<UserAudioTrack> {
  await ensureUserAudioTable();
  const targetDb = mediaPool || pool;

  const {
    userId,
    userName,
    userAvatar = null,
    title,
    artist = null,
    duration = 15,
    audioUrl,
    audioType = 'music',
    category = 'trending',
    source = 'manual_upload',
    sourceAdId = null,
    license = 'Creative Commons CC0',
    metadata = {}
  } = params;

  const id = crypto.randomUUID();

  const insertQuery = `
    INSERT INTO user_audio_library (
      id, user_id, user_name, user_avatar, title, artist,
      duration, audio_url, audio_type, category, source, source_ad_id,
      usage_count, likes_count, is_trending, is_public, license, metadata,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      1, 0, false, true, $13, $14,
      NOW(), NOW()
    )
    RETURNING *
  `;

  const res = await targetDb.query(insertQuery, [
    id,
    userId,
    userName,
    userAvatar,
    title.trim(),
    artist ? artist.trim() : userName,
    duration,
    audioUrl,
    audioType,
    category,
    source,
    sourceAdId,
    license,
    JSON.stringify(metadata)
  ]);

  return res.rows[0];
}

/**
 * Increment track usage count when someone creates a post or story with it.
 */
export async function recordAudioTrackUsage(trackId: string): Promise<void> {
  await ensureUserAudioTable();
  const targetDb = mediaPool || pool;

  try {
    await targetDb.query(`
      UPDATE user_audio_library
      SET usage_count = usage_count + 1,
          is_trending = CASE WHEN usage_count + 1 >= 5 THEN TRUE ELSE is_trending END,
          updated_at = NOW()
      WHERE id::text = $1 OR audio_url = $1
    `, [trackId]);
  } catch (err: any) {
    console.warn('[MediaAudioService] Record usage warning:', err.message);
  }
}

/**
 * Automatically harvest / extract audio track from a published video or post with music.
 * Ensures the library constantly grows organically from community activity.
 */
export async function harvestAudioFromPost(params: {
  userId: number;
  userName: string;
  userAvatar?: string | null;
  adId: number;
  postTitle?: string;
  audioUrl: string;
  audioType?: 'music' | 'sfx';
  category?: string;
}): Promise<void> {
  await ensureUserAudioTable();
  const targetDb = mediaPool || pool;

  const {
    userId,
    userName,
    userAvatar = null,
    adId,
    postTitle,
    audioUrl,
    audioType = 'music',
    category = 'community'
  } = params;

  if (!audioUrl || !audioUrl.trim()) return;

  try {
    // Check if this exact audioUrl already exists
    const existing = await targetDb.query(
      'SELECT id, usage_count FROM user_audio_library WHERE audio_url = $1 LIMIT 1',
      [audioUrl]
    );

    if (existing.rows.length > 0) {
      // Just bump usage
      await targetDb.query(
        'UPDATE user_audio_library SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1',
        [existing.rows[0].id]
      );
      return;
    }

    // Insert new track
    const cleanTitle = postTitle ? `صوت أصلي: ${postTitle.slice(0, 40)}` : `صوت أصلي (${userName})`;
    await addAudioTrack({
      userId,
      userName,
      userAvatar,
      title: cleanTitle,
      artist: userName,
      duration: 15,
      audioUrl,
      audioType,
      category,
      source: 'extracted_from_ad',
      sourceAdId: adId,
      metadata: { original_post_title: postTitle }
    });
  } catch (err: any) {
    console.warn('[MediaAudioService] Auto harvest warning:', err.message);
  }
}
