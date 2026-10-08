import { z } from 'zod';

export const createChatSchema = z.object({
  title: z.string().min(1).max(255).default('New Conversation'),
  tool_id: z.string().min(1).max(100).default('general'),
  context_summary: z.string().max(2000).nullable().optional(),
  is_pinned: z.boolean().default(false)
});

export const updateChatSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  context_summary: z.string().max(2000).nullable().optional(),
  is_pinned: z.boolean().optional()
});

export const shareChatSchema = z.object({
  chat_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  is_public: z.boolean().default(true)
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type ShareChatInput = z.infer<typeof shareChatSchema>;
