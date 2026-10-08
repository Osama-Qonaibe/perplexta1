import { CanvasElement } from '../components/chat/artifacts/ArtifactImageEditor';
import { RataqRepoTemplates, RataqRepoTemplate } from './templates';
import { convertRataqTemplateToCanvasElements } from '../utils/rataqTemplateLoader';

export interface PublicTemplateItem {
  id: string;
  titleAr: string;
  titleEn: string;
  src: string;
  category: 'all' | 'reels' | 'story' | 'marketing' | 'social' | 'youtube' | 'cards';
  categoryLabelAr: string;
  dimensions: string;
  tag: string;
  repoTemplate?: RataqRepoTemplate;
  elements?: CanvasElement[];
  canvasBackground?: string;
  width?: number;
  height?: number;
}

export const REPO_PUBLIC_TEMPLATES: PublicTemplateItem[] = RataqRepoTemplates.map((tpl) => {
  const titleFormatted = tpl.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const converted = convertRataqTemplateToCanvasElements(tpl);
  return {
    id: `repo-${tpl.id}`,
    titleAr: `قالب ${titleFormatted}`,
    titleEn: `Template ${titleFormatted}`,
    src: `/templates/data/${tpl.filename}`,
    category: 'marketing',
    categoryLabelAr: 'قوالب رينكس',
    dimensions: `${converted.width} × ${converted.height}`,
    tag: 'مستودع رينكس',
    repoTemplate: tpl,
    elements: converted.elements,
    canvasBackground: converted.canvasBackground,
    width: converted.width,
    height: converted.height
  };
});

