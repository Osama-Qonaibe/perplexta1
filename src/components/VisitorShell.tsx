import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { themeConfig } from '@/design-system';

interface VisitorShellProps {
  children: React.ReactNode;
}

export const VisitorShell: React.FC<VisitorShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const { dir, t, siteSettings } = useAppContext();
  const isRtl = dir === 'rtl';
  const brandName = (isRtl ? siteSettings?.siteNameAr : siteSettings?.siteName) || siteSettings?.siteName || t('appName') || 'Perplexta';

  return (
    <div className={themeConfig.visitor.shell}>
      <div className={themeConfig.visitor.content}>
        {children}
      </div>

      <footer className={themeConfig.visitor.footer}>
        <nav className={themeConfig.visitor.footerNav}>
          <button 
            type="button"
            onClick={() => navigate('/about')} 
            className={themeConfig.visitor.footerLink}
          >
            {isRtl ? 'من نحن' : 'About Us'}
          </button>
          <span className="text-[var(--text-muted)] select-none">•</span>
          <button 
            type="button"
            onClick={() => navigate('/terms')} 
            className={themeConfig.visitor.footerLink}
          >
            {isRtl ? 'شروط الخدمة' : 'Terms of Service'}
          </button>
          <span className="text-[var(--text-muted)] select-none">•</span>
          <button 
            type="button"
            onClick={() => navigate('/privacy')} 
            className={themeConfig.visitor.footerLink}
          >
            {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </button>
          <span className="hidden md:inline text-[var(--text-muted)] select-none">•</span>
          <a 
            href="/docs/legal" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`hidden md:inline ${themeConfig.visitor.footerLink}`}
          >
            {isRtl ? 'الوثائق القانونية' : 'Legal Docs'}
          </a>
        </nav>

        <p className={themeConfig.visitor.footerCopyright}>
          {isRtl 
            ? `جميع الحقوق محفوظة © 2026 ${brandName}`
            : `© 2026 ${brandName}. All rights reserved.`
          }
        </p>
      </footer>
    </div>
  );
};
