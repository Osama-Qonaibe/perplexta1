import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ThumbsUp,
  ThumbsDown,
  Pin,
  PinOff,
  Volume2,
  Square,
  RefreshCw,
  Copy,
  Download,
  Zap,
  MoreHorizontal,
  Bookmark,
  Flag,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { Message } from '../types';
import { toast } from '@/design-system';
import { ArtifactContext } from '../../../context/ArtifactContext';
import { MessageFeedbackModal, FeedbackSubmissionData } from './MessageFeedbackModal';
import { ContentSafetyReportModal } from './ContentSafetyReportModal';

interface MessageActionsProps {
  msg: Message;
  idx: number;
  dir: 'ltr' | 'rtl';
  isGenerating: boolean;
  isLastMessage: boolean;
  playingTTSId: string | number | null;
  openMenuId: string | null;
  token: string | null;
  setOpenMenuId: (id: string | null) => void;
  handleFeedback: (messageId: number, feedback: number, details?: any) => void;
  handlePinMessage: (messageId: number, isPinned: boolean) => void;
  handleTTS: (content: string, id: string | number) => void;
  handleRegenerate: (index: number) => void;
  onDeleteMessage: (messageId: number | undefined, index: number) => void;
}

const ActionButtonWithTooltip = ({
  id,
  hoveredId,
  setHoveredId,
  label,
  icon,
  onClick,
  active = false,
  activeClass = '',
  disabled = false,
  className = ''
}: {
  id: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
  className?: string;
}) => (
  <div className="relative flex items-center justify-center">
    <button
      type="button"
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-colors duration-fast cursor-pointer border relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0 box-border ${
        active
          ? activeClass || 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs'
          : 'border-transparent hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      } ${className}`}
    >
      {icon}
    </button>
    <AnimatePresence>
      {hoveredId === id && (
        <motion.div
          initial={{ opacity: 0, y: 3, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 2, scale: 0.96 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-full mb-1.5 px-2 py-0.5 rounded-shape-xs bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] text-[10px] font-semibold shadow-2xs pointer-events-none z-50 whitespace-nowrap"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const MessageActions: React.FC<MessageActionsProps> = ({
  msg,
  idx,
  dir,
  isGenerating,
  isLastMessage,
  playingTTSId,
  openMenuId,
  token,
  setOpenMenuId,
  handleFeedback,
  handlePinMessage,
  handleTTS,
  handleRegenerate,
  onDeleteMessage
}) => {
  const artifactContext = useContext(ArtifactContext);
  const isArtifactOpen = Boolean(artifactContext?.isArtifactOpen);

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [feedbackModalType, setFeedbackModalType] = React.useState<'like' | 'dislike' | null>(null);
  const [isSafetyReportModalOpen, setIsSafetyReportModalOpen] = React.useState(false);
  const [localMenuOpen, setLocalMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const currentTTSId = msg.client_id || msg.id || idx;
  const isPlayingCurrentTTS = playingTTSId === currentTTSId;
  const menuIdentifier = msg.id?.toString() || idx.toString();
  const isMenuOpen = (openMenuId === menuIdentifier) || localMenuOpen;

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setLocalMenuOpen(false);
        if (setOpenMenuId) setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen, setOpenMenuId]);

  const toolbarVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <>
      <motion.div
        key={`toolbar-${idx}-${msg.id || idx}`}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={toolbarVariants}
        className={`flex items-center justify-between mt-1.5 pt-1 px-0 select-none flex-wrap gap-y-1.5 gap-x-2 ${
          isArtifactOpen ? 'w-full' : ''
        }`}
      >
        {/* Primary Interaction Buttons Row - Left side */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {/* 1. Copy */}
          <ActionButtonWithTooltip
            id={`copy-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={dir === 'rtl' ? 'نسخ الإجابة' : 'Copy'}
            icon={<Copy size={14} />}
            onClick={() => {
              navigator.clipboard.writeText(msg.content);
              toast.success(dir === 'rtl' ? 'تم النسخ بنجاح' : 'Copied successfully');
            }}
          />

          {/* 2. Regenerate */}
          <ActionButtonWithTooltip
            id={`regen-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={dir === 'rtl' ? 'إعادة التوليد' : 'Regenerate'}
            icon={<RefreshCw size={14} className={isGenerating && isLastMessage ? 'animate-spin' : ''} />}
            onClick={() => handleRegenerate(idx)}
          />

          {/* 3. Read Aloud (TTS) */}
          <ActionButtonWithTooltip
            id={`tts-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={
              isPlayingCurrentTTS
                ? (dir === 'rtl' ? 'إيقاف الصوت' : 'Stop')
                : (dir === 'rtl' ? 'قراءة صوتية' : 'Read Aloud')
            }
            icon={isPlayingCurrentTTS ? <Square size={13} fill="currentColor" /> : <Volume2 size={14} />}
            active={isPlayingCurrentTTS}
            activeClass="bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/40 text-[var(--fg-accent)]"
            onClick={() => handleTTS(msg.content, currentTTSId)}
          />

          {/* 4. Thumbs Down (Dislike) */}
          <ActionButtonWithTooltip
            id={`dislike-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={dir === 'rtl' ? 'لم يعجبني وتصحيح' : 'Dislike & Feedback'}
            icon={<ThumbsDown size={14} />}
            active={msg.feedback === -1}
            activeClass="text-rose-500 bg-rose-500/10 border-rose-500/30"
            onClick={() => {
              if (msg.feedback === -1) {
                handleFeedback(msg.id!, 0);
              } else {
                setFeedbackModalType('dislike');
              }
            }}
          />

          {/* 5. Thumbs Up (Like) */}
          <ActionButtonWithTooltip
            id={`like-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={dir === 'rtl' ? 'إعجاب وتقييم' : 'Like & Rate'}
            icon={<ThumbsUp size={14} />}
            active={msg.feedback === 1}
            activeClass="text-[var(--fg-success)] bg-[var(--status-success-subtle)] border-[var(--fg-success)]/30"
            onClick={() => {
              if (msg.feedback === 1) {
                handleFeedback(msg.id!, 0);
              } else {
                setFeedbackModalType('like');
              }
            }}
          />

          {/* 6. Direct Content Safety Report Button */}
          <ActionButtonWithTooltip
            id={`safety-${idx}`}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            label={dir === 'rtl' ? 'الإبلاغ عن سياسات الأمان والسلامة' : 'Report Content Safety Policy'}
            icon={<ShieldAlert size={14} />}
            active={isSafetyReportModalOpen}
            activeClass="text-rose-500 bg-rose-500/10 border-rose-500/30"
            onClick={() => {
              setIsSafetyReportModalOpen(true);
              setLocalMenuOpen(false);
              if (setOpenMenuId) setOpenMenuId(null);
            }}
          />

          {/* 7. More Options (...) */}
          <div className="relative">
            <ActionButtonWithTooltip
              id={`more-${idx}`}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              label={dir === 'rtl' ? 'المزيد من الخيارات والإبلاغ' : 'More Options'}
              icon={<MoreHorizontal size={14} />}
              active={isMenuOpen}
              activeClass="border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-2xs"
              onClick={() => {
                const nextState = !isMenuOpen;
                setLocalMenuOpen(nextState);
                if (setOpenMenuId) setOpenMenuId(nextState ? menuIdentifier : null);
              }}
            />

            <AnimatePresence>
              {isMenuOpen && (() => {
                const rawActions = [
                  {
                    id: 'pin',
                    label: msg.is_pinned 
                      ? (dir === 'rtl' ? 'إلغاء تثبيت الرسالة' : 'Unpin Message') 
                      : (dir === 'rtl' ? 'تثبيت الرسالة' : 'Pin Message'),
                    icon: msg.is_pinned ? PinOff : Pin,
                    iconColor: msg.is_pinned ? 'text-amber-500' : 'text-[var(--text-muted)]',
                    action: () => {
                      handlePinMessage(msg.id!, !msg.is_pinned);
                      setLocalMenuOpen(false);
                      if (setOpenMenuId) setOpenMenuId(null);
                    }
                  },
                  {
                    id: 'shortcut',
                    label: dir === 'rtl' ? 'حفظ كاختصار' : 'Save as shortcut',
                    icon: Bookmark,
                    iconColor: 'text-[var(--text-muted)]',
                    action: async () => {
                      try {
                        await fetch('/api/shortcuts', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            title: msg.content.slice(0, 30) + '...',
                            query: msg.content
                          })
                        });
                        toast.success(dir === 'rtl' ? 'تم حفظ التساؤل كاختصار' : 'Saved as shortcut');
                      } catch (e) {
                        // Handled silently
                      }
                      setLocalMenuOpen(false);
                      if (setOpenMenuId) setOpenMenuId(null);
                    }
                  },
                  {
                    id: 'download',
                    label: dir === 'rtl' ? 'تحميل كملف Markdown' : 'Download Markdown',
                    icon: Download,
                    iconColor: 'text-[var(--text-muted)]',
                    action: async () => {
                      const blob = new Blob([msg.content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Perplexta_Response_${Date.now()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setLocalMenuOpen(false);
                      if (setOpenMenuId) setOpenMenuId(null);
                    }
                  }
                ];

                const sortedActions = [...rawActions].sort((a, b) => {
                  const lenA = a.label.trim().length;
                  const lenB = b.label.trim().length;
                  return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
                });

                return (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: dir === 'rtl' ? 'bottom left' : 'bottom right' }}
                    className={`absolute bottom-full mb-2 w-max min-w-[190px] p-1.5 font-sans bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-2xl z-50 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-0.5 ${
                      dir === 'rtl' ? 'left-0' : 'right-0'
                    }`}
                    dir={dir}
                  >
                    {/* Safety Report Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSafetyReportModalOpen(true);
                        setLocalMenuOpen(false);
                        if (setOpenMenuId) setOpenMenuId(null);
                      }}
                      className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-xs)] border border-transparent bg-transparent hover:bg-rose-500/10 text-rose-500 transition-all duration-fast cursor-pointer select-none text-start text-xs"
                    >
                      <ShieldAlert size={14} className="text-rose-500 group-hover:text-rose-400 shrink-0 transition-colors duration-fast" />
                      <span className="truncate min-w-0 flex-1 text-xs font-semibold text-rose-500 group-hover:text-rose-400 transition-colors duration-fast">
                        {dir === 'rtl' ? 'الإبلاغ عن المحتوى' : 'Report Content Safety'}
                      </span>
                    </button>

                    <div className="my-0.5 h-px bg-[var(--border-default)]" />

                    {/* Hierarchically Sorted Actions */}
                    {sortedActions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.action}
                          className="group w-full h-[36px] min-h-[36px] flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-xs)] border border-transparent bg-transparent hover:bg-[var(--surface-subtle)] transition-all duration-fast cursor-pointer select-none text-start text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Icon size={14} className={`${item.iconColor} group-hover:text-[var(--fg-accent)] shrink-0 transition-colors duration-fast`} />
                          <span className="truncate min-w-0 flex-1 text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-fast">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}

                    <div className="my-0.5 h-px bg-[var(--border-default)]" />

                    {/* Delete Response */}
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMessage(msg.id, idx);
                        setLocalMenuOpen(false);
                        if (setOpenMenuId) setOpenMenuId(null);
                      }}
                      className="group w-full h-[34px] min-h-[34px] flex items-center gap-2 px-2.5 rounded-shape-sm border border-transparent bg-transparent hover:bg-rose-500/10 text-rose-500 transition-colors duration-fast cursor-pointer select-none text-start"
                    >
                      <Trash2 size={14} className="text-rose-500 group-hover:text-rose-400 shrink-0 transition-colors duration-fast" />
                      <span className="truncate min-w-0 flex-1 text-xs font-bold text-rose-500 group-hover:text-rose-400 transition-colors duration-fast">
                        {dir === 'rtl' ? 'حذف الرد' : 'Delete Response'}
                      </span>
                    </button>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* Secondary Meta Information (Generation Time) - Right side */}
        <div className="flex items-center gap-2">
          {/* Execution Time */}
          {msg.generation_time !== undefined && (
            <div className="flex items-center gap-1 px-1 h-7 text-[var(--text-muted)] text-[11px] font-mono select-none shrink-0 border-0 bg-transparent">
              <Zap size={11} className="text-accent opacity-80" />
              <span>{Number(msg.generation_time).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </motion.div>

    {feedbackModalType && (
      <MessageFeedbackModal
        isOpen={!!feedbackModalType}
        onClose={() => setFeedbackModalType(null)}
        type={feedbackModalType}
        messageId={msg.id || idx}
        assistantResponse={msg.content}
        dir={dir}
        onSubmit={async (data) => {
          await handleFeedback(msg.id || idx, data.feedback, data);
        }}
      />
    )}

    {isSafetyReportModalOpen && (
      <ContentSafetyReportModal
        isOpen={isSafetyReportModalOpen}
        onClose={() => setIsSafetyReportModalOpen(false)}
        messageId={msg.id || idx}
        assistantResponse={msg.content}
        token={token}
        dir={dir}
      />
    )}
  </>
  );
};
