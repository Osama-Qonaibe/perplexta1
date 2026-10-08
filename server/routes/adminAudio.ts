import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimit.js';
import {
  getAllAudioProviders,
  saveAudioProviderKey,
  testAudioProviderConnection,
  toggleAudioProvider,
  setPrimaryAudioProvider,
  syncAudioTracksFromProviders
} from '../services/audioProvidersService.js';

const router = express.Router();
router.use(adminLimiter);
router.use(authenticateAdmin);

// GET /api/admin/audio/providers
router.get('/providers', async (req, res, next) => {
  try {
    const providers = await getAllAudioProviders();
    res.json({ success: true, providers });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/audio/providers/:key/key
router.post('/providers/:key/key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { api_key } = req.body;
    const result = await saveAudioProviderKey(key, api_key || '');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/audio/providers/:key/test
router.post('/providers/:key/test', async (req, res, next) => {
  try {
    const { key } = req.params;
    const result = await testAudioProviderConnection(key);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/audio/providers/:key/toggle
router.post('/providers/:key/toggle', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { is_enabled } = req.body;
    const result = await toggleAudioProvider(key, Boolean(is_enabled));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/audio/providers/:key/primary
router.post('/providers/:key/primary', async (req, res, next) => {
  try {
    const { key } = req.params;
    const result = await setPrimaryAudioProvider(key);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/audio/sync-tracks
router.post('/sync-tracks', async (req, res, next) => {
  try {
    const result = await syncAudioTracksFromProviders();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
