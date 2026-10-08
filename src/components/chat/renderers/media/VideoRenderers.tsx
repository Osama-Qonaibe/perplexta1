import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Maximize2, 
  Download, 
  Share2, 
  X, 
  Clock, 
  Loader2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../../../context/AppContext';
import { Logo } from '../../../common/Logo';
import { ASPECT_RATIO_CLASSES } from '../../../../constants/chat';
import { useVideoPlayback } from '../../../../hooks/useVideoPlayback';

export const SimpleVideoLoadingPlaceholder = ({ dir, aspectRatio = '9:16' }: { dir: 'ltr' | 'rtl'; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['9:16'] || 'aspect-[9/16]';

  return (
    <div className="w-full flex flex-col my-2 items-start">
      <div 
        className={`relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)]/70 backdrop-blur-xl ${containerAspectClass} w-full`}
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

export const SimpleVideoErrorPlaceholder = ({ dir, errorMessage, onRetry, aspectRatio = '9:16' }: { dir: 'ltr' | 'rtl'; errorMessage?: string; onRetry?: () => void; aspectRatio?: string }) => {
  const containerAspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES['9:16'] || 'aspect-[9/16]';

  return (
    <div className="w-full flex flex-col my-3 items-start gap-3">
      <div 
        className={`relative overflow-hidden rounded-shape-lg border border-rose-500/30 bg-rose-500/10 ${containerAspectClass} w-full shadow-sm flex flex-col items-center justify-center p-6 text-center`}
      >
        <AlertTriangle className="text-rose-500 mb-3" size={24} />
        <span className="text-xs font-bold text-[var(--text-primary)] mb-1">
          {dir === 'rtl' ? 'تعذر إنتاج الفيديو' : 'Video synthesis failed'}
        </span>
        <span className="text-[10px] text-rose-500 font-medium break-words max-w-full leading-relaxed px-2">
          {errorMessage || (dir === 'rtl' ? 'خطأ غير معروف في توليد الفيديو.' : 'Unknown video generation error.')}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-shape-sm border border-rose-500/30 bg-[var(--surface-subtle)] text-rose-500 hover:bg-rose-500/20 transition-theme text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>{dir === 'rtl' ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const VideoPlaybackComponent = ({ src, dir: propDir, alt, title, ...props }: { src?: string; dir?: string; alt?: string; title?: string; [key: string]: any }) => {
  const { dir: contextDir } = useAppContext();
  const dir = propDir || contextDir || (document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
  const {
    shareStatus,
    isPreviewOpen,
    setIsPreviewOpen,
    isPlaying,
    setIsPlaying,
    isMuted,
    progress,
    currentTime,
    duration,
    isVideoLoaded,
    setIsVideoLoaded,

    isPreviewPlaying,
    setIsPreviewPlaying,
    isPreviewMuted,
    previewProgress,
    previewTime,
    previewDur,

    videoRef,
    previewVideoRef,

    cleanDisplayUrl,
    vidAspect,
    providerMeta,

    handleDownload,
    handleShare,
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,

    togglePreviewPlay,
    togglePreviewMute,
    handlePreviewSeek,
    handlePreviewTimeUpdate,
    handlePreviewLoadedMetadata,
  } = useVideoPlayback({ src, dir });

  const currentRatioClass = ASPECT_RATIO_CLASSES[vidAspect] || 'aspect-[16/9] max-w-[320px] sm:max-w-[340px]';

  return (
    <>
      <div className="w-full flex flex-col my-2 items-start">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={`relative group overflow-hidden rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-subtle)] ${currentRatioClass} w-full transition-all duration-300 shadow-sm`}
        >
          {providerMeta.isValid && (
            <div className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'} bg-[var(--surface-inset)]/85 backdrop-blur-md px-2 py-1 rounded-shape-xs border border-accent/10 text-[8px] font-mono text-accent z-10 transition-theme hover:border-accent/30 flex items-center gap-1`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-shape-xs bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-shape-xs h-1.5 w-1.5 bg-accent"></span>
              </span>
              <span>{providerMeta.label}</span>
            </div>
          )}

          {cleanDisplayUrl && (
            <video 
              key={cleanDisplayUrl}
              ref={videoRef}
              src={cleanDisplayUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedData={() => {
                setIsVideoLoaded(true);
              }}
              onLoadedMetadata={() => {
                setIsVideoLoaded(true);
                handleLoadedMetadata();
              }}
              onEnded={() => setIsPlaying(false)}
              onClick={() => setIsPreviewOpen(true)}
              className={`block w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`} 
              loop
              playsInline
              muted={isMuted}
            />
          )}

          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-inset)]/95 pointer-events-none z-20">
              <div className="flex flex-col items-center gap-2.5">
                <Loader2 size={24} className="animate-spin text-accent" />
                <span className="text-[10px] font-sans font-medium text-[var(--text-muted)] tracking-wide">
                  {dir === 'rtl' ? 'جاري التحميل...' : 'Loading video...'}
                </span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-theme pointer-events-none" />

          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto cursor-pointer"
          >
            <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-inset)]/80 backdrop-blur-md border border-[var(--border-default)] hover:border-accent/40 flex items-center justify-center text-accent hover:text-accent hover:scale-110 active:scale-95 transition-theme shadow-[0_0_20px_rgba(0,0,0,0.6)]">
              {isPlaying ? <Pause size={18} className="fill-[var(--accent)]" /> : <Play size={18} className="fill-[var(--accent)] ml-0.5" />}
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--surface-subtle)]/45 backdrop-blur-xs z-10 overflow-hidden pointer-events-none">
            <div 
              className="h-full bg-accent shadow-[0_0_8px_rgba(156,163,175,0.6)] transition-theme" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div 
            className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center backdrop-blur-[2px] z-10"
          >
            <div onClick={handleSeek} className="absolute top-0 inset-x-0 h-1.5 bg-[var(--surface-inset)] cursor-pointer overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)]">{currentTime.toFixed(0)}s</span>
              <span>/</span>
              <span>{duration ? `${duration.toFixed(0)}s` : '5s'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-accent hover:border-accent/35 hover:bg-[var(--surface-subtle)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 shadow-md relative before:absolute before:-inset-1.5 before:content-['']"
                title={isMuted ? (dir === 'rtl' ? 'إلغاء الكتم' : 'Unmute') : (dir === 'rtl' ? 'كتم الصوت' : 'Mute')}
              >
                {isMuted ? <VolumeX size={13} className="text-[var(--text-muted)]" /> : <Volume2 size={13} />}
              </button>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-accent hover:border-accent/35 hover:bg-[var(--surface-subtle)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 shadow-md relative before:absolute before:-inset-1.5 before:content-['']"
                title={dir === 'rtl' ? 'ملء الشاشة' : 'Fullscreen'}
              >
                <Maximize2 size={13} />
              </button>
              <button 
                onClick={handleShare}
                className={`w-8 h-8 rounded-shape-sm border flex items-center justify-center cursor-pointer transition-theme shadow-md active:scale-95 ${
                  shareStatus === 'copied' 
                    ? 'bg-accent/25 text-accent border-accent/45 hover:bg-accent/35' 
                    : 'bg-[var(--surface-card)] border border-[var(--border-default)] hover:text-accent hover:border-accent/35 hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                }`}
                title={dir === 'rtl' ? 'مشاركة' : 'Share'}
              >
                <Share2 size={13} className={shareStatus === 'sharing' ? 'animate-pulse text-accent' : ''} />
              </button>
              <button 
                onClick={handleDownload}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-accent hover:border-accent/35 hover:bg-[var(--surface-subtle)] transition-theme flex items-center justify-center cursor-pointer active:scale-95 shadow-md"
                title={dir === 'rtl' ? 'تنزيل' : 'Download'}
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex items-start gap-2 px-3 py-2 rounded-shape-sm bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-medium leading-relaxed w-full max-w-[360px] my-1">
          <Clock size={14} className="shrink-0 text-amber-500 mt-0.5" />
          <span>
            {dir === 'rtl' 
              ? 'ملاحظة: يتم حفظ ملفات الصور والفيديو على الخادم لمدة 48 ساعة فقط. يُرجى تنزيل أو حفظ صورك وفيديوهاتك المهمة على جهازك.' 
              : 'Notice: Media files are retained on the server for 48 hours only. Please download or save your important media to your device.'}
          </span>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isPreviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-955/98 backdrop-blur-2xl z-[999999] flex flex-col items-center justify-center select-none"
              onClick={() => setIsPreviewOpen(false)}
            >
              <div 
                className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/90 via-black/45 to-transparent flex items-center justify-between px-6 z-[1000]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-accent/90 tracking-widest uppercase font-mono">
                    {dir === 'rtl' ? 'عرض السينما الفائقة من بيربليكستا' : 'PERPLEXTA CINEMATIC PRO PREVIEW'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium font-sans">
                    {dir === 'rtl' ? 'مخرجات آلة توليد الفيديو المتكاملة بدقة ووضوح فائقين' : 'Engineered high-fidelity video production container'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-accent hover:border-accent/40 hover:bg-[var(--surface-subtle)] transition-theme flex items-center justify-center cursor-pointer shadow-lg active:scale-95 touch-target-44"
                    title={dir === 'rtl' ? 'تنزيل' : 'Download'}
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-accent hover:border-accent/40 hover:bg-[var(--surface-subtle)] transition-theme flex items-center justify-center cursor-pointer shadow-lg active:scale-95 touch-target-44"
                    title={dir === 'rtl' ? 'مشاركة' : 'Share'}
                  >
                    <Share2 size={15} />
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-10 h-10 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/45 transition-theme flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
                    title={dir === 'rtl' ? 'إغلاق' : 'Close'}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div 
                className="w-full h-full flex flex-col items-center justify-center p-6 relative animate-fade-in"
                onClick={() => setIsPreviewOpen(false)}
              >
                <motion.div
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.95, opacity: 0 }}
                   transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                   className="relative max-w-[90vw] max-h-[75vh] aspect-video flex items-center justify-center transition-shadow duration-500 bg-black rounded-shape-sm border border-[var(--border-default)]/80 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.85)]"
                   onClick={(e) => e.stopPropagation()}
                >
                  {cleanDisplayUrl && (
                    <video
                      key={cleanDisplayUrl}
                      ref={previewVideoRef}
                      src={cleanDisplayUrl}
                      onTimeUpdate={handlePreviewTimeUpdate}
                      onLoadedMetadata={handlePreviewLoadedMetadata}
                      onEnded={() => setIsPreviewPlaying(false)}
                      onClick={togglePreviewPlay}
                      className="max-w-full max-h-[70vh] rounded-shape-sm object-contain block focus:outline-none"
                      loop
                      preload="auto"
                      muted={isPreviewMuted}
                      playsInline
                    />
                  )}

                  <div 
                    onClick={togglePreviewPlay}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-[var(--radius-sm)] bg-[var(--surface-inset)]/80 backdrop-blur-md border border-[var(--border-default)]/80 flex items-center justify-center text-accent shadow-2xl">
                      {isPreviewPlaying ? <Pause size={24} className="fill-[var(--accent)]" /> : <Play size={24} className="fill-[var(--accent)] ml-1" />}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div 
                className="absolute bottom-8 bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border-default)] shadow-[0_15px_40px_rgba(0,0,0,0.5)] z-[1000] px-5 py-3 rounded-[var(--radius-md)] flex items-center gap-4 text-xs font-mono select-none w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePreviewPlay}
                    className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 text-accent hover:text-accent flex items-center justify-center active:scale-95 transition-theme"
                    title={isPreviewPlaying ? (dir === 'rtl' ? 'إيقاف' : 'Pause') : (dir === 'rtl' ? 'تشغيل' : 'Play')}
                  >
                    {isPreviewPlaying ? <Pause size={13} className="fill-[var(--accent)]" /> : <Play size={13} className="fill-[var(--accent)] ml-0.5" />}
                  </button>

                  <button
                    onClick={togglePreviewMute}
                    className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 text-accent hover:text-accent flex items-center justify-center active:scale-95 transition-theme"
                    title={isPreviewMuted ? (dir === 'rtl' ? 'إلغاء كتم الصوت' : 'Unmute') : (dir === 'rtl' ? 'كتم الصوت' : 'Mute')}
                  >
                    {isPreviewMuted ? <VolumeX size={13} className="text-[var(--text-muted)]" /> : <Volume2 size={13} />}
                  </button>
                </div>

                <div 
                  onClick={handlePreviewSeek} 
                  className="flex-1 h-1.5 bg-[var(--surface-inset)]/80 rounded-[var(--radius-sm)] cursor-pointer relative overflow-hidden"
                >
                  <div 
                    className="h-full bg-accent transition-theme shadow-[0_5px_10px_rgba(156,163,175,0.3)]" 
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-[var(--text-muted)] select-none">
                  <span className="text-[var(--text-primary)] font-bold">{previewTime.toFixed(0)}s</span>
                  <span className="text-[var(--border-default)]">/</span>
                  <span>{previewDur ? `${previewDur.toFixed(0)}s` : '5s'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export const MarkdownVideo = React.memo((props: any) => (
  <VideoPlaybackComponent 
    src={props.src} 
    alt={props.alt || "Generated Video"}
    {...props} 
  />
));
