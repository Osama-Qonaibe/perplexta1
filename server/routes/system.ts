import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateAdmin, authenticateToken } from '../middleware/auth.js';
import { getSystemSettings, updateSystemSettings, getEconomySettings } from '../services/system.js';
import { pool, ledgerPool, externalPool, securityPool, mediaPool, getPoolMetrics, isDatabaseConnected } from '../db/index.js';
import { checkAllDatabasesHealth } from '../services/admin.js';
import { getStripe, getPayPalCredentials } from '../services/payments.js';
import { logSystemActivity } from '../services/notifications.js';
import { escapeHtml, isSafeExternalUrl } from '../utils/security.js';

const router = express.Router();

const checkOptionalAuth = (req: express.Request): boolean => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (token) {
      token = token.trim();
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }
    }
    if (!token || token === 'null' || token === 'undefined' || token === '') {
      return false;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;
    jwt.verify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
};

router.get("/settings", async (req, res) => {
  try {
    const rawSettings = await getSystemSettings(); const settings = { ...(rawSettings || {}) };

    const stripeObj = await getStripe().catch(() => null);
    const paypalObj = await getPayPalCredentials().catch(() => null);

    const isStripeActive = !!stripeObj;
    const isPaypalActive = !!paypalObj;

    const isAuth = checkOptionalAuth(req);
    if (!isAuth) {
      delete settings.stripe_publishable_key;
      delete settings.paypal_client_id;
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    } else {
      res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
    }
    res.json({
      ...settings,
      stripe_active: isStripeActive,
      paypal_active: isPaypalActive
    });
  } catch (error: any) {
    console.error('Settings Error:', error); res.status(500).json({ error: 'Internal Error', msg: error.message });
  }
});

