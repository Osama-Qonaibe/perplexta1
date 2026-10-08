/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — MODAL SHELL PRIMITIVE
 * 
 * Strict, accessible dialog shell with focus trap, backdrop blur,
 * scroll-lock integration, and Framer Motion / CSS transitions.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { Z_INDEX } from '../tokens/elevation';
import { SLIDE_UP_FADE_IN, BACKDROP_VARIANTS } from '../tokens/motion';

export interface ModalShellProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  layer?: 'modal' | 'nested' | 'lightbox';
  closeOnBackdrop?: boolean;
  dir?: 'rtl' | 'ltr';
  className?: string;
  contentClassName?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
  full: 'max-w-5xl',
};

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  layer = 'modal',
  closeOnBackdrop = true,
  dir,
  className = '',
  contentClassName = '',
}) => {
  useModalScrollLock(open, `modal-shell-${layer}`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const zIndexClass = layer === 'nested' 
    ? 'z-[1100]' 
    : layer === 'lightbox' 
      ? 'z-[1200]' 
      : 'z-[1000]';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${zIndexClass} bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain ${className}`}
          role="dialog"
          aria-modal="true"
          dir={dir}
          variants={BACKDROP_VARIANTS}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={() => {
            if (closeOnBackdrop && onClose) onClose();
          }}
        >
          <motion.div
            variants={SLIDE_UP_FADE_IN}
            initial="closed"
            animate="open"
            exit="closed"
            className={`
              w-full ${SIZE_CLASSES[size]} rounded-2xl sm:rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)]
              p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-3 sm:space-y-4 transform-gpu
              text-[var(--text-primary)] my-auto max-h-[92dvh] sm:max-h-[88dvh] flex flex-col
              overflow-y-auto overscroll-contain transition-theme custom-scrollbar
              ${contentClassName}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const AppModal = ModalShell;
export type AppModalProps = ModalShellProps;

