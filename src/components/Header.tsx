import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Bell, Languages, Menu, Check, CheckCheck, Trash2, Clock, ShieldCheck, Landmark, MessageSquare, MessagesSquare, History, Edit2, X, WifiOff, Megaphone, Cpu, Plus, Pin, MoreHorizontal, Bookmark, FolderPlus, FileText, FileCode, FileType, Pencil, Globe, Image as ImageIcon, Download, Share2, ChevronLeft, ChevronRight, Sparkles, Coins, Palette } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isPathBlocked } from '../utils/sectionVisibility';
import { resolveImageUrl } from '../utils/imageResolver';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryNotification } from './MemoryNotification';
import { ThemeToggleButton } from './ThemeToggleButton';
import { NotificationIconRenderer } from '../utils/imageProcessor';
import { triggerHaptic } from '../utils/haptics';
import { LAYOUT } from '../constants/layout';
import { FloatingPopover } from './FloatingPopover';
import { useArtifact } from '../context/ArtifactContext';
import { useCanvasLayout } from './chat/hooks/useCanvasLayout';
import { AssistantIcon, SIDEBAR_TRANSITION, toast } from '@/design-system';
import { SCROLL_STYLES } from '../styles/scrollStyles';

export const HEADER_SIZING = {
  headerHeight: 'h-12',
  contentHeight: 'h-full',
  buttonBox: 'w-8 h-8',
  buttonPill: 'h-8 px-2.5',
  buttonRadius: 'rounded-shape-sm',
  iconSize: 14,
  logoMobile: 'w-8 h-8',
  logoDesktop: 'w-8 h-8',
  logoRadius: 'rounded-shape-sm',
} as const;