const handleGetFontConfig = async (req: express.Request, res: express.Response) => {
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
  try {
    const settings = await getSystemSettings();
    const reqLang = req.query.lang as string;
    
    let parsedConfig: any = {};
    try {
      parsedConfig = typeof settings.font_loading_config === 'string'
        ? JSON.parse(settings.font_loading_config)
        : (settings.font_loading_config || {});
    } catch {
      parsedConfig = {};
    }

    let parsedAr: any = {};
    try {
      parsedAr = typeof settings.font_config_ar === 'string'
        ? JSON.parse(settings.font_config_ar)
        : (settings.font_config_ar || {});
    } catch {
      parsedAr = {};
    }

    let parsedEn: any = {};
    try {
      parsedEn = typeof settings.font_config_en === 'string'
        ? JSON.parse(settings.font_config_en)
        : (settings.font_config_en || {});
    } catch {
      parsedEn = {};
    }

    const fontConfig = {
      dynamicLoading: parsedConfig.dynamicLoading !== false,
      ar: {
        fontFamily: parsedAr.fontFamily || parsedConfig.ar?.fontFamily || 'Cairo',
        enabled: parsedAr.enabled !== false && parsedConfig.ar?.enabled !== false,
        url: parsedAr.url || parsedConfig.ar?.url || 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap'
      },
      en: {
        fontFamily: parsedEn.fontFamily || parsedConfig.en?.fontFamily || 'Geist',
        enabled: parsedEn.enabled !== false && parsedConfig.en?.enabled !== false,
        url: parsedEn.url || parsedConfig.en?.url || 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap'
      }
    };

    if (reqLang === 'ar' || reqLang === 'en') {
      return res.json({
        language: reqLang,
        fontConfig: fontConfig[reqLang],
        dynamicLoading: fontConfig.dynamicLoading
      });
    }

    res.json(fontConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch font configurations' });
  }
};

const handlePostFontConfig = async (req: express.Request, res: express.Response) => {
  try {
    const { ar, en, dynamicLoading, font_loading_config, font_config_ar, font_config_en } = req.body;
    
    let fontConfigToSave = font_loading_config;
    if (!fontConfigToSave && (ar || en || dynamicLoading !== undefined)) {
      fontConfigToSave = {
        ar: ar || { fontFamily: 'Tajawal', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap' },
        en: en || { fontFamily: 'Space Grotesk', enabled: true, url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap' },
        dynamicLoading: dynamicLoading !== false
      };
    }

    const updatePayload: any = {};
    if (fontConfigToSave) updatePayload.font_loading_config = fontConfigToSave;
    if (font_config_ar || ar) updatePayload.font_config_ar = font_config_ar || ar;
    if (font_config_en || en) updatePayload.font_config_en = font_config_en || en;

    await updateSystemSettings(updatePayload);
    res.json({ success: true, message: 'Font loading configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update font configuration' });
  }
};

router.get("/settings/fonts", handleGetFontConfig);
router.get("/fonts", handleGetFontConfig);
router.get("/font-config", handleGetFontConfig);
router.get("/settings/font-config", handleGetFontConfig);

router.post("/settings/fonts", authenticateAdmin, handlePostFontConfig);
router.post("/fonts", authenticateAdmin, handlePostFontConfig);
router.post("/font-config", authenticateAdmin, handlePostFontConfig);
router.post("/settings/font-config", authenticateAdmin, handlePostFontConfig);
router.put("/settings/font-config", authenticateAdmin, handlePostFontConfig);

router.get("/economy", async (req, res) => {
  try {
    const economy = { ...await getEconomySettings() };
    const isAuth = checkOptionalAuth(req);
    if (!isAuth) {
      delete economy.crypto_address;
      delete economy.bank_name;
      delete economy.bank_recipient;
      delete economy.bank_iban;
      delete economy.bank_swift;
      delete economy.paypal_email;
    }
    res.json(economy);
  } catch (error: any) {
    console.error('Settings Error:', error); res.status(500).json({ error: 'Internal Error', msg: error.message });
  }
});

const urlMetadataCache = new Map<string, any>();

router.get("/link-metadata", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let cleanUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // SSRF Protection: Reject private/internal IP ranges, localhost, and cloud metadata endpoints
  if (!isSafeExternalUrl(cleanUrl)) {
    return res.status(400).json({ error: 'Invalid or restricted URL destination' });
  }

  if (urlMetadataCache.has(cleanUrl)) {
    return res.json(urlMetadataCache.get(cleanUrl));
  }

  try {
    const parsedUrl = new URL(cleanUrl);
    const domain = parsedUrl.hostname;
    const defaultMeta = {
      title: domain,
      description: '',
      image: '',
      site_name: domain.replace(/^www\./i, '').split('.')[0] || domain,
      url: cleanUrl,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const fetchRes = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (!fetchRes.ok) {
      urlMetadataCache.set(cleanUrl, defaultMeta);
      return res.json(defaultMeta);
    }

    const html = await fetchRes.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : defaultMeta.title;

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : title;

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : description;

    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    let image = ogImageMatch ? ogImageMatch[1].trim() : '';
    if (image && !/^https?:\/\//i.test(image)) {
      image = new URL(image, cleanUrl).toString();
    }

    const siteNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
    const site_name = siteNameMatch ? siteNameMatch[1].trim() : defaultMeta.site_name;

    const resultMeta = {
      title: ogTitle || title || defaultMeta.title,
      description: ogDescription || defaultMeta.description,
      image: image || defaultMeta.image,
      site_name: site_name || defaultMeta.site_name,
      url: cleanUrl,
      favicon: defaultMeta.favicon
    };

    urlMetadataCache.set(cleanUrl, resultMeta);
    return res.json(resultMeta);
  } catch (err) {
    try {
      const parsedUrl = new URL(cleanUrl);
      const domain = parsedUrl.hostname;
      const fallbackMeta = {
        title: domain,
        description: '',
        image: '',
        site_name: domain.replace(/^www\./i, '').split('.')[0] || domain,
        url: cleanUrl,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      };
      urlMetadataCache.set(cleanUrl, fallbackMeta);
      return res.json(fallbackMeta);
    } catch {
      const fallbackMeta = {
        title: targetUrl,
        description: '',
        image: '',
        site_name: targetUrl,
        url: cleanUrl,
        favicon: `https://www.google.com/s2/favicons?domain=google.com&sz=64`
      };
      return res.json(fallbackMeta);
    }
  }
});

router.post("/shortcuts", authenticateToken, async (req: any, res) => {
  try {
    const { title, query } = req.body;
    const userId = req.user.id;

    if (!title || !query) {
      return res.status(400).json({ error: 'Title and query are required' });
    }

    if (!pool) throw new Error('Database initializing');

    const result = await pool.query(
      'INSERT INTO user_shortcuts (user_id, title, query) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, query]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save shortcut' });
  }
});

router.get("/shortcuts", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    if (!pool) throw new Error('Database initializing');

    const result = await pool.query(
      'SELECT * FROM user_shortcuts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch shortcuts' });
  }
});

