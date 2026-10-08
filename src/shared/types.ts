export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended';
  language: string;
  theme: 'light' | 'dark';
  avatar: string | null;
  cover_image?: string | null;
  bio?: string;
  occupation?: string;
  location?: string;
  website_url?: string;
  custom_domain?: string;
  is_domain_verified?: boolean;
  social_links?: Record<string, string>;
  verified_links?: string[];
  referral_code: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'moderator';
  balance?: number;
  points?: number;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin' | 'moderator';
  balance?: number;
  points?: number;
}

export interface Chat {
  id: number;
  user_id: number | null;
  title: string;
  tool_id: string;
  context_summary?: string | null;
  is_pinned: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CreateChatInput {
  title?: string;
  tool_id?: string;
  context_summary?: string | null;
  is_pinned?: boolean;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_id?: string | null;
  model?: string | null;
  tokens_used: number;
  feedback?: number;
  is_pinned?: boolean;
  created_at: string | Date;
}

export interface CreateMessageInput {
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_id?: string | null;
  model?: string | null;
  tokens_used?: number;
  is_pinned?: boolean;
}

export interface BulletinAd {
  id: number;
  user_id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  price_paid: number;
  duration_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'archived' | 'trash' | string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  clicks_count: number;
  impressions_count: number;
  whatsapp_number?: string | null;
  target_url?: string | null;
  location_city?: string | null;
  hashtags?: string[];
  ad_format?: 'post' | 'reel' | 'story' | string;
  created_at?: string | Date;
}

export interface CreateAdInput {
  title: string;
  description: string;
  image_url: string;
  category?: string;
  duration_days?: number;
  price_paid?: number;
  whatsapp_number?: string | null;
  target_url?: string | null;
  location_city?: string | null;
  hashtags?: string[];
  ad_format?: 'post' | 'reel' | 'story';
  audience?: 'public' | 'friends' | 'only_me';
  is_ai_generated?: boolean;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number | string;
  usd_balance: number | string;
  points: number;
  referral_activated: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface LedgerTransaction {
  id: number;
  wallet_id: number | null;
  user_id: number | null;
  amount: number | string;
  points: number;
  transaction_type: string;
  status: string;
  reference_id: string | null;
  description: string | null;
  created_at: string | Date;
}

export interface CreateLedgerTransactionInput {
  wallet_id?: number | null;
  user_id?: number | null;
  amount: number;
  points?: number;
  transaction_type: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_id?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}
