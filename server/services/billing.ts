import { getUserWallet, getEconomySettings } from './wallet.js';
import { getToolCreditCost } from './creditPricing.js';

export async function checkUserAffordability(userId: string | number, toolId: string, estimatedInputTokens = 0) {
  const userIdNum = typeof userId === 'number' ? userId : parseInt(userId, 10);
  const wallet = await getUserWallet(userIdNum);
  const settings = await getEconomySettings();
  const pointsPerDollar = parseFloat(settings.points_per_dollar || '1000');
  const requiredPoints = await getToolCreditCost(toolId);
  const availablePoints = Number(wallet.points || 0);
  const availableBalanceUSD = Number(wallet.balance || 0);

  return {
    allowed: availablePoints + (availableBalanceUSD * pointsPerDollar) >= requiredPoints,
    requiredPoints,
    availablePoints,
    availableBalanceUSD,
    pointsPerDollar,
  };
}

export async function executeWithBillingMiddleware(
  userId: string | number,
  toolId: string,
  initialPrompt: string,
  quotaCheck: { allowed: boolean; period?: string; limit?: number; currentUsage?: number },
  executeBlock: (
    updateCostProgress: (chunkText: string) => void,
    onSuccess: (generatedText: string) => Promise<void>,
    walletCharged: any
  ) => Promise<any>
) {
  const updateCostProgress = (_chunkText: string) => {};

  let finalGeneratedText = '';
  const result = await executeBlock(
    updateCostProgress,
    async (text) => { finalGeneratedText = text; },
    false
  );
  return result;
}
