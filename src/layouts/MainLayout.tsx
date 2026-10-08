import React from 'react';
import { useAppContext } from '../context/AppContext';
import { MobileAppLayout } from './MobileAppLayout';
import { DesktopLayout } from './DesktopLayout';

export const MainLayout: React.FC = () => {
  const { isMobile } = useAppContext();

  return (
    <div className="w-full h-full bg-[var(--surface-page)] text-[var(--text-primary)] transition-theme">
      {isMobile ? <MobileAppLayout /> : <DesktopLayout />}
    </div>
  );
};
