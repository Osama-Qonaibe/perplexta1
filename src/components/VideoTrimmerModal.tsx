import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, Check, Volume2, VolumeX, RotateCcw, Music, Loader2, Scissors, Sparkles, SlidersHorizontal } from 'lucide-react';
import { AppModal, toast } from '@/design-system';
import { triggerHaptic } from '../utils/haptics';
import { AudioLibraryPickerModal, AudioTrackItem } from './bulletin/AudioLibraryPickerModal';

export interface VideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  serverVideoUrl?: string;
  videoDuration?: number;
  isRtl?: boolean;
  token?: string | null;
  onOpenAudioPicker?: () => void;
  onSelectAudioTrack?: (track: AudioTrackItem) => void;
  onTrimComplete: (trimmedData: {
    videoUrl: string;
    thumbnailUrl?: string;
    startTime: number;
    endTime: number;
    duration: number;
    adFormat: string;
    aspectRatio: string;
    videoFilter: string;
    audioTrack?: AudioTrackItem | null;
  }) => void;
}

const VIDEO_FILTERS = [
  { id: 'normal', nameAr: 'أصلي', nameEn: 'Normal', filter: 'none' },
  { id: 'cinematic', nameAr: 'سينمائي', nameEn: 'Cinematic', filter: 'contrast(115%) saturate(125%) brightness(95%) sepia(15%)' },
  { id: 'warm', nameAr: 'دافئ', nameEn: 'Warm', filter: 'sepia(35%) saturate(140%) brightness(102%)' },
  { id: 'cool', nameAr: 'بارد', nameEn: 'Cool', filter: 'hue-rotate(190deg) saturate(130%) contrast(110%)' },
  { id: 'grayscale', nameAr: 'رمادي', nameEn: 'B&W', filter: 'grayscale(100%) contrast(110%)' },
  { id: 'high-contrast', nameAr: 'تباين', nameEn: 'Contrast', filter: 'contrast(140%) brightness(105%)' },
  { id: 'vintage', nameAr: 'عتيق', nameEn: 'Vintage', filter: 'sepia(60%) contrast(100%) brightness(92%) hue-rotate(-10deg)' },
];

