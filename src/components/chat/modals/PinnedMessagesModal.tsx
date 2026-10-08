import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, Bookmark, PinOff, Copy } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message } from '../types';
import { toast } from '@/design-system';
import { stripProtocolMarkers } from '../../../utils/chatUtils';

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  dir: 'rtl' | 'ltr';
  onUnpin: (messageId: number) => void;
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  isOpen,
  onClose,
  messages,
  dir,
  onUnpin
}) => {
  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-shape-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)]">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-normal text-[var(--text-primary)]">
                    {dir === 'rtl' ? 'الرسائل المثبتة' : 'Pinned Messages'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                    {pinnedMessages.length} {dir === 'rtl' ? 'رسائل محفوظة' : 'saved messages'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-shape-sm hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Pin size={28} className="text-[var(--text-muted)] opacity-35 mb-3" />
                  <p className="text-xs font-bold text-[var(--text-muted)]">
                    {dir === 'rtl' ? 'لا توجد رسائل مثبتة حالياً' : 'No pinned messages yet'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] opacity-80 mt-1 max-w-[280px] leading-relaxed">
                    {dir === 'rtl' ? 'ثبّت الرسائل المهمة في المحادثة لتبقى محفوظة هنا.' : 'Pin important questions or responses to view them in this list.'}
                  </p>
                </div>
              ) : (
                pinnedMessages.map((msg, pIdx) => (
                  <div key={`pinned-msg-${msg.id || pIdx}-${pIdx}`} className="group relative p-3.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--fg-accent)]/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-accent)]">
                        {msg.role === 'user' ? (dir === 'rtl' ? 'البرومبت' : 'Your Prompt') : (dir === 'rtl' ? 'إجابة بيربليكستا' : 'Perplexta Answer')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(stripProtocolMarkers(msg.content));
                            toast.success(dir === 'rtl' ? 'تم نسخ النص بنجاح' : 'Copied successfully');
                          }}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-shape-xs hover:bg-[var(--surface-card)] cursor-pointer"
                          title={dir === 'rtl' ? 'نسخ' : 'Copy'}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => msg.id && onUnpin(msg.id)}
                          className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1.5 rounded-shape-xs hover:bg-[var(--surface-card)] cursor-pointer"
                          title={dir === 'rtl' ? 'إلغاء التثبيت' : 'Unpin'}
                        >
                          <PinOff size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="markdown-body prose text-[13px] line-clamp-6 text-[var(--text-secondary)]">
                      <Markdown>{stripProtocolMarkers(msg.content)}</Markdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
