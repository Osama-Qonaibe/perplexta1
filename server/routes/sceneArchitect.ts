import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { compileSceneWithArchitect } from '../services/sceneArchitectCompiler.js';

const router = express.Router();

/**
 * Scene Architect Middleware Route (POST /api/v1/scene-architect or POST /api/scene-architect)
 * Transforms raw multilingual prompts (Arabic, Hebrew, English, voice transcripts) into
 * production-grade JSON blueprints for direct GPU vision/video pipelines.
 */
router.post(['/', '/v1', '/compile', '/v1/scene-architect'], authenticateToken, async (req: any, res: any) => {
  try {
    const { prompt, userLang, mediaType, preferredModelId } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        error: 'Prompt is required',
        message: 'Please provide a non-empty prompt string to compile.'
      });
    }

    const userId = req.user?.id || null;
    const compiledScene = await compileSceneWithArchitect(prompt.trim(), {
      userLang: userLang || 'ar',
      userId,
      preferredModelId
    });

    if (mediaType && (mediaType === 'image' || mediaType === 'video')) {
      compiledScene.media_type = mediaType;
    }

    return res.json({
      success: true,
      service: 'PERPLEXTA SCENE ARCHITECT (v1.0)',
      architected_scene: compiledScene
    });
  } catch (error: any) {
    console.error('[SceneArchitectRoute] Execution error:', error?.message || error);
    return res.status(500).json({
      error: 'Scene Architecture Compilation Failed',
      message: error?.message || 'An unexpected error occurred during prompt synthesis.'
    });
  }
});

export default router;
