import { pool } from '../db/index.js';
import { createNotification } from './notifications.js';
import { io } from '../config/socket.js';
import { getCachedSystemSettings } from '../db/queries.js';
import { getToolCreditCost } from './creditPricing.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuotaResult = {
  allowed: boolean;
  limit?: number;
  currentUsage?: number;
  period?: 'daily' | 'monthly' | 'plan_required';
  currentDaily?: number;
  currentMonthly?: number;
};

type ToolLimit = 'unlimited' | number | { daily?: number | 'unlimited' | ''; monthly?: number | 'unlimited' | '' };

// ─── Shared SQL ───────────────────────────────────────────────────────────────

const USAGE_QUERY = `
  WITH active_sub AS (
    SELECT s.plan_id, s.cycle_credits, s.used_credits
    FROM subscriptions s
    WHERE s.user_id = $1 
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > CURRENT_TIMESTAMP)
    ORDER BY s.current_period_end DESC NULLS LAST
    LIMIT 1
  ),
  default_free_plan AS (
    SELECT id, limits, name_en, monthly_credits
    FROM plans
    WHERE is_active = true AND monthly_price = 0
    ORDER BY id ASC
    LIMIT 1
  ),
  user_info AS (
    SELECT 
      u.role,
      COALESCE(sub_plan.limits, dfp.limits) AS limits,
      COALESCE(sub_plan.name_en, dfp.name_en, 'Free Plan') AS plan_name,
      COALESCE(sub.cycle_credits, dfp.monthly_credits, 0) AS cycle_credits,
      COALESCE(sub.used_credits, 0) AS used_credits,
      CASE WHEN sub.plan_id IS NOT NULL OR dfp.id IS NOT NULL THEN true ELSE false END AS has_active_sub
    FROM users u
    LEFT JOIN active_sub sub ON true
    LEFT JOIN plans sub_plan ON sub.plan_id = sub_plan.id AND sub_plan.is_active = true
    LEFT JOIN default_free_plan dfp ON true
    WHERE u.id = $1
  )
  SELECT
    ui.limits,
    ui.role,
    ui.plan_name,
    ui.has_active_sub,
    COALESCE(ui.cycle_credits, 0) AS cycle_credits,
    COALESCE(ui.used_credits, 0) AS used_credits,
    COALESCE((SELECT usage_count FROM user_usage WHERE user_id = $1 AND tool_id = $2 AND usage_date = CURRENT_DATE), 0) AS daily_count,
    COALESCE((SELECT SUM(usage_count) FROM user_usage WHERE user_id = $1 AND tool_id = $2 AND usage_date >= date_trunc('month', CURRENT_DATE)), 0) AS monthly_count
  FROM user_info ui
`;

// ─── Tool Aliases Mapping ─────────────────────────────────────────────────────

const TOOL_ALIASES: Record<string, string[]> = {
  chat: ['chat_fast', 'chat'],
  chat_fast: ['chat_fast', 'chat'],
  chat_pro: ['chat_pro'],
  chat_reasoning: ['chat_reasoning'],
  search: ['sovereign_search', 'search'],
  sovereign_search: ['sovereign_search', 'search'],
  deep_research: ['deep_research', 'sovereign_search', 'search'],
  perplexta_music: ['perplexta_music', 'audio_studio', 'music'],
  audio_studio: ['audio_studio', 'canvas', 'perplexta_music', 'tts'],
  perplexta_analysis: ['perplexta_analysis', 'analysis'],
  image: ['image'],
  video: ['video'],
  code: ['code'],
  stt: ['stt'],
  tts: ['tts'],
  ads_copilot: ['ads_copilot'],
  canvas: ['canvas', 'audio_studio'],
  vision: ['vision', 'image'],
  scene_architect: ['scene_architect', 'video', 'image'],
  x402_api: ['x402_api']
};

function getEffectiveToolLimit(limits: Record<string, any>, toolId: string): ToolLimit | undefined {
  if (!limits || typeof limits !== 'object') return undefined;
  
  if (limits[toolId] !== undefined) return limits[toolId];

  const aliases = TOOL_ALIASES[toolId] || [];
  for (const alias of aliases) {
    if (limits[alias] !== undefined) {
      return limits[alias];
    }
  }

  return undefined;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function parseLimits(raw: any): Record<string, ToolLimit> {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[Quota] Corrupted limits JSON in plans table — defaulting to {}');
    return {};
  }
}

