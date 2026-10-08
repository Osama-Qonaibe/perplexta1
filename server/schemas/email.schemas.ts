import { z } from 'zod';

export const emailConfigSchema = z.object({
  mailer_type: z.enum(['smtp', 'resend', 'sendgrid']).default('smtp'),
  smtp_host: z.string().default(''),
  smtp_port: z.union([z.string(), z.number()]).transform(val => String(val)).default('587'),
  smtp_encryption: z.enum(['tls', 'ssl', 'none']).default('tls'),
  smtp_username: z.string().default(''),
  smtp_password: z.string().default(''),
  sender_name: z.string().min(1).default('Perplexta'),
  sender_email: z.string().default('')
});

export const verifyEmailConfigSchema = z.object({
  mailer_type: z.enum(['smtp', 'resend', 'sendgrid']).default('smtp'),
  smtp_host: z.string().min(1),
  smtp_port: z.union([z.string(), z.number()]).transform(val => String(val)),
  smtp_encryption: z.enum(['tls', 'ssl', 'none']).default('tls'),
  smtp_username: z.string().default(''),
  smtp_password: z.string().default(''),
  sender_name: z.string().default('Perplexta'),
  sender_email: z.string().default('')
});

export const emailTemplateSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  subject_en: z.string().default(''),
  subject_ar: z.string().default(''),
  body_en: z.string().default(''),
  body_ar: z.string().default(''),
  type: z.string().default('custom')
});

export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type VerifyEmailConfigInput = z.infer<typeof verifyEmailConfigSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
