import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopBar } from '../components/admin/AdminTopBar';
import { AuthModal } from '../components/AuthModal';
import { DesktopOnlyNotice } from '../components/mobile/DesktopOnlyNotice';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export const AdminLayout: React.FC = () => {
  const { dir, language, isMobile } = useAppContext();

  // Guard: If viewed on small mobile screen, display native lightweight notice instead of heavy ERP tables
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col h-[100dvh] w-full overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)]" dir={dir}>
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <DesktopOnlyNotice />
        </main>
        <AuthModal />
      </div>
    );
  }

  return (
    <motion.div 
      dir={dir}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)] select-none"
    >
      {/* Sovereign Admin Executive TopBar */}
      <AdminTopBar />

      {/* Admin Workspace Body */}
      <div className="flex-1 flex w-full h-[calc(100dvh-60px)] overflow-hidden relative">
        <AdminSidebar activeLanguage={language} />

        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-smooth overscroll-none custom-scrollbar bg-inherit">
          <div className="min-h-full flex flex-col px-6 md:px-8 pt-0 pb-16">
            <Outlet />
          </div>
        </main>
      </div>

      <AuthModal />
    </motion.div>
  );
};