export const CURATED_PUBLIC_TEMPLATES: PublicTemplateItem[] = [
  // 1. Cinematic Promo Reels (1080 × 1920)
  {
    id: 'reels_promo_1',
    titleAr: 'قالب ريلز سينمائي ترويجي',
    titleEn: 'Cinematic Promo Reels',
    src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    category: 'reels',
    categoryLabelAr: 'فيديو وريلز',
    dimensions: '1080 × 1920',
    tag: 'ريلز عمودي 9:16',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230b0f19"/><stop offset="60%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23g1)"/><circle cx="540" cy="960" r="420" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="4" stroke-dasharray="24 16"/></svg>',
    elements: [
      {
        id: 'reels-1-tag',
        type: 'text',
        name: 'Top Badge',
        x: 290,
        y: 200,
        w: 500,
        h: 60,
        text: '🔥 REELS PRO • ترند الأسبوع',
        color: '#f8fafc',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.25)',
        textBgCornerRadius: 30
      },
      {
        id: 'reels-1-title',
        type: 'text',
        name: 'Main Title',
        x: 140,
        y: 380,
        w: 800,
        h: 130,
        text: 'أطلق حملتك الإعلانية',
        color: '#ffffff',
        fontSize: 68,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center'
      },
      {
        id: 'reels-1-subtitle',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 540,
        w: 800,
        h: 80,
        text: 'تصميم سينمائي متكامل يجذب آلاف المشاهدات',
        color: '#38bdf8',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'reels-1-cta',
        type: 'text',
        name: 'CTA Button',
        x: 290,
        y: 1540,
        w: 500,
        h: 90,
        text: 'ابدأ الآن بخصم 50% 🚀',
        color: '#0f172a',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#f59e0b',
        textBgCornerRadius: 45
      },
      {
        id: 'reels-1-swipe',
        type: 'text',
        name: 'Swipe Indicator',
        x: 240,
        y: 1670,
        w: 600,
        h: 50,
        text: 'اسحب للأعلى لمعرفة المزيد',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 22,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    ]
  },

  // 2. Exclusive Fashion Story (1080 × 1920)
  {
    id: 'story_fashion',
    titleAr: 'استوري أزياء وموضة حصرية',
    titleEn: 'Exclusive Fashion Story',
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    category: 'story',
    categoryLabelAr: 'قصة واستوري',
    dimensions: '1080 × 1920',
    tag: 'قصص 9:16',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%23292524"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23g2)"/><rect x="50" y="50" width="980" height="1820" rx="24" fill="none" stroke="%23d4af37" stroke-width="4"/><rect x="70" y="70" width="940" height="1780" rx="18" fill="none" stroke="%23d4af37" stroke-width="1" stroke-dasharray="12 8"/></svg>',
    elements: [
      {
        id: 'fashion-1-tag',
        type: 'text',
        name: 'Season Tag',
        x: 290,
        y: 220,
        w: 500,
        h: 60,
        text: 'NEW SEASON 2026 • تشكيلة راقية',
        color: '#d4af37',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(212,175,55,0.15)',
        textBgCornerRadius: 20
      },
      {
        id: 'fashion-1-title',
        type: 'text',
        name: 'Main Title',
        x: 140,
        y: 360,
        w: 800,
        h: 130,
        text: 'أناقة لا مثيل لها',
        color: '#ffffff',
        fontSize: 72,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center'
      },
      {
        id: 'fashion-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 520,
        w: 800,
        h: 80,
        text: 'تصاميم حصرية تناسب ذوقك الرفيع بلمسة باريسية',
        color: '#e7e5e4',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'fashion-1-code',
        type: 'text',
        name: 'Coupon Code',
        x: 340,
        y: 1440,
        w: 400,
        h: 70,
        text: 'كود خصم: LUXURY25',
        color: '#d4af37',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(212,175,55,0.2)',
        textBgCornerRadius: 18
      },
      {
        id: 'fashion-1-cta',
        type: 'text',
        name: 'Shop CTA',
        x: 290,
        y: 1560,
        w: 500,
        h: 90,
        text: 'تسوق التشكيلة الآن ✨',
        color: '#1c1917',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#d4af37',
        textBgCornerRadius: 45
      }
    ]
  },

  // 3. Luxury Cafe Promo (1080 × 1080)
  {
    id: 'cafe_promo',
    titleAr: 'إعلان مقهى وضيافة فاخرة',
    titleEn: 'Luxury Cafe Promo',
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    categoryLabelAr: 'تسويق ومطاعم',
    dimensions: '1080 × 1080',
    tag: 'خصم وإعلان',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23180e07"/><stop offset="100%" stop-color="%233b1e0f"/></linearGradient></defs><rect width="1080" height="1080" fill="url(%23g3)"/><circle cx="540" cy="540" r="380" fill="none" stroke="rgba(245,158,11,0.15)" stroke-width="2"/><circle cx="540" cy="540" r="360" fill="none" stroke="rgba(245,158,11,0.1)" stroke-width="1" stroke-dasharray="16 12"/></svg>',
    elements: [
      {
        id: 'cafe-1-tag',
        type: 'text',
        name: 'Cafe Badge',
        x: 340,
        y: 120,
        w: 400,
        h: 55,
        text: '☕ مذاق القهوة المختصة',
        color: '#fef3c7',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(245,158,11,0.25)',
        textBgCornerRadius: 28
      },
      {
        id: 'cafe-1-title',
        type: 'text',
        name: 'Main Headline',
        x: 140,
        y: 220,
        w: 800,
        h: 110,
        text: 'ابدأ صباحك بروقان',
        color: '#ffffff',
        fontSize: 64,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center'
      },
      {
        id: 'cafe-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 350,
        w: 800,
        h: 70,
        text: 'بن كولومبي فاخر ومخبوزات طازجة يومياً',
        color: '#fbbf24',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'cafe-1-offer',
        type: 'text',
        name: 'Offer Banner',
        x: 240,
        y: 720,
        w: 600,
        h: 70,
        text: 'احصل على قهوتك الثانية مجاناً',
        color: '#ffffff',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(255,255,255,0.15)',
        textBgCornerRadius: 18
      },
      {
        id: 'cafe-1-cta',
        type: 'text',
        name: 'Order CTA',
        x: 290,
        y: 830,
        w: 500,
        h: 80,
        text: 'اطلب عبر التطبيق الآن 🛵',
        color: '#180e07',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#f59e0b',
        textBgCornerRadius: 40
      }
    ]
  },

  // 4. Cyber Tech Showcase (1080 × 1080)
  {
    id: 'tech_product',
    titleAr: 'بوستر منتج تكنولوجي ذكي',
    titleEn: 'Cyber Tech Showcase',
    src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    category: 'social',
    categoryLabelAr: 'تكنولوجيا وشاشات',
    dimensions: '1080 × 1080',
    tag: 'إطلاق منتج',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23030712"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="1080" height="1080" fill="url(%23g4)"/><rect x="60" y="60" width="960" height="960" rx="32" fill="none" stroke="rgba(56,189,248,0.2)" stroke-width="3"/></svg>',
    elements: [
      {
        id: 'tech-1-tag',
        type: 'text',
        name: 'AI Badge',
        x: 290,
        y: 110,
        w: 500,
        h: 55,
        text: '⚡ الجيل القادم من الذكاء الاصطناعي',
        color: '#38bdf8',
        fontSize: 22,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.2)',
        textBgCornerRadius: 28
      },
      {
        id: 'tech-1-title',
        type: 'text',
        name: 'Headline',
        x: 140,
        y: 200,
        w: 800,
        h: 110,
        text: 'السرعة الفائقة بين يديك',
        color: '#ffffff',
        fontSize: 60,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center'
      },
      {
        id: 'tech-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 330,
        w: 800,
        h: 70,
        text: 'معالجات ثورية وكفاءة طاقة غير مسبوقة بنسبة 40%',
        color: '#94a3b8',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'tech-1-price',
        type: 'text',
        name: 'Price Badge',
        x: 340,
        y: 730,
        w: 400,
        h: 65,
        text: 'ابتداءً من $299 فقط',
        color: '#4ade80',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(74,222,128,0.15)',
        textBgCornerRadius: 16
      },
      {
        id: 'tech-1-cta',
        type: 'text',
        name: 'Pre-order CTA',
        x: 240,
        y: 830,
        w: 600,
        h: 80,
        text: 'اطلب مسبقاً مع شحن مجاني 🛒',
        color: '#030712',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#38bdf8',
        textBgCornerRadius: 40
      }
    ]
  },

  // 5. High-CTR YouTube Thumbnail (1280 × 720)
  {
    id: 'youtube_thumb_1',
    titleAr: 'صورة يوتيوب مصغرة احترافية',
    titleEn: 'High-CTR YouTube Thumbnail',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'youtube',
    categoryLabelAr: 'يوتيوب مصغر',
    dimensions: '1280 × 720',
    tag: 'يوتيوب 16:9',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2309090b"/><stop offset="100%" stop-color="%2318181b"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23g5)"/><rect x="30" y="30" width="1220" height="660" rx="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/></svg>',
    elements: [
      {
        id: 'yt-1-pill',
        type: 'text',
        name: 'Top Alert Badge',
        x: 80,
        y: 60,
        w: 420,
        h: 55,
        text: '🔴 حلقة استثنائية • سرية للمحترفين',
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#dc2626',
        textBgCornerRadius: 14
      },
      {
        id: 'yt-1-headline',
        type: 'text',
        name: 'Impact Headline',
        x: 80,
        y: 150,
        w: 750,
        h: 110,
        text: 'ضاعف أرباحك 10x 🚀',
        color: '#facc15',
        fontSize: 68,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'left'
      },
      {
        id: 'yt-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 80,
        y: 280,
        w: 750,
        h: 80,
        text: 'خطوات عملية بدون رأس مال في 2026',
        color: '#ffffff',
        fontSize: 36,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'left'
      },
      {
        id: 'yt-1-proof',
        type: 'text',
        name: 'Social Proof',
        x: 80,
        y: 420,
        w: 440,
        h: 60,
        text: '+100,000 مشاهدة في يومين',
        color: '#38bdf8',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.2)',
        textBgCornerRadius: 16
      },
      {
        id: 'yt-1-cta',
        type: 'text',
        name: 'Watch CTA',
        x: 80,
        y: 530,
        w: 450,
        h: 75,
        text: '▶ شاهد الشرح كاملاً الآن',
        color: '#ffffff',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#ef4444',
        textBgCornerRadius: 38
      }
    ]
  },

  // 6. Fitness & Gym Club Banner (1200 × 630)
  {
    id: 'fitness_gym',
    titleAr: 'بوستر نادي رياضي وصحة',
    titleEn: 'Fitness & Gym Club Banner',
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    category: 'marketing',
    categoryLabelAr: 'صحة ولياقة',
    dimensions: '1200 × 630',
    tag: 'بوستر تسويقي',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23020617"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="1200" height="630" fill="url(%23g6)"/><circle cx="1000" cy="315" r="280" fill="none" stroke="rgba(34,197,94,0.15)" stroke-width="4"/></svg>',
    elements: [
      {
        id: 'fit-1-badge',
        type: 'text',
        name: 'Fitness Badge',
        x: 80,
        y: 60,
        w: 340,
        h: 50,
        text: '💪 اللياقة تبدأ اليوم',
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#16a34a',
        textBgCornerRadius: 14
      },
      {
        id: 'fit-1-title',
        type: 'text',
        name: 'Main Title',
        x: 80,
        y: 150,
        w: 750,
        h: 95,
        text: 'حوّل جسمك في 90 يوماً',
        color: '#ffffff',
        fontSize: 62,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'left'
      },
      {
        id: 'fit-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 80,
        y: 270,
        w: 750,
        h: 70,
        text: 'خطط تدريب مخصصة ومدرب شخصي مع اشتراكك',
        color: '#cbd5e1',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'left'
      },
      {
        id: 'fit-1-trial',
        type: 'text',
        name: 'Trial Offer',
        x: 80,
        y: 380,
        w: 400,
        h: 60,
        text: 'أسبوع تجريبي مجاني بالكامل',
        color: '#facc15',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(250,204,21,0.2)',
        textBgCornerRadius: 16
      },
      {
        id: 'fit-1-cta',
        type: 'text',
        name: 'Join CTA',
        x: 80,
        y: 480,
        w: 480,
        h: 70,
        text: 'سجل الآن واحصل على الخصم 🏋️',
        color: '#020617',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#22c55e',
        textBgCornerRadius: 35
      }
    ]
  },

  // 7. Cinematic Travel Reels (1080 × 1920)
  {
    id: 'reels_travel',
    titleAr: 'ريلز سفر وسياحة سينمائية',
    titleEn: 'Cinematic Travel Reels',
    src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    category: 'reels',
    categoryLabelAr: 'فيديو وريلز',
    dimensions: '1080 × 1920',
    tag: 'سياحة وسفر',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g7" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23042f2e"/><stop offset="100%" stop-color="%230c4a6e"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23g7)"/><circle cx="540" cy="800" r="400" fill="none" stroke="rgba(94,234,212,0.15)" stroke-width="4"/></svg>',
    elements: [
      {
        id: 'travel-1-tag',
        type: 'text',
        name: 'Travel Tag',
        x: 340,
        y: 200,
        w: 400,
        h: 60,
        text: '✈️ وجهات الأحلام 2026',
        color: '#5eead4',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(94,234,212,0.2)',
        textBgCornerRadius: 30
      },
      {
        id: 'travel-1-title',
        type: 'text',
        name: 'Main Headline',
        x: 140,
        y: 360,
        w: 800,
        h: 120,
        text: 'سافر كأنك من أهل البلد',
        color: '#ffffff',
        fontSize: 64,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center'
      },
      {
        id: 'travel-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 510,
        w: 800,
        h: 80,
        text: 'أجمل 5 جزر سرية لا يعرفها السياح',
        color: '#67e8f9',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'travel-1-price',
        type: 'text',
        name: 'Price Tag',
        x: 290,
        y: 1440,
        w: 500,
        h: 70,
        text: 'عروض الطيران تبدأ من $149',
        color: '#ffffff',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(255,255,255,0.2)',
        textBgCornerRadius: 20
      },
      {
        id: 'travel-1-cta',
        type: 'text',
        name: 'Explore CTA',
        x: 240,
        y: 1550,
        w: 600,
        h: 90,
        text: 'اكتشف الدليل السياحي الشامل 🗺️',
        color: '#042f2e',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#2dd4bf',
        textBgCornerRadius: 45
      }
    ]
  },

  // 8. Corporate Business Banner (1200 × 630)
  {
    id: 'business_card_1',
    titleAr: 'بطاقة أعمال وغلاف تجاري',
    titleEn: 'Corporate Business Banner',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    category: 'cards',
    categoryLabelAr: 'بطاقات وأغلفة',
    dimensions: '1200 × 630',
    tag: 'شركات وهيكلة',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230a0f1d"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="1200" height="630" fill="url(%23g8)"/><rect x="40" y="40" width="1120" height="550" rx="16" fill="none" stroke="rgba(96,165,250,0.2)" stroke-width="2"/></svg>',
    elements: [
      {
        id: 'corp-1-badge',
        type: 'text',
        name: 'Identity Badge',
        x: 80,
        y: 60,
        w: 520,
        h: 50,
        text: 'CORPORATE IDENTITY • هوية أعمال موثقة',
        color: '#93c5fd',
        fontSize: 22,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(147,197,253,0.15)',
        textBgCornerRadius: 14
      },
      {
        id: 'corp-1-title',
        type: 'text',
        name: 'Headline',
        x: 80,
        y: 140,
        w: 750,
        h: 90,
        text: 'حلول رقمية متطورة لنمو أعمالك',
        color: '#ffffff',
        fontSize: 56,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'left'
      },
      {
        id: 'corp-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 80,
        y: 250,
        w: 750,
        h: 70,
        text: 'نبتكر تطبيقات وأنظمة سحابية ترتقي بمشروعك لمستويات قياسية',
        color: '#94a3b8',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'left'
      },
      {
        id: 'corp-1-stat',
        type: 'text',
        name: 'Social Proof',
        x: 80,
        y: 370,
        w: 380,
        h: 55,
        text: 'أكثر من 500+ شركة تثق بنا',
        color: '#38bdf8',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.2)',
        textBgCornerRadius: 14
      },
      {
        id: 'corp-1-cta',
        type: 'text',
        name: 'Contact CTA',
        x: 80,
        y: 460,
        w: 460,
        h: 70,
        text: 'احجز استشارتك المجانية اليوم 💼',
        color: '#0a0f1d',
        fontSize: 28,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '900',
        textAlign: 'center',
        textBgColor: '#60a5fa',
        textBgCornerRadius: 35
      }
    ]
  }
];

export const UNIFIED_PUBLIC_TEMPLATES: PublicTemplateItem[] = [
  ...REPO_PUBLIC_TEMPLATES,
  ...CURATED_PUBLIC_TEMPLATES
];
