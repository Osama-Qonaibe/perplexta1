import React from 'react';
import { motion } from 'motion/react';
import { Message } from './types';
import { UserMessageBubble } from './messages/UserMessageBubble';
import { AssistantMessageBubble } from './messages/AssistantMessageBubble';

interface ChatMessageItemProps {
  msg: Message;
  idx: number;
  dir: 'ltr' | 'rtl';
  theme: string;
  t: any;
  isGenerating: boolean;
  isLastMessage: boolean;
  user: any;
  navigate: any;
  messages: Message[];
  editingMessageIndex?: number | null;
  editValue?: string;
  setEditValue?: (val: string) => void;
  setEditingMessageIndex?: (idx: number | null) => void;
  handleEditSubmit?: (idx: number) => void;
  copiedPromptIndex?: number | null;
  handleCopyPrompt?: (text: string, index: number) => void;
  openCitationsMap?: Record<number, boolean>;
  setOpenCitationsMap?: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  aiSuggestions?: string[];
  videoSettings?: any;
  imageSettings?: any;
  playingTTSId?: string | number | null;
  openMenuId?: string | null;
  token?: string | null;
  setOpenMenuId?: (id: string | null) => void;
  handleFeedback?: (messageId: number, feedback: number) => void;
  handlePinMessage?: (messageId: number, isPinned: boolean) => void;
  handleTTS?: (content: string, id: string | number) => void;
  handleRegenerate?: (index: number) => void;
  handleSendOrStop?: (prompt: string, msgs?: Message[]) => void;
  onDeleteMessage?: (messageId: number | undefined, index: number) => void;
  renderChildrenWithCitations?: (children: any, msg: Message) => React.ReactNode;
  chatMarkdownComponents?: any;
  findUserPrompt?: (idx: number) => string | undefined;
  getFileIcon?: (type: string) => React.ReactNode;
  ProductionSuite?: React.ComponentType<{ content: string; dir: 'ltr' | 'rtl'; theme: string }>;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  idx,
  dir,
  theme,
  t,
  isGenerating,
  isLastMessage,
  user,
  navigate,
  messages,
  editingMessageIndex,
  editValue,
  setEditValue,
  setEditingMessageIndex,
  handleEditSubmit,
  copiedPromptIndex,
  handleCopyPrompt,
  openCitationsMap,
  setOpenCitationsMap,
  aiSuggestions,
  videoSettings,
  imageSettings,
  playingTTSId,
  openMenuId,
  token,
  setOpenMenuId,
  handleFeedback,
  handlePinMessage,
  handleTTS,
  handleRegenerate,
  handleSendOrStop,
  onDeleteMessage,
  renderChildrenWithCitations,
  chatMarkdownComponents,
  findUserPrompt,
  getFileIcon,
  ProductionSuite
}) => {
  return (
    <motion.div
      key={`msg-${msg.client_id || msg.id || idx}-${idx}`}
      id={`message-${idx}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.25,
        ease: [0.2, 0, 0, 1]
      }}
      className={`w-full ${msg.role === 'user' ? 'user-message-anchor' : ''}`}
    >
      <div className={`w-full min-h-[44px] ${msg.role === 'user' ? 'bg-transparent' : 'bg-transparent'} px-0`}>
        {msg.role === 'user' ? (
          <UserMessageBubble
            msg={msg}
            idx={idx}
            dir={dir}
            editingMessageIndex={editingMessageIndex ?? null}
            editValue={editValue ?? ''}
            setEditValue={setEditValue ?? (() => {})}
            setEditingMessageIndex={setEditingMessageIndex ?? (() => {})}
            handleEditSubmit={handleEditSubmit ?? (() => {})}
            copiedPromptIndex={copiedPromptIndex ?? null}
            handleCopyPrompt={handleCopyPrompt ?? (() => {})}
            handlePinMessage={handlePinMessage ?? (() => {})}
            getFileIcon={getFileIcon}
          />
        ) : (
          <AssistantMessageBubble
            msg={msg}
            idx={idx}
            dir={dir}
            theme={theme}
            t={t}
            isGenerating={isGenerating}
            isLastMessage={isLastMessage}
            user={user}
            navigate={navigate}
            messages={messages}
            openCitationsMap={openCitationsMap ?? {}}
            setOpenCitationsMap={setOpenCitationsMap ?? (() => {})}
            aiSuggestions={aiSuggestions ?? []}
            videoSettings={videoSettings}
            imageSettings={imageSettings}
            playingTTSId={playingTTSId ?? null}
            openMenuId={openMenuId ?? null}
            token={token ?? null}
            setOpenMenuId={setOpenMenuId ?? (() => {})}
            handleFeedback={handleFeedback ?? (() => {})}
            handlePinMessage={handlePinMessage ?? (() => {})}
            handleTTS={handleTTS ?? (() => {})}
            handleRegenerate={handleRegenerate ?? (() => {})}
            handleSendOrStop={handleSendOrStop ?? (() => {})}
            onDeleteMessage={onDeleteMessage ?? (() => {})}
            renderChildrenWithCitations={renderChildrenWithCitations ?? ((c) => c)}
            chatMarkdownComponents={chatMarkdownComponents}
            findUserPrompt={findUserPrompt ?? (() => undefined)}
            ProductionSuite={ProductionSuite}
          />
        )}
      </div>
    </motion.div>
  );
});