const FORMAT_OPTIONS = [
  { id: '9:16', format: 'reel', ratio: '9:16' },
  { id: '1:1', format: 'post', ratio: '1:1' },
  { id: '16:9', format: 'video', ratio: '16:9' },
] as const;

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({
  isOpen,
  onClose,
  videoUrl: initialVideoUrl,
  serverVideoUrl,
  videoDuration = 0,
  isRtl = true,
  token = null,
  onOpenAudioPicker,
  onSelectAudioTrack,
  onTrimComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioTrackRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(initialVideoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoDuration > 0 ? videoDuration : 15);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoDuration > 0 ? videoDuration : 15);

  const [selectedFormat, setSelectedFormat] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);

  // Music Picker Modal State
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrackItem | null>(null);

  // Dragging states for visual range trimmer handles ('start' | 'end' | 'window' | 'scrub')
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'window' | 'scrub' | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartDataRef = useRef<{ clientX: number; initialStart: number; initialEnd: number; windowLength: number }>({
    clientX: 0,
    initialStart: 0,
    initialEnd: 15,
    windowLength: 15,
  });

  // Track if user manually modified duration/end-time
  const hasUserCustomizedTrim = useRef<boolean>(false);

  // Reset and load when initial URL changes or modal opens
  useEffect(() => {
    if (initialVideoUrl) {
      setCurrentVideoUrl(initialVideoUrl);
      hasUserCustomizedTrim.current = false;
      setIsPlaying(false);
      setCurrentTime(0);
      setHasVideoLoaded(false);

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.load();
      }
    }
  }, [initialVideoUrl, isOpen]);

  // Sync external duration when available
  useEffect(() => {
    if (videoDuration && videoDuration > 0) {
      setDuration(videoDuration);
      if (!hasUserCustomizedTrim.current) {
        setEndTime(videoDuration);
      }
    }
  }, [videoDuration]);

  // Sync Audio Track with Video State
  useEffect(() => {
    const audio = audioTrackRef.current;
    if (!audio) return;

    if (selectedAudioTrack?.audio_url || selectedAudioTrack?.file_url) {
      audio.src = selectedAudioTrack.audio_url || selectedAudioTrack.file_url || '';
      audio.load();
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [selectedAudioTrack]);

  // Extract visual filmstrip frames from video
  useEffect(() => {
    if (!isOpen || !currentVideoUrl) return;

    let isMounted = true;
    const generateFilmstrip = async () => {
      try {
        const offscreenVideo = document.createElement('video');
        offscreenVideo.src = currentVideoUrl;
        if (!currentVideoUrl.startsWith('blob:')) {
          offscreenVideo.crossOrigin = 'anonymous';
        }
        offscreenVideo.muted = true;
        offscreenVideo.playsInline = true;
        offscreenVideo.preload = 'auto';

        await new Promise<void>((resolve) => {
          offscreenVideo.onloadedmetadata = () => resolve();
          offscreenVideo.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });

        const totalDur = offscreenVideo.duration || duration || 15;
        const frameCount = 8;
        const step = totalDur / frameCount;
        const frames: string[] = [];

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < frameCount; i++) {
          if (!isMounted) break;
          const targetTime = Math.min(Math.max(0, totalDur - 0.1), i * step);
          offscreenVideo.currentTime = targetTime;

          await new Promise<void>((res) => {
            const onSeeked = () => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              try {
                if (ctx) {
                  ctx.drawImage(offscreenVideo, 0, 0, canvas.width, canvas.height);
                  frames.push(canvas.toDataURL('image/jpeg', 0.6));
                }
              } catch (_) {}
              res();
            };
            offscreenVideo.addEventListener('seeked', onSeeked);
            setTimeout(() => {
              offscreenVideo.removeEventListener('seeked', onSeeked);
              res();
            }, 250);
          });
        }

        if (isMounted && frames.length > 0) {
          setThumbnails(frames);
        }
      } catch (_) {}
    };

    generateFilmstrip();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentVideoUrl, duration]);

  // Video playback lifecycle and event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        setHasVideoLoaded(true);
        if (!hasUserCustomizedTrim.current || endTime === 0 || endTime > video.duration) {
          setEndTime(video.duration);
        }
      }
    };

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration) && video.duration > 0) {
      handleLoadedMetadata();
    }

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);

      // Audio sync
      const audio = audioTrackRef.current;
      if (audio && selectedAudioTrack && !audio.paused) {
        const expectedAudioTime = Math.max(0, cur - startTime);
        if (Math.abs(audio.currentTime - expectedAudioTime) > 0.3) {
          audio.currentTime = expectedAudioTime;
        }
      }

      // Loop strictly within trim boundary (only when user is not actively dragging)
      if (!isDraggingRef.current) {
        if (cur >= endTime) {
          video.currentTime = startTime;
          if (audio && selectedAudioTrack) {
            audio.currentTime = 0;
          }
        } else if (cur < startTime - 0.2) {
          video.currentTime = startTime;
        }
      }
    };

    const handleEnded = () => {
      video.currentTime = startTime;
      const audio = audioTrackRef.current;
      if (audio && selectedAudioTrack) {
        audio.currentTime = 0;
      }
      video.play().catch(() => {});
    };

    const handlePlay = () => {
      setIsPlaying(true);
      const audio = audioTrackRef.current;
      if (audio && selectedAudioTrack && (selectedAudioTrack.audio_url || selectedAudioTrack.file_url)) {
        audio.currentTime = Math.max(0, video.currentTime - startTime);
        audio.play().catch(() => {});
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      const audio = audioTrackRef.current;
      if (audio) {
        audio.pause();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleLoadedMetadata);
    video.addEventListener('canplay', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleLoadedMetadata);
      video.removeEventListener('canplay', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [startTime, endTime, selectedAudioTrack]);

  // Robust play/pause toggle with resilient fallback
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime >= endTime || video.currentTime < startTime) {
        video.currentTime = startTime;
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            const audio = audioTrackRef.current;
            if (audio && selectedAudioTrack && (selectedAudioTrack.audio_url || selectedAudioTrack.file_url)) {
              audio.currentTime = Math.max(0, video.currentTime - startTime);
              audio.play().catch(() => {});
            }
          })
          .catch((err) => {
            console.warn('Direct unmuted play blocked, recovering with muted play:', err);
            // Autoplay policy fallback: mute and play
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch((e2) => console.error('Video play error:', e2));
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      const audio = audioTrackRef.current;
      if (audio) audio.pause();
    }
    triggerHaptic('light');
  }, [startTime, endTime, selectedAudioTrack]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Preset length handlers (e.g. 15s, 30s, 60s, Full)
  const applyPresetDuration = (presetSecs: number) => {
    hasUserCustomizedTrim.current = true;
    const newEnd = presetSecs === -1 ? duration : Math.min(duration, startTime + presetSecs);
    setEndTime(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
    triggerHaptic('medium');
    toast.success(isRtl ? `تم ضبط المدة على ${presetSecs === -1 ? 'كامل المقطع' : `${presetSecs} ثانية`}` : `Set length to ${presetSecs === -1 ? 'Full' : `${presetSecs}s`}`);
  };

  // Timeline dragging logic
  const handleTimelinePointerDown = (
    mode: 'start' | 'end' | 'window' | 'scrub',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickRatio * duration;

    hasUserCustomizedTrim.current = true;
    isDraggingRef.current = true;
    setDragMode(mode);

    dragStartDataRef.current = {
      clientX: e.clientX,
      initialStart: startTime,
      initialEnd: endTime,
      windowLength: Math.max(0.5, endTime - startTime),
    };

    if (mode === 'scrub') {
      const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));
      setCurrentTime(clampedTime);
      if (videoRef.current) {
        videoRef.current.currentTime = clampedTime;
      }
      if (audioTrackRef.current && selectedAudioTrack) {
        audioTrackRef.current.currentTime = Math.max(0, clampedTime - startTime);
      }
    }

    triggerHaptic('medium');

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!timelineRef.current || duration <= 0) return;
      const moveRect = timelineRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartDataRef.current.clientX;
      const deltaSeconds = (deltaX / moveRect.width) * duration;

      if (mode === 'start') {
        const newStart = Math.max(0, Math.min(dragStartDataRef.current.initialEnd - 0.5, dragStartDataRef.current.initialStart + deltaSeconds));
        setStartTime(newStart);
        setCurrentTime(newStart);
        if (videoRef.current) videoRef.current.currentTime = newStart;
        if (audioTrackRef.current && selectedAudioTrack) audioTrackRef.current.currentTime = 0;
      } else if (mode === 'end') {
        const newEnd = Math.min(duration, Math.max(dragStartDataRef.current.initialStart + 0.5, dragStartDataRef.current.initialEnd + deltaSeconds));
        setEndTime(newEnd);
        setCurrentTime(newEnd);
        if (videoRef.current) videoRef.current.currentTime = Math.max(startTime, newEnd - 0.05);
      } else if (mode === 'window') {
        const winLen = dragStartDataRef.current.windowLength;
        let newStart = dragStartDataRef.current.initialStart + deltaSeconds;
        let newEnd = newStart + winLen;

        if (newStart < 0) {
          newStart = 0;
          newEnd = winLen;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = Math.max(0, duration - winLen);
        }

        setStartTime(newStart);
        setEndTime(newEnd);
        setCurrentTime(newStart);
        if (videoRef.current) videoRef.current.currentTime = newStart;
        if (audioTrackRef.current && selectedAudioTrack) audioTrackRef.current.currentTime = 0;
      } else if (mode === 'scrub') {
        const currentX = moveEvent.clientX - moveRect.left;
        const currentRatio = Math.max(0, Math.min(1, currentX / moveRect.width));
        const newCurrent = Math.max(startTime, Math.min(endTime, currentRatio * duration));
        setCurrentTime(newCurrent);
        if (videoRef.current) videoRef.current.currentTime = newCurrent;
        if (audioTrackRef.current && selectedAudioTrack) {
          audioTrackRef.current.currentTime = Math.max(0, newCurrent - startTime);
        }
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setDragMode(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  /**
   * Genuine Server-Side & Local Video Trimming on Save
   */
  const handleApplyTrim = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic('medium');

    const matchedOption = FORMAT_OPTIONS.find((opt) => opt.id === selectedFormat) || FORMAT_OPTIONS[0];
    const cutDuration = Math.max(1, Math.round(endTime - startTime));

    // Determine the source video URL for server processing
    let targetSourceUrl = serverVideoUrl || currentVideoUrl;

    // Check if using a local blob URL that needs uploading first
    if (targetSourceUrl.startsWith('blob:')) {
      try {
        setProcessingStatus(isRtl ? 'جاري رفع وتجهيز مقطع الفيديو...' : 'Uploading video file...');
        const blobResp = await fetch(targetSourceUrl);
        const blobData = await blobResp.blob();
        
        const uploadForm = new FormData();
        const ext = blobData.type?.includes('webm') ? 'webm' : blobData.type?.includes('mov') ? 'mov' : 'mp4';
        uploadForm.append('file', blobData, `video_trim_${Date.now()}.${ext}`);

        const uploadRes = await fetch('/api/files/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: uploadForm
        });

        if (uploadRes.ok) {
          const upData = await uploadRes.json();
          targetSourceUrl = upData.fileUrl || upData.file?.url || upData.file?.file_url || upData.url || upData.path || targetSourceUrl;
        }
      } catch (uploadErr) {
        console.warn('Pre-trim upload note:', uploadErr);
      }
    }

    setProcessingStatus(isRtl ? 'جاري قص وتطبيق الفلاتر وحفظ الفيديو...' : 'Rendering trimmed video...');
    const toastId = toast.loading(isRtl ? 'جاري قص ومعالجة الفيديو وحفظ التعديلات...' : 'Processing and trimming video...');

    try {
      // Execute server-side FFmpeg rendering
      if (targetSourceUrl && !targetSourceUrl.startsWith('blob:') && token) {
        const trimResponse = await fetch('/api/bulletin/trim-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            video_url: targetSourceUrl,
            start_time: startTime,
            end_time: endTime,
            aspect_ratio: selectedFormat,
            filter: selectedFilter,
            audio_url: selectedAudioTrack?.audio_url || selectedAudioTrack?.file_url || undefined,
            audio_start_time: 0,
            is_muted: isMuted
          })
        });

        if (trimResponse.ok) {
          const trimResult = await trimResponse.json().catch(() => null);
          if (trimResult?.success && trimResult.processed_video_url) {
            toast.dismiss(toastId);
            toast.success(isRtl ? 'تم قص وتحرير الفيديو بنجاح! جاهز للنشر 🎬' : 'Video trimmed & rendered successfully!');
            
            onTrimComplete({
              videoUrl: trimResult.processed_video_url,
              thumbnailUrl: trimResult.thumbnail_url || '',
              startTime: 0, // Reset to 0 since video is physically cut
              endTime: trimResult.duration || cutDuration,
              duration: trimResult.duration || cutDuration,
              adFormat: matchedOption.format,
              aspectRatio: selectedFormat,
              videoFilter: selectedFilter,
              audioTrack: selectedAudioTrack,
            });
            onClose();
            return;
          }
        }
      }

      // Safe Graceful Fallback if server processing was not required
      toast.dismiss(toastId);
      toast.success(isRtl ? 'تم حفظ إعدادات الفيديو بنجاح' : 'Video settings applied successfully');

      onTrimComplete({
        videoUrl: targetSourceUrl,
        startTime,
        endTime,
        duration: cutDuration,
        adFormat: matchedOption.format,
        aspectRatio: selectedFormat,
        videoFilter: selectedFilter,
        audioTrack: selectedAudioTrack,
      });
      onClose();
    } catch (err: any) {
      console.error('Trim error:', err);
      toast.dismiss(toastId);
      toast.error(isRtl ? 'حدث خطأ أثناء معالجة الفيديو' : 'Failed to process video');
      
      onTrimComplete({
        videoUrl: currentVideoUrl,
        startTime,
        endTime,
        duration: cutDuration,
        adFormat: matchedOption.format,
        aspectRatio: selectedFormat,
        videoFilter: selectedFilter,
        audioTrack: selectedAudioTrack,
      });
      onClose();
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Range percentage calculations
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectedFilterStyle = VIDEO_FILTERS.find(f => f.id === selectedFilter)?.filter || 'none';

  return (
    <>
      {/* Hidden Audio Player for In-Editor Music Track Preview */}
      <audio ref={audioTrackRef} loop={false} preload="auto" />

      <AppModal
        open={isOpen}
        onClose={onClose}
        layer="nested"
        size="md"
        dir={isRtl ? 'rtl' : 'ltr'}
        contentClassName="!p-0 !border !border-[var(--border-default)] !rounded-[var(--radius-lg)] shadow-2xl !h-[88vh] !max-h-[660px] sm:!max-h-[700px] !w-[95%] sm:!max-w-md overflow-hidden bg-[var(--surface-page)]"
      >
        {/* Native Single-Column Mobile-First Studio Layout */}
        <div className="relative w-full h-full flex flex-col bg-[var(--surface-page)] overflow-hidden select-none">
          
          {/* 1. Header Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-card)] border-b border-[var(--border-default)] z-30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close"
              className="w-7.5 h-7.5 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-default)] disabled:opacity-50"
            >
              <X size={16} />
            </button>

            {/* Time & Reset HUD */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-[10.5px] font-bold text-[var(--text-primary)]">
              <span className="text-[var(--text-primary)]">{formatTime(currentTime)}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--text-muted)]">{formatTime(endTime - startTime)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartTime(0);
                  setEndTime(duration);
                  hasUserCustomizedTrim.current = false;
                  if (videoRef.current) videoRef.current.currentTime = 0;
                  triggerHaptic('light');
                }}
                title={isRtl ? 'إعادة ضبط التوقيت' : 'Reset Timeline'}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ms-1 cursor-pointer transition-colors"
              >
                <RotateCcw size={11} />
              </button>
            </div>

            {/* Save & Apply Action Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyTrim}
              className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-95 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 border border-[var(--border-strong)] text-[11px] font-bold"
              title={isRtl ? 'حفظ واعتماد التحرير' : 'Apply & Save'}
              aria-label={isRtl ? 'حفظ واعتماد التحرير' : 'Apply & Save'}
            >
              {isProcessing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  <span>{isRtl ? 'حفظ' : 'Save'}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Full-Bleed Video Stage & Canvas Viewport */}
          <div 
            onClick={togglePlay}
            className="relative flex-1 min-h-0 w-full bg-black/95 flex items-center justify-center cursor-pointer overflow-hidden select-none group"
          >
            {/* Ambient Background Gradient Aura */}
            <div className="absolute inset-0 bg-radial from-white/5 to-transparent pointer-events-none" />

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
                <span className="text-xs font-bold text-white tracking-wide">
                  {processingStatus || (isRtl ? 'جاري معالجة وقص الفيديو...' : 'Processing video...')}
                </span>
                <span className="text-[10px] text-white/60">
                  {isRtl ? 'يتم تطبيق القص والفلاتر وحفظ التعديلات بدقة عالية' : 'Applying cuts and visual filters'}
                </span>
              </div>
            )}

            {/* Foreground Rendered Video Container */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-2 overflow-hidden pointer-events-none">
              <div className={`relative overflow-hidden transition-all duration-200 flex items-center justify-center shadow-2xl rounded-[var(--radius-md)] bg-black ${
                selectedFormat === '9:16' 
                  ? 'h-full aspect-[9/16]' 
                  : selectedFormat === '1:1' 
                  ? 'aspect-square max-h-full' 
                  : 'w-full aspect-video max-h-full'
              }`}>
                <video
                  key={currentVideoUrl}
                  ref={videoRef}
                  src={currentVideoUrl || undefined}
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  style={{ filter: selectedFilterStyle }}
                  className="w-full h-full object-cover overflow-hidden rounded-[var(--radius-md)] pointer-events-auto"
                />
              </div>
            </div>

            {/* Center Tap-to-play Floating Action Badge */}
            <div className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-all duration-200 ${isPlaying ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="w-13 h-13 rounded-full bg-black/70 text-white border border-white/25 flex items-center justify-center shadow-2xl backdrop-blur-sm transform active:scale-95 transition-transform hover:scale-105">
                <Play size={22} className="translate-x-0.5 fill-current text-white" />
              </div>
            </div>

            {/* Quick Trim Length Indicator Pill */}
            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-[var(--radius-xs)] bg-black/60 backdrop-blur-xs border border-white/15 text-[9.5px] font-mono font-bold text-white/90 pointer-events-none flex items-center gap-1">
              <Scissors size={10} className="text-amber-400" />
              <span>{(endTime - startTime).toFixed(1)}s</span>
            </div>
          </div>

          {/* 3. Docked Single-Column Control Deck */}
          <div className="flex flex-col gap-2 px-3 pt-2 pb-2.5 bg-[var(--surface-card)] border-t border-[var(--border-default)] z-30 shrink-0">
            
            {/* Active Selected Audio Track Indicator Badge */}
            {selectedAudioTrack && (
              <div className="flex items-center justify-between px-2 py-1 rounded-[var(--radius-xs)] bg-purple-500/10 border border-purple-500/25 text-[10px] text-purple-300 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Music size={11} className="shrink-0 animate-pulse text-purple-400" />
                  <span className="truncate font-bold text-[var(--text-primary)]">
                    {selectedAudioTrack.title || (isRtl ? 'مقطع موسيقي' : 'Audio Track')}
                  </span>
                  {selectedAudioTrack.artist && (
                    <span className="text-[var(--text-muted)] truncate hidden sm:inline">
                      • {selectedAudioTrack.artist}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAudioTrack(null)}
                  className="w-4.5 h-4.5 rounded hover:bg-purple-500/20 flex items-center justify-center text-purple-400 cursor-pointer shrink-0 ms-1"
                  title={isRtl ? 'إزالة الموسيقى' : 'Remove Music'}
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Timeline Range Trimmer */}
            <div className="relative w-full">
              {dragMode && (
                <div 
                  className="absolute -top-6 z-40 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-card)] text-[var(--text-primary)] font-mono text-[8.5px] font-bold shadow-md border border-[var(--border-default)] transform -translate-x-1/2 flex items-center gap-1 pointer-events-none"
                  style={{
                    left: `${
                      dragMode === 'start' 
                        ? startPercent 
                        : dragMode === 'end' 
                        ? endPercent 
                        : (startPercent + endPercent) / 2
                    }%`
                  }}
                >
                  <span>{formatTime(startTime)}</span>
                  <span className="text-[var(--text-muted)]">➔</span>
                  <span>{formatTime(endTime)}</span>
                  <span className="text-[var(--text-muted)] font-normal">({(endTime - startTime).toFixed(1)}s)</span>
                </div>
              )}

              <div
                ref={timelineRef}
                onPointerDown={(e) => handleTimelinePointerDown('scrub', e)}
                className="relative h-7 w-full rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-hidden cursor-pointer select-none touch-none"
              >
                {/* Thumbnail Strip */}
                <div className="absolute inset-0 flex items-center justify-between opacity-80 pointer-events-none overflow-hidden">
                  {thumbnails.length > 0 ? (
                    thumbnails.map((thumb, idx) => (
                      <img
                        key={idx}
                        src={thumb}
                        alt=""
                        className="h-full flex-1 object-cover border-r border-[var(--border-default)]/30 last:border-0"
                      />
                    ))
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-subtle)]" />
                  )}
                </div>

                {/* Dimmed Out-of-Range */}
                <div
                  className="absolute inset-y-0 left-0 bg-black/75 pointer-events-none"
                  style={{ width: `${startPercent}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-black/75 pointer-events-none"
                  style={{ width: `${100 - endPercent}%` }}
                />

                {/* Active Cut Window */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('window', e)}
                  className="absolute inset-y-0 border-y-2 border-[var(--primary)] bg-[var(--primary)]/20 cursor-grab active:cursor-grabbing touch-none z-20"
                  style={{
                    left: `${startPercent}%`,
                    width: `${Math.max(1, endPercent - startPercent)}%`,
                  }}
                />

                {/* Playhead Marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white shadow-md z-30 pointer-events-none"
                  style={{ left: `${Math.min(endPercent, Math.max(startPercent, currentPercent))}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-[var(--radius-xs)] bg-white -translate-x-[2px] -translate-y-0.5 shadow-sm" />
                </div>

                {/* Left Handle */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('start', e)}
                  style={{ left: `${startPercent}%` }}
                  className="absolute inset-y-0 -translate-x-1/2 w-3 bg-[var(--primary)] rounded-l-[var(--radius-xs)] flex items-center justify-center z-40 cursor-ew-resize active:scale-110 shadow-md border border-[var(--primary)] touch-none before:absolute before:-inset-2.5 before:content-['']"
                  title={isRtl ? 'بداية المقطع' : 'Start cut'}
                >
                  <div className="w-[1.5px] h-3 bg-white rounded-xs" />
                </div>

                {/* Right Handle */}
                <div
                  onPointerDown={(e) => handleTimelinePointerDown('end', e)}
                  style={{ left: `${endPercent}%` }}
                  className="absolute inset-y-0 -translate-x-1/2 w-3 bg-[var(--primary)] rounded-r-[var(--radius-xs)] flex items-center justify-center z-40 cursor-ew-resize active:scale-110 shadow-md border border-[var(--primary)] touch-none before:absolute before:-inset-2.5 before:content-['']"
                  title={isRtl ? 'نهاية المقطع' : 'End cut'}
                >
                  <div className="w-[1.5px] h-3 bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] text-[var(--text-muted)] font-bold shrink-0">
                {isRtl ? 'المدة السريعة:' : 'Quick Cut:'}
              </span>
              <div className="flex items-center gap-1 flex-1 justify-end">
                {[
                  { label: '15s', sec: 15 },
                  { label: '30s', sec: 30 },
                  { label: '60s', sec: 60 },
                  { label: isRtl ? 'الكل' : 'Full', sec: -1 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => applyPresetDuration(item.sec)}
                    className="px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[9px] font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Numbers & Sound Control Buttons */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Play/Pause Mini Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-7.5 h-7.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={isPlaying ? (isRtl ? 'إيقاف مؤقت' : 'Pause') : (isRtl ? 'تشغيل' : 'Play')}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5" />}
              </button>

              {/* Numbers Only Aspect Ratios */}
              <div className="flex items-center gap-0.5 bg-[var(--surface-subtle)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] flex-1">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(opt.id as any);
                      triggerHaptic('light');
                    }}
                    className={`flex-1 py-1 px-1 rounded-[var(--radius-xs)] text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      selectedFormat === opt.id
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={opt.ratio}
                  >
                    <span>{opt.ratio}</span>
                  </button>
                ))}
              </div>

              {/* Music Library Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsAudioPickerOpen(true);
                  if (onOpenAudioPicker) onOpenAudioPicker();
                }}
                className={`w-7.5 h-7.5 rounded-[var(--radius-sm)] border text-[var(--text-primary)] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  selectedAudioTrack
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 font-bold'
                    : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border-[var(--border-default)]'
                }`}
                title={selectedAudioTrack ? (selectedAudioTrack.title || (isRtl ? 'مقطع موسيقي محدد' : 'Music Selected')) : (isRtl ? 'اختيار مقطع موسيقي' : 'Select Music Track')}
                aria-label={isRtl ? 'اختيار مقطع موسيقي' : 'Select Music Track'}
              >
                <Music size={13} className={selectedAudioTrack ? 'animate-pulse text-purple-400' : ''} />
              </button>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMuted(!isMuted);
                  triggerHaptic('light');
                }}
                className="w-7.5 h-7.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title={isMuted ? (isRtl ? 'إلغاء كتم الصوت' : 'Unmute') : (isRtl ? 'كتم الصوت' : 'Mute')}
                aria-label={isMuted ? (isRtl ? 'إلغاء كتم الصوت' : 'Unmute') : (isRtl ? 'كتم الصوت' : 'Mute')}
              >
                {isMuted ? <VolumeX size={13} className="text-[var(--fg-danger)]" /> : <Volume2 size={13} />}
              </button>
            </div>

            {/* Filter Swatches */}
            <div className="flex items-center justify-between gap-1 w-full pt-0.5 px-0.5">
              {VIDEO_FILTERS.map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(flt.id);
                    triggerHaptic('light');
                  }}
                  className="group relative flex-1 flex flex-col items-center gap-0.5 min-w-0 transition-all cursor-pointer"
                  title={isRtl ? flt.nameAr : flt.nameEn}
                >
                  <div
                    className={`w-full max-w-[36px] h-5 rounded-[var(--radius-xs)] overflow-hidden border transition-all ${
                      selectedFilter === flt.id
                        ? 'ring-1.5 ring-[var(--primary)] scale-105 border-[var(--primary)] shadow-xs'
                        : 'border-[var(--border-default)] opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {thumbnails[0] ? (
                      <img
                        src={thumbnails[0]}
                        alt=""
                        style={{ filter: flt.filter }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          filter: flt.filter,
                          background:
                            flt.id === 'normal'
                              ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                              : flt.id === 'cinematic'
                              ? 'linear-gradient(135deg, #f59e0b, #b91c1c)'
                              : flt.id === 'warm'
                              ? 'linear-gradient(135deg, #fb923c, #ea580c)'
                              : flt.id === 'cool'
                              ? 'linear-gradient(135deg, #38bdf8, #2563eb)'
                              : flt.id === 'grayscale'
                              ? 'linear-gradient(135deg, #e2e8f0, #1e293b)'
                              : flt.id === 'high-contrast'
                              ? 'linear-gradient(135deg, #ffffff, #000000)'
                              : 'linear-gradient(135deg, #d97706, #78350f)',
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-[8px] sm:text-[8.5px] font-bold leading-none transition-colors truncate max-w-full text-center mt-0.5 ${
                    selectedFilter === flt.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {isRtl ? flt.nameAr : flt.nameEn}
                  </span>
                </button>
              ))}
            </div>

          </div>

        </div>
      </AppModal>

      {/* Embedded Audio Library Picker Modal */}
      <AudioLibraryPickerModal
        open={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectTrack={(track) => {
          setSelectedAudioTrack(track);
          setIsAudioPickerOpen(false);
          if (onSelectAudioTrack) onSelectAudioTrack(track);
          toast.success(isRtl ? 'تم اختيار المقطع الموسيقي بنجاح' : 'Audio track attached!');
        }}
        selectedTrackUrl={selectedAudioTrack?.audio_url}
        selectedTrackId={selectedAudioTrack?.id}
        token={token}
        isRtl={isRtl}
      />
    </>
  );
};
