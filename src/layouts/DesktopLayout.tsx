import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { MobileChatHistoryDrawer } from '../components/mobile/MobileChatHistoryDrawer';
import { SponsoredSidebar } from '../components/SponsoredSidebar';
import { useAppContext } from '../context/AppContext';
import { useArtifact } from '../context/ArtifactContext';
import { motion, AnimatePresence } from 'motion/react';
import { SIDEBAR_TRANSITION } from '@/design-system';
import { isInsideActiveViewport } from '../utils/boundaryCheck';

export const DesktopLayout: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen, language, isMobile } = useAppContext();
  const { isFullscreen } = useArtifact();
  const location = useLocation();

  const isViralbookRoute = location.pathname.startsWith('/viralbook') || location.pathname.startsWith('/bulletin') || location.pathname.startsWith('/reels');
  const isStudioRoute = location.pathname.startsWith('/app') || location.pathname.startsWith('/image-studio') || location.pathname.startsWith('/studio') || location.pathname.startsWith('/audio-studio');
  const isCreatorRoute = location.pathname.startsWith('/creator');
  const isFullSovereignView = isViralbookRoute || isStudioRoute || isCreatorRoute || isFullscreen;
  // Stable base sidebar offset to eliminate any horizontal layout shifts
  const baseSidebarOffset = (isMobile || isFullSovereignView) ? 0 : 50;
  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname === '/';

  // Dynamic smooth collapse when clicking outside sidebar on desktop
  React.useEffect(() => {
    if (!isSidebarOpen || isMobile) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      // Ignore clicks/touches in top/bottom buffer zones (outside active viewport area)
      if (!isInsideActiveViewport(e, { topBuffer: 18, bottomBuffer: 18 })) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('aside')) return;
      if (target.closest('button[aria-label="Open Sidebar"]')) return;

      setIsSidebarOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick, { capture: true });
    window.addEventListener('touchstart', handleOutsideClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick, { capture: true });
      window.removeEventListener('touchstart', handleOutsideClick, { capture: true });
    };
  }, [isSidebarOpen, setIsSidebarOpen, isMobile]);

  // Collapse sidebar on route change
  React.useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme">
      {!isFullSovereignView && (
        <Header activeLanguage={language} />
      )}

      {/* Standard Desktop Sidebar */}
      {!isFullSovereignView && (
        <div className="hidden lg:block">
          <Sidebar activeLanguage={language} />
        </div>
      )}

      {/* Main Layout Content Area - Fixed stable padding to prevent any horizontal jump */}
      <div
        className={`flex-1 flex flex-col relative min-w-0 h-full main-scroll-container overflow-x-hidden ${
          isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
        style={{
          paddingInlineStart: `${baseSidebarOffset}px`,
          ...(isFullscreen ? {} : {
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }),
          WebkitOverflowScrolling: 'touch',
          ...(isChatRoute ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : {}),
        }}
      >
        <main className={`flex-1 min-h-full relative ${
          isFullSovereignView ? 'pt-0' : 'pt-[calc(56px+env(safe-area-inset-top,0px))]'
        } pb-0 bg-[var(--surface-page)] transition-theme flex flex-col`}>
          <div
            className="flex-1 w-full relative min-w-0 flex flex-col min-h-full"
          >
            <Outlet />
          </div>
          {!isFullSovereignView && <SponsoredSidebar />}
        </main>
      </div>

      <AuthModal />
      <MobileChatHistoryDrawer />
    </div>
  );
};
