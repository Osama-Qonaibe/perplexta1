import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Check, RefreshCw, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { toast } from '@/design-system';

interface VideoFrameCaptureProps {
  videoUrl: string;
  currentCoverUrl?: string;
  onSelectCover: (coverUrl: string, blob?: Blob) => void;
  onRemoveCover?: () => void;
  isRtl?: boolean;
}

export const VideoFrameCapture: React.FC<VideoFrameCaptureProps> = ({
  videoUrl,
  currentCoverUrl,
  onSelectCover,
  onRemoveCover,
  isRtl = true,
}) => {
  const [keyframes, setKeyframes] = useState<{ time: number; dataUrl: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string>(currentCoverUrl || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  const playerVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customCoverUrlRef = useRef<string | null>(null);

  // Clean up allocated custom cover object URL on unmount
  useEffect(() => {
    return () => {
      if (customCoverUrlRef.current && customCoverUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(customCoverUrlRef.current);
        } catch (_) {}
      }
    };
  }, []);

  // Sync external currentCoverUrl
  useEffect(() => {
    if (currentCoverUrl) {
      setSelectedFrameUrl(currentCoverUrl);
    }
  }, [currentCoverUrl]);

  // Extract keyframes when videoUrl changes
  useEffect(() => {
    if (!videoUrl) return;

    let isCancelled = false;
    setIsExtracting(true);
    setKeyframes([]);

    const video = document.createElement('video');
    if (!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      if (isCancelled) return;
      const dur = video.duration || 1;
      setDuration(dur);

      const targetCount = 5;
      const step = dur / (targetCount + 1);
      const times = Array.from({ length: targetCount }, (_, i) => (i + 1) * step);
      const extracted: { time: number; dataUrl: string }[] = [];

      for (const time of times) {
        if (isCancelled) break;
        try {
          const frame = await captureVideoFrameAtTime(video, time);
          if (frame) {
            extracted.push({ time, dataUrl: frame });
            if (!isCancelled) {
              setKeyframes([...extracted]);
            }
          }
        } catch (e) {
          console.error('Frame capture error:', e);
        }
      }

      if (!isCancelled) {
        setIsExtracting(false);
        // If no cover selected yet, auto-select the first frame
        if (!selectedFrameUrl && extracted.length > 0) {
          setSelectedFrameUrl(extracted[0].dataUrl);
          onSelectCover(extracted[0].dataUrl);
        }
      }
    };

    video.onerror = () => {
      if (!isCancelled) setIsExtracting(false);
    };

    return () => {
      isCancelled = true;
    };
  }, [videoUrl]);

  // Helper to seek and capture a single frame
  const captureVideoFrameAtTime = (video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve('');
        }
      }, 1200);

      const handleSeeked = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        video.removeEventListener('seeked', handleSeeked);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            resolve(dataUrl);
            return;
          }
        } catch (err) {
          console.error('Canvas capture failed:', err);
        }
        resolve('');
      };

      video.addEventListener('seeked', handleSeeked, { once: true });
      video.currentTime = Math.min(Math.max(0, time), video.duration || 1);
    });
  };

  // Toggle Video Play / Pause
  const togglePlay = () => {
    if (!playerVideoRef.current) return;
    if (isPlaying) {
      playerVideoRef.current.pause();
    } else {
      playerVideoRef.current.play().catch(e => console.warn('Video play prevented:', e));
    }
  };

  // Seek video manually
  const handleSeek = (time: number) => {
    if (!playerVideoRef.current) return;
    const clamped = Math.max(0, Math.min(time, duration || 1));
    playerVideoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // Step backwards / forwards by 0.5s for precise frame choosing
  const handleStepTime = (delta: number) => {
    if (!playerVideoRef.current) return;
    if (isPlaying) playerVideoRef.current.pause();
    handleSeek(currentTime + delta);
  };

  // Capture the current paused video frame
  const handleCaptureCurrentFrame = () => {
    const video = playerVideoRef.current;
    if (!video) return;

    // Pause video to freeze on this frame
    if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        setSelectedFrameUrl(dataUrl);
        onSelectCover(dataUrl);
        toast.success(isRtl ? `تم اختيار اللقطة الحالية (${formatTime(video.currentTime)}) كغلاف` : `Current frame set as cover (${formatTime(video.currentTime)})`);
      }
    } catch (err) {
      console.error('Failed to capture current frame:', err);
      toast.error(isRtl ? 'تعذر التقاط هذه اللقطة، حاول مجدداً' : 'Could not capture frame, please retry');
    }
  };

  // Handle Custom Cover Upload
  const handleCustomCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customCoverUrlRef.current && customCoverUrlRef.current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(customCoverUrlRef.current);
      } catch (_) {}
    }
    const url = URL.createObjectURL(file);
    customCoverUrlRef.current = url;
    setSelectedFrameUrl(url);
    onSelectCover(url, file);
    toast.success(isRtl ? 'تم تعيين صورة الغلاف' : 'Cover image selected');
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[var(--surface-subtle)] rounded-shape-md p-3 border border-[var(--border-default)] space-y-3">
      {/* Hidden file input for custom image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCustomCoverFile}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-shape-sm bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/20">
            <Film size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                {isRtl ? 'معالج وغلاف الفيديو' : 'Video Processor & Cover'}
              </span>
              {isExtracting && (
                <span className="text-[10px] text-accent flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" />
                  <span className="hidden sm:inline">{isRtl ? 'استخراج اللقطات...' : 'Extracting...'}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] truncate">
              {isRtl ? 'شغّل المقطع وتوقف عند اللقطة المفضلة لتثبيتها كغلاف للمنشور' : 'Play video & pause at your preferred moment to set as cover'}
            </p>
          </div>
        </div>

        {/* Upload Custom Image Button (Square with rounded corners) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 text-xs font-bold rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-accent)] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 active:scale-95"
          title={isRtl ? 'رفع صورة غلاف من الجهاز' : 'Upload custom cover'}
        >
          <ImageIcon size={13} className="text-accent" />
          <span className="hidden sm:inline">{isRtl ? 'رفع غلاف' : 'Upload Cover'}</span>
        </button>
      </div>

      {/* Interactive Video Player Container */}
      <div className="relative rounded-shape-sm overflow-hidden bg-black/90 border border-[var(--border-subtle)] shadow-inner">
        <div className="relative w-full aspect-video max-h-[220px] sm:max-h-[260px] flex items-center justify-center bg-black">
          <video
            ref={playerVideoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            preload="auto"
            crossOrigin={!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:') ? 'anonymous' : undefined}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setDuration(v.duration || 0);
              setIsVideoReady(true);
            }}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Central Play/Pause Watermark Button when paused */}
          {!isPlaying && isVideoReady && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isRtl ? 'تشغيل' : 'Play'}
              className="absolute inset-0 m-auto w-12 h-12 rounded-shape-sm bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Play size={20} className="fill-white translate-x-0.5" />
            </button>
          )}

          {/* Time Badge Overlay */}
          <div className="absolute top-2 start-2 px-2 py-0.5 rounded-shape-xs bg-black/75 text-white font-mono text-[10px] font-bold backdrop-blur-xs border border-white/10 shadow-xs pointer-events-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Video Scrubber & Playback Controls Toolbar */}
        <div className="p-2 bg-[var(--surface-card)] border-t border-[var(--border-subtle)] space-y-2">
          {/* Progress / Seek bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 w-9 text-center">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[var(--surface-subtle)] rounded-shape-xs appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 w-9 text-center">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls & Freeze-Frame Action Buttons */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {/* Play / Pause Toggle Button (Square with rounded corners) */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? (isRtl ? 'إيقاف' : 'Pause') : (isRtl ? 'تشغيل' : 'Play')}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0 active:scale-95"
                title={isPlaying ? (isRtl ? 'إيقاف مؤقت' : 'Pause') : (isRtl ? 'تشغيل' : 'Play')}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5 fill-current" />}
              </button>

              {/* Step Back 0.5s */}
              <button
                type="button"
                onClick={() => handleStepTime(-0.5)}
                aria-label={isRtl ? 'تراجع نصف ثانية' : 'Step back 0.5s'}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0 active:scale-95"
                title={isRtl ? 'تراجع نصف ثانية' : 'Step -0.5s'}
              >
                <ChevronRight size={15} />
              </button>

              {/* Step Forward 0.5s */}
              <button
                type="button"
                onClick={() => handleStepTime(0.5)}
                aria-label={isRtl ? 'تقدم نصف ثانية' : 'Step forward 0.5s'}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0 active:scale-95"
                title={isRtl ? 'تقدم نصف ثانية' : 'Step +0.5s'}
              >
                <ChevronLeft size={15} />
              </button>

              {/* Reset to Start */}
              <button
                type="button"
                onClick={() => handleSeek(0)}
                aria-label={isRtl ? 'إعادة للبداية' : 'Rewind to start'}
                className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0 active:scale-95"
                title={isRtl ? 'إعادة للبداية' : 'Rewind to start'}
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Freeze & Capture Button (Square with rounded corners) */}
            <button
              type="button"
              onClick={handleCaptureCurrentFrame}
              className="px-3 py-1.5 rounded-shape-sm font-bold text-xs bg-accent text-slate-950 hover:bg-accent/90 border border-accent flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Camera size={14} />
              <span>{isRtl ? 'تثبيت هذه اللقطة كغلاف' : 'Set this frame as cover'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Keyframes Thumbnails Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
          <span>{isRtl ? 'لقطات مقترحة من المقطع' : 'Suggested Keyframes'}</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {isRtl ? 'انقر على أي لقطة لمعاينتها وتعيينها' : 'Click any frame to preview & select'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
          {keyframes.map((kf, idx) => {
            const isSelected = selectedFrameUrl === kf.dataUrl;
            return (
              <button
                key={`kf-${idx}-${kf.time}`}
                type="button"
                onClick={() => {
                  handleSeek(kf.time);
                  setSelectedFrameUrl(kf.dataUrl);
                  onSelectCover(kf.dataUrl);
                  toast.success(isRtl ? `تم اختيار اللقطة (${formatTime(kf.time)}) كغلاف` : `Cover selected (${formatTime(kf.time)})`);
                }}
                className={`relative group shrink-0 w-16 sm:w-20 h-10 sm:h-12 rounded-shape-sm overflow-hidden border-2 transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 scale-102 shadow-sm'
                    : 'border-[var(--border-default)] hover:border-accent/60 opacity-80 hover:opacity-100'
                }`}
                title={formatTime(kf.time)}
              >
                <img
                  src={kf.dataUrl}
                  alt={`Keyframe at ${formatTime(kf.time)}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-mono text-center py-0.5">
                  {formatTime(kf.time)}
                </div>

                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-shape-xs bg-accent text-slate-950 flex items-center justify-center shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}

          {!isExtracting && keyframes.length === 0 && (
            <div className="text-[10px] text-[var(--text-muted)] py-2 w-full text-center">
              {isRtl ? 'جاري استخراج لقطات الفيديو...' : 'Extracting video frames...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
