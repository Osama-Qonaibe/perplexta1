// Rinex Creators & Marketplace Ecosystem Architecture
import { CanvasElement } from '../components/chat/artifacts/ArtifactImageEditor';

export interface RinexCreator {
  id: string;
  username: string;
  name: string;
  roleAr: string;
  roleEn: string;
  avatar: string;
  bioAr: string;
  bioEn: string;
  verified: boolean;
  totalViews: number;
  totalUses: number;
  rating: number;
  earningsBalance: number;
  followersCount: number;
  likesCount: number;
  profileVisitsCount: number;
  socialLinks: {
    twitter?: string;
    behance?: string;
    instagram?: string;
    website?: string;
  };
  email?: string;
  createdAt: number;
}

export interface MarketplaceTemplate {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  thumbnail: string;
  category: 'reels' | 'story' | 'marketing' | 'social' | 'youtube' | 'cards';
  categoryLabelAr: string;
  dimensions: string;
  priceType: 'free' | 'pro' | 'points';
  price: number; // 0 if free, or points/credits
  viewsCount: number;
  usesCount: number;
  rating: number;
  createdAt: number;
  elements?: any[];
  canvasBackground?: string;
}

export interface CreatorPayoutRequest {
  id: string;
  creatorId: string;
  amount: number;
  method: string;
  details: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: number;
}

const CREATORS_STORAGE_KEY = 'rinex_creators_registry_v1';
const TEMPLATES_STORAGE_KEY = 'rinex_marketplace_templates_v1';
const PAYOUTS_STORAGE_KEY = 'rinex_payout_requests_v1';

