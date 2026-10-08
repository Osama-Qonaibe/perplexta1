import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HighlightText } from '../../HighlightText';
import { Citation } from '../types';

export const getCleanUrl = (url: string) => {
  try {
    let finalUrl = (url || '').trim();
    if (!finalUrl) return '';
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    return finalUrl;
  } catch {
    return url || '';
  }
};

export const getFavicon = (url: string) => {
  try {
    const cleanUrl = getCleanUrl(url);
    if (!cleanUrl) return 'https://www.google.com/s2/favicons?domain=google.com&sz=32';
    const domain = new URL(cleanUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return 'https://www.google.com/s2/favicons?domain=google.com&sz=32';
  }
};

export const getPlatformBrand = (urlStr: string) => {
  const url = (urlStr || '').toLowerCase();

  if (url.includes('t.me') || url.includes('telegram')) {
    return {
      name: 'Telegram',
      color: '#0088cc',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.66-.52.36-.97.53-1.35.52-.42-.01-1.23-.24-1.83-.43-.74-.24-1.33-.37-1.28-.79.03-.22.33-.45.91-.69 3.56-1.55 5.92-2.57 7.09-3.07 3.38-1.42 4.08-1.67 4.54-1.68.1.01.33.03.48.15.13.1.17.24.19.33.02.12.01.24 0 .31z"/>
        </svg>
      )
    };
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return {
      name: 'X',
      color: '#ffffff',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    };
  }
  if (url.includes('discord.gg') || url.includes('discord.com')) {
    return {
      name: 'Discord',
      color: '#5865F2',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.46-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
        </svg>
      )
    };
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return {
      name: 'YouTube',
      color: '#FF0000',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.502 9.388.502 9.388.502s7.517 0 9.388-.502a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    };
  }
  if (url.includes('github.com')) {
    return {
      name: 'GitHub',
      color: '#ffffff',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      )
    };
  }
  if (url.includes('linkedin.com')) {
    return {
      name: 'LinkedIn',
      color: '#0077b5',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
        </svg>
      )
    };
  }
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    return {
      name: 'Facebook',
      color: '#1877F2',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    };
  }
  if (url.includes('whatsapp.com') || url.includes('wa.me')) {
    return {
      name: 'WhatsApp',
      color: '#25D366',
      icon: (className = "w-3.5 h-3.5") => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.022-.015-.03-.022-.053-.053l-.113-.15c-.27-.361-.534-.722-.803-1.081-.135-.18-.3-.15-.42.03-.135.21-.256.42-.39.63-.12.18-.285.21-.495.105-.33-.165-.66-.345-.96-.585-.45-.36-.84-.795-1.185-1.275-.12-.165-.105-.3.045-.45.195-.195.39-.39.57-.6.15-.18.135-.345-.03-.525-.225-.24-.45-.48-.675-.72-.18-.195-.345-.195-.525-.015-.225.225-.435.465-.615.735-.33.48-.465 1.02-.375 1.605.09.585.345 1.11.69 1.59.855 1.17 1.935 2.085 3.225 2.73.345.18.72.315 1.11.39.42.075.825.045 1.215-.12.435-.18.795-.495 1.05-.885.12-.18.09-.345-.06-.48zM12.007 2a9.999 9.999 0 0 0-8.666 14.997l-.78 2.855 2.923-.765A9.997 9.997 0 1 0 12.007 2zm0 18a7.994 7.994 0 0 1-4.085-1.115l-.293-.173-1.733.454.462-1.69-.19-.302A7.996 7.996 0 1 1 12.007 20z"/>
        </svg>
      )
    };
  }
  return null;
};

const linkMetadataCache = new Map<string, Promise<any> | any>();

