import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

export interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => Promise<void> | void;
  title: string | { ar: string; en: string };
  description?: string | { ar: string; en: string };
  variant?: 'danger' | 'success' | 'warning' | 'info' | 'purple';
  confirmLabel?: string | { ar: string; en: string };
  cancelLabel?: string | { ar: string; en: string };
  hasInput?: boolean;
  inputPlaceholder?: string | { ar: string; en: string };
  defaultValue?: string;
  inputType?: string;
  requiredInput?: boolean;
  extraContent?: React.ReactNode;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'danger',
  confirmLabel,
  cancelLabel,
  hasInput,
  inputPlaceholder,
  defaultValue = '',
  inputType = 'text',
  requiredInput = false,
  extraContent,
}) => {
  const { dir } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  useModalScrollLock(isOpen, 'action-modal');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const getLocalizedValue = (val: string | { ar: string; en: string } | undefined, defaultVal: string): string => {
    if (!val) return defaultVal;
    if (typeof val === 'string') return val;
    return dir === 'rtl' ? val.ar : val.en;
  };

  const currentTitle = getLocalizedValue(title, dir === 'rtl' ? 'تأكيد الإجراء' : 'Confirm Action');
  const currentDescription = getLocalizedValue(description, '');
  const currentPlaceholder = getLocalizedValue(inputPlaceholder, dir === 'rtl' ? 'اكتب هنا...' : 'Enter text here...');
  
  const defaultConfirmText = {
    danger: { ar: 'تأكيد الحذف', en: 'Delete' },
    success: { ar: 'تأكيد الحفظ', en: 'Save' },
    warning: { ar: 'متابعة', en: 'Proceed' },
    info: { ar: 'فهمت', en: 'Acknowledge' },
    purple: { ar: 'تطهير', en: 'Prune' },
  }[variant];

  const currentConfirmLabel = getLocalizedValue(confirmLabel, dir === 'rtl' ? defaultConfirmText.ar : defaultConfirmText.en);
  const currentCancelLabel = getLocalizedValue(cancelLabel, dir === 'rtl' ? 'إلغاء' : 'Cancel');

  const handleConfirm = async () => {
    if (requiredInput && !inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(hasInput ? inputValue : undefined);
    } catch (err) {
      console.error('[ActionConfirmationModal] confirmation failed:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const colorConfigs = {
    danger: {
      iconBox: 'bg-red-500/10 border-red-500/25 text-red-500 dark:text-red-400',
      icon: <ShieldAlert size={16} className="shrink-0" />,
      btnClass: 'bg-red-600 hover:bg-red-700 text-white border border-red-700/40',
    },
    success: {
      iconBox: 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/25 text-[var(--fg-success)]',
      icon: <CheckCircle2 size={16} className="shrink-0" />,
      btnClass: 'bg-[var(--fg-success)] hover:opacity-90 text-white border border-[var(--fg-success)]/30',
    },
    warning: {
      iconBox: 'bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400',
      icon: <AlertTriangle size={16} className="shrink-0" />,
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border border-amber-600/30',
    },
    info: {
      iconBox: 'bg-[var(--accent)]/10 border-[var(--accent)]/25 text-[var(--accent)]',
      icon: <Info size={16} className="shrink-0" />,
      btnClass: 'bg-[var(--accent)] hover:opacity-90 text-white border border-[var(--accent)]/30',
    },
    purple: {
      iconBox: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
      icon: <AlertTriangle size={16} className="shrink-0" />,
      btnClass: 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700/30',
    },
  }[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] overflow-y-auto flex items-center justify-center p-3.5 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-all"
          />

          {/* Modal Content - Sovereign Compact Layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[340px] sm:max-w-[360px] w-full p-4 sm:p-4.5 rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xl z-10 font-sans"
            style={{ direction: dir }}
          >
            {/* Header: Icon + Title + Close Button */}
            <div className="flex items-start justify-between gap-2.5 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-shape-xs flex items-center justify-center border shrink-0 ${colorConfigs.iconBox}`}>
                  {colorConfigs.icon}
                </div>
                <h3 className="text-sm sm:text-[15px] font-extrabold text-[var(--text-primary)] tracking-tight truncate">
                  {currentTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-7 h-7 rounded-shape-xs bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title={dir === 'rtl' ? 'إغلاق' : 'Close'}
                aria-label={dir === 'rtl' ? 'إغلاق' : 'Close'}
              >
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            {currentDescription && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed ps-0.5">
                {currentDescription}
              </p>
            )}

            {/* Optional Input prompt */}
            {hasInput && (
              <div className="mt-2.5">
                <input
                  type={inputType}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (!requiredInput || inputValue.trim())) {
                      handleConfirm();
                    }
                  }}
                  placeholder={currentPlaceholder}
                  autoFocus
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--border-accent)] focus:ring-1 focus:ring-[var(--border-accent)]/20 text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-shape-xs px-3 py-1.5 text-xs transition-all outline-none font-sans"
                />
              </div>
            )}

            {/* Optional extra content slot */}
            {extraContent && (
              <div className="mt-2">
                {extraContent}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border-default)]/60">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="h-8 px-3.5 rounded-shape-sm text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] active:scale-95 transition-all font-sans cursor-pointer disabled:opacity-50"
              >
                {currentCancelLabel}
              </button>

              <button
                type="button"
                disabled={isSubmitting || (requiredInput && !inputValue.trim())}
                onClick={handleConfirm}
                className={`h-8 px-4 rounded-shape-sm text-xs font-bold font-sans flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${colorConfigs.btnClass}`}
              >
                {isSubmitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                <span>{currentConfirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

