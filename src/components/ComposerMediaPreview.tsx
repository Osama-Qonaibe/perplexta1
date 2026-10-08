import React, { useState, useEffect, useRef } from 'react';
import { Edit3, X, Film, Plus, Scissors, Play, Camera, Check, RefreshCw, ImagePlus, UploadCloud } from 'lucide-react';
import { toast } from '@/design-system';
import { MediaGalleryItem } from '../../server/db/types';
import { getMediaUrl, extractRecommendedVideoFrames, RecommendedFrameItem } from '../utils/mediaUtils';
import { StrictMediaContainer } from './StrictMediaContainer';

interface ComposerMediaPreviewProps {
  mediaItems: MediaGalleryItem[];
  onOpenMediaManager: () => void;
  onClearAll: () => void;
  onAddMoreClick: () => void;
  isRtl: boolean;
  onSelectCover?: (coverUrl: string, file?: File) => void;
  onOpenTrimmer?: () => void;
}

export const ComposerMediaPreview: React.FC<ComposerMediaPreviewProps> = ({
  mediaItems,
  onOpenMediaManager,
  onClearAll,
  onAddMoreClick,
  isRtl,
  onSelectCover,
  onOpenTrimmer
}) => {
  const coverObjectUrlRef = useRef<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const playerVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoAspect, setVideoAspect] = useState<'9:16' | '4:5' | '1:1' | '16:9'>('16:9');
  
  // Recommended stopping frames (keyframes) state
  const [recommendedFrames, setRecommendedFrames] = useState<RecommendedFrameItem[]>([]);
  const [isExtractingFrames, setIsExtractingFrames] = useState<boolean>(false);
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string>('');

  useEffect(() => {
    return () => {
      if (coverObjectUrlRef.current && coverObjectUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(coverObjectUrlRef.current);
        } catch (_) {}
      }
    };
  }, []);

  // Single video keyframe extraction for recommended stopping frames
  const singleVideoItem = (mediaItems && mediaItems.length === 1 && mediaItems[0].type === 'video') ? mediaItems[0] : null;
  const singleVideoUrl = singleVideoItem?.url || '';

  useEffect(() => {
    if (!singleVideoUrl) {
      setRecommendedFrames([]);
      setIsExtractingFrames(false);
      return;
    }

    let isCancelled = false;
    setIsExtractingFrames(true);

    extractRecommendedVideoFrames(singleVideoUrl, 6)
      .then((frames) => {
        if (isCancelled) return;
        setRecommendedFrames(frames);
        setIsExtractingFrames(false);
        // If no cover is selected yet and we found frames, default to the first frame
        if (!selectedFrameUrl && frames.length > 0 && onSelectCover) {
          handlePickFrame(frames[0].dataUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsExtractingFrames(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [singleVideoUrl]);

  if (!mediaItems || mediaItems.length === 0) return null;

  const totalCount = mediaItems.length;

  const handlePickFrame = (dataUrl: string) => {
    setSelectedFrameUrl(dataUrl);
    if (!onSelectCover) return;

    try {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `cover_frame_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onSelectCover(dataUrl, file);
        })
        .catch(() => {
          onSelectCover(dataUrl);
        });
    } catch (_) {
      onSelectCover(dataUrl);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isRtl ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }

    if (coverObjectUrlRef.current && coverObjectUrlRef.current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(coverObjectUrlRef.current);
      } catch (_) {}
    }

    const previewUrl = URL.createObjectURL(file);
    coverObjectUrlRef.current = previewUrl;
    setSelectedFrameUrl(previewUrl);

    if (onSelectCover) {
      onSelectCover(previewUrl, file);
    }
    toast.success(isRtl ? 'تم رفع وتعيين صورة الغلاف بنجاح' : 'Cover image uploaded and set as cover');

    e.target.value = '';
  };

  const handleCaptureCurrentPlaybackFrame = () => {
    const video = playerVideoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(1280, video.videoWidth || 640);
      canvas.height = Math.min(720, video.videoHeight || 360);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        handlePickFrame(dataUrl);
        toast.success(isRtl ? 'تم التقاط وتعيين لقطة التوقف الحالية كغلاف' : 'Current frame captured and set as cover');
      }
    } catch (e) {
      console.warn('Playback frame capture error:', e);
    }
  };

  // Single Video Mode: Ultra-clean card with dynamic aspect ratio and recommended stopping frames
  if (totalCount === 1 && mediaItems[0].type === 'video') {
    const item = mediaItems[0];
    const mediaSrc = getMediaUrl(item.url);
    const posterUrl = selectedFrameUrl || (item.thumbnailUrl ? getMediaUrl(item.thumbnailUrl) : undefined);

    return (
      <div className="relative w-full rounded-shape-md overflow-hidden border border-[var(--border-default)] bg-black shadow-xs mt-2 sm:mt-3 select-none">
        {/* Top Minimal Action Overlay */}
        <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between pointer-events-none">
          {/* Professional Cover Upload Button (غلاف مخصص مدمج وليس محتوى إضافي) */}
          <div className="pointer-events-auto flex items-center">
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleCoverFileUpload}
            />
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-shape-sm bg-black/75 hover:bg-black/95 backdrop-blur-md text-white border border-white/20 hover:border-accent/60 transition-all cursor-pointer shadow-md active:scale-95 text-xs font-bold group/cover"
              title={isRtl ? 'رفع صورة غلاف مخصصة للفيديو' : 'Upload custom cover image'}
            >
              <ImagePlus size={14} className="text-accent group-hover/cover:scale-110 transition-transform" />
              <span>{isRtl ? (selectedFrameUrl ? 'تغيير الغلاف' : 'رفع غلاف') : (selectedFrameUrl ? 'Change Cover' : 'Upload Cover')}</span>
              {selectedFrameUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] animate-pulse" />
              )}
            </button>
          </div>

          {/* Minimal controls: Trim & Remove */}
          <div className="pointer-events-auto flex items-center gap-1">
            {onOpenTrimmer && (
              <button
                type="button"
                onClick={onOpenTrimmer}
                className="w-7 h-7 rounded-shape-sm bg-black/70 hover:bg-black/90 backdrop-blur-md text-white border border-white/10 hover:border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title={isRtl ? 'قص وضبط الفيديو' : 'Trim video'}
              >
                <Scissors size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={onClearAll}
              className="w-7 h-7 rounded-shape-sm bg-black/70 hover:bg-red-600/90 backdrop-blur-md text-white border border-white/10 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title={isRtl ? 'إزالة الفيديو' : 'Remove video'}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Aspect Ratio Video Player Stage - Adapts to 9:16 vertical, 4:5, 1:1, or 16:9 widescreen (Optimized Compact Footprint) */}
        <div className={`relative w-full overflow-hidden bg-black flex items-center justify-center transition-all duration-300 ${
          videoAspect === '9:16' ? 'aspect-[9/16] max-h-[250px] sm:max-h-[280px] mx-auto' :
          videoAspect === '4:5' ? 'aspect-[4/5] max-h-[230px] sm:max-h-[260px] mx-auto' :
          videoAspect === '1:1' ? 'aspect-square max-h-[210px] sm:max-h-[240px] mx-auto' :
          'aspect-video max-h-[190px] sm:max-h-[220px] mx-auto'
        }`}>
          {/* Ambient Video Blur Backdrop */}
          <video
            src={mediaSrc}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 pointer-events-none scale-110"
          />
          <video
            ref={playerVideoRef}
            src={mediaSrc}
            poster={posterUrl}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                const r = v.videoWidth / v.videoHeight;
                if (r <= 0.68) setVideoAspect('9:16');
                else if (r < 0.92) setVideoAspect('4:5');
                else if (r <= 1.15) setVideoAspect('1:1');
                else setVideoAspect('16:9');
              }
            }}
            className="relative z-10 w-full h-full object-contain mx-auto"
          />
        </div>

        {/* Recommended Stopping Frames (لقطات موصى بها للتوقف) Section - Compact & Space-Efficient */}
        <div className="bg-[var(--surface-card)] border-t border-[var(--border-default)] p-2 sm:p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)]">
              <Camera size={13} className="text-accent shrink-0" />
              <span className="truncate">{isRtl ? 'لقطات موصى بها للغلاف' : 'Recommended Cover Frames'}</span>
              {isExtractingFrames && (
                <span className="flex items-center gap-1 text-[9px] text-accent font-normal shrink-0">
                  <RefreshCw size={9} className="animate-spin" />
                  <span>{isRtl ? 'جارٍ...' : 'Extracting...'}</span>
                </span>
              )}
            </div>

            {/* Instant Capture from current video playback */}
            <button
              type="button"
              onClick={handleCaptureCurrentPlaybackFrame}
              className="px-2 py-0.5 text-[10px] font-bold rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-accent)] flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title={isRtl ? 'التقاط الموضع الحالي المتوقف عنده الفيديو' : 'Capture current video frame'}
            >
              <Camera size={11} className="text-accent" />
              <span>{isRtl ? 'التقاط الحالي' : 'Capture'}</span>
            </button>
          </div>

          {/* Recommended Frames Strip with Aspect-Aware Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-thin">
            {isExtractingFrames && recommendedFrames.length === 0 ? (
              // Loading skeleton placeholders
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-shape-xs bg-[var(--surface-subtle)] animate-pulse shrink-0 border border-[var(--border-subtle)] ${
                    videoAspect === '9:16' ? 'w-8 sm:w-9 h-12 sm:h-14 aspect-[9/16]' :
                    videoAspect === '1:1' ? 'w-10 sm:w-11 h-10 sm:h-11 aspect-square' :
                    videoAspect === '4:5' ? 'w-9 sm:w-10 h-11 sm:h-13 aspect-[4/5]' :
                    'w-14 sm:w-16 h-8 sm:h-9 aspect-video'
                  }`}
                />
              ))
            ) : recommendedFrames.length > 0 ? (
              recommendedFrames.map((frame, index) => {
                const isSelected = selectedFrameUrl === frame.dataUrl;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePickFrame(frame.dataUrl)}
                    className={`relative rounded-shape-xs overflow-hidden shrink-0 border transition-all cursor-pointer group/frame active:scale-95 ${
                      videoAspect === '9:16' ? 'w-8 sm:w-9 h-12 sm:h-14 aspect-[9/16]' :
                      videoAspect === '1:1' ? 'w-10 sm:w-11 h-10 sm:h-11 aspect-square' :
                      videoAspect === '4:5' ? 'w-9 sm:w-10 h-11 sm:h-13 aspect-[4/5]' :
                      'w-14 sm:w-16 h-8 sm:h-9 aspect-video'
                    } ${
                      isSelected
                        ? 'ring-1.5 ring-accent border-accent shadow-xs'
                        : 'border-[var(--border-default)] hover:border-[var(--border-accent)] opacity-85 hover:opacity-100'
                    }`}
                    title={isRtl ? `تحديد لقطة ${frame.timeLabel} كغلاف` : `Select frame at ${frame.timeLabel}`}
                  >
                    <img
                      src={frame.dataUrl}
                      alt={`Frame ${frame.timeLabel}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Timestamp Badge */}
                    <span className="absolute bottom-0.5 end-0.5 px-0.5 py-0.2 rounded-[2px] bg-black/80 text-white text-[8px] font-mono font-bold pointer-events-none leading-none">
                      {frame.timeLabel}
                    </span>
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-0.5 start-0.5 w-3.5 h-3.5 rounded-full bg-accent text-white flex items-center justify-center shadow-xs">
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-[10px] text-[var(--text-muted)] py-0.5">
                {isRtl ? 'شغّل المقطع وتوقف عند أي لقطة ثم اضغط "التقاط الحالي"' : 'Play video, pause and click "Capture"'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderMediaThumbnail = (item: MediaGalleryItem, index: number, isLastWithMore = false, remainingCount = 0) => {
    const isVideo = item.type === 'video';
    const mediaSrc = getMediaUrl(item.url);
    const hasCustomThumbnail = Boolean(item.thumbnailUrl && item.thumbnailUrl !== item.url);
    const posterUrl = hasCustomThumbnail ? getMediaUrl(item.thumbnailUrl!) : undefined;
    const videoSrcWithTime = mediaSrc.includes('#') ? mediaSrc : `${mediaSrc}#t=0.5`;
    const displayUrl = hasCustomThumbnail ? getMediaUrl(item.thumbnailUrl!) : mediaSrc;

    return (
      <div
        key={item.id || index}
        onClick={onOpenMediaManager}
        className="relative w-full h-full overflow-hidden bg-[var(--surface-subtle)] cursor-pointer group select-none"
      >
        {isVideo ? (
          <>
            <video
              src={videoSrcWithTime}
              poster={posterUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-media pointer-events-none"
              muted
              playsInline
              preload="metadata"
            />
            {/* Play Badge Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-black/60 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-md">
                <Play size={18} className="fill-white translate-x-0.5" />
              </div>
            </div>
            <span className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-black/70 text-white text-[10px] font-medium flex items-center gap-1">
              <Film size={10} />
              <span>{isRtl ? 'فيديو' : 'Video'}</span>
            </span>
          </>
        ) : (
          <img
            src={displayUrl}
            alt="Media preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-media"
            loading="lazy"
          />
        )}

        {/* Hover highlight */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Overflow +N Overlay (Facebook Style) */}
        {isLastWithMore && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-wide font-mono">+{remainingCount}</span>
            <span className="text-[11px] font-semibold text-white/90 mt-0.5">
              {isRtl ? 'عناصر أخرى' : 'more'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderCollageLayout = () => {
    // 1 Item
    if (totalCount === 1) {
      const item = mediaItems[0];
      const isVideo = item.type === 'video';
      const mediaSrc = getMediaUrl(item.url);
      const displayUrl = item.thumbnailUrl ? getMediaUrl(item.thumbnailUrl) : mediaSrc;
      return (
        <div
          onClick={onOpenMediaManager}
          className="w-full max-h-[220px] sm:max-h-[260px] overflow-hidden cursor-pointer rounded-shape-sm bg-[#0a0a0a] flex items-center justify-center relative"
        >
          {isVideo ? (
            <video
              src={mediaSrc}
              className="max-h-[220px] sm:max-h-[260px] w-full object-contain mx-auto"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={displayUrl}
              alt="Preview"
              className="max-h-[220px] sm:max-h-[260px] w-full object-contain mx-auto"
            />
          )}
        </div>
      );
    }

    // 2 Items: 2 equal columns
    if (totalCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-[130px] sm:h-[160px]">
          {renderMediaThumbnail(mediaItems[0], 0)}
          {renderMediaThumbnail(mediaItems[1], 1)}
        </div>
      );
    }

    // 3 Items: 1 large on top/side, 2 smaller
    if (totalCount === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[140px] sm:h-[180px]">
          <div className="row-span-2 col-span-1">
            {renderMediaThumbnail(mediaItems[0], 0)}
          </div>
          <div className="col-span-1 row-span-1">
            {renderMediaThumbnail(mediaItems[1], 1)}
          </div>
          <div className="col-span-1 row-span-1">
            {renderMediaThumbnail(mediaItems[2], 2)}
          </div>
        </div>
      );
    }

    // 4 Items: 2x2 grid
    if (totalCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[140px] sm:h-[180px]">
          {renderMediaThumbnail(mediaItems[0], 0)}
          {renderMediaThumbnail(mediaItems[1], 1)}
          {renderMediaThumbnail(mediaItems[2], 2)}
          {renderMediaThumbnail(mediaItems[3], 3)}
        </div>
      );
    }

    // 5 or more Items: Facebook 4-quadrant layout with +N on the 4th item
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-[140px] sm:h-[180px]">
        {renderMediaThumbnail(mediaItems[0], 0)}
        {renderMediaThumbnail(mediaItems[1], 1)}
        {renderMediaThumbnail(mediaItems[2], 2)}
        {renderMediaThumbnail(mediaItems[3], 3, true, totalCount - 4)}
      </div>
    );
  };

  return (
    <div className="relative w-full rounded-shape-md overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs mt-1.5 sm:mt-2 group/box transition-theme">
      {/* Top Floating Action Bar */}
      <div className="absolute top-1.5 inset-x-1.5 z-20 flex items-center justify-between pointer-events-auto">
        {/* Left Side: "تعديل الكل" (Edit All) Button + Count */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onOpenMediaManager}
            className="inline-flex items-center gap-1 px-2 py-0.5 min-h-[26px] sm:min-h-[28px] rounded-shape-xs bg-black/75 hover:bg-black/90 text-white text-[10px] sm:text-[11px] font-bold shadow-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95 focus:outline-none"
            title={isRtl ? 'تعديل الصور والفيديوهات وإضافة شرح توضيحي' : 'Edit photos & videos'}
          >
            <Edit3 size={11} className="text-accent" />
            <span>{isRtl ? 'تعديل الكل' : 'Edit All'}</span>
          </button>

          <span className="px-1.5 py-0.5 min-h-[26px] sm:min-h-[28px] inline-flex items-center rounded-shape-xs bg-black/75 text-white text-[9px] sm:text-[10px] font-mono font-bold backdrop-blur-md border border-white/20 shadow-xs">
            {totalCount} {isRtl ? (totalCount === 1 ? 'عنصر' : 'عناصر') : (totalCount === 1 ? 'item' : 'items')}
          </span>
        </div>

        {/* Right Side: Add more & Remove all */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAddMoreClick}
            className="p-1 min-h-[26px] min-w-[26px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center rounded-shape-xs bg-black/75 hover:bg-black/90 text-white text-xs shadow-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95"
            title={isRtl ? 'إضافة المزيد من الوسائط' : 'Add more media'}
          >
            <Plus size={13} />
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="p-1 min-h-[26px] min-w-[26px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center rounded-shape-xs bg-black/75 hover:bg-red-600/90 text-white shadow-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95"
            title={isRtl ? 'حذف جميع الوسائط المرفوعة' : 'Clear all media'}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Collage Display */}
      {renderCollageLayout()}
    </div>
  );
};