function parseLimitVal(val: any): number | 'unlimited' | null {
  if (val === undefined || val === null || val === '') return null;
  if (val === 'unlimited') return 'unlimited';
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function evaluateLimit(current: number, limitVal: any): false | { limit: number; currentUsage: number } {
  const parsed = parseLimitVal(limitVal);
  if (parsed === null || parsed === 'unlimited') return false;
  return current >= parsed ? { limit: parsed, currentUsage: current } : false;
}

function buildDenied(limit: number, currentUsage: number, period: 'daily' | 'monthly'): QuotaResult {
  return { allowed: false, limit, currentUsage, period };
}

function checkLimits(toolLimit: ToolLimit | undefined, currentDaily: number, currentMonthly: number): QuotaResult {
  if (toolLimit === undefined || toolLimit === null || toolLimit === 0 || String(toolLimit) === '0') {
    return buildDenied(0, currentDaily, 'daily');
  }
  if (toolLimit === 'unlimited') {
    return { allowed: true, currentDaily, currentMonthly };
  }

  let dailyVal: any = null;
  let monthlyVal: any = null;

  if (typeof toolLimit === 'number') {
    dailyVal = toolLimit;
  } else if (typeof toolLimit === 'string') {
    if (toolLimit === 'unlimited') return { allowed: true, currentDaily, currentMonthly };
    const n = parseInt(toolLimit, 10);
    dailyVal = isNaN(n) ? 0 : n;
  } else if (typeof toolLimit === 'object') {
    dailyVal = toolLimit.daily;
    monthlyVal = toolLimit.monthly;
  }

  // Daily evaluation
  if (dailyVal !== null && dailyVal !== undefined && dailyVal !== '' && dailyVal !== 'unlimited') {
    const dLimit = parseInt(dailyVal, 10);
    if (!isNaN(dLimit)) {
      if (dLimit === 0) return buildDenied(0, currentDaily, 'daily');
      if (currentDaily >= dLimit) return buildDenied(dLimit, currentDaily, 'daily');
    }
  }

  // Monthly evaluation
  if (monthlyVal !== null && monthlyVal !== undefined && monthlyVal !== '' && monthlyVal !== 'unlimited') {
    const mLimit = parseInt(monthlyVal, 10);
    if (!isNaN(mLimit)) {
      if (mLimit === 0) return buildDenied(0, currentMonthly, 'monthly');
      if (currentMonthly >= mLimit) return buildDenied(mLimit, currentMonthly, 'monthly');
    }
  }

  return { allowed: true, currentDaily, currentMonthly };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkUserQuota(userId: number, toolId: string): Promise<QuotaResult> {
  try {
    if (!pool) return { allowed: false, limit: 0, currentUsage: 1, period: 'daily' };

    const { rows } = await pool.query(USAGE_QUERY, [userId, toolId]);
    if (!rows.length) return { allowed: true };

    const { limits, role, has_active_sub, daily_count, monthly_count, cycle_credits, used_credits } = rows[0];
    if (role === 'admin') return { allowed: true };

    if (!has_active_sub || !limits) {
      return { allowed: false, limit: 0, currentUsage: 0, period: 'plan_required' };
    }

    const finalLimits = parseLimits(limits);
    const effectiveLimit = getEffectiveToolLimit(finalLimits, toolId);

    // 1. Tool-level check (locked tool or daily safety cap)
    const toolDecision = checkLimits(effectiveLimit, parseInt(daily_count), parseInt(monthly_count));
    if (!toolDecision.allowed) {
      return toolDecision;
    }

    // 2. Plan Credit Counter check
    const cycleCredits = parseInt(cycle_credits || 0, 10);
    const usedCredits = parseInt(used_credits || 0, 10);
    const toolCost = await getToolCreditCost(toolId);

    if (cycleCredits > 0) {
      const remainingCredits = Math.max(0, cycleCredits - usedCredits);
      if (remainingCredits < toolCost) {
        return { allowed: false, limit: cycleCredits, currentUsage: usedCredits, period: 'monthly' };
      }
    }

    return toolDecision;

  } catch (err) {
    console.error('[Quota] checkUserQuota failed:', err);
    return { allowed: false, limit: 0, currentUsage: 1, period: 'daily' };
  }
}

export async function checkAndIncrementQuota(userId: number, toolId: string): Promise<QuotaResult> {
  if (!pool) return { allowed: false, limit: 0, currentUsage: 1, period: 'daily' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure row exists then acquire row-level lock
    await client.query(
      `INSERT INTO user_usage (user_id, tool_id, usage_count, usage_date) VALUES ($1,$2,0,CURRENT_DATE) ON CONFLICT DO NOTHING`,
      [userId, toolId]
    );
    await client.query(
      `SELECT usage_count FROM user_usage WHERE user_id=$1 AND tool_id=$2 AND usage_date=CURRENT_DATE FOR UPDATE`,
      [userId, toolId]
    );

    const { rows } = await client.query(USAGE_QUERY, [userId, toolId]);
    if (!rows.length) { await client.query('COMMIT'); return { allowed: true }; }

    const { limits, role, has_active_sub, daily_count, monthly_count, cycle_credits, used_credits } = rows[0];
    if (role === 'admin') {
      await client.query(
        `UPDATE user_usage SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id=$1 AND tool_id=$2 AND usage_date=CURRENT_DATE`,
        [userId, toolId]
      );
      await client.query('COMMIT');
      return { allowed: true };
    }

    if (!has_active_sub || !limits) {
      await client.query('ROLLBACK');
      return { allowed: false, limit: 0, currentUsage: 0, period: 'plan_required' };
    }

    const currentDaily   = parseInt(daily_count);
    const currentMonthly = parseInt(monthly_count);
    const finalLimits    = parseLimits(limits);
    const effectiveLimit = getEffectiveToolLimit(finalLimits, toolId);
    const decision       = checkLimits(effectiveLimit, currentDaily, currentMonthly);

    if (!decision.allowed) { await client.query('ROLLBACK'); return decision; }

    const cycleCredits = parseInt(cycle_credits || 0, 10);
    const usedCredits = parseInt(used_credits || 0, 10);
    const toolCost = await getToolCreditCost(toolId);

    if (cycleCredits > 0) {
      const remainingCredits = Math.max(0, cycleCredits - usedCredits);
      if (remainingCredits < toolCost) {
        await client.query('ROLLBACK');
        return { allowed: false, limit: cycleCredits, currentUsage: usedCredits, period: 'monthly' };
      }
    }

    await client.query(
      `UPDATE user_usage SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id=$1 AND tool_id=$2 AND usage_date=CURRENT_DATE`,
      [userId, toolId]
    );

    if (cycleCredits > 0 && toolCost > 0) {
      await client.query(
        `UPDATE subscriptions SET used_credits = used_credits + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND status = 'active'`,
        [toolCost, userId]
      );
    }

    await client.query('COMMIT');

    if (io) {
      const newRemaining = Math.max(0, cycleCredits - (usedCredits + toolCost));
      io.to(`user_${userId}`).emit('credit_usage_updated', {
        cycle_credits: cycleCredits,
        used_credits: usedCredits + toolCost,
        remaining_credits: newRemaining,
        tool_id: toolId,
        cost: toolCost
      });
      io.to(`user_${userId}`).emit('user_profile_updated');
    }

    checkAndTriggerQuotaWarnings(userId, toolId, currentDaily + 1, currentMonthly + 1, finalLimits)
      .catch(err => console.error('[Quota Warning Engine] Non-blocking warning flow failed:', err));

    return { allowed: true, currentDaily: currentDaily + 1, currentMonthly: currentMonthly + 1 };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Quota] checkAndIncrementQuota failed:', err);
    return { allowed: false, limit: 0, currentUsage: 1, period: 'daily' };
  } finally {
    client.release();
  }
}

export async function decrementUserUsage(userId: number, toolId: string): Promise<void> {
  try {
    const uid = Number(userId);
    if (!uid || isNaN(uid) || !pool) return;
    await pool.query(
      `UPDATE user_usage SET usage_count = GREATEST(0, usage_count - 1), updated_at = CURRENT_TIMESTAMP WHERE user_id=$1 AND tool_id=$2 AND usage_date=CURRENT_DATE`,
      [uid, toolId]
    );
    const toolCost = await getToolCreditCost(toolId);
    if (toolCost > 0) {
      await pool.query(
        `UPDATE subscriptions SET used_credits = GREATEST(0, used_credits - $1), updated_at = CURRENT_TIMESTAMP WHERE user_id=$2 AND status='active'`,
        [toolCost, uid]
      );
      if (io) {
        io.to(`user_${uid}`).emit('user_profile_updated');
      }
    }
  } catch (err) { console.error('[Quota] Decrement failed:', err); }
}

export async function incrementUserUsage(userId: number, toolId: string): Promise<void> {
  try {
    const uid = Number(userId);
    if (!uid || isNaN(uid) || !pool) return;
    await pool.query(
      `INSERT INTO user_usage (user_id, tool_id, usage_count, usage_date) VALUES ($1,$2,1,CURRENT_DATE)
       ON CONFLICT (user_id, tool_id, usage_date)
       DO UPDATE SET usage_count = user_usage.usage_count + 1, updated_at = CURRENT_TIMESTAMP`,
      [uid, toolId]
    );
  } catch (err) { console.error('[Quota] Increment failed:', err); }
}

// ─── Quota Warning Engine ─────────────────────────────────────────────────────

export const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  chat:               { en: 'Strategic Assistant',         ar: 'المساعد الاستراتيجي'    },
  chat_fast:          { en: 'Fast Technical AI',           ar: 'الذكاء التقني السريع'    },
  chat_pro:           { en: 'Reasoning Pro Engine',        ar: 'محرك الاستنتاج المتقدم'  },
  chat_reasoning:     { en: 'Advanced Reasoning Protocol', ar: 'بروتوكول التفكير المعقد' },
  perplexta_analysis: { en: 'Financial & Technical Analysis', ar: 'التحليل الفني والمالي' },
  image:              { en: 'Image Studio',                ar: 'استوديو الصور'          },
  video:              { en: 'Video Generator',             ar: 'توليد الفيديو'          },
  code:               { en: 'Code Engineering',            ar: 'هندسة الأكواد والبرمجيات' },
  ads_copilot:        { en: 'Ads Copilot',                 ar: 'مساعد الإعلانات الذكي'  },
  sovereign_search:   { en: 'Research & Studies',          ar: 'البحوث والدراسات'       },
  research_studies:   { en: 'Research & Studies',          ar: 'البحوث والدراسات'       },
  search:             { en: 'Sovereign Search',            ar: 'البحث السيادي'          },
  deep_research:      { en: 'Deep Research',               ar: 'البحث المتعمق'          },
  tts:                { en: 'Voice Synthesis Engine',      ar: 'محرك التوليد الصوتي'     },
  stt:                { en: 'Speech Transcription',        ar: 'التحويل الصوتي للنص'     },
  perplexta_music:    { en: 'Music & Songs',               ar: 'الموسيقى والأغاني'      },
  x402_api:           { en: 'API Credits',                 ar: 'رصيد الـ API'           },
};

