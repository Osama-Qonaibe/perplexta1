/**
 * 🔔 PERPLEXTA DESIGN SYSTEM — UNIFIED NOTIFICATION ENGINE
 * 
 * Centralized, high-performance toast and system alerts engine.
 * Unified bottom-center rising presentation, ultra-concise text normalization,
 * single-active-instance deduplication, smooth collapse animations,
 * green success / red error styling, and bidirectional RTL/LTR support.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationOptions {
  message?: string;
  title?: string;
  type?: NotificationType;
  duration?: number;
  action?: NotificationAction;
  id?: string;
  image?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  title?: string;
  type: NotificationType;
  duration: number;
  action?: NotificationAction;
  createdAt: number;
  image?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (options: NotificationOptions) => string;
  showToast: (type: NotificationType, title: string, description?: string, duration?: number) => string;
  notifySuccess: (title?: string, description?: string) => string;
  notifySave: (title?: string, description?: string) => string;
  notifyRename: (title?: string, description?: string) => string;
  notifyError: (title?: string, description?: string) => string;
  success: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  error: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  warning: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  info: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  loading: (message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Global Bridge Handlers for direct toast calls across the workspace
let globalShowNotification: ((options: NotificationOptions) => string) | null = null;
let globalDismissNotification: ((id: string) => void) | null = null;
let globalClearAllNotifications: (() => void) | null = null;

// Track recent notifications to prevent duplicate toasts within short interval
const recentNotificationsCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 1500;

/**
 * Format and normalize raw message string into ultra-concise, emoji-free text.
 */
