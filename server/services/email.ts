import nodemailer from 'nodemailer';
import { pool } from '../db/index.js';
import { systemTemplates } from '../config/templates.js';
import { logSystemActivity } from './notifications.js';
import { escapeHtml } from '../utils/security.js';

// Clean plain text generator for anti-spam multipart/alternative compliance
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// Anti-Spam & Deduplication Filter (Guards against repetitive emails)
export async function isDuplicateEmailSuppressed(to: string, subject: string, cooldownMinutes: number = 15): Promise<boolean> {
  try {
    const checkRes = await pool.query(
      `SELECT id FROM email_logs 
       WHERE recipient_email = $1
       AND subject = $2
       AND status IN ('sent', 'pending')
       AND created_at > CURRENT_TIMESTAMP - (INTERVAL '1 minute' * $3)
       LIMIT 1`,
      [to, subject, cooldownMinutes]
    );
    if (checkRes.rows.length > 0) return true;

    const sysCheck = await pool.query(
      `SELECT id FROM system_logs 
       WHERE action = 'Send Outgoing Email' 
       AND details->>'to' = $1
       AND details->>'subject' = $2
       AND created_at > CURRENT_TIMESTAMP - (INTERVAL '1 minute' * $3)
       LIMIT 1`,
      [to, subject, cooldownMinutes]
    );
    return sysCheck.rows.length > 0;
  } catch {
    return false;
  }
}

// Helper to record email status into unified email_logs table
export async function recordUserEmailLog(data: {
  userId?: number | null;
  recipientEmail: string;
  templateName?: string;
  subject: string;
  status: 'sent' | 'failed' | 'suppressed' | 'pending';
  lastError?: string | null;
  metadata?: any;
}) {
  try {
    const userId = data.userId || null;
    const templateName = data.templateName || 'custom';
    const isSent = data.status === 'sent';

    await pool.query(
      `INSERT INTO email_logs 
       (user_id, recipient_email, template_name, subject, status, is_sent, retry_count, last_error, sent_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        data.recipientEmail,
        templateName,
        data.subject,
        data.status,
        isSent,
        0,
        data.lastError || null,
        isSent ? new Date() : null,
        JSON.stringify(data.metadata || {})
      ]
    );
  } catch (err) {
    console.warn('[recordUserEmailLog] Notice writing email audit record:', err);
  }
}

// Automatic retry mechanism for failed emails
export async function retryFailedEmails(maxRetries: number = 3): Promise<{ retried: number; succeeded: number }> {
  let retried = 0;
  let succeeded = 0;

  try {
    if (!pool) return { retried: 0, succeeded: 0 };

    // Guard: Check if SMTP settings are configured before attempting retries
    const settings = await pool.query('SELECT smtp_host, smtp_port FROM email_settings LIMIT 1');
    if (settings.rows.length === 0 || !settings.rows[0].smtp_host || !settings.rows[0].smtp_port) {
      return { retried: 0, succeeded: 0 };
    }

    const failedLogs = await pool.query(
      `SELECT id, user_id, recipient_email, template_name, subject, retry_count, metadata
       FROM email_logs
       WHERE status = 'failed' AND is_sent = false AND retry_count < $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [maxRetries]
    );

    for (const log of failedLogs.rows) {
      if (!log.recipient_email) continue;
      retried++;
      const nextRetryCount = (log.retry_count || 0) + 1;

      const html = log.metadata?.html || `<p>${escapeHtml(log.subject || 'Notification')}</p>`;

      const res = await sendEmail(
        log.recipient_email,
        log.subject || 'Notification',
        html,
        null,
        null,
        { bypassDeduplication: true }
      );

      if (res.success) {
        succeeded++;
        await pool.query(
          `UPDATE email_logs 
           SET status = 'sent', is_sent = true, sent_at = CURRENT_TIMESTAMP, retry_count = $1, last_error = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [nextRetryCount, log.id]
        );
      } else {
        await pool.query(
          `UPDATE email_logs 
           SET retry_count = $1, last_error = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [nextRetryCount, res.error || 'Retry failed', log.id]
        );
      }
    }
  } catch (err) {
    console.error('[retryFailedEmails] Execution error:', err);
  }

  return { retried, succeeded };
}

