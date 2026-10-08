import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { triggerHaptic } from '../utils/haptics';
import { themeConfig } from '@/design-system';

export interface ThemeToggleButtonProps {
  variant?: 'icon-button' | 'segmented';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  variant = 'icon-button',
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { isDark, theme, setTheme, toggleTheme } = useResolvedTheme();
  const contextApp = useAppContext();

  const language = contextApp?.language || 'ar';
  const t = contextApp?.t || ((key: string) => key);

  if (variant === 'segmented') {
    return (
      <div 
        className={`${themeConfig.themeToggle.segmentedContainer} ${className}`}
        role="radiogroup"
        aria-label={language === 'ar' ? 'اختيار الثيم' : 'Select Theme'}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setTheme('light');
          }}
          role="radio"
          aria-checked={theme === 'light'}
          aria-label={t('lightMode') || (language === 'ar' ? 'الثيم الفاتح' : 'Light Mode')}
          className={`${themeConfig.themeToggle.segmentedItem} ${
            theme === 'light'
              ? themeConfig.themeToggle.segmentedActive
              : themeConfig.themeToggle.segmentedInactive
          }`}
        >
          <Sun size={13} className="shrink-0" />
          <span>{t('lightMode') || (language === 'ar' ? 'فاتح' : 'Light')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setTheme('dark');
          }}
          role="radio"
          aria-checked={theme === 'dark'}
          aria-label={t('darkMode') || (language === 'ar' ? 'الثيم الداكن' : 'Dark Mode')}
          className={`${themeConfig.themeToggle.segmentedItem} ${
            theme === 'dark'
              ? themeConfig.themeToggle.segmentedActive
              : themeConfig.themeToggle.segmentedInactive
          }`}
        >
          <Moon size={13} className="shrink-0" />
          <span>{t('darkMode') || (language === 'ar' ? 'داكن' : 'Dark')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            setTheme('system');
          }}
          role="radio"
          aria-checked={theme === 'system'}
          aria-label={t('systemMode') || (language === 'ar' ? 'حسب النظام' : 'System Theme')}
          className={`${themeConfig.themeToggle.segmentedItem} ${
            theme === 'system'
              ? themeConfig.themeToggle.segmentedActive
              : themeConfig.themeToggle.segmentedInactive
          }`}
        >
          <Monitor size={13} className="shrink-0" />
          <span>{t('systemMode') || (language === 'ar' ? 'النظام' : 'System')}</span>
        </button>
      </div>
    );
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const buttonStyle = size === 'sm' 
    ? themeConfig.themeToggle.buttonSm 
    : size === 'lg' 
      ? themeConfig.themeToggle.buttonLg 
      : themeConfig.themeToggle.buttonMd;

  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('medium');
        toggleTheme();
      }}
      aria-label={
        isDark
          ? (language === 'ar' ? 'تفعيل الثيم الفاتح' : 'Switch to Light Mode')
          : (language === 'ar' ? 'تفعيل الثيم الداكن' : 'Switch to Dark Mode')
      }
      aria-pressed={isDark}
      className={`${buttonStyle} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeInOut' }}
          className="flex items-center justify-center pointer-events-none"
        >
          {isDark ? (
            <Sun size={iconSize} className={themeConfig.themeToggle.icon} />
          ) : (
            <Moon size={iconSize} className={themeConfig.themeToggle.icon} />
          )}
        </motion.span>
      </AnimatePresence>
      {showLabel && (
        <span className="text-xs font-bold text-[var(--text-primary)]">
          {isDark
            ? (language === 'ar' ? 'فاتح' : 'Light')
            : (language === 'ar' ? 'داكن' : 'Dark')}
        </span>
      )}
    </button>
  );
};

export default ThemeToggleButton;
