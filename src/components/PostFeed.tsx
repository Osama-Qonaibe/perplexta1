import { safeStorageGet, safeStorageSet } from "@/utils/safeStorage";
import { getPostShareUrl, getPostShareText } from "@/utils/shareUtils";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageSquare,
  MessageCircle,
  Phone,
  PhoneCall,
  Film,
  Share2,
  CheckCircle2,
  MapPin,
  Loader2,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Link,
  Check,
  Rocket,
  BarChart2,
  Globe,
  Users,
  Lock,
  Edit,
  Trash2,
  Bookmark,
  Flag,
  EyeOff,
  MoreVertical,
  Clapperboard,
  Camera,
  Handshake,
  ThumbsUp,
  Plus,
  RotateCcw,
  RefreshCw,
  Music,
  Play,
  Pause
} from 'lucide-react';
import { BulletinAd, BulletinAdComment } from '../../server/db/types';
import { AdDirectChat } from './AdDirectChat';
import { AdInsightsTab } from './AdInsightsTab';
import { HighlightText } from './HighlightText';
import { MediaFormatPlayer } from './MediaFormatPlayer';
import { getMediaUrl } from '../utils/mediaUtils';
import { SOCIAL_COLORS } from '../constants/socialColors';
import { BulletinAvatar } from './BulletinAvatar';
import { MultiImageGallery } from './MultiImageGallery';
import { PostOptionsMenu } from './PostOptionsMenu';
import { toast } from '@/design-system';

const FB_REACTIONS = [
  { id: 'like', emoji: '👍', labelAr: 'أعجبني', labelEn: 'Like', color: 'text-[var(--fg-accent)]' },
  { id: 'love', emoji: '❤️', labelAr: 'أحببته', labelEn: 'Love', color: 'text-[var(--fg-danger)]' },
  { id: 'care', emoji: '🥰', labelAr: 'أدعمه', labelEn: 'Care', color: 'text-[var(--fg-warning)]' },
  { id: 'haha', emoji: '😂', labelAr: 'هاهاها', labelEn: 'Haha', color: 'text-[var(--fg-warning)]' },
  { id: 'wow', emoji: '😮', labelAr: 'واو', labelEn: 'Wow', color: 'text-[var(--fg-warning)]' },
  { id: 'sad', emoji: '😢', labelAr: 'أحزنني', labelEn: 'Sad', color: 'text-[var(--fg-warning)]' },
  { id: 'angry', emoji: '😡', labelAr: 'أغضبني', labelEn: 'Angry', color: 'text-[var(--fg-danger)]' },
];

const renderRichPostText = (text: string | null | undefined, searchQuery?: string) => {
  if (!text) return null;

  // Split text by whitespace boundaries
  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, idx) => {
        if (/^\s+$/.test(word)) {
          return <span key={idx}>{word}</span>;
        }

        // Mention (@الجميع, @everyone, @متابعين, @followers, or any @username)
        if (word.startsWith('@') && word.length > 1) {
          return (
            <span
              key={idx}
              className="font-bold text-[#1877F2] dark:text-[#3880FF] hover:underline cursor-pointer inline-block mx-0.5"
            >
              <HighlightText text={word} query={searchQuery} />
            </span>
          );
        }

        // #hashtag
        if (word.startsWith('#') && word.length > 1) {
          return (
            <span
              key={idx}
              className="font-bold text-[#1877F2] dark:text-[#3880FF] hover:underline cursor-pointer inline-block mx-0.5"
            >
              <HighlightText text={word} query={searchQuery} />
            </span>
          );
        }

        return <HighlightText key={idx} text={word} query={searchQuery} />;
      })}
    </>
  );
};


