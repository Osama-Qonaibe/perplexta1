/**
 * 🧭 PERPLEXTA DESIGN SYSTEM — ADAPTIVE MENU POSITIONING ENGINE
 * 
 * High-performance, zero-sagging, dynamic coordinate engine for floating menus,
 * dropdowns, and nested sub-menus.
 * 
 * Key Capabilities:
 * - Dynamic RTL calculation inspecting document direction with live MutationObserver
 * - Sub-menu extension anchored strictly to the parent button's internal anchor edge
 * - Bidirectional viewport collision detection with graceful horizontal/vertical flipping
 * - Decelerated scale animation ([0.16, 1, 0.3, 1]) without vertical sagging
 * - Strict touch/scroll containment with zero event leakage
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { SCROLL_STYLES } from '../styles/scrollStyles';

// Unified zero-sagging popover animation anchored strictly to corner
const menuVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.98,
    transition: { 
      duration: 0.08, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
    }
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.10, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
    }
  }
};

export interface AdaptiveMenuOffset {
  x?: number;
  y?: number;
  overlap?: number;
}

export type AdaptiveMenuPlacement = 
  | 'submenu' 
  | 'bottom-start' 
  | 'bottom-end' 
  | 'top-start' 
  | 'top-end' 
  | 'outward-sidebar' 
  | 'sidebar-profile' 
  | 'auto';

export interface AdaptiveMenuPositionParams {
  triggerRect: DOMRect | null;
  popoverWidth: number;
  popoverHeight: number;
  viewportWidth?: number;
  viewportHeight?: number;
  placement?: AdaptiveMenuPlacement;
  direction?: 'rtl' | 'ltr';
  offset?: AdaptiveMenuOffset | number;
  edgePadding?: number;
}

export interface AdaptiveMenuPositionResult {
  top: number;
  left: number;
  isFlippedUp: boolean;
  isFlippedHorizontal: boolean;
  isSidebarClosed?: boolean;
  originClass: string;
  transformOrigin: string;
  anchorEdge: 'left' | 'right' | 'top' | 'bottom';
  direction: 'rtl' | 'ltr';
}

/**
 * Dynamically resolves the current document direction (RTL or LTR).
 * Inspects document.documentElement, document.body, document.dir, or computed styles.
 */
export function getDocumentDirection(explicitDir?: 'rtl' | 'ltr'): 'rtl' | 'ltr' {
  if (explicitDir === 'rtl' || explicitDir === 'ltr') {
    return explicitDir;
  }
  if (typeof document !== 'undefined') {
    const htmlDir = document.documentElement.getAttribute('dir');
    if (htmlDir === 'rtl' || htmlDir === 'ltr') return htmlDir;

    const bodyDir = document.body.getAttribute('dir');
    if (bodyDir === 'rtl' || bodyDir === 'ltr') return bodyDir;

    if (document.dir === 'rtl' || document.dir === 'ltr') return document.dir;

    try {
      const computed = window.getComputedStyle(document.documentElement).direction;
      if (computed === 'rtl' || computed === 'ltr') return computed;
    } catch {
      // Fallback below
    }
  }
  return 'rtl'; // Default Arab-centric platform standard
}

/**
 * Reactive React hook that tracks the document's RTL direction in real-time.
 * Automatically updates if the `dir` or `lang` attribute on <html> or <body> changes.
 */
export function useDocumentDirection(explicitDir?: 'rtl' | 'ltr'): 'rtl' | 'ltr' {
  const [currentDir, setCurrentDir] = useState<'rtl' | 'ltr'>(() => getDocumentDirection(explicitDir));

  useEffect(() => {
    if (explicitDir) {
      setCurrentDir(explicitDir);
      return;
    }

    const updateDir = () => {
      setCurrentDir(getDocumentDirection());
    };

    updateDir();

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && (m.attributeName === 'dir' || m.attributeName === 'lang')) {
            updateDir();
          }
        }
      });

      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
      observer.observe(document.body, { attributes: true, attributeFilter: ['dir', 'lang'] });

      return () => observer.disconnect();
    }
  }, [explicitDir]);

  return currentDir;
}

/**
 * Pure mathematical positioning logic for AdaptiveMenu.
 * Computes exact top/left coordinates, viewport collision boundaries, and anchor origin classes.
 */
