/**
 * PERPLEXTA PLATFORM - Smart Image Crop, Compression & Optimization Utility
 * Enforces standardized, lightweight, and server-friendly dimensions for Banners and Avatars.
 */

export interface OptimizeImageOptions {
  maxWidth: number;
  maxHeight: number;
  aspectRatio?: number; // width / height ratio e.g. 3 for 3:1 (Cover) or 1 for 1:1 (Avatar)
  quality?: number; // 0.1 to 1.0 (default 0.82)
  outputFormat?: 'image/jpeg' | 'image/webp';
}

/**
 * Standard recommended dimensions for the platform
 */
export const RECOMMENDED_IMAGE_SPECS = {
  cover: {
    width: 1200,
    height: 400,
    aspectRatio: 3 / 1,
    labelAr: 'غلاف الصفحة: 1200×400 بكسل (نسبة 3:1) - الحد الأقصى 1 ميجابايت',
    labelEn: 'Banner Cover: 1200×400px (3:1 ratio) - Max 1MB'
  },
  avatar: {
    width: 400,
    height: 400,
    aspectRatio: 1 / 1,
    labelAr: 'شعار الصفحة: 400×400 بكسل (نسبة 1:1) - الحد الأقصى 500 كيلوبايت',
    labelEn: 'Avatar / Logo: 400×400px (1:1 ratio) - Max 500KB'
  }
};

/**
 * Perform smart center-crop and lightweight resize using HTML5 Canvas
 */
export async function optimizeImageUpload(
  file: File,
  options: OptimizeImageOptions
): Promise<File> {
  // If not an image, return raw file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        try {
          const {
            maxWidth,
            maxHeight,
            aspectRatio = maxWidth / maxHeight,
            quality = 0.82,
            outputFormat = 'image/jpeg'
          } = options;

          // Calculate center crop source rect based on target aspect ratio
          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;

          const imgAspectRatio = img.width / img.height;

          if (imgAspectRatio > aspectRatio) {
            // Image is wider than target -> crop sides
            srcW = img.height * aspectRatio;
            srcX = (img.width - srcW) / 2;
          } else if (imgAspectRatio < aspectRatio) {
            // Image is taller than target -> crop top/bottom
            srcH = img.width / aspectRatio;
            srcY = (img.height - srcH) / 2;
          }

          // Output canvas size (capped at target max dimensions)
          let destW = maxWidth;
          let destH = maxHeight;

          // If original cropped source is smaller than max, scale down proportional or keep source size
          if (srcW < maxWidth && srcH < maxHeight) {
            destW = Math.round(srcW);
            destH = Math.round(srcH);
          }

          const canvas = document.createElement('canvas');
          canvas.width = destW;
          canvas.height = destH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Enable high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill background with white/black in case of transparent PNG conversion
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, destW, destH);

          // Draw cropped & scaled image
          ctx.drawImage(
            img,
            srcX, srcY, srcW, srcH,
            0, 0, destW, destH
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const ext = outputFormat === 'image/webp' ? '.webp' : '.jpg';
              const cleanName = file.name.replace(/\.[^/.]+$/, '') + '_opt' + ext;
              const optimizedFile = new File([blob], cleanName, {
                type: outputFormat,
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            },
            outputFormat,
            quality
          );
        } catch (err) {
          console.warn('[ImageOptimizer] Crop error, falling back to original file:', err);
          resolve(file);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
