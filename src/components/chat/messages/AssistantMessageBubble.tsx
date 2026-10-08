import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pin } from 'lucide-react';
import { Message } from '../types';
import { stripProtocolMarkers, extractFollowUpsClient } from '../../../utils/chatUtils';
import { formatExactTimestamp } from '../../../utils/adminUtils';
import { ThinkingSteps } from '../renderers/ThinkingSteps';
import { extractThinking } from '../../../utils/thinkingParser';
import { FollowUps } from '../renderers/FollowUps';
import { removeArtifactTags } from '../../../utils/artifactParser';
import {
  QuotaExceededCard,
  InsufficientFundsCard,
  SystemInactiveCard
} from '../cards/ChatQuotaCards';
import {
  SimpleImageLoadingPlaceholder,
  SimpleVideoLoadingPlaceholder,
  SimpleImageErrorPlaceholder,
  SimpleVideoErrorPlaceholder,
  ShareableImageOutput
} from '../renderers/MediaRenderer';
import { MessageActions } from './MessageActions';
import { MarkdownLink, BlockquoteWithActions } from '../renderers/MarkdownElements';
import { CodeBlock } from '../renderers/CodeBlock';
import { Logo } from '../../common/Logo';
import { CognitiveOrbitRing } from '../common/CognitiveOrbitRing';
import { useAppContext } from '../../../context/AppContext';
import { CollapsibleTable } from '../renderers/CollapsibleTable';
import { ChatResponseRenderer } from '../renderers/ChatResponseRenderer';
import { getToolDetails } from '../tools/ToolStatusIndicator';

interface AssistantMessageBubbleProps {
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
  openCitationsMap?: Record<number, boolean>;
  setOpenCitationsMap?: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  aiSuggestions: string[];
  videoSettings?: any;
  imageSettings?: any;
  playingTTSId: string | number | null;
  openMenuId: string | null;
  token: string | null;
  setOpenMenuId: (id: string | null) => void;
  handleFeedback: (messageId: number, feedback: number) => void;
  handlePinMessage: (messageId: number, isPinned: boolean) => void;
  handleTTS: (content: string, id: string | number) => void;
  handleRegenerate: (index: number) => void;
  handleSendOrStop: (prompt: string, msgs?: Message[]) => void;
  onDeleteMessage: (messageId: number | undefined, index: number) => void;
  renderChildrenWithCitations: (children: any, msg: Message) => React.ReactNode;
  chatMarkdownComponents: any;
  findUserPrompt: (idx: number) => string | undefined;
  ProductionSuite?: React.ComponentType<{ content: string; dir: 'ltr' | 'rtl'; theme: string }>;
}

function extractImageUrl(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  const markdownMatch = trimmed.match(/!\[.*?\]\((.*?)\)/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && (parenMatch[1].startsWith('/') || parenMatch[1].startsWith('http') || parenMatch[1].startsWith('data:'))) {
    return parenMatch[1].trim();
  }
  const urlMatch = trimmed.match(/(https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|data:image\/[^\s)]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }
  return trimmed;
}

function isValidImageUrl(content: string): boolean {
  if (!content) return false;
  const extracted = extractImageUrl(content);
  return extracted.startsWith('/') || 
         extracted.startsWith('http://') || 
         extracted.startsWith('https://') || 
         extracted.startsWith('data:image/') || 
         extracted.startsWith('blob:');
}