export const DEFAULT_CREATORS: RinexCreator[] = [
  {
    id: 'creator-1',
    username: 'sarah_designs',
    name: 'سارة العتيبي',
    roleAr: 'خبيرة تصميم هويات وقوالب سوشيال ميديا',
    roleEn: 'Brand & Social Media Design Expert',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_designs&backgroundColor=b6e3f4',
    bioAr: 'مصممة جرافيك بخبرة 7 سنوات. متخصصة في ابتكار قوالب احترافية تخدم صناع المحتوى والشركات الناشئة في رينكس.',
    bioEn: 'Graphic designer with 7 years of experience. Specialized in creating high-impact templates for creators.',
    verified: true,
    totalViews: 48200,
    totalUses: 12450,
    rating: 4.9,
    earningsBalance: 1840.50,
    followersCount: 3820,
    likesCount: 14200,
    profileVisitsCount: 61500,
    socialLinks: {
      behance: 'https://behance.net',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com'
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60
  },
  {
    id: 'creator-2',
    username: 'ahmad_media',
    name: 'مهندس أحمد الشمري',
    roleAr: 'صانع محتوى مرئي وخبير موشن جرافيك',
    roleEn: 'Visual Creator & Motion Expert',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad_media&backgroundColor=c0aede',
    bioAr: 'أبتكر قوالب ريلز سينمائية وقصص عمودية تسويقية تساعد العلامات التجارية على النمو السريع.',
    bioEn: 'Creating cinematic reels and vertical marketing stories that help brands scale quickly.',
    verified: true,
    totalViews: 35100,
    totalUses: 9800,
    rating: 4.8,
    earningsBalance: 1420.00,
    followersCount: 2910,
    likesCount: 9800,
    profileVisitsCount: 42300,
    socialLinks: {
      twitter: 'https://twitter.com',
      website: 'https://rinex.studio'
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45
  },
  {
    id: 'creator-3',
    username: 'lina_graphics',
    name: 'لينا مصطفى',
    roleAr: 'مصممة واجهات ومبدعة محتوى إعلاني',
    roleEn: 'UI/UX & Ad Creative Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina_graphics&backgroundColor=ffd5dc',
    bioAr: 'شغوفة بتصميم البوسترات التسويقية والكتالوجات التفاعلية بأعلى معايير الجودة والجمالية البصرية.',
    bioEn: 'Passionate about crafting marketing posters and interactive catalogs with highest visual standards.',
    verified: true,
    totalViews: 29400,
    totalUses: 8100,
    rating: 4.9,
    earningsBalance: 980.25,
    followersCount: 2150,
    likesCount: 7600,
    profileVisitsCount: 34100,
    socialLinks: {
      behance: 'https://behance.net',
      instagram: 'https://instagram.com'
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30
  }
];

export const DEFAULT_MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'm-tpl-1',
    creatorId: 'creator-1',
    creatorName: 'سارة العتيبي',
    creatorUsername: 'sarah_designs',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_designs&backgroundColor=b6e3f4',
    titleAr: 'قالب إعلان سوشيال ميديا عصري متدرج',
    titleEn: 'Modern Gradient Social Media Ad',
    descriptionAr: 'قالب احترافي مصمم خصيصاً لحملات إنستغرام وتويتر مع خط تجوال فاخر وتوزيع ألوان مدروس.',
    descriptionEn: 'Professional template crafted for Instagram & Twitter campaigns with exquisite typography.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g1)"/><rect x="60" y="60" width="680" height="680" rx="24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/><rect x="250" y="140" width="300" height="50" rx="25" fill="rgba(255,255,255,0.25)"/><text x="400" y="174" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">🔥 عرض خاص وحصري</text><text x="400" y="320" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="900" text-anchor="middle">أطلق مشروعك الرقمي</text><text x="400" y="390" fill="rgba(255,255,255,0.85)" font-size="24" font-family="sans-serif" text-anchor="middle">تصاميم استثنائية تصنع الفارق لعلامتك</text><rect x="260" y="520" width="280" height="70" rx="16" fill="%23f59e0b"/><text x="400" y="565" fill="%231e1b4b" font-size="24" font-family="sans-serif" font-weight="900" text-anchor="middle">ابدأ الآن بخصم 40%</text></svg>',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="1080" height="1080" fill="url(%23bg1)"/><rect x="60" y="60" width="960" height="960" rx="32" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/></svg>',
    category: 'marketing',
    categoryLabelAr: 'بوسترات تسويقية',
    dimensions: '1080 × 1080',
    priceType: 'free',
    price: 0,
    viewsCount: 14200,
    usesCount: 4300,
    rating: 4.9,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    elements: [
      {
        id: 'el-1-tag',
        type: 'text',
        name: 'Badge Tag',
        x: 340,
        y: 150,
        w: 400,
        h: 56,
        text: '🔥 عرض خاص وحصري',
        color: '#f8fafc',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(255,255,255,0.25)',
        textBgCornerRadius: 28
      },
      {
        id: 'el-1-title',
        type: 'text',
        name: 'Main Title',
        x: 90,
        y: 280,
        w: 900,
        h: 150,
        text: 'أطلق مشروعك الرقمي',
        color: '#ffffff',
        fontSize: 76,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-1-sub',
        type: 'text',
        name: 'Subtitle',
        x: 90,
        y: 460,
        w: 900,
        h: 100,
        text: 'تصاميم تسويقية استثنائية تصنع الفارق لعلامتك التجارية',
        color: '#e2e8f0',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-1-cta',
        type: 'text',
        name: 'CTA Button',
        x: 340,
        y: 650,
        w: 400,
        h: 74,
        text: 'ابدأ الآن بخصم 40%',
        color: '#1e1b4b',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#f59e0b',
        textBgCornerRadius: 18
      }
    ]
  },
  {
    id: 'm-tpl-2',
    creatorId: 'creator-2',
    creatorName: 'مهندس أحمد الشمري',
    creatorUsername: 'ahmad_media',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad_media&backgroundColor=c0aede',
    titleAr: 'قالب ريلز سينمائي ترويجي 9:16',
    titleEn: 'Cinematic Promo Reels 9:16',
    descriptionAr: 'قالب ريلز عمودي مذهل مع طبقات إضاءة وتأثيرات بصرية حية لزيادة التفاعل والمشاركة.',
    descriptionEn: 'Stunning vertical reels template with lighting layers and live visual effects.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="540" height="960" fill="url(%23g2)"/><circle cx="270" cy="300" r="160" fill="none" stroke="%2338bdf8" stroke-width="4" stroke-dasharray="12 8"/><text x="270" y="240" fill="%2394a3b8" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">REELS PRO 9:16</text><text x="270" y="320" fill="%2338bdf8" font-size="44" font-family="sans-serif" font-weight="900" text-anchor="middle">سر الانتشار السريع</text><text x="270" y="370" fill="%23ffffff" font-size="20" font-family="sans-serif" text-anchor="middle">ضاعف مشاهداتك 10 أضعاف</text><rect x="120" y="700" width="300" height="60" rx="30" fill="%230ea5e9"/><text x="270" y="738" fill="%23ffffff" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">شاهد الفيديو الكامل 🚀</text></svg>',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23bg2)"/><circle cx="540" cy="600" r="320" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-dasharray="24 16"/><circle cx="540" cy="600" r="300" fill="%2338bdf8" fill-opacity="0.05"/></svg>',
    category: 'reels',
    categoryLabelAr: 'فيديو وريلز',
    dimensions: '1080 × 1920',
    priceType: 'pro',
    price: 5,
    viewsCount: 18900,
    usesCount: 5600,
    rating: 4.9,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    elements: [
      {
        id: 'el-2-badge',
        type: 'text',
        name: 'Reel Tag',
        x: 390,
        y: 440,
        w: 300,
        h: 50,
        text: 'REELS PRO 9:16',
        color: '#38bdf8',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(56,189,248,0.15)',
        textBgCornerRadius: 25
      },
      {
        id: 'el-2-hook',
        type: 'text',
        name: 'Reel Hook',
        x: 140,
        y: 530,
        w: 800,
        h: 90,
        text: 'هل تبحث عن زيادة المبيعات؟',
        color: '#f8fafc',
        fontSize: 44,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'el-2-main',
        type: 'text',
        name: 'Main Headline',
        x: 90,
        y: 650,
        w: 900,
        h: 180,
        text: 'سر الانتشار السريع',
        color: '#facc15',
        fontSize: 88,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-2-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 850,
        w: 800,
        h: 90,
        text: 'ضاعف تفاعل جمهورك وعائداتك 10 أضعاف',
        color: '#ffffff',
        fontSize: 36,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-2-cta',
        type: 'text',
        name: 'CTA Action',
        x: 240,
        y: 1360,
        w: 600,
        h: 90,
        text: 'شاهد الفيديو الكامل في البايو 🚀',
        color: '#ffffff',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#0ea5e9',
        textBgCornerRadius: 45
      }
    ]
  },
  {
    id: 'm-tpl-3',
    creatorId: 'creator-3',
    creatorName: 'لينا مصطفى',
    creatorUsername: 'lina_graphics',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina_graphics&backgroundColor=ffd5dc',
    titleAr: 'استوري أزياء وموضة حصرية',
    titleEn: 'Exclusive Fashion Story Template',
    descriptionAr: 'تصميم أنيق وراقي لعروض الأزياء والمتاجر الإلكترونية مع إطار ذهبي فاخر.',
    descriptionEn: 'Elegant and classy design for fashion showcases and e-commerce stores.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%2344403c"/></linearGradient></defs><rect width="540" height="960" fill="url(%23g3)"/><rect x="30" y="30" width="480" height="900" rx="16" fill="none" stroke="%23d4af37" stroke-width="3"/><text x="270" y="200" fill="%23d4af37" font-size="20" font-family="serif" letter-spacing="4" text-anchor="middle">LUXURY COLLECTION</text><text x="270" y="320" fill="%23ffffff" font-size="40" font-family="sans-serif" font-weight="bold" text-anchor="middle">أناقة لا تضاهى</text><text x="270" y="380" fill="%23e7e5e4" font-size="20" font-family="sans-serif" text-anchor="middle">تشكيلة الموسم الجديد 2026</text><rect x="150" y="720" width="240" height="55" rx="8" fill="%23d4af37"/><text x="270" y="755" fill="%231c1917" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">تسوق المجموعة الآن</text></svg>',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%2344403c"/></linearGradient></defs><rect width="1080" height="1920" fill="url(%23bg3)"/><rect x="50" y="50" width="980" height="1820" rx="24" fill="none" stroke="%23d4af37" stroke-width="5"/><rect x="70" y="70" width="940" height="1780" rx="20" fill="none" stroke="%23d4af37" stroke-width="1" stroke-dasharray="12 8"/></svg>',
    category: 'story',
    categoryLabelAr: 'قصة واستوري',
    dimensions: '1080 × 1920',
    priceType: 'free',
    price: 0,
    viewsCount: 9400,
    usesCount: 2550,
    rating: 4.8,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    elements: [
      {
        id: 'el-3-brand',
        type: 'text',
        name: 'Brand Name',
        x: 140,
        y: 380,
        w: 800,
        h: 70,
        text: 'LUXURY COLLECTION 2026',
        color: '#d4af37',
        fontSize: 38,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'el-3-title',
        type: 'text',
        name: 'Collection Title',
        x: 90,
        y: 560,
        w: 900,
        h: 160,
        text: 'أناقة لا تضاهى لكل لحظة',
        color: '#ffffff',
        fontSize: 76,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-3-sub',
        type: 'text',
        name: 'Subtitle',
        x: 140,
        y: 740,
        w: 800,
        h: 90,
        text: 'تشكيلة الموسم الجديد الحصرية الفاخرة',
        color: '#e7e5e4',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'normal',
        textAlign: 'center'
      },
      {
        id: 'el-3-cta',
        type: 'text',
        name: 'CTA Button',
        x: 290,
        y: 1380,
        w: 500,
        h: 86,
        text: 'تسوق المجموعة الآن',
        color: '#1c1917',
        fontSize: 32,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#d4af37',
        textBgCornerRadius: 16
      }
    ]
  },
  {
    id: 'm-tpl-4',
    creatorId: 'creator-1',
    creatorName: 'سارة العتيبي',
    creatorUsername: 'sarah_designs',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_designs&backgroundColor=b6e3f4',
    titleAr: 'غلاف بودكاست وموسيقى نيون فاخر',
    titleEn: 'Neon Cyber Podcast Cover',
    descriptionAr: 'قالب غلاف بودكاست سينمائي بألوان النيون وجاذبية بصرية لمختلف منصات الاستماع.',
    descriptionEn: 'Cinematic podcast cover with vibrant neon aesthetics for audio platforms.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2309090b"/><stop offset="100%" stop-color="%2318181b"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g4)"/><circle cx="400" cy="350" r="140" fill="none" stroke="%23ec4899" stroke-width="8"/><polygon points="380,310 440,350 380,390" fill="%2306b6d4"/><rect x="260" y="140" width="280" height="44" rx="22" fill="%2306b6d4" fill-opacity="0.2" stroke="%2306b6d4" stroke-width="2"/><text x="400" y="170" fill="%2306b6d4" font-size="18" font-family="monospace" font-weight="bold" text-anchor="middle">EPISODE 01 • NEW SEASON</text><text x="400" y="580" fill="%23ffffff" font-size="48" font-family="sans-serif" font-weight="900" text-anchor="middle">أسرار صناعة المحتوى</text><text x="400" y="640" fill="%23ec4899" font-size="26" font-family="sans-serif" font-weight="bold" text-anchor="middle">بودكاست الإبداع والنمو الرقمي</text></svg>',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2309090b"/><stop offset="100%" stop-color="%2318181b"/></linearGradient></defs><rect width="1080" height="1080" fill="url(%23bg4)"/><circle cx="540" cy="460" r="220" fill="none" stroke="%23ec4899" stroke-width="10"/><polygon points="500,390 610,460 500,530" fill="%2306b6d4"/></svg>',
    category: 'social',
    categoryLabelAr: 'مواقع التواصل',
    dimensions: '1080 × 1080',
    priceType: 'pro',
    price: 8,
    viewsCount: 11200,
    usesCount: 3800,
    rating: 5.0,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    elements: [
      {
        id: 'el-4-badge',
        type: 'text',
        name: 'Episode Badge',
        x: 340,
        y: 140,
        w: 400,
        h: 56,
        text: 'EPISODE 01 • NEW SEASON',
        color: '#06b6d4',
        fontSize: 24,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: 'rgba(6,182,212,0.18)',
        textBgCornerRadius: 28
      },
      {
        id: 'el-4-title',
        type: 'text',
        name: 'Podcast Name',
        x: 90,
        y: 740,
        w: 900,
        h: 140,
        text: 'أسرار صناعة المحتوى',
        color: '#ffffff',
        fontSize: 76,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-4-sub',
        type: 'text',
        name: 'Podcast Host',
        x: 140,
        y: 880,
        w: 800,
        h: 80,
        text: 'بودكاست الإبداع والنمو الرقمي 🎧',
        color: '#ec4899',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    ]
  },
  {
    id: 'm-tpl-5',
    creatorId: 'creator-2',
    creatorName: 'مهندس أحمد الشمري',
    creatorUsername: 'ahmad_media',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad_media&backgroundColor=c0aede',
    titleAr: 'مصغر يوتيوب تقني تفاعلي high-CTR',
    titleEn: 'High-CTR Tech Youtube Thumbnail',
    descriptionAr: 'قالب مصمم لزيادة نسبة النقر CTR لمقاطع يوتيوب التقنية والذكاء الاصطناعي.',
    descriptionEn: 'High-CTR thumbnail template optimized for tech and AI video creators.',
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23020617"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g5)"/><rect x="40" y="50" width="220" height="40" rx="8" fill="%23facc15"/><text x="150" y="77" fill="%230f172a" font-size="18" font-family="sans-serif" font-weight="900" text-anchor="middle">حصري وجديد 2026</text><text x="400" y="180" fill="%23ffffff" font-size="44" font-family="sans-serif" font-weight="900" text-anchor="middle">كيف تصنع تطبيقاً كاملاً في ساعة؟</text><text x="400" y="240" fill="%2338bdf8" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle">دليل المطورين والذكاء الاصطناعي ⚡</text><rect x="250" y="320" width="300" height="60" rx="14" fill="%23ef4444"/><text x="400" y="358" fill="%23ffffff" font-size="22" font-family="sans-serif" font-weight="900" text-anchor="middle">▶ شاهد الشرح العملي</text></svg>',
    canvasBackground: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23020617"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23bg5)"/><rect x="30" y="30" width="1220" height="660" rx="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/></svg>',
    category: 'marketing',
    categoryLabelAr: 'بوسترات تسويقية',
    dimensions: '1280 × 720',
    priceType: 'free',
    price: 0,
    viewsCount: 22100,
    usesCount: 7100,
    rating: 4.9,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    elements: [
      {
        id: 'el-5-badge',
        type: 'text',
        name: 'CTR Pill',
        x: 80,
        y: 70,
        w: 320,
        h: 56,
        text: 'جديد وحصري 2026',
        color: '#0f172a',
        fontSize: 26,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#facc15',
        textBgCornerRadius: 14
      },
      {
        id: 'el-5-title',
        type: 'text',
        name: 'CTR Main Text',
        x: 60,
        y: 170,
        w: 1160,
        h: 140,
        text: 'كيف تصنع تطبيقاً كاملاً في ساعة؟',
        color: '#ffffff',
        fontSize: 68,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: true
      },
      {
        id: 'el-5-sub',
        type: 'text',
        name: 'CTR Subtitle',
        x: 60,
        y: 320,
        w: 1160,
        h: 90,
        text: 'دليل المطورين والذكاء الاصطناعي ⚡',
        color: '#38bdf8',
        fontSize: 34,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center'
      },
      {
        id: 'el-5-cta',
        type: 'text',
        name: 'CTR Button',
        x: 440,
        y: 490,
        w: 400,
        h: 80,
        text: '▶ شاهد الشرح العملي',
        color: '#ffffff',
        fontSize: 30,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        textBgColor: '#ef4444',
        textBgCornerRadius: 20
      }
    ]
  }
];

export function getStoredCreators(): RinexCreator[] {
  try {
    const raw = localStorage.getItem(CREATORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading creators', e);
  }
  localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(DEFAULT_CREATORS));
  return DEFAULT_CREATORS;
}

export function getStoredMarketplaceTemplates(): MarketplaceTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: MarketplaceTemplate) => {
          if (!t.elements || t.elements.length === 0) {
            const def = DEFAULT_MARKETPLACE_TEMPLATES.find(d => d.id === t.id);
            if (def && def.elements) {
              return { ...t, elements: def.elements };
            }
          }
          return t;
        });
      }
    }
  } catch (e) {
    console.error('Error loading marketplace templates', e);
  }
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_MARKETPLACE_TEMPLATES));
  return DEFAULT_MARKETPLACE_TEMPLATES;
}