const formatConciseText = (rawMessage?: string, rawTitle?: string, type: NotificationType = 'info', isRtl = true): string => {
  const text = (rawMessage || rawTitle || '').trim();
  if (!text) {
    if (type === 'success') return isRtl ? 'تم بنجاح' : 'Success';
    if (type === 'error') return isRtl ? 'فشل الإجراء' : 'Error';
    if (type === 'warning') return isRtl ? 'تنبيه' : 'Warning';
    if (type === 'loading') return isRtl ? 'جاري المعالجة' : 'Processing';
    return isRtl ? 'إشعار' : 'Notice';
  }

  // Remove emojis and special glyphs
  let cleaned = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

  // Preserve informative quota, limit, balance, financial, or system guidance messages intact
  const lower = cleaned.toLowerCase();
  const isInformativeSystemMessage = 
    cleaned.includes('استنفدت') ||
    cleaned.includes('الحد') ||
    cleaned.includes('حصة') ||
    cleaned.includes('حصتك') ||
    cleaned.includes('باقة') ||
    cleaned.includes('اشتراك') ||
    cleaned.includes('رصيد') ||
    cleaned.includes('ترقية') ||
    cleaned.includes('تجاوزت') ||
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('exceeded') ||
    lower.includes('subscription') ||
    lower.includes('balance') ||
    lower.includes('upgrade');

  if (isInformativeSystemMessage) {
    return cleaned;
  }

  // Smart normalization to ultra-brief phrases
  if (isRtl) {
    if (cleaned.includes('كاش') || cleaned.includes('ذاكرة') || cleaned.includes('تطهير') || cleaned.toLowerCase().includes('cache') || cleaned.toLowerCase().includes('purge')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل تطهير الذاكرة';
      return 'تم تفريغ الذاكرة المؤقتة';
    }
    if (cleaned.includes('نسخ') || cleaned.toLowerCase().includes('copy') || cleaned.toLowerCase().includes('copied')) {
      return 'تم النسخ';
    }
    if (cleaned.includes('حفظ') || cleaned.toLowerCase().includes('save') || cleaned.toLowerCase().includes('saved')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل الحفظ';
      return 'تم الحفظ';
    }
    if (cleaned.includes('حذف') || cleaned.toLowerCase().includes('delete') || cleaned.toLowerCase().includes('deleted')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل الحذف';
      return 'تم الحذف';
    }
    if (cleaned.includes('رفع') || cleaned.toLowerCase().includes('upload') || cleaned.toLowerCase().includes('uploaded')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل الرفع';
      return 'تم الرفع';
    }
    if (cleaned.includes('تجهيز') || cleaned.includes('جاهز') || cleaned.toLowerCase().includes('ready')) {
      return 'تم التجهيز';
    }
    if ((/(\b|_)قص(\b|_)|قص الفيديو|تقطيع/u.test(cleaned) && !cleaned.includes('أقصى')) || cleaned.toLowerCase().includes('trim') || cleaned.toLowerCase().includes('trimmed')) {
      return 'تم الضبط والقص';
    }
    // Specific media, cover, and card attachment events MUST NOT be collapsed to 'تم النشر'
    if (cleaned.includes('غلاف') || cleaned.includes('لقطة') || cleaned.toLowerCase().includes('cover') || cleaned.toLowerCase().includes('frame')) {
      return 'تم اختيار الغلاف';
    }
    if (cleaned.includes('إرفاق') || cleaned.includes('إضافة') || cleaned.includes('تطبيق') || cleaned.toLowerCase().includes('attach') || cleaned.toLowerCase().includes('added')) {
      if (cleaned.includes('فيديو') || cleaned.toLowerCase().includes('video')) return 'تم إرفاق الفيديو';
      if (cleaned.includes('صورة') || cleaned.toLowerCase().includes('image') || cleaned.toLowerCase().includes('photo')) return 'تم إرفاق الصورة';
      return 'تم الإرفاق';
    }

    // Strip noun forms of 'post' ('منشور', 'المنشور', 'منشورك', etc.) so they do not falsely trigger the verb 'نشر' (to publish)
    const textWithoutPostNoun = cleaned.replace(/المنشورات|المنشور|منشورات|منشورك|منشوره|منشورها|منشورهم|منشور/gu, '');
    const isExplicitPublish = 
      /تم(\s+)?نشر|جاري(\s+)?نشر|فشل(\s+)?نشر|تمت(\s+)?عملية(\s+)?النشر|نشرت|نُشر/gu.test(cleaned) ||
      (textWithoutPostNoun.includes('نشر') || cleaned.toLowerCase().includes('published') || cleaned.toLowerCase().includes('publish '));

    // Only return 'تم النشر' if this is an explicit post publication event, not a preparation/upload event
    const isPreparation = cleaned.includes('جاهز') || cleaned.includes('تجهيز') || cleaned.includes('تحميل') || cleaned.includes('رفع') || cleaned.includes('معاينة') || cleaned.includes('قص') || cleaned.includes('ضبط');
    if (!isPreparation && isExplicitPublish) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل النشر';
      return 'تم النشر';
    }
    if (cleaned.includes('تحديث') || cleaned.toLowerCase().includes('update') || cleaned.toLowerCase().includes('updated')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل التحديث';
      return 'تم التحديث';
    }
    if (cleaned.includes('إرسال') || cleaned.toLowerCase().includes('sent')) {
      if (cleaned.includes('فشل') || cleaned.includes('خطأ') || type === 'error') return 'فشل الإرسال';
      return 'تم الإرسال';
    }
  } else {
    if (cleaned.toLowerCase().includes('cache') || cleaned.toLowerCase().includes('purge')) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Cache clear failed';
      return 'Cache cleared';
    }
    if (cleaned.toLowerCase().includes('copy') || cleaned.toLowerCase().includes('copied')) return 'Copied';
    if (cleaned.toLowerCase().includes('save') || cleaned.toLowerCase().includes('saved')) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Save failed';
      return 'Saved';
    }
    if (cleaned.toLowerCase().includes('delete') || cleaned.toLowerCase().includes('deleted') || cleaned.toLowerCase().includes('remove')) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Delete failed';
      return 'Deleted';
    }
    if (cleaned.toLowerCase().includes('upload') || cleaned.toLowerCase().includes('uploaded')) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Upload failed';
      return 'Uploaded';
    }
    if (cleaned.toLowerCase().includes('ready') || cleaned.toLowerCase().includes('prepared')) {
      return 'Ready';
    }
    if (cleaned.toLowerCase().includes('trim') || cleaned.toLowerCase().includes('trimmed')) {
      return 'Trimmed';
    }
    const isPrepEn = cleaned.toLowerCase().includes('ready') || cleaned.toLowerCase().includes('upload') || cleaned.toLowerCase().includes('preview');
    if (!isPrepEn && (cleaned.toLowerCase().includes('publish') || cleaned.toLowerCase().includes('posted') || cleaned.toLowerCase().includes('published'))) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Publish failed';
      return 'Published';
    }
    if (cleaned.toLowerCase().includes('update') || cleaned.toLowerCase().includes('updated')) {
      if (cleaned.toLowerCase().includes('fail') || cleaned.toLowerCase().includes('error') || type === 'error') return 'Update failed';
      return 'Updated';
    }
  }

  // Remove redundant suffix words like "بنجاح" or "successfully"
  cleaned = cleaned.replace(/بنجاح!?/g, '').replace(/successfully!?/gi, '').replace(/[!🎉✨🏪🛡️🎥🎯]/g, '').trim();

  return cleaned || (type === 'success' ? (isRtl ? 'تم بنجاح' : 'Success') : (isRtl ? 'إشعار' : 'Notice'));
};

