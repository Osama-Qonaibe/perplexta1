import React, { useRef, useCallback, useEffect } from 'react';
import { useArtifact } from '../../../context/ArtifactContext';
import { useAppContext } from '../../../context/AppContext';
import { Eye, Navigation } from 'lucide-react';

interface CanvasMinimapProps {
  containerWidth: number;
  containerHeight: number;
  contentWidth: number;
  contentHeight: number;
  onClose?: () => void;
}

const MINIMAP_WIDTH = 140;
const MINIMAP_HEIGHT = 90;

export function CanvasMinimap({
  containerWidth,
  containerHeight,
  contentWidth,
  contentHeight,
}: CanvasMinimapProps) {
  const { zoom, pan, setPan } = useArtifact();
  const { dir } = useAppContext();
  const isRtl = dir === 'rtl';

  const mapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Avoid zero division
  const safeContentW = Math.max(contentWidth || 1, 100);
  const safeContentH = Math.max(contentHeight || 1, 100);
  const safeContW = Math.max(containerWidth || 1, 100);
  const safeContH = Math.max(containerHeight || 1, 100);

  // Aspect fit content into minimap box
  const contentAspect = safeContentW / safeContentH;
  const minimapAspect = MINIMAP_WIDTH / MINIMAP_HEIGHT;

  let renderMapW = MINIMAP_WIDTH;
  let renderMapH = MINIMAP_HEIGHT;
  if (contentAspect > minimapAspect) {
    renderMapH = Math.round(MINIMAP_WIDTH / contentAspect);
  } else {
    renderMapW = Math.round(MINIMAP_HEIGHT * contentAspect);
  }

  // Scale from content space to minimap space
  const scaleX = renderMapW / safeContentW;
  const scaleY = renderMapH / safeContentH;

  // Viewport dimensions in content space
  const viewportContentW = safeContW / zoom;
  const viewportContentH = safeContH / zoom;

  // Viewport rect in minimap space
  const minimapViewW = Math.min(renderMapW, Math.max(12, Math.round(viewportContentW * scaleX)));
  const minimapViewH = Math.min(renderMapH, Math.max(12, Math.round(viewportContentH * scaleY)));

  // Center of the viewport relative to content center
  const centerContentOffsetX = -pan.x / zoom;
  const centerContentOffsetY = -pan.y / zoom;

  // Position of viewport rectangle top-left in minimap space
  const minimapViewX = Math.round(
    renderMapW / 2 + (centerContentOffsetX * scaleX) - minimapViewW / 2
  );
  const minimapViewY = Math.round(
    renderMapH / 2 + (centerContentOffsetY * scaleY) - minimapViewH / 2
  );

  // Clamped for safety inside visible radar
  const clampedX = Math.max(-minimapViewW / 2, Math.min(renderMapW - minimapViewW / 2, minimapViewX));
  const clampedY = Math.max(-minimapViewH / 2, Math.min(renderMapH - minimapViewH / 2, minimapViewY));

  const handlePointerNavigate = useCallback(
    (clientX: number, clientY: number) => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;

      // Clicked position relative to center of minimap
      const relativeCenterX = offsetX - renderMapW / 2;
      const relativeCenterY = offsetY - renderMapH / 2;

      // Translate back to content space offset from center
      const targetContentOffsetX = relativeCenterX / scaleX;
      const targetContentOffsetY = relativeCenterY / scaleY;

      // Convert to pan coordinates
      const targetPanX = -targetContentOffsetX * zoom;
      const targetPanY = -targetContentOffsetY * zoom;

      setPan({
        x: Math.round(targetPanX),
        y: Math.round(targetPanY),
      });
    },
    [renderMapW, renderMapH, scaleX, scaleY, zoom, setPan]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    handlePointerNavigate(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      handlePointerNavigate(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handlePointerNavigate]);

  return (
    <div
      className={`absolute bottom-4 ${isRtl ? 'start-4' : 'end-4'} z-30 p-1.5 rounded-shape-md bg-[var(--surface-card)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl select-none animate-in fade-in zoom-in-95 duration-fast flex flex-col gap-1`}
      style={{ width: MINIMAP_WIDTH + 12 }}
    >
      <div className="flex items-center justify-between px-1 text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
        <div className="flex items-center gap-1">
          <Navigation size={10} className="text-[var(--fg-accent)]" />
          <span>{isRtl ? 'الرادار' : 'Navigator'}</span>
        </div>
        <span className="font-mono text-[9px] text-[var(--text-secondary)]">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div
        ref={mapRef}
        onMouseDown={handleMouseDown}
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
        }}
        className="relative bg-[var(--surface-inset)] rounded-shape-xs border border-[var(--border-default)] overflow-hidden cursor-crosshair flex items-center justify-center"
      >
        {/* Visual representation of artifact canvas */}
        <div
          style={{
            width: renderMapW,
            height: renderMapH,
          }}
          className="relative bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 rounded-xs flex items-center justify-center shadow-inner"
        >
          {/* Subtle placeholder elements representing content */}
          <div className="w-3/4 h-1/2 border border-dashed border-[var(--border-default)] rounded-xs flex items-center justify-center opacity-40">
            <Eye size={10} className="text-[var(--text-muted)]" />
          </div>

          {/* Viewport radar bounding box */}
          <div
            style={{
              left: `${clampedX}px`,
              top: `${clampedY}px`,
              width: `${minimapViewW}px`,
              height: `${minimapViewH}px`,
            }}
            className="absolute border-2 border-[var(--fg-accent)] bg-[var(--fg-accent)]/15 rounded-xs shadow-xs pointer-events-none transition-none"
          >
            {/* Viewport center reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--fg-accent)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
