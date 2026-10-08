import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ThemeToggleButton } from '../ThemeToggleButton';
import { Logo } from '../common/Logo';
import { triggerHaptic } from '../../utils/haptics';

export interface AdminTopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = () => {
  const { user, language, setLanguage, dir, siteSettings } = useAppContext();
  const isRtl = language === 'ar';

  const [latency, setLatency] = useState<number | null>(null);
  const [pulseOptimal, setPulseOptimal] = useState(true);

  // Ping backend health latency periodically for subtle status dot
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/health');
        const elapsed = Math.round(performance.now() - start);
        if (isMounted) {
          if (res.ok) {
            setLatency(elapsed);
            setPulseOptimal(true);
          } else {
            setPulseOptimal(false);
          }
        }
      } catch {
        if (isMounted) {
          setPulseOptimal(false);
        }
      }
    };

    checkPing();
    const interval = setInterval(checkPing, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleLanguage = () => {
    triggerHaptic('light');
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const resolvedSiteName = (isRtl ? (siteSettings?.siteNameAr || siteSettings?.siteName) : siteSettings?.siteName) || (isRtl ? 'بيربليكستا' : 'Perplexta');

  return (
    <header 
      dir={dir}
      className="h-[60px] w-full shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[var(--surface-page)] border-b border-[var(--border-default)] select-none z-30 transition-theme"
    >
      {/* Start Section: Official Platform Primary Brand & Logo */}
      <div className="flex items-center gap-3">
        <NavLink
          to="/admin/dashboard"
          onClick={() => triggerHaptic('light')}
          className="group flex items-center gap-2.5 transition-all duration-fast active:scale-98 cursor-pointer focus:outline-hidden"
          title={isRtl ? 'لوحة التحكم والقيادة' : 'Admin Dashboard'}
        >
          {/* Primary Project Logo - Clean Container with Zero Clutter */}
          <div className="w-8 h-8 rounded-shape-sm overflow-hidden flex items-center justify-center shrink-0 border border-[var(--border-default)] bg-[var(--surface-card)] group-hover:border-[var(--border-accent)]/70 group-hover:shadow-xs transition-all duration-fast">
            <Logo size={26} shape="none" fallbackType="brand" />
          </div>

          {/* Brand Name & Single Elegant Badge */}
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight text-[var(--text-primary)] group-hover:text-accent transition-colors">
              {resolvedSiteName}
            </span>
            <span className="px-1.5 py-0.5 rounded-shape-xs text-[9px] font-extrabold uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] shadow-2xs">
              {isRtl ? 'الإدارة' : 'ADMIN'}
            </span>
          </div>
        </NavLink>
      </div>

      {/* End Section: High-Precision Harmonious Action Controls */}
      <div className="flex items-center gap-2">
        {/* Subtle Live System Status Pill */}
        <div 
          className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs select-none"
          title={pulseOptimal 
            ? (isRtl ? `النظام متصل ومستقر (${latency ?? 0}ms)` : `System Operational (${latency ?? 0}ms)`) 
            : (isRtl ? 'تنبيه اتصال بالخادم' : 'Server Notice')}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              pulseOptimal ? 'bg-[var(--fg-success)]' : 'bg-[var(--fg-warning)]'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              pulseOptimal ? 'bg-[var(--fg-success)]' : 'bg-[var(--fg-warning)]'
            }`} />
          </span>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {pulseOptimal 
              ? (isRtl ? 'متصل' : 'Online') 
              : (isRtl ? 'تنبيه' : 'Notice')}
          </span>
          {latency !== null && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] border-s border-[var(--border-default)] ps-1.5">
              {latency}ms
            </span>
          )}
        </div>

        {/* Admin Identity Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs select-none">
            <div className="w-5 h-5 rounded-full bg-accent/15 text-accent border border-accent/20 text-[10px] font-bold flex items-center justify-center shrink-0">
              {(user.name || user.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[120px]">
                {user.name || user.email?.split('@')[0]}
              </span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">
                • {user.role === 'admin' 
                  ? (isRtl ? 'مسؤول' : 'Admin') 
                  : (isRtl ? 'دعم' : 'Support')}
              </span>
            </div>
          </div>
        )}

        <div className="h-4 w-px bg-[var(--border-default)] hidden sm:block mx-0.5" />

        {/* Exit Admin to Main App Button */}
        <NavLink
          to="/chat"
          onClick={() => triggerHaptic('light')}
          className="h-8 px-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 text-xs font-bold transition-all duration-fast active:scale-95 cursor-pointer shrink-0 shadow-2xs relative before:absolute before:-inset-1.5 before:content-[''] group"
          title={isRtl ? 'الخروج والعودة للتطبيق' : 'Exit Admin to App'}
        >
          <ArrowRight size={13} className={`text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="font-bold text-xs">{isRtl ? 'العودة للمنصة' : 'Exit'}</span>
        </NavLink>

        {/* Language Switch */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-all duration-fast active:scale-95 shadow-2xs relative before:absolute before:-inset-1.5 before:content-[''] shrink-0 group"
          title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
          aria-label={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Languages size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggleButton 
          variant="icon-button" 
          size="sm" 
          className="!w-8 !h-8 !min-w-[32px] !min-h-[32px] !max-w-[32px] !max-h-[32px] !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)]/60 !bg-[var(--surface-card)] hover:!bg-[var(--surface-subtle)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] transition-all duration-fast shadow-2xs shrink-0 cursor-pointer" 
        />
      </div>
    </header>
  );
};
