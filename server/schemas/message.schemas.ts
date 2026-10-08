import { z } from 'zod';

export const createMessageSchema = z.object({
  chat_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  tool_id: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  tokens_used: z.number().int().min(0).default(0),
  is_pinned: z.boolean().default(false)
});

export const messageFeedbackSchema = z.object({
  feedback: z.number().int().min(-1).max(1),
  rating: z.number().int().min(1).max(5).optional(),
  reason: z.string().max(255).optional(),
  comment: z.string().max(2000).optional()
});

export const promptMessageSchema = z.object({
  message: z.string().min(1),
  chat_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  tool_id: z.string().max(100).default('general'),
  model: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(true)
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type MessageFeedbackInput = z.infer<typeof messageFeedbackSchema>;
export type PromptMessageInput = z.infer<typeof promptMessageSchema>;
