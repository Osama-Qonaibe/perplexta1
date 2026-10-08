import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { ShieldAlert, Clock, LogOut } from 'lucide-react';

export const InactivityWarningModal: React.FC = () => {
  const {
    showInactivityWarning,
    inactivityCountdown,
    extendSession,
    logout,
    dir
  } = useAppContext();

  if (!showInactivityWarning) return null;

  const getWarningDescription = () => {
    const isAr = dir === 'rtl';
    if (isAr) {
      return (
        <span className="text-[var(--text-secondary)] text-sm leading-relaxed block">
          لقد كنت غير نشط لفترة من الوقت. لحماية حسابك وأمان بياناتك الرقمية، سيتم تسجيل خروجك تلقائياً خلال{' '}
          <strong className="text-[var(--fg-accent)] font-extrabold text-base tracking-wider">
            {inactivityCountdown}
          </strong>{' '}
          ثانية.
        </span>
      );
    }
    return (
      <span className="text-[var(--text-secondary)] text-sm leading-relaxed block">
        We noticed you have been inactive. For your system security and privacy protection, you will be automatically logged out in{' '}
        <strong className="text-[var(--fg-accent)] font-extrabold text-base tracking-wider">
          {inactivityCountdown}
        </strong>{' '}
        seconds.
      </span>
    );
  };

  const isAr = dir === 'rtl';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden font-sans select-none">
        {/* Dark Backdrop overlay with strong blur effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={extendSession} // any click on the backdrop also securely extends session
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Action Window Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md mx-4 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] shadow-2xl p-6 md:p-8"
        >
          {/* Top Decorative Alert Icon Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] animate-ping duration-2000" />
              {/* Inner container */}
              <div className="relative w-14 h-14 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-accent)]">
                <ShieldAlert className="w-7 h-7 text-[var(--fg-accent)]" />
              </div>
            </div>

            {/* Modal Title */}
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight mb-3">
              {isAr ? 'جلسة العمل على وشك الانتهاء' : 'Session Security Monitor'}
            </h3>

            {/* Description containing remaining seconds */}
            <div className="mb-6 bg-[var(--surface-subtle)] rounded-[var(--radius-xs)] px-4 py-3 border border-[var(--border-default)] text-[var(--text-secondary)]">
              {getWarningDescription()}
            </div>

            {/* Countdown Slider Progress Visual */}
            <div className="w-full bg-[var(--surface-subtle)] h-1 rounded-[var(--radius-xs)] overflow-hidden mb-6">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(inactivityCountdown / 60) * 100}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
                className="bg-[var(--fg-accent)] h-full"
              />
            </div>

            {/* Trigger buttons layout */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              {/* Stay Logged In Option */}
              <button
                type="button"
                onClick={extendSession}
                className="flex-1 order-1 sm:order-2 px-5 py-2.5 rounded-[var(--radius-xs)] font-medium text-sm transition-theme bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--fg-accent)] border border-[var(--border-accent)] flex items-center justify-center gap-2 shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>{isAr ? 'البقاء متصلاً' : 'Stay Logged In'}</span>
              </button>

              {/* Force Logout Option */}
              <button
                type="button"
                onClick={() => logout(true)}
                className="flex-1 order-2 sm:order-1 px-5 py-2.5 rounded-[var(--radius-xs)] font-medium text-sm transition-theme bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الخروج الآن' : 'Logout Now'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
