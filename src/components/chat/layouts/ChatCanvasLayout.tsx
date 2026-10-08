import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useCanvasLayout } from '../hooks/useCanvasLayout';
import { useAppContext } from '../../../context/AppContext';
import { ArtifactCanvas } from '../artifacts/ArtifactCanvas';

interface ChatCanvasLayoutProps {
  children: React.ReactNode;
}

export function ChatCanvasLayout({ children }: ChatCanvasLayoutProps) {
  const {
    chatContainerRef,
    canvasContainerRef,
    isArtifactOpen,
    isFullscreen,
    viewportWidth,
    chatMainStyle,
    canvasMainStyle,
    effectiveCanvasWidth
  } = useCanvasLayout();
  const { dir } = useAppContext();
  const isRtl = dir === 'rtl';
  const isDesktop = viewportWidth >= 1024;

  // Zero-motion variants to completely eliminate motion and conflicting layout animations
  const canvasDrawerVariants: Variants = useMemo(() => ({
    'animate-in': {
      opacity: 1,
      transition: { duration: 0 },
    },
    'animate-out': {
      opacity: 0,
      transition: { duration: 0 },
    },
  }), []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)] relative select-none">
      {/* Main chat content area - Strictly locked to 530px when canvas is open */}
      <main
        ref={chatContainerRef}
        style={chatMainStyle}
        className="flex flex-col h-full min-w-0 select-text relative z-10 overflow-hidden"
      >
        {children}
      </main>

      {/* Static clean divider separator between chat and canvas on desktop - locked to 530px */}
      {isArtifactOpen && !isFullscreen && isDesktop && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={530}
          aria-label={isRtl ? 'فاصل لوحة المعاينة والمحادثة' : 'Canvas and chat separator'}
          className="hidden lg:block w-px shrink-0 z-30 bg-[var(--border-default)]"
        />
      )}

      {/* Sovereign Fullscreen Portal: Mounts directly to document.body with ultimate z-index to eliminate any external overlaps */}
      {isArtifactOpen && isFullscreen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] w-screen h-screen bg-[var(--surface-page)] text-[var(--text-primary)] overflow-hidden flex flex-col select-none pointer-events-auto"
          style={{ isolation: 'isolate' }}
        >
          <ArtifactCanvas />
        </div>,
        document.body
      )}

      {/* Inline Canvas Container (when not fullscreen) */}
      <AnimatePresence initial={false}>
        {isArtifactOpen && !isFullscreen && (
          <motion.aside
            key="canvas-drawer"
            ref={canvasContainerRef}
            variants={canvasDrawerVariants}
            initial="animate-out"
            animate="animate-in"
            exit="animate-out"
            style={canvasMainStyle}
            className={`flex flex-col h-full bg-[var(--surface-card)] shrink-0 z-20 overflow-hidden ${
              !isDesktop
                ? 'fixed inset-y-0 end-0 z-50 w-full sm:w-[500px] border-s border-[var(--border-default)] shadow-2xl'
                : 'relative'
            }`}
          >
            {/* Inner stable container dynamically sized on desktop */}
            <div 
              className="h-full w-full flex flex-col flex-nowrap"
              style={{
                width: isDesktop ? `${effectiveCanvasWidth}px` : '100%',
                maxWidth: isDesktop ? `${effectiveCanvasWidth}px` : '100%',
                minWidth: isDesktop ? `${effectiveCanvasWidth}px` : '100%',
              }}
            >
              <ArtifactCanvas />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}



