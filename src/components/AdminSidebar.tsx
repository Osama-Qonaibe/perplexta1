import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Activity, Database, Cpu, Landmark, 
  Users, Megaphone, Settings, Mail, ArrowRight,
  ShieldAlert, Palette
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { SCROLL_STYLES, HOVER_STYLES } from '../styles/scrollStyles';

export interface AdminSidebarProps {
  activeLanguage?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeLanguage,
  onClose 
}) => {
  const { user, language: globalLang } = useAppContext();
  const location = useLocation();

  const language = activeLanguage || globalLang;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const isSupport = user?.role === 'support';

  const allNavItems = [
    // 1 (7 chars)
    { 
      icon: <Activity size={17} />, 
      label: language === 'ar' ? 'القيادة' : 'Overview', 
      path: '/admin/dashboard',
      matchPaths: ['/admin/dashboard'],
      requiresAdmin: false,
    },
    // 2 (9 chars)
    { 
      icon: <Megaphone size={17} />, 
      label: language === 'ar' ? 'الإعلانات' : 'Ads & Promos', 
      path: '/admin/ads',
      matchPaths: ['/admin/ads', '/admin/bulletin-moderation'],
      requiresAdmin: false,
    },
    // 3 (10 chars)
    { 
      icon: <Users size={17} />, 
      label: language === 'ar' ? 'المستخدمين' : 'Users & Roles', 
      path: '/admin/users',
      matchPaths: ['/admin/users'],
      requiresAdmin: false,
    },
    // 4 (14 chars)
    { 
      icon: <Database size={17} />, 
      label: language === 'ar' ? 'قواعد البيانات' : 'Databases Vault', 
      path: '/admin/databases',
      matchPaths: ['/admin/databases'],
      requiresAdmin: true,
    },
    // 5 (14 chars)
    { 
      icon: <Palette size={17} />, 
      label: language === 'ar' ? 'إعدادات المظهر' : 'Theme & Design', 
      path: '/admin/theme',
      matchPaths: ['/admin/theme'],
      requiresAdmin: true,
    },
    // 6 (14 chars)
    { 
      icon: <Settings size={17} />, 
      label: language === 'ar' ? 'إعدادات النظام' : 'System Settings', 
      path: '/admin/settings',
      matchPaths: ['/admin/settings', '/admin/seo', '/admin/design-seo', '/admin/memories', '/admin/memory'],
      requiresAdmin: true,
    },
    // 7 (15 chars)
    { 
      icon: <Mail size={17} />, 
      label: language === 'ar' ? 'مركز المراسلات' : 'Communications', 
      path: '/admin/emails',
      matchPaths: ['/admin/emails', '/admin/broadcast'],
      requiresAdmin: true,
    },
    // 8 (15 chars)
    { 
      icon: <ShieldAlert size={17} />, 
      label: language === 'ar' ? 'الأمان والتدقيق' : 'Security & Audits', 
      path: '/admin/audit',
      matchPaths: ['/admin/audit', '/admin/radar', '/admin/metrics'],
      requiresAdmin: true,
    },
    // 9 (19 chars)
    { 
      icon: <Landmark size={17} />, 
      label: language === 'ar' ? 'المالية والاشتراكات' : 'Finance & Subscriptions', 
      path: '/admin/finance',
      matchPaths: ['/admin/finance', '/admin/plans', '/admin/referrals'],
      requiresAdmin: true,
    },
    // 10 (22 chars)
    { 
      icon: <Cpu size={17} />, 
      label: language === 'ar' ? 'البنية التحتية والذكاء' : 'AI Infrastructure Vault', 
      path: '/admin/keys',
      matchPaths: ['/admin/keys', '/admin/ai-infra', '/admin/gpu', '/admin/maps', '/admin/audio', '/admin/auth', '/admin/payments', '/admin/gateways', '/admin/orchestrator'],
      requiresAdmin: true,
    },
  ];

  const navItems = allNavItems.filter((item) => !isSupport || !item.requiresAdmin);

  return (
    <aside 
      dir={dir}
      className={`h-full flex flex-col bg-[var(--surface-page)] border-[var(--border-default)] transition-theme select-none w-[204px] xl:w-[218px] shrink-0 relative z-20 ${
        dir === 'rtl' ? 'border-l' : 'border-r'
      }`}
    >
      <nav className={`flex-1 px-2 space-y-0.5 pt-2 pb-1.5 ${SCROLL_STYLES.sidebar}`}>
          {navItems.map((item, index) => {
            const isItemActive = item.matchPaths.some(
              (p) => location.pathname === p || location.pathname.startsWith(p + '/')
            );

            return (
              <NavLink
                key={`admin-nav-${item.path}-${index}`}
                to={item.path}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={`group relative flex items-center gap-2 px-2.5 py-1.5 min-h-[36px] rounded-shape-sm transition-all duration-fast cursor-pointer select-none ${
                  isItemActive
                    ? HOVER_STYLES.sidebarItemActive
                    : HOVER_STYLES.sidebarItem
                }`}
              >
                <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors duration-fast ${
                  isItemActive 
                    ? 'text-[var(--fg-accent)]' 
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement, { size: 17 } as any) : item.icon}
                </div>
                <span className={`text-[12px] tracking-tight truncate whitespace-nowrap transition-colors duration-fast leading-tight ${
                  isItemActive ? 'font-semibold text-[var(--fg-accent)]' : 'font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Exit & Platform Status */}
        <div className="p-2 border-t border-[var(--border-default)] mt-auto bg-[var(--surface-page)] space-y-1.5 transition-theme">
          <NavLink 
            to="/chat"
            onClick={() => {
              triggerHaptic('medium');
              if (onClose) onClose();
            }}
            className="group flex items-center justify-between px-2.5 py-1.5 min-h-[36px] rounded-shape-sm transition-all duration-fast border border-transparent bg-transparent hover:bg-[var(--surface-subtle)]/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none"
            title={language === 'ar' ? 'الخروج من لوحة التحكم والعودة للتطبيق' : 'Exit Admin to App'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 flex items-center justify-center rounded-shape-xs text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0">
                <ArrowRight size={14} className={dir === 'rtl' ? 'rotate-180' : ''} />
              </div>
              <span className="font-medium text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate transition-colors">
                {language === 'ar' ? 'العودة للمنصة' : 'Exit to App'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-[var(--text-muted)] opacity-70">ESC</span>
          </NavLink>
        </div>
      </aside>
  );
};