export function getToolFriendlyName(toolId: string, lang: 'en' | 'ar'): string {
  return TOOL_NAMES[toolId]?.[lang] ?? toolId;
}

async function evaluateAndNotify(
  userId: number, toolId: string, usage: number, limit: number, period: 'daily' | 'monthly'
) {
  const pct = (usage / limit) * 100;
  
  let lowThreshold = 50;
  let highThreshold = 80;
  try {
    const sysSettings = await getCachedSystemSettings();
    if (sysSettings) {
      if (typeof sysSettings.quota_warning_threshold_low === 'number' && sysSettings.quota_warning_threshold_low > 0) {
        lowThreshold = sysSettings.quota_warning_threshold_low;
      }
      if (typeof sysSettings.quota_warning_threshold_high === 'number' && sysSettings.quota_warning_threshold_high > 0) {
        highThreshold = sysSettings.quota_warning_threshold_high;
      }
    }
  } catch (e) {
    // fallback to defaults
  }

  const threshold = pct >= 100 ? 100 : pct >= highThreshold ? highThreshold : pct >= lowThreshold ? lowThreshold : 0;
  if (!threshold) return;

  const warningType = `quota_warning_${toolId}_${period}_${threshold}`;
  const { rows } = await pool.query(
    `SELECT 1 FROM notifications WHERE user_id=$1 AND type=$2
     AND created_at >= CASE WHEN $3='daily' THEN CURRENT_DATE ELSE date_trunc('month',CURRENT_DATE) END LIMIT 1`,
    [userId, warningType, period]
  );
  if (rows.length) return;

  const nameEn = getToolFriendlyName(toolId, 'en');
  const nameAr = getToolFriendlyName(toolId, 'ar');
  const pEn    = period === 'daily' ? 'Daily'  : 'Monthly';
  const pAr    = period === 'daily' ? 'اليومي' : 'الشهري';
  const pctStr = `${Math.round(pct)}%`;

  const messages: Record<number, { tEn: string; tAr: string; mEn: string; mAr: string }> = {
    100: {
      tEn: '⛔ Quota Exhausted: Limit Reached',
      tAr: '⛔ استنفد الحد: وصلت إلى الحد الأقصى',
      mEn: `You have fully consumed your ${pEn} quota for "${nameEn}" (${usage}/${limit}). Please upgrade your plan tier to continue uninterrupted.`,
      mAr: `لقد استنفدت حدك ${pAr} الكامل لأداة "${nameAr}" (${usage}/${limit}). يرجى ترقية باقة اشتراكك للاستمرار دون انقطاع.`,
    },
    [highThreshold]: {
      tEn: `⚠️ Urgent Quota Limit Notice: ${pctStr} Expended`,
      tAr: `⚠️ تنبيه هام ومستعجل: تم استهلاك ${pctStr} من الحدود`,
      mEn: `Action Advised: You are rapidly approaching full capacity with ${pctStr} of your ${pEn} limit spent for "${nameEn}". Upgrade your plan tier to avoid interruptions.`,
      mAr: `إجراء موصى به: أنت تقترب من السعة الكاملة بنسبة ${pctStr} من حدك ${pAr} لأداة "${nameAr}". قم بترقية باقة اشتراكك لتجنب أي انقطاع في الخدمة.`,
    },
    [lowThreshold]: {
      tEn: `ℹ️ Quota Status Alert: ${pctStr} Consumed`,
      tAr: `ℹ️ تنبيه استهلاك الحدود: تم استخدام ${pctStr}`,
      mEn: `You have consumed ${pctStr} of your ${pEn} quota for "${nameEn}". Invite colleagues with your referral code or explore premium tiers to keep your workflow uninterrupted.`,
      mAr: `لقد استهلكت ${pctStr} من حدك ${pAr} لأداة "${nameAr}". شارك كود الإحالة أو تصفح باقاتنا المتقدمة للحفاظ على استمرارية عملك.`,
    },
  };

  const selectedMsg = messages[threshold] || messages[lowThreshold] || messages[100];
  const { tEn, tAr, mEn, mAr } = selectedMsg;
  await createNotification(userId, warningType, tEn, tAr, mEn, mAr, { tool_id: toolId, usage, limit, period, threshold, pct });

  io?.to(`user_${userId}`).emit('quota_warning', { toolId, usage, limit, period, threshold, pct: Math.round(pct) });
}

async function checkAndTriggerQuotaWarnings(
  userId: number, toolId: string, daily: number, monthly: number, limits: Record<string, ToolLimit>
) {
  try {
    if (!pool) return;
    const toolLimit = limits[toolId];
    if (!toolLimit || toolLimit === 'unlimited') return;

    const dailyVal   = typeof toolLimit === 'object' ? toolLimit.daily   : toolLimit;
    const monthlyVal = typeof toolLimit === 'object' ? toolLimit.monthly : null;

    const dl = parseLimitVal(dailyVal);
    if (typeof dl === 'number' && dl > 0) await evaluateAndNotify(userId, toolId, daily,   dl, 'daily');

    const ml = parseLimitVal(monthlyVal);
    if (typeof ml === 'number' && ml > 0) await evaluateAndNotify(userId, toolId, monthly, ml, 'monthly');

  } catch (err) { console.error('[Quota Warning Engine] Process failed:', err); }
}
