import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, tool_id, is_connected, config, last_connected_at, created_at, updated_at FROM google_tool_connections WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('[Google Integrations] Error fetching connections:', error);
    res.status(500).json({ error: 'Failed to fetch Google tool connections' });
  }
});

router.post('/:toolId', [
  authenticateToken,
  param('toolId').notEmpty().withMessage('toolId is required'),
  body('is_connected').isBoolean().withMessage('is_connected must be a boolean'),
  body('config').optional().isObject().withMessage('config must be an object'),
  handleValidationErrors,
], async (req: any, res: any) => {
  try {
    const { toolId } = req.params;
    const { is_connected, config = {} } = req.body;

    const result = await pool.query(
      `INSERT INTO google_tool_connections (user_id, tool_id, is_connected, config, last_connected_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, tool_id)
       DO UPDATE SET 
         is_connected = EXCLUDED.is_connected,
         config = google_tool_connections.config || EXCLUDED.config,
         last_connected_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, toolId, is_connected, JSON.stringify(config)]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Google Integrations] Error updating connection:', error);
    res.status(500).json({ error: 'Failed to update Google tool connection' });
  }
});

router.delete('/:toolId', authenticateToken, async (req: any, res) => {
  try {
    const { toolId } = req.params;
    await pool.query(
      'DELETE FROM google_tool_connections WHERE user_id = $1 AND tool_id = $2',
      [req.user.id, toolId]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Google Integrations] Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete Google tool connection' });
  }
});

router.post('/revoke-all', authenticateToken, async (req: any, res) => {
  try {
    await pool.query(
      'DELETE FROM google_tool_connections WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Google Integrations] Error revoking all connections:', error);
    res.status(500).json({ error: 'Failed to revoke Google tool connections' });
  }
});

export default router;
