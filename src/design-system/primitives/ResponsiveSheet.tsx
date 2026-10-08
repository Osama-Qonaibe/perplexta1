/**
 * 📱 PERPLEXTA DESIGN SYSTEM — RESPONSIVE SHEET PRIMITIVE
 * 
 * Mobile-friendly sliding bottom sheet / drawer container.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Z_INDEX, GLASS_SURFACE } from '../tokens/elevation';
import { variants, BACKDROP_VARIANTS } from '../tokens/motion';

export interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const ResponsiveSheet: React.FC<ResponsiveSheetProps> = ({
  open,
  onClose,
  title,
  children,
  dir,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${GLASS_SURFACE.backdrop} z-[${Z_INDEX.MODAL_BACKDROP}] flex flex-col justify-end sm:justify-center items-center sm:p-4`}
          variants={BACKDROP_VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClose}
          dir={dir}
        >
          <motion.div
            variants={variants.sheet}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`
              w-full sm:max-w-lg max-h-[85dvh] flex flex-col rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-md)]
              bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl backdrop-blur-xl
              text-[var(--text-primary)] overflow-hidden transform-gpu
              ${className}
            `}
          >
            {/* Sheet Handle for Mobile */}
            <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--border-default)]" />
            </div>

            {title && (
              <div className="px-4 py-3 border-b border-[var(--border-default)] font-bold text-sm text-[var(--text-primary)]">
                {title}
              </div>
            )}

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
