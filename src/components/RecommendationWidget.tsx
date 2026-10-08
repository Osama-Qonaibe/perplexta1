import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Compass, 
  Sliders, 
  Zap, 
  BookOpen, 
  Megaphone, 
  RefreshCw, 
  X, 
  Tag, 
  ChevronRight,
  MapPin,
  Clock,
  Brain,
  Settings
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getMediaUrl } from '../utils/mediaUtils';
import { BulletinAvatar } from './BulletinAvatar';
import { RecommendationPreferencesModal } from './RecommendationPreferencesModal';

interface RecommendationItem {
  recommendation_id: string;
  item_type: 'bulletin' | 'tool' | 'page';
  item_id: any;
  score: number;
  match_percentage: number;
  reasons_en: string[];
  reasons_ar: string[];
  data: any;
}

interface RecommendationWidgetProps {
  variant?: 'full' | 'compact' | 'bulletin' | 'tools' | 'banner';
  title?: string;
  subtitle?: string;
  limit?: number;
  filterType?: 'all' | 'bulletin' | 'tool';
  onOpenPreferences?: () => void;
  onAdClick?: (adId: number) => void;
  className?: string;
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
  variant = 'full',
  title,
  subtitle,
  limit = 6,
  filterType = 'all',
  onOpenPreferences,
  onAdClick,
  className = ''
}) => {
  const { language, dir, token, user } = useAppContext();
  const navigate = useNavigate();

  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(filterType);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);

  const isBulletinOnly = filterType === 'bulletin' || variant === 'bulletin';

  const fetchRecommendations = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const endpoint = (filterType && filterType !== 'all')
        ? `/api/recommendations/${filterType}`
        : `/api/recommendations?limit=${limit * 2}`;

      const res = await fetch(endpoint, { headers, signal });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setItems([]);
        return;
      }
      const data = await res.json();

      if (data && data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else if (data && data.success && Array.isArray(data.recommendations)) {
        setItems(data.recommendations);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('[RecommendationWidget] Fetch notice:', err?.message || err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendations(controller.signal);
    return () => {
      controller.abort();
    };
  }, [token, user?.id, filterType, limit]);

  const handleTrackInteraction = async (item: RecommendationItem, actionType: string) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item_type: item.item_type,
          item_id: typeof item.item_id === 'number' ? item.item_id : null,
          item_key: typeof item.item_id === 'string' ? item.item_id : null,
          action_type: actionType,
          category: item.data?.category_en || item.data?.category || ''
        })
      });
    } catch (err) {
      // Non-blocking interaction telemetry
    }
  };

  const handleDismiss = async (item: RecommendationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedKeys(prev => new Set(prev).add(item.recommendation_id));

    if (token) {
      try {
        await fetch('/api/recommendations/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_type: item.item_type,
            item_id: typeof item.item_id === 'number' ? item.item_id : null,
            item_key: typeof item.item_id === 'string' ? item.item_id : null,
            feedback_type: 'not_interested'
          })
        });
      } catch (err) {
        // Non-blocking feedback tracking
      }
    }
  };

  const handleItemClick = (item: RecommendationItem) => {
    handleTrackInteraction(item, 'click');

    if (item.item_type === 'bulletin' || isBulletinOnly) {
      if (onAdClick && typeof item.item_id === 'number') {
        onAdClick(item.item_id);
      } else {
        navigate(`/bulletin?ad_id=${item.item_id}`);
      }
    } else if (item.item_type === 'page') {
      navigate(`/bulletin?tab=pages&page_id=${item.item_id}`);
    } else if (item.item_type === 'tool') {
      navigate(`/chat?tool=${item.data?.tool_id || item.item_id}`);
    }
  };

  const [rotationOffset, setRotationOffset] = useState<number>(0);

  const filteredItems = items
    .filter(i => !dismissedKeys.has(i.recommendation_id))
    .filter(i => (filterType && filterType !== 'all') ? i.item_type === filterType : (activeCategory === 'all' ? true : i.item_type === activeCategory));

  useEffect(() => {
    if (!isBulletinOnly && variant !== 'compact') return;
    if (filteredItems.length <= 3) return;

    const timer = setInterval(() => {
      setRotationOffset(prev => (prev + 1) % filteredItems.length);
    }, 30000);

    return () => clearInterval(timer);
  }, [filteredItems.length, isBulletinOnly, variant]);

  const visibleItems = React.useMemo(() => {
    if (!isBulletinOnly && variant !== 'compact') {
      return filteredItems.slice(0, limit);
    }
    if (filteredItems.length === 0) return [];
    const sliceCount = Math.min(3, filteredItems.length);
    const result = [];
    for (let i = 0; i < sliceCount; i++) {
      const idx = (rotationOffset + i) % filteredItems.length;
      result.push(filteredItems[idx]);
    }
    return result;
  }, [filteredItems, rotationOffset, limit, isBulletinOnly, variant]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bulletin': return <Megaphone size={13} className="text-[var(--fg-warning)]" />;
      case 'page': return <BookOpen size={13} className="text-[var(--fg-success)]" />;
      case 'tool': return <Zap size={13} className="text-[var(--accent)]" />;
      default: return <Sparkles size={13} className="text-[var(--accent)]" />;
    }
  };

  const getTypeBadgeText = (type: string) => {
    if (language === 'ar') {
      switch (type) {
        case 'bulletin': return 'منشور/خدمة';
        case 'page': return 'صفحة تجارية';
        case 'tool': return 'أداة ذكية';
        default: return 'توصية';
      }
    } else {
      switch (type) {
        case 'bulletin': return 'Feed Post';
        case 'page': return 'Verified Page';
        case 'tool': return 'AI Tool';
        default: return 'Recommended';
      }
    }
  };

  const formatPublishedTime = (createdAt?: string) => {
    if (!createdAt) return language === 'ar' ? 'الآن' : 'Just now';
    try {
      const diff = Date.now() - new Date(createdAt).getTime();
      if (isNaN(diff) || diff < 60000) return language === 'ar' ? 'الآن' : 'Just now';
      if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return language === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
      }
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
      }
      return language === 'ar' ? 'الآن' : 'Just now';
    } catch (e) {
      return language === 'ar' ? 'الآن' : 'Just now';
    }
  };

  if (!token || !user) return null;

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-1 border-b border-[var(--border-default)] w-full">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            {isBulletinOnly ? (
              <Megaphone size={18} />
            ) : (
              <Sparkles size={18} />
            )}
          </div>
           <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 truncate">
              <span>
                {title || (isBulletinOnly
                  ? (language === 'ar' ? 'إعلانات موصى بها' : 'Recommended Ads')
                  : (language === 'ar' ? 'توصيات مخصصة لك' : 'Recommended For You'))}
              </span>
              <span title={language === 'ar' ? 'ذكاء اصطناعي' : 'AI Powered'}>
                <Brain size={15} className="text-accent shrink-0" />
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ms-auto">
          <button
            onClick={() => {
              if (onOpenPreferences) onOpenPreferences();
              else setIsPrefModalOpen(true);
            }}
            className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-fast active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
            title={language === 'ar' ? 'تعديل تفضيلات التوصيات' : 'Customize preferences'}
          >
            <Settings size={14} className="transition-transform group-hover:rotate-45" />
          </button>

          <button
            onClick={() => { fetchRecommendations(); }}
            disabled={isLoading}
            className="w-8 h-8 rounded-shape-sm bg-transparent border border-[var(--border-default)] hover:bg-accent/10 hover:border-accent/20 text-[var(--text-muted)] hover:text-accent transition-all duration-fast active:scale-95 group shrink-0 cursor-pointer relative flex items-center justify-center"
            title={language === 'ar' ? 'تحديث التوصيات' : 'Refresh'}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-accent' : 'transition-transform group-hover:rotate-180'} />
          </button>
        </div>
      </div>

      {/* Category Tabs (only if full variant and not bulletin-only) */}
      {variant === 'full' && !isBulletinOnly && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 mb-3 text-xs font-semibold snap-x touch-pan-x">
          {[
            { id: 'all', label_ar: 'الكل', label_en: 'All Picks', icon: <Compass size={13} /> },
            { id: 'bulletin', label_ar: 'بيربليكستا بورد', label_en: 'Board & Ads', icon: <Megaphone size={13} /> },
            { id: 'tool', label_ar: 'أدوات الذكاء الاصطناعي', label_en: 'AI Tools', icon: <Zap size={13} /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`snap-start ide-chip ${activeCategory === tab.id ? 'ide-chip-active font-extrabold' : ''}`}
            >
              {tab.icon}
              <span>{language === 'ar' ? tab.label_ar : tab.label_en}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className={isBulletinOnly || variant === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'}>
          {Array.from({ length: limit > 4 ? 4 : limit }).map((_, i) => (
            <div key={`rec-widget-skel-${i}`} className="h-16 sm:h-20 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] animate-pulse p-3 flex items-center gap-3 border border-[var(--border-default)]">
              <div className="w-10 h-10 bg-[var(--surface-inset)] rounded-[var(--radius-xs)] shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="w-3/4 h-3 bg-[var(--surface-inset)] rounded" />
                <div className="w-1/2 h-2.5 bg-[var(--surface-inset)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-3 rounded-[var(--radius-sm)] border border-[var(--fg-danger)]/30 bg-[var(--fg-danger)]/10 text-center text-xs text-[var(--fg-danger)]">
          {error}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="py-6 px-3 text-center space-y-2">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] flex items-center justify-center mx-auto text-[var(--accent)]">
            <Megaphone size={16} />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">
            {language === 'ar' ? 'لا تتوفر إعلانات موصى بها حالياً' : 'No recommendations currently'}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
            {language === 'ar' 
              ? 'تصفح الإعلانات والخدمات لتدريب المحرك الذكي، أو خصص اهتماماتك مباشرة' 
              : 'Browse items or adjust your preferences to tune your vector.'}
          </p>
          <div className="pt-1">
            <button
              onClick={() => setIsPrefModalOpen(true)}
              className="ide-header-button text-xs py-1"
            >
              {language === 'ar' ? 'تخصيص تفضيلاتي الآن' : 'Set Preferences'}
            </button>
          </div>
        </div>
      ) : (
        /* Items Grid */
        <div className={isBulletinOnly || variant === 'compact' ? 'flex flex-col gap-1 w-full' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'}>
          {visibleItems.map((item, recIdx) => {
            const reasonText = language === 'ar' 
              ? (item.reasons_ar?.[0] || 'توصية مخصصة')
              : (item.reasons_en?.[0] || 'Recommended for you');

            const titleText = language === 'ar'
              ? (item.data?.title || item.data?.title_ar || item.data?.name_ar || item.data?.title_en || '')
              : (item.data?.title_en || item.data?.title || item.data?.name_en || '');

            const mediaUrl = getMediaUrl(item.data?.image_url || item.data?.video_url || item.data?.icon);
            const price = item.data?.price_amount || item.data?.price || item.data?.price_usd || 0;
            const cityText = item.data?.location_city || item.data?.city || '';

            if (isBulletinOnly || variant === 'compact') {
              const isToolItem = item.item_type === 'tool';
              const timeAgoText = formatPublishedTime(item.data?.created_at);

               return (
                <motion.div
                  key={`rec-item-compact-${item.recommendation_id || item.item_id || recIdx}-${recIdx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleItemClick(item)}
                  className="group relative platform-tab-btn"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isToolItem ? (
                      <div className="w-7 h-7 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)] flex items-center justify-center shrink-0">
                        <Zap size={14} />
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <BulletinAvatar
                          src={mediaUrl}
                          alt={titleText}
                          size="sm"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <h4 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate cursor-pointer"
                      >
                        {titleText}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        {price > 0 && (
                          <span className="text-[11px] font-black text-[var(--accent)]">
                            ${price}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--fg-success)] bg-transparent border-0 px-0 py-0">
                          <Clock size={8} className="shrink-0" />
                          <span>{timeAgoText}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDismiss(item, e)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--fg-danger)] hover:bg-[var(--fg-danger)]/10 transition-colors opacity-0 group-hover:opacity-100"
                      title={language === 'ar' ? 'غير مهتم' : 'Not interested'}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            }

            /* STANDARD FULL GRID CARD */
            const isTool = item.item_type === 'tool';
            return (
              <motion.div
                key={`rec-item-full-${item.recommendation_id || item.item_id || recIdx}-${recIdx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                onClick={() => handleItemClick(item)}
                className="group relative rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)] transition-all p-3 flex flex-col justify-between cursor-pointer overflow-hidden shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
                      {getTypeIcon(item.item_type)}
                      <span>{getTypeBadgeText(item.item_type)}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="ide-badge-info">
                        <Sparkles size={9} />
                        {item.match_percentage}% {language === 'ar' ? 'توافق' : 'Match'}
                      </span>

                      <button
                        onClick={(e) => handleDismiss(item, e)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--fg-danger)] hover:bg-[var(--fg-danger)]/10 transition-colors opacity-0 group-hover:opacity-100"
                        title={language === 'ar' ? 'غير مهتم' : 'Not interested'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    {isTool ? (
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center shrink-0">
                        <Zap size={18} />
                      </div>
                    ) : (
                      <BulletinAvatar
                        src={mediaUrl}
                        alt={titleText}
                        size="md"
                        onClick={() => handleItemClick(item)}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-tight cursor-pointer"
                      >
                        {titleText}
                      </h4>
                      {price > 0 ? (
                        <p className="text-[11px] font-black text-[var(--accent)] mt-1">
                          ${price} USD
                        </p>
                      ) : (
                        <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1 truncate">
                          {item.data?.category_en || item.data?.category_ar || item.data?.category || (language === 'ar' ? 'متاح الآن' : 'Available now')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  className="w-full mt-3 pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--accent)] font-bold group-hover:translate-x-0.5 transition-transform text-start cursor-pointer"
                >
                  <span className="text-[11px]">
                    {language === 'ar' ? 'التفاصيل واستكشاف المحتوى' : 'View Details & Explore'}
                  </span>
                  <ChevronRight size={13} className={dir === 'rtl' ? 'rotate-180' : ''} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Embedded Preferences Modal */}
      <RecommendationPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onSaved={() => { fetchRecommendations(); }}
      />
    </div>
  );
};
