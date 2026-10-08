import { getAssetUrl, BUILD_VERSION } from './assetManager';

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'tiktok' | 'direct' | 'unknown';
  embedUrl?: string;
  directUrl?: string;
}

export function parseVideoUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown' };
  }

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('blob:') && !cleanUrl.startsWith('data:') && !cleanUrl.startsWith('/')) {
    cleanUrl = `/uploads/${cleanUrl}`;
  }

  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&enablejsapi=1&rel=0`,
      directUrl: cleanUrl,
    };
  }

  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&muted=1`,
      directUrl: cleanUrl,
    };
  }

  if (cleanUrl.includes('tiktok.com')) {
    const ttMatch = cleanUrl.match(/video\/(\d+)/);
    if (ttMatch && ttMatch[1]) {
      return {
        type: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
        directUrl: cleanUrl,
      };
    }
  }

  return {
    type: 'direct',
    directUrl: cleanUrl,
  };
}

export function getAspectRatioClass(aspectRatio?: string, adFormat?: string): string {
  // Vertical 9:16 Reels/Stories inside newsfeed cards
  if (aspectRatio === '9:16' || adFormat === 'reel' || adFormat === 'story') {
    return 'aspect-[9/16] max-h-[540px] mx-auto';
  }
  if (aspectRatio === '4:5' || adFormat === 'portrait') {
    return 'aspect-[4/5] max-h-[500px] mx-auto';
  }
  if (aspectRatio === '1:1' || adFormat === 'sidebar' || adFormat === 'square') {
    return 'aspect-square max-h-[500px] mx-auto';
  }
  if (aspectRatio === '21:9' || adFormat === 'banner' || adFormat === 'header_banner') {
    return 'aspect-[21/9]';
  }
  if (aspectRatio === '16:9' || adFormat === 'video' || adFormat === 'instream' || adFormat === 'feed' || adFormat === 'post') {
    return 'aspect-video max-h-[480px]';
  }
  // Standard video default is widescreen 16:9 to match card width without jump
  return 'aspect-video max-h-[480px]';
}

export function getRecommendedDimensions(adFormat?: string, isRtl = true): string {
  switch (adFormat) {
    case 'reel':
    case 'story':
      return isRtl
        ? 'القياس المعائي المعتمد: 1080x1920 بكسل (نسبة 9:16) - شاشة كاملة عمودية للموبايل والقصص'
        : 'Approved Platform Ratio: 1080x1920 px (9:16 ratio) - Fullscreen vertical for Reels & Stories';
    case 'feed':
      return isRtl
        ? 'القياس المعائي المعتمد: 1080x1080 بكسل (1:1) أو 1080x1350 (4:5) - منشورات التغذية الرئيسية'
        : 'Approved Platform Ratio: 1080x1080 px (1:1) or 1080x1350 (4:5) - Newsfeed posts';
    case 'video':
    case 'instream':
      return isRtl
        ? 'القياس المعائي المعتمد: 1920x1080 بكسل (16:9) - شاشة عريضة للفيديوهات الاحترافية'
        : 'Approved Platform Ratio: 1920x1080 px (16:9 widescreen) - In-stream video ads';
    case 'sidebar':
      return isRtl
        ? 'القياس المعائي المعتمد: 600x600 بكسل (1:1) - الشريط الجانبي والقوائم الفرعية'
        : 'Approved Platform Ratio: 600x600 px (1:1 square) - Sidebar & widgets';
    case 'banner':
    case 'header_banner':
      return isRtl
        ? 'القياس المعائي المعتمد: 1920x480 بكسل (21:9 أو 4:1) - بانر عالي التحديد للمقدمة'
        : 'Approved Platform Ratio: 1920x480 px (21:9 ultra-wide) - Header banner unit';
    default:
      return isRtl
        ? 'القياس المعتمد: متكيف تلقائياً مع كافة الأبعاد مع دعم القص والتركيز البصري'
        : 'Platform Ratio: Fully dynamic adaptive sizing with auto-cropping and focus control';
  }
}