export function registerNewCreator(data: {
  username: string;
  name: string;
  roleAr: string;
  roleEn: string;
  bioAr: string;
  bioEn: string;
  avatar?: string;
  email?: string;
  socialLinks?: RinexCreator['socialLinks'];
}): RinexCreator {
  const creators = getStoredCreators();
  const cleanUsername = data.username.trim().toLowerCase().replace('@', '');
  
  const existingIndex = creators.findIndex(c => c.username.toLowerCase() === cleanUsername);
  if (existingIndex >= 0) {
    return creators[existingIndex];
  }

  const newCreator: RinexCreator = {
    id: `creator-${Date.now()}`,
    username: cleanUsername,
    name: data.name,
    email: data.email,
    roleAr: data.roleAr || 'صانع قوالب ومحتوى معتمد',
    roleEn: data.roleEn || 'Certified Creator & Designer',
    avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    bioAr: data.bioAr || 'صانع محتوى في شبكة رينكس للإبداع، يقدم قوالب بصرية وتصميمات تنافسية.',
    bioEn: data.bioEn || 'Rinex Creative Network member crafting high-performance visual templates.',
    verified: true,
    totalViews: 1,
    totalUses: 0,
    rating: 5.0,
    earningsBalance: 50.00, // Welcome bonus
    followersCount: 1,
    likesCount: 0,
    profileVisitsCount: 1,
    socialLinks: data.socialLinks || {},
    createdAt: Date.now()
  };

  const updated = [newCreator, ...creators];
  localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(updated));
  return newCreator;
}

