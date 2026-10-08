/**
 * 📱 PERPLEXTA PWA SHELL — SWIPE GESTURE ENGINE (v1.0.0)
 * 
 * High-performance, native-like touch swipe gesture hook for the PWA shell.
 * Enables fluid, 60fps/120fps directional swipe transitions between main navigational components.
 * 
 * Features:
 * - Native angle & velocity detection (prevents interfering with vertical scrolling)
 * - Automatic RTL (Arabic) and LTR (English) directional normalization
 * - Safe-zone & interactive element collision avoidance (ignores inputs, carousels, modals, sliders)
 * - Zero-lag View Transitions integration with haptic feedback
 * - Interactive swipe progress & displacement state tracking
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { useViewTransitionNavigate } from '../utils/viewTransition';
import { useAppContext } from '../context/AppContext';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

export interface PWASwipeRouteConfig {
  path: string;
  id?: string;
  label?: string;
}

export interface UsePWASwipeNavigationOptions {
  /** Ordered list of route paths to cycle through */
  routes?: (string | PWASwipeRouteConfig)[];
  /** Custom callback when a swipe is triggered instead of default navigation */
  onSwipe?: (direction: 'next' | 'prev', targetPath?: string) => void;
  /** Custom callback for specific direction */
  onSwipeLeft?: () => void;
  /** Custom callback for specific direction */
  onSwipeRight?: () => void;
  /** Custom callback for specific direction */
  onSwipeUp?: () => void;
  /** Custom callback for specific direction */
  onSwipeDown?: () => void;
  /** Minimum pixel distance to register a swipe (default: 50px) */
  threshold?: number;
  /** Minimum velocity in px/ms to register a flick (default: 0.3) */
  velocityThreshold?: number;
  /** Maximum angle from horizontal axis in degrees before swipe is rejected as vertical scroll (default: 35) */
  maxAngleDegrees?: number;
  /** Whether the hook is active (default: true on mobile) */
  enabled?: boolean;
  /** Explicit text direction, defaults to AppContext language/dir */
  dir?: 'rtl' | 'ltr';
  /** Edge margin threshold in px to ignore system edge-swipe gestures like iOS back (default: 18) */
  edgeSafetyMargin?: number;
  /** Whether to trigger tactile haptics upon swipe registration (default: true) */
  haptics?: boolean;
  /** Whether to attach listeners globally to window/document (default: false, returns handlers for container) */
  global?: boolean;
}

export interface UsePWASwipeNavigationReturn {
  /** Active swipe state */
  isSwiping: boolean;
  /** Live horizontal displacement in pixels */
  deltaX: number;
  /** Live vertical displacement in pixels */
  deltaY: number;
  /** Current gesture primary direction */
  direction: SwipeDirection;
  /** Normalized progress (0 to 1) based on threshold */
  progress: number;
  /** Ref to attach to swipeable container if global is false */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Touch event handlers for manual element binding */
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
}

// Default main navigation routes in standard PWA shell
export const DEFAULT_PWA_SHELL_ROUTES: PWASwipeRouteConfig[] = [
  { path: '/chat', id: 'chat', label: 'Chat' },
  { path: '/discover', id: 'discover', label: 'Explore' },
  { path: '/bulletin', id: 'viralbook', label: 'Perplexta Board' },
  { path: '/settings', id: 'settings', label: 'Settings' },
];

