import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExternalLink, Check, Plus, CornerDownLeft, CornerDownRight, PlusCircle, Quote, 
  MessageSquare, Copy, Sparkles, Share2
} from 'lucide-react';
import { HighlightText } from '../../HighlightText';
import { getCleanUrl, getFavicon, getPlatformBrand, fetchLinkMetadata } from '../../../utils/linkUtils';
import { toast } from '@/design-system';

export const ThinkingSteps = ({ steps, dir, query }: { steps: any[], dir: 'ltr' | 'rtl', query?: string }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3" id="thinking-steps-container">
      <div className="flex items-center gap-2 mb-2 sm:mb-4 opacity-70">
         <div className="w-1 h-3 sm:w-1.5 sm:h-4 bg-[var(--fg-accent)]/60 rounded-[var(--radius-xs)]" />
         <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
           {dir === 'rtl' ? 'مراحل التحليل والبحث' : 'ANALYSIS & RESEARCH PHASES'}
         </span>
      </div>
      <div className="space-y-1 sm:space-y-2 ps-2.5 sm:ps-5 border-s-2 border-[var(--border-default)] ml-0.5 sm:ml-2">
        {steps.map((step, idx) => (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            key={`step-${step.step || idx}-${idx}`} 
            className="flex items-center gap-2 sm:gap-4 group"
          >
            {step.status === 'completed' ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--fg-accent)]">
                <Check size={10} strokeWidth={3} />
              </div>
            ) : step.status === 'processing' ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] flex items-center justify-center">
                <div className="w-1 h-1 rounded-[var(--radius-full)] bg-[var(--fg-accent)] animate-pulse" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center">
                <div className="w-1 h-1 rounded-[var(--radius-full)] bg-[var(--text-muted)]" />
              </div>
            )}
            <span className={`text-[10px] sm:text-[12px] font-medium ${step.status === 'completed' ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]/60'} transition-theme truncate`}>
              <HighlightText text={step.step} query={query} />
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const CitationRow = ({ cite, idx, dir, query }: { cite: any, idx: number, dir: 'ltr' | 'rtl', query?: string }) => {
  const [meta, setMeta] = useState<any>(null);

  const rawUrl = cite.url || cite.link || '';
  const cleanUrl = getCleanUrl(rawUrl);
  const displayHost = rawUrl ? rawUrl.replace(/^https?:\/\//i, '').split('/')[0] : '';
  const brand = getPlatformBrand(cleanUrl);

  useEffect(() => {
    let active = true;
    if (!cleanUrl) return;

    fetchLinkMetadata(cleanUrl)
      .then(data => {
        if (active) {
          setMeta(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [cleanUrl]);

  const displayTitle = meta?.title || cite.title || displayHost;
  const displayDesc = meta?.description || cite.snippet || '';
  const displayImage = meta?.image || '';

  return (
    <motion.a
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      href={cleanUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 p-2.5 rounded-[var(--radius-xs)] hover:bg-[var(--surface-subtle)] transition-theme group min-w-0 cursor-pointer border-b border-[var(--border-default)]/30 last:border-0"
    >
      <div className="flex-shrink-0">
        <div 
          className="w-7 h-7 rounded-[var(--radius-xs)] flex items-center justify-center border border-[var(--border-default)]/60 bg-[var(--surface-card)] shadow-sm transition-theme group-hover:scale-105 group-hover:border-[var(--border-accent)]"
          style={{ color: brand ? brand.color : 'inherit' }}
        >
          {brand ? (
            brand.icon("w-3.5 h-3.5")
          ) : (
            <img
              src={getFavicon(cleanUrl)}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] flex items-center justify-center text-[9px] font-black text-[var(--fg-accent)] shrink-0 group-hover:bg-[var(--fg-accent)] group-hover:text-white transition-theme">
            {cite.index || (idx + 1)}
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--fg-accent)] transition-theme">
            <HighlightText text={displayTitle} query={query} />
          </span>
          <ExternalLink size={10} className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-[-2px] group-hover:translate-x-0" />
        </div>

        {displayDesc ? (
          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 font-normal leading-relaxed">
            <HighlightText text={displayDesc} query={query} />
          </p>
        ) : null}

        <span className="text-[9px] text-[var(--text-muted)] font-medium block truncate opacity-70">
          {displayHost || (dir === 'rtl' ? 'رابط المصدر' : 'Source Link')}
        </span>
      </div>

      {displayImage ? (
        <div className="flex-shrink-0 self-center hidden sm:block">
          <img
            src={displayImage}
            alt=""
            className="w-12 h-8 object-cover rounded border border-[var(--border-default)]/60 bg-[var(--surface-inset)] shadow-sm group-hover:border-accent/30 transition-theme"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
    </motion.a>
  );
};

export const MarkdownLink = ({ href, children }: { href?: string, children: React.ReactNode }) => {
  const [meta, setMeta] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const cleanUrl = getCleanUrl(href || '');
  const displayHost = cleanUrl ? cleanUrl.replace(/^https?:\/\//i, '').split('/')[0] : '';
  const brand = getPlatformBrand(cleanUrl);

  useEffect(() => {
    if (!cleanUrl) return;
    let active = true;
    fetchLinkMetadata(cleanUrl)
      .then(data => {
        if (active) setMeta(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [cleanUrl]);

  const displayTitle = meta?.title || (typeof children === 'string' ? children : '') || displayHost;
  const displayDesc = meta?.description || '';
  const displayImage = meta?.image || '';
  const favicon = meta?.favicon || getFavicon(cleanUrl);

  return (
    <span className="relative inline-block group/link align-middle" style={{ unicodeBidi: 'isolate' }}>
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-1 rounded-md bg-accent/[0.06] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.12] transition-theme text-accent font-semibold no-underline text-[12.5px] align-middle shadow-xs hover:cursor-pointer"
        style={{ unicodeBidi: 'isolate' }}
      >
        <span className="shrink-0 flex items-center justify-center" style={{ color: brand ? brand.color : 'inherit' }}>
          {brand ? (
            brand.icon("w-3.5 h-3.5")
          ) : (
            <img
              src={favicon}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
            />
          )}
        </span>
        <span className="truncate max-w-[220px]" style={{ unicodeBidi: 'isolate' }}>{displayTitle}</span>
        <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
      </a>

      {showTooltip && (meta?.title || meta?.description) && (
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-3 bg-[var(--surface-card)] rounded-[var(--radius-md)] shadow-xl border border-[var(--border-default)] flex flex-col gap-2 pointer-events-none transition-theme">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-5.5 h-5.5 rounded overflow-hidden bg-[var(--surface-inset)] flex-shrink-0 flex items-center justify-center border border-[var(--border-default)]/40 text-accent">
              {brand ? brand.icon("w-3.5 h-3.5") : <img src={favicon} className="w-3.5 h-3.5 object-contain" alt="" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-[var(--text-primary)] block truncate">
                {displayTitle}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block truncate opacity-70">
                {displayHost}
              </span>
            </div>
          </div>

          {displayDesc && (
            <p className="text-[9.5px] text-[var(--text-muted)] leading-relaxed mt-0.5 pt-1.5 border-t border-[var(--border-default)]/30 font-normal line-clamp-3">
              {displayDesc}
            </p>
          )}

          {displayImage && (
            <div className="w-full h-24 overflow-hidden rounded bg-[var(--surface-inset)] border border-[var(--border-default)]/40 mt-1">
              <img src={displayImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export const MarkdownCitationLink = ({ citation, index }: { citation: any, index: number }) => {
  const [meta, setMeta] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const cleanUrl = getCleanUrl(citation.url || citation.link || '');
  const displayHost = cleanUrl ? cleanUrl.replace(/^https?:\/\//i, '').split('/')[0] : '';
  const brand = getPlatformBrand(cleanUrl);

  useEffect(() => {
    if (!cleanUrl) return;
    let active = true;
    fetchLinkMetadata(cleanUrl)
      .then(data => {
        if (active) setMeta(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [cleanUrl]);

  const displayTitle = meta?.title || citation.title || displayHost;
  const displayDesc = meta?.description || citation.snippet || '';
  const displayImage = meta?.image || '';
  const favicon = meta?.favicon || getFavicon(cleanUrl);

  return (
    <span className="relative inline-flex items-center align-middle group/cite mx-0.5">
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-shape-xs transition-theme transform hover:scale-110 cursor-pointer overflow-hidden border border-transparent hover:border-[var(--border-accent)] relative before:absolute before:-inset-2.5 before:content-['']"
      >
        <span 
          className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[var(--text-muted)] group-hover/cite:text-[var(--fg-accent)] transition-theme"
          style={{ color: brand ? brand.color : 'inherit' }}
        >
          {brand ? brand.icon("w-3.5 h-3.5 rounded-[var(--radius-xs)]") : <img src={favicon} className="w-3.5 h-3.5 object-contain rounded-[var(--radius-xs)] bg-[var(--surface-card)]" alt="" />}
        </span>
      </a>

      {showTooltip && (displayTitle || displayDesc) && (
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-3 bg-[var(--surface-card)] rounded-[var(--radius-md)] shadow-xl border border-[var(--border-default)] flex flex-col gap-2 pointer-events-none transition-theme">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-5.5 h-5.5 rounded overflow-hidden bg-[var(--surface-inset)] flex-shrink-0 flex items-center justify-center border border-[var(--border-default)]/40 text-[var(--fg-accent)]">
              {brand ? brand.icon("w-3.5 h-3.5") : <img src={favicon} className="w-3.5 h-3.5 object-contain" alt="" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-[var(--text-primary)] block truncate border-b border-[var(--border-default)]/35 pb-1 mb-1">
                {displayTitle}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block truncate opacity-70">
                {displayHost}
              </span>
            </div>
          </div>

          {displayDesc && (
            <p className="text-[9.5px] text-[var(--text-muted)] leading-relaxed mt-0.5 font-normal line-clamp-3">
              {displayDesc}
            </p>
          )}

          {displayImage && (
            <div className="w-full h-24 overflow-hidden rounded bg-[var(--surface-inset)] border border-[var(--border-default)]/40 mt-1">
              <img src={displayImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export const Citations = ({ citations, dir, isOpen, onToggle, query }: { citations: any[], dir: 'ltr' | 'rtl', isOpen: boolean, onToggle: () => void, query?: string }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4" id="citations-container">
      <button 
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme group shadow-2xs active:scale-95 cursor-pointer touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
      >
        <div className="flex -space-x-1.5 rtl:space-x-reverse">
          {citations.slice(0, 3).map((cite, i) => {
            const rawUrl = cite.url || cite.link || '';
            const cleanUrl = getCleanUrl(rawUrl);
            const brand = getPlatformBrand(cleanUrl);
            return (
              <div 
                key={`cit-prev-${cleanUrl || i}-${i}`} 
                className="w-4 h-4 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center overflow-hidden shadow-2xs z-[10]"
                style={{ color: brand ? brand.color : 'inherit' }}
              >
                {brand ? (
                  brand.icon("w-3 h-3")
                ) : (
                  <img 
                    src={getFavicon(cleanUrl)} 
                    alt="" 
                    className="w-3 h-3 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="w-px h-3 bg-[var(--border-default)] mx-0.5" />
        <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-theme">
          {citations.length} {dir === 'rtl' ? 'مصادر موثقة' : 'Verified Sources'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme"
        >
          <Plus size={11} strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 max-w-full flex flex-col gap-1">
              {citations.map((cite, idx) => (
                <CitationRow 
                  key={`cit-row-${cite.url || idx}-${idx}`} 
                  cite={cite} 
                  idx={idx} 
                  dir={dir} 
                  query={query}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FollowUps = ({ followUps, onSelect, dir }: { followUps: string[], onSelect: (q: string) => void, dir: 'ltr' | 'rtl' }) => {
  if (!followUps || followUps.length === 0) return null;
  const items = followUps.slice(0, 3);

  return (
    <div className="mt-3.5 pt-2.5 border-t border-[var(--border-default)]/40 w-full" id="follow-ups-container" dir={dir}>
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {items.map((q, idx) => (
          <button
            key={`follow-up-${idx}-${q.slice(0, 15)}`}
            onClick={() => onSelect(q)}
            id={`follow-up-${idx}`}
            className="group flex-1 min-w-[120px] max-w-full inline-flex items-center justify-between gap-2 px-3 h-8 bg-transparent hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm transition-theme text-start cursor-pointer text-[var(--text-primary)] active:scale-95 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
            title={q}
          >
            <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors truncate">
              {q}
            </span>
            <div className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5 transition-all duration-200">
              {dir === 'rtl' ? (
                <CornerDownLeft size={13} className="transition-transform" />
              ) : (
                <CornerDownRight size={13} className="transition-transform" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

import { QuoteShareModal } from './QuoteShareModal';

// Helper function to extract plain text from React nodes recursively
function extractTextFromChildren(node: React.ReactNode): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join(' ');
  if (React.isValidElement(node) && node.props && (node.props as any).children) {
    return extractTextFromChildren((node.props as any).children);
  }
  return '';
}

export const BlockquoteWithActions = ({ children, dir }: { children: React.ReactNode, dir: 'ltr' | 'rtl' }) => {
  let cleanedChildren = children;
  const rawText = extractTextFromChildren(children).trim();
  
  const isSecurityNote = /^(ملاحظة أمان|تنبيه أمني|safety note|security note|\[security\]|\[safety\])/i.test(rawText);
  
  // Strip duplicate prefix like "ملاحظة أمان:" or "Safety Note:" from children if present
  if (isSecurityNote) {
    const processNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        return node.replace(/^(ملاحظة أمان|تنبيه أمني|safety note|security note|\[security\]|\[safety\])[:\s]*/i, '');
      }
      if (Array.isArray(node)) {
        return node.map(processNode);
      }
      if (React.isValidElement(node) && node.props && (node.props as any).children) {
        return React.cloneElement(node, {
          ...node.props,
          children: processNode((node.props as any).children)
        } as any);
      }
      return node;
    };
    cleanedChildren = processNode(children);
  }

  return (
    <div className="relative group/bq my-4 sm:my-5 select-text" style={{ unicodeBidi: 'isolate' }}>
      <blockquote className="relative py-3 px-4 border-s-4 border-[var(--fg-accent)] bg-[var(--surface-subtle)]/70 rounded-r-shape-md border-y-0 border-e-0 transition-all hover:bg-[var(--surface-subtle)] shadow-xs flex flex-col gap-1.5">
        {isSecurityNote && (
          <div className="text-xs font-bold text-[var(--fg-accent)] flex items-center gap-1.5 mb-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)]"></span>
            <span>{dir === 'rtl' ? 'ملاحظة أمان' : 'Security Note'}</span>
          </div>
        )}
        <div className="text-[13.5px] sm:text-[14px] font-medium leading-[1.85] text-[var(--text-primary)]">
          {cleanedChildren}
        </div>
      </blockquote>
    </div>
  );
};