export const AssistantMessageBubble: React.FC<AssistantMessageBubbleProps> = ({
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
  ProductionSuite
}) => {
  const { siteSettings } = useAppContext();
  const toolDetails = getToolDetails(msg.tool, dir, t);
  const ToolIcon = toolDetails?.icon;
  const displayName = dir === 'rtl' 
    ? (siteSettings?.siteNameAr || siteSettings?.siteName || 'بيربليكستا') 
    : (siteSettings?.siteName || 'Perplexta');

  // Parse reasoning trace vs clean response
  const thinkingParsed = extractThinking(msg.content);
  const rawTrace = thinkingParsed.thinkingContent || (msg.thinking_steps && msg.thinking_steps.find((s: any) => s.is_raw_trace)?.step);
  const cleanAnswer = thinkingParsed.cleanContent;

  // 1. Thinking Phase: actively generating and currently reasoning or waiting for response stream
  const isThinkingPhase = isGenerating && isLastMessage && (
    thinkingParsed.isThinkingActive || 
    (!cleanAnswer && !msg.is_image_failed && !msg.is_video_failed && !msg.is_quota_error && !msg.is_insufficient_funds && !msg.is_system_inactive)
  );

  // 2. Writing Phase: actively generating and clean response text has begun streaming
  const isWritingPhase = isGenerating && isLastMessage && !isThinkingPhase && Boolean(cleanAnswer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      dir={dir}
      className="w-full relative"
    >
      {/* Pinned Badge */}
      {msg.is_pinned && (
        <div className="absolute -top-4 -start-2 flex items-center gap-1 bg-accent/10 px-1.5 py-0.5 rounded-md border border-accent/20 shadow-[0_0_10px_rgba(156,163,175,0.1)] z-10 scale-75 md:scale-90 origin-top-left">
          <Pin size={10} className="text-accent" />
          <span className="text-[9px] font-black uppercase text-accent tracking-tighter">Pinned Response</span>
        </div>
      )}

      {/* Seamless Integrated Assistant Response Container */}
      <div 
        className={`relative ${['image', 'video'].includes(msg.tool || '') ? 'p-0 bg-transparent border-none shadow-none w-full max-w-full sm:max-w-lg' : 'w-full px-0 py-1 sm:py-2 bg-transparent border-none shadow-none space-y-6'} text-[var(--text-primary)] transition-all duration-fast text-start max-w-none text-[13.5px] sm:text-[14px] leading-relaxed tracking-tight`}
      >
        {/* Model Badge Header */}
        <div className={`flex items-center justify-between gap-2.5 select-none ${['image', 'video'].includes(msg.tool || '') ? 'mb-2 px-1' : 'mb-3 pb-1.5'}`}>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center shrink-0 w-[26px] h-[26px]">
              <Logo size={20} fallbackType="cpu" shape="circle" />
              <CognitiveOrbitRing
                isSpinning={isWritingPhase || (isGenerating && isLastMessage)}
                dir={dir}
                size={28}
                radius={11.5}
                strokeWidth={1.5}
                strokeDasharray="4.5 2.5"
              />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] font-sans tracking-tight">
              {displayName}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] px-2 py-0.5 rounded-full border border-[var(--border-default)] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] animate-pulse" />
            {ToolIcon && <ToolIcon size={10} className="text-[var(--fg-accent)] shrink-0" />}
            <span className="text-[10px] font-bold text-[var(--fg-accent)] tracking-wide font-sans">{toolDetails.label}</span>
          </div>
        </div>

        {/* Unified Professional Thinking Steps */}
        <div className="mb-2.5 select-none" id="assistant-thinking-block">
          <ThinkingSteps
            steps={isGenerating && isLastMessage ? msg.thinking_steps : msg.thinking_steps?.map((s) => ({ ...s, status: 'completed' as const }))}
            rawThinking={rawTrace}
            isProcessing={isThinkingPhase || (isGenerating && isLastMessage && ['image', 'video'].includes(msg.tool || ''))}
            thinkingTime={msg.generation_time}
            dir={dir}
            query={messages.slice(0, idx).reverse().find((m) => m.role === 'user')?.content || ''}
            tool={msg.tool}
          />
        </div>

      {/* Media & Quota Error Cards */}
      {msg.is_image_failed ? (
        <SimpleImageErrorPlaceholder
          dir={dir}
          errorMessage={msg.content}
          aspectRatio={msg.aspect_ratio || imageSettings?.aspectRatio || '1:1'}
          onRetry={() => {
            const userPrompt = findUserPrompt(idx);
            if (userPrompt) {
              handleSendOrStop(userPrompt, messages.slice(0, idx - 1));
            }
          }}
        />
      ) : msg.is_video_failed ? (
        <SimpleVideoErrorPlaceholder
          dir={dir}
          errorMessage={msg.content}
          aspectRatio={msg.aspect_ratio || videoSettings?.aspectRatio || '9:16'}
          onRetry={() => {
            const userPrompt = findUserPrompt(idx);
            if (userPrompt) {
              handleSendOrStop(userPrompt, messages.slice(0, idx - 1));
            }
          }}
        />
      ) : msg.is_quota_error ? (
        <QuotaExceededCard tool={msg.tool} data={msg.quota_data} dir={dir} navigate={navigate} user={user} />
      ) : msg.is_insufficient_funds ? (
        <InsufficientFundsCard data={msg.quota_data} dir={dir} navigate={navigate} user={user} />
      ) : msg.is_system_inactive ? (
        <SystemInactiveCard data={msg.quota_data} dir={dir} />
      ) : (
        <>
          {/* Image & Media Direct Rendering */}
          {msg.tool === 'image' ? (
            isGenerating && isLastMessage && (!msg.content || !isValidImageUrl(msg.content)) ? (
              <SimpleImageLoadingPlaceholder dir={dir} aspectRatio={msg.aspect_ratio || imageSettings?.aspectRatio || '1:1'} />
            ) : (
              <ShareableImageOutput 
                src={extractImageUrl(msg.content)} 
                dir={dir} 
                alt={dir === 'rtl' ? 'صورة تم إنشاؤها بواسطة بيربليكستا' : 'Generated Image by Perplexta'} 
              />
            )
          ) : isGenerating && isLastMessage && (!msg.content || msg.content === '') && msg.tool === 'video' ? (
            <SimpleVideoLoadingPlaceholder dir={dir} aspectRatio={msg.aspect_ratio || videoSettings?.aspectRatio || '9:16'} />
          ) : msg.tool === 'canvas' && ProductionSuite ? (
            <ProductionSuite content={stripProtocolMarkers(msg.content)} dir={dir} theme={theme} />
          ) : (
            (() => {
              const thinkingParsed = extractThinking(msg.content);
              const cleanAnswer = thinkingParsed.cleanContent;

              if (thinkingParsed.isThinkingActive && !cleanAnswer) {
                return null;
              }

              if (isGenerating && isLastMessage && !cleanAnswer) {
                return null;
              }

              return (
                <ChatResponseRenderer
                  content={removeArtifactTags(cleanAnswer)}
                  isGenerating={isGenerating}
                  isLastMessage={isLastMessage}
                  dir={dir}
                  theme={theme}
                  msg={msg}
                  renderChildrenWithCitations={renderChildrenWithCitations}
                  chatMarkdownComponents={chatMarkdownComponents}
                />
              );
            })()
          )}

          {(() => {
            let messageFollowUps =
              msg.follow_ups && msg.follow_ups.length > 0
                ? msg.follow_ups
                : isLastMessage && aiSuggestions.length > 0
                ? aiSuggestions
                : extractFollowUpsClient(msg.content).followUps;

            if ((!messageFollowUps || messageFollowUps.length === 0) && isLastMessage && !isGenerating && msg.content && msg.content.length > 30) {
              const prevUser = messages.slice(0, idx).reverse().find((m) => m.role === 'user');
              const q = prevUser?.content?.trim() || '';
              if (dir === 'rtl') {
                if (q.includes('كود') || q.includes('برمج') || msg.content.includes('```')) {
                  messageFollowUps = [
                    'تحسين الكود',
                    'شرح الخطوات',
                    'معالجة الأخطاء'
                  ];
                } else if (q.includes('مقارنة') || q.includes('فرق') || q.includes('أيهما أفضل')) {
                  messageFollowUps = [
                    'المقارنة بالتفصيل',
                    'الخيار الأنسب',
                    'بدائل أخرى'
                  ];
                } else {
                  messageFollowUps = [
                    'اكتب لي مقالًا',
                    'اقترح أفكارًا',
                    'لخّص النص'
                  ];
                }
              } else {
                if (q.toLowerCase().includes('code') || msg.content.includes('```')) {
                  messageFollowUps = [
                    'Optimize code',
                    'Explain logic',
                    'Error handling'
                  ];
                } else {
                  messageFollowUps = [
                    'Write an article',
                    'Suggest ideas',
                    'Summarize text'
                  ];
                }
              }
            }

            const hasFollowUps =
              !!(messageFollowUps && messageFollowUps.length > 0) &&
              msg.tool !== 'image' &&
              msg.tool !== 'video';

            if (!hasFollowUps) return null;

            return (
              <AnimatePresence mode="wait">
                {(!isGenerating || !isLastMessage) && hasFollowUps && (
                  <motion.div
                    key={`follow-ups-${idx}-${msg.id || idx}`}
                    initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(2px)' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    <FollowUps followUps={messageFollowUps} onSelect={(q) => handleSendOrStop(q)} dir={dir} />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })()}
        </>
      )}
      </div>

      <div
        className={`text-[11px] font-mono font-medium text-[var(--text-secondary)] mt-2.5 px-1 select-none ${
          dir === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        {formatExactTimestamp(msg.created_at, dir)}
      </div>

      <AnimatePresence mode="wait">
        {(!isGenerating || !isLastMessage) && msg.role === 'assistant' && (
          <MessageActions
            msg={msg}
            idx={idx}
            dir={dir}
            isGenerating={isGenerating}
            isLastMessage={isLastMessage}
            playingTTSId={playingTTSId}
            openMenuId={openMenuId}
            token={token}
            setOpenMenuId={setOpenMenuId}
            handleFeedback={handleFeedback}
            handlePinMessage={handlePinMessage}
            handleTTS={handleTTS}
            handleRegenerate={handleRegenerate}
            onDeleteMessage={onDeleteMessage}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