export const showToast = (type: NotificationType, title: string, description?: string, duration?: number): string => {
  return globalShowNotification?.({
    title,
    description,
    message: description || title,
    type,
    duration,
  }) || '';
};

export const notifySuccess = (title = 'تم بنجاح', description?: string): string => {
  return showToast('success', title, description);
};

export const notifySave = (title = 'تم الحفظ', description?: string): string => {
  return showToast('success', title, description);
};

export const notifyRename = (title = 'تم التحديث', description?: string): string => {
  return showToast('success', title, description);
};

export const notifyError = (title = 'فشل الإجراء', description?: string): string => {
  return showToast('error', title, description);
};

export const toast = {
  showToast,
  notifySuccess,
  notifySave,
  notifyRename,
  notifyError,
  success: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'success', ...opts }) || '';
  },
  error: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'error', ...opts }) || '';
  },
  warning: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'warning', ...opts }) || '';
  },
  info: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'info', ...opts }) || '';
  },
  loading: (message: string, titleOrOpts?: string | Partial<NotificationOptions>) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts || {};
    return globalShowNotification?.({ message, type: 'loading', duration: 120000, ...opts }) || '';
  },
  dismiss: (id?: string) => {
    if (id && globalDismissNotification) globalDismissNotification(id);
  },
  clear: () => {
    if (globalClearAllNotifications) globalClearAllNotifications();
  },
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRtl, setIsRtl] = useState<boolean>(true);

  useEffect(() => {
    const checkDir = () => {
      const dir = document.documentElement.dir || document.body.dir || 'rtl';
      setIsRtl(dir === 'rtl');
    };
    checkDir();

    const observer = new MutationObserver(checkDir);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback((options: NotificationOptions): string => {
    const now = Date.now();
    const dedupKey = `${options.type || 'info'}:${options.message || options.title || ''}`;

    // Check duplicate within window
    const lastSeen = recentNotificationsCache.get(dedupKey);
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return options.id || '';
    }
    recentNotificationsCache.set(dedupKey, now);

    // Clean old dedup entries
    if (recentNotificationsCache.size > 30) {
      for (const [k, v] of recentNotificationsCache.entries()) {
        if (now - v > DEDUP_WINDOW_MS * 2) {
          recentNotificationsCache.delete(k);
        }
      }
    }

    const id = options.id || `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: NotificationItem = {
      id,
      message: options.message || options.description || options.title || '',
      title: options.title,
      type: options.type || 'info',
      duration: options.duration ?? 2800,
      action: options.action,
      createdAt: now,
      image: options.image,
      icon: options.icon,
      description: options.description,
    };

    // STRICT UNIFIED POLICY: Replace previous active toast immediately so ONLY 1 toast exists at a time!
    setNotifications([newItem]);

    return id;
  }, []);

  useEffect(() => {
    globalShowNotification = showNotification;
    globalDismissNotification = dismissNotification;
    globalClearAllNotifications = clearAllNotifications;

    const handleNativePush = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent && customEvent.detail) {
        const notif = customEvent.detail;
        const body = notif.body || notif.message || notif.title || '';
        if (body) {
          showNotification({
            message: body,
            type: 'info',
            duration: 4000,
          });
        }
      }
    };

    window.addEventListener('native-push-received', handleNativePush);

    return () => {
      globalShowNotification = null;
      globalDismissNotification = null;
      globalClearAllNotifications = null;
      window.removeEventListener('native-push-received', handleNativePush);
    };
  }, [showNotification, dismissNotification, clearAllNotifications]);

  const success = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'success', ...options });
  }, [showNotification]);

  const error = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'error', ...options });
  }, [showNotification]);

  const warning = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'warning', ...options });
  }, [showNotification]);

  const info = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'info', ...options });
  }, [showNotification]);

  const loading = useCallback((message: string, title?: string, options?: Omit<NotificationOptions, 'message' | 'type' | 'title'>) => {
    return showNotification({ message, title, type: 'loading', duration: 120000, ...options });
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showToast,
        notifySuccess,
        notifySave,
        notifyRename,
        notifyError,
        success,
        error,
        warning,
        info,
        loading,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} isRtl={isRtl} />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      showNotification: (options) => toast.info(options.message || options.description || '', options),
      showToast: (type, title, desc, dur) => toast.showToast(type, title, desc, dur),
      notifySuccess: (title, desc) => toast.notifySuccess(title, desc),
      notifySave: (title, desc) => toast.notifySave(title, desc),
      notifyRename: (title, desc) => toast.notifyRename(title, desc),
      notifyError: (title, desc) => toast.notifyError(title, desc),
      success: (msg, title, opts) => toast.success(msg, { title, ...opts }),
      error: (msg, title, opts) => toast.error(msg, { title, ...opts }),
      warning: (msg, title, opts) => toast.warning(msg, { title, ...opts }),
      info: (msg, title, opts) => toast.info(msg, { title, ...opts }),
      loading: (msg, title, opts) => toast.loading(msg, { title, ...opts }),
      dismissNotification: (id) => toast.dismiss(id),
      clearAllNotifications: () => {},
    };
  }
  return context;
};

const ToastCard: React.FC<{ item: NotificationItem; onDismiss: (id: string) => void; isRtl: boolean }> = ({
  item,
  onDismiss,
  isRtl,
}) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(item.duration);

  useEffect(() => {
    if (item.duration <= 0 || paused) return;

    startTimeRef.current = Date.now();
    const intervalTime = 30;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current -= elapsed;
      startTimeRef.current = Date.now();

      const calculatedPercent = Math.max(0, Math.min(100, (remainingTimeRef.current / item.duration) * 100));
      setProgress(calculatedPercent);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss(item.id);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [item.duration, item.id, onDismiss, paused]);

  const conciseText = formatConciseText(item.message, item.title, item.type, isRtl);
  const isLongMessage = conciseText.length > 20;

  const getVariantStyles = () => {
    switch (item.type) {
      case 'success':
        return {
          iconBadge: 'bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30 text-[var(--fg-success)]',
          progressBarBg: 'bg-[var(--fg-success)]',
          icon: <CheckCircle2 size={15} className="shrink-0 text-[var(--fg-success)]" />,
        };
      case 'error':
        return {
          iconBadge: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
          progressBarBg: 'bg-rose-500',
          icon: <AlertOctagon size={15} className="shrink-0 text-rose-500" />,
        };
      case 'warning':
        return {
          iconBadge: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          progressBarBg: 'bg-amber-500',
          icon: <AlertTriangle size={15} className="shrink-0 text-amber-500" />,
        };
      case 'loading':
        return {
          iconBadge: 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/30 text-[var(--fg-accent)]',
          progressBarBg: 'bg-[var(--accent)]',
          icon: <Loader2 size={15} className="animate-spin shrink-0 text-[var(--fg-accent)]" />,
        };
      case 'info':
      default:
        return {
          iconBadge: 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/30 text-[var(--fg-accent)]',
          progressBarBg: 'bg-[var(--accent)]',
          icon: <Info size={15} className="shrink-0 text-[var(--fg-accent)]" />,
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden flex items-center justify-between gap-2.5 px-3 min-h-[38px] py-1.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-main)] backdrop-blur-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 text-[var(--text-primary)] select-none w-fit ${
        isLongMessage
          ? 'min-w-[260px] max-w-[calc(100vw-32px)] sm:max-w-[580px]'
          : 'min-w-[140px] max-w-[calc(100vw-32px)] sm:max-w-[320px]'
      }`}
    >
      {/* Icon Circular Badge */}
      <div className={`w-5.5 h-5.5 rounded-shape-xs border flex items-center justify-center shrink-0 ${variant.iconBadge}`}>
        {React.isValidElement(item.icon)
          ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 12 })
          : variant.icon}
      </div>

      {/* Typography & Concise Message */}
      <div className="flex-1 min-w-0 shrink-0">
        <p className="text-[11.5px] font-bold leading-normal text-[var(--text-primary)] whitespace-nowrap">
          {conciseText}
        </p>
      </div>

      {/* Action / Dismiss Group */}
      <div className="flex items-center gap-1 shrink-0">
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className="h-5.5 px-2 text-[10px] font-bold rounded-shape-xs bg-[var(--accent)] hover:opacity-90 text-[var(--fg-on-emphasis)] transition-opacity cursor-pointer shrink-0 whitespace-nowrap"
          >
            {item.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="w-5 h-5 rounded-shape-xs flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer shrink-0"
          aria-label={isRtl ? 'إغلاق' : 'Dismiss'}
        >
          <X size={12} />
        </button>
      </div>

      {/* Auto-Dismiss Progress Line at Bottom Edge */}
      {item.duration > 0 && item.type !== 'loading' && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-black/10 dark:bg-white/5 overflow-hidden pointer-events-none">
          <div
            className={`h-full ${variant.progressBarBg} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

const NotificationContainer: React.FC<{
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  isRtl: boolean;
}> = ({ notifications, onDismiss, isRtl }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none flex flex-col items-center justify-start select-none max-w-[calc(100vw-24px)]"
      style={{
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      <AnimatePresence mode="wait">
        {notifications.slice(-1).map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={onDismiss} isRtl={isRtl} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
