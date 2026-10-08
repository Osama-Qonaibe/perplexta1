import { CanvasElement } from '../components/chat/artifacts/ArtifactImageEditor';

export interface TypographyElement extends Partial<CanvasElement> {
  offsetX?: number;
  offsetY?: number;
}

export interface TypographyPreset {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'offers' | 'social' | 'quotes' | 'modern' | 'news';
  previewText: string;
  elements: TypographyElement[];
}

export const RATAQ_TYPOGRAPHY: TypographyPreset[] = [
  {
    id: 'typo-flash-sale',
    titleAr: 'عرض خاص وتخفيضات',
    titleEn: 'Mega Flash Sale',
    category: 'offers',
    previewText: 'FLASH SALE 50% OFF',
    elements: [
      {
        type: 'text',
        name: 'شارة العرض',
        text: '🔥 عـرض خـاص ولـفـتـرة مـحـدودة',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Tajawal, sans-serif',
        color: '#f59e0b',
        textAlign: 'center',
        textBgColor: 'rgba(0, 0, 0, 0.8)',
        textBgPadding: 8,
        textBgCornerRadius: 6,
        w: 280,
        h: 36,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'العنوان الرئيسي للخصم',
        text: 'خصم يصل إلى 50%',
        fontSize: 46,
        fontWeight: '900',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(239, 68, 68, 0.9)',
        shadowBlur: 14,
        w: 360,
        h: 65,
        offsetY: 45
      },
      {
        type: 'text',
        name: 'التفاصيل الترويجية',
        text: 'تسوق الآن واستمتع بالشحن المجاني لكافة الطلبات',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Tajawal, sans-serif',
        color: '#fde047',
        textAlign: 'center',
        w: 380,
        h: 35,
        offsetY: 115
      }
    ]
  },

  {
    id: 'typo-viral-linkup',
    titleAr: 'شركة فيرال لينك اب',
    titleEn: 'Viral Link Up Business',
    category: 'modern',
    previewText: 'VIRAL LINK UP AGENCY',
    elements: [
      {
        type: 'text',
        name: 'اسم الشركة',
        text: 'VIRAL LINK UP',
        fontSize: 42,
        fontWeight: '900',
        fontFamily: 'Inter, sans-serif',
        color: '#38bdf8',
        textStrokeColor: '#ffffff',
        textStrokeWidth: 1,
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(56, 189, 248, 0.8)',
        shadowBlur: 16,
        w: 380,
        h: 60,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'الوصف الفرعي',
        text: 'حـلـول الـتـسـويـق والـتـحـلـيـل الـرقـمـي الـسـيـادي',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Tajawal, sans-serif',
        color: '#f8fafc',
        textAlign: 'center',
        textBgColor: 'rgba(15, 23, 42, 0.85)',
        textBgPadding: 8,
        textBgCornerRadius: 6,
        w: 360,
        h: 36,
        offsetY: 65
      }
    ]
  },

  {
    id: 'typo-save-the-date',
    titleAr: 'دعوة زفاف وحفل راقٍ',
    titleEn: 'Save The Date',
    category: 'social',
    previewText: 'SAVE THE DATE 2026',
    elements: [
      {
        type: 'text',
        name: 'العنوان الترحيبي',
        text: 'SAVE THE DATE',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Amiri, serif',
        color: '#fcd34d',
        textAlign: 'center',
        w: 260,
        h: 35,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'أسماء العروسين',
        text: 'أحـمـد & سـارة',
        fontSize: 44,
        fontWeight: 'bold',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 10,
        w: 320,
        h: 60,
        offsetY: 40
      },
      {
        type: 'text',
        name: 'تاريخ المناسبة',
        text: '25 . 12 . 2026',
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        color: '#e2e8f0',
        textAlign: 'center',
        w: 200,
        h: 30,
        offsetY: 105
      }
    ]
  },

  {
    id: 'typo-quote-motivation',
    titleAr: 'اقتباس تحفيزي يومي',
    titleEn: 'Daily Motivation Quote',
    category: 'quotes',
    previewText: 'NEVER GIVE UP ON DREAMS',
    elements: [
      {
        type: 'text',
        name: 'اقتباس رئيسي',
        text: '«النـجـاح ليـس صـدفـة، بـل عـمـل مـسـتـمـر»',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(16, 185, 129, 0.8)',
        shadowBlur: 14,
        w: 420,
        h: 55,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'قائل الاقتباس',
        text: '— طور مهاراتك كل يوم خطوة بخطوة',
        fontSize: 16,
        fontWeight: 'normal',
        fontFamily: 'Tajawal, sans-serif',
        color: '#34d399',
        textAlign: 'center',
        w: 300,
        h: 30,
        offsetY: 60
      }
    ]
  },

  {
    id: 'typo-breaking-news',
    titleAr: 'خبر عاجل وتغطية إخبارية',
    titleEn: 'Breaking News Header',
    category: 'news',
    previewText: '🔴 عاجل وتغطية حصرية',
    elements: [
      {
        type: 'text',
        name: 'شارة عاجل',
        text: '🔴 عـــاجـــل',
        fontSize: 22,
        fontWeight: '900',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textBgColor: '#dc2626',
        textBgPadding: 8,
        textBgCornerRadius: 4,
        textAlign: 'center',
        w: 160,
        h: 40,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'عنوان الخبر العاجل',
        text: 'تغطية مستمرة ومباشرة لأبرز التطورات',
        fontSize: 34,
        fontWeight: 'bold',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: true,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 10,
        w: 420,
        h: 55,
        offsetY: 50
      }
    ]
  },

  {
    id: 'typo-tech-ai-badge',
    titleAr: 'شارة تقنية وذكاء اصطناعي',
    titleEn: 'Sovereign AI Tech Badge',
    category: 'modern',
    previewText: '⚡ NEXT-GEN AI COMPUTE',
    elements: [
      {
        type: 'text',
        name: 'Tag',
        text: '⚡ NEXT-GEN SOVEREIGN COMPUTE',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        color: '#38bdf8',
        textBgColor: 'rgba(56, 189, 248, 0.15)',
        textBgPadding: 10,
        textBgCornerRadius: 8,
        textAlign: 'center',
        w: 320,
        h: 40,
        offsetY: 0
      },
      {
        type: 'text',
        name: 'Headline',
        text: 'رينكس استوديو للإنتاج الإبداعي',
        fontSize: 36,
        fontWeight: '900',
        fontFamily: 'Cairo, sans-serif',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: true,
        shadowColor: '#0284c7',
        shadowBlur: 18,
        w: 420,
        h: 60,
        offsetY: 50
      }
    ]
  }
];
