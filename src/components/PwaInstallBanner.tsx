import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { usePwaContext } from '../context/PwaContext';
import { isMobilePwaBannerHidden } from '../utils/sectionVisibility';
import { resolveImageUrl } from '../utils/imageResolver';
import { safeStorageGet } from '../utils/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Loader2, Share, PlusSquare } from 'lucide-react';
import { NotificationIconRenderer } from '../utils/imageProcessor';

export const PwaInstallBanner: React.FC = () => {
  const { siteSettings, language, theme, isStandaloneWebview } = useAppContext();

  const {
    installState,
    canInstall,
    mobilePlatform,
    hasPrompt,
    promptInstall,
    dismissBanner
  } = usePwaContext();

  const isStandaloneMode = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const isPreviouslyInstalled = safeStorageGet('perplexta_pwa_installed') === 'true';
  
  const isDesktop = mobilePlatform === 'desktop';
  const isIOS = mobilePlatform === 'ios-safari' || mobilePlatform === 'ios-other';

  const [isVisible, setIsVisible] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isDesktop) return;

    if (isStandaloneMode || isStandaloneWebview || isPreviouslyInstalled || (installState as string) === 'installed' || installState === 'dismissed') {
      setIsVisible(false);
      return;
    }

    const lastDismissedTime = safeStorageGet('perplexta_pwa_dismissed');
    const savedCount = parseInt(safeStorageGet('perplexta_pwa_dismiss_count') || '0', 10);
    
    let cooldownMs = 24 * 60 * 60 * 1000;
    if (savedCount === 2) cooldownMs = 3 * 24 * 60 * 60 * 1000;
    else if (savedCount >= 3) cooldownMs = 7 * 24 * 60 * 60 * 1000;

    const isCooldownActive = lastDismissedTime && (Date.now() - Number(lastDismissedTime) < cooldownMs);
    
    if (isCooldownActive) {
      setIsVisible(false);
      return;
    }

    if ((canInstall && hasPrompt) || isIOS) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [canInstall, hasPrompt, installState, isDesktop, isStandaloneMode, isPreviouslyInstalled, isIOS]);

  if (isDesktop || installState === 'installed' || isStandaloneMode || isStandaloneWebview || isPreviouslyInstalled || isMobilePwaBannerHidden(siteSettings?.blocked_paths)) {
    return null;
  }

  if (!hasPrompt && !isIOS) {
    return null;
  }

  const isAr = language === 'ar';

  const handleAction = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (canInstall && hasPrompt) {
      await promptInstall();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    dismissBanner();
  };

  const siteName = isAr
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'PERPLEXTA')
    : (siteSettings?.siteName || 'PERPLEXTA');

  const isAndroid = mobilePlatform === 'android-chrome' || mobilePlatform === 'android-other';

  if (!isVisible && !showIOSModal) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            id="pwa-install-banner-root"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed top-[calc(54px+env(safe-area-inset-top,0px))] left-3 right-3 sm:left-auto sm:right-4 z-[350] max-w-sm w-auto select-none pointer-events-auto font-sans"
          >
            <div className="p-3 sm:p-3.5 rounded-[var(--sys-shape-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl relative overflow-hidden flex items-center justify-between gap-3">
              
              {/* Left: Brand Icon & Notification Message */}
              <div className="flex items-center gap-2.5 min-w-0">
                <NotificationIconRenderer
                  src={resolveImageUrl((theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings?.logoLightBase64 : siteSettings?.logoBase64, 'general')}
                  alt={siteName}
                  size={34}
                  className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] p-1 shrink-0"
                  fallbackIcon={
                    <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] p-1 shrink-0">
                      <Smartphone size={16} />
                    </div>
                  }
                />
                
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {siteName}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-default)]">
                      {isAndroid ? (isAr ? 'أندرويد' : 'Android') : isIOS ? (isAr ? 'آيفون' : 'iOS') : (isAr ? 'تطبيق أصلي' : 'Native')}
                    </span>
                  </div>
                  <p className="text-[10.5px] font-medium text-[var(--text-muted)] truncate mt-0.5">
                    {isAr ? 'ثبت التطبيق للحصول على أداء فائق وسرعة مضاعفة' : 'Install app for high performance and zero latency'}
                  </p>
                </div>
              </div>

              {/* Right: Direct Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={installState === 'installing'}
                  className="px-3 py-1.5 text-[11px] font-extrabold rounded-[var(--radius-md)] bg-[var(--fg-accent)] text-[var(--comp-button-primary-fg,#ffffff)] hover:opacity-90 active:scale-95 transition-all min-h-[36px] flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  {installState === 'installing' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Download size={13} />
                      <span>{isAr ? 'تثبيت' : 'Install'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 rounded-[var(--sys-shape-xs)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                >
                  <X size={15} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Step-by-Step Installation Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] p-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[var(--fg-accent)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {isAr ? 'تثبيت على أجهزة iPhone / iPad' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-[var(--text-secondary)]">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {isAr ? 'اضغط على زر المشاركة (Share)' : 'Tap the Share icon'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      {isAr ? 'موجود في شريط متصفح Safari أسفل الشاشة' : 'Located at the bottom of the Safari toolbar'}
                      <Share size={12} className="inline text-[var(--fg-accent)]" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {isAr ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      {isAr ? 'انتقل للأسفل في القائمة واضغط على' : 'Scroll down the action sheet and tap'}
                      <PlusSquare size={12} className="inline text-[var(--fg-accent)]" />
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-[var(--radius-md)] bg-[var(--fg-accent)] text-[var(--comp-button-primary-fg,#ffffff)] font-bold text-xs hover:opacity-90 transition shadow"
              >
                {isAr ? 'فهمت ذلك' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
