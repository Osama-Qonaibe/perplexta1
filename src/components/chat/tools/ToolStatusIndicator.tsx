import React from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Sparkles,
  Brain,
  Code,
  Video,
  ImageIcon,
  BookOpen,
  Search,
  Database,
  Scale,
  Megaphone,
  Music,
  Volume2,
  Mic,
  MessageSquare
} from 'lucide-react';

export const getToolDetails = (toolId: string | undefined, dir: 'ltr' | 'rtl', t: any) => {
  const normId = toolId || 'chat_fast';

  if (normId.startsWith('chat_fast')) {
    return {
      label: dir === 'rtl' ? 'المحادثة السريعة' : 'Fast Chat',
      icon: Zap,
      colorClass: 'text-[var(--fg-accent)]',
      bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
    };
  }
  if (normId.startsWith('chat_pro')) {
    return {
      label: dir === 'rtl' ? 'المحادثة المتقدمة' : 'Professional Chat',
      icon: Sparkles,
      colorClass: 'text-[var(--fg-accent)]',
      bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
    };
  }
  if (normId.startsWith('chat_reasoning')) {
    return {
      label: dir === 'rtl' ? 'نمط التفكير العميق' : 'Deep Reasoning',
      icon: Brain,
      colorClass: 'text-[var(--fg-accent)]',
      bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
    };
  }

  switch (normId) {
    case 'code':
      return {
        label: dir === 'rtl' ? 'برمجة' : 'Code',
        icon: Code,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'video':
      return {
        label: dir === 'rtl' ? 'فيديو' : 'Video',
        icon: Video,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'image':
      return {
        label: dir === 'rtl' ? 'صور' : 'Image',
        icon: ImageIcon,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'perplexta_analysis':
      return {
        label: dir === 'rtl' ? 'تحليل' : 'Analysis',
        icon: Search,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'sovereign_search':
    case 'research_studies':
      return {
        label: dir === 'rtl' ? 'البحوث والدراسات' : 'Research & Studies',
        icon: BookOpen,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'ads_copilot':
      return {
        label: dir === 'rtl' ? 'مساعد الإعلانات' : 'Ads Copilot',
        icon: Megaphone,
        colorClass: 'text-[var(--status-warning)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'audio_studio':
    case 'canvas':
    case 'perplexta_music':
      return {
        label: dir === 'rtl' ? 'استوديو الصوت' : 'Audio Studio',
        icon: Music,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'tts':
      return {
        label: dir === 'rtl' ? 'صوتيات' : 'Text to Speech',
        icon: Volume2,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    case 'stt':
      return {
        label: dir === 'rtl' ? 'مسجل صوتی' : 'Speech to Text',
        icon: Mic,
        colorClass: 'text-[var(--status-warning)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
    default:
      return {
        label: dir === 'rtl' ? 'محادثة' : 'Chat',
        icon: MessageSquare,
        colorClass: 'text-[var(--fg-accent)]',
        bgClass: 'bg-[var(--surface-subtle)] border-[var(--border-default)]'
      };
  }
};

export const ToolStatusIndicator: React.FC<{
  tool?: string;
  isGenerating: boolean;
  dir: 'ltr' | 'rtl';
  t: any;
}> = () => {
  return null;
};
