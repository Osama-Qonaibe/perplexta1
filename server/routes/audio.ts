import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllAudioProviders,
  getActiveDecryptedAudioKey,
  getCachedAudioTracks
} from '../services/audioProvidersService.js';
import {
  getMediaAudioTracks,
  addAudioTrack,
  recordAudioTrackUsage
} from '../services/mediaAudioService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Audio upload storage configuration
const audioUploadDir = path.resolve(process.cwd(), 'uploads/audio');
if (!fs.existsSync(audioUploadDir)) {
  fs.mkdirSync(audioUploadDir, { recursive: true });
}

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, audioUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
      const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
      cb(null, cleanName);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB audio/media files
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm', '.mp4', '.m4v', '.wma', '.opus', '.3gp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowed.includes(ext) ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/octet-stream' ||
      !ext
    ) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي مثل MP3 أو WAV أو OGG'));
    }
  }
});

export interface UnifiedAudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audio_url: string;
  category: string;
  provider: string;
  license: string;
  user_name?: string | null;
  user_avatar?: string | null;
  audio_type?: string;
  usage_count?: number;
  is_trending?: boolean;
}

const NATIVE_BUILTIN_TRACKS: UnifiedAudioTrack[] = [
  {
    id: 'native-1',
    title: 'لوفي هادئ',
    artist: 'بيربليكستا ساوند',
    duration: 15,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f3/Lofi_track.ogg/Lofi_track.ogg.mp3',
    category: 'lofi',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  },
  {
    id: 'native-2',
    title: 'جيتار كلاسيكي',
    artist: 'بيربليكستا ساوند',
    duration: 15,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1d/Acoustic_Guitar_Loop.ogg/Acoustic_Guitar_Loop.ogg.mp3',
    category: 'cinematic',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  },
  {
    id: 'native-3',
    title: 'إيقاع بوب حيوي',
    artist: 'بيربليكستا ساوند',
    duration: 15,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/27/Upbeat_Energetic_Rhythm.ogg/Upbeat_Energetic_Rhythm.ogg.mp3',
    category: 'pop',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  },
  {
    id: 'native-4',
    title: 'بيانو سينمائي',
    artist: 'بيربليكستا ساوند',
    duration: 15,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5a/Cinematic_Piano_Melody.ogg/Cinematic_Piano_Melody.ogg.mp3',
    category: 'cinematic',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  },
  {
    id: 'native-5',
    title: 'نغمة إشعار أنيقة',
    artist: 'بيربليكستا ساوند',
    duration: 8,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4b/Marimba_Notification_Ringtone.ogg/Marimba_Notification_Ringtone.ogg.mp3',
    category: 'ringtones',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  },
  {
    id: 'native-6',
    title: 'مؤثر انتقال سينمائي',
    artist: 'بيربليكستا ساوند',
    duration: 4,
    audio_url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/87/Whoosh_Sound_Effect.ogg/Whoosh_Sound_Effect.ogg.mp3',
    category: 'sfx',
    provider: 'perplexta_native',
    license: 'Creative Commons CC0'
  }
];

// GET /api/audio/providers
router.get('/providers', async (req, res, next) => {
  try {
    const providers = await getAllAudioProviders();
    const publicList = providers.filter(p => p.is_enabled).map(p => ({
      provider_key: p.provider_key,
      name: p.name_ar || p.name,
      capabilities: p.capabilities,
      is_primary: p.is_primary
    }));
    res.json({ success: true, providers: publicList });
  } catch (err) {
    next(err);
  }
});

