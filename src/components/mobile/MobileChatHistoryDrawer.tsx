import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  Edit2, 
  Check, 
  Clock, 
  History, 
  Sparkles, 
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { safeStorageGet, safeStorageSet } from '../../utils/safeStorage';
import { toast } from '@/design-system';
import { SCROLL_STYLES } from '../../styles/scrollStyles';

export const MobileChatHistoryDrawer: React.FC = () => {
  const { language, token, user, socket } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentChats, setRecentChats] = useState<any[]>(() => {
    try {
      const cached = safeStorageGet('perplexta_recent_chats');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const match = location.pathname.match(/^\/chat\/([^/]+)/);
  const activeChatId = match ? match[1] : null;

  // Listen for global open/close events
  useEffect(() => {
    const handleOpen = () => {
      triggerHaptic('medium');
      setIsOpen(true);
    };
    const handleClose = () => {
      setIsOpen(false);
    };

    window.addEventListener('open-mobile-chat-history', handleOpen);
    window.addEventListener('close-mobile-chat-history', handleClose);

    return () => {
      window.removeEventListener('open-mobile-chat-history', handleOpen);
      window.removeEventListener('close-mobile-chat-history', handleClose);
    };
  }, []);

  // Fetch chats on open or token change
  const fetchChats = useCallback(async () => {
    if (!token || token === 'null') return;
    setIsLoading(true);
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
      }
    } catch (e) {
      console.debug('Error fetching mobile chat history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen, fetchChats]);

  // Socket & Custom Event sync
  useEffect(() => {
    const handleChatEvent = () => {
      fetchChats();
    };

    window.addEventListener('chat-created', handleChatEvent);
    window.addEventListener('chat-updated', handleChatEvent);

    if (socket) {
      socket.on('chat_updated', handleChatEvent);
      socket.on('chat_created', handleChatEvent);
    }

    return () => {
      window.removeEventListener('chat-created', handleChatEvent);
      window.removeEventListener('chat-updated', handleChatEvent);
      if (socket) {
        socket.off('chat_updated', handleChatEvent);
        socket.off('chat_created', handleChatEvent);
      }
    };
  }, [socket, fetchChats]);

  // Auto-close on location change if user selected a chat
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Swipe-to-Dismiss
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      triggerHaptic('light');
      setIsOpen(false);
    }
  };

  const handleStartNewChat = () => {
    triggerHaptic('medium');
    window.dispatchEvent(new Event('clear-chat'));
    navigate('/chat');
    setIsOpen(false);
  };

  const handleSelectChat = (id: string) => {
    triggerHaptic('selection');
    navigate(`/chat/${id}`);
    setIsOpen(false);
  };

  const handleRenameChat = async (id: string) => {
    if (!editingTitle.trim() || !token) return;
    const trimmed = editingTitle.trim();
    try {
      setRecentChats(prev => prev.map(c => c.id?.toString() === id.toString() ? { ...c, title: trimmed } : c));
      setEditingChatId(null);
      setEditingTitle('');

      const res = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: trimmed })
      });
      if (res.ok) {
        toast.success(isRtl ? 'تم تحديث اسم المحادثة' : 'Conversation renamed');
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (err) {
      toast.error(isRtl ? 'فشل التعديل' : 'Failed to rename');
      fetchChats();
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!token) return;
    setIsDeleting(true);
    try {
      setRecentChats(prev => prev.filter(c => c.id?.toString() !== id.toString()));
      setDeletingChatId(null);

      const res = await fetch(`/api/chats/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        toast.success(isRtl ? 'تم حذف المحادثة' : 'Session deleted');
        window.dispatchEvent(new CustomEvent('chat-updated'));
        if (activeChatId?.toString() === id.toString()) {
          window.dispatchEvent(new Event('clear-chat'));
          navigate('/chat');
        }
      }
    } catch (err) {
      toast.error(isRtl ? 'فشل الحذف' : 'Failed to delete');
      fetchChats();
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Group chats
  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return recentChats;
    const term = searchTerm.toLowerCase();
    return recentChats.filter(chat => 
      (chat.title && chat.title.toLowerCase().includes(term)) ||
      (chat.context_summary && chat.context_summary.toLowerCase().includes(term))
    );
  }, [recentChats, searchTerm]);

  const groupedChats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    const today: typeof filteredChats = [];
    const last7Days: typeof filteredChats = [];
    const older: typeof filteredChats = [];

    filteredChats.forEach(chat => {
      const time = chat.created_at ? new Date(chat.created_at).getTime() : chat.updated_at ? new Date(chat.updated_at).getTime() : 0;
      if (time >= todayStart || time === 0) {
        today.push(chat);
      } else if (time >= sevenDaysAgo) {
        last7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return [
      { id: 'today', label: isRtl ? 'اليوم' : 'Today', chats: today },
      { id: 'last7Days', label: isRtl ? 'آخر 7 أيام' : 'Last 7 Days', chats: last7Days },
      { id: 'older', label: isRtl ? 'أقدم' : 'Older', chats: older },
    ].filter(group => group.chats.length > 0);
  }, [filteredChats, isRtl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[220] flex flex-col justify-end select-none">
          {/* Backdrop */}
          <motion.div
            key="mobile-chat-history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              triggerHaptic('light');
              setIsOpen(false);
            }}
            className="fixed inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm touch-none"
          />

          {/* Bottom Sheet Drawer Panel */}
          <motion.div
            key="mobile-chat-history-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-h-[85vh] h-[80vh] bg-[var(--surface-page)] text-[var(--text-primary)] border-t border-[var(--border-default)] rounded-t-3xl flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Sheet Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing bg-[var(--surface-card)]">
              <div className="w-12 h-1.5 rounded-full bg-[var(--border-default)]" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-card)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)] flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] font-sans leading-none">
                    {isRtl ? 'سجل المحادثات' : 'Chat History'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {recentChats.length} {isRtl ? 'جلسة محادثة سابقة' : 'previous sessions'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartNewChat}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Plus size={14} />
                  <span>{isRtl ? 'محادثة جديدة' : 'New Chat'}</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--border-default)] bg-[var(--surface-page)] shrink-0">
              <div className="relative flex items-center">
                <Search size={15} className={`absolute ${isRtl ? 'right-3' : 'left-3'} text-[var(--text-muted)]`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isRtl ? 'البحث في سجل المحادثات...' : 'Search chat history...'}
                  className={`w-full h-10 ${isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'} bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--border-accent)] rounded-xl text-xs text-[var(--text-primary)] outline-none transition-colors`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} text-[var(--text-muted)] hover:text-[var(--text-primary)]`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Content List */}
            <div className={`p-3 space-y-4 ${SCROLL_STYLES.drawer}`}>
              {isLoading && recentChats.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                  <Loader2 size={24} className="animate-spin text-[var(--fg-accent)]" />
                  <span className="text-xs">{isRtl ? 'جاري تحميل السجل...' : 'Loading history...'}</span>
                </div>
              ) : groupedChats.length > 0 ? (
                groupedChats.map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                      {group.label}
                    </div>

                    <div className="space-y-1">
                      {group.chats.map((chat) => {
                        const isActive = activeChatId?.toString() === chat.id?.toString();
                        const isEditing = editingChatId === chat.id;

                        return (
                          <div
                            key={`mobile-history-chat-${chat.id}`}
                            className={`p-2.5 rounded-shape-md border transition-all duration-fast flex items-center gap-2.5 ${
                              isActive
                                ? 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/40 text-[var(--text-primary)]'
                                : 'bg-transparent border-transparent hover:bg-[var(--surface-subtle)]/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-shape-sm flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)]' : 'bg-[var(--surface-subtle)]/40 text-[var(--text-muted)]'
                            }`}>
                              <MessageSquare size={15} />
                            </div>

                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-1 min-w-0">
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="flex-1 h-8 px-2 bg-[var(--surface-inset)] border border-[var(--border-accent)] rounded-lg text-xs text-[var(--text-primary)] outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameChat(chat.id);
                                    if (e.key === 'Escape') setEditingChatId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleRenameChat(chat.id)}
                                  className="w-7 h-7 rounded-lg bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] flex items-center justify-center shrink-0"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingChatId(null)}
                                  className="w-7 h-7 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center shrink-0"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleSelectChat(chat.id)}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                                  {chat.title || (isRtl ? 'محادثة بدون عنوان' : 'Untitled Chat')}
                                </div>
                                {chat.context_summary && (
                                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 flex items-center gap-1">
                                    <BrainCircuit size={10} className="text-[var(--fg-accent)] shrink-0" />
                                    <span>{chat.context_summary}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isEditing && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingChatId(chat.id);
                                    setEditingTitle(chat.title || '');
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center"
                                  title={isRtl ? 'إعادة تسمية' : 'Rename'}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => setDeletingChatId(chat.id)}
                                  className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center"
                                  title={isRtl ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)]">
                  <History size={36} className="opacity-30" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {searchTerm ? (isRtl ? 'لا توجد نتائج بحث' : 'No search results') : (isRtl ? 'لا يوجد سجل محادثات بعد' : 'No conversation history yet')}
                  </p>
                  <p className="text-[10px]">
                    {searchTerm ? (isRtl ? 'جرّب البحث بكلمات أخرى' : 'Try searching with different keywords') : (isRtl ? 'ابدأ محادثة جديدة للبدء في طرح الأسئلة' : 'Start a new chat to begin prompting')}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleStartNewChat}
                      className="mt-2 h-9 px-4 rounded-xl bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] font-bold text-xs flex items-center gap-2 shadow-xs"
                    >
                      <Plus size={16} />
                      <span>{isRtl ? 'بدء محادثة جديدة' : 'Start New Chat'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal Overlay */}
            <AnimatePresence>
              {deletingChatId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-[var(--surface-overlay)] backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-xs bg-[var(--surface-card)] border border-[var(--border-default)] rounded-2xl p-4 shadow-2xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">
                        {isRtl ? 'حذف جلسة المحادثة؟' : 'Delete conversation?'}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {isRtl ? 'سيتم مسح كود المحادثة وسجل الردود نهائياً.' : 'This will remove all messages from this session.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setDeletingChatId(null)}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleDeleteChat(deletingChatId)}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 flex items-center justify-center gap-1 shadow-xs"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : (isRtl ? 'تأكيد الحذف' : 'Confirm Delete')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
