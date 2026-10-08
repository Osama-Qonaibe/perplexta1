import { z } from 'zod';

export const createAdSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().min(2).max(10000),
  image_url: z.string().min(1),
  category: z.string().min(1).max(100).default('general'),
  duration_days: z.number().int().min(1).max(365).default(30),
  price_paid: z.number().min(0).default(0),
  whatsapp_number: z.string().max(50).nullable().optional(),
  target_url: z.string().max(500).nullable().optional(),
  location_city: z.string().max(100).nullable().optional(),
  hashtags: z.array(z.string()).default([]),
  ad_format: z.enum(['post', 'reel', 'story']).default('post'),
  audience: z.enum(['public', 'friends', 'only_me']).default('public'),
  is_ai_generated: z.boolean().default(false)
});

export const updateAdSchema = createAdSchema.partial();

export const boostAdSchema = z.object({
  ad_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  duration_days: z.number().int().min(1).max(90).default(7),
  boost_tier: z.enum(['standard', 'pro', 'vip']).default('standard'),
  boost_price: z.number().min(0).default(0)
});

export const adCommentSchema = z.object({
  ad_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
  content: z.string().min(1).max(2000),
  parent_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).nullable().optional()
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type BoostAdInput = z.infer<typeof boostAdSchema>;
export type AdCommentInput = z.infer<typeof adCommentSchema>;
