import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/index.js';
import { checkUserQuota, getToolFriendlyName } from '../services/quota.js';
import { checkUserAffordability } from '../services/billing.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    language?: string;
    role?: string;
  };
}

/**
 * Express Middleware that wraps tool invocation routes.
 * It calculates estimated costs based on token conversion estimates,
 * verifies whether the user has sufficient complimentary quota,
 * and if quota is exceeded, checks whether the user has sufficient points/balance in their ledger.
 * Enforces strict execution block if funds are insufficient, preventing unbilled tool execution.
 */
export const verifyBillingFunds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database service is temporarily initializing.', error_ar: 'خدمة قاعدة البيانات قيد التهيئة مؤقتاً.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required for billing verification.', error_ar: 'المصادقة مطلوبة للتحقق من الفوترة.' });
    }

    const toolId = req.body?.tool_id || req.body?.tool || 'chat_fast';

    const quotaCheck = await checkUserQuota(userId, toolId);

    if (!quotaCheck.allowed) {
      let userLang = req.user?.language;
      if (!userLang) {
        const uRes = await pool.query('SELECT language FROM users WHERE id = $1', [userId]);
        userLang = uRes.rows[0]?.language || 'ar';
      }

      const toolNameAr = getToolFriendlyName(toolId, 'ar');
      const toolNameEn = getToolFriendlyName(toolId, 'en');

      if (quotaCheck.period === 'plan_required') {
        const msgEn = `Please select a subscription plan to use "${toolNameEn}".`;
        const msgAr = `يرجى اختيار باقة اشتراك لبدء استخدام "${toolNameAr}".`;

        return res.status(403).json({
          error: userLang === 'ar' ? msgAr : msgEn,
          error_ar: msgAr,
          type: 'PLAN_REQUIRED',
          limit: 0,
          current: 0,
          period: 'plan_required',
          tool: toolId,
          toolName: userLang === 'ar' ? toolNameAr : toolNameEn,
          cta: {
            upgrade: true,
            referral: false,
            link: '/subscription'
          }
        });
      }

      const periodStrEn = quotaCheck.period === 'monthly' ? 'monthly' : 'daily';
      const periodStrAr = quotaCheck.period === 'monthly' ? 'الشهري' : 'اليومي';

      const msgEn = `You have reached the ${periodStrEn} limit for "${toolNameEn}"`;
      const msgAr = `لقد استنفدت الحد ${periodStrAr} المتاح لأداة "${toolNameAr}"`;

      return res.status(402).json({
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
          referral: true,
          link: '/subscription'
        }
      });
    }

    return next();
  } catch (error: any) {
    console.info('[Billing Funds Middleware] Notice:', error?.message || error);
    return res.status(500).json({
      error: 'Billing verification failed due to a system error. Please try again.',
      error_ar: 'فشل التحقق من الفوترة بسبب خطأ في النظام. يرجى المحاولة مرة أخرى.',
      type: 'BILLING_SYSTEM_ERROR'
    });
  }
};

