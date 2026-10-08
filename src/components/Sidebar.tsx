import { safeStorageGet, safeStorageSet } from "@/utils/safeStorage";
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { usePerplextaRouter } from '../hooks/usePerplextaRouter';
import { 
  Gift, 
  CreditCard, 
  LayoutDashboard, 
  Plus, 
  User, 
  LogOut, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Wallet, 
  BrainCircuit, 
  ChevronLeft, 
  Loader2, 
  Activity, 
  MoreHorizontal, 
  Sparkles, 
  Bookmark, 
  FolderPlus, 
  FileText, 
  FileCode, 
  FileType, 
  Pencil, 
  History,
  Share2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isPathBlocked } from '../utils/sectionVisibility';
import { SkeletonLoader } from './SkeletonLoader';
import { resolveImageUrl, DEFAULT_AVATAR } from '../utils/imageResolver';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingPopover } from './FloatingPopover';
import { triggerHaptic } from '../utils/haptics';
import { SIDEBAR_TRANSITION, toast, ActionItem, Badge } from '@/design-system';
import { SCROLL_STYLES, HOVER_STYLES } from '../styles/scrollStyles';

export const Sidebar: React.FC<{ activeLanguage?: string }> = ({ activeLanguage }) => {
  const { 
    t, 
    dir: globalDir, 
    language: globalLang, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    user, 
    logout, 
    setIsAuthModalOpen, 
    siteSettings, 
    token, 
    plans, 
    isMobile,
    socket
  } = useAppContext();
  
  const language = activeLanguage || globalLang;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const sidebarTextMotion = useMemo(() => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: isSidebarOpen ? 0.22 : 0.08,
      ease: [0.2, 0, 0, 1] as const,
    },
  }), [isSidebarOpen]);

  const [profileMenuTarget, setProfileMenuTarget] = useState<{ rect: DOMRect } | null>(null);
  const [recentChats, setRecentChats] = useState<any[]>(() => {
    try {
      const cached = safeStorageGet('perplexta_recent_chats');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isChatsLoading, setIsChatsLoading] = useState<boolean>(() => {
    try {
      return !safeStorageGet('perplexta_recent_chats');
    } catch {
      return true;
    }
  });
  const [streamingChatId, setStreamingChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingChatConfirmId, setDeletingChatConfirmId] = useState<string | null>(null);
  const [optionsMenuTarget, setOptionsMenuTarget] = useState<{ chatId: string; rect: DOMRect } | null>(null);
  const activeOptionsMenuChatId = optionsMenuTarget?.chatId || null;
  const deletingChat = recentChats.find((c: any) => c.id?.toString() === deletingChatConfirmId?.toString());
  const deletingChatTitle = deletingChat ? deletingChat.title : '';
  const { navigate, location } = usePerplextaRouter();

  const match = location.pathname.match(/^\/chat\/([^/]+)/);
  const activeChatId = match ? match[1] : null;

  const [isEditingContext, setIsEditingContext] = useState(false);
  const [editedContext, setEditedContext] = useState('');
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(true);

  const currentChat = recentChats.find((c: any) => c.id?.toString() === activeChatId?.toString());

  useEffect(() => {
    try {
      safeStorageSet('perplexta_recent_chats', JSON.stringify(recentChats));
    } catch {}
  }, [recentChats]);

  useEffect(() => {
    if (currentChat) {
      setEditedContext(currentChat.context_summary || '');
    } else {
      setEditedContext('');
    }
    setIsEditingContext(false);
  }, [activeChatId, currentChat?.context_summary]);

  const handleSaveContext = async () => {
    if (!activeChatId || !token) return;
    setIsSavingContext(true);
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ context_summary: editedContext })
      });
      if (res.ok) {
        setIsEditingContext(false);
        fetchChats();
        toast.success(language === 'ar' ? 'تم تحديث ملخص السياق بنجاح' : 'Context summary updated successfully');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || (language === 'ar' ? 'فشل التحديث' : 'Failed to update context summary'));
      }
    } catch (error) {
      console.error('Error saving context summary:', error);
      toast.error(language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsSavingContext(false);
    }
  };

  useEffect(() => {
    const handleStreamingState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        if (customEvent.detail.isGenerating) {
          setStreamingChatId(customEvent.detail.chatId);
        } else {
          setStreamingChatId(null);
        }
      }
    };
    window.addEventListener('ai-streaming-state', handleStreamingState);
    return () => {
      window.removeEventListener('ai-streaming-state', handleStreamingState);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOptionsMenuTarget(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const groupedChats = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    const today: typeof recentChats = [];
    const last7Days: typeof recentChats = [];
    const older: typeof recentChats = [];

    recentChats.forEach(chat => {
      const time = chat.created_at ? new Date(chat.created_at).getTime() : chat.updated_at ? new Date(chat.updated_at).getTime() : 0;
      if (time >= todayStart || time === 0) {
        today.push(chat);
      } else if (time >= sevenDaysAgo) {
        last7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    let todayDateFormatted = '';
    try {
      todayDateFormatted = now.toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      todayDateFormatted = `${now.getDate()}/${now.getMonth() + 1}`;
    }

    const todayLabel = dir === 'rtl' 
      ? `اليوم • ${todayDateFormatted}` 
      : `Today • ${todayDateFormatted}`;

    return [
      { id: 'today', label: todayLabel, chats: today },
      { id: 'last7Days', label: dir === 'rtl' ? 'آخر 7 أيام' : 'Last 7 Days', chats: last7Days },
      { id: 'older', label: dir === 'rtl' ? 'أقدم' : 'Older', chats: older },
    ].filter(group => group.chats.length > 0);
  }, [recentChats, dir]);
  const inFlightFetchRef = useRef<Promise<void> | null>(null);
  const retryTimeoutRef = useRef<any>(null);

  const fetchChats = useCallback(async (retryCount = 0) => {
    if (!token || token === 'null') {
      setIsChatsLoading(false);
      return;
    }

    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch('/api/chats', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setRecentChats(data);
              try {
                safeStorageSet('perplexta_recent_chats', JSON.stringify(data));
              } catch {}
            }
          }
        } else if (res.status === 429) {
          // Rate limit reached - schedule a backoff retry without noisy console error
          if (retryCount < 3) {
            const backoffMs = Math.min(1500 * Math.pow(2, retryCount), 6000) + Math.random() * 400;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => {
              fetchChats(retryCount + 1);
            }, backoffMs);
          }
        } else if (res.status === 401) {
          // Token expired or invalid
        } else {
          const text = await res.text().catch(() => '');
          if (res.status !== 503 && res.status !== 502) {
            console.debug(`[Chats] HTTP ${res.status}:`, text.substring(0, 100));
          }
        }
      } catch (e) {
        if (e instanceof Error && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
          console.debug('Transient network error fetching chats (likely server initializing)');
        } else {
          console.debug('Network notice fetching chats:', e);
        }
      } finally {
        setIsChatsLoading(false);
        inFlightFetchRef.current = null;
      }
    })();

    inFlightFetchRef.current = fetchPromise;
    return fetchPromise;
  }, [token]);

  const handleDelete = async (e: React.MouseEvent | null, id: string | null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!id) return;
    try {
      setRecentChats(prev => {
        const next = prev.filter(c => c.id?.toString() !== id.toString());
        try { safeStorageSet('perplexta_recent_chats', JSON.stringify(next)); } catch {}
        return next;
      });
      setDeletingChatConfirmId(null);

      const res = await fetch(`/api/chats/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete chat');
      }
      toast.success(language === 'ar' ? 'تم حذف الجلسة بنجاح' : 'Session deleted successfully');
      window.dispatchEvent(new CustomEvent('chat-updated'));
      if (activeChatId?.toString() === id.toString()) {
        window.dispatchEvent(new Event('clear-chat'));
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
      toast.error(language === 'ar' ? 'فشل حذف الجلسة' : 'Failed to delete session');
      fetchChats();
    }
  };

  const handleRename = async (id: string | null) => {
    if (!id || !newTitle.trim()) return;
    const trimmed = newTitle.trim();
    try {
      setRecentChats(prev => {
        const next = prev.map(c => c.id?.toString() === id.toString() ? { ...c, title: trimmed } : c);
        try { safeStorageSet('perplexta_recent_chats', JSON.stringify(next)); } catch {}
        return next;
      });
      setEditingChatId(null);
      setNewTitle('');

      const res = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title: trimmed })
      });
      if (!res.ok) {
        throw new Error('Failed to rename chat');
      }
      toast.success(language === 'ar' ? 'تم تعديل اسم الجلسة' : 'Session renamed');
      window.dispatchEvent(new CustomEvent('chat-updated'));
    } catch (err) {
      console.error('Failed to rename chat', err);
      toast.error(language === 'ar' ? 'فشل تعديل الاسم' : 'Failed to rename session');
      fetchChats();
    }
  };

  useEffect(() => {
    fetchChats();
    let debounceTimer: any = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchChats(), 250);
    };

    const handleChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail && customEvent.detail.id) {
        const { id, title } = customEvent.detail;
        setRecentChats(prev => {
          const exists = prev.some((c: any) => String(c.id) === String(id));
          let next;
          if (exists) {
            next = prev.map((c: any) => String(c.id) === String(id) ? { ...c, title: title || c.title, updated_at: new Date().toISOString() } : c);
          } else {
            next = [{
              id,
              title: title || (language === 'ar' ? 'محادثة جديدة' : 'New Session'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, ...prev];
          }
          try { safeStorageSet('perplexta_recent_chats', JSON.stringify(next)); } catch {}
          return next;
        });
      }
      debouncedFetch();
    };

    window.addEventListener('chat-created', handleChatEvent);
    window.addEventListener('chat-updated', handleChatEvent);

    // Auto-refresh chat history list when streaming finishes or starts
    const handleStreamingState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent && customEvent.detail) {
        if (customEvent.detail.isGenerating) {
          setStreamingChatId(customEvent.detail.chatId);
        } else {
          setStreamingChatId(null);
          debouncedFetch();
        }
      }
    };
    window.addEventListener('ai-streaming-state', handleStreamingState);

    const handleSocketTitleUpdated = (data: { chatId: string, title: string }) => {
      if (data && data.chatId && data.title) {
        setRecentChats(prev => {
          const next = prev.map((c: any) => String(c.id) === String(data.chatId) ? { ...c, title: data.title } : c);
          try { safeStorageSet('perplexta_recent_chats', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    };

    // Socket real-time synchronization
    if (socket) {
      socket.on('chat_updated', debouncedFetch);
      socket.on('chat_created', debouncedFetch);
      socket.on('chat_title_updated', handleSocketTitleUpdated);
    }

    return () => {
      window.removeEventListener('chat-created', handleChatEvent);
      window.removeEventListener('chat-updated', handleChatEvent);
      window.removeEventListener('ai-streaming-state', handleStreamingState);
      if (socket) {
        socket.off('chat_updated', debouncedFetch);
        socket.off('chat_created', debouncedFetch);
        socket.off('chat_title_updated', handleSocketTitleUpdated);
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [fetchChats, socket, language]);

  const rawNavItems: { icon: React.ReactNode, label: string, path: string, className?: string }[] = [];

  if (user) {
    rawNavItems.push({
      icon: <Sparkles size={18} />,
      label: language === 'ar' ? 'اكتشف' : 'Discover',
      path: '/discover'
    });
  }

  if (user) {
    rawNavItems.push({ icon: <Gift size={18} />, label: t('rewards'), path: '/rewards' });
  }

  if (!isMobile && (typeof window === 'undefined' || window.innerWidth >= 768)) {
    rawNavItems.push({ 
      icon: <CreditCard size={18} />, 
      label: t('subscription'), 
      path: '/subscription',
      className: 'hidden md:flex'
    });
  }

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  if (!isMobile && user && (['admin', 'support', 'elite'].includes(user.role || '') || (adminEmail && user.email === adminEmail))) {
    rawNavItems.push({ 
      icon: <LayoutDashboard size={18} />, 
      label: t('dashboard'), 
      path: '/admin',
      className: 'hidden md:flex'
    });
  }

  const navItems = rawNavItems.filter(item => !isPathBlocked(item.path, siteSettings?.blocked_paths, isMobile));

  const handleNewChat = () => {
    const isAlreadyAtNewChat = window.location.pathname === '/' || window.location.pathname === '/chat';
    
    if (isAlreadyAtNewChat) {
      window.dispatchEvent(new Event('clear-chat'));
      setIsSidebarOpen(false);
      return;
    }

    navigate('/chat');
    window.dispatchEvent(new Event('clear-chat'));
  };

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 180 : 50
        }}
        transition={SIDEBAR_TRANSITION}
        className={`fixed z-[150] select-none bg-[var(--surface-sidebar)] border-[var(--border-default)] ${
          dir === 'rtl' ? 'border-l' : 'border-r'
        } flex flex-col top-0 h-[100dvh] pb-safe start-0 pointer-events-auto visible`}
        style={{ 
          contain: 'layout', 
          willChange: 'width',
          transform: 'none',
          WebkitBackfaceVisibility: 'visible',
          backfaceVisibility: 'visible',
          [dir === 'rtl' ? 'right' : 'left']: 0,
          [dir === 'rtl' ? 'left' : 'right']: 'auto',
        }}
      >
        <div className="w-full h-full overflow-hidden relative flex flex-col items-stretch px-0">
          <div 
            className="h-full flex flex-col flex-nowrap justify-between"
            style={{
              width: '180px',
              minWidth: '180px',
              position: 'absolute',
              [dir === 'rtl' ? 'right' : 'left']: 0,
              top: 0,
              bottom: 0
            }}
          >
            {/* Header / Logo Zone Spacer */}
            <div className="h-[calc(50px+env(safe-area-inset-top,0px))] lg:h-[calc(56px+env(safe-area-inset-top,0px))] flex-shrink-0 border-b border-[var(--border-default)] w-full transition-all duration-fast" />

            <div className="flex-shrink-0 pt-2 px-1.5">
              <nav className="flex flex-col gap-0.5">
                {navItems.map((item, index) => (
                  <NavLink
                    key={`nav-${item.path}-${index}`}
                    to={item.path}
                    onClick={() => {
                      triggerHaptic('selection');
                    }}
                  >
                    {({ isActive }) => {
                      const active = isActive;
                      return (
                        <div 
                          className={`${(item as any).className || 'flex'} items-center transition-all duration-fast w-full h-[34px] min-h-[34px] overflow-hidden flex-shrink-0 group relative rounded-shape-sm cursor-pointer select-none ${
                            active 
                              ? HOVER_STYLES.sidebarItemActive
                              : HOVER_STYLES.sidebarItem
                          }`}
                          style={{ paddingInlineStart: '8px', paddingInlineEnd: '8px' }}
                        >
                          <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-colors duration-fast ${
                            active 
                              ? 'text-[var(--fg-accent)]' 
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                          }`}>
                            {React.cloneElement(item.icon as React.ReactElement, { size: 16 } as any)}
                          </div>
                          <AnimatePresence initial={false}>
                            {isSidebarOpen && (
                              <motion.span
                                {...sidebarTextMotion}
                                className={`text-xs tracking-tight whitespace-nowrap overflow-hidden transition-colors duration-fast leading-normal ${
                                  active 
                                    ? 'font-semibold text-[var(--fg-accent)]' 
                                    : 'font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                } ms-1.5`}
                                style={{ display: 'inline-block' }}
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }}
                  </NavLink>
                ))}

                  {user && token && (
                  <div className="my-1 pt-1 pb-0.5 border-t border-[var(--border-default)] transition-theme">
                    <button 
                      onClick={handleNewChat}
                      className="flex items-center transition-all duration-fast w-full h-[34px] min-h-[34px] overflow-hidden flex-shrink-0 group cursor-pointer border border-transparent rounded-shape-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/25 active:scale-98 select-none"
                      style={{ paddingInlineStart: '8px', paddingInlineEnd: '8px' }}
                    >
                      <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-colors duration-fast text-[var(--text-muted)] group-hover:text-[var(--text-primary)] ${isSidebarOpen ? 'my-auto' : '-translate-y-[0.5px]'}`}>
                        <Plus size={16} />
                      </div>
                      <AnimatePresence initial={false}>
                        {isSidebarOpen && (
                          <motion.span
                            {...sidebarTextMotion}
                            className={`font-medium text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] whitespace-nowrap overflow-hidden transition-colors duration-fast leading-normal ms-1.5`}
                            style={{ display: 'inline-block' }}
                          >
                            {t('newChat')}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                )}
              </nav>
            </div>

            {user && token && (
              <div className="flex-grow flex-shrink flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {/* Fixed History Section Title */}
                <div 
                  className="h-7 border-t border-[var(--border-default)] transition-theme flex-shrink-0 flex items-center justify-between overflow-hidden bg-[var(--surface-sidebar)] select-none"
                  style={{ paddingInlineStart: '11px', paddingInlineEnd: '8px' }}
                >
                  <div className="flex items-center w-full h-full">
                    <div className="w-7 h-full flex-shrink-0 flex items-center justify-center">
                      <History size={13} className="text-[var(--text-muted)]" />
                    </div>
                    <AnimatePresence initial={false}>
                      {isSidebarOpen && (
                        <motion.span 
                          {...sidebarTextMotion}
                          className={`text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap overflow-hidden ms-1.5`}
                        >
                          {dir === 'rtl' ? 'المحادثات السابقة' : 'Recent Chats'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className={`flex-1 pb-2 min-h-0 px-1.5 ${SCROLL_STYLES.sidebar}`}>
                  <div className="min-h-[85px]">
                    {isChatsLoading ? (
                      <SkeletonLoader 
                        type="chat-history" 
                        count={isMobile ? 3 : 5} 
                        isSidebarOpen={isSidebarOpen} 
                        isMobile={true} 
                        isRtl={dir === 'rtl'} 
                      />
                    ) : groupedChats.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {groupedChats.map((group) => (
                          <React.Fragment key={group.id || group.label}>
                            {group.chats.map((chat) => {
                              const isActive = activeChatId?.toString() === chat.id?.toString();
                              const isMenuOpen = activeOptionsMenuChatId === chat.id;
                              return (
                                <div
                                  key={`sidebar-chat-${chat.id}`}
                                  className={`flex items-center w-full h-[34px] min-h-[34px] ${isMenuOpen ? 'overflow-visible z-30' : 'overflow-hidden'} flex-shrink-0 transition-all duration-fast group relative rounded-shape-sm cursor-pointer select-none ${
                                    isActive 
                                      ? HOVER_STYLES.sidebarItemActive 
                                      : HOVER_STYLES.sidebarItem
                                  }`}
                                  style={{ paddingInlineStart: '8px', paddingInlineEnd: '6px' }}
                                >
                                  <div
                                    onClick={() => {
                                      navigate(`/chat/${chat.id}`);
                                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className="flex items-center h-full flex-1 min-w-0"
                                  >
                                    <div className={`w-6 h-full flex-shrink-0 flex items-center justify-center transition-colors duration-fast ${
                                      isActive 
                                        ? 'text-[var(--fg-accent)]' 
                                        : streamingChatId === chat.id 
                                          ? 'text-[var(--fg-accent)] animate-pulse' 
                                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                                    }`}>
                                      <MessageSquare size={15} />
                                    </div>
                                    <AnimatePresence initial={false}>
                                      {isSidebarOpen && (
                                        <motion.span
                                          {...sidebarTextMotion}
                                          className={`text-xs truncate whitespace-nowrap overflow-hidden text-start transition-colors duration-fast leading-normal ms-1.5 ${
                                            isActive 
                                              ? 'font-semibold text-[var(--fg-accent)]' 
                                              : 'font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                          }`}
                                          style={{ display: 'inline-block' }}
                                        >
                                          {chat.title}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <AnimatePresence initial={false}>
                                    {isSidebarOpen && (
                                      <motion.div 
                                        {...sidebarTextMotion}
                                        className={`flex items-center gap-1 ${optionsMenuTarget?.chatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-fast ms-auto pe-0.5`}
                                      >
                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (optionsMenuTarget?.chatId === chat.id) {
                                              setOptionsMenuTarget(null);
                                            } else {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setOptionsMenuTarget({ chatId: chat.id, rect });
                                            }
                                          }}
                                          className={`w-6 h-6 flex items-center justify-center rounded-shape-xs transition-all duration-fast cursor-pointer active:scale-95 ${
                                            optionsMenuTarget?.chatId === chat.id 
                                              ? 'text-[var(--fg-accent)]' 
                                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] hover:text-[var(--fg-accent)]'
                                          }`}
                                          title={language === 'ar' ? 'خيارات' : 'Options'}
                                        >
                                          <MoreHorizontal size={13} />
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Context Summary Box in Sidebar - Seamless single scroll layer flow */}
                  {isSidebarOpen && activeChatId && (
                    <div className="mt-3 p-2 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)]/40 flex flex-col transition-all duration-fast">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsContextCollapsed(!isContextCollapsed)}>
                        <div className="flex items-center gap-1 min-w-0">
                          <BrainCircuit size={isMobile ? 12 : 14} className="text-[var(--accent)] flex-shrink-0" />
                          <span className={`${isMobile ? 'text-[9.5px]' : 'text-[11px]'} font-bold uppercase tracking-wider text-[var(--text-muted)] truncate font-sans`}>
                            {language === 'ar' ? 'ملخص السياق النشط' : 'Context Summary'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!isEditingContext && (
                            <button
                              onClick={() => setIsEditingContext(true)}
                              className="w-5 h-5 flex items-center justify-center rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-accent-muted)] transition-all duration-fast active:scale-95 cursor-pointer"
                              title={language === 'ar' ? 'تعديل المعرفة' : 'Edit Context'}
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                          <button
                            onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                            className={`w-5 h-5 flex items-center justify-center rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-accent-muted)] transition-all duration-fast active:scale-95 cursor-pointer transform ${isContextCollapsed ? 'rotate-180' : ''}`}
                          >
                            <ChevronLeft size={12} className="rotate-270" style={{ transform: isContextCollapsed ? 'rotate(90deg)' : 'rotate(-90deg)' }} />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {!isContextCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                            className="overflow-hidden"
                          >
                            {isEditingContext ? (
                              <div className="flex flex-col gap-2 mt-2">
                                <textarea
                                  value={editedContext}
                                  onChange={(e) => setEditedContext(e.target.value)}
                                  className="w-full h-20 text-[10.5px] font-sans p-2 rounded-shape-xs bg-[var(--surface-inset)] text-[var(--text-primary)] border border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--focus-outline)]/30 outline-none resize-none transition-all duration-fast"
                                  placeholder={language === 'ar' ? 'اكتب سياق المعرفة هنا...' : 'Type active context summary here...'}
                                  disabled={isSavingContext}
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setIsEditingContext(false);
                                      setEditedContext(currentChat?.context_summary || '');
                                    }}
                                    disabled={isSavingContext}
                                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all duration-fast rounded-shape-xs px-2 py-1 flex items-center gap-1 font-semibold active:scale-95 cursor-pointer"
                                  >
                                    <X size={10} />
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                  </button>
                                  <button
                                    onClick={handleSaveContext}
                                    disabled={isSavingContext}
                                    className="text-[10px] text-[var(--fg-on-emphasis)] bg-[var(--accent)] hover:opacity-90 transition-all duration-fast rounded-shape-xs px-2.5 py-1 flex items-center gap-1 font-bold shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    {isSavingContext ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      <Check size={10} />
                                    )}
                                    {language === 'ar' ? 'حفظ' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-1.5">
                                <div className="text-[10px] text-[var(--text-secondary)] font-sans leading-relaxed tracking-wide select-text whitespace-pre-wrap p-2 bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-xs">
                                  {editedContext ? (
                                    editedContext
                                  ) : (
                                    <span className="text-[var(--text-muted)] italic">
                                      {language === 'ar'
                                        ? 'لم يتم إنشاء ملخص سياق بعد لهذه المحادثة. يبدأ النموذج بالتلخيص قريباً.'
                                        : 'No active context summary generated yet for this chat.'}
                                    </span>
                                  )}
                                </div>
                                {!editedContext && (
                                  <button
                                    onClick={() => setIsEditingContext(true)}
                                    className="self-start text-[8.5px] font-bold text-[var(--accent)] hover:opacity-80 transition-all duration-fast flex items-center gap-1 mt-0.5"
                                  >
                                    <Plus size={9} />
                                    {language === 'ar' ? 'إضافة ملخص يدوي' : 'Add summary manually'}
                                  </button>
                                )}
                                <span className="text-[8.5px] text-[var(--text-muted)] leading-snug">
                                  {language === 'ar'
                                    ? '💡 يمثل هذا السياق النشط الذي يتم تضمينه في ذاكرة الذكاء الاصطناعي لفهم محتوى المحادثة الحالي.'
                                    : '💡 This represents the active context synthesized for the AI model to track key objectives.'}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`mt-auto ${isMobile ? 'pt-1.5 pb-1.5 px-1.5 space-y-0.5' : 'pt-1.5 pb-2 px-1.5 space-y-0.5'} border-t border-[var(--border-default)] flex-shrink-0 relative`}>
              {user ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setProfileMenuTarget(profileMenuTarget ? null : { rect });
                  }}
                  className={`flex items-center group cursor-pointer w-full h-[36px] overflow-hidden flex-shrink-0 rounded-shape-sm transition-colors duration-fast select-none active:scale-98 ${
                    profileMenuTarget
                      ? HOVER_STYLES.sidebarItemActive
                      : HOVER_STYLES.sidebarItem
                  }`}
                  style={{ paddingInlineStart: '8px', paddingInlineEnd: '8px' }}
                >
                  <div className="flex items-center h-full overflow-hidden w-full relative text-[var(--text-primary)]">
                    <div className="w-7 h-[34px] flex-shrink-0 flex items-center justify-center relative">
                      <div 
                        className="w-7 h-7 rounded-shape-xs flex items-center justify-center flex-shrink-0 overflow-hidden border transition-colors duration-fast relative z-10"
                        style={{ 
                          borderColor: user.subscription?.plan_color || 'var(--border-default)'
                        }}
                      >
                        {user.avatar ? (
                          <img 
                            src={resolveImageUrl(user.avatar, 'avatar')} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                          />
                        ) : (
                          <User size={15} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                        )}
                      </div>
                      <div className={`absolute -bottom-1 left-0 right-0 flex justify-center transition-opacity duration-fast ${!isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <span 
                          className="text-[8px] font-black uppercase tracking-tighter leading-none whitespace-nowrap"
                          style={{ color: user.subscription?.plan_color || 'var(--text-primary)' }}
                        >
                          {user.subscription?.plan_name_en || ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 ps-1.5 justify-center flex-1">
                      <div 
                        className={`flex flex-col overflow-hidden text-start transition-opacity duration-200 ease-out ${
                          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <span className="font-semibold text-xs truncate whitespace-nowrap leading-tight text-[var(--text-primary)] transition-colors duration-fast">{user.name}</span>
                        <span className="text-[9px] text-[var(--text-muted)] truncate whitespace-nowrap uppercase tracking-wider font-medium leading-tight mt-0.5">
                          {t(`role_${(user.role || 'user').toLowerCase()}`) || (user.subscription?.plan_id 
                            ? (plans.find((p: any) => p.id.toString() === user.subscription?.plan_id.toString())?.name || t('activePlan'))
                            : t('noPlan'))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`flex items-center group cursor-pointer w-full h-[36px] overflow-hidden flex-shrink-0 transition-colors duration-fast rounded-shape-sm select-none active:scale-98 ${HOVER_STYLES.sidebarItem}`}
                  style={{ paddingInlineStart: '8px', paddingInlineEnd: '8px' }}
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    if (isMobile) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center h-full overflow-hidden w-full relative text-[var(--text-primary)]">
                    <div className="w-7 h-[34px] flex-shrink-0 flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-shape-xs flex items-center justify-center flex-shrink-0 relative z-10 transition-colors duration-fast border border-[var(--border-default)]">
                        <User size={15} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-fast" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 ps-1.5 justify-center flex-1">
                      <div 
                        className={`flex flex-col overflow-hidden text-start transition-opacity duration-200 ease-out ${
                          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <span className="text-[9px] text-[var(--text-muted)] truncate whitespace-nowrap font-medium uppercase tracking-wider mb-0.5">{t('createAccount')}</span>
                        <span className="font-semibold text-xs truncate whitespace-nowrap text-[var(--text-primary)] transition-colors duration-fast">{t('login')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col w-full h-auto px-1 overflow-hidden flex-shrink-0 relative">
                <div 
                  className={`flex items-center justify-between w-full overflow-hidden px-0.5 py-1 select-none transition-opacity duration-200 ${
                    isSidebarOpen ? 'opacity-45 hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <NavLink 
                    to="/terms" 
                    className="text-[8.5px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-fast whitespace-nowrap"
                  >
                    {t('termsOfUse')}
                  </NavLink>
                  <span className="w-0.5 h-0.5 rounded-shape-full bg-[var(--text-muted)] opacity-50 flex-shrink-0" />
                  <NavLink 
                    to="/privacy" 
                    className="text-[8.5px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-fast whitespace-nowrap"
                  >
                    {t('privacyPolicy')}
                  </NavLink>
                  <span className="w-0.5 h-0.5 rounded-shape-full bg-[var(--text-muted)] opacity-50 flex-shrink-0" />
                  <NavLink 
                    to="/about" 
                    className="text-[8.5px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-fast whitespace-nowrap"
                  >
                    {language === 'ar' ? 'عن المنصة' : 'About'}
                  </NavLink>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.aside>

      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-[149] bg-transparent"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingChatConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setDeletingChatConfirmId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-sm w-full p-6 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl z-10"
            >
              <h3 className="text-base font-bold tracking-tight font-sans text-start text-[var(--text-primary)]">
                {language === 'ar' ? 'حذف الجلسة؟' : 'Delete session?'}
              </h3>
              
              <p className="text-xs mt-2 font-sans text-start text-[var(--text-muted)]">
                {language === 'ar' ? 'سيؤدي هذا إلى حذف الجلسة نهائيًا:' : 'This will permanently delete the session:'}
              </p>
              
              <div className="mt-3 p-3 rounded-shape-sm text-xs font-bold leading-relaxed break-all text-start border border-[var(--border-default)] bg-[var(--surface-inset)] text-[var(--text-primary)]">
                {deletingChatTitle}
              </div>
              
              <div className={`flex justify-end gap-2 mt-6 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setDeletingChatConfirmId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-shape-sm font-sans transition-all duration-fast text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 cursor-pointer border border-[var(--border-default)]"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                
                <button
                  type="button"
                  onClick={async (e) => {
                    await handleDelete(e, deletingChatConfirmId);
                    setDeletingChatConfirmId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[var(--fg-danger)] hover:opacity-90 text-white rounded-shape-sm font-sans transition-all duration-fast shadow-xs active:scale-95 cursor-pointer"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Rename Modal */}
      <AnimatePresence>
        {editingChatId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setEditingChatId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-sm w-full p-6 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl z-10"
            >
              <h3 className="text-base font-bold tracking-tight font-sans text-start text-[var(--text-primary)]">
                {language === 'ar' ? 'إعادة تسمية الجلسة؟' : 'Rename session?'}
              </h3>
              
              <p className="text-xs mt-2 font-sans text-start text-[var(--text-muted)]">
                {language === 'ar' ? 'أدخل الاسماً الجديداً للجلسة:' : 'Please enter a new name for this session:'}
              </p>
              
              <div className="mt-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newTitle.trim()) {
                      await handleRename(editingChatId);
                    }
                    if (e.key === 'Escape') setEditingChatId(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold leading-relaxed text-start border border-[var(--border-default)] rounded-shape-sm bg-[var(--surface-inset)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--focus-outline)]/30 outline-none transition-all duration-fast"
                  autoFocus
                  placeholder={language === 'ar' ? 'اسم الجلسة...' : 'Session name...'}
                />
              </div>
              
              <div className={`flex justify-end gap-2 mt-6 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setEditingChatId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-shape-sm font-sans transition-all duration-fast text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 cursor-pointer border border-[var(--border-default)]"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                
                <button
                  type="button"
                  disabled={!newTitle.trim()}
                  onClick={async () => {
                    if (newTitle.trim()) {
                      await handleRename(editingChatId);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--fg-on-emphasis)] rounded-shape-sm font-sans transition-all duration-fast shadow-xs active:scale-95 cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingPopover
        isOpen={!!optionsMenuTarget}
        onClose={() => setOptionsMenuTarget(null)}
        triggerRect={optionsMenuTarget?.rect || null}
        direction={dir}
        placement="outward-sidebar"
        width="auto"
      >
        {optionsMenuTarget && (() => {
          const allMenuItems = [
            {
              id: 'rename',
              label: language === 'ar' ? 'إعادة تسمية' : 'Rename',
              icon: Pencil,
              action: () => {
                const targetChat = recentChats.find((c: any) => c.id?.toString() === optionsMenuTarget.chatId?.toString());
                if (targetChat) {
                  setEditingChatId(targetChat.id);
                  setNewTitle(targetChat.title);
                }
                setOptionsMenuTarget(null);
              }
            },
            {
              id: 'share',
              label: language === 'ar' ? 'مشاركة المحادثة' : 'Share Chat',
              icon: Share2,
              action: () => {
                const targetId = optionsMenuTarget.chatId;
                const targetChat = recentChats.find((c: any) => c.id?.toString() === targetId?.toString());
                const shareUrl = `${window.location.origin}/chat/${targetId}`;
                if (navigator.share) {
                  navigator.share({
                    title: targetChat?.title || 'Perplexta Chat',
                    url: shareUrl,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success(language === 'ar' ? 'تم نسخ رابط المحادثة' : 'Chat link copied');
                }
                setOptionsMenuTarget(null);
              }
            },
            {
              id: 'workspace',
              label: language === 'ar' ? 'إضافة إلى مساحة' : 'Add to Workspace',
              icon: FolderPlus,
              action: () => {
                toast.success(language === 'ar' ? 'تمت الإضافة إلى المساحة' : 'Added to workspace');
                setOptionsMenuTarget(null);
              }
            },
            {
              id: 'bookmark',
              label: language === 'ar' ? 'إضافة علامة مرجعية' : 'Add Bookmark',
              icon: Bookmark,
              action: () => {
                toast.success(language === 'ar' ? 'تمت إضافة علامة مرجعية' : 'Bookmark added');
                setOptionsMenuTarget(null);
              }
            },
            {
              id: 'pdf',
              label: language === 'ar' ? 'تصدير كـ PDF' : 'Export as PDF',
              icon: FileText,
              action: () => {
                const targetId = optionsMenuTarget.chatId;
                setOptionsMenuTarget(null);
                navigate(`/chat/${targetId}`);
                setTimeout(() => window.dispatchEvent(new CustomEvent('export-chat', { detail: 'pdf' })), 200);
              }
            },
            {
              id: 'docx',
              label: language === 'ar' ? 'تصدير كـ DOCX' : 'Export as DOCX',
              icon: FileType,
              action: () => {
                const targetId = optionsMenuTarget.chatId;
                setOptionsMenuTarget(null);
                navigate(`/chat/${targetId}`);
                setTimeout(() => window.dispatchEvent(new CustomEvent('export-chat', { detail: 'docx' })), 200);
              }
            },
            {
              id: 'md',
              label: language === 'ar' ? 'تصدير كـ Markdown' : 'Export as Markdown',
              icon: FileCode,
              action: () => {
                const targetId = optionsMenuTarget.chatId;
                setOptionsMenuTarget(null);
                navigate(`/chat/${targetId}`);
                setTimeout(() => window.dispatchEvent(new CustomEvent('export-chat', { detail: 'md' })), 200);
              }
            },
            {
              id: 'delete',
              label: language === 'ar' ? 'حذف المحادثة' : 'Delete Chat',
              icon: Trash2,
              isDanger: true,
              action: () => {
                setDeletingChatConfirmId(optionsMenuTarget.chatId);
                setOptionsMenuTarget(null);
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
            <div className="flex flex-col gap-0.5 p-1.5 font-sans w-max min-w-[190px]" dir={dir}>
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
                    className={`group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent transition-all duration-fast cursor-pointer select-none text-start active:scale-98 ${
                      isDanger
                        ? 'bg-transparent hover:bg-red-500/10 text-[var(--fg-danger)]'
                        : 'bg-transparent hover:bg-[var(--surface-subtle)]/25 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon
                      size={14}
                      className={`shrink-0 transition-colors duration-fast ${
                        isDanger
                          ? 'text-[var(--fg-danger)] group-hover:text-[var(--fg-danger)]'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'
                      }`}
                    />
                    <span
                      className={`truncate min-w-0 flex-1 text-xs transition-colors duration-fast ${
                        isDanger
                          ? 'font-bold text-[var(--fg-danger)] group-hover:text-[var(--fg-danger)]'
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

      {/* User Profile Floating Popover - Cohesive Surface Layer */}
      <FloatingPopover
        isOpen={!!profileMenuTarget && !!user}
        onClose={() => setProfileMenuTarget(null)}
        triggerRect={profileMenuTarget?.rect || null}
        direction={dir}
        placement="sidebar-profile"
        width={isSidebarOpen && profileMenuTarget?.rect?.width ? profileMenuTarget.rect.width : 'auto'}
      >
        {user && (() => {
          const rawProfileLinks = [
            {
              id: 'account',
              label: t('accountSettings') || (dir === 'rtl' ? 'إعدادات الحساب' : 'Account Settings'),
              icon: User,
              path: '/settings/account'
            },
            {
              id: 'usage',
              label: t('consumption') || (dir === 'rtl' ? 'الاستهلاك والحدود' : 'Usage & Limits'),
              icon: Activity,
              path: '/settings/usage'
            },
            {
              id: 'wallet',
              label: t('wallet') || (dir === 'rtl' ? 'المحفظة والرصيد' : 'Wallet'),
              icon: Wallet,
              path: '/settings/wallet'
            },
            {
              id: 'memory',
              label: t('memoryCenter') || (dir === 'rtl' ? 'ذاكرة المساعد' : 'Memory Center'),
              icon: BrainCircuit,
              path: '/settings/memory'
            }
          ];

          // Hierarchical Sort (Ascending label length: 1, 22, 333, 4444)
          const sortedProfileLinks = [...rawProfileLinks].sort((a, b) => {
            const lenA = a.label.trim().length;
            const lenB = b.label.trim().length;
            return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
          });

          return (
            <div className="flex flex-col p-1.5 gap-0.5 font-sans w-full max-w-full" dir={dir}>
              {/* User profile header summary */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[var(--border-default)] mb-1 overflow-hidden">
                <div 
                  className="w-7 h-7 rounded-shape-xs flex items-center justify-center flex-shrink-0 overflow-hidden border transition-colors duration-fast"
                  style={{ borderColor: user.subscription?.plan_color || 'var(--border-default)' }}
                >
                  {user.avatar ? (
                    <img 
                      src={resolveImageUrl(user.avatar, 'avatar')} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                  ) : (
                    <User size={14} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1 text-start overflow-hidden">
                  <span className="font-bold text-xs truncate leading-tight text-[var(--text-primary)]">{user.name}</span>
                  <span className="text-[9.5px] text-[var(--text-muted)] truncate leading-tight mt-0.5 font-medium">
                    {t(`role_${(user.role || 'user').toLowerCase()}`) || user.role || 'Member'}
                  </span>
                </div>
                {user.subscription?.plan_name_en && (
                  <span 
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-shape-xs border border-current leading-none shrink-0"
                    style={{ color: user.subscription?.plan_color || 'var(--text-primary)' }}
                  >
                    {user.subscription?.plan_name_en}
                  </span>
                )}
              </div>

              {/* Menu options sorted hierarchically */}
              {sortedProfileLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setProfileMenuTarget(null);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent bg-transparent hover:bg-[var(--surface-subtle)]/25 transition-all duration-fast cursor-pointer select-none text-start text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-98"
                  >
                    <Icon size={14} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] shrink-0 transition-colors duration-fast" />
                    <span className="truncate min-w-0 flex-1 text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors duration-fast">
                      {item.label}
                    </span>
                  </button>
                );
              })}

              <div className="h-px bg-[var(--border-default)] my-1 mx-1" />

              {/* Logout */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setProfileMenuTarget(null);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-shape-sm border border-transparent bg-transparent hover:bg-red-500/10 text-[var(--fg-danger)] transition-all duration-fast cursor-pointer select-none text-start active:scale-98"
              >
                <LogOut size={14} className="text-[var(--fg-danger)] group-hover:opacity-90 shrink-0 transition-colors duration-fast" />
                <span className="truncate min-w-0 flex-1 text-xs font-bold text-[var(--fg-danger)] group-hover:opacity-90 transition-colors duration-fast">
                  {t('logout') || (dir === 'rtl' ? 'تسجيل الخروج' : 'Logout')}
                </span>
              </button>
            </div>
          );
        })()}
      </FloatingPopover>
    </>
  );
};