export interface VideoExtractedMetadata {
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  isVertical: boolean;
}

export async function extractVideoMetadata(videoSource: File | string, seekTimeSeconds = 1.0): Promise<VideoExtractedMetadata> {
  return new Promise((resolve) => {
    let isSettled = false;
    const finish = (res: VideoExtractedMetadata) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (_) {}
      }
      resolve(res);
    };

    const result: VideoExtractedMetadata = {
      thumbnail: '',
      duration: 0,
      width: 0,
      height: 0,
      aspectRatio: '16:9',
      isVertical: false
    };

    // Safety timeout: resolve within 3.5s max so UI never hangs
    const timer = setTimeout(() => {
      finish(result);
    }, 3500);

    const video = document.createElement('video');
    if (typeof videoSource === 'string' && !videoSource.startsWith('blob:') && !videoSource.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let objectUrl = '';
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      objectUrl = URL.createObjectURL(videoSource);
      video.src = objectUrl;
    }

    video.addEventListener('loadedmetadata', () => {
      result.duration = video.duration || 0;
      result.width = video.videoWidth || 0;
      result.height = video.videoHeight || 0;

      if (result.width > 0 && result.height > 0) {
        const ratioNum = result.width / result.height;
        if (ratioNum <= 0.68) {
          result.aspectRatio = '9:16';
          result.isVertical = true;
        } else if (ratioNum > 0.68 && ratioNum < 0.92) {
          result.aspectRatio = '4:5';
          result.isVertical = true;
        } else if (ratioNum >= 0.92 && ratioNum <= 1.15) {
          result.aspectRatio = '1:1';
          result.isVertical = false;
        } else if (ratioNum > 1.15 && ratioNum < 1.9) {
          result.aspectRatio = '16:9';
          result.isVertical = false;
        } else {
          result.aspectRatio = '21:9';
          result.isVertical = false;
        }
      }

      const targetSeek = Math.max(0, Math.min(seekTimeSeconds, video.duration ? Math.max(0.1, video.duration - 0.1) : 0.5));
      try {
        video.currentTime = targetSeek;
      } catch (_) {
        finish(result);
      }
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          result.thumbnail = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch {
        // Fallthrough
      }
      finish(result);
    });

    video.addEventListener('error', () => {
      finish(result);
    });

    video.load();
  });
}

export interface RecommendedFrameItem {
  time: number;
  timeLabel: string;
  dataUrl: string;
}

/**
 * Rapidly extracts 5-7 recommended stopping/cover keyframes from a video file or URL.
 * Designed for sub-second execution with non-blocking per-frame timeouts.
 */
export async function extractRecommendedVideoFrames(
  videoSource: File | string,
  targetCount = 6
): Promise<RecommendedFrameItem[]> {
  return new Promise((resolve) => {
    let objectUrl = '';
    const src = typeof videoSource === 'string' ? videoSource : (objectUrl = URL.createObjectURL(videoSource));
    
    const video = document.createElement('video');
    if (typeof videoSource === 'string' && !videoSource.startsWith('blob:') && !videoSource.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = src;

    const cleanup = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (_) {}
      }
    };

    // Overall fail-safe timeout
    const overallTimeout = setTimeout(() => {
      cleanup();
      resolve([]);
    }, 8000);

    video.onloadedmetadata = async () => {
      const dur = video.duration || 1;
      // Calculate evenly spaced time positions across the duration
      const points = [];
      const step = dur / (targetCount + 1);
      for (let i = 1; i <= targetCount; i++) {
        points.push(Math.min(dur - 0.05, Math.max(0.1, i * step)));
      }

      const results: RecommendedFrameItem[] = [];

      for (const t of points) {
        try {
          const frameUrl = await new Promise<string>((res) => {
            let done = false;
            const singleTimer = setTimeout(() => {
              if (!done) { done = true; res(''); }
            }, 1200);

            const onSeeked = () => {
              if (done) return;
              done = true;
              clearTimeout(singleTimer);
              video.removeEventListener('seeked', onSeeked);
              try {
                const canvas = document.createElement('canvas');
                const vw = video.videoWidth || 640;
                const vh = video.videoHeight || 480;
                const maxDim = 480;
                const scale = Math.min(1, maxDim / Math.max(vw, vh));
                canvas.width = Math.max(80, Math.round(vw * scale));
                canvas.height = Math.max(80, Math.round(vh * scale));
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  res(canvas.toDataURL('image/jpeg', 0.82));
                  return;
                }
              } catch (_) {}
              res('');
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            if (typeof (video as any).fastSeek === 'function') {
              try {
                (video as any).fastSeek(t);
              } catch (_) {
                video.currentTime = t;
              }
            } else {
              video.currentTime = t;
            }
          });

          if (frameUrl) {
            const mins = Math.floor(t / 60);
            const secs = Math.floor(t % 60);
            const timeLabel = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
            results.push({ time: t, timeLabel, dataUrl: frameUrl });
          }
        } catch (_) {}
      }

      clearTimeout(overallTimeout);
      cleanup();
      resolve(results);
    };

    video.onerror = () => {
      clearTimeout(overallTimeout);
      cleanup();
      resolve([]);
    };
  });
}

