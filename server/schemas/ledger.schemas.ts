import { z } from 'zod';

export const createLedgerTransactionSchema = z.object({
  wallet_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).nullable().optional(),
  user_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).nullable().optional(),
  amount: z.number(),
  points: z.number().int().default(0),
  transaction_type: z.string().min(1).max(50),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('completed'),
  reference_id: z.string().max(255).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.any()).default({})
});

export const depositRequestSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1).max(50),
  reference_id: z.string().max(255).nullable().optional(),
  proof_url: z.string().max(500).nullable().optional()
});

export const withdrawalRequestSchema = z.object({
  amount_cents: z.number().int().positive(),
  method: z.string().min(1).max(50),
  details: z.string().min(1).max(1000)
});

export const couponApplySchema = z.object({
  code: z.string().trim().min(1).max(50)
});

export type CreateLedgerTransactionInput = z.infer<typeof createLedgerTransactionSchema>;
export type DepositRequestInput = z.infer<typeof depositRequestSchema>;
export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type CouponApplyInput = z.infer<typeof couponApplySchema>;
