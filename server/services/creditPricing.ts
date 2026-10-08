import { pool } from '../db/index.js';

/**
 * Standard default credit costs per tool usage.
 * Directly grounded in actual compute and API costs.
 */
export const DEFAULT_TOOL_CREDITS: Record<string, number> = {
  chat_fast: 1,
  chat: 1,
  chat_pro: 3,
  chat_reasoning: 5,
  sovereign_search: 5,
  search: 5,
  deep_research: 15,
  perplexta_analysis: 5,
  analysis: 5,
  ads_copilot: 5,
  code: 3,
  canvas: 3,
  image: 25,
  vision: 10,
  scene_architect: 30,
  stt: 2,
  tts: 2,
  audio_studio: 5,
  perplexta_music: 10,
  video: 100,
  x402_api: 2
};

// In-memory cache for dynamic tool pricing from tool_orchestrator
let cachedToolPricing: Record<string, number> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Returns the credit cost for a specific tool.
 * Reads dynamic pricing from tool_orchestrator if available, otherwise falls back to defaults.
 */
export async function getToolCreditCost(toolId: string): Promise<number> {
  const normalizedTool = (toolId || 'chat_fast').toLowerCase().trim();
  const now = Date.now();

  if (cachedToolPricing && (now - lastCacheTime < CACHE_TTL_MS)) {
    if (cachedToolPricing[normalizedTool] !== undefined) {
      return cachedToolPricing[normalizedTool];
    }
  }

  if (pool) {
    try {
      const res = await pool.query('SELECT tool_id, pricing_rule FROM tool_orchestrator WHERE is_active = true');
      const pricingMap: Record<string, number> = {};

      for (const row of res.rows) {
        let cost = 0;
        if (row.pricing_rule) {
          const rule = typeof row.pricing_rule === 'string' ? JSON.parse(row.pricing_rule) : row.pricing_rule;
          if (rule.credit_cost !== undefined) cost = Number(rule.credit_cost);
          else if (rule.cost_points !== undefined) cost = Number(rule.cost_points);
        }
        if (cost > 0) {
          pricingMap[row.tool_id] = cost;
        }
      }

      cachedToolPricing = pricingMap;
      lastCacheTime = now;

      if (pricingMap[normalizedTool] !== undefined) {
        return pricingMap[normalizedTool];
      }
    } catch {
      // Fallback silently to defaults if database query fails
    }
  }

  return DEFAULT_TOOL_CREDITS[normalizedTool] ?? 1;
}

/**
 * Calculates credits precisely from USD price and points-per-dollar rate.
 */
export function calculateCreditsFromUSD(priceUSD: number, pointsPerDollar = 1000): number {
  const numericPrice = Number(priceUSD || 0);
  if (numericPrice <= 0) return 0;
  return Math.round(numericPrice * pointsPerDollar);
}