export const fetchLinkMetadata = (url: string): Promise<any> => {
  if (linkMetadataCache.has(url)) {
    const cached = linkMetadataCache.get(url);
    if (cached instanceof Promise) {
      return cached;
    }
    return Promise.resolve(cached);
  }

  if (linkMetadataCache.size > 150) {
    const oldKeys = Array.from(linkMetadataCache.keys()).slice(0, 20);
    oldKeys.forEach(key => linkMetadataCache.delete(key));
  }

  const promise = fetch(`/api/system/link-metadata?url=${encodeURIComponent(url)}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch link metadata');
      return res.json();
    })
    .then(data => {
      linkMetadataCache.set(url, data);
      return data;
    })
    .catch(() => {
      linkMetadataCache.delete(url);
      return null;
    });

  linkMetadataCache.set(url, promise);
  return promise;
};

export const CitationRow = ({ 
  cite, 
  idx, 
  dir, 
  getCleanUrl: cleanUrlFn, 
  getFavicon: faviconFn, 
  query 
}: { 
  cite: any; 
  idx: number; 
  dir: 'ltr' | 'rtl'; 
  getCleanUrl: (url: string) => string; 
  getFavicon: (url: string) => string; 
  query?: string;
}) => {
  const [meta, setMeta] = useState<any>(null);

  const rawUrl = cite.url || cite.link || '';
  const cleanUrl = cleanUrlFn(rawUrl);
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
      className="flex items-center gap-3.5 p-2.5 rounded-shape-sm hover:bg-accent/[0.03] transition-theme group min-w-0 cursor-pointer border-b border-[var(--border-default)]/30 last:border-0"
    >
      <div className="flex-shrink-0">
        <div 
          className="w-7 h-7 rounded-shape-xs flex items-center justify-center border border-[var(--border-default)]/60 bg-[var(--surface-card)] shadow-sm transition-theme group-hover:scale-105 group-hover:border-accent/20"
          style={{ color: brand ? brand.color : 'inherit' }}
        >
          {brand ? (
            brand.icon("w-3.5 h-3.5")
          ) : (
            <img
              src={faviconFn(cleanUrl)}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded-shape-xs bg-accent/10 flex items-center justify-center text-[9px] font-black text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-theme">
            {cite.index || (idx + 1)}
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate group-hover:text-accent transition-theme">
            <HighlightText text={displayTitle} query={query} />
          </span>
          <ExternalLink size={10} className="text-[var(--text-muted)] group-hover:text-accent transition-theme shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-[-2px] group-hover:translate-x-0" />
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

export const MarkdownLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
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
    <span className="relative inline-block group/link align-middle">
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded bg-accent/[0.04] border border-accent/15 hover:border-accent/35 hover:bg-accent/[0.08] transition-theme text-accent font-semibold no-underline text-[12px] align-middle shadow-sm cursor-pointer"
      >
        <span className="shrink-0 flex items-center justify-center" style={{ color: brand ? brand.color : 'inherit' }}>
          {brand ? (
            brand.icon("w-3 h-3")
          ) : (
            <img
              src={favicon}
              alt=""
              className="w-3 h-3 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
            />
          )}
        </span>
        <span className="truncate max-w-[160px]">{displayTitle}</span>
        <ExternalLink size={9} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
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

export const MarkdownCitationLink = ({ citation, index }: { citation: any; index: number }) => {
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
        className="inline-flex items-center justify-center w-4 h-4 rounded-shape-xs transition-theme transform hover:scale-110 cursor-pointer overflow-hidden border border-transparent hover:border-accent/20"
      >
        <span 
          className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-gray-400 group-hover/cite:text-accent transition-theme"
          style={{ color: brand ? brand.color : 'inherit' }}
        >
          {brand ? brand.icon("w-3.5 h-3.5 rounded-shape-xs") : <img src={favicon} className="w-3.5 h-3.5 object-contain rounded-shape-xs bg-[var(--surface-card)]" alt="" />}
        </span>
      </a>

      {showTooltip && (displayTitle || displayDesc) && (
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-3 bg-[var(--surface-card)] rounded-shape-md shadow-xl border border-[var(--border-default)] flex flex-col gap-2 pointer-events-none transition-theme">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-5.5 h-5.5 rounded-shape-xs overflow-hidden bg-[var(--surface-inset)] flex-shrink-0 flex items-center justify-center border border-[var(--border-default)]/40 text-accent">
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
            <div className="w-full h-24 overflow-hidden rounded-shape-xs bg-[var(--surface-inset)] border border-[var(--border-default)]/40 mt-1">
              <img src={displayImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export const Citations = ({ 
  citations, 
  dir, 
  isOpen, 
  onToggle, 
  query 
}: { 
  citations?: Citation[]; 
  dir: 'ltr' | 'rtl'; 
  isOpen: boolean; 
  onToggle: () => void; 
  query?: string;
}) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4" id="citations-container">
      <button 
        onClick={onToggle}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:border-accent/30 hover:bg-accent/5 transition-theme group shadow-sm active:scale-95 cursor-pointer"
      >
        <div className="flex -space-x-1.5 rtl:space-x-reverse">
          {citations.slice(0, 3).map((cite, i) => {
            const rawUrl = cite.url || cite.link || '';
            const cleanUrl = getCleanUrl(rawUrl);
            const brand = getPlatformBrand(cleanUrl);
            return (
              <div 
                key={`cit-prev-${cleanUrl || i}-${i}`} 
                className="w-5 h-5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center overflow-hidden shadow-sm z-[10]"
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
        <span className="text-[11px] font-black text-[var(--text-secondary)] group-hover:text-accent transition-theme uppercase tracking-wider">
          {citations.length} {dir === 'rtl' ? 'مصادر موثقة' : 'Verified Sources'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-[var(--text-muted)] group-hover:text-accent transition-theme"
        >
          <Plus size={11} strokeWidth={3} />
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
                  getCleanUrl={getCleanUrl} 
                  getFavicon={getFavicon} 
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

export const renderChildrenWithCitations = (node: React.ReactNode, msg: any, depth = 0): React.ReactNode => {
  if (depth > 8) {
    return node;
  }
  if (typeof node === 'string') {
    // Matches citation markers: [1], [^1], [#1], (#1), 【1†source】, #1, 1#, etc.
    const CITATION_REGEX = /(\[\^?\d+\]|\[#\d+\]|\(#\d+\)|【\d+(?::\d+)?(?:†[^】]*)?】|(?:^|\s|[،.؛!?])#\d+|(?:^|\s|[،.؛!?])\d+#)/g;
    const parts = node.split(CITATION_REGEX);

    return parts.map((part, i) => {
      if (!part) return null;

      // Check if this part contains a citation token pattern
      const isToken = /(\[\^?\d+\]|\[#\d+\]|\(#\d+\)|【\d+(?::\d+)?(?:†[^】]*)?】|#\d+|\d+#)/.test(part);
      if (isToken) {
        const numMatch = part.match(/\d+/);
        if (numMatch) {
          const index = parseInt(numMatch[0], 10);
          const prefixMatch = part.match(/^(\s|[،.؛!?])/);
          const prefix = prefixMatch ? prefixMatch[0] : '';

          // Look up citation by index or position
          const citation = msg?.citations?.find((c: any) => c.index === index || c.idx === index) 
            || (msg?.citations && Array.isArray(msg.citations) && msg.citations[index - 1]);

          if (citation) {
            return (
              <React.Fragment key={`cit-frag-${i}-${part}`}>
                {prefix}
                <MarkdownCitationLink 
                  citation={citation}
                  index={index}
                />
              </React.Fragment>
            );
          } else if (msg?.citations && msg.citations.length > 0) {
            // Render a clean fallback numerical badge if citation metadata is generic
            return (
              <React.Fragment key={`cit-frag-badge-${i}-${part}`}>
                {prefix}
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-shape-xs text-[10.5px] font-mono font-bold bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-default)] mx-0.5 align-middle select-none">
                  [{index}]
                </span>
              </React.Fragment>
            );
          } else {
            // Orphaned retrieval tag without citation metadata: clean it up seamlessly
            return prefix ? prefix : null;
          }
        }
      }
      return part;
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={`cit-frag-${depth}-${index}`}>
        {renderChildrenWithCitations(child, msg, depth + 1)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    if (typeof node.type !== 'string') return node;
    if (!['img', 'video', 'a', 'iframe', 'canvas', 'svg', 'button', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'colgroup', 'col'].includes(node.type)) {
      const elementProps = node.props as any;
      if (elementProps && 'children' in elementProps) {
        return React.cloneElement(node, {
          ...elementProps,
          children: renderChildrenWithCitations(elementProps.children, msg, depth + 1)
        } as any);
      }
    }
  }

  return node;
};