export function recordTemplateUse(templateId: string): void {
  const templates = getStoredMarketplaceTemplates();
  const tplIdx = templates.findIndex(t => t.id === templateId);
  if (tplIdx >= 0) {
    templates[tplIdx].usesCount += 1;
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));

    const creators = getStoredCreators();
    const creatorIdx = creators.findIndex(c => c.id === templates[tplIdx].creatorId);
    if (creatorIdx >= 0) {
      creators[creatorIdx].totalUses += 1;
      // Add per-use commission (e.g., $0.15 for free template usage or 70% commission for paid)
      const commission = templates[tplIdx].priceType === 'free' ? 0.15 : (templates[tplIdx].price * 0.70);
      creators[creatorIdx].earningsBalance += commission;
      localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
    }
  }
}

export function publishMarketplaceTemplate(template: Omit<MarketplaceTemplate, 'id' | 'viewsCount' | 'usesCount' | 'rating' | 'createdAt'>): MarketplaceTemplate {
  const all = getStoredMarketplaceTemplates();
  const newTpl: MarketplaceTemplate = {
    ...template,
    id: `m-tpl-${Date.now()}`,
    viewsCount: 1,
    usesCount: 0,
    rating: 5.0,
    createdAt: Date.now()
  };
  const updated = [newTpl, ...all];
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));

  const creators = getStoredCreators();
  const creatorIdx = creators.findIndex(c => c.id === template.creatorId);
  if (creatorIdx >= 0) {
    creators[creatorIdx].totalViews += 1;
    localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
  }

  return newTpl;
}

