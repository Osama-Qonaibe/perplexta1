/**
 * 🪟 PERPLEXTA DESIGN SYSTEM — POP CARD PRIMITIVE (v4.0.0)
 * 
 * Auto-fitting popover shell for menus, dropdowns, and toolbars.
 * Features:
 * - Surface: var(--popover)
 * - Border: 1px solid var(--border)
 * - Shadow: 0 12px 32px -8px rgba(0,0,0,0.5), 0 4px 12px -2px rgba(0,0,0,0.25), inset 0 1px 0 0 color-mix(in oklab, var(--foreground) 5%, transparent)
 * - Corner radius: 12px (var(--radius-md))
 */

import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { SLIDE_UP_FADE_IN } from '../tokens/motion';

export interface PopCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  className?: string;
  originClass?: string;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export const PopCard = forwardRef<HTMLDivElement, PopCardProps>(({
  children,
  header,
  footer,
  dir,
  className = '',
  originClass = 'origin-top-left',
  onClose,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  ...motionProps
}, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (closeOnOutsideClick && localRef.current && !localRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [onClose, closeOnEscape, closeOnOutsideClick]);

  return (
    <motion.div
      ref={localRef}
      dir={dir}
      variants={SLIDE_UP_FADE_IN}
      initial="closed"
      animate="open"
      exit="closed"
      className={`
        ${className.includes('w-full') ? 'w-full min-w-full max-w-full' : 'w-max min-w-[170px] max-w-[280px]'} p-1.5
        rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)]
        shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5),0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_0_0_color-mix(in_oklab,var(--text-primary)_5%,transparent)]
        space-y-0.5 transform-gpu flex flex-col select-none
        custom-scrollbar overflow-hidden ${originClass}
        ${className}
      `}
      {...motionProps}
    >
      {header && (
        <div className="px-2.5 py-1.5 border-b border-[var(--border-default)] text-xs font-semibold text-[var(--text-muted)]">
          {header}
        </div>
      )}

      <div className="flex flex-col gap-0.5 w-full overflow-y-auto max-h-inherit custom-scrollbar">
        {children}
      </div>

      {footer && (
        <div className="pt-1.5 mt-0.5 border-t border-[var(--border-default)] px-2 text-[11px] text-[var(--text-muted)]">
          {footer}
        </div>
      )}
    </motion.div>
  );
});

PopCard.displayName = 'PopCard';

