import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FADE, perplextaPageTransition, themeConfig, toast } from '@/design-system';
import { 
  ArrowDown,
  Trash2,
  Zap,
  ImageIcon,
  Video,
  Music,
  Code,
  Brain,
  Sparkles,
  Search,
  BookOpen,
  Megaphone,
  ArrowUpRight,
  Globe,
  FolderPlus
} from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import { ChatCanvasLayout } from '../components/chat/layouts/ChatCanvasLayout';
import { useChatMessaging } from '../components/chat/hooks/useChatMessaging';
import { useChatExport } from '../components/chat/hooks/useChatExport';
import { useCanvasLayout } from '../components/chat/hooks/useCanvasLayout';

import { ChatComposer } from '../components/chat/ChatComposer';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { renderChildrenWithCitations } from '../components/chat/renderers/CitationsList';
import { ChatLoadingState } from '../components/chat/states/ChatStates';
import { PinnedMessagesModal } from '../components/chat/modals/PinnedMessagesModal';
import { ForensicAuditModal } from '../components/chat/modals/ForensicAuditModal';
import { VisitorShell } from '../components/VisitorShell';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { ChatService } from '../services/chatService';
import { triggerHaptic } from '../utils/haptics';

const ChatPage: React.FC = () => {
  const { id: routeId, chatId: routeParamChatId } = useParams<{ id?: string; chatId?: string }>();
  const activeRouteChatId = routeId || routeParamChatId;
  const navigate = useNavigate();
  const { 
    user, 
    token, 
    dir, 
    t, 
    theme, 
    socket,
    setIsAuthModalOpen,
    isMobile
  } = useAppContext();
  const { chatContainerRef, contentPaddingClass, contentMaxWidthClass } = useCanvasLayout();

  // Local UI States
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [forensicMode, setForensicMode] = useState(false);
  const [forensicReport, setForensicReport] = useState<any>(null);
  const [isForensicModalOpen, setIsForensicModalOpen] = useState(false);
  const [isAnalyzingForensic, setIsAnalyzingForensic] = useState(false);
  
  const [selectedTool, setSelectedTool] = useState(() => {
    if (!activeRouteChatId) return 'chat_fast';
    return localStorage.getItem('perplexta_selected_tool') || 'chat_fast';
  });
  const [selectedModel, setSelectedModel] = useState<'fast' | 'thinking' | 'pro'>(() => {
    if (!activeRouteChatId) return 'fast';
    const saved = localStorage.getItem('perplexta_selected_model');
    return (saved === 'fast' || saved === 'thinking' || saved === 'pro') ? saved : 'fast';
  });
  const [activeDropdown, setActiveDropdown] = useState<'tool' | 'model'>('model');

  // Enforce chat_fast as default tool upon entering without active route
  useEffect(() => {
    if (!activeRouteChatId) {
      setSelectedTool('chat_fast');
      setSelectedModel('fast');
      setActiveDropdown('model');
      localStorage.setItem('perplexta_selected_tool', 'chat_fast');
      localStorage.setItem('perplexta_selected_model', 'fast');
    }
  }, [activeRouteChatId]);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [chatRenameTitle, setChatRenameTitle] = useState('');
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isAspectBarCollapsed, setIsAspectBarCollapsed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAdvancedToolsOpen, setIsAdvancedToolsOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState<'answer' | 'links' | 'images'>(() => {
    const saved = sessionStorage.getItem('perplexta_active_chat_tab');
    return (saved === 'answer' || saved === 'links' || saved === 'images') ? saved : 'answer';
  });

  useEffect(() => {
    localStorage.setItem('perplexta_selected_tool', selectedTool);
  }, [selectedTool]);

  useEffect(() => {
    localStorage.setItem('perplexta_selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    sessionStorage.setItem('perplexta_active_chat_tab', activeChatTab);
  }, [activeChatTab]);

  const [videoSettings, setVideoSettings] = useState({ duration: '5s', ratio: '16:9', style: 'cinematic', aspectRatio: '1:1' });
  const [imageSettings, setImageSettings] = useState({ ratio: '1:1', style: 'realistic', quality: 'hd', aspectRatio: '1:1' });
  const [audioSettings, setAudioSettings] = useState({ duration: 30, mood: 'epic', genre: 'cyberpunk' });

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const modelsMenuRef = useRef<HTMLDivElement>(null);

  const advancedTools = useMemo(() => {
    const list = [
      { id: 'perplexta_analysis', label: dir === 'rtl' ? 'تحليل' : 'Analysis', icon: <Search size={14} />, isNew: true },
      { id: 'sovereign_search', label: dir === 'rtl' ? 'البحوث والدراسات' : 'Research & Studies', icon: <BookOpen size={14} />, isNew: true },
      { id: 'image', label: dir === 'rtl' ? 'صورة' : 'Image', icon: <ImageIcon size={14} />, isNew: true },
      { id: 'video', label: dir === 'rtl' ? 'فيديو' : 'Video', icon: <Video size={14} />, isNew: true },
      { id: 'code', label: dir === 'rtl' ? 'استوديو الكود' : 'Code Studio', icon: <Code size={14} />, isNew: true, isRouter: true },
      { id: 'ads_copilot', label: dir === 'rtl' ? 'مساعد الإعلانات' : 'Ads Copilot', icon: <Megaphone size={14} />, isNew: true },
      { id: 'audio_studio', label: dir === 'rtl' ? 'استوديو الصوت' : 'Audio Studio', icon: <Music size={14} />, isRouter: true },
    ];
    if (isMobile) {
      return list.filter(t => t.id !== 'code' && t.id !== 'audio_studio');
    }
    return list;
  }, [dir, isMobile]);

  const models = [
    { id: 'fast', label: dir === 'rtl' ? 'سريع' : 'Fast', icon: <Zap size={14} />, color: 'text-[var(--fg-accent)]' },
    { id: 'thinking', label: dir === 'rtl' ? 'تفكير' : 'Thinking', icon: <Brain size={14} />, color: 'text-[var(--fg-accent)]' },
    { id: 'pro', label: dir === 'rtl' ? 'احترافي' : 'Professional', icon: <Sparkles size={14} />, color: 'text-[var(--fg-accent)]' },
  ];

  const currentTool = advancedTools.find(t => t.id === selectedTool) || advancedTools[0];
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  const currentHeaderTag = useMemo(() => {
    if (selectedTool === 'chat_fast') return dir === 'rtl' ? 'سريع' : 'Search';
    if (selectedTool === 'chat_pro') return dir === 'rtl' ? 'احترافي' : 'Pro';
    if (selectedTool === 'chat_reasoning') return dir === 'rtl' ? 'تفكير' : 'Thinking';
    const found = advancedTools.find(t => t.id === selectedTool);
    return found?.label || (dir === 'rtl' ? 'سريع' : 'Search');
  }, [selectedTool, advancedTools, dir]);

  const {
    messages,
    setMessages,
    isGenerating,
    chatId,
    isChatMessagesLoading,
    handleSendOrStop,
    isOtherTyping,
    typingParty,
    typingName,
    imageProgress,
    ledgerNotice,
    typedNotice,
    setTypedNotice
  } = useChatMessaging(
    activeRouteChatId,
    socket,
    token,
    dir,
    user,
    selectedTool,
    selectedModel,
    videoSettings,
    imageSettings,
    audioSettings,
    forensicMode,
    setForensicMode,
    setQuery,
    setSelectedFile,
    setPreviewUrl,
    setForensicReport,
    setIsAuthModalOpen,
    true, 
    activeDropdown
  );

  // Listen for prompt injections from Canvas and code artifacts
  useEffect(() => {
    const handleInsertToPrompt = (e: any) => {
      const text = e.detail;
      if (typeof text === 'string') {
        setQuery(prev => prev ? `${prev}\n\n${text}` : text);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 50);
      }
    };
    
    const handleInjectImageToChat = (e: any) => {
      const { file, prompt } = e.detail;
      if (file) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedTool('perplexta_analysis'); // Switch back to analysis mode so we analyze the uploaded image instead of starting a new image generation
        
        if (prompt) {
          setQuery('');
          // Send it to the active chat session directly
          handleSendOrStop(prompt, file, url, 'perplexta_analysis');
        }
      }
    };

    window.addEventListener('insert_to_prompt', handleInsertToPrompt as EventListener);
    window.addEventListener('inject_image_to_chat', handleInjectImageToChat as EventListener);
    return () => {
      window.removeEventListener('insert_to_prompt', handleInsertToPrompt as EventListener);
      window.removeEventListener('inject_image_to_chat', handleInjectImageToChat as EventListener);
    };
  }, [handleSendOrStop, setSelectedTool]);

  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [showMobileDisclaimer, setShowMobileDisclaimer] = useState(true);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setShowMobileDisclaimer(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowMobileDisclaimer(true);
    }
  }, [messages.length]);

  const handleCopyPrompt = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPromptIndex(index);
      toast.success(dir === 'rtl' ? 'تم نسخ الرسالة!' : 'Message copied!');
      setTimeout(() => setCopiedPromptIndex(null), 2000);
    }).catch(() => {
      toast.error(dir === 'rtl' ? 'فشل نسخ الرسالة' : 'Failed to copy message');
    });
  }, [dir]);

  const handleEditSubmit = useCallback(async (idx: number) => {
    if (!editValue.trim()) return;
    setMessages(prev => prev.slice(0, idx));
    setEditingMessageIndex(null);
    await handleSendOrStop(editValue, null, null);
  }, [editValue, setMessages, handleSendOrStop]);

  const allCitations = useMemo(() => {
    const list: any[] = [];
    const seenUrls = new Set<string>();
    messages.forEach(m => {
      if (m.citations && Array.isArray(m.citations)) {
        m.citations.forEach(c => {
          const u = c.url || c.link || '';
          if (u && !seenUrls.has(u)) {
            seenUrls.add(u);
            list.push(c);
          }
        });
      }
    });
    return list;
  }, [messages]);

  const allImages = useMemo(() => {
    const list: any[] = [];
    messages.forEach(m => {
      if (m.file && m.file.type.startsWith('image/')) {
        list.push({ url: m.file.preview, name: m.file.name, role: m.role });
      }
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      while ((match = imgRegex.exec(m.content)) !== null) {
        if (match[2] && !match[2].startsWith('data:image/svg')) {
          list.push({ url: match[2], name: match[1] || 'Image', role: m.role });
        }
      }
    });
    return list;
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleSelectAspectRatio = (ratio: string) => {
    if (selectedTool === 'video') {
      setVideoSettings(prev => ({ ...prev, aspectRatio: ratio }));
    } else {
      setImageSettings(prev => ({ ...prev, aspectRatio: ratio }));
    }
  };

  const composerProps = {
    query,
    setQuery,
    isGenerating,
    handleSendOrStop: (overrideQuery?: string) => handleSendOrStop(overrideQuery || query, selectedFile, previewUrl),
    isInputDisabled: false,
    dir,
    t,
    selectedTool,
    setSelectedTool,
    selectedModel,
    setSelectedModel,
    activeDropdown,
    setActiveDropdown,
    isRecording,
    toggleRecording: () => setIsRecording(!isRecording),
    interimText,
    setInterimText,
    selectedFile,
    setSelectedFile,
    previewUrl,
    setPreviewUrl,
    forensicMode,
    setForensicMode,
    triggerForensicDiagnostic: () => setIsForensicModalOpen(true),
    ledgerNotice,
    typedNotice,
    isAspectBarCollapsed,
    setIsAspectBarCollapsed,
    videoSettings,
    setVideoSettings,
    imageSettings,
    setImageSettings,
    handleSelectAspectRatio,
    handleFileChange,
    textareaRef,
    setIsFocused,
    startWriting: () => {},
    resetWriting: () => {},
    handleUserTyping: () => {},
    isAdvancedToolsOpen,
    setIsAdvancedToolsOpen,
    isModelMenuOpen,
    setIsModelMenuOpen,
    advancedTools,
    models,
    currentTool,
    currentModel,
    currentPlan: (user as any)?.plan,
    balance: (user as any)?.balance || 0,
    balanceUSD: (user as any)?.balance_usd || 0,
    navigate,
    toolsMenuRef,
    modelsMenuRef,
    getFileIcon: (type: string) => <FolderPlus size={18} />, // Simplified for now
    setForensicReport,
    messages,
  };

  // Export Hook
  const { handleExport, isExporting } = useChatExport(messages, dir, theme);

  const handleDeleteChat = useCallback(() => {
    if (!chatId || !token) return;
    setIsDeletingConfirmOpen(true);
  }, [chatId, token]);

  const confirmDeleteChat = async () => {
    if (!chatId || !token) return;
    try {
      await ChatService.deleteChat(token, chatId);
      toast.success(dir === 'rtl' ? 'تم الحذف بنجاح' : 'Deleted successfully');
      window.dispatchEvent(new Event('clear-chat'));
      window.dispatchEvent(new CustomEvent('chat-updated'));
      setIsDeletingConfirmOpen(false);
      navigate('/chat');
    } catch (error) {
      toast.error(dir === 'rtl' ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const handleThreadRename = async () => {
    if (!chatId || !token || !chatRenameTitle.trim()) return;
    try {
      await ChatService.renameChat(token, chatId, chatRenameTitle);
      toast.success(dir === 'rtl' ? 'تم تحديث الاسم' : 'Title updated');
      setIsRenaming(false);
    } catch (error) {
      toast.error(dir === 'rtl' ? 'فشل التحديث' : 'Update failed');
    }
  };

  const activeTurnTopRef = useRef<number | null>(null);

  // Scroll Management - Smooth, zero-jitter downward descent bounded by top header limit
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    isUserScrolledUpRef.current = false;
    if (scrollViewportRef.current) {
      const container = scrollViewportRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
      setShowScrollBottom(false);
    }
  };

  // Align view smoothly to center the active prompt and start of response when generation begins across ALL tools without exception
  useEffect(() => {
    if (messages.length > 0 && isGenerating) {
      isUserScrolledUpRef.current = false;
      const lastIdx = messages.length - 1;

      const timer = setTimeout(() => {
        const promptEl = document.getElementById(`message-${lastIdx - 1}`);
        const activeMsgEl = document.getElementById(`message-${lastIdx}`);
        const targetEl = promptEl || activeMsgEl;

        if (targetEl) {
          // Center prompt & response start in viewport across ALL tools without exception
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 30);

      return () => clearTimeout(timer);
    }
  }, [messages.length, isGenerating]);

  // Keep view aligned calmly and progressively downward during typewriter streaming without jitter or skipping the header
  useEffect(() => {
    if (!scrollViewportRef.current) return;
    const contentEl = scrollViewportRef.current.firstElementChild;
    if (!contentEl) return;

    let rafId: number | null = null;

    const smoothScrollStep = () => {
      if (!scrollViewportRef.current || isUserScrolledUpRef.current || !isGenerating) {
        return;
      }
      const container = scrollViewportRef.current;
      const desiredScrollTop = container.scrollHeight - container.clientHeight;
      const currentScrollTop = container.scrollTop;
      const distance = desiredScrollTop - currentScrollTop;

      if (distance > 0.5) {
        // Serene, momentum-preserving smooth descent without abrupt jumps, strictly respecting the top header limit
        const step = Math.min(distance, Math.max(1.2, distance * 0.18));
        container.scrollTop = currentScrollTop + step;

        if (distance > 2) {
          rafId = requestAnimationFrame(smoothScrollStep);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      if (isGenerating && !isUserScrolledUpRef.current) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(smoothScrollStep);
      }
    });

    observer.observe(contentEl);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isGenerating]);

  // Dispatch Header State Sync for Main Header Buttons
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('chat-header-state', {
        detail: {
          hasMessages: messages.length > 0,
          activeChatTab,
          citationsCount: allCitations.length,
          imagesCount: allImages.length,
          pinnedCount: messages.filter((m) => m.is_pinned).length,
          isGenerating
        }
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent('chat-header-state', {
          detail: { hasMessages: false, activeChatTab: 'answer', citationsCount: 0, imagesCount: 0, pinnedCount: 0, isGenerating: false }
        })
      );
    };
  }, [messages, activeChatTab, allCitations.length, allImages.length, isGenerating]);

  // Listen to Main Header Actions
  useEffect(() => {
    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveChatTab(customEvent.detail);
      }
    };
    const handleActionPinned = () => setShowPinnedModal(true);
    const handleActionExport = () => handleExport('md');
    const handleActionRename = () => {
      setChatRenameTitle('');
      setIsRenaming(true);
    };
    const handleActionDelete = () => handleDeleteChat();

    window.addEventListener('chat-set-tab', handleSetTab);
    window.addEventListener('chat-action-pinned', handleActionPinned);
    window.addEventListener('chat-action-export', handleActionExport);
    window.addEventListener('chat-action-rename', handleActionRename);
    window.addEventListener('chat-action-delete', handleActionDelete);

    return () => {
      window.removeEventListener('chat-set-tab', handleSetTab);
      window.removeEventListener('chat-action-pinned', handleActionPinned);
      window.removeEventListener('chat-action-export', handleActionExport);
      window.removeEventListener('chat-action-rename', handleActionRename);
      window.removeEventListener('chat-action-delete', handleActionDelete);
    };
  }, [handleExport, handleDeleteChat]);

  const checkScrollPosition = useCallback(() => {
    const el = scrollViewportRef.current;
    if (!el) {
      setShowScrollBottom(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // Show button when user has scrolled up past 45px from bottom
    const isScrolledUp = distanceFromBottom > 45;
    setShowScrollBottom(isScrolledUp);

    if (distanceFromBottom > 100) {
      isUserScrolledUpRef.current = true;
    } else if (distanceFromBottom < 25) {
      isUserScrolledUpRef.current = false;
    }
  }, []);

  const handleScroll = () => {
    checkScrollPosition();
  };

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;

    checkScrollPosition();

    const onScroll = () => {
      checkScrollPosition();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [checkScrollPosition, messages.length]);

  useEffect(() => {
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [messages, checkScrollPosition]);

  // Click Outside Export Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active draft storage key computed dynamically per chat ID or new session
  const activeDraftKey = useMemo(() => {
    return activeRouteChatId ? `perplexta_chat_draft_${activeRouteChatId}` : 'perplexta_chat_draft_new';
  }, [activeRouteChatId]);

  // Session & Local Storage protection protocol: draft query background auto-save & recovery
  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem(activeDraftKey);
      const savedSession = sessionStorage.getItem(activeDraftKey) || sessionStorage.getItem('perplexta_chat_draft');
      const draftToRestore = savedLocal || savedSession;
      if (draftToRestore) {
        setQuery(draftToRestore);
      } else {
        setQuery('');
      }
    } catch {
      // Ignore quota or storage restriction errors
    }
  }, [activeRouteChatId, activeDraftKey]);

  // Background Auto-Save on draft input change
  useEffect(() => {
    if (query && query.trim()) {
      try {
        localStorage.setItem(activeDraftKey, query);
        sessionStorage.setItem(activeDraftKey, query);
        sessionStorage.setItem('perplexta_chat_draft', query);
      } catch {
        // Ignore storage errors
      }
    } else {
      try {
        localStorage.removeItem(activeDraftKey);
        sessionStorage.removeItem(activeDraftKey);
        sessionStorage.removeItem('perplexta_chat_draft');
      } catch {
        // Ignore storage errors
      }
    }
  }, [query, activeDraftKey]);

  // Session protection protocol: prevent accidental exit / loss during active generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGenerating]);

  // Listen to clear-chat event to reset state and clear thread
  useEffect(() => {
    const handleClearChat = () => {
      try {
        localStorage.removeItem(activeDraftKey);
        localStorage.removeItem('perplexta_chat_draft_new');
        sessionStorage.removeItem('perplexta_active_chat_id');
        sessionStorage.removeItem('perplexta_chat_draft');
      } catch {
        // Ignore storage errors
      }
      setMessages([]);
      setQuery('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setForensicReport(null);
      setForensicMode(false);
      window.dispatchEvent(new CustomEvent('chat-pinned-count', { detail: 0 }));
      window.dispatchEvent(new CustomEvent('chat-updated'));
      navigate('/chat');
    };
    window.addEventListener('clear-chat', handleClearChat);
    return () => window.removeEventListener('clear-chat', handleClearChat);
  }, [navigate, setMessages, setQuery, setSelectedFile, setPreviewUrl, setForensicReport, setForensicMode, activeDraftKey]);

  // Dispatch pinned messages count to Header
  useEffect(() => {
    const count = messages.filter(m => m.is_pinned).length;
    window.dispatchEvent(new CustomEvent('chat-pinned-count', { detail: count }));
  }, [messages]);

  // Listen for header events (pinned modal, rename, delete, export)
  useEffect(() => {
    const handleOpenPinned = () => setShowPinnedModal(true);
    const handleOpenRename = () => { setIsRenaming(true); setChatRenameTitle(''); };
    const handleDelete = () => handleDeleteChat();
    const handleExportEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent?.detail) {
        handleExport(customEvent.detail as 'pdf' | 'md');
      }
    };

    window.addEventListener('open-pinned-modal', handleOpenPinned);
    window.addEventListener('open-rename-chat', handleOpenRename);
    window.addEventListener('delete-chat', handleDelete);
    window.addEventListener('export-chat', handleExportEvent);

    return () => {
      window.removeEventListener('open-pinned-modal', handleOpenPinned);
      window.removeEventListener('open-rename-chat', handleOpenRename);
      window.removeEventListener('delete-chat', handleDelete);
      window.removeEventListener('export-chat', handleExportEvent);
    };
  }, [handleDeleteChat, handleExport]);

  const handlePinMessage = async (messageId: number, isPinned: boolean) => {
    if (!chatId || !token) return;
    try {
      await ChatService.togglePin(token, chatId, messageId, isPinned);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: isPinned } : m));
      toast.success(isPinned 
        ? (dir === 'rtl' ? 'تم التثبيت' : 'Pinned') 
        : (dir === 'rtl' ? 'تم إلغاء التثبيت' : 'Unpinned')
      );
    } catch (error) {
      toast.error(dir === 'rtl' ? 'فشل الإجراء' : 'Action failed');
    }
  };

  const [playingTTSId, setPlayingTTSId] = useState<string | number | null>(null);

  const handleTTS = useCallback((content: string, id: string | number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error(dir === 'rtl' ? 'القراءة الصوتية غير مدعومة' : 'Speech synthesis not supported');
      return;
    }
    if (playingTTSId === id) {
      window.speechSynthesis.cancel();
      setPlayingTTSId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const plainText = content.replace(/[*_#`~[\]]/g, '').replace(/<[^>]+>/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = dir === 'rtl' ? 'ar-SA' : 'en-US';
    utterance.onend = () => setPlayingTTSId(null);
    utterance.onerror = () => setPlayingTTSId(null);
    setPlayingTTSId(id);
    window.speechSynthesis.speak(utterance);
  }, [playingTTSId, dir]);

  const handleDeleteMessage = useCallback((messageId: number | undefined, index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
    toast.success(dir === 'rtl' ? 'تم حذف الرسالة' : 'Message removed');
  }, [setMessages, dir]);

  const handleRegenerate = useCallback((index: number) => {
    const previousUserMsg = messages.slice(0, index).reverse().find(m => m.role === 'user');
    if (previousUserMsg && previousUserMsg.content) {
      handleSendOrStop(previousUserMsg.content, null, null);
    }
  }, [messages, handleSendOrStop]);

  const handleFeedback = useCallback(async (messageId: number, feedback: number, details?: any) => {
    try {
      // Optimistically update message in state
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
      
      if (token) {
        await ChatService.submitFeedback(token, messageId, feedback, details);
        if (feedback === 1) {
          toast.success(dir === 'rtl' ? 'تم تسجيل إشادتك وتعزيز قدرات المساعد وإشعار الإدارة بالبريد!' : 'Feedback recorded, capabilities reinforced & admin notified!');
        } else if (feedback === -1) {
          toast.info(dir === 'rtl' ? 'تم تزويد المساعد بالملاحظة ليتعلم منها وإبلاغ الإدارة.' : 'Correction sent to model memory & admin alerted.');
        }
      }
    } catch (err: any) {
      console.error('Feedback submit error:', err);
    }
  }, [dir, token, setMessages]);

  return (
    <ChatCanvasLayout>
      <ErrorBoundary name="Chat Intelligence Engine">
          <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={perplextaPageTransition}
            className="h-full flex flex-col w-full overflow-hidden"
          >
        <div ref={chatContainerRef} className="flex-1 flex flex-col w-full overflow-hidden relative">
          <AnimatePresence>
            {isRenaming && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <div className="bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-sm)] w-full max-w-sm p-6 shadow-2xl">
                  <h3 className={`text-lg font-black mb-4 uppercase tracking-tighter ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {dir === 'rtl' ? 'إعادة تسمية المحادثة' : 'Rename Conversation'}
                  </h3>
                  <input 
                    type="text" 
                    value={chatRenameTitle} 
                    onChange={(e) => setChatRenameTitle(e.target.value)}
                    className="w-full bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-sm px-4 py-3 outline-none focus:border-accent/50 transition-theme font-bold text-sm mb-6 text-[var(--text-primary)]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleThreadRename()}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setIsRenaming(false)} className="flex-1 py-1.5 rounded-sm text-xs font-bold uppercase text-[var(--text-secondary)] bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] transition-theme">{dir === 'rtl' ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleThreadRename} className="flex-1 py-1.5 rounded-sm text-xs font-bold uppercase bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-theme">{dir === 'rtl' ? 'حفظ' : 'Save'}</button>
                  </div>
                </div>
              </motion.div>
            )}

            {isDeletingConfirmOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsDeletingConfirmOpen(false)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] w-full max-w-sm p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/20 flex items-center justify-center text-[var(--fg-danger)] shrink-0">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {dir === 'rtl' ? 'حذف المحادثة' : 'Delete Conversation'}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {dir === 'rtl' ? 'هل أنت متأكد من رغبتك في حذف هذه المحادثة نهائياً؟' : 'Are you sure you want to permanently delete this conversation?'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeletingConfirmOpen(false)}
                      className="flex-1 py-2 rounded-[var(--radius-md)] text-xs font-bold text-[var(--text-secondary)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] transition-theme cursor-pointer"
                    >
                      {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteChat}
                      className="flex-1 py-2 rounded-[var(--radius-md)] text-xs font-bold text-[var(--ref-neutral-0)] bg-[var(--status-danger)] hover:opacity-90 shadow-sm transition-theme cursor-pointer"
                    >
                      {dir === 'rtl' ? 'تأكيد الحذف' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(!user || !token) ? (
              <motion.div
                key="visitor-state"
                variants={FADE}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden relative"
              >
                <VisitorShell>
                  <div className="w-full flex-1 flex flex-col justify-center items-center py-2 sm:py-6">
                    <div className={`${contentMaxWidthClass} ${contentPaddingClass} mb-2 sm:mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'} select-none`}>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold sm:font-black text-[var(--text-primary)] tracking-tight font-sans leading-snug">
                        <span className="sm:hidden">{dir === 'rtl' ? 'ما الذي تريد معرفته اليوم؟' : 'What to explore today?'}</span>
                        <span className="hidden sm:inline">{dir === 'rtl' ? 'ما الذي ترغب في معرفته أو تحليله اليوم؟' : 'What do you want to know?'}</span>
                      </h1>
                    </div>

                    <div className={`${contentMaxWidthClass} ${contentPaddingClass} py-2.5`}>
                      <ChatComposer {...composerProps} />
                    </div>
                  </div>
                </VisitorShell>
              </motion.div>
            ) : messages.length === 0 && !isChatMessagesLoading ? (
              <motion.div
                key="logged-in-home-state"
                variants={FADE}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden relative"
              >
                {/* Logged-In Home State: Cohesive Minimalist Layout matching Visitor Shell */}
                <div className={themeConfig.visitor.shell}>
                  <div className={themeConfig.visitor.content}>
                    <div className="w-full flex-1 flex flex-col justify-center items-center py-2 sm:py-6">
                      <div className={`${contentMaxWidthClass} ${contentPaddingClass} mb-2 sm:mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'} select-none`}>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold sm:font-black text-[var(--text-primary)] tracking-tight font-sans leading-snug">
                          <span className="sm:hidden">{dir === 'rtl' ? 'ما الذي تريد معرفته اليوم؟' : 'What to explore today?'}</span>
                          <span className="hidden sm:inline">{dir === 'rtl' ? 'ما الذي ترغب في معرفته أو تحليله اليوم؟' : 'What do you want to know?'}</span>
                        </h1>
                      </div>
                      
                      <div 
                        className={`${contentMaxWidthClass} ${contentPaddingClass} py-2.5`}
                      >
                        <ChatComposer {...composerProps} />
                      </div>
                    </div>
                  </div>

                  {/* Footer App Info */}
                  <div className="text-center pt-2.5 sm:pt-4 pb-[calc(8px+env(safe-area-inset-bottom,0px))] sm:pb-3 border-none select-none text-[11px] font-medium text-[var(--text-muted)] px-1 sm:px-2 bg-transparent leading-relaxed">
                    <span className="sm:hidden">{t('appName')} {dir === 'rtl' ? 'قد يخطئ أحياناً. تحقق من النتائج المهمة.' : 'may be inaccurate. Verify facts.'}</span>
                    <span className="hidden sm:inline">{t('appName')} {dir === 'rtl' ? 'قد يقدم معلومات غير دقيقة أحياناً. يُرجى التحقق من النتائج المهمة.' : 'may display inaccurate info. Verify important facts.'}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="active-chat-state"
                variants={FADE}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden relative"
              >
                {/* Chat Viewport */}
                <div 
                  ref={scrollViewportRef}
                  onScroll={handleScroll}
                  className="chat-scroll-viewport flex-1 min-h-0 min-w-0 overflow-y-auto"
                >
                  <div className={`${contentMaxWidthClass} ${contentPaddingClass} pt-8 sm:pt-16 pb-28 sm:pb-40 flex flex-col min-h-full`}>
                    {isChatMessagesLoading && messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <ChatLoadingState dir={dir} />
                      </div>
                    ) : activeChatTab === 'links' ? (
                      <div className="py-3 space-y-3 flex-1">
                        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-default)]">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <Globe size={16} className="text-[var(--fg-accent)]" />
                            <span>{dir === 'rtl' ? 'المصادر والروابط المستخرجة' : 'Extracted Sources & Links'}</span>
                          </h3>
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {allCitations.length} {dir === 'rtl' ? 'مصدر' : 'sources'}
                          </span>
                        </div>
                        {allCitations.length === 0 ? (
                          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                            {dir === 'rtl' ? 'لا توجد مصادر مستخرجة حتى الآن في هذه الجلسة.' : 'No sources extracted yet in this session.'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {allCitations.map((cite, cIdx) => {
                              const domain = (cite.url || cite.link || '').replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] || 'web';
                              return (
                                <a
                                  key={`all-cite-${cIdx}`}
                                  href={cite.url || cite.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--fg-accent)]/40 transition-all group flex flex-col justify-between gap-2.5 shadow-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center overflow-hidden shrink-0">
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                        alt=""
                                        className="w-3.5 h-3.5 object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                                      {domain}
                                    </span>
                                    <ArrowUpRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-colors ms-auto shrink-0" />
                                  </div>
                                  <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] line-clamp-2 transition-colors">
                                    {cite.title || cite.url || cite.link}
                                  </h4>
                                  {cite.snippet && (
                                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                      {cite.snippet}
                                    </p>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : activeChatTab === 'images' ? (
                      <div className="py-3 space-y-3 flex-1">
                        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-default)]">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <ImageIcon size={16} className="text-[var(--fg-accent)]" />
                            <span>{dir === 'rtl' ? 'معرض الصور والوسائط' : 'Media Gallery'}</span>
                          </h3>
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            {allImages.length} {dir === 'rtl' ? 'صورة' : 'images'}
                          </span>
                        </div>
                        {allImages.length === 0 ? (
                          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                            {dir === 'rtl' ? 'لا توجد صور متداولة في هذه المحادثة حتى الآن.' : 'No images in this conversation yet.'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            {allImages.map((img, iIdx) => (
                              <div
                                key={`all-img-${iIdx}`}
                                className="group relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] aspect-square flex items-center justify-center shadow-xs cursor-pointer"
                                onClick={() => window.open(img.url, '_blank')}
                              >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-media"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                  <span className="text-xs font-bold text-white truncate w-full">{img.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 sm:space-y-5 flex-1">
                        {messages.map((msg, idx) => (
                          <ChatMessageItem
                            key={msg.id || msg.client_id || idx}
                            msg={msg}
                            idx={idx}
                            dir={dir}
                            theme={theme}
                            t={t}
                            isGenerating={isGenerating && idx === messages.length - 1}
                            isLastMessage={idx === messages.length - 1}
                            user={user}
                            navigate={navigate}
                            messages={messages}
                            token={token}
                            playingTTSId={playingTTSId}
                            handleTTS={handleTTS}
                            handleFeedback={handleFeedback}
                            handlePinMessage={(messageId: number, isPinned: boolean) => msg.id && handlePinMessage(msg.id, isPinned)}
                            handleRegenerate={handleRegenerate}
                            handleSendOrStop={(query) => handleSendOrStop(query, null, null)}
                            onDeleteMessage={handleDeleteMessage}
                            editingMessageIndex={editingMessageIndex}
                            editValue={editValue}
                            setEditValue={setEditValue}
                            setEditingMessageIndex={setEditingMessageIndex}
                            handleEditSubmit={handleEditSubmit}
                            copiedPromptIndex={copiedPromptIndex}
                            handleCopyPrompt={handleCopyPrompt}
                            renderChildrenWithCitations={renderChildrenWithCitations}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sovereign Foreground Layer (طبقة أمامية عائمة حقيقية z-50): Scroll to Bottom Arrow Button */}
                <AnimatePresence>
                  {showScrollBottom && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.8 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 12, scale: 0.8 }} 
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
                    >
                      <button
                        type="button"
                        onClick={() => scrollToBottom()}
                        className="w-10 h-10 rounded-full bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:text-[var(--fg-accent)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/80 shadow-2xl transition-all duration-fast cursor-pointer flex items-center justify-center group active:scale-95 touch-target-44"
                        title={dir === 'rtl' ? 'النزول لآخر سجل المحادثة' : 'Scroll to latest message'}
                        aria-label={dir === 'rtl' ? 'النزول لآخر سجل المحادثة' : 'Scroll to latest message'}
                      >
                        <ArrowDown size={19} className="stroke-[2.5] text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors group-hover:translate-y-0.5 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="w-full bg-[var(--surface-page)] relative z-20 shrink-0 sticky bottom-0 backdrop-blur-md transition-all duration-base">
                  <div 
                    className={`${contentMaxWidthClass} ${contentPaddingClass} pt-1.5 sm:pt-2.5 ${showMobileDisclaimer ? 'pb-2 sm:pb-2.5' : 'pb-[calc(4px+env(safe-area-inset-bottom,0px))] sm:pb-2.5'}`}
                  >
                    <ChatComposer {...composerProps} />
                    
                    {/* Footer App Info - Desktop: Static and permanent without hiding. Mobile: Collapsible pattern */}
                    <div className="hidden sm:block overflow-hidden text-center text-[11px] font-medium text-[var(--text-secondary)] select-none px-2 leading-relaxed mt-1.5">
                      {t('appName')} {dir === 'rtl' ? 'قد يقدم معلومات غير دقيقة أحياناً. يُرجى التحقق من النتائج المهمة.' : 'may display inaccurate info. Verify important facts.'}
                    </div>

                    <AnimatePresence>
                      {showMobileDisclaimer && (
                        <motion.div
                          initial={{ opacity: 1, height: 'auto', marginTop: 6 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="sm:hidden overflow-hidden text-center text-[11px] font-medium text-[var(--text-secondary)] select-none px-2 leading-relaxed"
                        >
                          {t('appName')} {dir === 'rtl' ? 'قد يخطئ أحياناً. تحقق من النتائج.' : 'may make mistakes. Verify facts.'}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <PinnedMessagesModal
          isOpen={showPinnedModal}
          onClose={() => setShowPinnedModal(false)}
          messages={messages}
          dir={dir}
          onUnpin={(id) => handlePinMessage(id, false)}
        />
        <ForensicAuditModal
          isOpen={isForensicModalOpen}
          onClose={() => setIsForensicModalOpen(false)}
          isAnalyzing={isAnalyzingForensic}
          report={forensicReport}
          selectedFile={selectedFile}
          dir={dir}
        />
      </motion.div>
    </ErrorBoundary>
      </ChatCanvasLayout>
  );
};

export default ChatPage;