export function getCreatorProfile(username: string): { creator: RinexCreator; templates: MarketplaceTemplate[] } | null {
  const creators = getStoredCreators();
  const cleanUser = username.toLowerCase().replace('@', '');
  const creator = creators.find(c => c.username.toLowerCase() === cleanUser);
  if (!creator) return null;

  const templates = getStoredMarketplaceTemplates().filter(t => t.creatorId === creator.id || t.creatorUsername.toLowerCase() === cleanUser);
  return { creator, templates };
}

const FOLLOWS_STORAGE_KEY = 'rinex_followed_creators_v1';
const LIKES_STORAGE_KEY = 'rinex_liked_creators_v1';
const FAV_TEMPLATES_KEY = 'rinex_favorite_templates_v1';

export function isCreatorFollowed(creatorId: string): boolean {
  try {
    const raw = localStorage.getItem(FOLLOWS_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(creatorId);
  } catch (e) {
    return false;
  }
}

export function toggleFollowCreator(creatorId: string): { isFollowed: boolean; followersCount: number } {
  const creators = getStoredCreators();
  const idx = creators.findIndex(c => c.id === creatorId);
  
  let list: string[] = [];
  try {
    const raw = localStorage.getItem(FOLLOWS_STORAGE_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isFollowed = list.includes(creatorId);
  let updatedList: string[];
  let delta = 0;

  if (isFollowed) {
    updatedList = list.filter(id => id !== creatorId);
    delta = -1;
  } else {
    updatedList = [...list, creatorId];
    delta = 1;
  }

  localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(updatedList));

  let followersCount = 100;
  if (idx >= 0) {
    creators[idx].followersCount = Math.max(0, (creators[idx].followersCount || 0) + delta);
    followersCount = creators[idx].followersCount;
    localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
  }

  return { isFollowed: !isFollowed, followersCount };
}

export function isCreatorLiked(creatorId: string): boolean {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(creatorId);
  } catch (e) {
    return false;
  }
}

export function toggleLikeCreator(creatorId: string): { isLiked: boolean; likesCount: number } {
  const creators = getStoredCreators();
  const idx = creators.findIndex(c => c.id === creatorId);

  let list: string[] = [];
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isLiked = list.includes(creatorId);
  let updatedList: string[];
  let delta = 0;

  if (isLiked) {
    updatedList = list.filter(id => id !== creatorId);
    delta = -1;
  } else {
    updatedList = [...list, creatorId];
    delta = 1;
  }

  localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(updatedList));

  let likesCount = 500;
  if (idx >= 0) {
    creators[idx].likesCount = Math.max(0, (creators[idx].likesCount || 0) + delta);
    likesCount = creators[idx].likesCount;
    localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
  }

  return { isLiked: !isLiked, likesCount };
}

