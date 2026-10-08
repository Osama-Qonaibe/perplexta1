import express from 'express';
import { pool } from '../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { syncSystemTemplates, verifySmtpConnection } from '../services/email.js';
import { emailConfigSchema, verifyEmailConfigSchema, emailTemplateSchema } from '../schemas/email.schemas.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

const router = express.Router();

router.get('/config', authenticateAdmin, async (req, res, next) => {
  try {
    const check = await pool.query('SELECT * FROM email_settings LIMIT 1');
    if (check.rows.length === 0) {
      return res.json({
        mailer_type: 'smtp',
        smtp_host: '',
        smtp_port: '587',
        smtp_encryption: 'tls',
        smtp_username: '',
        smtp_password: '',
        sender_name: 'Perplexta',
        sender_email: '',
        status: 'pending',
        last_verified_at: null
      });
    }
    res.json(check.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

router.put('/config', authenticateAdmin, async (req, res, next) => {
  try {
    const parsed = emailConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        'Validation failed',
        ERROR_CODES.VALIDATION_FAILED.status,
        ERROR_CODES.VALIDATION_FAILED.code
      );
    }

    const {
      mailer_type,
      smtp_host,
      smtp_port,
      smtp_encryption,
      smtp_username,
      smtp_password,
      sender_name,
      sender_email
    } = parsed.data;

    const upsertRes = await pool.query(`
      INSERT INTO email_settings (
        id, mailer_type, smtp_host, smtp_port, smtp_encryption, 
        smtp_username, smtp_password, sender_name, sender_email, status
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      ON CONFLICT (id) DO UPDATE SET
        mailer_type = EXCLUDED.mailer_type,
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_encryption = EXCLUDED.smtp_encryption,
        smtp_username = EXCLUDED.smtp_username,
        smtp_password = EXCLUDED.smtp_password,
        sender_name = EXCLUDED.sender_name,
        sender_email = EXCLUDED.sender_email,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      mailer_type || 'smtp',
      smtp_host || '',
      String(smtp_port || '587'),
      smtp_encryption || 'tls',
      smtp_username || '',
      smtp_password || '',
      sender_name || 'Perplexta',
      sender_email || ''
    ]);
    if (upsertRes.rows.length === 0) {
      throw new AppError(
        'Failed to record secure configurations in database registry due to an empty response.',
        ERROR_CODES.DB_QUERY_ERROR.status,
        ERROR_CODES.DB_QUERY_ERROR.code
      );
    }
    res.json(upsertRes.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

router.post('/verify', authenticateAdmin, async (req, res, next) => {
  try {
    const parsed = verifyEmailConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        'Validation failed',
        ERROR_CODES.VALIDATION_FAILED.status,
        ERROR_CODES.VALIDATION_FAILED.code
      );
    }

    const {
      mailer_type,
      smtp_host,
      smtp_port,
      smtp_encryption,
      smtp_username,
      smtp_password,
      sender_name,
      sender_email
    } = parsed.data;

    try {
      await verifySmtpConnection({
        smtp_host,
        smtp_port,
        smtp_encryption,
        smtp_username,
        smtp_password
      });
    } catch (verifyErr: any) {
      throw new AppError(
        `Connection failed: ${verifyErr.message}`,
        ERROR_CODES.SERVICE_UNAVAILABLE.status,
        ERROR_CODES.SERVICE_UNAVAILABLE.code
      );
    }

    const upsertRes = await pool.query(`
      INSERT INTO email_settings (
        id, mailer_type, smtp_host, smtp_port, smtp_encryption, 
        smtp_username, smtp_password, sender_name, sender_email, 
        status, last_verified_at
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, 'active', CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        mailer_type = EXCLUDED.mailer_type,
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_encryption = EXCLUDED.smtp_encryption,
        smtp_username = EXCLUDED.smtp_username,
        smtp_password = EXCLUDED.smtp_password,
        sender_name = EXCLUDED.sender_name,
        sender_email = EXCLUDED.sender_email,
        status = 'active',
        last_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      mailer_type || 'smtp',
      smtp_host,
      String(smtp_port),
      smtp_encryption || 'tls',
      smtp_username || '',
      smtp_password || '',
      sender_name || 'Perplexta',
      sender_email || ''
    ]);
    if (upsertRes.rows.length === 0) {
      throw new AppError(
        'Failed to record verified secure configurations in the database.',
        ERROR_CODES.DB_QUERY_ERROR.status,
        ERROR_CODES.DB_QUERY_ERROR.code
      );
    }
    const savedRow = upsertRes.rows[0];

    res.json({ success: true, config: savedRow });
  } catch (error: any) {
    next(error);
  }
});

router.get('/templates', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM email_templates ORDER BY name ASC');
    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

router.post('/templates', authenticateAdmin, async (req, res, next) => {
  try {
    const parsed = emailTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        'Validation failed',
        ERROR_CODES.VALIDATION_FAILED.status,
        ERROR_CODES.VALIDATION_FAILED.code
      );
    }

    const {
      id,
      name,
      subject_en,
      subject_ar,
      body_en,
      body_ar,
      type
    } = parsed.data;

    let savedTemplate;
    if (id) {
      const updateRes = await pool.query(`
        UPDATE email_templates SET
          name = $1, subject_en = $2, subject_ar = $3,
          body_en = $4, body_ar = $5, type = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [
        name.trim(),
        subject_en || '',
        subject_ar || '',
        body_en || '',
        body_ar || '',
        type || 'custom',
        id
      ]);
      savedTemplate = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(`
        INSERT INTO email_templates (name, subject_en, subject_ar, body_en, body_ar, type)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          subject_en = EXCLUDED.subject_en,
          subject_ar = EXCLUDED.subject_ar,
          body_en = EXCLUDED.body_en,
          body_ar = EXCLUDED.body_ar,
          type = EXCLUDED.type,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        name.trim(),
        subject_en || '',
        subject_ar || '',
        body_en || '',
        body_ar || '',
        type || 'custom'
      ]);
      savedTemplate = insertRes.rows[0];
    }

    res.json(savedTemplate);
  } catch (error: any) {
    next(error);
  }
});