// GET /api/audio/search
router.get('/search', async (req, res, next) => {
  try {
    const query = (req.query.q as string || '').trim();
    const category = (req.query.category as string || 'all').trim();
    const type = (req.query.type as string || 'all').trim();
    const filter = (req.query.filter as any || 'all');

    // 1. Fetch from mediaPool persistent user audio library
    const mediaTracksResult = await getMediaAudioTracks({
      query,
      category,
      type,
      filter,
      limit: 60
    });

    const userTracks: UnifiedAudioTrack[] = mediaTracksResult.tracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist || t.user_name || 'مبدع فيرال بوك',
      duration: t.duration || 15,
      audio_url: t.audio_url,
      category: t.category || 'trending',
      provider: t.source === 'manual_upload' ? 'user_upload' : 'viralbook_community',
      license: t.license || 'Creative Commons CC0',
      user_name: t.user_name,
      user_avatar: t.user_avatar,
      audio_type: t.audio_type,
      usage_count: t.usage_count,
      is_trending: t.is_trending
    }));

    // 2. Fetch cached external provider tracks if needed
    const cached = await getCachedAudioTracks(query, category);
    const cachedTracks: UnifiedAudioTrack[] = cached.map(c => ({
      id: c.id,
      title: c.title,
      artist: c.artist || 'Audio Vault',
      duration: c.duration || 15,
      audio_url: c.audio_url,
      category: c.category || 'lofi',
      provider: c.provider || 'perplexta_native',
      license: c.license || 'Royalty-Free Open',
      usage_count: 5,
      is_trending: false
    }));

    // Combine: User uploaded / harvested mediaPool tracks first, then cached, then native built-ins
    let results: UnifiedAudioTrack[] = [...userTracks, ...cachedTracks];

    if (results.length === 0) {
      results = [...NATIVE_BUILTIN_TRACKS];
    }

    res.json({
      success: true,
      total: results.length,
      tracks: results
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/audio/library - Dedicated media library feed with tabs (all, trending, most_used, my_tracks)
router.get('/library', async (req: any, res, next) => {
  try {
    const query = (req.query.q as string || '').trim();
    const category = (req.query.category as string || 'all').trim();
    const type = (req.query.type as string || 'all').trim();
    const filter = (req.query.filter as any || 'all');
    let userId = req.user?.id ? Number(req.user.id) : null;

    if (!userId) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]?.trim();
        if (token && token !== 'undefined' && token !== 'null') {
          try {
            const jwt = await import('jsonwebtoken');
            const decoded: any = jwt.default.decode(token);
            if (decoded && decoded.id) {
              userId = Number(decoded.id) || null;
            }
          } catch (_) {}
        }
      }
    }
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const { tracks, total } = await getMediaAudioTracks({
      query,
      category,
      type,
      filter,
      userId,
      limit,
      offset
    });

    // If database has few/no tracks, provide built-in fallback tracks matching filters
    let finalTracks = [...tracks];
    if (finalTracks.length === 0 && filter !== 'my_tracks') {
      let filteredNative = NATIVE_BUILTIN_TRACKS;
      if (category && category !== 'all') {
        filteredNative = filteredNative.filter(t => t.category === category);
      }
      if (type && type !== 'all') {
        filteredNative = filteredNative.filter(t => (t.category === 'sfx' ? 'sfx' : 'music') === type);
      }
      if (query) {
        const q = query.toLowerCase();
        filteredNative = filteredNative.filter(t => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q)));
      }

      finalTracks = filteredNative.map(t => ({
        id: t.id,
        user_id: null,
        user_name: 'بيربليكستا ساوند',
        user_avatar: null,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        audio_url: t.audio_url,
        audio_type: (t.category === 'sfx' ? 'sfx' : 'music') as any,
        category: t.category,
        source: 'system_seed' as any,
        source_ad_id: null,
        usage_count: 10,
        likes_count: 5,
        is_trending: true,
        is_public: true,
        license: t.license,
        metadata: {},
        created_at: new Date().toISOString()
      }));
    }

    res.json({
      success: true,
      total: total || finalTracks.length,
      tracks: finalTracks
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/audio/upload - Manual music & SFX upload (supports authenticated & guest creators)
router.post('/upload', audioUpload.single('audio') as any, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'يرجى اختيار ملف صوتي للرفع' });
    }

    let userId: number | null = null;
    let userName = 'مبدع بيربليكستا';
    let userAvatar: string | null = null;

    // Check optional Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]?.trim();
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded: any = jwt.default.decode(token);
          if (decoded && decoded.id) {
            userId = Number(decoded.id) || null;
            userName = decoded.name || 'مبدع بيربليكستا';
            userAvatar = decoded.avatar || null;
          }
        } catch (_) {}
      }
    }

    const rawTitle = (req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '')).trim();
    const title = rawTitle || 'مقطع صوتي جديد';
    const artist = (req.body.artist || userName).trim();
    const duration = Math.max(1, Math.min(600, Number(req.body.duration) || 15));
    const audioType = req.body.audio_type === 'sfx' ? 'sfx' : 'music';
    const category = (req.body.category || 'trending').trim();
    const license = (req.body.license || 'Creative Commons CC0').trim();

    const fileRelativeUrl = `/uploads/audio/${req.file.filename}`;

    const newTrack = await addAudioTrack({
      userId,
      userName,
      userAvatar,
      title,
      artist,
      duration,
      audioUrl: fileRelativeUrl,
      audioType,
      category,
      source: 'manual_upload',
      license,
      metadata: {
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      }
    });

    const unifiedTrack = {
      ...newTrack,
      id: String(newTrack.id),
      audio_url: fileRelativeUrl,
      file_url: fileRelativeUrl,
      title: newTrack.title,
      artist: newTrack.artist || userName,
      duration: newTrack.duration || duration,
      category: newTrack.category || category,
      audio_type: newTrack.audio_type || audioType,
      is_trending: false,
      usage_count: 1
    };

    return res.json({
      success: true,
      message: 'تم رفع وإضافة المقطع الصوتي بنجاح!',
      track: unifiedTrack
    });
  } catch (err: any) {
    console.error('[Audio Upload] Error:', err.message);
    return res.status(500).json({ error: err.message || 'فشل رفع الملف الصوتي' });
  }
});

// POST /api/audio/library/:id/use & /tracks/:id/use - Record track usage
router.post('/library/:id/use', async (req, res) => {
  try {
    const trackId = req.params.id;
    if (trackId) {
      await recordAudioTrackUsage(String(trackId));
    }
    res.json({ success: true, message: 'Track usage recorded' });
  } catch (err: any) {
    res.json({ success: true, note: 'Silent track usage record' });
  }
});

router.post('/tracks/:id/use', async (req, res) => {
  try {
    const trackId = req.params.id;
    if (trackId) {
      await recordAudioTrackUsage(String(trackId));
    }
    res.json({ success: true, message: 'Track usage recorded' });
  } catch (err: any) {
    res.json({ success: true, note: 'Silent track usage record' });
  }
});

// POST /api/audio/record-usage - Record usage count when audio track is picked
router.post('/record-usage', async (req, res) => {
  try {
    const { track_id } = req.body;
    if (track_id) {
      await recordAudioTrackUsage(String(track_id));
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

export default router;
