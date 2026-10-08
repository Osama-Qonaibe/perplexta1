import { ThemePreset } from '../types';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from './defaultTokens';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'perplexta_elite_sovereign',
    nameEn: 'Perplexta Elite Unified (Sovereign Premium)',
    nameAr: 'بيربليكستا النخبة الموحد (الهوية السيادية الفاخرة)',
    descriptionEn: 'The supreme elite brand theme: royal emerald primary actions, elegant indigo accents, clean high-contrast off-white surfaces, and fluid M3 transitions.',
    descriptionAr: 'الهوية السيادية الفاخرة المعتمدة: أزرار أساسية باللون الزمردي الملكي، تفاصيل باللون النيلي الفاخر، وأسطح بيضاء نقية عالية التباين مع حركات انتقالية سلسة للغاية.',
    author: 'Perplexta Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#ffffff',
      card: '#ffffff',
      accent: '#6366f1',
      text: '#111827',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
        '--accent': '#6366f1',
        '--accent-hover': '#4f46e5',
        '--fg-accent': '#6366f1',
        '--bg-accent-emphasis': '#10b981',
        '--bg-accent-muted': 'rgba(99, 102, 241, 0.12)',
        '--border-accent': '#6366f1',
        '--border-focus': '#6366f1',
        '--focus-outline': '#6366f1',
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
        '--accent': '#818cf8',
        '--accent-hover': '#6366f1',
        '--fg-accent': '#818cf8',
        '--bg-accent-emphasis': '#059669',
        '--bg-accent-muted': 'rgba(129, 140, 248, 0.15)',
        '--border-accent': '#818cf8',
        '--border-focus': '#818cf8',
        '--focus-outline': '#818cf8',
      },
    },
  },
  {
    id: 'perplexta_canonical_primer',
    nameEn: 'Perplexta Primer v4.0.0 (Canonical Sovereign)',
    nameAr: 'بيربليكستا برايمر الإصدار 4 (الرسمي المعتمد)',
    descriptionEn: 'The sovereign canonical standard: GitHub Green #1a7f37/#238636 CTA, GitHub Blue #0969da/#58a6ff links & rings, #ffffff/#0d1117 canvases, and crisp structural borders.',
    descriptionAr: 'المعيار السيادي المعتمد: أخضر جيت هب #1a7f37/#238636 للأزرار الأساسية، وأزرق جيت هب #0969da/#58a6ff للروابط وحلقات التركيز، مع خطوط كايرو وجيست عالية الوضوح.',
    author: 'Perplexta Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#ffffff',
      card: '#ffffff',
      accent: '#0969da',
      text: '#1f2328',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
  {
    id: 'perplexta_terminal_dark',
    nameEn: 'Perplexta Terminal Dark (Monolith Pro)',
    nameAr: 'بيربليكستا تيرمينال الاحترافي (Dark Mode)',
    descriptionEn: 'High-contrast dark canvas #0d1117 with #161b22 cards, #010409 deep terminal insets, vibrant GitHub Green actions and Geist typography.',
    descriptionAr: 'السطح الداكن الاحترافي #0d1117 مع بطاقات #161b22، ومجاري كود #010409 غائرة، وأزرار خضراء سيادية مع خطوط جيست وكايرو.',
    author: 'Perplexta Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#0d1117',
      card: '#161b22',
      accent: '#58a6ff',
      text: '#e6edf3',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
  {
    id: 'perplexta_pure_light',
    nameEn: 'Perplexta Pristine Light (Editorial)',
    nameAr: 'بيربليكستا الفاتح الناصع (عالي التباين)',
    descriptionEn: 'Pristine pure-white editorial surface with generous spacing, high-contrast typography #1f2328, and rich GitHub Green CTA #1a7f37.',
    descriptionAr: 'تصميم تحريري ناصع البياض بأسطح نقية #ffffff وخطوط داكنة عالية التباين #1f2328 مع زر الإجراءات الأخضر السيادي #1a7f37.',
    author: 'Perplexta Core Team',
    version: '4.0.0',
    previewColors: {
      surface: '#ffffff',
      card: '#ffffff',
      accent: '#0969da',
      text: '#1f2328',
    },
    tokens: {
      light: {
        ...DEFAULT_LIGHT_TOKENS,
      },
      dark: {
        ...DEFAULT_DARK_TOKENS,
      },
    },
  },
];