export async function extractVideoThumbnail(videoSource: File | string, seekTimeSeconds = 1.0): Promise<string> {
  const meta = await extractVideoMetadata(videoSource, seekTimeSeconds);
  return meta.thumbnail;
}

const mediaUrlCache = new Map<string, string>();

export function getMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (mediaUrlCache.has(trimmed)) {
    return mediaUrlCache.get(trimmed)!;
  }

  // Preserve data URLs and blob URLs directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Handle multiple comma-separated URLs if present (take the first)
  let clean = trimmed;
  if (clean.includes(',') && !clean.startsWith('data:')) {
    clean = clean.split(',')[0].trim();
  }

  // Check if it belongs to local /uploads/ directory (whether full domain, IP, or relative)
  const uploadsMatch = clean.match(/(?:https?:\/\/[^\/]+)?\/?(?:uploads\/)+(.+)$/i);
  if (uploadsMatch && uploadsMatch[1]) {
    const rawFileWithParams = uploadsMatch[1].replace(/^\/+/, '');
    const cleanFileName = rawFileWithParams.split('?')[0];
    
    const normalized = `/uploads/${cleanFileName}?t=${BUILD_VERSION}`;
    if (mediaUrlCache.size > 2000) mediaUrlCache.clear();
    mediaUrlCache.set(trimmed, normalized);
    return normalized;
  }

  // If it's an external HTTP/HTTPS URL (e.g. Unsplash, Google, CDN)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // Strip local hostnames if present
    const relativeClean = clean.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i, '');
    if (relativeClean.startsWith('/uploads/')) {
      const cleanFileName = relativeClean.replace(/^\/uploads\//, '').split('?')[0];
      const normalized = `/uploads/${cleanFileName}?t=${BUILD_VERSION}`;
      if (mediaUrlCache.size > 2000) mediaUrlCache.clear();
      mediaUrlCache.set(trimmed, normalized);
      return normalized;
    }
    if (mediaUrlCache.size > 2000) mediaUrlCache.clear();
    mediaUrlCache.set(trimmed, relativeClean);
    return relativeClean;
  }

  // Bare filename without slashes (e.g., "1726801234_photo.webp")
  if (!clean.startsWith('/')) {
    const cleanFileName = clean.split('?')[0];
    const normalized = `/uploads/${cleanFileName}?t=${BUILD_VERSION}`;
    if (mediaUrlCache.size > 2000) mediaUrlCache.clear();
    mediaUrlCache.set(trimmed, normalized);
    return normalized;
  }

  // Relative path starting with /
  const [cleanPathOnly] = clean.split('?');
  const normalized = cleanPathOnly.startsWith('/uploads/') 
    ? `${cleanPathOnly}?t=${BUILD_VERSION}`
    : getAssetUrl(cleanPathOnly);

  if (mediaUrlCache.size > 2000) mediaUrlCache.clear();
  mediaUrlCache.set(trimmed, normalized);
  return normalized;
}

