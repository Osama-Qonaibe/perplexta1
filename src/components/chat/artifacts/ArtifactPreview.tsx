import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Artifact } from '../../../types/artifact';
import { useAppContext } from '../../../context/AppContext';
import { useArtifact } from '../../../context/ArtifactContext';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import {
  Terminal,
  ShieldAlert,
  Trash2,
  ChevronDown,
  Hand,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/design-system';
import { buildArtifactSrcDoc } from '../../../utils/artifactSandbox';
import { CanvasZoomControls } from './CanvasZoomControls';
import { CanvasMinimap } from './CanvasMinimap';

interface ArtifactPreviewProps {
  artifact: Artifact;
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  const { resolvedTheme, language } = useAppContext();
  const {
    deviceViewport,
    reloadKey,
    showConsole,
    setShowConsole,
    logs,
    setLogs,
    frameBg,
    isFullscreen,
    zoom,
    pan,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    zoomAtPoint,
    setPan,
    resetPan,
    resetTransform,
  } = useArtifact();

  // Drag pan mode toggle
  const [dragModeActive, setDragModeActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number } | null>(null);
  const touchStartRef = useRef<{ dist: number; midX: number; midY: number; initialZoom: number; initialPan: { x: number; y: number } } | null>(null);

  // Dynamically observe preview stage container bounds
  const stageObserver = useResizeObserver<HTMLDivElement>({
    triggers: [deviceViewport, isFullscreen, showConsole]
  });

  const isDark = resolvedTheme === 'dark';
  const isAr = language === 'ar';

  // Handle messages passed from our sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SANDBOX_CONSOLE') {
        setLogs(prev => [...prev, event.data.payload].slice(-150));
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setLogs]);

  // Compute final HTML srcDoc
  const srcDoc = useMemo(() => {
    return buildArtifactSrcDoc(artifact, {
      language,
      isDark,
      frameBg
    });
  }, [artifact, language, isDark, frameBg]);

  // Viewport dimensions
  const viewportStyles = useMemo(() => {
    switch (deviceViewport) {
      case 'mobile':
        return {
          width: '375px',
          height: '720px',
          maxHeight: '92vh',
          borderRadius: '32px',
          border: '8px solid var(--border-default)',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)'
        };
      case 'tablet':
        return {
          width: '768px',
          height: '920px',
          maxHeight: '92vh',
          borderRadius: '20px',
          border: '6px solid var(--border-default)',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)'
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          borderRadius: '0px',
          border: 'none',
          boxShadow: 'none'
        };
    }
  }, [deviceViewport]);

  // Content dimensions for minimap
  const contentDimensions = useMemo(() => {
    if (deviceViewport === 'mobile') {
      return { width: 375, height: 720 };
    }
    if (deviceViewport === 'tablet') {
      return { width: 768, height: 920 };
    }
    return {
      width: stageObserver.width || 1200,
      height: stageObserver.height || 800
    };
  }, [deviceViewport, stageObserver.width, stageObserver.height]);

  // Start drag panning
  const handleStartPan = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialPanX: pan.x,
      initialPanY: pan.y
    };
  }, [pan.x, pan.y]);

  const handleStageMouseDown = useCallback((e: React.MouseEvent) => {
    const isSpecialPanClick =
      dragModeActive ||
      isSpacePressed ||
      e.button === 1 || // Middle mouse button
      e.button === 2 || // Right mouse button
      e.altKey ||
      (e.target as HTMLElement).dataset.stageBg === 'true';

    if (isSpecialPanClick) {
      if (e.button === 2) {
        e.preventDefault();
      }
      handleStartPan(e.clientX, e.clientY);
    }
  }, [dragModeActive, isSpacePressed, handleStartPan]);

  const handleStageMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: Math.round(dragStartRef.current.initialPanX + dx),
      y: Math.round(dragStartRef.current.initialPanY + dy)
    });
  }, [isDragging, setPan]);

  const handleStageMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Wheel handling: focal zoom on Ctrl/Cmd/Alt, 2D pan on normal wheel when transformed
  const handleStageWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      if (!stageObserver.ref.current) return;
      const rect = stageObserver.ref.current.getBoundingClientRect();
      const zoomFactor = Math.exp(-e.deltaY * 0.003);
      const targetZoom = zoom * zoomFactor;
      zoomAtPoint(e.clientX, e.clientY, targetZoom, rect);
    } else if (zoom > 1.05 || pan.x !== 0 || pan.y !== 0) {
      e.preventDefault();
      const deltaX = e.shiftKey ? -e.deltaY : -e.deltaX;
      const deltaY = e.shiftKey ? 0 : -e.deltaY;
      setPan((current: { x: number; y: number }) => ({
        x: Math.round(current.x + deltaX),
        y: Math.round(current.y + deltaY)
      }));
    }
  }, [zoom, pan.x, pan.y, zoomAtPoint, setPan, stageObserver.ref]);

  // Touch gesture support: pinch zoom and drag pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchStartRef.current = {
        dist,
        midX,
        midY,
        initialZoom: zoom,
        initialPan: { ...pan }
      };
      setIsDragging(true);
    } else if (e.touches.length === 1 && (dragModeActive || isSpacePressed)) {
      const t = e.touches[0];
      handleStartPan(t.clientX, t.clientY);
    }
  }, [zoom, pan, dragModeActive, isSpacePressed, handleStartPan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current && stageObserver.ref.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = newDist / touchStartRef.current.dist;
      const targetZoom = touchStartRef.current.initialZoom * factor;
      const containerRect = stageObserver.ref.current.getBoundingClientRect();
      zoomAtPoint(touchStartRef.current.midX, touchStartRef.current.midY, targetZoom, containerRect);
    } else if (e.touches.length === 1 && isDragging && dragStartRef.current) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragStartRef.current.x;
      const dy = t.clientY - dragStartRef.current.y;
      setPan({
        x: Math.round(dragStartRef.current.initialPanX + dx),
        y: Math.round(dragStartRef.current.initialPanY + dy)
      });
    }
  }, [isDragging, setPan, zoomAtPoint, stageObserver.ref]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Double click: smart toggle between 150% focal zoom and 100% reset
  const handleStageDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!stageObserver.ref.current) return;
    if (zoom > 1.1 || pan.x !== 0 || pan.y !== 0) {
      resetTransform();
    } else {
      const rect = stageObserver.ref.current.getBoundingClientRect();
      zoomAtPoint(e.clientX, e.clientY, 1.5, rect);
    }
  }, [zoom, pan.x, pan.y, resetTransform, zoomAtPoint, stageObserver.ref]);

  // Fit to screen calculation
  const handleFitToScreen = useCallback(() => {
    if (!stageObserver.ref.current) {
      resetTransform();
      return;
    }
    const containerRect = stageObserver.ref.current.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;

    let targetW = containerW;
    let targetH = containerH;

    if (deviceViewport === 'mobile') {
      targetW = 375 + 16;
      targetH = 720 + 16;
    } else if (deviceViewport === 'tablet') {
      targetW = 768 + 12;
      targetH = 920 + 12;
    }

    const availableW = Math.max(100, containerW - 48);
    const availableH = Math.max(100, containerH - 48);

    const fitScale = Math.min(availableW / targetW, availableH / targetH);
    const clampedFit = Math.min(Math.max(Number(fitScale.toFixed(2)), 0.2), 2.0);

    setZoom(clampedFit);
    resetPan();
  }, [deviceViewport, resetTransform, setZoom, resetPan, stageObserver.ref]);

  // Spacebar and keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true');

      if (isInputFocused) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetTransform();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 25;
        setPan((p: { x: number; y: number }) => ({ ...p, x: p.x + step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 25;
        setPan((p: { x: number; y: number }) => ({ ...p, x: p.x - step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 25;
        setPan((p: { x: number; y: number }) => ({ ...p, y: p.y + step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 25;
        setPan((p: { x: number; y: number }) => ({ ...p, y: p.y - step }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoomIn, zoomOut, resetTransform, handleFitToScreen, setPan]);

  const isTransformed = zoom !== 1.0 || pan.x !== 0 || pan.y !== 0;
  const isPanToolActive = dragModeActive || isSpacePressed;

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[var(--surface-page)] overflow-hidden font-sans select-none min-h-0 relative"
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        if (isDragging) e.preventDefault();
      }}
    >
      <div
        ref={stageObserver.ref}
        data-stage-bg="true"
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleStageWheel}
        onDoubleClick={handleStageDoubleClick}
        className={`flex-1 relative flex items-center justify-center overflow-hidden min-h-0 transition-colors ${
          isPanToolActive || isDragging ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        } ${
          deviceViewport !== 'desktop' || isTransformed
            ? 'p-6 bg-[radial-gradient(var(--border-default)_1px,transparent_1px)] [background-size:16px_16px] bg-[var(--surface-inset)]/70' 
            : 'bg-[var(--surface-page)]'
        }`}
      >
        {/* Spacebar Active Pill Indicator */}
        {isSpacePressed && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 bg-[var(--surface-card)]/95 backdrop-blur-md border border-[var(--border-default)] rounded-shape-full shadow-lg text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <Hand size={13} className="text-[var(--fg-accent)]" />
            <span>{isAr ? 'التحريك اليدوي نشط (انقر واسحب)' : 'Pan Mode Active (Click & Drag)'}</span>
          </div>
        )}

        {/* Transformed Stage Viewport */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="w-full h-full flex items-center justify-center pointer-events-auto transform-gpu"
        >
          <div
            style={viewportStyles}
            className="relative transition-all duration-300 ease-out overflow-hidden flex flex-col bg-[var(--surface-card)]"
          >
            {deviceViewport === 'mobile' && (
              <div className="h-5 w-full bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-center shrink-0">
                <div className="w-14 h-1 rounded-shape-full bg-[var(--border-default)]" />
              </div>
            )}

            {/* Iframe Event Blocker during Pan or Space hold */}
            {(isPanToolActive || isDragging) && (
              <div
                onMouseDown={handleStageMouseDown}
                className={`absolute inset-0 z-20 select-none ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{ pointerEvents: 'auto' }}
              />
            )}

            <iframe
              key={reloadKey}
              title="Artifact Preview"
              srcDoc={srcDoc}
              className="w-full flex-1 border-none bg-transparent"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            />
          </div>
        </div>

        {/* Precision Floating Zoom & Pan Controls */}
        <CanvasZoomControls
          dragModeActive={dragModeActive}
          onToggleDragMode={() => setDragModeActive(v => !v)}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(v => !v)}
          onFitToScreen={handleFitToScreen}
        />

        {/* Interactive Minimap Radar */}
        {showMinimap && (
          <CanvasMinimap
            containerWidth={stageObserver.width}
            containerHeight={stageObserver.height}
            contentWidth={contentDimensions.width}
            contentHeight={contentDimensions.height}
            onClose={() => setShowMinimap(false)}
          />
        )}

        {/* Sandboxed Console Drawer */}
        {showConsole && (
          <div className="absolute bottom-0 inset-x-0 h-60 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex flex-col z-40 shadow-2xl backdrop-blur-md transition-theme">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] shrink-0 select-none">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-[var(--text-muted)]" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {isAr ? 'سجلات الطرفية' : 'Console Logs'}
                </span>
                <span aria-hidden="true" className="text-[var(--text-muted)] select-none">·</span>
                <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                  {logs.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-theme cursor-pointer flex items-center justify-center shrink-0 active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'مسح السجلات' : 'Clear Logs'}
                >
                  <Trash2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowConsole(false)}
                  className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme cursor-pointer flex items-center justify-center shrink-0 active:scale-95 relative before:absolute before:-inset-1.5"
                  title={isAr ? 'إغلاق' : 'Close'}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed select-text space-y-1.5 custom-scrollbar bg-[var(--surface-inset)] dark:bg-[var(--surface-code)] text-[var(--text-primary)]">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)] italic text-xs">
                  {isAr ? 'لا توجد سجلات.' : 'No console logs captured.'}
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 p-2 rounded-shape-xs border transition-theme ${
                      log.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : log.type === 'warn'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        : log.type === 'info'
                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-500'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)]'
                    }`}
                  >
                    {log.type === 'error' && <ShieldAlert size={13} className="shrink-0 mt-0.5 text-rose-500" />}
                    <span className="text-[9px] font-bold text-[var(--text-muted)] shrink-0 mt-0.5 select-none">{log.time}</span>
                    <span className="text-[10px] font-bold uppercase shrink-0 mt-0.5 select-none">[{log.type}]</span>
                    <pre className="flex-1 whitespace-pre-wrap font-mono break-all text-[11px] m-0">{log.text}</pre>
                    {log.type === 'error' && (
                      <button
                        type="button"
                        onClick={() => {
                          const fixPrompt = isAr
                            ? `واجهت هذا الخطأ أثناء تشغيل الكود في الكانفاس:\n\`\`\`\n${log.text}\n\`\`\`\nيرجى تصحيح الكود بالكامل وحل هذه المشكلة بدقة.`
                            : `I encountered this runtime error in the Canvas sandbox:\n\`\`\`\n${log.text}\n\`\`\`\nPlease fix the issue and provide the corrected code.`;
                          window.dispatchEvent(new CustomEvent('insert_to_prompt', { detail: fixPrompt }));
                          toast.success(isAr ? 'تم إرسال الخطأ إلى صندوق المحادثة للمعالجة الذاتية' : 'Error sent to chat box for Self-Healing Fix');
                        }}
                        className="px-2 py-1 rounded-shape-xs bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer border border-rose-500/30 active:scale-95"
                        title={isAr ? 'إصلاح الخطأ تلقائياً بواسطة المساعد الذكي' : 'Fix with AI Assistant'}
                      >
                        <Sparkles size={11} className="text-amber-400" />
                        <span>{isAr ? 'إصلاح بواسطة AI' : 'Fix with AI'}</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
