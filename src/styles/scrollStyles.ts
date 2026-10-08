import type { Variants } from 'motion/react';

// Unified scroll styles — المصدر الوحيد للتمرير في المشروع
export const SCROLL_STYLES = {
  // Sidebar scroll (AdminSidebar, Sidebar, SponsoredSidebar)
  sidebar: 'overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain',
  
  // Dropdown menus (Tools, Settings, History, Menus)
  dropdown: 'overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain',
  
  // Modal content
  modal: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1 overscroll-contain',
  
  // Chat messages
  chat: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1 overscroll-contain',
  
  // Full page scroll
  page: 'overflow-y-auto custom-scrollbar scroll-smooth h-full overscroll-contain',

  // Drawers (Mobile Chat History, Sheet drawouts)
  drawer: 'overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain flex-1',
  
  // Limited height scroll
  limited: (maxHeight: string = '70vh') => 
    `max-h-[${maxHeight}] overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain`,
};

// Unified dropdown & popover motion curve matching ChatComposer tools menu
export const UNIFIED_DROPDOWN_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    scale: 0.98,
    transition: { 
      duration: 0.08, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
    }
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.10, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
    }
  }
};

// Direct props for standard motion.div dropdown popovers
export const UNIFIED_DROPDOWN_TRANSITION = {
  duration: 0.10,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
};

// Hover styles موحدة - Quiet & Professional Pattern (مطابق لقائمة أدوات حقل الإدخال ChatComposer)
export const HOVER_STYLES = {
  // Sidebar items: Quiet hover (subtle background, clean border-transparent, matches ChatComposer)
  sidebarItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/25 transition-all duration-fast border border-transparent active:scale-98',
  
  // Sidebar item active state (Clean transparent surface, text/icon illuminated in blue with no background box or borders)
  sidebarItemActive: 'text-[var(--fg-accent)] font-semibold border border-transparent hover:bg-[var(--surface-subtle)]/25 transition-all duration-fast active:scale-98',

  // Dropdown items: Subtle highlight
  dropdownItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/25 transition-all duration-fast active:scale-98',
  
  // Icon buttons
  iconButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/30 transition-all duration-fast p-1.5 rounded-shape-sm active:scale-95 cursor-pointer',
  
  // Close buttons
  closeButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/30 transition-all duration-fast p-1 rounded-shape-xs active:scale-95 cursor-pointer',
};

