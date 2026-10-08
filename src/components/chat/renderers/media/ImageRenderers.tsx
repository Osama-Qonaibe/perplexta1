import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Maximize2, 
  Download, 
  Palette
} from 'lucide-react';
import { toast } from '@/design-system';
import { useAppContext } from '../../../../context/AppContext';
import { ArtifactContext } from '../../../../context/ArtifactContext';
import { ASPECT_RATIO_CLASSES } from '../../../../constants/chat';

export const SimpleImageLoadingPlaceholder = ({ dir, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  return (
    <div className="w-full flex flex-col my-2 items-start">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)]/70 backdrop-blur-xl ${containerAspectClass} w-full`}
      >
        {/* Calm, serene ambient breathing pulse */}
        <motion.div
          animate={{
            opacity: [0.35, 0.65, 0.35],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4.0,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-br from-accent/10 via-[var(--surface-card)]/50 to-accent/5 pointer-events-none"
        />

        {/* Gentle, subtle light sheen sweep */}
        <motion.div
          animate={{
            x: dir === 'rtl' ? ['160%', '-160%'] : ['-160%', '160%']
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] dark:via-white/[0.03] to-transparent skew-x-12 pointer-events-none z-10"
        />
      </div>
    </div>
  );
};

export const SimpleImageErrorPlaceholder = ({ dir, errorMessage, onRetry, aspectRatio = '1:1' }: { dir: 'ltr' | 'rtl'; errorMessage?: string; onRetry?: () => void; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['1:1'];

  return (
    <div className="w-full flex flex-col my-3 items-start gap-3">
      <div 
        className={`relative overflow-hidden rounded-shape-md border border-rose-500/30 bg-rose-500/10 ${containerAspectClass} w-full shadow-sm flex flex-col items-center justify-center p-6 text-center`}
      >
        <AlertTriangle className="text-rose-500 mb-3" size={24} />
        <span className="text-xs font-bold text-[var(--text-primary)] mb-1">
          {dir === 'rtl' ? 'تعذر إنشاء الصورة' : 'Synthesis failed'}
        </span>
        <span className="text-[10px] text-rose-500 font-medium break-words max-w-full leading-relaxed px-2">
          {errorMessage || (dir === 'rtl' ? 'خطأ غير معروف.' : 'Unknown generation error.')}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-shape-sm border border-rose-500/30 bg-[var(--surface-subtle)] text-rose-500 hover:bg-rose-500/20 transition-theme text-[11px] font-black uppercase cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>{dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

const loadedImageCache = new Set<string>();
loadedImageCache.clear();

export const ShareableImageOutput = ({ src, dir: propDir, alt }: { src?: string; dir?: string; alt?: string; [key: string]: any }) => {
  const { dir: contextDir } = useAppContext();
  const artifactContext = useContext(ArtifactContext);
  const dir = propDir || contextDir || (document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
  
  const rawSrc = (src || '').trim();
  const unescapedSrc = rawSrc.replace(/^!\[.*?\]\((.*?)\)$/, '$1').trim();
  const withoutHash = unescapedSrc.split('#')[0].trim();
  
  const cleanUrl = withoutHash.startsWith('http://') || withoutHash.startsWith('https://') || withoutHash.startsWith('data:') || withoutHash.startsWith('blob:')
    ? withoutHash
    : (withoutHash.startsWith('/') ? withoutHash : (withoutHash ? `/${withoutHash}` : ''));

  const aspectMatch = rawSrc.match(/#aspect=([0-9]+:[0-9]+)/);
  const selectedRatio = aspectMatch ? aspectMatch[1] : '1:1';
  const containerAspectClass = ASPECT_RATIO_CLASSES[selectedRatio] || ASPECT_RATIO_CLASSES['1:1'];

  const [isImageFocused, setIsImageFocused] = useState(() => Boolean(cleanUrl && loadedImageCache.has(cleanUrl)));
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!cleanUrl) return;

    if (loadedImageCache.has(cleanUrl) || (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0)) {
      setIsImageFocused(true);
      loadedImageCache.add(cleanUrl);
    }

    const timer = setTimeout(() => {
      setIsImageFocused(true);
      if (cleanUrl) loadedImageCache.add(cleanUrl);
    }, 400);

    return () => clearTimeout(timer);
  }, [cleanUrl]);

  const handleImageError = () => {
    if (retryCount < 3 && cleanUrl && !cleanUrl.startsWith('data:')) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      setTimeout(() => {
        if (imgRef.current) {
          const sep = cleanUrl.includes('?') ? '&' : '?';
          imgRef.current.src = `${cleanUrl}${sep}_r=${Date.now()}`;
        }
      }, 500 * nextRetry);
    } else {
      setIsImageFocused(true);
      setImageError(true);
    }
  };

  const handleEditImage = () => {
    if (!cleanUrl) return;
    if (!artifactContext) {
      toast.error(dir === 'rtl' ? 'محرر رينكس غير متوفر حالياً' : 'Rinex editor is not available');
      return;
    }
    
    // Open the image editor in the canvas layout
    artifactContext.setActiveArtifact({
      id: cleanUrl,
      title: dir === 'rtl' ? 'استوديو رينكس' : 'Rinex Studio',
      type: 'image',
      content: cleanUrl,
      version: 1,
      files: {}
    });
    artifactContext.setIsArtifactOpen(true);
    artifactContext.setActiveTab('preview');
    toast.success(dir === 'rtl' ? 'تم فتح الصورة في استوديو رينكس' : 'Image opened in Rinex Studio');
  };

  const handleDownload = async () => {
    if (!cleanUrl) return;
    try {
      const targetUrl = cleanUrl.startsWith('/') ? `${window.location.origin}${cleanUrl}` : cleanUrl;
      const cleanResponse = await fetch(targetUrl);
      const cleanBlob = await cleanResponse.blob();
      const cleanObjectUrl = window.URL.createObjectURL(cleanBlob);
      const link = document.createElement('a');
      link.href = cleanObjectUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(cleanObjectUrl);
      toast.success(dir === 'rtl' ? 'تم تنزيل الصورة بنجاح!' : 'Image downloaded successfully!');
    } catch (err) {
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.download = `Generated_Image_${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full flex flex-col my-2 items-start">
      {/* Image Container */}
      <div 
        className={`relative group overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] ${containerAspectClass} w-full transition-all duration-300 shadow-sm`}
      >
        {!imageError && cleanUrl && (
          <img 
            ref={imgRef}
            onLoad={() => {
              setIsImageFocused(true);
              setImageError(false);
              if (cleanUrl) loadedImageCache.add(cleanUrl);
            }}
            onError={handleImageError}
            src={cleanUrl}
            alt={alt || "Generated Image"}
            className="block w-full h-full object-cover select-none cursor-pointer"
            onClick={() => setIsPreviewOpen(true)}
            style={{
              filter: isImageFocused ? 'blur(0px)' : 'blur(8px)',
              opacity: isImageFocused ? 1 : 0.6,
              transition: 'filter 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Download, Edit, & Enlarge Buttons */}
        {isImageFocused && !imageError && (
          <div className={`absolute top-2 ${dir === 'rtl' ? 'left-2' : 'right-2'} flex items-center gap-1.5 z-25`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditImage();
              }}
              className="w-7 h-7 rounded-shape-xs bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تعديل وتأثيرات بعد الإنتاج' : 'Edit & Post-Production FX'}
            >
              <Palette size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تنزيل' : 'Download'}
            >
              <Download size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(true);
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/80 backdrop-blur-md border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--surface-subtle)] transition-colors shadow-md cursor-pointer"
              title={dir === 'rtl' ? 'تكبير' : 'Enlarge'}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}

        {!isImageFocused && !imageError && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[6px] pointer-events-none transition-all duration-300" />
        )}

        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/10 p-4 text-center">
            <AlertTriangle className="text-rose-500 mb-2" size={20} />
            <span className="text-[11px] font-bold text-rose-500">
              {dir === 'rtl' ? 'تعذر تحميل الصورة' : 'Failed to load image'}
            </span>
            <button
              onClick={() => {
                setImageError(false);
                setRetryCount(0);
                if (imgRef.current) {
                  const sep = cleanUrl.includes('?') ? '&' : '?';
                  imgRef.current.src = `${cleanUrl}${sep}_t=${Date.now()}`;
                }
              }}
              className="mt-2 text-[11px] underline font-bold cursor-pointer text-rose-500 hover:text-rose-600"
            >
              {dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal (Enlarge view) */}
      {isPreviewOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999999] flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={cleanUrl} 
              alt={alt || "Enlarged Image"} 
              className="max-w-full max-h-[82vh] object-contain rounded-shape-md shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleEditImage();
                }}
                className="px-4 py-2 min-h-[44px] rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 text-xs font-bold flex items-center gap-2 shadow-md transition-theme cursor-pointer"
              >
                <Palette size={14} />
                <span>{dir === 'rtl' ? 'تعديل الصورة' : 'Edit Image'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 border border-[var(--border-default)] backdrop-blur-md transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>{dir === 'rtl' ? 'تنزيل' : 'Download'}</span>
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
              >
                {dir === 'rtl' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
