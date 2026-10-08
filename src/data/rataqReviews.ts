// Perplexta / RATAQ Sovereign Studio - User Reviews & Testimonials Data Architecture

export interface UserReviewItem {
  id: string;
  name: string;
  roleAr: string;
  roleEn: string;
  avatar: string;
  rating: number; // 1 - 5
  commentAr: string;
  commentEn: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  createdAt: number;
  verified?: boolean;
}

export const DEFAULT_USER_REVIEWS: UserReviewItem[] = [
  {
    id: 'rev-1',
    name: 'سارة العتيبي',
    roleAr: 'صانعة محتوى ومصممة سوشيال ميديا',
    roleEn: 'Social Media Content Creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    commentAr: 'استوديو رينكس غير طريقة عملي اليومية بالكامل! الكانفاس المتعدد الصفحات يسمح لي بإنهاء حملة إنستغرام كاملة في دقائق معدودة مع تحرير الخطوط العربية الفاخرة بدقة متناهية.',
    commentEn: 'Rinex Studio transformed my daily workflow. Multi-page canvas lets me build entire Instagram campaigns in minutes.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    verified: true
  },
  {
    id: 'rev-2',
    name: 'مهندس أحمد الشمري',
    roleAr: 'مدير تسويق رقمي في شركة تقنية',
    roleEn: 'Digital Marketing Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    commentAr: 'السرعة الفائقة في تصدير تصاميم 4K بدون أي علامات مائية مع حماية وحفظ بيانات المشاريع سحابياً جعل المنصة خيارنا الأول والوحيد لفريق التسويق.',
    commentEn: 'The sub-second 4K export speed without watermarks and strict data security made Rinex our top marketing suite.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    verified: true
  },
  {
    id: 'rev-3',
    name: 'لينا مصطفى',
    roleAr: 'مصممة هويات تجارية ورسومات وكتور',
    roleEn: 'Brand Identity Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    commentAr: 'المحو السحري بالذكاء الاصطناعي وتنقية خلفية الصور بضغطة زر واحدة وفرت عليّ ساعات من العمل اليدوي في برنامج الفوتوشوب!',
    commentEn: 'One-click AI background removal saved me hours of manual Photoshop clipping.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    verified: true
  }
];

const REVIEWS_STORAGE_KEY = 'perplexta_studio_user_reviews';

export function getStoredUserReviews(): UserReviewItem[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_REVIEWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return [...parsed, ...DEFAULT_USER_REVIEWS.filter(d => !parsed.some(p => p.id === d.id))];
    }
  } catch (err) {
    console.warn('Failed to parse user reviews from storage', err);
  }
  return DEFAULT_USER_REVIEWS;
}

export function saveUserReview(review: Omit<UserReviewItem, 'id' | 'createdAt' | 'verified'>): UserReviewItem[] {
  try {
    const existing = getStoredUserReviews();
    const newReview: UserReviewItem = {
      ...review,
      id: `rev-user-${Date.now()}`,
      createdAt: Date.now(),
      verified: true
    };
    const updated = [newReview, ...existing];
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save user review', err);
    return getStoredUserReviews();
  }
}