/** Check if touch originated on an interactive or horizontally scrollable element */
function shouldIgnoreTouchTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  // Ignore form controls & text fields
  const tagName = target.tagName.toLowerCase();
  if (['input', 'textarea', 'select', 'button', 'option'].includes(tagName)) {
    return true;
  }

  // Ignore contenteditable elements
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Ignore interactive UI roles & modal dialogs
  const role = target.getAttribute('role');
  if (['slider', 'progressbar', 'dialog', 'alertdialog', 'menu', 'listbox', 'combobox'].includes(role || '')) {
    return true;
  }

  // Ignore elements explicitly marked with no-swipe attributes or classes
  if (
    target.closest('[data-no-swipe="true"]') ||
    target.closest('.no-swipe') ||
    target.closest('.vb-story-viewer') ||
    target.closest('.vb-reels-container') ||
    target.closest('.leaflet-container') ||
    target.closest('.custom-audio-scrubber')
  ) {
    return true;
  }

  // Check if target is inside an explicitly horizontally scrollable container
  let el: HTMLElement | null = target;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 10) {
      return true;
    }
    el = el.parentElement;
  }

  return false;
}

export function usePWASwipeNavigation({
  routes = DEFAULT_PWA_SHELL_ROUTES,
  onSwipe,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  maxAngleDegrees = 35,
  enabled = true,
  dir,
  edgeSafetyMargin = 18,
  haptics = true,
  global = false,
}: UsePWASwipeNavigationOptions = {}): UsePWASwipeNavigationReturn {
  const { language, isMobile } = useAppContext();
  const location = useLocation();
  const navigate = useViewTransitionNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isRtl = dir ? dir === 'rtl' : language === 'ar';
  const isHookActive = enabled && (isMobile || (typeof window !== 'undefined' && window.innerWidth <= 1024));

  // Touch Tracking State
  const [isSwiping, setIsSwiping] = useState(false);
  const [deltaX, setDeltaX] = useState(0);
  const [deltaY, setDeltaY] = useState(0);
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const [progress, setProgress] = useState(0);

  const touchState = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
    isIgnored: boolean;
    isConfirmedHorizontal: boolean | null;
  }>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isIgnored: false,
    isConfirmedHorizontal: null,
  });

  // Extract normalized route path array
  const routePaths = useRef<string[]>([]);
  useEffect(() => {
    routePaths.current = routes.map((r) => (typeof r === 'string' ? r : r.path));
  }, [routes]);

  // Navigate to previous or next navigational route with view transitions
  const triggerRouteTransition = useCallback((action: 'next' | 'prev') => {
    if (onSwipe) {
      onSwipe(action);
      return;
    }

    const currentPath = location.pathname;
    const paths = routePaths.current;
    if (!paths.length) return;

    // Find current index
    let currentIndex = paths.findIndex((p) => {
      if (p === '/' && (currentPath === '/' || currentPath === '/chat')) return true;
      if (p === '/chat' && (currentPath === '/' || currentPath.startsWith('/chat'))) return true;
      return currentPath.startsWith(p);
    });

    if (currentIndex === -1) {
      // If on an unindexed route, fallback to root or default route
      currentIndex = 0;
    }

    let targetIndex = currentIndex;
    if (action === 'next') {
      targetIndex = (currentIndex + 1) % paths.length;
    } else {
      targetIndex = (currentIndex - 1 + paths.length) % paths.length;
    }

    const targetPath = paths[targetIndex];
    if (targetPath && targetPath !== currentPath) {
      if (haptics) {
        triggerHaptic('light');
      }
      navigate(targetPath);
    }
  }, [location.pathname, onSwipe, haptics, navigate]);

  const handleTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (!isHookActive || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const target = e.target;

    // Edge Safety Check (Avoid conflict with iOS edge-swipe back gesture)
    const windowWidth = window.innerWidth;
    if (touch.clientX <= edgeSafetyMargin || touch.clientX >= windowWidth - edgeSafetyMargin) {
      touchState.current.isIgnored = true;
      return;
    }

    // Check if touch target is interactive or horizontally scrollable
    if (shouldIgnoreTouchTarget(target)) {
      touchState.current.isIgnored = true;
      return;
    }

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isIgnored: false,
      isConfirmedHorizontal: null,
    };

    setIsSwiping(true);
    setDeltaX(0);
    setDeltaY(0);
    setProgress(0);
    setDirection(null);
  }, [isHookActive, edgeSafetyMargin]);

  const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (!isHookActive || touchState.current.isIgnored || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dX = touch.clientX - touchState.current.startX;
    const dY = touch.clientY - touchState.current.startY;
    const absX = Math.abs(dX);
    const absY = Math.abs(dY);

    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;

    // Initial direction lock determination (at 10px movement)
    if (touchState.current.isConfirmedHorizontal === null) {
      if (absX > 10 || absY > 10) {
        // Calculate gesture angle
        const angleRad = Math.atan2(absY, absX);
        const angleDeg = (angleRad * 180) / Math.PI;

        if (angleDeg <= maxAngleDegrees && absX > absY) {
          // Confirmed horizontal swipe gesture
          touchState.current.isConfirmedHorizontal = true;
        } else {
          // Vertical gesture / scrolling, abort hook to allow natural scroll
          touchState.current.isConfirmedHorizontal = false;
          touchState.current.isIgnored = true;
          setIsSwiping(false);
          return;
        }
      }
    }

    if (touchState.current.isConfirmedHorizontal) {
      setDeltaX(dX);
      setDeltaY(dY);
      setDirection(dX > 0 ? 'right' : 'left');
      setProgress(Math.min(1, Math.max(0, absX / threshold)));
    }
  }, [isHookActive, maxAngleDegrees, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isHookActive || touchState.current.isIgnored) {
      setIsSwiping(false);
      setDeltaX(0);
      setDeltaY(0);
      setProgress(0);
      setDirection(null);
      return;
    }

    const { startX, startY, currentX, currentY, startTime, isConfirmedHorizontal } = touchState.current;
    const dX = currentX - startX;
    const dY = currentY - startY;
    const absX = Math.abs(dX);
    const absY = Math.abs(dY);
    const elapsed = Math.max(1, Date.now() - startTime);
    const velocityX = absX / elapsed;
    const velocityY = absY / elapsed;

    // Reset state
    setIsSwiping(false);
    setDeltaX(0);
    setDeltaY(0);
    setProgress(0);
    setDirection(null);

    // If confirmed horizontal swipe
    if (isConfirmedHorizontal) {
      const isDistanceMet = absX >= threshold;
      const isVelocityMet = velocityX >= velocityThreshold && absX >= 25;

      if (isDistanceMet || isVelocityMet) {
        if (dX < 0) {
          // Swiped LEFT
          if (onSwipeLeft) {
            onSwipeLeft();
          } else {
            // In LTR: Left swipe = Next tab
            // In RTL: Left swipe = Prev tab
            triggerRouteTransition(isRtl ? 'prev' : 'next');
          }
        } else {
          // Swiped RIGHT
          if (onSwipeRight) {
            onSwipeRight();
          } else {
            // In LTR: Right swipe = Prev tab
            // In RTL: Right swipe = Next tab
            triggerRouteTransition(isRtl ? 'next' : 'prev');
          }
        }
      }
    } else if (absY >= threshold || (velocityY >= velocityThreshold && absY >= 25)) {
      if (dY < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (dY > 0 && onSwipeDown) {
        onSwipeDown();
      }
    }
  }, [
    isHookActive,
    threshold,
    velocityThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    isRtl,
    triggerRouteTransition,
  ]);

  const handleTouchCancel = useCallback(() => {
    setIsSwiping(false);
    setDeltaX(0);
    setDeltaY(0);
    setProgress(0);
    setDirection(null);
    touchState.current.isIgnored = true;
  }, []);

  // Global window listener attachment if requested
  useEffect(() => {
    if (!global || !isHookActive) return;

    const onStart = (e: TouchEvent) => handleTouchStart(e);
    const onMove = (e: TouchEvent) => handleTouchMove(e);
    const onEnd = () => handleTouchEnd();
    const onCancel = () => handleTouchCancel();

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onCancel);
    };
  }, [global, isHookActive, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    isSwiping,
    deltaX,
    deltaY,
    direction,
    progress,
    containerRef,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