export const Header: React.FC<{ activeLanguage?: string }> = ({ activeLanguage }) => {
  const { language: globalLang, setLanguage, theme, isSidebarOpen, setIsSidebarOpen, user, notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, siteSettings, t, token, memoryNotification, closeMemoryNotification, isOperationPending, socket } = useAppContext();
  const { isArtifactOpen, isFullscreen } = useArtifact();
  const { headerTabsMaxWidth, isDraggingResize, chatWidth } = useCanvasLayout();
  
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatHeaderData, setChatHeaderData] = useState<{
    hasMessages: boolean;
    activeChatTab: 'answer' | 'links' | 'images';
    citationsCount: number;
    imagesCount: number;
    pinnedCount: number;
    isGenerating: boolean;
    title?: string;
  } | null>(null);

  useEffect(() => {
    const handleChatHeaderState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setChatHeaderData(customEvent.detail);
      }
    };
    window.addEventListener('chat-header-state', handleChatHeaderState);
    return () => {
      window.removeEventListener('chat-header-state', handleChatHeaderState);
    };
  }, []);

  useEffect(() => {
    const handleStreamingState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        setIsStreaming(!!customEvent.detail.isGenerating);
      }
    };
    window.addEventListener('ai-streaming-state', handleStreamingState);
    return () => {
      window.removeEventListener('ai-streaming-state', handleStreamingState);
    };
  }, []);
  
  const language = activeLanguage || globalLang;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const userCredits = useMemo(() => {
    if (!user) return 0;
    if (user.subscription && user.subscription.status === 'active') {
      if (user.subscription.remaining_credits !== undefined) {
        return user.subscription.remaining_credits;
      }
      const cycle = user.subscription.cycle_credits || 0;
      const used = user.subscription.used_credits || 0;
      return Math.max(0, cycle - used);
    }
    return user.points || 0;
  }, [user]);

  const [creditFlash, setCreditFlash] = useState(false);
  const prevCreditsRef = useRef(userCredits);

  useEffect(() => {
    if (prevCreditsRef.current !== userCredits) {
      prevCreditsRef.current = userCredits;
      setCreditFlash(true);
      const timer = setTimeout(() => setCreditFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [userCredits]);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const titleEditRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [pinnedCount, setPinnedCount] = useState<number>(0);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [headerMenuTarget, setHeaderMenuTarget] = useState<{ rect: DOMRect } | null>(null);

  useEffect(() => {
    const handlePinnedCount = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && typeof customEvent.detail === 'number') {
        setPinnedCount(customEvent.detail);
      }
    };
    const handleClearChat = () => {
      setChatTitle(null);
      setPinnedCount(0);
    };
    window.addEventListener('chat-pinned-count', handlePinnedCount);
    window.addEventListener('clear-chat', handleClearChat);
    return () => {
      window.removeEventListener('chat-pinned-count', handlePinnedCount);
      window.removeEventListener('clear-chat', handleClearChat);
    };
  }, []);

  const chatId = location.pathname.startsWith('/chat/') ? location.pathname.split('/chat/')[1] : null;
  const isViralbookActive = location.pathname.startsWith('/viralbook') || location.pathname.startsWith('/bulletin') || location.pathname.startsWith('/reels') || location.pathname.startsWith('/inquiries');

  useEffect(() => {
    const fetchChatTitle = async () => {
      if (!chatId || !token) {
        setChatTitle(null);
        return;
      }
      try {
        const res = await fetch(`/api/chats/${chatId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const currentChat = await res.json();
            if (currentChat && currentChat.title) {
              setChatTitle(currentChat.title);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          console.debug('Transient network error fetching chat title (likely server initializing)');
        } else {
          console.error('Failed to fetch chat title', error);
        }
      }
    };

    fetchChatTitle();

    let debounceTimer: any = null;
    const handleChatUpdated = (e?: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail && String(customEvent.detail.id) === String(chatId)) {
        if (customEvent.detail.title) {
          setChatTitle(customEvent.detail.title);
        }
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchChatTitle(), 300);
    };

    const handleSocketTitleUpdated = (data: { chatId: string, title: string }) => {
      if (data && String(data.chatId) === String(chatId) && data.title) {
        setChatTitle(data.title);
      }
    };

    window.addEventListener('chat-updated', handleChatUpdated);
    window.addEventListener('chat-created', handleChatUpdated);

    if (socket) {
      socket.on('chat_title_updated', handleSocketTitleUpdated);
      socket.on('chat_updated', handleChatUpdated);
    }

    return () => {
      window.removeEventListener('chat-updated', handleChatUpdated);
      window.removeEventListener('chat-created', handleChatUpdated);
      if (socket) {
        socket.off('chat_title_updated', handleSocketTitleUpdated);
        socket.off('chat_updated', handleChatUpdated);
      }
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [chatId, token, socket]);

  const handleRename = async () => {
    if (!chatId || !token) return;
    const trimmedTitle = tempTitle.trim();
    if (!trimmedTitle) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: trimmedTitle })
      });
      if (res.ok) {
        setChatTitle(trimmedTitle);
        setIsEditingTitle(false);
        window.dispatchEvent(new Event('chat-updated'));
      }
    } catch (error) {
      console.error('Failed to rename chat', error);
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin');
  const isMobileView = windowWidth < 1024;
  const isChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const canToggleSidebarFromLogo = !isMobileView && isChatPage;

  const innerWrapperStyle = useMemo<React.CSSProperties>(() => {
    if (!isMobileView && isArtifactOpen) {
      return {
        width: '100%',
        maxWidth: `${chatWidth}px`,
        marginInlineStart: '0px',
        marginInlineEnd: 'auto',
        transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    if (!isMobileView) {
      return {
        width: '100%',
        maxWidth: '768px', // max-w-3xl is 768px
        marginInlineStart: 'auto',
        marginInlineEnd: 'auto',
        transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    return {
      width: '100%',
    };
  }, [isArtifactOpen, isMobileView, chatWidth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (titleEditRef.current && !titleEditRef.current.contains(event.target as Node)) {
        setIsEditingTitle(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'finance': return <Landmark size={14} className="text-[var(--status-warning)]" />;
      case 'support': return <MessageSquare size={14} className="text-[var(--fg-accent)]" />;
      case 'kyc': return <ShieldCheck size={14} className="text-[var(--fg-accent)]" />;
      default: return <Bell size={14} className="text-[var(--fg-accent)]" />;
    }
  };

  const handleNewChat = (e: React.MouseEvent) => {
    window.dispatchEvent(new Event('clear-chat'));
    if (location.pathname === '/' || location.pathname === '/chat') {
      e.preventDefault();
    }
  };

  const brandName = (dir === 'rtl' ? siteSettings?.siteNameAr : siteSettings?.siteName) || siteSettings?.siteName || t('appName') || 'Perplexta';

  const renderLogo = (
    <div className="flex items-center h-full w-full overflow-hidden select-none">
      {/* 
        Fixed Anchor for the Logo:
        In desktop view (!isMobileView), this slot is strictly 50px wide (matching the collapsed sidebar 50px width).
        The logo button (w-8 h-8 = 32px) is perfectly centered inside this 50px slot ((50-32)/2 = 9px offset).
        This slot never shifts, animates, or resizes, locking the logo in the exact identical position 
        whether the sidebar is open, closed, animating, or on page refresh.
      */}
      <div className={`${!isMobileView ? 'w-[50px] min-w-[50px] max-w-[50px]' : 'w-auto'} h-full flex items-center justify-center shrink-0`}>
        {canToggleSidebarFromLogo && !isSidebarOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              setIsSidebarOpen(true);
            }}
            className="group/logo-btn relative w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] hover:border-[var(--accent-foreground)]/60 bg-transparent hover:bg-[var(--surface-subtle)] transition-all duration-fast flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 before:absolute before:-inset-1.5 before:content-['']"
            title={language === 'ar' ? 'فتح الشريط الجانبي' : 'Open Sidebar'}
            aria-label="Open Sidebar"
          >
            {/* Normal Logo (Custom logo image or icon) */}
            <div className="w-full h-full flex items-center justify-center transition-all duration-base group-hover/logo-btn:opacity-0 group-hover/logo-btn:scale-75">
              {(siteSettings.logoBase64 || siteSettings.logoLightBase64) ? (
                <motion.div 
                  className="w-full h-full overflow-hidden flex items-center justify-center"
                  animate={isStreaming ? {
                    scale: [1, 1.03, 1],
                    borderColor: ["var(--border-default)", "rgba(156,163,175,0.4)", "var(--border-default)"]
                  } : {}}
                  transition={isStreaming ? {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                >
                  <NotificationIconRenderer 
                    src={resolveImageUrl((theme === 'light' && siteSettings.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings.logoBase64, 'general')} 
                    alt={brandName} 
                    size={32}
                    className="w-full h-full object-contain block"
                    fallbackIcon={<Cpu size={14} className="text-accent" />}
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center text-[var(--text-primary)]"
                  animate={isStreaming ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={isStreaming ? {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                >
                  <Cpu size={14} className="text-accent" />
                </motion.div>
              )}
            </div>

            {/* Full Glassy Outward Arrow Button Effect on Hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover/logo-btn:opacity-100 group-hover/logo-btn:scale-100 transition-all duration-fast pointer-events-none bg-[var(--surface-subtle)]">
              <div className="w-6 h-6 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shadow-2xs">
                {language === 'ar' ? <ChevronLeft size={14} className="stroke-[2.5]" /> : <ChevronRight size={14} className="stroke-[2.5]" />}
              </div>
            </div>
          </button>
        ) : (
          <NavLink 
            to="/" 
            onClick={handleNewChat} 
            className="group/logo-link relative w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] hover:border-[var(--accent-foreground)]/60 bg-transparent hover:bg-[var(--surface-subtle)] transition-all duration-fast flex items-center justify-center flex-shrink-0 active:scale-95 before:absolute before:-inset-1.5 before:content-['']"
            title={brandName}
          >
            {(siteSettings.logoBase64 || siteSettings.logoLightBase64) ? (
              <motion.div 
                className="w-full h-full overflow-hidden flex items-center justify-center"
                animate={isStreaming ? {
                  scale: [1, 1.03, 1],
                  borderColor: ["var(--border-default)", "var(--accent-foreground)", "var(--border-default)"]
                } : {}}
                transition={isStreaming ? {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <NotificationIconRenderer 
                  src={resolveImageUrl((theme === 'light' && siteSettings.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings.logoBase64, 'general')} 
                  alt={brandName} 
                  size={32}
                  className="w-full h-full object-contain block"
                  fallbackIcon={<Cpu size={14} className="text-[var(--fg-accent)]" />}
                />
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center justify-center text-[var(--text-primary)]"
                animate={isStreaming ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={isStreaming ? {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <Cpu size={14} className="text-[var(--fg-accent)]" />
              </motion.div>
            )}
          </NavLink>
        )}
      </div>

      {/* Brand Name Text: Smoothly reveals beside the fixed logo slot when sidebar is open on desktop */}
      {!isMobileView && (
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? 6 : -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === 'rtl' ? 6 : -6 }}
              transition={SIDEBAR_TRANSITION}
              className="flex-1 min-w-0 flex items-center overflow-hidden pe-2"
            >
              <span className="font-black text-sm text-[var(--text-primary)] whitespace-nowrap truncate tracking-tight leading-none">
                {brandName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );

  const renderActionButtons = (
    <div className="flex items-center gap-1 sm:gap-1 md:gap-2 shrink-0 h-full">
      {!isPathBlocked('/viralbook', siteSettings?.blocked_paths, isMobileView) && (
        <NavLink
          to="/viralbook"
          className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-shape-sm border transition-all duration-fast active:scale-95 group shrink-0 relative cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${
            isViralbookActive
              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs' 
              : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          title={language === 'ar' ? 'فيرال بوك والمجتمع التفاعلي' : 'ViralBook & Community Feed'}
          aria-label={language === 'ar' ? 'فيرال بوك' : 'ViralBook'}
        >
          <Megaphone 
            size={14} 
            className={`transition-colors duration-fast ${
              isViralbookActive
                ? 'text-[var(--fg-accent)]' 
                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
            }`} 
          />
        </NavLink>
      )}
      {!isPathBlocked('/studio', siteSettings?.blocked_paths, isMobileView) && (
        <NavLink
          to="/studio"
          className={`flex items-center justify-center w-8 h-8 rounded-shape-sm border transition-all duration-fast active:scale-95 group shrink-0 relative cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${
            location.pathname === '/studio' 
              ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs' 
              : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          title={language === 'ar' ? 'الاستوديو الإبداعي' : 'Creative Studio'}
          aria-label={language === 'ar' ? 'الاستوديو الإبداعي' : 'Creative Studio'}
        >
          <Palette 
            size={14} 
            className={`transition-colors duration-fast ${
              location.pathname === '/studio'
                ? 'text-[var(--fg-accent)]' 
                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
            }`} 
          />
        </NavLink>
      )}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 px-2 py-1 rounded-shape-sm bg-amber-500/10 border border-amber-500/20 shrink-0 select-none font-sans"
            title={language === 'ar' ? 'أنت تعمل دون اتصال بالإنترنت' : 'You are working offline'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <WifiOff size={13} className="text-amber-500" />
            <span className="hidden sm:inline text-[10px] text-amber-500 font-bold tracking-tight uppercase">
              {language === 'ar' ? 'دون اتصال' : 'Offline'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        type="button"
        onClick={() => {
          triggerHaptic('light');
          toggleLanguage();
        }}
        className={`items-center justify-center w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-fast active:scale-95 group shrink-0 cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
          isChatPage && chatHeaderData && chatHeaderData.hasMessages ? 'hidden sm:flex' : 'flex'
        }`}
        title={language === 'ar' ? 'تغيير اللغة (English)' : 'Change Language (العربية)'}
        aria-label={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
      >
        <Languages size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
      </button>

      <ThemeToggleButton 
        variant="icon-button" 
        size="sm" 
        className={`rounded-shape-sm relative before:absolute before:-inset-1.5 before:content-[''] ${
          isChatPage && chatHeaderData && chatHeaderData.hasMessages ? 'hidden sm:flex' : 'flex'
        }`} 
      />
    
      {(user || token) && (
        <div className="flex items-center gap-1 sm:gap-1.5 h-full">
          {/* Messages & Inquiries Inbox button - visible on desktop in ads / bulletin section */}
          {isViralbookActive && (
            <button
              onClick={() => {
                triggerHaptic('light');
                navigate('/viralbook/inquiries');
                window.dispatchEvent(new CustomEvent('open-bulletin-inquiries'));
              }}
              className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-shape-sm border transition-all duration-fast relative active:scale-95 group shrink-0 cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${
                location.pathname.includes('/inquiries') || location.search.includes('tab=inquiries')
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                  : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title={language === 'ar' ? 'صندوق المحادثات والرسائل' : 'Messages & Inquiries Inbox'}
              aria-label={language === 'ar' ? 'صندوق المحادثات والرسائل' : 'Messages & Inquiries Inbox'}
            >
              <MessagesSquare 
                size={14} 
                className={`transition-colors duration-fast ${
                  location.pathname.includes('/inquiries') || location.search.includes('tab=inquiries')
                    ? 'text-[var(--fg-accent)]'
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                }`} 
              />
            </button>
          )}

          <div className="relative flex items-center h-full" ref={dropdownRef}>
            <button 
              onClick={() => {
                triggerHaptic('light');
                setIsNotifOpen(!isNotifOpen);
              }}
              aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
              className={`flex items-center justify-center w-8 h-8 rounded-shape-sm bg-transparent border transition-all duration-fast relative active:scale-95 group shrink-0 cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${
                isNotifOpen 
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] shadow-2xs' 
                  : 'border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Bell size={14} className={`transition-colors duration-fast ${unreadCount > 0 ? "text-[var(--accent-foreground)]" : isNotifOpen ? "text-[var(--accent-foreground)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 bg-[var(--fg-accent)] rounded-shape-full border border-[var(--surface-page)]"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full mt-2 w-[280px] xs:w-80 sm:w-96 max-h-[350px] sm:max-h-[480px] overflow-hidden rounded-shape-md border shadow-2xl z-[100] flex flex-col bg-[var(--surface-card)] border-[var(--border-default)] overscroll-contain end-0 origin-top-right rtl:origin-top-left"
                >
                  <div className="p-3 sm:p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                    <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button 
                        onClick={unreadCount > 0 ? markAllAsRead : undefined}
                        disabled={unreadCount === 0}
                        className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all duration-fast relative before:absolute before:-inset-1 before:content-[''] ${
                          unreadCount > 0 
                            ? 'text-[var(--fg-accent)] hover:opacity-80 cursor-pointer' 
                            : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <Check size={11} />
                        {language === 'ar' ? 'تحديد كالمقروء' : 'Mark all read'}
                      </button>
                      <button 
                        onClick={notifications.length > 0 ? clearAllNotifications : undefined}
                        disabled={notifications.length === 0}
                        className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all duration-fast relative before:absolute before:-inset-1 before:content-[''] ${
                          notifications.length > 0 
                            ? 'text-rose-500 hover:text-rose-400 cursor-pointer' 
                            : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 size={11} />
                        {language === 'ar' ? 'مسح الكل' : 'Clear all'}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`flex-1 py-1 ${SCROLL_STYLES.dropdown}`}>
                    {notifications.length > 0 ? (
                      notifications.map((notif, nIdx) => (
                        <div
                          key={`notif-${notif.id || nIdx}-${nIdx}`}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            if (notif.metadata?.ad_id) {
                              navigate(`/viralbook/${notif.metadata.ad_id}`);
                              setIsNotifOpen(false);
                            } else if (notif.metadata?.inquiry_id) {
                              navigate(`/viralbook/${notif.metadata.ad_id || ''}`);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`w-full p-2.5 sm:p-4 flex gap-2.5 sm:gap-3 text-start hover:bg-[var(--surface-subtle)] transition-all duration-fast border-b border-[var(--border-default)] last:border-0 group relative cursor-pointer ${
                            !notif.is_read 
                              ? 'bg-[var(--bg-accent-muted)]/15 border-s-2 border-s-[var(--border-accent)]' 
                              : 'bg-transparent border-s-2 border-s-transparent opacity-85 hover:opacity-100'
                          }`}
                          dir={dir}
                        >
                          {/* Notification Icon Container with Corner Status Badge */}
                          <div className="relative shrink-0">
                            <div className={`mt-0.5 h-7 w-7 sm:h-8 sm:w-8 rounded-shape-sm flex items-center justify-center shrink-0 transition-all duration-fast overflow-hidden border ${
                              !notif.is_read 
                                ? 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/40 text-[var(--fg-accent)] font-bold shadow-2xs' 
                                : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-muted)]'
                            }`}>
                              <NotificationIconRenderer 
                                src={notif.image || notif.icon_url || notif.avatar || null}
                                size={28}
                                fallbackIcon={getNotifIcon(notif.type)}
                              />
                            </div>
                            
                            {/* Corner Read/Unread Mini Badge */}
                            {!notif.is_read ? (
                              <span 
                                className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-[var(--accent)] border-2 border-[var(--surface-card)] rounded-full shadow-[0_0_6px_var(--accent-foreground)] animate-pulse" 
                                title={language === 'ar' ? 'إشعار غير مقروء' : 'Unread notification'}
                              />
                            ) : (
                              <span 
                                className="absolute -bottom-1 -end-1 w-3.5 h-3.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-full flex items-center justify-center text-[var(--text-muted)] shadow-2xs" 
                                title={language === 'ar' ? 'إشعار مقروء' : 'Read notification'}
                              >
                                <CheckCheck size={9} />
                              </span>
                            )}
                          </div>

                          {/* Content Container */}
                          <div className="flex-1 min-w-0">
                            {/* Header: Title and Status Indicator Badge */}
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <h4 className={`text-[11px] sm:text-xs font-bold truncate transition-all duration-fast flex-1 ${
                                !notif.is_read ? 'text-[var(--fg-accent)]' : 'text-[var(--text-primary)]'
                              }`}>
                                {language === 'ar' ? notif.title_ar : notif.title_en}
                              </h4>

                              {/* Status Pill Badge (Read vs Unread) */}
                              {!notif.is_read ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/30 text-[9px] font-bold shrink-0 select-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" />
                                  <span>{language === 'ar' ? 'غير مقروء' : 'Unread'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)] text-[9px] font-medium shrink-0 select-none">
                                  <CheckCheck size={10} className="text-[var(--text-muted)] shrink-0" />
                                  <span>{language === 'ar' ? 'مقروء' : 'Read'}</span>
                                </span>
                              )}
                            </div>

                            {/* Message Body */}
                            <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed transition-all duration-fast">
                              {language === 'ar' ? notif.message_ar : notif.message_en}
                            </p>

                            {/* Footer: Timestamp, Read Indicator, and Actions */}
                            <div className="flex items-center justify-between mt-1.5 sm:mt-2.5 pt-1 border-t border-[var(--border-default)]/40">
                              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] transition-all duration-fast">
                                <Clock size={10} />
                                <span>{new Date(notif.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {!notif.is_read ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] hover:bg-[var(--accent)] text-[var(--fg-accent)] hover:text-[var(--comp-button-primary-fg)] transition-all duration-fast text-[9.5px] font-bold cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                                    title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                                  >
                                    <Check size={11} className="stroke-[2.5px]" />
                                    <span className="hidden xs:inline">{language === 'ar' ? 'تحديد كمقروء' : 'Mark read'}</span>
                                  </button>
                                ) : (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[9.5px] text-[var(--text-muted)]/70 select-none"
                                    title={language === 'ar' ? 'تمت القراءة' : 'Already read'}
                                  >
                                    <CheckCheck size={11} className="text-[var(--text-muted)]" />
                                    <span className="hidden xs:inline">{language === 'ar' ? 'تمت القراءة' : 'Read'}</span>
                                  </span>
                                )}

                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                  className="p-1 rounded-shape-xs text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-all duration-fast cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
                                  title={language === 'ar' ? 'حذف الإشعار' : 'Delete notification'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30 transition-all duration-fast">
                        <Bell size={32} className="mb-2" />
                        <span className="text-xs">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 sm:p-3 border-t border-[var(--border-default)] text-center bg-[var(--surface-subtle)]">
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium transition-all duration-fast">
                      {language === 'ar' ? 'البروتوكول الصامت للمنصة' : 'Silent Platform Protocol'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header 
      dir={globalLang === 'ar' ? 'rtl' : 'ltr'} 
      className={`fixed top-0 left-0 right-0 h-[calc(50px+env(safe-area-inset-top,0px))] lg:h-[calc(56px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] z-[160] transition-theme flex items-center bg-[var(--surface-page)] border-b border-[var(--border-default)]`}
    >
      {/* Full-height vertical divider line matching sidebar width starting from top-0 to 100dvh */}
      <motion.div
        initial={false}
        animate={{
          width: !isMobileView ? (isSidebarOpen ? 180 : 50) : 0
        }}
        transition={SIDEBAR_TRANSITION}
        className={`absolute top-0 bottom-0 pointer-events-none z-[1] ${
          dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'
        } border-[var(--border-default)]`}
        style={{ height: '100dvh', willChange: 'width' }}
      />
      
      <div className={`w-full flex justify-between items-center h-[50px] gap-1 sm:gap-3 relative ${isMobileView ? 'px-2.5' : 'ps-0 pe-4 md:pe-6'}`}>
        {/* Logo container matching sidebar width on desktop */}
        <motion.div 
          initial={false}
          animate={{
            width: !isMobileView ? (isSidebarOpen ? 180 : 50) : 'auto'
          }}
          transition={SIDEBAR_TRANSITION}
          className="flex items-center h-full shrink-0 z-20 overflow-hidden"
        >
          <div className="flex items-center h-full w-full">
            {renderLogo}
          </div>
        </motion.div>

        {/* Chat Interaction Toolbar: Exactly aligned with chat container boundaries (max-w-3xl) */}
        {isChatPage && chatHeaderData && chatHeaderData.hasMessages && (!isArtifactOpen || !isFullscreen) && (
          <>
            {/* DESKTOP LAYOUT: Fixed stable alignment matching main layout viewport (50px base offset, completely immune to sidebar expansion) */}
            <div 
              className="absolute inset-y-0 pointer-events-none hidden sm:flex items-center z-10 inset-x-0"
              style={{
                paddingInlineStart: !isMobileView ? '50px' : '0px',
                paddingInlineEnd: 0
              }}
            >
              <div
                className="pointer-events-auto flex items-center justify-between text-xs font-sans select-none h-full px-4 sm:px-6"
                style={innerWrapperStyle}
                dir={globalLang === 'ar' ? 'rtl' : 'ltr'}
              >
                {/* Start Edge: View Tabs (Answer, Sources, Media) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'answer' }));
                    }}
                    className={`w-8 h-8 rounded-shape-sm border flex items-center justify-center transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-1.5 before:content-[''] ${
                      chatHeaderData.activeChatTab === 'answer'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                        : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={globalLang === 'ar' ? 'الإجابة والتحليل' : 'Answer'}
                    aria-label={globalLang === 'ar' ? 'الإجابة والتحليل' : 'Answer'}
                  >
                    <AssistantIcon 
                      size={14} 
                      isSpinning={false} 
                      dir={globalLang === 'ar' ? 'rtl' : 'ltr'} 
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'links' }));
                    }}
                    className={`h-8 min-w-[32px] px-1.5 rounded-shape-sm border flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-1.5 before:content-[''] ${
                      chatHeaderData.activeChatTab === 'links'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                        : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={globalLang === 'ar' ? `المصادر (${chatHeaderData.citationsCount})` : `Sources (${chatHeaderData.citationsCount})`}
                    aria-label={globalLang === 'ar' ? `المصادر (${chatHeaderData.citationsCount})` : `Sources (${chatHeaderData.citationsCount})`}
                  >
                    <Globe size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                    {chatHeaderData.citationsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-shape-full text-[10px] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono font-bold">
                        {chatHeaderData.citationsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'images' }));
                    }}
                    className={`h-8 min-w-[32px] px-1.5 rounded-shape-sm border flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-1.5 before:content-[''] ${
                      chatHeaderData.activeChatTab === 'images'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                        : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={globalLang === 'ar' ? `الوسائط (${chatHeaderData.imagesCount})` : `Media (${chatHeaderData.imagesCount})`}
                    aria-label={globalLang === 'ar' ? `الوسائط (${chatHeaderData.imagesCount})` : `Media (${chatHeaderData.imagesCount})`}
                  >
                    <ImageIcon size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                    {chatHeaderData.imagesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-shape-full text-[10px] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono font-bold">
                        {chatHeaderData.imagesCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* End Edge: Chat Actions (Pinned, Credit Counter, More Options) */}
                <div className="flex items-center gap-2">
                  {/* Real-time Conditional Credit Counter beside options button */}
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        navigate('/subscription');
                      }}
                      className={`flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-shape-sm border transition-all duration-fast shrink-0 cursor-pointer group shadow-2xs active:scale-95 relative before:absolute before:-inset-1.5 before:content-[''] ${
                        creditFlash 
                          ? 'bg-[var(--bg-accent-subtle)] border-[var(--border-accent)] text-[var(--fg-accent)] scale-105 ring-1 ring-[var(--border-accent)]' 
                          : 'bg-transparent hover:bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-[var(--border-accent)]/60 text-[var(--text-primary)]'
                      }`}
                      title={
                        user.subscription?.status === 'active'
                          ? (language === 'ar' 
                              ? `رصيد الكريديت المتبقي: ${userCredits.toLocaleString()} من أصل ${(user.subscription.cycle_credits || 0).toLocaleString()} (انقر لإدارة الاشتراك)`
                              : `Remaining credits: ${userCredits.toLocaleString()} of ${(user.subscription.cycle_credits || 0).toLocaleString()} (Click to manage subscription)`)
                          : (language === 'ar'
                              ? `رصيدك الحالي: ${userCredits.toLocaleString()} كريديت (انقر للاشتراك بالباقات)`
                              : `Current balance: ${userCredits.toLocaleString()} credits (Click to upgrade)`)
                      }
                      aria-label={language === 'ar' ? 'رصيد الكريديت' : 'Credit Balance'}
                    >
                      <AssistantIcon 
                        size={13} 
                        shape="circle" 
                        isSpinning={creditFlash || (chatHeaderData && chatHeaderData.isGenerating)} 
                        spinDirection="reverse"
                        dir={globalLang === 'ar' ? 'rtl' : 'ltr'} 
                        className="shrink-0"
                      />
                      <span className="font-mono font-bold text-xs text-[var(--text-primary)] tracking-tight">
                        {Number(userCredits).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold hidden md:inline">
                        {language === 'ar' ? 'كريديت' : 'cr'}
                      </span>
                    </button>
                  )}

                  {chatHeaderData.pinnedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        window.dispatchEvent(new CustomEvent('chat-action-pinned'));
                      }}
                      className="h-8 px-2.5 rounded-shape-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 box-border relative active:scale-95 before:absolute before:-inset-1.5 before:content-['']"
                      title={globalLang === 'ar' ? 'الرسائل المثبتة' : 'Pinned'}
                    >
                      <Pin size={13} className="fill-amber-500 shrink-0" />
                      <span className="text-[11px] font-mono font-bold">
                        {chatHeaderData.pinnedCount}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      triggerHaptic('light');
                      if (headerMenuTarget) {
                        setHeaderMenuTarget(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHeaderMenuTarget({ rect });
                      }
                    }}
                    className={`w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] flex items-center justify-center transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group bg-transparent before:absolute before:-inset-1.5 before:content-[''] ${
                      headerMenuTarget 
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={globalLang === 'ar' ? 'خيارات' : 'Options'}
                    aria-label={globalLang === 'ar' ? 'خيارات' : 'Options'}
                  >
                    <MoreHorizontal size={14} className={`transition-colors duration-fast ${headerMenuTarget ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* MOBILE LAYOUT: Inline between logo & corner actions */}
            <div
              className="flex-1 flex sm:hidden items-center justify-center min-w-0 z-10 mx-1"
              dir={globalLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-center gap-1 overflow-x-auto custom-scrollbar max-w-full py-0.5 px-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'answer' }));
                  }}
                  className={`w-7 h-7 rounded-shape-sm border flex items-center justify-center transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-2 before:content-[''] ${
                    chatHeaderData.activeChatTab === 'answer'
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                      : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={globalLang === 'ar' ? 'الإجابة والتحليل' : 'Answer'}
                >
                  <AssistantIcon 
                    size={13} 
                    isSpinning={false} 
                    dir={globalLang === 'ar' ? 'rtl' : 'ltr'} 
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'links' }));
                  }}
                  className={`h-7 min-w-[28px] px-1 rounded-shape-sm border flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-2 before:content-[''] ${
                    chatHeaderData.activeChatTab === 'links'
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                      : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={globalLang === 'ar' ? `المصادر (${chatHeaderData.citationsCount})` : `Sources (${chatHeaderData.citationsCount})`}
                >
                  <Globe size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                  {chatHeaderData.citationsCount > 0 && (
                    <span className="px-1 py-0.2 rounded-shape-full text-[10px] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono font-bold">
                      {chatHeaderData.citationsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    window.dispatchEvent(new CustomEvent('chat-set-tab', { detail: 'images' }));
                  }}
                  className={`h-7 min-w-[28px] px-1 rounded-shape-sm border flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-2 before:content-[''] ${
                    chatHeaderData.activeChatTab === 'images'
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border-[var(--border-default)] font-bold shadow-2xs'
                      : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={globalLang === 'ar' ? `الوسائط (${chatHeaderData.imagesCount})` : `Media (${chatHeaderData.imagesCount})`}
                >
                  <ImageIcon size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                  {chatHeaderData.imagesCount > 0 && (
                    <span className="px-1 py-0.2 rounded-shape-full text-[10px] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] font-mono font-bold">
                      {chatHeaderData.imagesCount}
                    </span>
                  )}
                </button>

                {chatHeaderData.pinnedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      window.dispatchEvent(new CustomEvent('chat-action-pinned'));
                    }}
                    className="h-7 px-1.5 rounded-shape-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 box-border relative active:scale-95 before:absolute before:-inset-2 before:content-['']"
                    title={globalLang === 'ar' ? 'الرسائل المثبتة' : 'Pinned'}
                  >
                    <Pin size={12} className="fill-amber-500 shrink-0" />
                    <span className="text-[10px] font-mono font-bold">
                      {chatHeaderData.pinnedCount}
                    </span>
                  </button>
                )}

                {/* Real-time Conditional Credit Counter beside options button on Mobile */}
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      navigate('/subscription');
                    }}
                    className={`h-7 px-1.5 rounded-shape-sm border flex items-center justify-center gap-1 transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group before:absolute before:-inset-2 before:content-[''] ${
                      creditFlash 
                        ? 'bg-[var(--bg-accent-subtle)] border-[var(--border-accent)] text-[var(--fg-accent)] scale-105' 
                        : 'bg-transparent border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                    }`}
                    title={language === 'ar' ? `رصيد الكريديت: ${userCredits.toLocaleString()}` : `Credits: ${userCredits.toLocaleString()}`}
                  >
                    <AssistantIcon 
                      size={11} 
                      shape="circle" 
                      isSpinning={creditFlash || (chatHeaderData && chatHeaderData.isGenerating)} 
                      spinDirection="reverse"
                      dir={globalLang === 'ar' ? 'rtl' : 'ltr'} 
                      className="shrink-0"
                    />
                    <span className="text-[10px] font-mono font-bold">
                      {Number(userCredits).toLocaleString()}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    triggerHaptic('light');
                    if (headerMenuTarget) {
                      setHeaderMenuTarget(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHeaderMenuTarget({ rect });
                    }
                  }}
                  className={`w-7 h-7 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] flex items-center justify-center transition-all duration-fast cursor-pointer shrink-0 relative active:scale-95 group bg-transparent before:absolute before:-inset-2 before:content-[''] ${
                    headerMenuTarget 
                      ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={globalLang === 'ar' ? 'خيارات' : 'Options'}
                >
                  <MoreHorizontal size={13} className={`transition-colors duration-fast ${headerMenuTarget ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Global Action buttons in header corner (Notifications, Theme, Language, Studio, Ads, Profile) */}
        <div className="flex items-center gap-1 sm:gap-1 md:gap-2 shrink-0 h-full z-20">
          {renderActionButtons}
        </div>
      </div>

    {/* Sovereign Top Progress Loader Line */}
    <AnimatePresence>
      {(isStreaming || isOperationPending) && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-foreground)]/20 to-transparent z-[90] origin-left overflow-hidden pointer-events-none"
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-full h-full bg-gradient-to-r from-transparent via-[var(--accent-foreground)]/40 to-transparent shadow-[0_0_12px_var(--accent-foreground)]"
          />
        </motion.div>
      )}
    </AnimatePresence>

    <FloatingPopover
      isOpen={!!headerMenuTarget}
      onClose={() => setHeaderMenuTarget(null)}
      triggerRect={headerMenuTarget?.rect || null}
      direction={globalLang === 'ar' ? 'rtl' : 'ltr'}
      placement="bottom-end"
      width="auto"
    >
      {headerMenuTarget && (() => {
        const allMenuItems = [
          {
            id: 'rename',
            label: globalLang === 'ar' ? 'إعادة تسمية' : 'Rename',
            icon: Pencil,
            action: () => {
              window.dispatchEvent(new CustomEvent('chat-action-rename'));
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'share',
            label: globalLang === 'ar' ? 'مشاركة المحادثة' : 'Share Chat',
            icon: Share2,
            action: () => {
              if (navigator.share) {
                navigator.share({
                  title: chatHeaderData?.title || 'Perplexta Chat',
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success(globalLang === 'ar' ? 'تم نسخ رابط المحادثة' : 'Chat link copied');
              }
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'workspace',
            label: globalLang === 'ar' ? 'إضافة إلى مساحة' : 'Add to Workspace',
            icon: FolderPlus,
            action: () => {
              toast.success(globalLang === 'ar' ? 'تمت الإضافة إلى المساحة' : 'Added to workspace');
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'bookmark',
            label: globalLang === 'ar' ? 'إضافة علامة مرجعية' : 'Add Bookmark',
            icon: Bookmark,
            action: () => {
              toast.success(globalLang === 'ar' ? 'تمت إضافة علامة مرجعية' : 'Bookmark added');
              if (chatHeaderData?.pinnedCount) {
                window.dispatchEvent(new CustomEvent('chat-action-pinned'));
              }
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'pdf',
            label: globalLang === 'ar' ? 'تصدير كـ PDF' : 'Export as PDF',
            icon: FileText,
            action: () => {
              window.dispatchEvent(new CustomEvent('export-chat', { detail: 'pdf' }));
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'docx',
            label: globalLang === 'ar' ? 'تصدير كـ DOCX' : 'Export as DOCX',
            icon: FileType,
            action: () => {
              window.dispatchEvent(new CustomEvent('export-chat', { detail: 'docx' }));
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'md',
            label: globalLang === 'ar' ? 'تصدير كـ Markdown' : 'Export as Markdown',
            icon: FileCode,
            action: () => {
              window.dispatchEvent(new CustomEvent('export-chat', { detail: 'md' }));
              setHeaderMenuTarget(null);
            }
          },
          {
            id: 'delete',
            label: globalLang === 'ar' ? 'حذف المحادثة' : 'Delete Chat',
            icon: Trash2,
            isDanger: true,
            action: () => {
              window.dispatchEvent(new CustomEvent('chat-action-delete'));
              setHeaderMenuTarget(null);
            }
          }
        ];

        // Hierarchical Sort (Shortest name at top -> Longest name at bottom)
        const sortedMenuItems = [...allMenuItems].sort((a, b) => {
          const lenA = a.label.trim().length;
          const lenB = b.label.trim().length;
          return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
        });

        return (
          <div className="flex flex-col gap-0.5 p-1.5 font-sans w-max min-w-[190px]" dir={globalLang === 'ar' ? 'rtl' : 'ltr'}>
            {sortedMenuItems.map((item) => {
              const Icon = item.icon;
              const isDanger = item.isDanger;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                  className={`group w-full h-[40px] min-h-[40px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent transition-all duration-fast cursor-pointer select-none text-start text-xs font-medium ${
                    isDanger
                      ? 'bg-transparent hover:bg-rose-500/10 text-rose-500'
                      : 'bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 transition-colors duration-fast ${
                      isDanger
                        ? 'text-rose-500 group-hover:text-rose-400'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                  />
                  <span
                    className={`truncate min-w-0 flex-1 text-xs transition-colors duration-fast ${
                      isDanger
                        ? 'font-bold text-rose-500 group-hover:text-rose-400'
                        : 'font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}
    </FloatingPopover>

  </header>
);
};
