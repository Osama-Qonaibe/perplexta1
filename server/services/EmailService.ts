import { pool } from '../db/index.js';
import { systemTemplates } from '../config/templates.js';
import { sendEmail } from './email.js';

export const ADMIN_ONLY_TEMPLATES = [
  'gpu_provider_down_alert',
  'admin_alert_new_user',
  'admin_alert_plan_purchased',
  'admin_alert_user_deleted',
  'admin_alert_high_deposit',
  'admin_broadcast_announcement'
];

export interface EmailTemplateVariables {
  userName?: string;
  userEmail?: string;
  registrationDate?: string;
  actionUrl?: string;
  baseUrl?: string;
  [key: string]: any;
}

export class EmailService {
  /**
   * Resolves user language preference, role, and profile details from the database.
   */
  static async resolveUserLanguageAndProfile(
    userIdOrEmail: number | string | null,
    explicitLang?: 'ar' | 'en'
  ): Promise<{ language: 'ar' | 'en'; userName: string; email: string; role: string }> {
    let language: 'ar' | 'en' = explicitLang || 'ar';
    let userName = '';
    let email = '';
    let role = 'user';

    try {
      if (typeof userIdOrEmail === 'number') {
        const userRes = await pool.query('SELECT id, name, email, language, role FROM users WHERE id = $1 LIMIT 1', [userIdOrEmail]);
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          userName = u.name || '';
          email = u.email || '';
          role = u.role || 'user';
          if (!explicitLang && u.language) {
            language = String(u.language).toLowerCase().startsWith('en') ? 'en' : 'ar';
          }
        }
      } else if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
        email = userIdOrEmail;
        const userRes = await pool.query('SELECT name, email, language, role FROM users WHERE email = $1 LIMIT 1', [userIdOrEmail]);
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          if (!userName) userName = u.name || '';
          role = u.role || 'user';
          if (!explicitLang && u.language) {
            language = String(u.language).toLowerCase().startsWith('en') ? 'en' : 'ar';
          }
        }
      }
    } catch (err) {
      console.warn('[EmailService] Failed to resolve user language profile:', err);
    }

    if (!explicitLang && !language) {
      language = 'ar';
    }

    return {
      language,
      userName: userName || (language === 'ar' ? 'المستخدم' : 'User'),
      email,
      role
    };
  }

  /**
   * Broadcasts an admin-only alert template to all active system administrators.
   */
  static async notifyAdmins(
    templateName: string,
    customVariables: EmailTemplateVariables = {}
  ): Promise<{ dispatchedCount: number; errors: number }> {
    let dispatchedCount = 0;
    let errors = 0;

    try {
      const adminsRes = await pool.query(`
        SELECT id, name, email, language, role 
        FROM users 
        WHERE role IN ('admin', 'super_admin') AND status = 'active'
      `);

      if (adminsRes.rows.length === 0) {
        console.warn('[EmailService] No active admin recipients found for admin alert:', templateName);
        return { dispatchedCount: 0, errors: 0 };
      }

      for (const admin of adminsRes.rows) {
        const lang: 'ar' | 'en' = String(admin.language || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
        const mergedVars: EmailTemplateVariables = {
          userName: admin.name || 'Admin',
          userEmail: admin.email,
          actionUrl: customVariables.actionUrl || `${process.env.PUBLIC_APP_URL || 'https://perplexta.com'}/admin`,
          ...customVariables
        };

        try {
          const compiled = await this.renderTemplate(templateName, lang, mergedVars);
          const res = await sendEmail(admin.email, compiled.subject, compiled.html, admin.id);
          if (res.success) dispatchedCount++;
          else errors++;
        } catch (e) {
          console.error(`[EmailService] Failed to dispatch admin alert to ${admin.email}:`, e);
          errors++;
        }
      }
    } catch (error) {
      console.error('[EmailService] notifyAdmins execution failed:', error);
    }

    return { dispatchedCount, errors };
  }

  /**
   * Loads raw subject and HTML template from DB or system templates fallback.
   */
  static async loadRawTemplate(
    templateName: string,
    lang: 'ar' | 'en' = 'ar'
  ): Promise<{ subject: string; body: string }> {
    let subject = '';
    let body = '';

    try {
      const templateRes = await pool.query('SELECT * FROM email_templates WHERE name = $1 LIMIT 1', [templateName]);
      if (templateRes.rows.length > 0) {
        const dbTpl = templateRes.rows[0];
        subject = lang === 'ar' ? (dbTpl.subject_ar || dbTpl.subject_en) : (dbTpl.subject_en || dbTpl.subject_ar);
        body = lang === 'ar' ? (dbTpl.body_ar || dbTpl.body_en) : (dbTpl.body_en || dbTpl.body_ar);
      }
    } catch (err) {
      console.warn(`[EmailService] DB fetch failed for template "${templateName}", falling back to system templates:`, err);
    }

    if (!body) {
      const sysTpl = systemTemplates.find(t => t.name === templateName);
      if (sysTpl) {
        subject = lang === 'ar' ? sysTpl.subject_ar : sysTpl.subject_en;
        body = lang === 'ar' ? sysTpl.body_ar : sysTpl.body_en;
      }
    }

    if (!body) {
      throw new Error(`Email template "${templateName}" not found in database or system templates.`);
    }

    return { subject, body };
  }

  /**
   * Compiles approved HTML template by substituting placeholders like {{userName}}, {{userEmail}}, {{registrationDate}}, {{actionUrl}}.
   */
  static compileTemplate(
    rawTemplate: { subject: string; body: string },
    lang: 'ar' | 'en',
    variables: EmailTemplateVariables
  ): { subject: string; html: string } {
    let { subject, body: html } = rawTemplate;

    const defaultBaseUrl = variables.baseUrl || process.env.PUBLIC_APP_URL || 'https://perplexta.com';
    const defaultActionUrl = variables.actionUrl || `${defaultBaseUrl}/login`;
    const formattedDate = variables.registrationDate || new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mergedVariables: Record<string, string> = {
      userName: variables.userName || (lang === 'ar' ? 'المستخدم' : 'User'),
      userEmail: variables.userEmail || '',
      registrationDate: formattedDate,
      actionUrl: defaultActionUrl,
      baseUrl: defaultBaseUrl,
      ...Object.fromEntries(
        Object.entries(variables).map(([k, v]) => [k, String(v ?? '')])
      )
    };

    // Replace placeholders dynamically
    Object.entries(mergedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const safeSubjectVal = String(value).replace(/[\r\n]+/g, ' ');
      subject = subject.replace(regex, safeSubjectVal);
      html = html.replace(regex, String(value));
    });

    return { subject, html };
  }

  /**
   * Main entry point: Loads, resolves user language, compiles template and returns the formatted result.
   */
  static async renderTemplate(
    templateName: string,
    lang: 'ar' | 'en',
    variables: EmailTemplateVariables
  ): Promise<{ subject: string; html: string }> {
    const raw = await this.loadRawTemplate(templateName, lang);
    return this.compileTemplate(raw, lang, variables);
  }

  /**
   * High-level method to send a templated email with automatic user language detection, placeholder compilation, and role protection.
   */
  static async sendTemplatedEmail(
    target: number | string,
    templateName: string,
    customVariables: EmailTemplateVariables = {},
    explicitLang?: 'ar' | 'en'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const profile = await this.resolveUserLanguageAndProfile(target, explicitLang);
      const toEmail = typeof target === 'string' && target.includes('@') ? target : profile.email;
      const userId = typeof target === 'number' ? target : null;

      // Security Enforcement: Prevent sending admin-only / infrastructure templates to regular users
      if (ADMIN_ONLY_TEMPLATES.includes(templateName) && profile.role !== 'admin' && profile.role !== 'super_admin') {
        console.warn(`[EmailSecurityGuard] Blocked attempt to send admin-only template "${templateName}" to non-admin user "${toEmail}" (role: ${profile.role}). Redirecting to notifyAdmins.`);
        const adminDispatch = await this.notifyAdmins(templateName, customVariables);
        return { success: adminDispatch.dispatchedCount > 0 };
      }

      if (!toEmail) {
        throw new Error(`Target email address could not be resolved for template: ${templateName}`);
      }

      const mergedVars: EmailTemplateVariables = {
        userName: profile.userName,
        userEmail: toEmail,
        ...customVariables
      };

      const compiled = await this.renderTemplate(templateName, profile.language, mergedVars);
      return await sendEmail(toEmail, compiled.subject, compiled.html, userId);
    } catch (error: any) {
      console.error('[EmailService] Failed to send templated email:', error);
      return { success: false, error: error?.message || 'Email delivery failed.' };
    }
  }
}

export default EmailService;
