import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { logSecurityAlert } from '../services/notifications.js';
import { getToolFriendlyName } from '../services/quota.js';

const limitMultiplier = 500;

const resolveClientKey = (req: any): string => {
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.id) {
          return `user_${decoded.id}`;
        }
      } catch (e) {}
      return `auth_${token.slice(-32)}`;
    }
  }
  if (req.cookies && req.cookies.token) {
    try {
      const decoded: any = jwt.decode(req.cookies.token);
      if (decoded && decoded.id) {
        return `user_${decoded.id}`;
      }
    } catch (e) {}
    return `cookie_${req.cookies.token.slice(-32)}`;
  }
  return ipKeyGenerator(req.ip || 'anonymous');
};

const createRateLimitHandler = (type: string) => {
  return (req: any, res: any, next: any, options: any) => {
    logSecurityAlert(
      req.user?.id || null,
      'rate_limit_blocked',
      'medium',
      `Rate limit exceeded: ${type}`,
      {
        path: req.path,
        method: req.method,
        limit: options.max,
        windowMs: options.windowMs,
        limitType: type
      },
      req
    ).catch(err => console.error('[RateLimit Log] Failed to record block:', err));

    res.status(options.statusCode).json(
      typeof options.message === 'object' 
        ? options.message 
        : { error: options.message || 'Rate limit exceeded' }
    );
  };
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  handler: createRateLimitHandler('global')
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security: Too many auth attempts. Please try again later.' },
  handler: createRateLimitHandler('auth')
});

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 100 * limitMultiplier,                    // 100 refreshes per minute per user
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many token refresh attempts. Please wait a moment.' },
  handler: createRateLimitHandler('refresh')
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please wait a moment.' },
  handler: createRateLimitHandler('chat_fast')
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in an hour.' },
  handler: createRateLimitHandler('forgot_password')
});

export const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security alert: Too many token verification requests. Slow down.' },
  handler: createRateLimitHandler('token')
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security: Too many admin requests. Action throttled.' },
  handler: createRateLimitHandler('admin')
});

export const broadcastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many broadcast attempts. Admin communications are limited.' },
  handler: createRateLimitHandler('broadcast')
});

import { pool } from '../db/index.js';
import { checkUserQuota } from '../services/quota.js';
import { checkUserAffordability } from '../services/billing.js';


export const verifyConsumptionLimits = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const toolId = req.body?.tool_id || req.body?.tool || 'chat_fast';

    const quotaCheck = await checkUserQuota(userId, toolId);

    if (!quotaCheck.allowed) {
      if (!pool) {
        return res.status(503).json({ error: 'Database service is temporarily initializing.' });
      }

      const affordability = await checkUserAffordability(userId, toolId);

      if (!affordability.allowed) {
        const uRes = await pool.query('SELECT language FROM users WHERE id = $1', [userId]);
        const userLang = uRes.rows[0]?.language || 'ar';

        const periodStrEn = quotaCheck.period === 'monthly' ? 'monthly' : 'daily';
        const periodStrAr = quotaCheck.period === 'monthly' ? 'الشهري' : 'اليومي';
        const toolNameAr = getToolFriendlyName(toolId, 'ar');
        const toolNameEn = getToolFriendlyName(toolId, 'en');

        const msgEn = `You have reached the ${periodStrEn} limit for "${toolNameEn}"`;
        const msgAr = `لقد استنفدت الحد ${periodStrAr} المتاح لأداة "${toolNameAr}"`;

        return res.status(429).json({
          error: userLang === 'ar' ? msgAr : msgEn,
          error_ar: msgAr,
          type: 'QUOTA_EXCEEDED',
          limit: quotaCheck.limit,
          current: quotaCheck.currentUsage,
          period: quotaCheck.period,
          tool: toolId,
          toolName: userLang === 'ar' ? toolNameAr : toolNameEn,
          cta: {
            upgrade: true,
            referral: true
          }
        });
      }
    }

    return next();
  } catch (error) {
    console.info('[Consumption Limiter Middleware] Quota check notice:', (error as any)?.message || error);
    return next(); // Safe degraded bypass
  }
};

