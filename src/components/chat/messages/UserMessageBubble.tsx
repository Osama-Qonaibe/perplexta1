import React, { useContext } from 'react';
import { ImageIcon, Video, Music, FileText, Code, Check, Copy, Pin, PinOff, Pencil, User } from 'lucide-react';
import { Message } from '../types';
import { stripProtocolMarkers } from '../../../utils/chatUtils';
import { formatExactTimestamp } from '../../../utils/adminUtils';
import { ArtifactContext } from '../../../context/ArtifactContext';

interface UserMessageBubbleProps {
  msg: Message;
  idx: number;
  dir: 'ltr' | 'rtl';
  editingMessageIndex: number | null;
  editValue: string;
  setEditValue: (val: string) => void;
  setEditingMessageIndex: (idx: number | null) => void;
  handleEditSubmit: (idx: number) => void;
  copiedPromptIndex: number | null;
  handleCopyPrompt: (text: string, index: number) => void;
  handlePinMessage: (messageId: number, isPinned: boolean) => void;
  getFileIcon?: (type: string) => React.ReactNode;
}

const defaultGetFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon size={20} />;
  if (fileType.startsWith('video/')) return <Video size={20} />;
  if (fileType.startsWith('audio/')) return <Music size={20} />;
  if (fileType.includes('pdf')) return <FileText size={20} />;
  if (
    fileType.includes('javascript') ||
    fileType.includes('typescript') ||
    fileType.includes('json') ||
    fileType.includes('css') ||
    fileType.includes('html') ||
    fileType.includes('python') ||
    fileType.includes('java')
  ) {
    return <Code size={20} />;
  }
  return <FileText size={20} />;
};

export const UserMessageBubble: React.FC<UserMessageBubbleProps> = ({
  msg,
  idx,
  dir,
  editingMessageIndex,
  editValue,
  setEditValue,
  setEditingMessageIndex,
  handleEditSubmit,
  copiedPromptIndex,
  handleCopyPrompt,
  handlePinMessage,
  getFileIcon = defaultGetFileIcon
}) => {
  const artifactContext = useContext(ArtifactContext);
  const isArtifactOpen = Boolean(artifactContext?.isArtifactOpen);

  return (
    <div className={`flex flex-col gap-1.5 w-full my-1 items-end`}>
      {msg.file && (
        <div
          className="mb-1 p-2 rounded-shape-md border flex items-center gap-3 w-fit self-end bg-[var(--surface-subtle)] border-[var(--border-default)]"
        >
          {msg.file.type.startsWith('image/') ? (
            <img
              src={msg.file.preview}
              alt={msg.file.name}
              className="w-9 h-9 object-cover rounded-shape-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent">
              {getFileIcon(msg.file.type)}
            </div>
          )}
          <div className="flex flex-col min-w-0 pe-2">
            <span className="text-[11px] font-bold truncate max-w-[150px] text-[var(--text-primary)]">
              {msg.file.name}
            </span>
            <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              {msg.file.type.split('/')[1] || 'FILE'}
            </span>
          </div>
        </div>
      )}

      {editingMessageIndex === idx ? (
        <div className="flex flex-col gap-2.5 w-full max-w-2xl bg-[var(--surface-card)] p-3 sm:p-3.5 rounded-shape-lg border border-[var(--border-default)] shadow-xs">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none focus:ring-0 text-[13.5px] sm:text-[14px] resize-none outline-none text-[var(--text-primary)] font-medium leading-relaxed ide-textarea-scroll"
            rows={Math.max(2, editValue.split('\n').length)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEditSubmit(idx);
              }
              if (e.key === 'Escape') {
                setEditingMessageIndex(null);
              }
            }}
          />
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setEditingMessageIndex(null)}
              className="px-3 h-8 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] bg-transparent rounded-shape-sm border border-[var(--border-default)] transition-all cursor-pointer flex items-center justify-center box-border relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95"
            >
              {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handleEditSubmit(idx)}
              className="px-3.5 h-8 text-xs font-bold bg-transparent text-[var(--text-primary)] hover:text-[var(--fg-accent)] hover:bg-[var(--surface-subtle)] rounded-shape-sm border border-[var(--border-default)] transition-all cursor-pointer flex items-center justify-center box-border relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95"
            >
              {dir === 'rtl' ? 'حفظ وإرسال' : 'Save & Send'}
            </button>
          </div>
        </div>
      ) : (
        <div className={`group relative flex items-center gap-2 sm:gap-2.5 ${
          isArtifactOpen ? 'max-w-full' : 'max-w-[92%] sm:max-w-[85%] md:max-w-[78%]'
        } flex-row-reverse`}>
          {/* Action Toolbar (Conforming strictly to Perplexta M3 Button Tokens & 44px Touch Targets) */}
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-fast shrink-0 select-none">
            {/* Pin Message Button */}
            <button
              type="button"
              onClick={() => handlePinMessage(msg.id!, !msg.is_pinned)}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center border transition-colors duration-fast cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95 shrink-0 box-border ${
                msg.is_pinned 
                  ? 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--fg-accent)] shadow-2xs' 
                  : 'border-transparent hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={msg.is_pinned ? (dir === 'rtl' ? 'إلغاء التثبيت' : 'Unpin') : (dir === 'rtl' ? 'تثبيت' : 'Pin')}
            >
              {msg.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>

            {/* Copy Prompt Button */}
            <button
              type="button"
              onClick={() => handleCopyPrompt(msg.content, idx)}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center border transition-colors duration-fast cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95 shrink-0 box-border ${
                copiedPromptIndex === idx
                  ? 'border-[var(--fg-success)]/40 text-[var(--fg-success)] bg-[var(--status-success-subtle)] shadow-2xs'
                  : 'border-transparent hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={dir === 'rtl' ? 'نسخ' : 'Copy'}
            >
              {copiedPromptIndex === idx ? (
                <Check size={14} className="text-[var(--fg-success)]" />
              ) : (
                <Copy size={14} />
              )}
            </button>

            {/* Edit Message Button */}
            <button
              type="button"
              onClick={() => {
                setEditingMessageIndex(idx);
                setEditValue(msg.content);
              }}
              className="w-8 h-8 rounded-shape-sm flex items-center justify-center border border-transparent hover:border-[var(--border-accent)]/60 bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-fast cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] active:scale-95 shrink-0 box-border"
              title={dir === 'rtl' ? 'تعديل' : 'Edit'}
            >
              <Pencil size={14} />
            </button>
          </div>

          {/* Clean Compact User Message Bubble */}
          <div 
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-[var(--radius-md)] rounded-se-[2px] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] shadow-2xs transition-all duration-fast min-w-0 text-start"
          >
            <p
              className="text-[13.5px] sm:text-[14.5px] font-medium leading-relaxed tracking-normal font-sans break-words whitespace-pre-wrap"
              dir={dir === 'rtl' ? 'rtl' : 'ltr'}
            >
              {stripProtocolMarkers(msg.content) || msg.content || (dir === 'rtl' ? 'محتوى فارغ' : 'Empty Content')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
