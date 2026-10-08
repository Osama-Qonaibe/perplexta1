import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, RotateCw,
  Maximize2, Minimize2, Tag, Download, MessageSquare, Share2,
  Smile, Send, ExternalLink, MoreHorizontal, Rocket, FileText,
  Camera, Film, Sparkles, Copy, Check, ThumbsUp, Globe,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Edit3, ArrowRight, ArrowLeft, Users, Loader2, Play, Pause, Lock, Handshake,
  Bookmark
} from 'lucide-react';
import { BulletinAd, BulletinAdComment } from '../../server/db/types';
import { getMediaUrl } from '../utils/mediaUtils';
import { BulletinAvatar } from './BulletinAvatar';
import { PostOptionsMenu } from './PostOptionsMenu';
import { toast } from '@/design-system';

export interface LightboxMediaItem {
  id?: string;
  url: string;
  type?: 'image' | 'video';
  caption?: string;
  thumbnailUrl?: string;
}

export interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LightboxMediaItem[];
  initialIndex?: number;
  isRtl: boolean;
  postTitle?: string;
  authorName?: string;
  ad?: BulletinAd | null;
  comments?: BulletinAdComment[];
  loadingComments?: boolean;
  onToggleLike?: (adId: number) => void;
  onAddComment?: (adId: number, content: string) => Promise<void>;
  onToggleCommentLike?: (adId: number, commentId: number, reaction?: string) => void;
  onShare?: (ad: BulletinAd) => void;
  onBoostAd?: (ad: BulletinAd) => void;
  onEditAd?: (ad: BulletinAd) => void;
  onViewPost?: (adId: number) => void;
  onArchiveAd?: (ad: BulletinAd) => void;
  onTrashAd?: (ad: BulletinAd) => void;
  onToggleSave?: (ad: BulletinAd) => void;
  onUpdateAd?: (updatedAd: Partial<BulletinAd> & { id: number }) => void;
  onOpenPageDetail?: (pageId: number) => void;
  user?: any;
  token?: string | null;
}

const FB_REACTIONS = [
  { id: 'like', labelAr: 'أعجبني', labelEn: 'Like', emoji: '👍', color: 'text-accent' },
  { id: 'love', labelAr: 'أحببته', labelEn: 'Love', emoji: '❤️', color: 'text-rose-500' },
  { id: 'care', labelAr: 'أدعمه', labelEn: 'Care', emoji: '🥰', color: 'text-[var(--fg-warning)]' },
  { id: 'haha', labelAr: 'هاهاها', labelEn: 'Haha', emoji: '😂', color: 'text-[var(--fg-warning)]' },
  { id: 'wow', labelAr: 'واو', labelEn: 'Wow', emoji: '😮', color: 'text-[var(--fg-warning)]' },
  { id: 'sad', labelAr: 'أحزنني', labelEn: 'Sad', emoji: '😢', color: 'text-[var(--fg-warning)]' },
  { id: 'angry', labelAr: 'أغضبني', labelEn: 'Angry', emoji: '😡', color: 'text-orange-600' }
];

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '😮', '🎉', '💯', '🚀', '😍', '✨', '🙏'];

const formatCompactCount = (count: number | string | undefined): string => {
  if (count === undefined || count === null) return '0';
  const num = typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
};