router.post("/reports", authenticateToken, async (req: any, res) => {
  try {
    const { messageId, category, categoryLabel, reason, details, contactInfo, attachmentName, assistantResponse, userPrompt } = req.body;
    const userId = req.user.id;

    if (!pool) throw new Error('Database initializing');

    // Ensure columns exist on message_reports
    await pool.query(`
      ALTER TABLE message_reports 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS details TEXT,
      ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255),
      ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
    `).catch(() => {});

    // Fetch user info for the email notification
    let userName = req.user.name || 'مستخدم المنصة';
    let userEmail = req.user.email || 'غير معروف';
    try {
      const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        userName = userRes.rows[0].name || userName;
        userEmail = userRes.rows[0].email || userEmail;
      }
    } catch (e) {
      // Ignore
    }

    const reportCategory = category || 'content_safety_violation';
    const finalReason = reason || `[${categoryLabel || category}] ${details || ''}`.trim();

    // 1. Insert report record in database
    const result = await pool.query(
      'INSERT INTO message_reports (user_id, message_id, reason, category, details, contact_info, attachment_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, messageId || null, finalReason, reportCategory, details || '', contactInfo || '', attachmentName || '']
    );

    // 2. Resolve Admin Email from email_settings or site_settings
    let adminEmail = process.env.ADMIN_EMAIL || 'admin@perplexta.com';
    let emailSettingsRow: any = null;
    try {
      const emailSettingsRes = await pool.query('SELECT * FROM email_settings LIMIT 1');
      if (emailSettingsRes.rows.length > 0) {
        emailSettingsRow = emailSettingsRes.rows[0];
        if (emailSettingsRow.sender_email) {
          adminEmail = emailSettingsRow.sender_email;
        }
      }
      
      const siteSettings = await getSystemSettings();
      if (siteSettings?.contact_email || siteSettings?.support_email || siteSettings?.admin_email) {
        adminEmail = siteSettings.contact_email || siteSettings.support_email || siteSettings.admin_email || adminEmail;
      }
    } catch (e) {
      // Ignore settings fetch fallback
    }

    // 3. Send Email Notification to Admin
    let emailSent = false;
    try {
      const { sendEmail } = await import('../services/email.js');
      const emailSubject = `🚨 [بلاغ عاجل - أمان المحتوى] إشعار بمخالفة سياسات السلامة من ${userName}`;

      const catTitle = categoryLabel || category || 'مخالفة سياسات الأمان والسلامة';
      const emailHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; max-width: 650px; margin: 0 auto; border: 1px solid #e11d48;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #f43f5e; margin: 0; font-size: 20px;">
              🚨 بلاغ عاجل: انتهاك سياسات أمان المحتوى
            </h2>
            <span style="background: rgba(244, 63, 94, 0.2); color: #f43f5e; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; border: 1px solid rgba(244, 63, 94, 0.4);">
              مطلوب مراجعة فورية
            </span>
          </div>

          <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin-bottom: 16px; border-right: 4px solid #f43f5e;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>تصنيف المخالفة المحدد:</strong></p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #fb7185;">⚠️ ${escapeHtml(catTitle)}</p>
          </div>

          <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>بيانات مُقّدم البلاغ:</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 15px; color: #ffffff;">👤 <strong>الاسم:</strong> ${escapeHtml(userName)} (معرف: ${escapeHtml(userId)})</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #38bdf8;">✉️ <strong>البريد المسجل:</strong> ${escapeHtml(userEmail)}</p>
            ${contactInfo ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #a7f3d0;">📞 <strong>بيانات لمعاودة الاتصال:</strong> ${escapeHtml(contactInfo)}</p>` : ''}
            ${attachmentName ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #fde047;">📎 <strong>الملف المُرفق:</strong> ${escapeHtml(attachmentName)}</p>` : ''}
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">🕒 <strong>توقيت البلاغ:</strong> ${new Date().toLocaleString('ar-SA')}</p>
          </div>

          ${details ? `
            <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #fb7185; font-weight: bold;">📝 ملاحظات وتفاصيل البلاغ الواردة من المستخدم:</p>
              <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;">"${escapeHtml(details)}"</p>
            </div>
          ` : ''}

          ${userPrompt ? `
            <div style="background: #1e293b; padding: 14px; border-radius: 10px; margin-bottom: 12px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;"><strong>سؤال المستخدم الأصلي:</strong></p>
              <p style="margin: 0; font-size: 13px; color: #e2e8f0;">${escapeHtml(userPrompt.slice(0, 300))}</p>
            </div>
          ` : ''}

          ${assistantResponse ? `
            <div style="background: #1e293b; padding: 14px; border-radius: 10px; margin-bottom: 16px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #f43f5e;"><strong>معاينة الرد المُبلغ عنه من المساعد الذكي:</strong></p>
              <div style="margin: 0; font-size: 13px; color: #cbd5e1; max-height: 200px; overflow-y: auto; white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(assistantResponse.slice(0, 800))}</div>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #334155; padding-top: 14px; text-align: center; font-size: 12px; color: #64748b;">
            تم إرسال هذا الإشعار تلقائياً من نظام حماية الأمان والسلامة في منصة Perplexta.
          </div>
        </div>
      `;

      if (emailSettingsRow?.smtp_host) {
        const sendResult = await sendEmail(adminEmail, emailSubject, emailHtml, null, emailSettingsRow);
        emailSent = !!sendResult.success;
      }
    } catch (err: any) {
      console.warn('[Email] Content safety report email alert failed:', err.message);
    }

    await logSystemActivity(userId, 'Content Safety Report Submitted', 'security', {
      messageId,
      category: reportCategory,
      details,
      emailSent
    });

    res.status(201).json({
      success: true,
      report: result.rows[0],
      emailSent,
      message: 'Report logged and admin notified successfully'
    });
  } catch (error: any) {
    console.error('[Reports] Error submitting report:', error);
    res.status(500).json({ error: error.message || 'Failed to report message' });
  }
});

router.get("/admin/settings", authenticateAdmin, async (req, res) => {
  try {
    const settings = await getSystemSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Settings Error:', error); res.status(500).json({ error: 'Internal Error', msg: error.message });
  }
});

router.post("/admin/settings", authenticateAdmin, async (req, res) => {
  try {
    const result = await updateSystemSettings(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[SystemSettings] Failed to update system settings:', error);
    res.status(500).json({ error: error.message || 'Internal Error' });
  }
});

router.post("/client-error", (req, res) => {
  try {
    const { boundary, message, stack, componentStack, url, ts } = req.body || {};
    const logMessage = `[ClientError] [${boundary || 'Unknown'}] ${message || 'No message'}\n  URL: ${url || '-'}\n  Time: ${ts || new Date().toISOString()}\n  Stack: ${stack || 'None'}\n  Component: ${componentStack || 'None'}\n`;
    console.error(logMessage);
    import('fs').then(fs => {
      fs.appendFileSync('/tmp/client_error_detailed.log', logMessage + '\n---\n');
    }).catch(() => {});
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

router.post("/launch-telemetry", (req, res) => {
  try {
    const { mode, timing, userAgent, ts } = req.body || {};
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    console.log(
      `[PWA Launch] [${mode || 'unknown'}]`,
      `\n  IP: ${ip}`,
      `\n  Time: ${ts || new Date().toISOString()}`,
      `\n  UA: ${userAgent || '-'}`,
      timing ? `\n  Timing: ${JSON.stringify(timing, null, 2)}` : ''
    );
    
    // In a real scenario, we could save this to the 'logs' table
    logSystemActivity(
      null,
      'PWA_LAUNCH',
      `PWA Launch detected in ${mode} mode`,
      { timing, userAgent },
      req
    ).catch((e: any) => console.error('[Telemetry] Failed to save to DB:', e));
    
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

import { validatePwa } from '../../scripts/validate-pwa.js';
import { 
  validateLocationData, 
  cacheLocation, 
  findCachedLocations, 
  getAllCachedLocations, 
  getLocationCacheStats 
} from '../services/locationCache.js';

/**
 * POST /api/system/location-sync
 * Validates selected location data from the client and caches it locally to eliminate redundant Google Places API calls.
 */
router.post("/location-sync", async (req, res) => {
  try {
    const validation = validateLocationData(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid location data payload',
        error_ar: validation.error_ar || 'بيانات الموقع غير صالحة'
      });
    }

    const cached = await cacheLocation(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Location data successfully validated and cached locally',
      message_ar: 'تم التحقق من بيانات الموقع وتخزينها محلياً بنجاح',
      location: cached
    });
  } catch (error: any) {
    console.error('[LocationSync] Error syncing location:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during location sync',
      error_ar: 'حدث خطأ في الخادم أثناء مزامنة الموقع'
    });
  }
});

/**
 * GET /api/system/location-sync
 * Retrieve cached locations by query or fetch popular cached items
 */
router.get("/location-sync", async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const countryCode = typeof req.query.country_code === 'string' ? req.query.country_code.trim() : undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    if (q) {
      const results = await findCachedLocations(q, countryCode, limit);
      return res.json({
        success: true,
        count: results.length,
        query: q,
        results
      });
    }

    const all = await getAllCachedLocations(limit);
    return res.json({
      success: true,
      count: all.length,
      results: all
    });
  } catch (error: any) {
    console.error('[LocationSync] Error fetching cached locations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cached locations'
    });
  }
});

/**
 * GET /api/system/location-sync/stats
 * Telemetry and hit count stats for cached locations
 */
router.get("/location-sync/stats", (req, res) => {
  try {
    const stats = getLocationCacheStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/validate-manifest", (req, res) => {
  try {
    const { isValid, results, manifest } = validatePwa();
    res.json({
      success: isValid,
      valid: isValid,
      checks: results,
      manifest
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/system/health
 * System health status across pools and operational flags
 */
router.get("/health", (req, res) => {
  const pools = {
    core: getPoolMetrics(pool, 'core'),
    ledger: getPoolMetrics(ledgerPool, 'ledger'),
    external: getPoolMetrics(externalPool, 'external'),
    security: getPoolMetrics(securityPool, 'security'),
    media: getPoolMetrics(mediaPool, 'media')
  };
  const isHealthy = isDatabaseConnected();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    databaseConnected: isHealthy,
    pools
  });
});

/**
 * GET /api/system/status
 * Platform operational telemetry and server status
 */
router.get("/status", async (req, res) => {
  try {
    const isDbOnline = isDatabaseConnected();
    const pools = {
      core: getPoolMetrics(pool, 'core'),
      ledger: getPoolMetrics(ledgerPool, 'ledger'),
      external: getPoolMetrics(externalPool, 'external'),
      security: getPoolMetrics(securityPool, 'security'),
      media: getPoolMetrics(mediaPool, 'media')
    };
    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: isDbOnline,
        pools
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/**
 * GET /api/system/db/status
 * Multi-cluster database status and health metrics
 */
router.get("/db/status", async (req, res) => {
  try {
    const health = await checkAllDatabasesHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to check database health status',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