export async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  adminId: number | null = null, 
  preloadedSettings: any = null,
  options: { bypassDeduplication?: boolean; cooldownMinutes?: number; templateName?: string; userId?: number | null } = {}
) {
  try {
    // 1. Anti-Spam Deduplication Check
    if (!options.bypassDeduplication) {
      const isDuplicate = await isDuplicateEmailSuppressed(to, subject, options.cooldownMinutes || 5);
      if (isDuplicate) {
        console.warn(`[AntiSpamGuard] Suppressed duplicate email dispatch to "${to}" with subject "${subject}" (Cooldown active).`);
        await recordUserEmailLog({
          userId: options.userId || adminId,
          recipientEmail: to,
          templateName: options.templateName,
          subject,
          status: 'suppressed',
          metadata: { html }
        });
        return { success: true, suppressed: true };
      }
    }

    let s = preloadedSettings;
    if (!s) {
      const settings = await pool.query('SELECT * FROM email_settings LIMIT 1');
      if (settings.rows.length === 0) {
        throw new Error('Email SMTP settings are not configured in the admin panel.');
      }
      s = settings.rows[0];
    }

    if (!s.smtp_host || !s.smtp_port) {
      throw new Error('SMTP Host or Port is not specified in settings.');
    }

    const isSSL = s.smtp_encryption === 'ssl';
    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port: parseInt(s.smtp_port || '587'),
      secure: isSSL,
      auth: { 
        user: s.smtp_username || '', 
        pass: s.smtp_password || '' 
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000
    });

    const plainText = stripHtmlToText(html);
    const appUrl = process.env.PUBLIC_APP_URL || process.env.VITE_APP_URL || 'https://perplexta.com';

    const info = await transporter.sendMail({
      from: `"${s.sender_name || 'Perplexta'}" <${s.sender_email || 'noreply@perplexta.com'}>`,
      to,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk',
        'List-Unsubscribe': `<${appUrl}/settings/notifications>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    });

    await logSystemActivity(adminId, 'Send Outgoing Email', 'communication', {
      to,
      subject,
      messageId: info.messageId,
      status: 'success',
      sender: s.sender_email,
      timestamp: new Date().toISOString()
    });

    await recordUserEmailLog({
      userId: options.userId || adminId,
      recipientEmail: to,
      templateName: options.templateName,
      subject,
      status: 'sent',
      metadata: { messageId: info.messageId, html }
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const errMsg = error?.message || '';
    const isUnconfigured = errMsg.includes('are not configured') || errMsg.includes('not specified in settings');
    if (isUnconfigured) {
      console.info('[Email] Outgoing email skipped (SMTP is not configured):', to);
    } else {
      console.error('[Email] Failed to send email to:', to, 'Error:', error);
    }

    await logSystemActivity(adminId, 'Send Outgoing Email Failed', 'communication', {
      to,
      subject,
      status: isUnconfigured ? 'unconfigured' : 'failed',
      error: error.message || 'Unknown SMTP error',
      timestamp: new Date().toISOString()
    });

    await recordUserEmailLog({
      userId: options.userId || adminId,
      recipientEmail: to,
      templateName: options.templateName,
      subject,
      status: isUnconfigured ? 'suppressed' : 'failed',
      lastError: error.message || 'Unknown SMTP error',
      metadata: { html }
    });

    return { success: false, error: error.message || 'Unknown email transfer error.' };
  }
}

export async function verifySmtpConnection(config: {
  smtp_host: string;
  smtp_port: string | number;
  smtp_encryption?: string;
  smtp_username?: string;
  smtp_password?: string;
}) {
  const { smtp_host, smtp_port, smtp_encryption, smtp_username, smtp_password } = config;
  if (!smtp_host || !smtp_port) {
    throw new Error('SMTP Host and Port are required for verification.');
  }

  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: parseInt(String(smtp_port || '587'), 10),
    secure: smtp_encryption === 'ssl',
    auth: {
      user: smtp_username || '',
      pass: smtp_password || ''
    },
    connectionTimeout: 10000
  });

  await transporter.verify();
  return true;
}

export async function resolveUserLanguageAndDetails(userId: number | null, toEmail: string, explicitLang?: 'en' | 'ar'): Promise<{ language: 'en' | 'ar'; userName: string; email: string }> {
  let language: 'en' | 'ar' = explicitLang || 'ar';
  let userName = '';
  let email = toEmail || '';

  try {
    if (userId) {
      const userRes = await pool.query('SELECT name, email, language FROM users WHERE id = $1 LIMIT 1', [userId]);
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        userName = u.name || '';
        if (!email) email = u.email || '';
        if (!explicitLang && u.language) {
          language = String(u.language).toLowerCase().startsWith('en') ? 'en' : 'ar';
        }
      }
    } else if (toEmail) {
      const userRes = await pool.query('SELECT name, email, language FROM users WHERE email = $1 LIMIT 1', [toEmail]);
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        if (!userName) userName = u.name || '';
        if (!explicitLang && u.language) {
          language = String(u.language).toLowerCase().startsWith('en') ? 'en' : 'ar';
        }
      }
    }
  } catch (err) {
    console.warn('[Email] Failed to fetch user language preference:', err);
  }

  if (!explicitLang && !language) {
    language = 'ar';
  }

  return { language, userName: userName || (language === 'ar' ? 'المستخدم' : 'User'), email };
}

export const sendSmartEmail = async (
  userId: number | null,
  toEmail: string,
  templateName: string,
  variables: Record<string, string> = {},
  language?: 'en' | 'ar'
) => {
  try {
    const userDetail = await resolveUserLanguageAndDetails(userId, toEmail, language);
    const resolvedLang = userDetail.language;
    const targetEmail = toEmail || userDetail.email;

    if (!targetEmail) {
      console.warn('[Email] Aborted: No target email address specified for template:', templateName);
      return false;
    }

    let subject = '';
    let body = '';

    const templateRes = await pool.query('SELECT * FROM email_templates WHERE name = $1', [templateName]);
    if (templateRes.rows.length > 0) {
      const template = templateRes.rows[0];
      subject = resolvedLang === 'ar' ? (template.subject_ar || template.subject_en) : (template.subject_en || template.subject_ar);
      body = resolvedLang === 'ar' ? (template.body_ar || template.body_en) : (template.body_en || template.body_ar);
    } else {
      const fallbackTemplate = systemTemplates.find(t => t.name === templateName);
      if (!fallbackTemplate) {
        console.warn(`[Email] Template "${templateName}" not found in DB or system templates.`);
        return false;
      }
      subject = resolvedLang === 'ar' ? fallbackTemplate.subject_ar : fallbackTemplate.subject_en;
      body = resolvedLang === 'ar' ? fallbackTemplate.body_ar : fallbackTemplate.body_en;
    }

    const defaultBaseUrl = variables.baseUrl || process.env.PUBLIC_APP_URL || 'https://perplexta.com';
    const defaultActionUrl = variables.actionUrl || `${defaultBaseUrl}/login`;
    const formattedDate = new Date().toLocaleDateString(resolvedLang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mergedVariables: Record<string, string> = {
      userName: userDetail.userName,
      userEmail: targetEmail,
      registrationDate: formattedDate,
      actionUrl: defaultActionUrl,
      baseUrl: defaultBaseUrl,
      ...variables
    };

    Object.entries(mergedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const safeSubjectVal = String(value ?? '').replace(/[\r\n]+/g, ' ');
      subject = subject.replace(regex, safeSubjectVal);
      const safeBodyVal = key.startsWith('raw_') ? String(value ?? '') : escapeHtml(value);
      body = body.replace(regex, safeBodyVal);
    });

    const result = await sendEmail(targetEmail, subject, body, userId);
    return result.success;
  } catch (error) {
    console.warn('[Email] Smart email generation or delivery failed:', error);
    return false;
  }
};

export async function syncSystemTemplates() {
  if (!pool) return;
  try {
    await Promise.all(
      systemTemplates.map(template =>
        pool.query(`
          INSERT INTO email_templates (name, subject_en, subject_ar, body_en, body_ar)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO UPDATE SET
            subject_en = EXCLUDED.subject_en,
            subject_ar = EXCLUDED.subject_ar,
            body_en = EXCLUDED.body_en,
            body_ar = EXCLUDED.body_ar
        `, [template.name, template.subject_en, template.subject_ar, template.body_en, template.body_ar])
      )
    );
    console.log('[Email] System templates synchronized.');
  } catch (error) {
    console.error('[Email] Template sync failed:', error);
  }
}