const formatRelativeTime = (dateInput: Date | string | undefined, isRtl: boolean): string => {
  if (!dateInput) return isRtl ? 'الآن' : 'Just now';
  const now = new Date();
  const date = new Date(dateInput);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return isRtl ? 'الآن' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return isRtl ? 'دقيقة واحدة' : '1 min';
  if (diffMin < 60) return isRtl ? `${diffMin} دقيقة` : `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return isRtl ? 'ساعة واحدة' : '1h';
  if (diffHours < 24) return isRtl ? `${diffHours} ساعة` : `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return isRtl ? 'أمس' : 'Yesterday';
  if (diffDays < 7) return isRtl ? `${diffDays} أيام` : `${diffDays}d`;
  return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
};

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  isRtl,
  postTitle,
  authorName,
  ad,
  comments,
  loadingComments: propLoadingComments,
  onToggleLike,
  onAddComment,
  onToggleCommentLike,
  onShare,
  onBoostAd,
  onEditAd,
  onViewPost,
  onArchiveAd,
  onTrashAd,
  onToggleSave,
  onUpdateAd,
  user,
  token,
  onOpenPageDetail
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Engagement & Reactions State
  const [userReaction, setUserReaction] = useState<string | null>(ad?.user_has_liked ? 'like' : null);
  const [localSavedState, setLocalSavedState] = useState<boolean>(ad?.user_has_saved || false);
  const [likesCount, setLikesCount] = useState(ad?.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(ad?.comments_count || 0);
  const sharesCount = ad?.shares_count || 0;
  const [isHoveringReactions, setIsHoveringReactions] = useState(false);
  const [hoveredReactionId, setHoveredReactionId] = useState<string | null>(null);
  const hoverIntentTimerRef = useRef<any>(null);
  const hoverReactionTimerRef = useRef<any>(null);
  const touchTimerRef = useRef<any>(null);

  // Comments State
  const [commentsList, setCommentsList] = useState<BulletinAdComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  // Share Menu State
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMobileOptionsMenu, setShowMobileOptionsMenu] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(true);

  // Mobile Touch Gestures & Pinch Tracking
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    initialDistance: number | null;
    initialZoom: number;
    lastTapTime: number;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    initialDistance: null,
    initialZoom: 1,
    lastTapTime: 0,
  });

  const handleDirectShare = async () => {
    if (!ad) return;
    if (onShare) {
      onShare(ad);
      return;
    }
    const shareUrl = `${window.location.origin}/bulletin/${ad.id}`;
    try {
      fetch(`/api/bulletin/ads/${ad.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user?.id,
          sharer_name: user?.name || user?.email,
        })
      }).catch(() => {});
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title || postTitle || (isRtl ? 'منشور ببربليكستا' : 'Perplexta Post'),
          text: ad.description || (isRtl ? 'شاهد هذا المنشور' : 'Check out this post'),
          url: shareUrl
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success(isRtl ? 'تم نسخ رابط المنشور بنجاح' : 'Post link copied to clipboard');
    } catch (err) {}
  };

  // Workspace Dominance Protocol: Isolate canvas & hide extraneous background sidebars
  useModalScrollLock(isOpen, 'media-viewer');

  // Sync index and ad data when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setIsSlideshowPlaying(false);
      setIsFullscreen(!!document.fullscreenElement);
      setUserReaction(ad?.user_has_liked ? 'like' : null);
      setLocalSavedState(ad?.user_has_saved || false);
      setLikesCount(ad?.likes_count || 0);
      setCommentsCount(ad?.comments_count || 0);
    }
  }, [isOpen, initialIndex, items.length, ad]);

  // Fetch comments if ad is provided and comments are not passed
  useEffect(() => {
    if (!isOpen || !ad) return;

    if (comments && comments.length > 0) {
      setCommentsList(comments);
      return;
    }

    let isMounted = true;
    setIsLoadingComments(true);
    fetch(`/api/bulletin/ads/${ad.id}/comments`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setCommentsList(data.comments || []);
          if (data.comments?.length) {
            setCommentsCount(data.comments.length);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingComments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, ad, comments]);

  const totalCount = items.length;
  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalCount - 1 : prev - 1));
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [totalCount]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalCount - 1 ? 0 : prev + 1));
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [totalCount]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, +(z - 0.25).toFixed(2));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const toggleSlideshow = () => {
    setIsSlideshowPlaying((prev) => !prev);
  };

  // Slideshow automatic advancement
  useEffect(() => {
    if (!isSlideshowPlaying || totalCount <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [isSlideshowPlaying, totalCount, handleNext]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in comment input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (isRtl) handlePrev();
        else handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (isRtl) handleNext();
        else handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === ' ' && totalCount > 1) {
        e.preventDefault();
        toggleSlideshow();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRtl, handleNext, handlePrev, onClose, totalCount, isSlideshowPlaying]);

  // Mouse pan handlers for zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click to toggle zoom (1x <-> 2x)
  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      handleResetZoom();
    }
  };

  // Mobile Touch Gestures (Swipe to change/close/comments, Pinch-to-zoom, Double-tap)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStateRef.current.startX = e.touches[0].clientX;
      touchStateRef.current.startY = e.touches[0].clientY;
      touchStateRef.current.startTime = Date.now();
      touchStateRef.current.initialDistance = null;
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      }
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current.initialDistance = dist;
      touchStateRef.current.initialZoom = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.initialDistance) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStateRef.current.initialDistance;
      const newZoom = Math.min(3, Math.max(1, +(touchStateRef.current.initialZoom * scale).toFixed(2)));
      setZoom(newZoom);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && zoom > 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (e.touches.length === 0) {
      const now = Date.now();
      const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStateRef.current.startX;
      const deltaY = (e.changedTouches[0]?.clientY || 0) - touchStateRef.current.startY;
      const elapsed = now - touchStateRef.current.startTime;

      // Handle double tap
      if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && elapsed < 300) {
        if (now - touchStateRef.current.lastTapTime < 300) {
          // Double tap detected!
          if (zoom > 1) {
            handleResetZoom();
          } else {
            setZoom(2);
          }
          touchStateRef.current.lastTapTime = 0;
          return;
        }
        touchStateRef.current.lastTapTime = now;
        // Single tap toggles mobile controls overlay
        if (zoom === 1) {
          setShowMobileControls((prev) => !prev);
        }
      }

      // If not zoomed, handle swipe navigation and dismissal
      if (zoom === 1) {
        // Horizontal swipe for next/prev
        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && elapsed < 500) {
          if (deltaX > 0) {
            if (isRtl) handleNext();
            else handlePrev();
          } else {
            if (isRtl) handlePrev();
            else handleNext();
          }
        }
        // Swipe down to close modal
        else if (deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && elapsed < 500) {
          onClose();
        }
        // Swipe up to open comments / details drawer
        else if (deltaY < -70 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && elapsed < 500) {
          setIsMobileDrawerOpen(true);
        }
      }
    }
  };

  // Reaction picker hover & touch handlers (Rock-solid inward containment & deliberate delay)
  const handleLikeMouseEnter = () => {
    if (hoverReactionTimerRef.current) {
      clearTimeout(hoverReactionTimerRef.current);
      hoverReactionTimerRef.current = null;
    }
    if (isHoveringReactions) return;

    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
    }
    hoverIntentTimerRef.current = setTimeout(() => {
      setIsHoveringReactions(true);
      hoverIntentTimerRef.current = null;
    }, 260);
  };

  const handleLikeMouseLeave = () => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (hoverReactionTimerRef.current) {
      clearTimeout(hoverReactionTimerRef.current);
    }
    hoverReactionTimerRef.current = setTimeout(() => {
      setIsHoveringReactions(false);
      setHoveredReactionId(null);
      hoverReactionTimerRef.current = null;
    }, 250);
  };

  const handleBarMouseEnter = () => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (hoverReactionTimerRef.current) {
      clearTimeout(hoverReactionTimerRef.current);
      hoverReactionTimerRef.current = null;
    }
    setIsHoveringReactions(true);
  };

  const handleTouchStartLike = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    touchTimerRef.current = setTimeout(() => {
      setIsHoveringReactions(true);
    }, 320);
  };

  const handleTouchEndLike = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleSelectReaction = (reactionId: string) => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (hoverReactionTimerRef.current) {
      clearTimeout(hoverReactionTimerRef.current);
      hoverReactionTimerRef.current = null;
    }
    setIsHoveringReactions(false);
    setHoveredReactionId(null);
    if (!ad) return;

    if (userReaction === reactionId) {
      // Toggle off
      setUserReaction(null);
      setLikesCount((prev) => Math.max(0, prev - 1));
      if (onToggleLike) onToggleLike(ad.id);
    } else {
      // Set new reaction
      if (!userReaction) {
        setLikesCount((prev) => prev + 1);
      }
      setUserReaction(reactionId);
      if (onToggleLike) onToggleLike(ad.id);
    }
  };

  const handleDirectLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    if (hoverReactionTimerRef.current) {
      clearTimeout(hoverReactionTimerRef.current);
      hoverReactionTimerRef.current = null;
    }
    setIsHoveringReactions(false);
    setHoveredReactionId(null);

    if (!ad) return;
    if (userReaction) {
      setUserReaction(null);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setUserReaction('like');
      setLikesCount((prev) => prev + 1);
    }
    if (onToggleLike) onToggleLike(ad.id);
  };

  // Comment submission handler
  const handleSendComment = async () => {
    const text = newCommentText.trim();
    if (!text || isSubmittingComment) return;

    if (!token && !user) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول للتعليق' : 'Please log in to comment');
      return;
    }
    if (!ad) return;

    setIsSubmittingComment(true);
    setNewCommentText('');
    setShowEmojiPicker(false);

    // Optimistic comment
    const tempComment: BulletinAdComment = {
      id: Date.now(),
      ad_id: ad.id,
      user_id: user?.id || 0,
      author_name: user?.name || user?.email || (isRtl ? 'أنا' : 'Me'),
      author_avatar: user?.avatar || null,
      content: text,
      created_at: new Date().toISOString()
    };
    setCommentsList((prev) => [...prev, tempComment]);
    setCommentsCount((c) => c + 1);

    // Scroll to bottom
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
      }
    }, 50);

    try {
      if (onAddComment) {
        await onAddComment(ad.id, text);
      } else {
        const res = await fetch(`/api/bulletin/ads/${ad.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ content: text })
        });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.error || (isRtl ? 'فشل إرسال التعليق' : 'Failed to send comment'));
        }
      }
      toast.success(isRtl ? 'تمت إضافة تعليقك بنجاح' : 'Comment posted successfully');
    } catch (err) {
      toast.error(isRtl ? 'تعذر إرسال التعليق' : 'Could not post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Copy post link (inline button state provides feedback without redundant toast collision)
  const handleCopyLink = () => {
    if (!ad) return;
    const url = `${window.location.origin}/bulletin?ad=${ad.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setIsCopiedLink(true);
        setTimeout(() => setIsCopiedLink(false), 2000);
      }).catch(() => {
        fallbackCopyModalLink(url);
      });
    } else {
      fallbackCopyModalLink(url);
    }
  };

  const fallbackCopyModalLink = (url: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch {}
    document.body.removeChild(textarea);
  };

  // Download media
  const handleDownload = () => {
    if (!currentItem?.url) return;
    const link = document.createElement('a');
    link.href = getMediaUrl(currentItem.url);
    link.download = `media-${currentIndex + 1}.${currentItem.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isRtl ? 'بدأ تحميل الوسائط' : 'Download started');
  };

  if (!isOpen || !currentItem) return null;

  const isVideo = currentItem.type === 'video' || (currentItem.url && (currentItem.url.endsWith('.mp4') || currentItem.url.endsWith('.webm') || currentItem.url.includes('/video')));
  const mediaSrc = getMediaUrl(currentItem.url);
  const activeReactionObj = FB_REACTIONS.find((r) => r.id === userReaction);
  const isOwnerOrAdmin = Boolean(user && ad && (user.id === ad.user_id || user.role === 'admin' || user.is_admin));
  const isCommentsDisabled = Boolean(ad?.who_can_comment === 'nobody' && !isOwnerOrAdmin);

  // Sidebar content (Shared between desktop side-edge and mobile bottom-sheet)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[var(--surface-card)] text-[var(--text-primary)] divide-y divide-[var(--border-default)]">
      {/* 1. Header Bar: View Post + More Options */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between shrink-0 bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
        <button
          type="button"
          onClick={() => {
            if (onViewPost && ad) {
              onViewPost(ad.id);
            } else if (ad) {
              onClose();
              const el = document.getElementById(`bulletin-ad-${ad.id}`);
              el?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-shape-sm bg-accent text-[var(--fg-on-emphasis)] hover:bg-accent/90 font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={isRtl ? 'عرض المنشور الأصلي في فيرال بوك' : 'View original post in ViralBook'}
        >
          <ExternalLink size={14} />
          <span>{isRtl ? 'عرض المنشور' : 'View Post'}</span>
        </button>

        <div className={`relative ${showOptionsMenu ? 'z-50' : 'z-10'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptionsMenu((prev) => !prev);
            }}
            className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-shape-sm hover:bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer border border-[var(--border-default)]"
            title={isRtl ? 'المزيد من الخيارات' : 'More options'}
          >
            <MoreHorizontal size={14} />
          </button>

          {ad && (
            <PostOptionsMenu
              ad={ad}
              user={user}
              token={token}
              isRtl={isRtl}
              isOpen={showOptionsMenu}
              onClose={() => setShowOptionsMenu(false)}
              onSaveAd={onToggleSave ? () => onToggleSave(ad) : undefined}
              onEditAd={onEditAd ? () => {
                onClose();
                onEditAd(ad);
              } : undefined}
              onBoostAd={onBoostAd ? () => {
                onClose();
                onBoostAd(ad);
              } : undefined}
              onArchiveAd={onArchiveAd ? () => {
                onClose();
                onArchiveAd(ad);
              } : undefined}
              onTrashAd={onTrashAd ? () => {
                onClose();
                onTrashAd(ad);
              } : undefined}
              onUpdateAd={onUpdateAd}
              onHideAd={() => {
                onClose();
                toast.info(isRtl ? 'تم إخفاء هذا المنشور' : 'Post hidden');
              }}
              dropdownAlign={isRtl ? 'left' : 'right'}
            />
          )}
        </div>
      </div>

      {/* Paid Partnership Banner if enabled */}
      {ad && (ad.partnership_label_enabled || ad.is_partnership) && (
        <div className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
          <Handshake size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
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

      {/* 2. Author Profile Section */}
      <div className="p-3.5 sm:p-4 flex items-center gap-3 shrink-0">
        <div
          className={ad?.page_id ? 'cursor-pointer group' : ''}
          onClick={() => ad?.page_id && onOpenPageDetail && onOpenPageDetail(ad.page_id)}
        >
          <BulletinAvatar
            src={ad?.author_avatar}
            alt={ad?.author_name || authorName || ''}
            size="md"
            isPage={Boolean(ad?.page_id)}
            verified={Boolean(ad?.page_is_verified)}
            fallbackText={ad?.author_name || authorName}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <h3
              className={`font-extrabold text-sm truncate text-[var(--text-primary)] ${ad?.page_id ? 'cursor-pointer hover:underline hover:text-[var(--fg-accent)] transition-colors' : ''}`}
              onClick={() => ad?.page_id && onOpenPageDetail && onOpenPageDetail(ad.page_id)}
            >
              {ad?.author_name || authorName || (isRtl ? 'مستخدم المنصة' : 'Platform User')}
            </h3>
            {ad?.page_id && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] text-[10px] font-bold shrink-0 border border-[var(--border-accent)]/20">
                {isRtl ? 'صفحة' : 'Page'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5">
            <span>{formatRelativeTime(ad?.created_at, isRtl)}</span>
            <span>•</span>
            <span
              className="flex items-center gap-1 cursor-help"
              title={
                ad?.audience === 'friends'
                  ? isRtl ? 'الجمهور: الأصدقاء' : 'Audience: Friends'
                  : ad?.audience === 'only_me'
                  ? isRtl ? 'الجمهور: أنا فقط' : 'Audience: Only me'
                  : isRtl ? 'الجمهور: عام' : 'Audience: Public'
              }
            >
              {ad?.audience === 'friends' ? (
                <Users size={11} className="text-blue-500" />
              ) : ad?.audience === 'only_me' ? (
                <Lock size={11} className="text-amber-500" />
              ) : (
                <Globe size={11} />
              )}
              <span>
                {ad?.audience === 'friends'
                  ? isRtl ? 'الأصدقاء' : 'Friends'
                  : ad?.audience === 'only_me'
                  ? isRtl ? 'أنا فقط' : 'Only me'
                  : isRtl ? 'عام' : 'Public'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* AI Assistance Label if present */}
      {ad?.is_ai_generated && (
        <div className="mx-3.5 sm:mx-4 mb-2 px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)] text-[10px] font-black uppercase tracking-wider inline-flex items-center shrink-0 w-fit">
          AI
        </div>
      )}

      {/* 3. Post Description & Media Caption */}
      <div className="px-3.5 sm:px-4 py-3 space-y-2 shrink-0 border-b border-[var(--border-default)] text-xs leading-relaxed bg-[var(--surface-subtle)]">
        {ad?.title && (
          <h4 className="font-extrabold text-sm text-[var(--text-primary)] truncate">
            {ad.title}
          </h4>
        )}
        {ad?.description && (
          <div>
            <p className={`text-[var(--text-secondary)] whitespace-pre-line break-words ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
              {ad.description}
            </p>
            {ad.description.length > 70 && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(prev => !prev)}
                className="text-[11px] font-bold text-[var(--fg-accent)] hover:underline mt-1 cursor-pointer"
              >
                {isDescriptionExpanded ? (isRtl ? 'عرض أقل' : 'Show less') : (isRtl ? 'عرض المزيد...' : 'View more...')}
              </button>
            )}
          </div>
        )}
        {currentItem.caption && currentItem.caption.trim() !== '' && (
          <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium text-xs">
            <span className="font-bold block mb-0.5 text-[11px] text-accent">{isRtl ? '📌 وصف هذه الصورة:' : '📌 Photo caption:'}</span>
            {currentItem.caption}
          </div>
        )}

        {/* Action Buttons: Edit (owner) & Boost Post */}
        <div className="flex items-center gap-2 pt-1.5">
          {isOwnerOrAdmin && onEditAd && ad && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditAd(ad);
              }}
              className="flex-1 py-1.5 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-[var(--border-default)] cursor-pointer"
            >
              <Edit3 size={13} />
              <span>{isRtl ? 'تعديل' : 'Edit'}</span>
            </button>
          )}

          {onBoostAd && ad && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBoostAd(ad);
              }}
              className="flex-1 py-1.5 px-3 rounded-[var(--radius-sm)] bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Rocket size={13} />
              <span>{isRtl ? 'ترويج المنشور' : 'Boost Post'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Engagement Counters Row */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] shrink-0 bg-[var(--surface-card)]">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1 rtl:space-x-reverse items-center">
            <span className="w-4 h-4 rounded-[4px] bg-blue-500 text-white text-[9px] flex items-center justify-center">👍</span>
            <span className="w-4 h-4 rounded-[4px] bg-red-500 text-white text-[9px] flex items-center justify-center">❤️</span>
            <span className="w-4 h-4 rounded-[4px] bg-amber-500 text-white text-[9px] flex items-center justify-center">🥰</span>
          </div>
          <span className="font-bold text-[var(--text-primary)] font-mono">{likesCount}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            <strong className="font-bold text-[var(--text-primary)] font-mono">{commentsCount}</strong>{' '}
            {isRtl ? 'تعليق' : 'comments'}
          </span>
          <span>
            <strong className="font-bold text-[var(--text-primary)] font-mono">{ad?.shares_count || 0}</strong>{' '}
            {isRtl ? 'مشاركة' : 'shares'}
          </span>
        </div>
      </div>

      {/* 5. Interactive Engagement Action Bar (أعجبني / تعليق / مشاركة) */}
      <div className="px-2 py-1.5 flex items-center justify-between border-y border-[var(--border-default)] shrink-0 relative gap-1 bg-[var(--surface-card)]">
        {/* Like Button with Hover Reaction Bar */}
        <div
          className="relative flex-1"
          onMouseEnter={handleLikeMouseEnter}
          onMouseLeave={handleLikeMouseLeave}
        >
          {/* Facebook Emoji Reactions Floating Bar */}
          <AnimatePresence>
            {isHoveringReactions && (
              <div
                className={`absolute ${isRtl ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} bottom-full pb-2.5 z-50 pointer-events-auto max-w-[calc(100vw-24px)]`}
                onMouseEnter={handleBarMouseEnter}
                onMouseLeave={handleLikeMouseLeave}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.88 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="vb-emoji-bar select-none shadow-xl"
                  onMouseEnter={handleBarMouseEnter}
                  onMouseLeave={handleLikeMouseLeave}
                >
                  {FB_REACTIONS.map((reac) => (
                    <button
                      key={reac.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSelectReaction(reac.id);
                      }}
                      onMouseEnter={() => {
                        handleBarMouseEnter();
                        setHoveredReactionId(reac.id);
                      }}
                      onMouseLeave={() => setHoveredReactionId(null)}
                      className="vb-emoji-btn"
                      title={isRtl ? reac.labelAr : reac.labelEn}
                    >
                      <span className="block transform-gpu shrink-0">{reac.emoji}</span>
                      {hoveredReactionId === reac.id && (
                        <span className="hidden sm:block absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] text-[10px] font-bold py-0.5 px-2 rounded-shape-xs whitespace-nowrap pointer-events-none shadow-md z-50">
                          {isRtl ? reac.labelAr : reac.labelEn}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleDirectLikeClick}
            onTouchStart={handleTouchStartLike}
            onTouchEnd={handleTouchEndLike}
            onContextMenu={(e) => {
              e.preventDefault();
              setIsHoveringReactions((prev) => !prev);
            }}
            className={`w-full py-2 min-h-[36px] rounded-shape-sm flex items-center justify-center gap-1 font-bold text-xs transition-colors cursor-pointer select-none border border-transparent hover:border-[var(--border-default)] hover:bg-[var(--surface-subtle)] ${
              userReaction
                ? activeReactionObj?.color || 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            {activeReactionObj ? (
              <span className="text-sm">{activeReactionObj.emoji}</span>
            ) : (
              <ThumbsUp size={15} />
            )}
            <span>
              {activeReactionObj
                ? isRtl ? activeReactionObj.labelAr : activeReactionObj.labelEn
                : isRtl ? 'أعجبني' : 'Like'}
            </span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => commentInputRef.current?.focus()}
          className="flex-1 py-2 min-h-[36px] rounded-shape-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--border-default)] flex items-center justify-center gap-1 font-bold text-xs transition-colors cursor-pointer"
        >
          <MessageSquare size={15} />
          <span>{isRtl ? 'تعليق' : 'Comment'}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleDirectShare}
          className="flex-1 py-2 min-h-[36px] rounded-shape-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--border-default)] flex items-center justify-center gap-1 font-bold text-xs transition-colors cursor-pointer"
        >
          <Share2 size={15} />
          <span>{isRtl ? 'مشاركة' : 'Share'}</span>
        </button>

        {/* Bookmark / Save Button */}
        {onToggleSave && ad && (
          <button
            type="button"
            onClick={() => {
              onToggleSave(ad);
              setLocalSavedState((prev) => !prev);
            }}
            className={`flex-1 py-2 min-h-[36px] rounded-shape-sm border border-transparent hover:border-[var(--border-default)] flex items-center justify-center gap-1 font-bold text-xs transition-colors cursor-pointer ${
              localSavedState
                ? 'text-[var(--fg-warning)] hover:bg-[var(--status-warning-subtle)]/10'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
            }`}
            title={localSavedState ? (isRtl ? 'إزالة من المحفوظات' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}
          >
            <Bookmark size={15} className={localSavedState ? 'fill-[var(--fg-warning)] text-[var(--fg-warning)]' : ''} />
            <span>{localSavedState ? (isRtl ? 'محفوظ' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}</span>
          </button>
        )}
      </div>

      {/* 6. Comments List Area */}
      <div
        ref={commentsScrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]"
      >
        {isLoadingComments || propLoadingComments ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-xs">{isRtl ? 'جاري تحميل التعليقات...' : 'Loading comments...'}</span>
          </div>
        ) : commentsList.length === 0 ? (
          /* Empty Comments State */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] flex items-center justify-center mb-3">
              <FileText size={20} className="opacity-50" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              {isRtl ? 'لا توجد تعليقات حتى الآن' : 'No comments yet'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {isRtl ? 'كن أول من يعلق.' : 'Be the first to comment.'}
            </p>
          </div>
        ) : (
          commentsList.map((comm) => (
            <div key={comm.id} className="flex gap-2 items-start text-[11px] group">
              <div className="shrink-0 pt-0.5">
                <BulletinAvatar
                  src={comm.author_avatar}
                  alt={comm.author_name}
                  size="sm"
                  fallbackText={comm.author_name}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-[var(--surface-subtle)] p-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] border border-[var(--border-default)]">
                  <span className="font-extrabold text-xs block truncate text-[var(--text-primary)]">
                    {comm.author_name}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap break-words leading-relaxed text-[var(--text-secondary)]">
                    {comm.content}
                  </p>
                </div>
                <div className="flex items-center gap-3 px-2 mt-1 text-[10px] text-[var(--text-muted)] font-bold">
                  <span className="font-medium text-[var(--text-muted)]">{formatRelativeTime(comm.created_at, isRtl)}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (onToggleCommentLike && ad) {
                        onToggleCommentLike(ad.id, comm.id, 'like');
                        setCommentsList(prev => prev.map(c => {
                          if (c.id === comm.id) {
                            const isRemoving = c.user_reaction === 'like';
                            return {
                              ...c,
                              user_reaction: isRemoving ? null : 'like',
                              like_count: Math.max(0, (c.like_count || 0) + (isRemoving ? -1 : (c.user_reaction ? 0 : 1)))
                            };
                          }
                          return c;
                        }));
                      }
                    }}
                    className={`hover:underline cursor-pointer ${comm.user_reaction ? 'text-accent font-bold' : 'hover:text-[var(--text-primary)]'}`}
                  >
                    {comm.user_reaction ? (isRtl ? 'أعجبني' : 'Liked') : (isRtl ? 'إعجاب' : 'Like')}
                    {comm.like_count ? ` (${comm.like_count})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCommentText(`@${comm.author_name} `);
                      commentInputRef.current?.focus();
                    }}
                    className="hover:underline hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {isRtl ? 'رد' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 7. Sticky Bottom Comment Composer */}
      <div className="p-3 shrink-0 bg-[var(--surface-card)] border-t border-[var(--border-default)] relative">
        {/* Quick Emoji Popover */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`absolute bottom-full mb-2 ${isRtl ? 'left-3' : 'right-3'} p-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg grid grid-cols-6 gap-1 z-50`}
            >
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setNewCommentText((prev) => prev + em);
                    setShowEmojiPicker(false);
                    commentInputRef.current?.focus();
                  }}
                  className="w-8 h-8 rounded-shape-sm hover:bg-[var(--surface-subtle)] text-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isCommentsDisabled ? (
          <div className="py-2.5 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--text-muted)] text-xs flex items-center justify-center gap-2 border border-[var(--border-default)] font-medium">
            <Lock size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>{isRtl ? 'قام الناشر بإيقاف التعليقات على هذا المنشور' : 'Comments are turned off for this post'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <BulletinAvatar
              src={user?.avatar}
              alt={user?.name || ''}
              size="sm"
              fallbackText={user?.name || user?.email}
            />

            <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 min-h-[42px] rounded-shape-sm bg-[var(--surface-subtle)] focus-within:ring-1 focus-within:ring-accent border border-[var(--border-default)] focus-within:border-accent transition-all">
              <input
                ref={commentInputRef}
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder={
                  isRtl
                    ? `تعليق باسم ${user?.name || 'المستخدم'}...`
                    : `Comment as ${user?.name || 'User'}...`
                }
                className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none py-1"
              />

              {/* Quick Emoji Tool */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 transition-colors cursor-pointer"
                title={isRtl ? 'إدراج رمز تعبيري' : 'Insert emoji'}
              >
                <Smile size={16} />
              </button>

              {/* Camera / Photo Attachment Hint */}
              <button
                type="button"
                onClick={() => toast.info(isRtl ? 'إرفاق الصور في التعليقات متاح للأعضاء المميزين' : 'Image comments available')}
                className="text-[var(--text-muted)] hover:text-accent p-1 transition-colors cursor-pointer"
                title={isRtl ? 'إرفاق صورة' : 'Attach photo'}
              >
                <Camera size={16} />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendComment}
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="w-8 h-8 rounded-shape-xs bg-accent hover:bg-accent/90 disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-sm"
                title={isRtl ? 'إرسال (Enter)' : 'Send (Enter)'}
              >
                {isSubmittingComment ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} className={isRtl ? 'rotate-180' : ''} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] w-screen h-[100dvh] flex bg-[var(--surface-overlay)] backdrop-blur-md text-[var(--text-primary)] select-none overflow-hidden"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* ========================================================================= */}
        {/* 1. MAIN STAGE: PHOTO / VIDEO DISPLAY AREA                                 */}
        {/* ========================================================================= */}
        <div
          className="flex-1 h-full min-w-0 flex flex-col items-center justify-center relative overflow-hidden bg-[var(--surface-page)]"
          onClick={onClose}
        >
          {/* ========================================================================= */}
          {/* TOP BAR: DESKTOP WORKSTATION TOOLS (hidden on mobile screens)            */}
          {/* ========================================================================= */}
          <div
            className="hidden sm:flex absolute top-0 inset-x-0 z-50 items-center justify-between p-2.5 sm:p-3 bg-[var(--surface-card)]/95 backdrop-blur-md border-b border-[var(--border-main)] pointer-events-auto shadow-sm text-[var(--text-primary)] h-12 sm:h-14"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Section (Desktop Controls) */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-primary)]">
              {/* Zoom Out (-) */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 disabled:opacity-30 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تصغير (-)' : 'Zoom out (-)'}
              >
                <ZoomOut size={15} />
              </button>

              {/* Current Zoom Indicator & Reset */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="h-8 px-2.5 min-h-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent text-xs font-mono font-bold flex items-center gap-1 border border-[var(--border-main)] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'إعادة ضبط الحجم (0)' : 'Reset zoom (0)'}
              >
                <RotateCcw size={13} />
                <span>{Math.round(zoom * 100)}%</span>
              </button>

              {/* Zoom In (+) */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 disabled:opacity-30 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تكبير (+)' : 'Zoom in (+)'}
              >
                <ZoomIn size={15} />
              </button>

              {/* Rotate Tool */}
              <button
                type="button"
                onClick={handleRotate}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تدوير الصورة 90° (R)' : 'Rotate 90° (R)'}
              >
                <RotateCw size={15} />
              </button>

              {/* Slideshow Auto-play */}
              {totalCount > 1 && (
                <button
                  type="button"
                  onClick={toggleSlideshow}
                  className={`w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border shadow-xs relative before:absolute before:-inset-1.5 ${
                    isSlideshowPlaying
                      ? '!text-accent !border-accent/40 !bg-accent/15 hover:!bg-accent/25'
                      : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent border border-[var(--border-main)]'
                  }`}
                  title={
                    isSlideshowPlaying
                      ? isRtl ? 'إيقاف العرض التلقائي (Space)' : 'Pause slideshow (Space)'
                      : isRtl ? 'تشغيل العرض التلقائي (Space)' : 'Play slideshow (Space)'
                  }
                >
                  {isSlideshowPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
              )}

              {/* Tag Photo Tool */}
              <button
                type="button"
                onClick={() => toast.info(isRtl ? 'أداة الإشارة إلى الصور نشطة 🏷️' : 'Photo tag tool active 🏷️')}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'الإشارة إلى الأشخاص' : 'Tag photo'}
              >
                <Tag size={15} />
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'ملء الشاشة (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Download Media */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تنزيل الوسائط' : 'Download'}
              >
                <Download size={15} />
              </button>
            </div>

            {/* Center Section: Photo Counter Pill */}
            {totalCount > 1 && (
              <div className="flex items-center px-2.5 h-8 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-mono font-bold border border-[var(--border-main)] shadow-xs">
                {currentIndex + 1} / {totalCount}
              </div>
            )}

            {/* Right Section: Toggle Edge Sidebar & Close Button */}
            <div className="flex items-center gap-2">
              {/* Toggle Sidebar (Desktop only) */}
              <button
                type="button"
                onClick={() => setShowSidebar((prev) => !prev)}
                className="hidden lg:flex w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] hover:border-accent/60 text-[var(--text-primary)] hover:text-accent items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={
                  showSidebar
                    ? isRtl ? 'إخفاء الشريط الجانبي' : 'Hide sidebar'
                    : isRtl ? 'إظهار الشريط الجانبي' : 'Show sidebar'
                }
              >
                {showSidebar ? (
                  isRtl ? <PanelRightClose size={15} /> : <PanelLeftClose size={15} />
                ) : (
                  isRtl ? <PanelRightOpen size={15} /> : <PanelLeftOpen size={15} />
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--status-danger-subtle)] hover:border-[var(--status-danger)]/40 text-[var(--text-primary)] hover:text-[var(--status-danger)] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'إغلاق (Esc)' : 'Close (Esc)'}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP BAR: MOBILE DEDICATED STREAMLINED HEADER (sm:hidden)                  */}
          {/* ========================================================================= */}
          <AnimatePresence>
            {showMobileControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
                className="sm:hidden absolute top-0 inset-x-0 z-50 flex items-center justify-between px-3 py-2 bg-[var(--surface-card)]/90 backdrop-blur-md border-b border-[var(--border-main)] shadow-md pointer-events-auto text-[var(--text-primary)] h-12"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--status-danger-subtle)] text-[var(--text-primary)] hover:text-[var(--status-danger)] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                  title={isRtl ? 'إغلاق' : 'Close'}
                >
                  <X size={15} />
                </button>

                {/* Mobile Center Info: Author & Counter */}
                <div className="flex items-center gap-2 max-w-[50%] min-w-0">
                  {ad && (
                    <div className="shrink-0">
                      <BulletinAvatar
                        src={ad.author_avatar}
                        alt={ad.author_name || authorName || ''}
                        size="sm"
                        fallbackText={ad.author_name || authorName}
                      />
                    </div>
                  )}
                  <span className="text-xs font-bold truncate text-[var(--text-primary)]">
                    {ad?.author_name || authorName || postTitle || (isRtl ? 'معاينة الوسائط' : 'Media Preview')}
                  </span>
                  {totalCount > 1 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                      {currentIndex + 1}/{totalCount}
                    </span>
                  )}
                </div>

                {/* Mobile Actions: Download, Share, Options */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--bg-accent-muted)] text-[var(--text-primary)] hover:text-[var(--fg-accent)] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                    title={isRtl ? 'تنزيل' : 'Download'}
                  >
                    <Download size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectShare}
                    className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--bg-accent-muted)] text-[var(--text-primary)] hover:text-[var(--fg-accent)] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                    title={isRtl ? 'مشاركة' : 'Share'}
                  >
                    <Share2 size={15} />
                  </button>

                  <div className={`relative ${showMobileOptionsMenu ? 'z-50' : 'z-10'}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileOptionsMenu((prev) => !prev);
                      }}
                      className="w-8 h-8 min-h-[32px] min-w-[32px] rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--bg-accent-muted)] text-[var(--text-primary)] hover:text-[var(--fg-accent)] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-[var(--border-main)] shadow-xs relative before:absolute before:-inset-1.5"
                      title={isRtl ? 'خيارات المنشور' : 'Post options'}
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {ad && (
                      <PostOptionsMenu
                        ad={ad}
                        user={user}
                        token={token}
                        isRtl={isRtl}
                        isOpen={showMobileOptionsMenu}
                        onClose={() => setShowMobileOptionsMenu(false)}
                        onSaveAd={onToggleSave ? () => onToggleSave(ad) : undefined}
                        onEditAd={onEditAd ? () => {
                          onClose();
                          onEditAd(ad);
                        } : undefined}
                        onBoostAd={onBoostAd ? () => {
                          onClose();
                          onBoostAd(ad);
                        } : undefined}
                        onArchiveAd={onArchiveAd ? () => {
                          onClose();
                          onArchiveAd(ad);
                        } : undefined}
                        onTrashAd={onTrashAd ? () => {
                          onClose();
                          onTrashAd(ad);
                        } : undefined}
                        onUpdateAd={onUpdateAd}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Interactive Side Action Rail (Desktop & Tablet) - Matching Reels Rail Pattern */}
          <div
            className={`hidden md:flex flex-col items-center gap-2.5 absolute bottom-8 z-40 select-none pointer-events-auto ${
              isRtl ? 'start-4 lg:start-6' : 'end-4 lg:end-6'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Author Avatar + Follow Button */}
            {ad && (
              <div className="relative group mb-0.5 flex flex-col items-center">
                <div
                  onClick={() => ad.page_id && onOpenPageDetail && onOpenPageDetail(ad.page_id)}
                  className="w-8 h-8 rounded-shape-sm p-0.5 bg-gradient-to-tr from-accent to-pink-500 shadow-md cursor-pointer active:scale-95 transition-transform overflow-hidden flex items-center justify-center bg-black/40"
                >
                  <BulletinAvatar
                    src={ad.author_avatar}
                    alt={ad.author_name || authorName || ''}
                    size="sm"
                    fallbackText={ad.author_name || authorName}
                    isPage={Boolean(ad.page_id)}
                  />
                </div>
              </div>
            )}

            {/* Toggle Sidebar Button */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={() => setShowSidebar((prev) => !prev)}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--bg-accent-muted)] hover:text-[var(--fg-accent)] text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={
                  showSidebar
                    ? isRtl ? 'إخفاء الشريط الجانبي' : 'Hide sidebar'
                    : isRtl ? 'إظهار الشريط الجانبي' : 'Show sidebar'
                }
              >
                {showSidebar ? (
                  isRtl ? <PanelRightClose size={15} /> : <PanelLeftClose size={15} />
                ) : (
                  isRtl ? <PanelRightOpen size={15} /> : <PanelLeftOpen size={15} />
                )}
              </button>
            </div>

            {/* Like / Reaction Quick Action */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={handleDirectLikeClick}
                className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-rose-500/15 hover:border-rose-500/40 text-[var(--text-primary)] hover:text-rose-400 active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5 ${
                  userReaction ? '!text-rose-500 !border-rose-500/40' : ''
                }`}
                title={isRtl ? 'أعجبني' : 'Like'}
              >
                {activeReactionObj ? (
                  <span className="text-sm">{activeReactionObj.emoji}</span>
                ) : (
                  <ThumbsUp size={15} className={userReaction ? 'fill-rose-500 text-rose-500 animate-bounce' : ''} />
                )}
              </button>
              <span className="text-[10px] font-black text-[var(--text-primary)] tabular-nums drop-shadow-xs">
                {formatCompactCount(likesCount)}
              </span>
            </div>

            {/* Focus Comments (Opens Sidebar if closed & focuses input) */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={() => {
                  if (!showSidebar) setShowSidebar(true);
                  setTimeout(() => commentInputRef.current?.focus(), 100);
                }}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--bg-accent-muted)] hover:border-[var(--border-accent)]/30 text-[var(--text-primary)] hover:text-[var(--fg-accent)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'التعليقات والتفاصيل' : 'Comments & details'}
              >
                <MessageSquare size={15} />
              </button>
              <span className="text-[10px] font-black text-[var(--text-primary)] tabular-nums drop-shadow-xs">
                {formatCompactCount(commentsCount)}
              </span>
            </div>

            {/* Bookmark / Save */}
            {onToggleSave && ad && (
              <div className="flex flex-col items-center gap-0.5 select-none">
                <button
                  type="button"
                  onClick={() => {
                    onToggleSave(ad);
                    setLocalSavedState((prev) => !prev);
                  }}
                  className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--status-warning-subtle)] hover:border-[var(--status-warning)] text-[var(--text-primary)] hover:text-[var(--fg-warning)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5 ${
                    localSavedState ? '!text-[var(--fg-warning)] !border-[var(--status-warning)]' : ''
                  }`}
                  title={localSavedState ? (isRtl ? 'إزالة من المحفوظات' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}
                >
                  <Bookmark size={15} className={localSavedState ? 'fill-[var(--fg-warning)] text-[var(--fg-warning)]' : ''} />
                </button>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] drop-shadow-xs">
                  {localSavedState ? (isRtl ? 'محفوظ' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}
                </span>
              </div>
            )}

            {/* Direct Share */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={handleDirectShare}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--bg-accent-muted)] hover:border-[var(--border-accent)]/30 text-[var(--text-primary)] hover:text-[var(--fg-accent)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'مشاركة المنشور' : 'Share post'}
              >
                <Share2 size={15} />
              </button>
              <span className="text-[10px] font-black text-[var(--text-primary)] tabular-nums drop-shadow-xs">
                {formatCompactCount(sharesCount)}
              </span>
            </div>

            {/* Rotate Image */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={handleRotate}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--bg-accent-muted)] hover:border-[var(--border-accent)]/30 text-[var(--text-primary)] hover:text-[var(--fg-accent)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تدوير الصورة' : 'Rotate photo'}
              >
                <RotateCw size={15} />
              </button>
            </div>

            {/* Download */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <button
                type="button"
                onClick={handleDownload}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-shape-sm flex items-center justify-center bg-black/50 md:bg-[var(--surface-subtle)] backdrop-blur-md border border-white/20 md:border-[var(--border-default)] hover:bg-[var(--bg-accent-muted)] hover:border-[var(--border-accent)]/30 text-[var(--text-primary)] hover:text-[var(--fg-accent)] active:scale-95 transition-all cursor-pointer shadow-xs relative before:absolute before:-inset-1.5"
                title={isRtl ? 'تنزيل' : 'Download'}
              >
                <Download size={15} />
              </button>
            </div>
          </div>

          {/* Previous Media Arrow */}
          {totalCount > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isRtl) handleNext();
                else handlePrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-11 sm:h-11 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] rounded-full sm:rounded-[var(--comp-button-radius,8px)] bg-black/40 sm:bg-[var(--surface-card)]/90 text-white sm:text-[var(--text-primary)] hover:text-accent backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border-0 sm:border sm:border-[var(--border-main)] shadow-xl pointer-events-auto"
              title={isRtl ? 'التالي' : 'Previous'}
            >
              {isRtl ? <ChevronRight size={20} className="sm:w-6 sm:h-6" /> : <ChevronLeft size={20} className="sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* Next Media Arrow */}
          {totalCount > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isRtl) handlePrev();
                else handleNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-11 sm:h-11 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] rounded-full sm:rounded-[var(--comp-button-radius,8px)] bg-black/40 sm:bg-[var(--surface-card)]/90 text-white sm:text-[var(--text-primary)] hover:text-accent backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border-0 sm:border sm:border-[var(--border-main)] shadow-xl pointer-events-auto"
              title={isRtl ? 'السابق' : 'Next'}
            >
              {isRtl ? <ChevronLeft size={20} className="sm:w-6 sm:h-6" /> : <ChevronRight size={20} className="sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* Media Center Stage */}
          <div
            className="w-full h-full flex items-center justify-center pt-14 pb-16 px-1 sm:pt-[72px] sm:pb-[72px] sm:px-8 select-none relative"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            {isVideo ? (
              <video
                key={mediaSrc}
                src={mediaSrc}
                controls
                autoPlay
                playsInline
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.25s ease'
                }}
                className="max-w-full max-h-[calc(100dvh-120px)] sm:max-h-[calc(100vh-160px)] rounded-[var(--comp-button-radius,8px)] shadow-2xl bg-[var(--surface-card)] object-contain outline-none border border-[var(--border-main)]"
              />
            ) : (
              <img
                key={mediaSrc}
                src={mediaSrc}
                alt={currentItem.caption || postTitle || 'Media'}
                onDoubleClick={handleDoubleClick}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}
                className="max-w-full max-h-[calc(100dvh-120px)] sm:max-h-[calc(100vh-160px)] rounded-[var(--comp-button-radius,8px)] shadow-2xl object-contain select-none border border-[var(--border-main)] bg-[var(--surface-card)]"
                loading="eager"
                draggable={false}
              />
            )}
          </div>

          {/* Desktop Bottom Floating Thumbnail Strip */}
          {totalCount > 1 && (
            <div
              className="hidden lg:flex items-center gap-2 absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-[var(--comp-button-radius,8px)] bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border-main)] shadow-lg max-w-[85%] overflow-x-auto custom-scrollbar pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((item, idx) => {
                const isSelected = idx === currentIndex;
                const isItemVideo = item.type === 'video' || (item.url && (item.url.endsWith('.mp4') || item.url.endsWith('.webm')));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                      setRotation(0);
                    }}
                    className={`relative shrink-0 w-12 h-12 rounded-[var(--comp-button-radius,8px)] overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent scale-105 opacity-100 shadow-md'
                        : 'border-[var(--border-main)] opacity-60 hover:opacity-100'
                    }`}
                    title={`${idx + 1} / ${totalCount}`}
                  >
                    {isItemVideo ? (
                      <div className="w-full h-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                        <Film size={16} />
                      </div>
                    ) : (
                      <img
                        src={getMediaUrl(item.thumbnailUrl || item.url)}
                        alt=""
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent/20 pointer-events-none" />
                    )}
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white drop-shadow">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile Bottom Bar: Sleek Floating Engagement Bar */}
          <AnimatePresence>
            {showMobileControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.15 }}
                className="lg:hidden absolute bottom-3 inset-x-3 z-40 flex items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border-main)] shadow-xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Like Button */}
                <button
                  type="button"
                  onClick={handleDirectLikeClick}
                  onTouchStart={handleTouchStartLike}
                  onTouchEnd={handleTouchEndLike}
                  className={`flex-1 py-2 min-h-[38px] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 cursor-pointer select-none ${
                    userReaction
                      ? activeReactionObj?.color || 'text-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {activeReactionObj ? (
                    <span className="text-base leading-none">{activeReactionObj.emoji}</span>
                  ) : (
                    <ThumbsUp size={15} />
                  )}
                  <span>{likesCount > 0 ? likesCount : (isRtl ? 'إعجاب' : 'Like')}</span>
                </button>

                {/* Mobile Comments Button (Opens bottom sheet) */}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="flex-1 py-2 min-h-[38px] rounded-xl bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-card)] flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-[var(--border-main)]"
                >
                  <MessageSquare size={15} className="text-accent" />
                  <span>{isRtl ? 'التعليقات' : 'Comments'}</span>
                  {commentsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-mono leading-none">
                      {commentsCount}
                    </span>
                  )}
                </button>

                {/* Mobile Share Button */}
                <button
                  type="button"
                  onClick={handleDirectShare}
                  className="w-10 h-10 min-h-[38px] min-w-[38px] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title={isRtl ? 'مشاركة' : 'Share'}
                >
                  <Share2 size={16} />
                </button>

                {/* Mobile Bookmark Button */}
                {onToggleSave && ad && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSave(ad);
                      setLocalSavedState((prev) => !prev);
                    }}
                    className={`w-10 h-10 min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      localSavedState ? 'text-[var(--fg-warning)] bg-[var(--status-warning-subtle)]/10' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                    }`}
                    title={localSavedState ? (isRtl ? 'محفوظ' : 'Saved') : (isRtl ? 'حفظ' : 'Save')}
                  >
                    <Bookmark size={16} className={localSavedState ? 'fill-[var(--fg-warning)] text-[var(--fg-warning)]' : ''} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP EDGE SIDEBAR: FACEBOOK-STYLE TOOLS ON SCREEN EDGE              */}
        {/* ========================================================================= */}
        {showSidebar && (
          <div className="hidden lg:flex flex-col w-[380px] xl:w-[420px] 2xl:w-[460px] h-full shrink-0 border-s border-[var(--border-default)] shadow-2xl z-30 overflow-hidden">
            {renderSidebarContent()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MOBILE BOTTOM SHEET FOR COMMENTS / DETAILS                             */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[70] bg-[var(--surface-overlay)] flex flex-col justify-end"
              onClick={() => setIsMobileDrawerOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-h-[85vh] h-[80vh] rounded-t-2xl overflow-hidden bg-[var(--surface-card)] shadow-2xl flex flex-col border-t border-[var(--border-main)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pull handle */}
                <div className="w-12 h-1.5 rounded-[4px] bg-[var(--border-main)] mx-auto mt-2.5 mb-1 shrink-0" />
                <div className="flex-1 min-h-0 overflow-hidden">
                  {renderSidebarContent()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
};