export function getMediaFallback(type: 'image' | 'video' | 'avatar' = 'image'): string {
  switch (type) {
    case 'avatar':
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
    case 'video':
      return 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-the-beach-at-sunset-40008-large.mp4';
    case 'image':
    default:
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80';
  }
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  format?: 'sidebar' | 'feed' | 'story' | 'reel' | 'video' | string;
}

export interface CompressResult {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export async function compressAndResizeImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return {
      file,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  let targetMaxWidth = options.maxWidth || 800;
  let targetMaxHeight = options.maxHeight || 800;

  if (options.format === 'sidebar') {
    targetMaxWidth = 600;
    targetMaxHeight = 600;
  } else if (options.format === 'feed') {
    targetMaxWidth = 1080;
    targetMaxHeight = 1080;
  } else if (options.format === 'story' || options.format === 'reel') {
    targetMaxWidth = 1080;
    targetMaxHeight = 1920;
  }

  const quality = options.quality ?? 0.88;
  const targetMimeType = options.mimeType || 'image/webp';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > targetMaxWidth || height > targetMaxHeight) {
          const ratio = Math.min(targetMaxWidth / width, targetMaxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, width: img.width, height: img.height, originalSize: file.size, compressedSize: file.size });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, width: img.width, height: img.height, originalSize: file.size, compressedSize: file.size });
              return;
            }

            const ext = targetMimeType === 'image/webp' ? '.webp' : '.jpg';
            const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFilename = `${cleanBaseName}_optimized${ext}`;

            const optimizedFile = new File([blob], newFilename, {
              type: targetMimeType,
              lastModified: Date.now()
            });

            resolve({
              file: optimizedFile,
              width,
              height,
              originalSize: file.size,
              compressedSize: optimizedFile.size
            });
          },
          targetMimeType,
          quality
        );
      };
      img.onerror = () => {
        resolve({ file, width: 0, height: 0, originalSize: file.size, compressedSize: file.size });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ file, width: 0, height: 0, originalSize: file.size, compressedSize: file.size });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a valid video URL from a BulletinAd object, searching video_url, media_gallery, or image_url.
 */
export function extractVideoUrlFromAd(ad: any): string {
  if (!ad) return '';
  if (ad.video_url && typeof ad.video_url === 'string' && ad.video_url.trim()) {
    return ad.video_url.trim();
  }
  if (ad.media_url && typeof ad.media_url === 'string' && ad.media_url.trim()) {
    return ad.media_url.trim();
  }
  if (ad.url && typeof ad.url === 'string' && ad.url.trim() && ad.url.match(/\.(mp4|webm|mov|m3u8|ogv)/i)) {
    return ad.url.trim();
  }
  if (ad.media_gallery && Array.isArray(ad.media_gallery) && ad.media_gallery.length > 0) {
    const videoItem = ad.media_gallery.find((m: any) => 
      m && (m.type === 'video' || (m.url && typeof m.url === 'string' && m.url.match(/\.(mp4|webm|mov|m3u8|ogv)/i)))
    );
    if (videoItem && videoItem.url && typeof videoItem.url === 'string') {
      return videoItem.url.trim();
    }
    const firstItem = ad.media_gallery[0];
    if (firstItem && firstItem.url && typeof firstItem.url === 'string') {
      if (firstItem.type === 'video' || firstItem.url.match(/\.(mp4|webm|mov|m3u8|ogv)/i)) {
        return firstItem.url.trim();
      }
    }
  }
  if (ad.image_url && typeof ad.image_url === 'string' && ad.image_url.match(/\.(mp4|webm|mov|m3u8|ogv)/i)) {
    return ad.image_url.trim();
  }
  return '';
}
