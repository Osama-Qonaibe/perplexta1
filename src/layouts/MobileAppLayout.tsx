import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { MobileNavigation } from '../components/mobile/MobileNavigation';
import { MobileChatHistoryDrawer } from '../components/mobile/MobileChatHistoryDrawer';
import { DesktopOnlyNotice } from '../components/mobile/DesktopOnlyNotice';
import { useAppContext } from '../context/AppContext';
import { useArtifact } from '../context/ArtifactContext';
import { isDesktopOnlyRoute } from '../constants/mobileCapabilities';
import { usePWASwipeNavigation, DEFAULT_PWA_SHELL_ROUTES } from '../hooks/usePWASwipeNavigation';
import { motion, AnimatePresence } from 'motion/react';

export const MobileAppLayout: React.FC = () => {
  const { language } = useAppContext();
  const { isFullscreen } = useArtifact();
  const location = useLocation();

  const isRestrictedRoute = isDesktopOnlyRoute(location.pathname);
  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname === '/';
  const isViralbookRoute = location.pathname.startsWith('/viralbook') || location.pathname.startsWith('/bulletin') || location.pathname.startsWith('/reels');
  const isStudioRoute = location.pathname.startsWith('/studio') || location.pathname.startsWith('/image-studio') || location.pathname.startsWith('/app') || location.pathname.startsWith('/audio-studio') || location.pathname.startsWith('/creator');
  const isIsolatedMobileView = isViralbookRoute || isStudioRoute;

  // Capture native touch swipe gestures across PWA shell components
  const { touchHandlers } = usePWASwipeNavigation({
    routes: DEFAULT_PWA_SHELL_ROUTES,
    threshold: 55,
    velocityThreshold: 0.35,
    maxAngleDegrees: 32,
    enabled: !isIsolatedMobileView && !isFullscreen, // ViralBook and Studios manage their internal gestures
  });

  return (
    <div 
      className="flex flex-col h-[100dvh] w-full overflow-hidden relative bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme select-none"
      {...touchHandlers}
    >
      {/* Native Compact Top Mobile Header */}
      {!isIsolatedMobileView && !isFullscreen && (
        <Header activeLanguage={language} />
      )}

      {/* Main Mobile Viewport */}
      <main className={`flex-1 flex flex-col overflow-hidden relative ${
        (isIsolatedMobileView || isFullscreen)
          ? 'pt-0 pb-0'
          : 'pt-[calc(52px+env(safe-area-inset-top,0px))] pb-[calc(56px+env(safe-area-inset-bottom,0px))]'
      } bg-[var(--surface-page)] transition-theme`}>
        <div
          className={`flex-1 h-full relative min-w-0 main-scroll-container ${
            isChatRoute || isFullscreen
              ? 'overflow-hidden flex flex-col'
              : 'overflow-y-auto scrollbar-none touch-pan-y overscroll-y-contain'
          }`}
          style={isChatRoute || isFullscreen ? undefined : { WebkitOverflowScrolling: 'touch' }}
        >
          {isRestrictedRoute ? (
            <div className="p-4 flex items-center justify-center min-h-full">
              <DesktopOnlyNotice />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      {!isIsolatedMobileView && !isFullscreen && (
        <MobileNavigation />
      )}

      {/* Global Auth Modal & Mobile Chat History Drawer */}
      <AuthModal />
      <MobileChatHistoryDrawer />
    </div>
  );
};

