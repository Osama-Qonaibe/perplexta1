import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { pool } from '../db/index.js';

const router = express.Router();

interface RenderMetricItem {
  id: string;
  componentName: string;
  renderCount: number;
  timeSinceMount: number;
  renderDuration: number;
  timestamp: string;
  sessionId?: string;
}

const recentMetrics: RenderMetricItem[] = [];
const MAX_STORED_METRICS = 500;

/**
 * Secure logging endpoint for component render metrics during development
 */
router.post('/render', (req, res) => {
  try {
    const { componentName, renderCount, timeSinceMount, renderDuration, timestamp, sessionId } = req.body;
    if (componentName) {
      const item: RenderMetricItem = {
        id: Math.random().toString(36).substring(2, 9),
        componentName,
        renderCount: Number(renderCount) || 1,
        timeSinceMount: Number(timeSinceMount) || 0,
        renderDuration: Number(renderDuration) || 0,
        timestamp: timestamp || new Date().toISOString(),
        sessionId: sessionId || req.ip || 'anonymous-session'
      };
      recentMetrics.unshift(item);
      if (recentMetrics.length > MAX_STORED_METRICS) {
        recentMetrics.pop();
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin GET endpoint to retrieve collected render metrics for visualization
 */
router.get('/render', authenticateAdmin, (req, res) => {
  try {
    const data = [...recentMetrics];
    res.json({ success: true, metrics: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin GET endpoint to retrieve slow API performance logs from the dedicated database table
 */
router.get('/slow-requests', authenticateAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const thresholdMs = Number(req.query.threshold) || 500;

    if (!pool) {
      return res.json({ success: true, count: 0, thresholdMs, logs: [] });
    }

    const result = await pool.query(
      `SELECT id, endpoint, method, status_code, duration_ms, ip_address, user_id, is_slow, query_params, created_at
       FROM api_performance_logs
       WHERE duration_ms >= $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [thresholdMs, limit, offset]
    );

    res.json({
      success: true,
      count: result.rows.length,
      thresholdMs,
      logs: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
