import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Maximize2, Sparkles, Film } from 'lucide-react';
import { MediaProjectState } from './types';

interface MediaCanvasPreviewProps {
  projectState: MediaProjectState;
  onUpdateProjectState?: (updater: (prev: MediaProjectState) => MediaProjectState) => void;
  isRtl?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export const MediaCanvasPreview: React.FC<MediaCanvasPreviewProps> = ({
  projectState,
  isRtl = true,
  className = '',
  autoPlay = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(projectState.outputDuration || 15);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const visual = projectState.visual;
  const music = projectState.musicTrack;
  const isImage = visual?.sourceType === 'image';
  const isVideo = visual?.sourceType === 'video';

  // Synchronize audio volumes whenever project state volumes change
  useEffect(() => {
    if (audioRef.current && music) {
      audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, music.volume));
    }
    if (videoRef.current && isVideo) {
      videoRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, projectState.originalAudioVolume));
    }
  }, [music?.volume, projectState.originalAudioVolume, isMuted, isVideo, music]);

  // Handle Play/Pause synchronization
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current && music) {
        audioRef.current.currentTime = (music.seekStart || 0) + (isImage ? currentTime % duration : 0);
        audioRef.current.volume = isMuted ? 0 : music.volume;
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current && isVideo) {
        videoRef.current.volume = isMuted ? 0 : projectState.originalAudioVolume;
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [isPlaying, music, isImage, currentTime, duration, isMuted, isVideo, projectState.originalAudioVolume]);

  // Image motion timer loop for Ken Burns simulation
  useEffect(() => {
    let timer: any = null;
    if (isImage && isPlaying) {
      const startTime = Date.now() - (currentTime * 1000);
      const totalDur = projectState.outputDuration || 15;
      setDuration(totalDur);

      timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentSec = elapsed % totalDur;
        setCurrentTime(currentSec);

        // Keep audio in sync with loop
        if (audioRef.current && music) {
          const expectedAudioPos = (music.seekStart || 0) + currentSec;
          if (Math.abs(audioRef.current.currentTime - expectedAudioPos) > 0.5) {
            audioRef.current.currentTime = expectedAudioPos;
          }
        }
      }, 50);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isImage, isPlaying, projectState.outputDuration, music]);

  // Video time update handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const vTime = videoRef.current.currentTime;
      setCurrentTime(vTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }

      // Sync background music offset with video playhead
      if (audioRef.current && music) {
        const expectedAudioPos = (music.seekStart || 0) + vTime;
        if (Math.abs(audioRef.current.currentTime - expectedAudioPos) > 0.3) {
          audioRef.current.currentTime = expectedAudioPos;
        }
      }
    }
  };

  // Video metadata loaded
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDur = videoRef.current.duration;
      if (vidDur && !isNaN(vidDur)) {
        setDuration(vidDur);
      }
      if (autoPlay) {
        videoRef.current.play().catch(() => {});
        if (audioRef.current && music) {
          audioRef.current.currentTime = music.seekStart || 0;
          audioRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine Ken Burns CSS class
  const getAnimationClass = () => {
    if (!isImage) return '';
    const anim = visual?.animation || 'ken_burns_zoom_in';
    if (anim === 'ken_burns_zoom_in') return 'ken-burns-zoom';
    if (anim === 'ken_burns_pan_right') return 'ken-burns-pan';
    return '';
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full aspect-[9/16] max-w-[340px] mx-auto rounded-shape-lg overflow-hidden bg-black shadow-2xl border-2 border-[var(--border-default)] select-none flex flex-col justify-between ${className}`}
    >
      {/* Embedded CSS animations for high-precision Ken Burns */}
      <style>{`
        @keyframes kenBurnsZoomIn {
          0% { transform: scale(1.0) translate(0%, 0%); }
          50% { transform: scale(1.15) translate(-1.5%, -1%); }
          100% { transform: scale(1.0) translate(0%, 0%); }
        }
        @keyframes kenBurnsPanRight {
          0% { transform: scale(1.12) translate(-3%, 0%); }
          50% { transform: scale(1.18) translate(3%, -1.5%); }
          100% { transform: scale(1.12) translate(-3%, 0%); }
        }
        .ken-burns-zoom {
          animation: kenBurnsZoomIn 15s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }
        .ken-burns-pan {
          animation: kenBurnsPanRight 15s cubic-bezier(0.25, 1, 0.5, 1) infinite alternate;
          will-change: transform;
        }
      `}</style>

      {/* Background Visual Layer */}
      <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center overflow-hidden">
        {isImage && visual?.url ? (
          <img
            src={visual.url}
            alt="Preview Visual"
            className={`w-full h-full object-cover origin-center transition-transform duration-700 ${
              isPlaying ? getAnimationClass() : ''
            }`}
          />
        ) : isVideo && visual?.url ? (
          <video
            ref={videoRef}
            src={visual.url}
            playsInline
            loop
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleVideoLoadedMetadata}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-500 gap-2 p-6 text-center">
            <Film size={36} className="text-neutral-600 animate-pulse" />
            <p className="text-xs font-semibold">
              {isRtl ? 'اختر صورة أو فيديو لبدء المعاينة' : 'Select a photo or video to preview'}
            </p>
          </div>
        )}
      </div>

      {/* Audio Engine Track (Hidden HTML5 Audio element) */}
      {music?.url && (
        <audio
          ref={audioRef}
          src={music.url}
          loop={music.loop ?? true}
          preload="auto"
        />
      )}

      {/* Top HUD: Status Bar & Quality Indicators */}
      <div className="relative z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--fg-success)] animate-pulse" />
          <span>{isRtl ? 'معاينة حية 9:16' : 'Live 9:16'}</span>
        </div>

        {/* Dynamic Badge: Motion or Music */}
        <div className="flex items-center gap-1">
          {isImage && visual?.animation !== 'none' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[9px] font-bold text-amber-300">
              <Sparkles size={10} />
              <span>Ken Burns</span>
            </div>
          )}
          {music && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/25 backdrop-blur-md border border-purple-500/30 text-[9px] font-bold text-purple-300 max-w-[120px] truncate">
              <Music size={10} className="shrink-0" />
              <span className="truncate">{music.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Interactive Tap Area (Play / Pause Trigger) */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 z-20 w-full h-full flex items-center justify-center cursor-pointer bg-transparent focus:outline-hidden"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {(!isPlaying || isHovered) && visual?.url && (
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95">
            {isPlaying ? (
              <Pause size={24} className="fill-current" />
            ) : (
              <Play size={24} className="fill-current ms-1" />
            )}
          </div>
        )}
      </button>

      {/* Bottom HUD: Playhead, Timecode, and Audio Toggles */}
      <div className="relative z-30 p-3 pt-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2">
        {/* Scrubber Progress Line */}
        <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-accent rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-1.5 rounded-shape-xs hover:bg-white/20 transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-current" />}
            </button>
            <span className="text-[11px] font-mono text-neutral-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className={`p-1.5 rounded-shape-xs transition-colors relative before:absolute before:-inset-2 before:content-[''] ${
                isMuted ? 'text-rose-400 bg-rose-500/20' : 'text-neutral-200 hover:bg-white/20'
              }`}
              title={isMuted ? (isRtl ? 'إلغاء الكتم' : 'Unmute') : (isRtl ? 'كتم الصوت' : 'Mute')}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
