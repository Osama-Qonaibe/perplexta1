export interface ShareableAd {
  id: number;
  post_code?: string;
  author_username?: string;
  page_slug?: string;
  author_name?: string;
  title?: string;
  description?: string;
  image_url?: string | null;
  video_url?: string | null;
}

export interface ShareablePage {
  id: number;
  slug?: string;
  name?: string;
  description?: string;
  city?: string;
}

/**
 * Builds human-readable and code-based share URL for a post
 * Format: /viralbook/p/:ownerHandle/:postCode/:titleSlug
 */
export function getPostShareUrl(ad: ShareableAd): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const postCode = ad.post_code || `PX-${ad.id}`;
  const ownerHandle = ad.author_username || ad.page_slug || (ad.author_name ? ad.author_name.toLowerCase().trim().replace(/[^\w\u0600-\u06FF]/g, '') : 'user');
  const titleSlug = ad.title
    ? ad.title.toLowerCase().trim().replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/[\s_]+/g, '-').slice(0, 40)
    : 'post';

  return `${origin}/viralbook/p/${encodeURIComponent(ownerHandle)}/${postCode}/${encodeURIComponent(titleSlug)}`;
}

/**
 * Builds human-readable share URL for a commercial business page
 * Format: /viralbook/page/:pageSlug
 */
export function getPageShareUrl(page: ShareablePage): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageSlug = page.slug || (page.name ? page.name.toLowerCase().trim().replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/[\s_]+/g, '-') + '-' + page.id : String(page.id));

  return `${origin}/viralbook/page/${encodeURIComponent(pageSlug)}`;
}

/**
 * Generates rich WhatsApp / Social text for sharing a post
 */
export function getPostShareText(ad: ShareableAd, isRtl: boolean = true): string {
  const url = getPostShareUrl(ad);
  const title = ad.title || 'منشور على بيربليكستا';
  const snippet = ad.description ? ad.description.trim().slice(0, 100) + (ad.description.length > 100 ? '...' : '') : '';

  if (isRtl) {
    return `📌 ${title}\n\n${snippet ? snippet + '\n\n' : ''}👇 شاهِد التفاصيل الكاملة عبر الرابط التالي:\n${url}`;
  }
  return `📌 ${title}\n\n${snippet ? snippet + '\n\n' : ''}👇 Check out full details here:\n${url}`;
}

/**
 * Generates rich WhatsApp / Social text for sharing a commercial page
 */
export function getPageShareText(page: ShareablePage, isRtl: boolean = true): string {
  const url = getPageShareUrl(page);
  const name = page.name || 'صفحة تجارية على بيربليكستا';
  const snippet = page.description ? page.description.trim().slice(0, 100) + (page.description.length > 100 ? '...' : '') : '';
  const city = page.city || 'فلسطين';

  if (isRtl) {
    return `🏢 ${name}\n📍 ${city}\n\n${snippet ? snippet + '\n\n' : ''}👇 تفضل بزيارة صفحتنا الرسمية عبر الرابط التالي:\n${url}`;
  }
  return `🏢 ${name}\n📍 ${city}\n\n${snippet ? snippet + '\n\n' : ''}👇 Visit our official business page:\n${url}`;
}