function formatCompactCount(count: number): string {
  if (!count) return '0';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
export interface PostFeedProps {
  ads: BulletinAd[];
  loading: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  isRtl: boolean;
  token: string | null;
  user: any;
  searchQuery?: string;
  onToggleLike: (adId: number) => void;
  onToggleComments: (adId: number) => void;
  onToggleCommentLike?: (adId: number, commentId: number, reaction?: string) => void;
  expandedAdId: number | null;
  commentsMap: Record<number, BulletinAdComment[]>;
  loadingCommentsAdId: number | null;
  newCommentText: string;
  setNewCommentText: (val: string) => void;
  onAddComment: (adId: number, parentId?: number) => void;
  replyToCommentId: number | null;
  setReplyToCommentId: (id: number | null) => void;
  onMessageAdvertiser: (ad: BulletinAd) => void;
  messagingAdId: number | null;
  onInquire?: (ad: BulletinAd) => void;
  onWhatsApp: (ad: BulletinAd, e: React.MouseEvent) => void;
  onShare: (ad: BulletinAd) => void;
  onOpenPageDetail?: (pageId: number) => void;
  onOpenUserDetail?: (userId: number) => void;
  onOpenLightbox: (imgUrl: string, mediaItems?: any[], initialIndex?: number, postTitle?: string, authorName?: string, ad?: BulletinAd) => void;
  onCreateAdClick: () => void;
  onBoostAd?: (ad: BulletinAd) => void;
  onEditAd?: (ad: BulletinAd) => void;
  onDeleteAd?: (ad: BulletinAd) => void;
  onToggleSave?: (ad: BulletinAd) => void;
  onReportAd?: (ad: BulletinAd) => void;
  onOpenReelFeed?: (adId?: number) => void;
  onArchiveAd?: (ad: BulletinAd) => void;
  onTrashAd?: (ad: BulletinAd) => void;
  onUpdateAd?: (updatedAd: Partial<BulletinAd> & { id: number }) => void;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '😮', '🎉', '💯', '🚀', '😍', '✨', '🙏'];

export const PostFeed: React.FC<PostFeedProps> = ({
  ads,
  loading,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
  isRtl,
  token,
  user,
  searchQuery,
  onToggleLike,
  onToggleComments,
  onToggleCommentLike,
  expandedAdId,
  commentsMap,
  loadingCommentsAdId,
  newCommentText,
  setNewCommentText,
  onAddComment,
  onMessageAdvertiser,
  messagingAdId,
  onInquire,
  onWhatsApp,
  onShare,
  onOpenPageDetail,
  onOpenUserDetail,
  onOpenLightbox,
  onCreateAdClick,
  onBoostAd,
  onEditAd,
  onDeleteAd,
  onToggleSave,
  onReportAd,
  onOpenReelFeed,
  onArchiveAd,
  onTrashAd,
  onUpdateAd,
  replyToCommentId,
  setReplyToCommentId
}) => {
  const [expandedTextIds, setExpandedTextIds] = useState<Record<number, boolean>>({});
  const [activeShareMenuId, setActiveShareMenuId] = useState<number | null>(null);
  const [copiedAdId, setCopiedAdId] = useState<number | null>(null);
  const [activeChatAdId, setActiveChatAdId] = useState<number | null>(null);
  const [hiddenAdIds, setHiddenAdIds] = useState<number[]>(() => {
    const saved = safeStorageGet('perplexta_hidden_ads');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMoreMenuId, setActiveMoreMenuId] = useState<number | null>(null);
  const [localAdOverrides, setLocalAdOverrides] = useState<Record<number, Partial<BulletinAd>>>({});

  // Pull to refresh gesture state
  const [pullY, setPullY] = useState<number>(0);
  const [pullRefreshing, setPullRefreshing] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 10) {
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    } else {
      isPullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || pullRefreshing || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartYRef.current;
    if (dy > 0 && window.scrollY <= 5) {
      const dist = Math.min(80, dy * 0.45);
      setPullY(dist);
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullY >= 50 && onRefresh) {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([15, 30]);
      }
      setPullRefreshing(true);
      setPullY(55);
      try {
        await onRefresh();
      } catch {
        // ignore
      } finally {
        setTimeout(() => {
          setPullRefreshing(false);
          setPullY(0);
        }, 300);
      }
    } else {
      setPullY(0);
    }
  };

  const handleSwipeDismiss = (ad: BulletinAd) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
    setHiddenAdIds(prev => {
      const next = [...prev, ad.id];
      safeStorageSet('perplexta_hidden_ads', JSON.stringify(next));
      return next;
    });

    toast.success(isRtl ? 'تم إخفاء الإعلان من خلاصتك' : 'Post hidden from feed');
  };

  // Facebook-style reactions bar state (Rock-solid stability & inward containment)
  const [playingAudioAdId, setPlayingAudioAdId] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [reactionBarAdId, setReactionBarAdId] = useState<number | null>(null);
  const [hoveredReactionId, setHoveredReactionId] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<Record<number, string>>({});
  const hoverIntentTimerRef = useRef<any>(null);
  const reactionTimerRef = useRef<any>(null);
  const touchReactionTimerRef = useRef<any>(null);

  const handleLikeMouseEnter = (adId: number) => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    if (reactionBarAdId === adId) return;

    // Intentional delay (260ms) to ensure it only appears on deliberate hover, preventing annoying accidental popups during mouse movement
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
    }
    hoverIntentTimerRef.current = setTimeout(() => {
      setReactionBarAdId(adId);
      hoverIntentTimerRef.current = null;
    }, 260);
  };

  const handleLikeMouseLeave = () => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
    reactionTimerRef.current = setTimeout(() => {
      setReactionBarAdId(null);
      setHoveredReactionId(null);
      reactionTimerRef.current = null;
    }, 250);
  };

  const handleBarMouseEnter = (adId: number) => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setReactionBarAdId(adId);
  };

  const handleTouchStartLike = (adId: number) => {
    if (touchReactionTimerRef.current) {
      clearTimeout(touchReactionTimerRef.current);
    }
    // Deliberate touch/hold required on mobile so casual scrolling or taps don't pop it up
    touchReactionTimerRef.current = setTimeout(() => {
      setReactionBarAdId(adId);
    }, 320);
  };

  const handleTouchEndLike = () => {
    if (touchReactionTimerRef.current) {
      clearTimeout(touchReactionTimerRef.current);
      touchReactionTimerRef.current = null;
    }
  };

  const handleSelectPostReaction = (adId: number, reactionId: string) => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setReactionBarAdId(null);
    setHoveredReactionId(null);

    const currentReaction = postReactions[adId];
    if (currentReaction === reactionId) {
      // Toggle off
      setPostReactions((prev) => {
        const next = { ...prev };
        delete next[adId];
        return next;
      });
      onToggleLike(adId);
    } else {
      // Set reaction
      setPostReactions((prev) => ({ ...prev, [adId]: reactionId }));
      const targetAd = ads.find((a) => a.id === adId);
      if (!targetAd?.user_has_liked) {
        onToggleLike(adId);
      }
    }
  };

  const handleDirectPostLikeClick = (ad: BulletinAd) => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setReactionBarAdId(null);
    setHoveredReactionId(null);

    if (ad.user_has_liked || postReactions[ad.id]) {
      setPostReactions((prev) => {
        const next = { ...prev };
        delete next[ad.id];
        return next;
      });
    } else {
      setPostReactions((prev) => ({ ...prev, [ad.id]: 'like' }));
    }
    onToggleLike(ad.id);
  };

  const handleUpdateAd = (updated: Partial<BulletinAd> & { id: number }) => {
    setLocalAdOverrides(prev => ({
      ...prev,
      [updated.id]: {
        ...prev[updated.id],
        ...updated
      }
    }));
    if (onUpdateAd) {
      onUpdateAd(updated);
    }
  };

  const handleHideAd = (adId: number) => {
    const newHidden = [...hiddenAdIds, adId];
    setHiddenAdIds(newHidden);
    safeStorageSet('perplexta_hidden_ads', JSON.stringify(newHidden));
    toast.success(isRtl ? 'تم إخفاء هذا المنشور من خلاصتك' : 'Post hidden from your feed');
    setActiveMoreMenuId(null);
  };
  const [activeInsightsAdId, setActiveInsightsAdId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleCopyLink = (ad: BulletinAd) => {
    const shareUrl = getPostShareUrl(ad);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedAdId(ad.id);
        setTimeout(() => {
          setCopiedAdId(null);
          setActiveShareMenuId(null);
        }, 1200);
      }).catch(() => {
        fallbackCopyText(shareUrl, ad.id);
      });
    } else {
      fallbackCopyText(shareUrl, ad.id);
    }

    fetch(`/api/bulletin/ads/${ad.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: user?.id,
        sharer_name: user?.name || user?.email || (isRtl ? 'أحد المستخدمين' : 'A user'),
      }),
    }).catch(() => {});
  };

  const fallbackCopyText = (text: string, adId: number) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedAdId(adId);
      setTimeout(() => {
        setCopiedAdId(null);
        setActiveShareMenuId(null);
      }, 1200);
    } catch (err) {}
    document.body.removeChild(textarea);
  };

  const handleWhatsAppShare = (ad: BulletinAd) => {
    const text = encodeURIComponent(getPostShareText(ad, isRtl));
    const waUrl = `https://wa.me/?text=${text}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    fetch(`/api/bulletin/ads/${ad.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: user?.id,
        sharer_name: user?.name || user?.email || (isRtl ? 'أحد المستخدمين' : 'A user'),
      }),
    }).catch(() => {});
  };

  const isRequestingRef = useRef(false);

  useEffect(() => {
    if (!onLoadMore || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isRequestingRef.current) {
          isRequestingRef.current = true;
          onLoadMore();
          setTimeout(() => {
            isRequestingRef.current = false;
          }, 1000);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [onLoadMore, hasMore, loading, loadingMore]);

  useEffect(() => {
    const handleAdDoubleTapLike = (e: Event) => {
      const customEvent = e as CustomEvent<{ adId: number }>;
      const adId = customEvent.detail?.adId;
      if (!adId) return;

      const ad = ads.find(a => a.id === adId);
      if (ad) {
        const isAlreadyLiked = ad.user_has_liked || postReactions[ad.id];
        if (!isAlreadyLiked) {
          handleDirectPostLikeClick(ad);
        }
      }
    };

    window.addEventListener('ad-double-tap-like', handleAdDoubleTapLike);
    return () => {
      window.removeEventListener('ad-double-tap-like', handleAdDoubleTapLike);
    };
  }, [ads, postReactions]);

  const toggleTextExpand = (adId: number) => {
    setExpandedTextIds(prev => ({ ...prev, [adId]: !prev[adId] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full touch-pan-y">
        {[1, 2, 3].map((n) => (
          <div
            key={`post-skel-${n}`}
            className="rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-4 border border-[var(--border-default)] animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)]" />
              <div className="space-y-1 flex-1">
                <div className="h-3 bg-[var(--surface-subtle)] rounded w-2/3" />
                <div className="h-2 bg-[var(--surface-subtle)] rounded w-1/3" />
              </div>
            </div>
            <div className="aspect-square w-full bg-[var(--surface-subtle)] rounded-[var(--radius-md)]" />
          </div>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-12 px-4 space-y-3 w-full">
        <div className="w-10 h-10 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto border border-[var(--border-default)] shadow-2xs">
          <Megaphone size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {isRtl ? 'لا توجد منشورات حالياً' : 'No posts available'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {isRtl
              ? 'شارِك أفكارك أو منتجاتك الآن مع مجتمع بيربليكستا بورد!'
              : 'Share your posts or products with the Perplexta Board community!'}
          </p>
        </div>
        <button
          onClick={onCreateAdClick}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-accent transition-theme cursor-pointer border border-[var(--border-default)] rounded-[var(--radius-full)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)]"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>{isRtl ? 'إنشاء منشور' : 'Create Post'}</span>
        </button>
      </div>
    );
  }

  const visibleAds = ads
    .map(rawAd => ({ ...rawAd, ...(localAdOverrides[rawAd.id] || {}) }))
    .filter(ad => !hiddenAdIds.includes(ad.id) && ad.status !== 'archived' && ad.status !== 'trash');

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="grid grid-cols-1 gap-3 sm:gap-4 w-full max-w-2xl mx-auto px-1 sm:px-0 touch-pan-y relative"
    >
      {/* Pull to Refresh Indicator Banner */}
      <AnimatePresence>
        {(pullY > 0 || pullRefreshing || isRefreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: pullRefreshing || isRefreshing ? 48 : pullY, 
              opacity: Math.min(1, pullY / 25 || 1) 
            }}
            exit={{ height: 0, opacity: 0 }}
            className="col-span-full flex items-center justify-center gap-2 overflow-hidden text-xs font-bold text-[var(--fg-accent)] bg-[var(--surface-card)] rounded-[var(--radius-md)] border border-[var(--border-accent)]/30 py-2 shadow-xs transition-theme select-none"
          >
            <RefreshCw 
              size={15} 
              className={`text-[var(--fg-accent)] ${pullRefreshing || isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: pullRefreshing || isRefreshing ? undefined : `rotate(${pullY * 4}deg)` }}
            />
            <span>
              {pullRefreshing || isRefreshing
                ? (isRtl ? 'جاري تحديث الخلاصة...' : 'Refreshing feed...')
                : pullY >= 50
                ? (isRtl ? 'اترك الآن للتحديث' : 'Release to refresh')
                : (isRtl ? 'اسحب لأسفل للتحديث' : 'Pull down to refresh')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {visibleAds.map((ad, index) => {
          const isTextExpanded = !!expandedTextIds[ad.id];
          const isLongText = ad.description && ad.description.length > 280;

          return (
            <motion.div
              key={(ad as any)._virtualId || `bulletin-ad-${ad.id}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.22 } }}
              className={`rounded-[var(--radius-md)] ${
                activeMoreMenuId === ad.id || reactionBarAdId === ad.id
                  ? 'relative z-50 overflow-visible'
                  : 'relative z-10 overflow-hidden'
              }`}
            >
              {/* Standard Card Content without Swipe Gestures */}
              <article
                id={`bulletin-ad-${ad.id}`}
                className={`w-full rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs flex flex-col transition-theme ${
                  activeMoreMenuId === ad.id || reactionBarAdId === ad.id
                    ? 'relative z-50 overflow-visible'
                    : 'relative z-10 overflow-hidden'
                }`}
              >
            {/* Header: Author / Merchant Page info */}
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-[var(--border-default)] gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <BulletinAvatar
                  src={ad.page_id ? (ad.page_avatar || ad.author_avatar) : ad.author_avatar}
                  alt={ad.page_id ? (ad.page_name || ad.author_name) : ad.author_name}
                  size="sm"
                  isPage={Boolean(ad.page_id)}
                  onClick={() => {
                    if (ad.page_id && onOpenPageDetail) {
                      onOpenPageDetail(ad.page_id);
                    } else if (ad.user_id && onOpenUserDetail) {
                      onOpenUserDetail(ad.user_id);
                    }
                  }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4
                      onClick={() => {
                        if (ad.page_id && onOpenPageDetail) {
                          onOpenPageDetail(ad.page_id);
                        } else if (ad.user_id && onOpenUserDetail) {
                          onOpenUserDetail(ad.user_id);
                        }
                      }}
                      className="text-xs font-extrabold truncate text-[var(--text-primary)] cursor-pointer hover:text-[var(--fg-accent)] transition-colors"
                    >
                      {ad.page_id ? (ad.page_name || ad.author_name) : ad.author_name}
                    </h4>
                    {ad.page_is_verified && (
                      <CheckCircle2 size={13} className="text-[var(--fg-accent)] shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-[var(--text-muted)] pt-0.5 flex-wrap sm:flex-nowrap">
                    <span className="flex items-center gap-0.5 font-medium truncate max-w-[90px] sm:max-w-none">
                      <MapPin size={10} className="text-[var(--fg-accent)] shrink-0" />
                      {ad.location_city || 'فلسطين'}
                    </span>
                    <span>•</span>
                    <span className="font-medium shrink-0">
                      {new Date(ad.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </span>
                    <span>•</span>
                    <span 
                      className="flex items-center gap-0.5 font-medium cursor-help shrink-0"
                      title={
                        ad.audience === 'friends' ? (isRtl ? 'الجمهور: الأصدقاء' : 'Audience: Friends') :
                        ad.audience === 'only_me' ? (isRtl ? 'الجمهور: أنا فقط' : 'Audience: Only Me') :
                        (isRtl ? 'الجمهور: العامة' : 'Audience: Public')
                      }
                    >
                      {ad.audience === 'friends' ? (
                        <Users size={10} className="text-[var(--fg-accent)] shrink-0" />
                      ) : ad.audience === 'only_me' ? (
                        <Lock size={10} className="text-[var(--fg-warning)] shrink-0" />
                      ) : (
                        <Globe size={10} className="text-[var(--text-muted)] shrink-0" />
                      )}
                      <span className="text-[9px]">
                        {ad.audience === 'friends' ? (isRtl ? 'الأصدقاء' : 'Friends') :
                         ad.audience === 'only_me' ? (isRtl ? 'أنا فقط' : 'Only Me') :
                         (isRtl ? 'عام' : 'Public')}
                      </span>
                    </span>
                    {ad.is_boosted && (
                      <>
                        <span>•</span>
                        <span className="text-[var(--fg-warning)] font-bold shrink-0">{isRtl ? 'مُموَّل' : 'Sponsored'}</span>
                      </>
                    )}
                    {((ad as any).audio_title || (ad as any).audio_url) && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 shrink-0 max-w-[150px] truncate" title={(ad as any).audio_title}>
                          <Music size={10} className="shrink-0" />
                          <span className="truncate">{(ad as any).audio_title || (isRtl ? 'صوت أصلي' : 'Audio')}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {ad.is_ai_generated && (
                  <span className="h-8 min-w-[32px] px-2.5 rounded-shape-sm bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider shadow-2xs flex items-center justify-center shrink-0 select-none">
                    AI
                  </span>
                )}
                {ad.ad_format && ad.ad_format !== 'post' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (ad.ad_format === 'reel' && onOpenReelFeed) {
                        onOpenReelFeed(ad.id);
                      }
                    }}
                    className={`h-8 px-2.5 rounded-shape-sm border text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all duration-fast active:scale-95 shrink-0 cursor-pointer ${
                      ad.ad_format === 'reel' 
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20' 
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--fg-accent)] hover:bg-accent/10'
                    }`}
                    title={ad.ad_format === 'reel' ? (isRtl ? 'عرض الريلز' : 'View Reel') : (isRtl ? 'عرض القصة' : 'View Story')}
                  >
                    {ad.ad_format === 'reel' ? <Clapperboard size={13} className="text-purple-500" /> : <Camera size={13} className="text-[var(--fg-accent)]" />}
                    <span className="hidden sm:inline">{ad.ad_format === 'reel' ? (isRtl ? 'ريلز' : 'Reel') : (isRtl ? 'قصة' : 'Story')}</span>
                  </button>
                )}
                {ad.category && !['عام', 'general', 'عام / general', 'عام / General'].includes(ad.category.trim().toLowerCase()) && (
                  <span className="hidden sm:inline-flex h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--fg-accent)] text-xs font-bold items-center justify-center gap-1.5 shadow-2xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] shrink-0" />
                    <span>{ad.category}</span>
                  </span>
                )}

                {/* Edit & Delete Actions for Owners */}
                {user && (user.id === ad.user_id || user.is_admin) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onEditAd && (
                      <button
                        onClick={() => onEditAd(ad)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/40 text-[var(--text-muted)] hover:text-accent transition-all duration-fast active:scale-95 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                        title={isRtl ? 'تعديل المنشور' : 'Edit Post'}
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDeleteAd && (
                      <button
                        onClick={() => onDeleteAd(ad)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-500 transition-all duration-fast active:scale-95 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                        title={isRtl ? 'حذف المنشور' : 'Delete Post'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* More Actions Menu with Full Professional Facebook-Grade Suite */}
                <div className={`relative shrink-0 ${activeMoreMenuId === ad.id ? 'z-50' : 'z-10'}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMoreMenuId(activeMoreMenuId === ad.id ? null : ad.id);
                    }}
                    className={`w-8 h-8 rounded-shape-sm flex items-center justify-center border transition-all duration-fast active:scale-95 cursor-pointer shrink-0 shadow-2xs ${
                      activeMoreMenuId === ad.id
                        ? 'bg-accent/15 border-accent/40 text-accent font-bold'
                        : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-accent hover:bg-accent/10 hover:border-accent/40'
                    }`}
                    title={isRtl ? 'خيارات المنشور' : 'Post options'}
                  >
                    <MoreVertical size={14} />
                  </button>

                  <PostOptionsMenu
                    ad={ad}
                    user={user}
                    token={token}
                    isRtl={isRtl}
                    isOpen={activeMoreMenuId === ad.id}
                    onClose={() => setActiveMoreMenuId(null)}
                    onSaveAd={() => {
                      if (onToggleSave) onToggleSave(ad);
                      handleUpdateAd({ id: ad.id, user_has_saved: !ad.user_has_saved });
                    }}
                    onEditAd={() => {
                      if (onEditAd) onEditAd(ad);
                    }}
                    onArchiveAd={() => {
                      if (onArchiveAd) onArchiveAd(ad);
                      handleHideAd(ad.id);
                    }}
                    onTrashAd={() => {
                      if (onTrashAd) onTrashAd(ad);
                      else if (onDeleteAd) onDeleteAd(ad);
                      else handleHideAd(ad.id);
                    }}
                    onUpdateAd={handleUpdateAd}
                    onReportAd={() => {
                      if (onReportAd) onReportAd(ad);
                    }}
                    onHideAd={(id) => handleHideAd(id)}
                    onBoostAd={() => {
                      if (onBoostAd) onBoostAd(ad);
                    }}
                    dropdownAlign={isRtl ? 'left' : 'right'}
                  />
                </div>
              </div>
            </div>

            {/* Paid Partnership Banner if enabled */}
            {(ad.partnership_label_enabled || ad.is_partnership) && (
              <div className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[var(--status-warning-subtle)]/30 via-[var(--status-warning-subtle)]/50 to-[var(--status-warning-subtle)]/30 border-b border-[var(--status-warning)]/20 flex items-center gap-2 text-xs font-bold text-[var(--fg-warning)] shrink-0">
                <Handshake size={15} className="shrink-0 text-[var(--fg-warning)]" />
                <span>
                  {isRtl ? 'شراكة مدفوعة' : 'Paid Partnership'}
                  {(ad.partnership_sponsor_name || ad.partnership_brand) && (
                    <span className="font-extrabold mx-1 text-[var(--text-primary)]">
                      • {ad.partnership_sponsor_name || ad.partnership_brand}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Content: Title, Text & Hashtags */}
            <div className="p-4 space-y-3 w-full shrink-0 h-auto">
              {(() => {
                const cleanTitle = (ad.title || '').trim();
                const cleanDesc = (ad.description || '').trim();

                // Determine if title is truly distinct from description
                const cleanTitleStripped = cleanTitle.replace(/\.\.\.$/, '').trim();
                const isTitleSameAsDesc = !cleanTitle || !cleanDesc ||
                  cleanTitle.toLowerCase() === cleanDesc.toLowerCase() ||
                  cleanDesc.toLowerCase().startsWith(cleanTitleStripped.toLowerCase()) ||
                  cleanTitleStripped.toLowerCase().startsWith(cleanDesc.toLowerCase()) ||
                  !ad.ad_format ||
                  ad.ad_format === 'post' ||
                  ad.ad_format === 'feed' ||
                  ad.title === 'منشور جديد';

                const showTitleHeader = !isTitleSameAsDesc;
                const postBodyText = cleanDesc || cleanTitle;

                return (
                  <>
                    {showTitleHeader && (
                      <h3 className="text-sm sm:text-[15px] font-bold text-[var(--text-primary)] leading-snug">
                        {renderRichPostText(cleanTitle, searchQuery)}
                      </h3>
                    )}

                    <div className="w-full text-right dir-rtl">
                      <p 
                        data-expanded={isTextExpanded}
                        className="text-sm text-[var(--text-primary)] leading-relaxed line-clamp-3 data-[expanded=true]:line-clamp-none transition-all duration-200 whitespace-pre-wrap break-words"
                      >
                        {renderRichPostText(postBodyText, searchQuery)}
                      </p>
                      {postBodyText.length > 180 && (
                        <button
                          onClick={() => toggleTextExpand(ad.id)}
                          className="text-xs font-semibold text-[var(--fg-accent)] hover:underline mt-1 inline-block cursor-pointer"
                        >
                          {isTextExpanded 
                            ? (isRtl ? 'عرض أقل' : 'Show Less') 
                            : (isRtl ? 'عرض المزيد...' : 'See More...')}
                        </button>
                      )}
                    </div>

                    {/* Hashtags separated list */}
                    {(() => {
                      const rawTags: string[] = Array.isArray(ad.hashtags)
                        ? ad.hashtags
                        : typeof ad.hashtags === 'string'
                        ? (ad.hashtags as string).split(/[,\s]+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean)
                        : [];
                      if (rawTags.length === 0) return null;

                      const combinedText = `${cleanTitle} ${cleanDesc}`.toLowerCase();
                      const uniqueTags = rawTags.filter(tag => {
                        const clean = String(tag).replace(/^#/, '').trim().toLowerCase();
                        return clean && !combinedText.includes(`#${clean}`);
                      });

                      if (uniqueTags.length === 0) return null;

                      return (
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1">
                          {uniqueTags.map((tag, idx) => (
                            <span
                              key={`tag-${ad.id}-${tag}-${idx}`}
                              className="text-xs sm:text-[13px] font-bold text-[#1877F2] dark:text-[#3880FF] hover:underline cursor-pointer inline-block"
                            >
                              <HighlightText text={String(tag).startsWith('#') ? String(tag) : `#${String(tag)}`} query={searchQuery} />
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Tagged users and broadcast mentions separated list */}
                    {ad.tagged_users && Array.isArray(ad.tagged_users) && ad.tagged_users.length > 0 && (() => {
                      const processedTags: string[] = [];
                      const uniqueTaggedElements: any[] = [];

                      ad.tagged_users.forEach((tag: any) => {
                        let tagStr = typeof tag === 'object' && tag !== null ? (tag.username || tag.name || tag.id) : String(tag);
                        if (!tagStr) return;
                        tagStr = tagStr.trim();
                        
                        // Normalize name to deduplicate things like 'الجميع' and '@الجميع'
                        const normalized = tagStr.replace(/^@/, '').toLowerCase();
                        
                        // Also normalize broadcast words
                        let normKey = normalized;
                        if (normalized === 'الجميع' || normalized === 'everyone') {
                          normKey = 'everyone';
                        } else if (normalized === 'متابعين' || normalized === 'followers' || normalized.includes('متابعين')) {
                          normKey = 'followers';
                        }

                        if (!processedTags.includes(normKey)) {
                          processedTags.push(normKey);
                          uniqueTaggedElements.push({ tagStr, normKey });
                        }
                      });

                      const combinedText = `${cleanTitle} ${cleanDesc}`.toLowerCase();
                      const filteredElements = uniqueTaggedElements.filter(item => {
                        const isEveryone = item.normKey === 'everyone';
                        const isFollowers = item.normKey === 'followers';

                        if (isEveryone) {
                          return !combinedText.includes('@الجميع') && !combinedText.includes('@everyone');
                        }
                        if (isFollowers) {
                          return (
                            !combinedText.includes('@المتابعين') &&
                            !combinedText.includes('@متابعين') &&
                            !combinedText.includes('@followers') &&
                            !combinedText.includes('@اشارة')
                          );
                        }

                        const cleanName = item.tagStr.replace(/^@/, '').toLowerCase();
                        return !combinedText.includes(`@${cleanName}`);
                      });

                      if (filteredElements.length === 0) return null;

                      return (
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1">
                          {filteredElements.map((item, idx) => {
                            const isEveryone = item.normKey === 'everyone';
                            const isFollowers = item.normKey === 'followers';
                            return (
                              <span
                                key={`tagged-${ad.id}-${idx}`}
                                className="text-xs sm:text-[13px] font-bold text-[var(--accent)] hover:underline cursor-pointer inline-block"
                              >
                                {isEveryone ? '@الجميع' : isFollowers ? '@المتابعين' : `@${item.tagStr.replace(/^@/, '')}`}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Audio Track Badge / Player (Only for Audio-Only posts without visual media) */}
                    {(ad as any).audio_url && (!ad.media_gallery || ad.media_gallery.length === 0) && !ad.image_url && !ad.video_url && (
                      <div className="mt-2 p-2 sm:p-2.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              const audioUrl = getMediaUrl((ad as any).audio_url);
                              if (!audioPlayerRef.current) {
                                audioPlayerRef.current = new Audio();
                              }
                              if (playingAudioAdId === ad.id) {
                                audioPlayerRef.current.pause();
                                setPlayingAudioAdId(null);
                              } else {
                                audioPlayerRef.current.src = audioUrl;
                                audioPlayerRef.current.play().catch(() => {});
                                setPlayingAudioAdId(ad.id);
                                audioPlayerRef.current.onended = () => setPlayingAudioAdId(null);
                                if ((ad as any).audio_track_id) {
                                  fetch(`/api/audio/library/${(ad as any).audio_track_id}/use`, {
                                    method: 'POST',
                                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                                  }).catch(() => {});
                                }
                              }
                            }}
                            className={`w-7 h-7 rounded-shape-xs flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs relative before:absolute before:-inset-2 before:content-[''] ${
                              playingAudioAdId === ad.id
                                ? 'bg-accent text-white animate-pulse'
                                : 'bg-accent/20 hover:bg-accent/30 text-accent'
                            }`}
                            title={playingAudioAdId === ad.id ? (isRtl ? 'إيقاف' : 'Pause') : (isRtl ? 'تشغيل المقطع الصوتي' : 'Play Sound')}
                          >
                            {playingAudioAdId === ad.id ? <Pause size={13} /> : <Play size={13} className="ms-0.5 fill-current" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <Music size={11} className="text-accent shrink-0" />
                              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {(ad as any).audio_title || (isRtl ? 'مقطع صوتي أصلي' : 'Original Sound')}
                              </p>
                            </div>
                            <p className="text-[9px] text-[var(--text-muted)] truncate">
                              {(ad as any).audio_artist || ad.author_name || (isRtl ? 'مكتبة بيربليكستا' : 'Perplexta Audio')}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-shape-xs bg-accent/15 text-accent shrink-0">
                          {isRtl ? 'صوت أصلي' : 'Original Audio'}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Multi-Media Gallery (Mixed Images & Videos with Facebook Collage & Captions) */}
            <div className="w-full shrink-0 overflow-hidden bg-transparent">
              {ad.media_gallery && Array.isArray(ad.media_gallery) && ad.media_gallery.length > 0 ? (
                ad.media_gallery.length === 1 && ad.media_gallery[0].type === 'video' ? (
                  <div className="w-full relative flex items-center justify-center bg-black">
                    <MediaFormatPlayer
                      url={getMediaUrl(ad.media_gallery[0].url)}
                      resourceId={ad.id}
                      adFormat={ad.ad_format || 'feed'}
                      aspectRatio={(ad as any).aspect_ratio && (ad as any).aspect_ratio !== 'grid' && (ad as any).aspect_ratio !== 'auto' ? (ad as any).aspect_ratio : (ad.ad_format === 'reel' || ad.ad_format === 'story' ? '4:5' : 'auto')}
                      posterUrl={getMediaUrl(ad.media_gallery[0].thumbnailUrl || ad.image_url)}
                      title={ad.title}
                      isRtl={isRtl}
                      onOpenReels={() => {
                        try {
                          document.querySelectorAll('video').forEach(v => {
                            try {
                              v.pause();
                              v.muted = true;
                            } catch (_) {}
                          });
                        } catch (_) {}
                        if (onOpenReelFeed) {
                          onOpenReelFeed(ad.id);
                        } else {
                          window.dispatchEvent(new CustomEvent('open-reel-fullscreen', {
                            detail: { adId: ad.id, url: getMediaUrl(ad.media_gallery?.[0]?.url || '') }
                          }));
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <MultiImageGallery
                    mediaGallery={ad.media_gallery}
                    layout={(ad as any).aspect_ratio || 'grid'}
                    onOpenLightbox={(url, items, index) => onOpenLightbox(url, items, index, ad.title, ad.author_name, ad)}
                    isRtl={isRtl}
                    adTitle={ad.title}
                    adFormat={ad.ad_format}
                  />
                )
              ) : (
                <>
                  {/* Legacy Media Image: Aspect ratio based on format or MultiImage Gallery */}
                  {ad.image_url && !ad.video_url && (() => {
                    const images = ad.image_url.split(',').map(img => getMediaUrl(img.trim())).filter(Boolean);
                    return (
                      <MultiImageGallery
                        images={images}
                        layout={(ad as any).aspect_ratio || 'grid'}
                        onOpenLightbox={(url, items, index) => onOpenLightbox(url, items, index, ad.title, ad.author_name, ad)}
                        isRtl={isRtl}
                        adTitle={ad.title}
                        adFormat={ad.ad_format}
                      />
                    );
                  })()}

                  {/* Legacy Promotional Video / Reels Media Section with Multi-Format Player */}
                  {ad.video_url && (
                    <div className="w-full relative flex items-center justify-center bg-black">
                      <MediaFormatPlayer
                        url={getMediaUrl(ad.video_url)}
                        resourceId={ad.id}
                        adFormat={ad.ad_format || 'feed'}
                        aspectRatio={(ad as any).aspect_ratio && (ad as any).aspect_ratio !== 'grid' && (ad as any).aspect_ratio !== 'auto' ? (ad as any).aspect_ratio : (ad.ad_format === 'reel' || ad.ad_format === 'story' ? '4:5' : 'auto')}
                        posterUrl={getMediaUrl(ad.image_url)}
                        title={ad.title}
                        isRtl={isRtl}
                        onOpenReels={() => {
                          try {
                            document.querySelectorAll('video').forEach(v => {
                              try {
                                v.pause();
                                v.muted = true;
                              } catch (_) {}
                            });
                          } catch (_) {}
                          if (onOpenReelFeed) {
                            onOpenReelFeed(ad.id);
                          } else {
                            window.dispatchEvent(new CustomEvent('open-reel-fullscreen', {
                              detail: { adId: ad.id, url: getMediaUrl(ad.video_url || '') }
                            }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ========================================================== */}
            {/* UNIFIED COMPACT MERCHANDISING & ACTION ROW */}
            {/* ========================================================== */}
            <div className="py-1 px-1.5 sm:px-4 bg-[var(--surface-subtle)]/30 flex items-center justify-between border-t border-[var(--border-default)] w-full shrink-0">
              <div className="flex items-center justify-around w-full gap-1 sm:gap-2">
                {/* 1. Boost / Promote Button */}
                {onBoostAd ? (
                  <button
                    onClick={() => onBoostAd(ad)}
                    className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-base active:scale-95 cursor-pointer py-2 font-bold text-[11px] sm:text-xs select-none ${
                      ad.is_boosted
                        ? 'text-[var(--fg-warning)] hover:opacity-90'
                        : 'text-[var(--text-muted)] hover:text-[var(--fg-warning)]'
                    }`}
                    title={isRtl ? 'ترويج الإعلان' : 'Boost Ad'}
                  >
                    <Rocket size={14} className="shrink-0" />
                    <span className="truncate">
                      {ad.is_boosted ? (isRtl ? 'تمديد' : 'Extend') : (isRtl ? 'ترويج' : 'Boost')}
                    </span>
                  </button>
                ) : null}

                {/* 2. Insights / Stats Button (الرؤى) */}
                <button
                  onClick={() => setActiveInsightsAdId(activeInsightsAdId === ad.id ? null : ad.id)}
                  className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-base active:scale-95 cursor-pointer py-2 font-bold text-[11px] sm:text-xs select-none ${
                    activeInsightsAdId === ad.id
                      ? 'text-[var(--fg-accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={isRtl ? 'الرؤى والتحليلات' : 'Insights & Analytics'}
                >
                  <BarChart2 size={14} className="shrink-0" />
                  <span className="truncate">{isRtl ? 'الرؤى' : 'Insights'}</span>
                </button>

                {/* 3. Direct Message (Chat) Button */}
                <button
                  onClick={() => {
                    setActiveChatAdId(activeChatAdId === ad.id ? null : ad.id);
                    if (onMessageAdvertiser) onMessageAdvertiser(ad);
                  }}
                  disabled={messagingAdId === ad.id}
                  className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-base active:scale-95 cursor-pointer py-2 font-bold text-[11px] sm:text-xs select-none ${
                    activeChatAdId === ad.id
                      ? 'text-[var(--fg-accent)] font-extrabold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={isRtl ? 'مراسلة المعلن' : 'Message'}
                >
                  {messagingAdId === ad.id ? (
                    <Loader2 size={14} className="animate-spin text-[var(--fg-accent)] shrink-0" />
                  ) : (
                    <>
                      <MessageCircle size={14} className="shrink-0" />
                      <span className="truncate">{isRtl ? 'مراسلة' : 'Message'}</span>
                    </>
                  )}
                </button>

                {/* 4. WhatsApp Button */}
                {(ad.whatsapp_number || ad.has_whatsapp_button) && (
                  <button
                    onClick={(e) => onWhatsApp(ad, e)}
                    className="flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-base active:scale-95 cursor-pointer py-2 font-bold text-[11px] sm:text-xs select-none text-[#25D366]/80 hover:text-[#25D366]"
                    title={isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}
                  >
                    <Phone size={14} className="shrink-0" />
                    <span className="truncate">{isRtl ? 'واتساب' : 'WhatsApp'}</span>
                  </button>
                )}

                {/* 5. Phone Call Button */}
                {ad.phone_number && !(ad.whatsapp_number || ad.has_whatsapp_button) && (
                  <a
                    href={`tel:${ad.phone_number}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-base active:scale-95 cursor-pointer py-2 font-bold text-[11px] sm:text-xs select-none text-[var(--fg-accent)]/80 hover:text-[var(--fg-accent)] decoration-none"
                    title={isRtl ? `اتصال: ${ad.phone_number}` : `Call: ${ad.phone_number}`}
                  >
                    <PhoneCall size={14} className="shrink-0" />
                    <span className="truncate">{isRtl ? 'اتصال' : 'Call'}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Insights Drawer (Opens right under Row 2) */}
            <AnimatePresence>
              {activeInsightsAdId === ad.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[var(--border-accent)]/30 bg-[var(--surface-card)] p-2 overflow-hidden"
                >
                  <AdInsightsTab
                    adId={ad.id}
                    isRtl={isRtl}
                    token={token}
                    onBoostClick={onBoostAd ? () => onBoostAd(ad) : undefined}
                    onClose={() => setActiveInsightsAdId(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Row (Likes, Comments, Shares) - Only shown if there is active engagement */}
            {(ad.likes_count > 0 || ad.comments_count > 0 || (ad.shares_count || 0) > 0) && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-default)] text-[13px] text-[var(--text-muted)] shrink-0">
                <div className="flex items-center gap-1">
                  {ad.likes_count > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-shape-xs bg-[var(--bg-accent-muted)] flex items-center justify-center ring-1 ring-[var(--border-accent)]/25 z-10 text-[11px] select-none">
                        {(() => {
                          const activeReactId = postReactions[ad.id] || ad.user_reaction;
                          const activeReaction = FB_REACTIONS.find((r) => r.id === activeReactId);
                          return activeReaction ? activeReaction.emoji : '👍';
                        })()}
                      </div>
                      <span className="font-semibold text-[var(--text-secondary)]">{formatCompactCount(ad.likes_count)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  {ad.comments_count > 0 && (
                    <span>{formatCompactCount(ad.comments_count)} {isRtl ? 'تعليق' : 'Comments'}</span>
                  )}
                  {(ad.shares_count || 0) > 0 && (
                    <span>{formatCompactCount(ad.shares_count)} {isRtl ? 'مشاركة' : 'Shares'}</span>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar (Like, Comment, Share, Save) */}
            <div className="flex items-center justify-around w-full py-2 px-1 sm:px-6 border-t border-[var(--border-default)] relative z-20 bg-[var(--surface-card)] shrink-0">
               {/* Like Button with Hover Emoji Bar */}
               <div 
                 className="flex-1 flex items-center justify-center shrink-0 relative group"
                 onMouseEnter={() => handleLikeMouseEnter(ad.id)}
                 onMouseLeave={handleLikeMouseLeave}
               >
                 <AnimatePresence>
                   {reactionBarAdId === ad.id && (
                     <div
                       className={`absolute bottom-full pb-2.5 z-50 pointer-events-auto ${
                         isRtl
                           ? 'right-0 sm:right-1 origin-bottom-right'
                           : 'left-0 sm:left-1 origin-bottom-left'
                       } max-w-[calc(100vw-24px)]`}
                       onMouseEnter={() => handleBarMouseEnter(ad.id)}
                       onMouseLeave={handleLikeMouseLeave}
                     >
                       <motion.div
                         initial={{ opacity: 0, y: 6, scale: 0.88 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 4, scale: 0.88 }}
                         transition={{ duration: 0.16, ease: 'easeOut' }}
                         className="vb-emoji-bar w-auto select-none shadow-xl"
                         onMouseEnter={() => handleBarMouseEnter(ad.id)}
                         onMouseLeave={handleLikeMouseLeave}
                       >
                         {FB_REACTIONS.map((reac) => (
                           <button
                             key={reac.id}
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleSelectPostReaction(ad.id, reac.id);
                             }}
                             onMouseEnter={() => {
                               handleBarMouseEnter(ad.id);
                               setHoveredReactionId(reac.id);
                             }}
                             onMouseLeave={() => setHoveredReactionId(null)}
                             className="vb-emoji-btn relative group/reac text-sm sm:text-base focus:outline-none select-none"
                             title={isRtl ? reac.labelAr : reac.labelEn}
                           >
                             <span className="block transform-gpu shrink-0">{reac.emoji}</span>
                             {hoveredReactionId === reac.id && (
                               <span className="hidden sm:block absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--surface-overlay)] text-[var(--text-primary)] text-[9px] font-bold py-0.5 px-1.5 rounded-shape-xs whitespace-nowrap pointer-events-none shadow-md z-50">
                                 {isRtl ? reac.labelAr : reac.labelEn}
                               </span>
                             )}
                           </button>
                         ))}
                       </motion.div>
                     </div>
                   )}
                 </AnimatePresence>
                 {(() => {
                   const activeReaction = FB_REACTIONS.find((r) => r.id === postReactions[ad.id]);
                   const isLiked = activeReaction || ad.user_has_liked;
                   return (
                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDirectPostLikeClick(ad);
                       }}
                       onTouchStart={() => handleTouchStartLike(ad.id)}
                       onTouchEnd={handleTouchEndLike}
                       onContextMenu={(e) => {
                         e.preventDefault();
                         setReactionBarAdId((prev) => (prev === ad.id ? null : ad.id));
                       }}
                       className={`vb-interaction-btn ${isLiked ? 'liked' : ''}`}
                       title={activeReaction ? (isRtl ? activeReaction.labelAr : activeReaction.labelEn) : (isRtl ? 'أعجبني' : 'Like')}
                     >
                       {activeReaction ? (
                         <span className="text-sm">{activeReaction.emoji}</span>
                       ) : (
                         <ThumbsUp size={14} className={ad.user_has_liked ? 'fill-current' : ''} />
                       )}
                     </button>
                   );
                 })()}
               </div>
               
               <div className="flex-1 flex items-center justify-center shrink-0">
                 <button 
                   onClick={() => onToggleComments(ad.id)}
                   className={`vb-interaction-btn ${expandedAdId === ad.id ? 'active' : ''}`}
                   title={isRtl ? 'تعليق' : 'Comment'}
                 >
                   <MessageSquare size={14} />
                 </button>
               </div>
 
               <div className="flex-1 flex items-center justify-center shrink-0 relative">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     if (onShare) {
                       onShare(ad);
                     } else {
                       setActiveShareMenuId(activeShareMenuId === ad.id ? null : ad.id);
                     }
                   }}
                   className={`vb-interaction-btn ${activeShareMenuId === ad.id ? 'active' : ''}`}
                   title={isRtl ? 'مشاركة' : 'Share'}
                 >
                   <Share2 size={14} />
                 </button>
                 <AnimatePresence>
                    {activeShareMenuId === ad.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveShareMenuId(null); }} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 6 }}
                          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute bottom-full mb-1.5 ${isRtl ? 'left-0' : 'right-0'} z-40 w-max min-w-[170px] bg-[var(--surface-card)] border border-[var(--border-main)] rounded-shape-md shadow-xl p-1 flex flex-col gap-0.5 text-xs backdrop-blur-xl`}
                          dir={isRtl ? 'rtl' : 'ltr'}
                        >
                          <div className="px-2 py-1 border-b border-[var(--border-default)]/60 text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
                            <span>{isRtl ? 'خيارات المشاركة' : 'Share Options'}</span>
                            <Share2 size={11} />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(ad); setActiveShareMenuId(null); }}
                            className="w-full h-[32px] min-h-[32px] flex items-center gap-2 px-2.5 py-1 rounded-shape-xs border border-transparent text-[11.5px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer select-none text-start"
                          >
                            <Link size={13.5} className="text-[var(--text-muted)] shrink-0" />
                            <span className="truncate">{isRtl ? 'نسخ الرابط' : 'Copy link'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(ad); setActiveShareMenuId(null); }}
                            className="w-full h-[32px] min-h-[32px] flex items-center gap-2 px-2.5 py-1 rounded-shape-xs border border-transparent text-[11.5px] font-semibold text-[#25D366] hover:bg-[#25D366]/10 transition-all cursor-pointer select-none text-start"
                          >
                            <MessageCircle size={13.5} className="text-[#25D366] shrink-0" />
                            <span className="truncate">{isRtl ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
               </div>
               
               {onToggleSave && (
                 <div className="flex items-center justify-center shrink-0">
                   <button
                     onClick={(e) => { e.stopPropagation(); onToggleSave(ad); }}
                     className={`vb-interaction-btn ${ad.user_has_saved ? 'saved' : ''}`}
                     title={isRtl ? 'حفظ' : 'Bookmark'}
                   >
                     <Bookmark size={14} className={ad.user_has_saved ? 'fill-current' : ''} />
                   </button>
                 </div>
               )}
            </div>

            {/* Interactive Comments Drawer */}
            <AnimatePresence>
              {expandedAdId === ad.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[var(--border-default)] p-4 bg-[var(--surface-subtle)] space-y-3"
                >
                  <h5 className="text-[11px] font-extrabold text-[var(--text-muted)] flex items-center gap-1">
                    <MessageSquare size={13} className="text-[var(--fg-accent)]" />
                    <span>{isRtl ? 'التعليقات والتفاعلات:' : 'Comments & Discussion:'}</span>
                  </h5>

                  {loadingCommentsAdId === ad.id ? (
                    <div className="text-center py-2 text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-[var(--fg-accent)]" />
                      <span>{isRtl ? 'جاري تحميل التعليقات...' : 'Loading comments...'}</span>
                    </div>
                  ) : (commentsMap[ad.id] || []).length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic text-center py-1">
                      {isRtl ? 'لا توجد تعليقات بعد، كن أول من يعلق!' : 'No comments yet. Be the first!'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pe-1 scrollbar-thin">
                      {(commentsMap[ad.id] || []).map((comment, cIdx) => (
                        <div
                          key={`comment-${ad.id}-${comment.id || cIdx}-${cIdx}`}
                          className="flex gap-2 items-start text-[11px] group"
                        >
                          <div className="shrink-0 pt-0.5">
                            <BulletinAvatar
                              src={comment.author_avatar}
                              alt={comment.author_name}
                              size="sm"
                              fallbackText={comment.author_name}
                              onClick={() => {
                                if (comment.user_id && onOpenUserDetail) {
                                  onOpenUserDetail(comment.user_id);
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-[var(--surface-card)] p-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs">
                              <span
                                onClick={() => {
                                  if (comment.user_id && onOpenUserDetail) {
                                    onOpenUserDetail(comment.user_id);
                                  }
                                }}
                                className="font-extrabold text-xs block truncate text-[var(--text-primary)] cursor-pointer hover:text-[var(--fg-accent)] transition-colors"
                              >
                                {comment.author_name}
                              </span>
                              <p className={`mt-0.5 whitespace-pre-wrap break-words leading-relaxed text-[var(--text-secondary)] ${comment.parent_id ? 'pl-4 border-l-2 border-[var(--border-accent)]/20' : ''}`}>
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 px-2 mt-1 text-[10px] text-[var(--text-muted)] font-bold">
                              <span className="font-medium text-[var(--text-muted)]">
                                {new Date(comment.created_at).toLocaleTimeString(
                                  isRtl ? 'ar-EG' : 'en-US',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </span>
                              <button
                                onClick={() => onToggleCommentLike && onToggleCommentLike(ad.id, comment.id, 'like')}
                                className={`hover:underline cursor-pointer flex items-center gap-0.5 ${
                                  comment.user_reaction ? 'text-[var(--fg-accent)] font-extrabold' : 'hover:text-[var(--text-primary)]'
                                }`}
                              >
                                {comment.user_reaction ? (isRtl ? 'أعجبني' : 'Liked') : (isRtl ? 'إعجاب' : 'Like')}
                                {comment.like_count ? ` (${comment.like_count})` : ''}
                              </button>
                              <button
                                onClick={() => setReplyToCommentId(comment.id)}
                                className="hover:underline hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                {isRtl ? 'رد' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="pt-2">
                    {/* Quick Emojis Bar */}
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none fade-edges">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewCommentText(newCommentText + emoji)}
                          className="shrink-0 text-lg hover:scale-110 transition-transform active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onAddComment(ad.id, replyToCommentId || undefined);
                          }
                        }}
                        placeholder={replyToCommentId ? (isRtl ? 'اكتب ردك...' : 'Write a reply...') : (isRtl ? 'اكتب تعليقك هنا...' : 'Write a comment...')}
                        className="flex-1 h-8 px-3 text-xs rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/40 focus:border-accent/40 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-fast shadow-2xs"
                      />
                      <button
                        onClick={() => onAddComment(ad.id, replyToCommentId || undefined)}
                        disabled={!newCommentText.trim()}
                        className="h-8 px-3 rounded-shape-sm bg-accent text-[var(--text-primary)] hover:opacity-90 disabled:opacity-40 font-bold text-xs transition-all duration-fast shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {isRtl ? 'إرسال' : 'Send'}
                      </button>
                      {replyToCommentId && (
                        <button 
                          onClick={() => setReplyToCommentId(null)}
                          className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-colors px-1 py-1"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-time E2E Encrypted Direct Inquiry Drawer */}
            <AnimatePresence>
              {activeChatAdId === ad.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[var(--border-default)] p-4 bg-[var(--surface-subtle)]"
                >
                  <AdDirectChat
                    ad={ad}
                    onClose={() => setActiveChatAdId(null)}
                    isCompact={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
              </article>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Infinite Scroll Intersection Observer Sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="col-span-full py-6 text-center flex flex-col items-center justify-center gap-2"
        >
          {loadingMore ? (
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--fg-accent)] bg-[var(--bg-accent-muted)] px-5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border-accent)]/20 shadow-sm animate-pulse">
              <Loader2 size={16} className="animate-spin text-[var(--fg-accent)]" />
              <span>{isRtl ? 'جاري تحميل المزيد من الإعلانات...' : 'Fetching more advertisements...'}</span>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1 opacity-80">
              <Loader2 size={12} className="animate-spin" />
              <span>{isRtl ? 'تمرير لأسفل لتحميل المزيد...' : 'Scroll down to load more...'}</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && ads.length > 0 && (
        <div className="col-span-full py-6 text-center flex flex-col items-center justify-center gap-2 border-t border-[var(--border-default)] mt-4">
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {isRtl ? '✨ وصلت إلى نهاية الإعلانات المتاحة' : '✨ You have reached the end of available ads'}
          </span>
          {onLoadMore && (
            <button
              onClick={onLoadMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border-default)] hover:border-[var(--border-accent)] text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{isRtl ? 'تحديث ومواصلة التصفح المستمر' : 'Reload for continuous browsing'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
