import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Scissors, Music, RotateCcw } from 'lucide-react';
import { AudioTrack } from './types';

interface AudioWaveformTrimmerProps {
  track: AudioTrack | null;
  targetDuration: number; // Duration of the target video/story (e.g. 15s)
  onChangeSeekStart: (newStart: number) => void;
  isRtl?: boolean;
  className?: string;
}

export const AudioWaveformTrimmer: React.FC<AudioWaveformTrimmerProps> = ({
  track,
  targetDuration = 15,
  onChangeSeekStart,
  isRtl = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlayingSlice, setIsPlayingSlice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliceStart, setSliceStart] = useState(track?.seekStart || 0);

  const totalTrackDuration = Math.max(targetDuration, track?.duration || 60);
  const sliceDuration = Math.min(targetDuration, totalTrackDuration);

  // Sync local sliceStart when track prop changes
  useEffect(() => {
    if (track?.seekStart !== undefined) {
      setSliceStart(track.seekStart);
    }
  }, [track?.seekStart]);

  // Render high-tech visual audio bars on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Number of visual bars
    const barCount = Math.floor(width / 4);
    const barWidth = 2.5;
    const gap = (width - barCount * barWidth) / (barCount - 1);

    // Generate pseudo-waveform peaks derived from track id/title for consistent representation
    const seed = (track?.title?.length || 10) + (track?.duration || 30);
    const peaks: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const freq = Math.sin((i / barCount) * Math.PI * 4 + seed) * 0.4;
      const noise = Math.sin(i * 13.37 + seed * 2) * 0.3;
      const beat = (i % 6 === 0 ? 0.3 : 0);
      const val = Math.max(0.15, Math.min(0.95, Math.abs(0.5 + freq + noise + beat)));
      peaks.push(val);
    }

    // Calculate highlighted slice window coordinates
    const startX = (sliceStart / totalTrackDuration) * width;
    const endX = ((sliceStart + sliceDuration) / totalTrackDuration) * width;

    // Draw bars
    peaks.forEach((peak, index) => {
      const x = index * (barWidth + gap);
      const barHeight = peak * (height - 8);
      const y = (height - barHeight) / 2;

      const isInSlice = x >= startX && x <= endX;

      if (isInSlice) {
        // Active selection slice - glowing purple/accent
        ctx.fillStyle = '#a855f7';
      } else {
        // Dim background waveform
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    });
  }, [track, sliceStart, totalTrackDuration, sliceDuration]);

  // Handle Dragging / Seeking on the timeline
  const handleSeekFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = clickX / rect.width;
    const maxStart = Math.max(0, totalTrackDuration - sliceDuration);
    const calculatedStart = Math.min(maxStart, Math.max(0, ratio * totalTrackDuration));

    setSliceStart(calculatedStart);
    onChangeSeekStart(calculatedStart);

    // If previewing, update audio position
    if (audioPreviewRef.current && isPlayingSlice) {
      audioPreviewRef.current.currentTime = calculatedStart;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeekFromPointer(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handleSeekFromPointer(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSeekFromPointer(e.clientX);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleSeekFromPointer(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Audition slice audio preview
  const togglePlaySlice = () => {
    if (!audioPreviewRef.current || !track?.url) return;

    if (isPlayingSlice) {
      audioPreviewRef.current.pause();
      setIsPlayingSlice(false);
    } else {
      audioPreviewRef.current.currentTime = sliceStart;
      audioPreviewRef.current.volume = track.volume || 0.8;
      audioPreviewRef.current.play().catch(() => {});
      setIsPlayingSlice(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPreviewRef.current) {
      if (audioPreviewRef.current.currentTime >= sliceStart + sliceDuration) {
        audioPreviewRef.current.currentTime = sliceStart;
      }
    }
  };

  if (!track) {
    return (
      <div className={`p-4 rounded-shape-sm border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-1.5 ${className}`}>
        <Music size={20} className="text-[var(--text-muted)]" />
        <span>{isRtl ? 'لم يتم اختيار موسيقى بعد' : 'No music track selected'}</span>
      </div>
    );
  }

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const startPercent = (sliceStart / totalTrackDuration) * 100;
  const widthPercent = (sliceDuration / totalTrackDuration) * 100;

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs select-none ${className}`}>
      {/* Hidden preview audio */}
      <audio
        ref={audioPreviewRef}
        src={track.url}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => setIsPlayingSlice(false)}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlaySlice}
            className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 transition-all cursor-pointer relative before:absolute before:-inset-2 before:content-[''] ${
              isPlayingSlice
                ? 'bg-accent text-white shadow-xs animate-pulse'
                : 'bg-accent/15 hover:bg-accent/25 text-accent'
            }`}
            title={isPlayingSlice ? (isRtl ? 'إيقاف' : 'Pause') : (isRtl ? 'استماع للمقطع' : 'Preview Slice')}
            aria-label={isPlayingSlice ? (isRtl ? 'إيقاف' : 'Pause') : (isRtl ? 'استماع للمقطع' : 'Preview Slice')}
          >
            {isPlayingSlice ? <Pause size={13} /> : <Play size={13} className="fill-current ms-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{track.title}</h4>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{track.artist || (isRtl ? 'صوت أصلي' : 'Original Audio')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-shape-xs bg-accent/15 text-accent border border-[var(--border-accent)]/30">
            {formatSec(sliceStart)} - {formatSec(sliceStart + sliceDuration)} ({Math.round(sliceDuration)}s)
          </span>
          <button
            type="button"
            onClick={() => {
              setSliceStart(0);
              onChangeSeekStart(0);
            }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-shape-xs transition-colors cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
            title={isRtl ? 'إعادة ضبط للبداية' : 'Reset to start'}
            aria-label={isRtl ? 'إعادة ضبط للبداية' : 'Reset to start'}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Interactive Waveform Strip */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative h-12 w-full bg-[var(--surface-subtle)] rounded-shape-sm overflow-hidden cursor-ew-resize border border-[var(--border-default)] touch-none flex items-center"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Visual Selection Slider Box */}
        <div
          className="absolute top-0 bottom-0 border-2 border-accent bg-accent/20 rounded-shape-xs pointer-events-none transition-[left] duration-75 shadow-xs flex items-center justify-between px-1"
          style={{
            left: `${startPercent}%`,
            width: `${Math.min(100 - startPercent, widthPercent)}%`
          }}
        >
          <div className="w-1 h-4 bg-white/90 rounded-full shadow-xs" />
          <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/70 backdrop-blur-xs text-[8px] font-bold text-white">
            <Scissors size={8} />
            <span>{Math.round(sliceDuration)}s</span>
          </div>
          <div className="w-1 h-4 bg-white/90 rounded-full shadow-xs" />
        </div>
      </div>
    </div>
  );
};