export function calculateAdaptiveMenuPosition({
  triggerRect,
  popoverWidth,
  popoverHeight,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768,
  placement = 'auto',
  direction,
  offset = 0,
  edgePadding = 8
}: AdaptiveMenuPositionParams): AdaptiveMenuPositionResult {
  if (!triggerRect) {
    return {
      top: 0,
      left: 0,
      isFlippedUp: false,
      isFlippedHorizontal: false,
      isSidebarClosed: false,
      originClass: 'origin-top-right',
      transformOrigin: 'top right',
      anchorEdge: 'bottom',
      direction: 'rtl'
    };
  }

  const effectiveDir = getDocumentDirection(direction);
  const isRtl = effectiveDir === 'rtl';

  const offsetX = typeof offset === 'number' ? offset : (offset.x ?? 0);
  const offsetY = typeof offset === 'number' ? offset : (offset.y ?? 0);
  const overlap = typeof offset === 'object' && offset.overlap !== undefined ? offset.overlap : 4;

  let top = triggerRect.top;
  let left = triggerRect.left;
  let isFlippedUp = false;
  let isFlippedHorizontal = false;
  let isSidebarClosed = false;
  let originClass = 'origin-top-right';
  let anchorEdge: 'left' | 'right' | 'top' | 'bottom' = 'bottom';

  // =========================================================================
  // 1. SUB-MENU POSITIONING ENGINE
  // =========================================================================
  // Sub-menus cascade horizontally relative to the parent button's INTERNAL anchor edge.
  // In RTL: The parent button's internal anchor edge is its LEFT edge (facing inward to the page).
  //         Sub-menu extends to the LEFT into the page content.
  // In LTR: The parent button's internal anchor edge is its RIGHT edge (facing inward to the page).
  //         Sub-menu extends to the RIGHT into the page content.
  if (placement === 'submenu') {
    // Vertical alignment:
    // Default: Align top with parent button, adjusted by -4px container padding compensation
    const desiredTop = triggerRect.top - 4 + offsetY;
    const spaceBelow = viewportHeight - desiredTop - edgePadding;
    
    if (spaceBelow < popoverHeight && triggerRect.bottom - edgePadding >= popoverHeight) {
      // Not enough space below, flip up aligned to parent button's bottom
      isFlippedUp = true;
      top = triggerRect.bottom - popoverHeight + 4 - offsetY;
    } else {
      isFlippedUp = false;
      top = desiredTop;
    }

    if (isRtl) {
      // RTL Parent Internal Anchor Edge: triggerRect.left
      // Primary extension direction: LEFT
      anchorEdge = 'left';
      const normalLeft = triggerRect.left - popoverWidth + overlap - offsetX;

      // Check collision with left viewport edge
      if (normalLeft < edgePadding) {
        // Left boundary hit -> Flip horizontally to extend RIGHT from parent button's right edge
        const flippedLeft = triggerRect.right - overlap + offsetX;
        const fitsOnRight = flippedLeft + popoverWidth <= viewportWidth - edgePadding;

        if (fitsOnRight || (viewportWidth - triggerRect.right) > triggerRect.left) {
          isFlippedHorizontal = true;
          left = flippedLeft;
          anchorEdge = 'right';
          originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
        } else {
          // Viewport is extremely narrow on both sides: clamp to edge
          left = edgePadding;
          originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
        }
      } else {
        // Fits comfortably extending left from internal anchor edge
        left = normalLeft;
        originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
      }
    } else {
      // LTR Parent Internal Anchor Edge: triggerRect.right
      // Primary extension direction: RIGHT
      anchorEdge = 'right';
      const normalLeft = triggerRect.right - overlap + offsetX;

      // Check collision with right viewport edge
      if (normalLeft + popoverWidth > viewportWidth - edgePadding) {
        // Right boundary hit -> Flip horizontally to extend LEFT from parent button's left edge
        const flippedLeft = triggerRect.left - popoverWidth + overlap - offsetX;
        const fitsOnLeft = flippedLeft >= edgePadding;

        if (fitsOnLeft || triggerRect.left > (viewportWidth - triggerRect.right)) {
          isFlippedHorizontal = true;
          left = flippedLeft;
          anchorEdge = 'left';
          originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
        } else {
          // Clamp to edge
          left = Math.max(edgePadding, viewportWidth - popoverWidth - edgePadding);
          originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
        }
      } else {
        // Fits comfortably extending right from internal anchor edge
        left = normalLeft;
        originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
      }
    }
  }

  // =========================================================================
  // 2. SIDEBAR PROFILE POPUP ENGINE
  // =========================================================================
  else if (placement === 'sidebar-profile') {
    const isCollapsed = triggerRect.width < 100;
    isSidebarClosed = isCollapsed;

    if (isCollapsed) {
      // Closed sidebar -> Pop outward to the side of the sidebar
      if (isRtl) {
        left = triggerRect.left - popoverWidth - 10 - offsetX;
        if (left < edgePadding) {
          left = Math.max(edgePadding, triggerRect.right + 10 + offsetX);
          originClass = 'origin-bottom-left';
        } else {
          originClass = 'origin-bottom-right';
        }
      } else {
        left = triggerRect.right + 10 + offsetX;
        if (left + popoverWidth > viewportWidth - edgePadding) {
          left = Math.max(edgePadding, triggerRect.left - popoverWidth - 10 - offsetX);
          originClass = 'origin-bottom-right';
        } else {
          originClass = 'origin-bottom-left';
        }
      }
      isFlippedUp = true;
      top = triggerRect.bottom - popoverHeight + offsetY;
    } else {
      // Open sidebar -> Pop upwards above the profile row
      isFlippedUp = true;
      if (isRtl) {
        left = triggerRect.right - popoverWidth - offsetX;
        if (left < edgePadding) {
          left = triggerRect.left + offsetX;
          originClass = 'origin-bottom-left';
        } else {
          originClass = 'origin-bottom-right';
        }
      } else {
        left = triggerRect.left + offsetX;
        if (left + popoverWidth > viewportWidth - edgePadding) {
          left = triggerRect.right - popoverWidth - offsetX;
          originClass = 'origin-bottom-right';
        } else {
          originClass = 'origin-bottom-left';
        }
      }
      top = triggerRect.top - popoverHeight - 8 - offsetY;
    }
  }

  // =========================================================================
  // 3. OUTWARD SIDEBAR POPUP ENGINE
  // =========================================================================
  else if (placement === 'outward-sidebar') {
    const spaceBelow = viewportHeight - triggerRect.bottom - edgePadding;
    const spaceAbove = triggerRect.top - edgePadding;

    if (spaceBelow < popoverHeight && (spaceAbove >= popoverHeight || spaceAbove > spaceBelow)) {
      isFlippedUp = true;
      top = triggerRect.bottom - popoverHeight - offsetY;
    } else {
      isFlippedUp = false;
      top = triggerRect.top + offsetY;
    }

    if (isRtl) {
      left = triggerRect.left - popoverWidth - 8 - offsetX;
      if (left < edgePadding) {
        left = Math.max(edgePadding, triggerRect.right + 8 + offsetX);
        originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
      } else {
        originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
      }
    } else {
      left = triggerRect.right + 8 + offsetX;
      if (left + popoverWidth > viewportWidth - edgePadding) {
        left = Math.max(edgePadding, triggerRect.left - popoverWidth - 8 - offsetX);
        originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
      } else {
        originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
      }
    }
  }

  // =========================================================================
  // 4. STANDARD TOP / BOTTOM DROPDOWN ENGINE (INWARD CORNER ANCHORING)
  // =========================================================================
  else {
    const isTopPlacement = placement === 'top-start' || placement === 'top-end';
    const spaceBelow = viewportHeight - triggerRect.bottom - edgePadding;
    const spaceAbove = triggerRect.top - edgePadding;

    // Decide vertical flipping:
    if (isTopPlacement || (spaceBelow < popoverHeight && (spaceAbove >= popoverHeight || spaceAbove > spaceBelow))) {
      isFlippedUp = true;
      top = triggerRect.top - popoverHeight - 4 - offsetY;
    } else {
      isFlippedUp = false;
      top = triggerRect.bottom + 4 + offsetY;
    }

    // Determine horizontal anchoring based on document direction & button position
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const isTriggerOnLeft = triggerCenterX < viewportWidth / 2;

    let preferLeftAnchor = isTriggerOnLeft;
    if (placement === 'bottom-end' || placement === 'top-end') {
      preferLeftAnchor = isRtl; // In RTL, 'end' is on the left
    } else if (placement === 'bottom-start' || placement === 'top-start') {
      preferLeftAnchor = !isRtl; // In RTL, 'start' is on the right
    }

    if (preferLeftAnchor) {
      // Anchored to trigger's left edge, extending RIGHT into the page
      left = triggerRect.left + offsetX;
      if (left + popoverWidth > viewportWidth - edgePadding) {
        // Not enough room to the right -> flip to right anchor
        left = Math.max(edgePadding, triggerRect.right - popoverWidth - offsetX);
        originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
      } else {
        originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
      }
    } else {
      // Anchored to trigger's right edge, extending LEFT into the page
      left = triggerRect.right - popoverWidth - offsetX;
      if (left < edgePadding) {
        // Not enough room to the left -> flip to left anchor
        left = Math.min(triggerRect.left + offsetX, viewportWidth - popoverWidth - edgePadding);
        originClass = isFlippedUp ? 'origin-bottom-left' : 'origin-top-left';
      } else {
        originClass = isFlippedUp ? 'origin-bottom-right' : 'origin-top-right';
      }
    }
  }

  // =========================================================================
  // 5. HARD VIEWPORT CLAMPING (ZERO-LEAKAGE GUARANTEE)
  // =========================================================================
  top = Math.max(edgePadding, Math.min(top, viewportHeight - popoverHeight - edgePadding));
  left = Math.max(edgePadding, Math.min(left, viewportWidth - popoverWidth - edgePadding));

  // Derive CSS transformOrigin from originClass for precise corner-anchored Framer Motion scaling
  let transformOrigin = 'top left';
  if (originClass === 'origin-bottom-right') transformOrigin = 'bottom right';
  else if (originClass === 'origin-bottom-left') transformOrigin = 'bottom left';
  else if (originClass === 'origin-top-right') transformOrigin = 'top right';
  else if (originClass === 'origin-top-left') transformOrigin = 'top left';

  return {
    top,
    left,
    isFlippedUp,
    isFlippedHorizontal,
    isSidebarClosed,
    originClass,
    transformOrigin,
    anchorEdge,
    direction: effectiveDir
  };
}

