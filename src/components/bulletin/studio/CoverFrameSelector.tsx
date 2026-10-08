import React, { useRef, useEffect, useState } from 'react';
import { Image as ImageIcon, Sparkles, Check, Loader2 } from 'lucide-react';

interface CoverFrameSelectorProps {
  videoUrl?: string;
  imageUrl?: string;
  duration?: number;
  selectedTimestamp: number;
  onSelectTimestamp: (sec: number, dataUrl?: string) => void;
  isRtl?: boolean;
  className?: string;
}

interface FrameThumb {
  timestamp: number;
  dataUrl: string;
}

export const CoverFrameSelector: React.FC<CoverFrameSelectorProps> = ({
  videoUrl,
  imageUrl,
  duration = 15,
  selectedTimestamp = 0,
  onSelectTimestamp,
  isRtl = true,
  className = ''
}) => {
  const [frames, setFrames] = useState<FrameThumb[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate 6-8 frames from video
  useEffect(() => {
    if (!videoUrl) {
      if (imageUrl) {
        setFrames([{ timestamp: 0, dataUrl: imageUrl }]);
      }
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.src = videoUrl;
    vid.muted = true;
    vid.playsInline = true;

    vid.onloadedmetadata = async () => {
      const vidDuration = vid.duration || duration || 10;
      const count = 7;
      const step = vidDuration / (count + 1);
      const generated: FrameThumb[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');

      for (let i = 1; i <= count; i++) {
        if (!isMounted) break;
        const targetTime = i * step;

        await new Promise<void>((resolve) => {
          vid.currentTime = targetTime;
          vid.onseeked = () => {
            if (ctx) {
              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                generated.push({ timestamp: targetTime, dataUrl });
              } catch (e) {
                // Cross-origin fallback
              }
            }
            resolve();
          };
        });
      }

      if (isMounted) {
        setFrames(generated);
        setIsGenerating(false);
      }
    };

    vid.onerror = () => {
      if (isMounted) setIsGenerating(false);
    };

    return () => {
      isMounted = false;
      vid.removeAttribute('src');
      vid.load();
    };
  }, [videoUrl, imageUrl, duration]);

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
          <ImageIcon size={14} className="text-[var(--accent-foreground)]" />
          <span>{isRtl ? 'صورة الغلاف' : 'Cover Frame'}</span>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Loader2 size={11} className="animate-spin text-[var(--accent-foreground)]" />
            <span>{isRtl ? 'استخراج...' : 'Extracting...'}</span>
          </div>
        )}
      </div>

      {/* Thumbnail Frames Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {frames.map((frame, idx) => {
          const isSelected = Math.abs(frame.timestamp - selectedTimestamp) < 1.0 || (frames.length === 1 && idx === 0);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectTimestamp(frame.timestamp, frame.dataUrl)}
              className={`relative shrink-0 w-12 h-16 rounded-shape-xs overflow-hidden border-2 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-[var(--accent-foreground)] shadow-xs scale-105 ring-2 ring-[var(--accent-foreground)]/30'
                  : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
              }`}
              title={`${isRtl ? 'لقطة' : 'Frame'} ${idx + 1}`}
              aria-label={`${isRtl ? 'لقطة' : 'Frame'} ${idx + 1}`}
            >
              <img
                src={frame.dataUrl}
                alt={`Frame ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute top-1 end-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-foreground)] text-white flex items-center justify-center shadow-xs">
                  <Check size={9} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}

        {frames.length === 0 && !isGenerating && (
          <div className="w-full py-3 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-subtle)] rounded-shape-xs border border-dashed border-[var(--border-default)]">
            {isRtl ? 'لا توجد لقطات متاحة' : 'No frames available'}
          </div>
        )}
      </div>
    </div>
  );
};