export function incrementProfileVisits(creatorId: string): number {
  const creators = getStoredCreators();
  const idx = creators.findIndex(c => c.id === creatorId);
  if (idx >= 0) {
    creators[idx].profileVisitsCount = (creators[idx].profileVisitsCount || 0) + 1;
    localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
    return creators[idx].profileVisitsCount;
  }
  return 1;
}

export function isTemplateFavorite(templateId: string): boolean {
  try {
    const raw = localStorage.getItem(FAV_TEMPLATES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(templateId);
  } catch (e) {
    return false;
  }
}

export function toggleFavoriteTemplate(templateId: string): { isFavorite: boolean } {
  let list: string[] = [];
  try {
    const raw = localStorage.getItem(FAV_TEMPLATES_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const isFav = list.includes(templateId);
  let updatedList: string[];

  if (isFav) {
    updatedList = list.filter(id => id !== templateId);
  } else {
    updatedList = [...list, templateId];
  }

  localStorage.setItem(FAV_TEMPLATES_KEY, JSON.stringify(updatedList));
  return { isFavorite: !isFav };
}

export function recordCreatorRating(creatorId: string, rating: number): number {
  const creators = getStoredCreators();
  const idx = creators.findIndex(c => c.id === creatorId);
  if (idx >= 0) {
    const current = creators[idx].rating || 5.0;
    // Moving weighted average
    const updatedRating = Number(((current * 4 + rating) / 5).toFixed(1));
    creators[idx].rating = updatedRating;
    localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
    return updatedRating;
  }
  return rating;
}

export function getStoredPayoutRequests(creatorId?: string): CreatorPayoutRequest[] {
  try {
    const raw = localStorage.getItem(PAYOUTS_STORAGE_KEY);
    const list: CreatorPayoutRequest[] = raw ? JSON.parse(raw) : [];
    if (creatorId) {
      return list.filter(p => p.creatorId === creatorId);
    }
    return list;
  } catch (e) {
    return [];
  }
}

export function requestCreatorPayout(
  creatorId: string,
  amount: number,
  method: string,
  details: string
): { success: boolean; newBalance: number; payout?: CreatorPayoutRequest; error?: string } {
  const creators = getStoredCreators();
  const idx = creators.findIndex(c => c.id === creatorId);
  if (idx < 0) {
    return { success: false, newBalance: 0, error: 'Creator not found' };
  }

  if (creators[idx].earningsBalance < amount) {
    return { success: false, newBalance: creators[idx].earningsBalance, error: 'Insufficient balance' };
  }

  creators[idx].earningsBalance = Math.max(0, Number((creators[idx].earningsBalance - amount).toFixed(2)));
  localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));

  const newPayout: CreatorPayoutRequest = {
    id: `payout-${Date.now()}`,
    creatorId,
    amount,
    method,
    details,
    status: 'pending',
    requestedAt: Date.now()
  };

  const existing = getStoredPayoutRequests();
  localStorage.setItem(PAYOUTS_STORAGE_KEY, JSON.stringify([newPayout, ...existing]));

  return { success: true, newBalance: creators[idx].earningsBalance, payout: newPayout };
}