router.delete('/templates/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (error: any) {
    next(error);
  }
});

router.post('/sync', authenticateAdmin, async (req, res, next) => {
  try {
    await syncSystemTemplates();
    res.json({ success: true, message: 'System templates synchronized successfully.' });
  } catch (error: any) {
    next(error);
  }
});

router.get('/feedback-logs', authenticateAdmin, async (req, res, next) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query as any;
    
    // Ensure table exists safely
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_feedback_logs (
        id SERIAL PRIMARY KEY,
        message_id INTEGER,
        chat_id INTEGER,
        user_id INTEGER,
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        feedback_type VARCHAR(20) NOT NULL,
        rating INTEGER DEFAULT 5,
        reason VARCHAR(255),
        comment TEXT,
        tags JSONB DEFAULT '[]',
        user_prompt TEXT,
        assistant_response TEXT,
        email_sent BOOLEAN DEFAULT false,
        email_recipient VARCHAR(255),
        model_reinforced BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    let query = `
      SELECT f.*, c.title as chat_title
      FROM ai_feedback_logs f
      LEFT JOIN chats c ON f.chat_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (type && type !== 'all') {
      params.push(type);
      query += ` AND f.feedback_type = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (f.user_email ILIKE $${params.length} OR f.user_name ILIKE $${params.length} OR f.comment ILIKE $${params.length} OR f.reason ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10) || 50, parseInt(offset as string, 10) || 0);
    
    const logsRes = await pool.query(query, params).catch(() => ({ rows: [] }));
    
    const countRes = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN feedback_type = 'like' THEN 1 END) as likes_count,
        COUNT(CASE WHEN feedback_type = 'dislike' THEN 1 END) as dislikes_count,
        COALESCE(AVG(CASE WHEN feedback_type = 'like' THEN rating END), 5) as avg_rating
      FROM ai_feedback_logs
    `).catch(() => ({ rows: [{ total: 0, likes_count: 0, dislikes_count: 0, avg_rating: 5 }] }));
    
    res.json({
      logs: logsRes.rows,
      stats: countRes.rows[0] || { total: 0, likes_count: 0, dislikes_count: 0, avg_rating: 5 }
    });
  } catch (error: any) {
    next(error);
  }
});

router.delete('/feedback-logs/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ai_feedback_logs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    next(error);
  }
});

export default router;
