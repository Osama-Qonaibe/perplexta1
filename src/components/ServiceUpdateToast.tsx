import { secureStorage } from "@/lib/storage";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const ServiceUpdateToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { language, dir } = useAppContext();
  const isAr = language === 'ar';

  useEffect(() => {
    // Check if user recently dismissed or updated within the last 30 minutes
    const lastDismissed = secureStorage.getSync('perplexta_update_dismissed');
    const updateApplied = secureStorage.getSync('perplexta_update_applied');
    const now = Date.now();
    
    if (lastDismissed && now - parseInt(lastDismissed, 10) < 30 * 60 * 1000) {
      return; // Do not show if dismissed recently
    }

    const onUpdateFound = () => {
      // If already applied in this session/version, skip
      if (updateApplied && now - parseInt(updateApplied, 10) < 60 * 60 * 1000) {
        return;
      }
      setVisible(true);
    };

    window.addEventListener('pwa-version-mismatch', onUpdateFound);
    window.addEventListener('service-worker-updated', onUpdateFound);
    
    return () => {
      window.removeEventListener('pwa-version-mismatch', onUpdateFound);
      window.removeEventListener('service-worker-updated', onUpdateFound);
    };
  }, []);

  const close = () => {
    secureStorage.set('perplexta_update_dismissed', Date.now().toString());
    setVisible(false);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Save session state to prevent repetitive update prompts
    secureStorage.set('perplexta_update_applied', Date.now().toString());
    sessionStorage.setItem('perplexta_session_synced', 'true');

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.error('Hard reset cache bypass error:', e);
    }

    // Perform clean reload without query params that trigger iframe security blocks
    setVisible(false);
    try {
      window.location.reload();
    } catch (_) {
      window.location.href = window.location.pathname;
    }
  };

  const isRtl = dir === 'rtl';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          id="service-update-toast"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-[calc(54px+env(safe-area-inset-top,0px))] z-[99999] flex items-center gap-2 px-2.5 py-1.5 min-h-[36px] rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] backdrop-blur-xl shadow-xl text-[var(--text-primary)] pointer-events-auto w-auto max-w-[calc(100vw-32px)] sm:max-w-[320px] left-1/2 -translate-x-1/2 sm:translate-x-0 ${
            isRtl ? 'sm:left-5 sm:right-auto' : 'sm:right-5 sm:left-auto'
          }`}
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {/* Green Status Light Icon Badge */}
          <div className="relative w-5.5 h-5.5 rounded-shape-xs bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 text-[var(--fg-success)] dark:text-[var(--fg-success)] flex items-center justify-center shrink-0">
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--fg-success)]"></span>
            </span>
            <RefreshCw className={`w-3 h-3 shrink-0 ${isUpdating ? 'animate-spin' : ''}`} />
          </div>

          {/* Concise Typography */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[var(--text-primary)] whitespace-nowrap leading-none">
              {isAr ? 'تحديث جديد' : 'New update'}
            </p>
          </div>

          {/* Action / Dismiss Group */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="service-update-action-btn"
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="h-6 px-2.5 bg-[var(--fg-success)] hover:bg-[var(--fg-success)] text-slate-950 font-bold text-[11px] rounded-shape-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-xs shadow-emerald-500/20 whitespace-nowrap"
            >
              <span>{isAr ? 'تحديث' : 'Update'}</span>
            </button>
            <button
              id="service-update-dismiss-btn"
              type="button"
              onClick={close}
              className="w-5 h-5 rounded-shape-xs flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer shrink-0"
              aria-label={isAr ? 'إغلاق' : 'Dismiss'}
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};