export interface AdaptiveMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRect: DOMRect | null;
  direction?: 'rtl' | 'ltr';
  placement?: AdaptiveMenuPlacement;
  offset?: AdaptiveMenuOffset | number;
  edgePadding?: number;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  closeOnScroll?: boolean;
}

export const AdaptiveMenu: React.FC<AdaptiveMenuProps> = ({
  isOpen,
  onClose,
  triggerRect,
  direction,
  placement = 'auto',
  offset = 0,
  edgePadding = 8,
  children,
  className = '',
  width = 'auto',
  closeOnScroll = true
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const effectiveDirection = useDocumentDirection(direction);

  const [coords, setCoords] = useState<AdaptiveMenuPositionResult>(() => ({
    top: 0,
    left: 0,
    isFlippedUp: false,
    isFlippedHorizontal: false,
    isSidebarClosed: false,
    originClass: effectiveDirection === 'rtl' ? 'origin-top-right' : 'origin-top-left',
    transformOrigin: effectiveDirection === 'rtl' ? 'top right' : 'top left',
    anchorEdge: 'bottom',
    direction: effectiveDirection
  }));

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRect) return;

    const popoverWidth = popoverRef.current?.offsetWidth || (typeof width === 'number' ? width : 210);
    const popoverHeight = popoverRef.current?.offsetHeight || 290;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const result = calculateAdaptiveMenuPosition({
      triggerRect,
      popoverWidth,
      popoverHeight,
      viewportWidth,
      viewportHeight,
      placement,
      direction: effectiveDirection,
      offset,
      edgePadding
    });

    setCoords(result);
  }, [isOpen, triggerRect, placement, effectiveDirection, offset, edgePadding, width]);

  useLayoutEffect(() => {
    updatePosition();

    if (!popoverRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    resizeObserver.observe(popoverRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      if (!closeOnScroll) return;
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnScroll]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && triggerRect && (
        <motion.div 
          initial="closed"
          animate="open"
          exit="closed"
          className="fixed inset-0 z-[99990] pointer-events-auto overflow-hidden"
        >
          {/* Invisible Backdrop for click-outside dismissal with zero event leakage */}
          <div 
            className="fixed inset-0 bg-transparent z-[99991]" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />

          {/* Floating Adaptive Menu Container with zero-sagging corner-anchored animation */}
          <motion.div
            ref={popoverRef}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transformOrigin: coords.transformOrigin,
              width: width === 'auto' ? undefined : (typeof width === 'number' ? `${width}px` : width),
            }}
            className={`z-[99999] rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] backdrop-blur-xl ${SCROLL_STYLES.dropdown} max-h-[calc(100vh-24px)] ${coords.originClass} shadow-xl ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-fast p-1 flex flex-col gap-0.5 ${
              width === 'auto' ? 'w-max min-w-[180px] max-w-[calc(100vw-1.5rem)]' : ''
            } ${className}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            dir={coords.direction}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export interface AdaptiveSubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  parentRect: DOMRect | null;
  direction?: 'rtl' | 'ltr';
  offset?: AdaptiveMenuOffset | number;
  edgePadding?: number;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
}

export const AdaptiveSubmenu: React.FC<AdaptiveSubmenuProps> = ({
  isOpen,
  onClose,
  parentRect,
  direction,
  offset = 0,
  edgePadding = 8,
  children,
  className = '',
  width = 'auto',
}) => {
  return (
    <AdaptiveMenu
      isOpen={isOpen}
      onClose={onClose}
      triggerRect={parentRect}
      placement="submenu"
      direction={direction}
      offset={offset}
      edgePadding={edgePadding}
      className={className}
      width={width}
    >
      {children}
    </AdaptiveMenu>
  );
};

// Aliases for seamless drop-in backwards compatibility
export { AdaptiveMenu as FloatingPopover };
export default AdaptiveMenu;

