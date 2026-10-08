import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, CheckCircle2, Eye, Star, Sliders, ArrowUpRight, 
  Globe, Twitter, Instagram, ArrowLeft, ArrowRight, Layers, 
  Search, ShieldAlert, Coins, Sparkles, Award, Palette, 
  Video, Smartphone, Zap, Quote, ThumbsUp, Medal, Flame, PlusCircle,
  Heart, UserPlus, UserCheck, Bookmark
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from '@/design-system';
import { 
  getCreatorProfile, getStoredCreators, MarketplaceTemplate, RinexCreator,
  isCreatorFollowed, toggleFollowCreator, isCreatorLiked, toggleLikeCreator,
  incrementProfileVisits, isTemplateFavorite, toggleFavoriteTemplate,
  recordTemplateUse, recordCreatorRating
} from '../data/rinexCreators';
import { CreatorRegistrationModal } from '../components/creators/CreatorRegistrationModal';
import { TemplatePreviewModal } from '../components/creators/TemplatePreviewModal';

export const CreatorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { language, dir, user, setIsAuthModalOpen } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [creatorData, setCreatorData] = useState<{ creator: RinexCreator; templates: MarketplaceTemplate[] } | null>(null);
  const [allCreators, setAllCreators] = useState<RinexCreator[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Social States
  const [isFollowed, setIsFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [creatorRating, setCreatorRating] = useState(5.0);
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  // Interactive Modal States
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<MarketplaceTemplate | null>(null);

  useEffect(() => {
    const list = getStoredCreators();
    setAllCreators(list);

    // Default to first creator if none specified
    const targetUsername = username || 'sarah_designs';
    const profile = getCreatorProfile(targetUsername);
    if (profile) {
      setCreatorData(profile);
      setIsFollowed(isCreatorFollowed(profile.creator.id));
      setFollowersCount(profile.creator.followersCount || 1200);
      setIsLiked(isCreatorLiked(profile.creator.id));
      setLikesCount(profile.creator.likesCount || 3400);
      setCreatorRating(profile.creator.rating || 5.0);

      // Increment visits counter in real-time
      const updatedVisits = incrementProfileVisits(profile.creator.id);
      setVisitsCount(updatedVisits);
    } else if (list.length > 0) {
      // Fallback
      const fallbackProfile = getCreatorProfile(list[0].username);
      if (fallbackProfile) {
        setCreatorData(fallbackProfile);
        setIsFollowed(isCreatorFollowed(fallbackProfile.creator.id));
        setFollowersCount(fallbackProfile.creator.followersCount || 1200);
        setIsLiked(isCreatorLiked(fallbackProfile.creator.id));
        setLikesCount(fallbackProfile.creator.likesCount || 3400);
        setCreatorRating(fallbackProfile.creator.rating || 5.0);
      }
    }
  }, [username]);

  const handleRateCreator = (stars: number) => {
    if (!creatorData) return;
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول أولاً لتقييم المبدع' : 'Please log in to rate this creator');
      setIsAuthModalOpen(true);
      return;
    }
    const updated = recordCreatorRating(creatorData.creator.id, stars);
    setCreatorRating(updated);
    toast.success(isAr ? `شكراً لتقييمك (${stars} نجوم) للمصمم ${creatorData.creator.name}!` : `Thank you for rating ${stars} stars!`);
  };

  const handleToggleFavoriteTemplate = (templateId: string) => {
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول لحفظ القالب في المفضلة' : 'Please log in to favorite templates');
      setIsAuthModalOpen(true);
      return;
    }
    const res = toggleFavoriteTemplate(templateId);
    setFavoritesVersion(v => v + 1);
    if (res.isFavorite) {
      toast.success(isAr ? 'تمت إضافة القالب إلى قائمة المفضلة بنجاح!' : 'Template added to favorites!');
    } else {
      toast.info(isAr ? 'تمت إزالة القالب من المفضلة' : 'Template removed from favorites');
    }
  };

  const handleToggleFollow = () => {
    if (!creatorData) return;
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول لمتابعة المبدعين.' : 'Please log in to follow creators.');
      setIsAuthModalOpen(true);
      return;
    }

    const res = toggleFollowCreator(creatorData.creator.id);
    setIsFollowed(res.isFollowed);
    setFollowersCount(res.followersCount);

    if (res.isFollowed) {
      toast.success(isAr ? `أصبحت الآن تتابع المصمم (${creatorData.creator.name})` : `You are now following ${creatorData.creator.name}`);
    } else {
      toast.info(isAr ? `تم إلغاء متابعة (${creatorData.creator.name})` : `Unfollowed ${creatorData.creator.name}`);
    }
  };

  const handleToggleLike = () => {
    if (!creatorData) return;
    if (!user) {
      toast.error(isAr ? 'يرجى تسجيل الدخول للإعجاب ببروفايل المبدع.' : 'Please log in to like this profile.');
      setIsAuthModalOpen(true);
      return;
    }

    const res = toggleLikeCreator(creatorData.creator.id);
    setIsLiked(res.isLiked);
    setLikesCount(res.likesCount);

    if (res.isLiked) {
      toast.success(isAr ? 'شكراً لإعجابك بأعمال هذا المبدع!' : 'Thanks for liking this creator!');
    }
  };

  if (!creatorData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--surface-page)] text-[var(--text-primary)]">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black mb-2">{isAr ? 'لم يتم العثور على صانع المحتوى' : 'Creator Not Found'}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">{isAr ? 'يرجى التحقق من اسم المستخدم والمحاولة مجدداً.' : 'Please verify the username and try again.'}</p>
        <button
          onClick={() => navigate('/')}
          className="h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-2 cursor-pointer"
        >
          {isAr ? 'العودة للرئيسية' : 'Back to Home'}
        </button>
      </div>
    );
  }

  const { creator, templates } = creatorData;

  const categories = [
    { id: 'all', labelAr: 'كل القوالب', labelEn: 'All Templates', icon: Layers },
    { id: 'marketing', labelAr: 'بوسترات تسويقية', labelEn: 'Marketing Posters', icon: Palette },
    { id: 'reels', labelAr: 'فيديو وريلز', labelEn: 'Vertical Reels', icon: Video },
    { id: 'story', labelAr: 'قصص واستوري', labelEn: 'Stories', icon: Smartphone },
    { id: 'social', labelAr: 'مواقع التواصل', labelEn: 'Social Media', icon: Globe }
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      t.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (tpl: MarketplaceTemplate) => {
    if (!user) {
      try {
        sessionStorage.setItem('pending_studio_template', tpl.id);
        sessionStorage.setItem('pending_studio_template_payload', JSON.stringify(tpl));
      } catch (e) {}
      toast.error(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول قبل تعديل القوالب.' : 'Please log in to customize and save templates.');
      setIsAuthModalOpen(true);
      return;
    }
    
    recordTemplateUse(tpl.id);
    toast.success(isAr ? `جاري تهيئة قالب "${tpl.titleAr}" في استوديو رينكس...` : `Initializing "${tpl.titleEn}" template...`);
    
    setTimeout(() => {
      navigate('/image-studio', { state: { loadMarketplaceTemplate: tpl } });
    }, 500);
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans antialiased pb-20 select-none">
      
      {/* Immersive Edge-to-Edge Container */}
      <div className="max-w-[100vw] mx-auto px-4 md:px-8 xl:px-12 pt-6 relative z-10 overflow-hidden">
        
        {/* Full-width Compact Navigation bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-default)]/60">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 px-3.5 py-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/80 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all text-xs font-bold cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            {isAr ? <ArrowRight size={14} className="stroke-[2.5]" /> : <ArrowLeft size={14} className="stroke-[2.5]" />}
            <span>{isAr ? 'الرجوع للخلف' : 'Go Back'}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)]">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-success)] animate-pulse" />
              <span className="text-xs text-[var(--text-muted)] font-mono font-bold">
                {isAr ? 'منصة رينكس الإبداعية للمبدعين المعتمدين' : 'Rinex Creative Network For Certified Creators'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop 3-Column Immersive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          
          {/* Column 1: Dynamic Creator Profile Sidebar (3 cols - Floats to the Edge) */}
          <div className="lg:col-span-3 order-1 lg:order-1 rtl:lg:order-3 space-y-6">
            
            <div className="p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl relative overflow-hidden transition-all duration-base hover:shadow-primary">
              {/* Premium Gradient bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-pink-500" />
              
              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                
                {/* Avatar with Verified status and glowing border */}
                <div className="relative group">
                  <div className="absolute -inset-1.5 bg-gradient-to-tr from-[var(--accent)] to-purple-500 rounded-shape-full blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-media pointer-events-none" />
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-shape-full object-cover border-4 border-[var(--surface-card)] shadow-lg"
                  />
                  {creator.verified && (
                    <span className="absolute bottom-1 end-1 bg-[var(--surface-card)] p-0.5 rounded-full shadow-md z-10">
                      <CheckCircle2 size={22} className="text-[var(--fg-success)] fill-[color-mix(in_srgb,var(--fg-success)_15%,transparent)]" />
                    </span>
                  )}
                </div>

                {/* Identity info */}
                <div className="space-y-1">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)] flex items-center justify-center gap-1.5">
                    <span>{creator.name}</span>
                  </h1>
                  <p className="text-xs text-[var(--accent)] font-mono font-bold tracking-wide">@{creator.username}</p>
                  
                  {/* Styled Role unboxed */}
                  <div className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider mt-0.5">
                    {isAr ? creator.roleAr : creator.roleEn}
                  </div>
                </div>

                {/* 5-Star Interactive Rating Widget */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 shadow-2xs">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRateCreator(star)}
                        className="p-0.5 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                        title={isAr ? `تقييم ${star} من 5` : `Rate ${star} of 5`}
                      >
                        <Star 
                          size={14} 
                          className={star <= Math.round(creatorRating) ? "fill-amber-400 text-amber-400" : "text-gray-400 opacity-40"} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-black text-[var(--text-primary)]">
                    {creatorRating.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] font-medium">
                    ({isAr ? 'تقييم المبدع' : 'Rating'})
                  </span>
                </div>

                {/* Achievements row */}
                <div className="w-full grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 text-start">
                    <Medal size={14} className="text-amber-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-primary)] leading-tight">{isAr ? 'مصمم نخبة' : 'Elite Class'}</div>
                      <div className="text-[8px] text-[var(--text-muted)] font-bold">{isAr ? 'معتمد رسمياً' : 'Verified Partner'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 text-start">
                    <Flame size={14} className="text-rose-500 shrink-0" />
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-primary)] leading-tight">{isAr ? 'نشط جداً' : 'Highly Active'}</div>
                      <div className="text-[8px] text-[var(--text-muted)] font-bold">{isAr ? 'قوالب يومية' : 'Daily templates'}</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Social Actions */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    onClick={handleToggleFollow}
                    className={`h-9 rounded-shape-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isFollowed
                        ? 'bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-inset)]'
                        : 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90'
                    }`}
                  >
                    {isFollowed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    <span>{isFollowed ? (isAr ? 'متابع' : 'Following') : (isAr ? 'متابعة' : 'Follow')}</span>
                  </button>

                  <button
                    onClick={handleToggleLike}
                    className={`h-9 rounded-shape-sm text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isLiked
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/15'
                        : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-500/30'
                    }`}
                  >
                    <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                    <span>{isAr ? 'أعجبني' : 'Like'}</span>
                  </button>
                </div>

                {/* Total Stats card - Multi-layered & Rich */}
                <div className="grid grid-cols-4 gap-1 w-full pt-4 border-t border-[var(--border-default)]/80 text-center">
                  <div className="p-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/40 hover:bg-[var(--surface-inset)] transition-colors">
                    <div className="text-[11px] font-black font-mono text-[var(--text-primary)]">{Number(creator.totalViews).toLocaleString()}</div>
                    <div className="text-[8px] text-[var(--text-muted)] font-black mt-0.5">{isAr ? 'مشاهدة' : 'Views'}</div>
                  </div>
                  <div className="p-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/40 hover:bg-[var(--surface-inset)] transition-colors">
                    <div className="text-[11px] font-black font-mono text-[var(--text-primary)]">{Number(creator.totalUses).toLocaleString()}</div>
                    <div className="text-[8px] text-[var(--text-muted)] font-black mt-0.5">{isAr ? 'استخدام' : 'Uses'}</div>
                  </div>
                  <div className="p-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/40 hover:bg-[var(--surface-inset)] transition-colors">
                    <div className="text-[11px] font-black font-mono text-[var(--text-primary)]">{Number(followersCount).toLocaleString()}</div>
                    <div className="text-[8px] text-[var(--text-muted)] font-black mt-0.5">{isAr ? 'متابع' : 'Followers'}</div>
                  </div>
                  <div className="p-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/40 hover:bg-[var(--surface-inset)] transition-colors">
                    <div className="text-[11px] font-black font-mono text-[var(--text-primary)]">{Number(likesCount + visitsCount).toLocaleString()}</div>
                    <div className="text-[8px] text-[var(--text-muted)] font-black mt-0.5">{isAr ? 'تفاعل' : 'Interactions'}</div>
                  </div>
                </div>

                {/* Biography unboxed */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed text-justify py-2 bg-[var(--surface-inset)]/30 p-3.5 rounded-shape-md border border-[var(--border-default)]/40">
                  {isAr ? creator.bioAr : creator.bioEn}
                </p>

                {/* Personal Philosophy / Quote */}
                <div className="w-full p-3 rounded-shape-sm bg-gradient-to-br from-[var(--surface-subtle)] to-[color-mix(in_oklab,var(--accent)_5%,transparent)] border border-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-start relative overflow-hidden">
                  <Quote size={20} className="absolute -bottom-1 -end-1 text-[var(--accent)]/10" />
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-[var(--accent)] mb-1 flex items-center gap-1">
                    <Zap size={10} />
                    <span>{isAr ? 'فلسفة التصميم' : 'Design Philosophy'}</span>
                  </h4>
                  <p className="text-[10px] text-[var(--text-secondary)] italic leading-relaxed">
                    {isAr 
                      ? '“التصميم ليس مجرد شكل خارجي، بل هو أداة ذكية لصناعة فارق حقيقي في تجربة ومستقبل المحتوى الحركي والرسومي.”' 
                      : '“Design is not just visual style, but an intelligent tool to craft a genuine difference in dynamic content.”'}
                  </p>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-2 pt-1">
                  {creator.socialLinks.twitter && (
                    <a
                      href={creator.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer shadow-2xs"
                      title="Twitter / X"
                    >
                      <Twitter size={14} />
                    </a>
                  )}
                  {creator.socialLinks.instagram && (
                    <a
                      href={creator.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-pink-500 transition-colors cursor-pointer shadow-2xs"
                      title="Instagram"
                    >
                      <Instagram size={14} />
                    </a>
                  )}
                  {creator.socialLinks.behance && (
                    <a
                      href={creator.socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer shadow-2xs"
                      title="Behance"
                    >
                      <Palette size={14} />
                    </a>
                  )}
                  {creator.socialLinks.website && (
                    <a
                      href={creator.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer shadow-2xs"
                      title="Portfolio"
                    >
                      <Globe size={14} />
                    </a>
                  )}
                </div>

                {/* Dashboard shortcut (Strictly gated and visible ONLY to the owner profile) */}
                {user && (user as any).username === creator.username && (
                  <div className="pt-3 border-t border-[var(--border-default)]/80 w-full">
                    <button
                      onClick={() => navigate('/settings/creators-hub')}
                      className="w-full h-10 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--accent)] hover:text-slate-950 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Award size={14} />
                      <span>{isAr ? 'لوحة تحكم أرباحي' : 'My Earnings Dashboard'}</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
            
          </div>

          {/* Column 2: Template Marketplace & Filter Showcase (6 cols - Centers Immersive Area) */}
          <div className="lg:col-span-6 order-2 lg:order-2 space-y-6">
            
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                
                {/* Search input */}
                <div className="relative w-full sm:flex-1">
                  <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث في قوالب هذا المصمم...' : 'Search templates...'}
                    className="w-full h-9 ps-9 pe-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-all font-medium"
                  />
                </div>

                {/* Total count badge */}
                <span className="px-3 py-1 rounded-shape-sm bg-[var(--surface-inset)] text-[var(--text-secondary)] text-[11px] font-black border border-[var(--border-default)] shrink-0 font-mono tracking-tight">
                  {templates.length} {isAr ? 'قالب منشور' : 'Published'}
                </span>

              </div>

              {/* Segmented Category Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[var(--surface-subtle)] border border-[var(--border-default)]/60 rounded-shape-md overflow-x-auto custom-scrollbar scrollbar-none whitespace-nowrap">
                {categories.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-shape-sm font-bold text-xs transition-all duration-fast shrink-0 cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-2xs border border-[var(--border-default)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--surface-inset)]'
                      }`}
                    >
                      <CatIcon size={12} className={activeCategory === cat.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                      <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Gallery */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredTemplates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateForPreview(tpl)}
                    className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden shadow-xs hover:shadow-md hover:border-[var(--accent)]/50 transition-all flex flex-col relative cursor-pointer"
                  >
                    {/* Template Thumbnail with premium badge */}
                    <div className="aspect-square bg-slate-950/20 border-b border-[var(--border-default)] relative overflow-hidden shrink-0">
                      <img
                        src={tpl.thumbnail}
                        alt={tpl.titleAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-media"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Price/Level tag overlay */}
                      <div className="absolute top-2.5 start-2.5">
                        {tpl.priceType === 'free' ? (
                          <span className="px-2 py-0.5 rounded-shape-xs bg-[var(--fg-success)] text-white text-[9.5px] font-black uppercase tracking-wider shadow">
                            {isAr ? 'مجاني' : 'FREE'}
                          </span>
                        ) : tpl.priceType === 'pro' ? (
                          <span className="px-2 py-0.5 rounded-shape-xs bg-amber-500 text-slate-950 text-[9.5px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                            <Sparkles size={10} className="fill-slate-950" />
                            <span>{isAr ? 'برو' : 'PRO'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-shape-xs bg-indigo-600 text-white text-[9.5px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                            <Coins size={10} />
                            <span>{tpl.price} cr</span>
                          </span>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavoriteTemplate(tpl.id);
                        }}
                        className="absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-slate-950/70 backdrop-blur-xs text-white hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer z-10 shadow active:scale-90"
                        title={isAr ? 'إضافة إلى المفضلة' : 'Favorite'}
                      >
                        <Heart 
                          size={13} 
                          className={isTemplateFavorite(tpl.id) ? "fill-rose-500 text-rose-500" : "text-white"} 
                        />
                      </button>

                      {/* Overlays with views/uses stats */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 flex items-center justify-between text-white text-[10px] font-mono font-bold">
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          <span>{Number(tpl.viewsCount).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Sliders size={12} />
                          <span>{Number(tpl.usesCount).toLocaleString()} {isAr ? 'مرة' : 'uses'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content info */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-1">
                          {isAr ? tpl.titleAr : tpl.titleEn}
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                          {isAr ? tpl.descriptionAr : tpl.descriptionEn}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[var(--border-default)]/60 flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-[var(--text-muted)] tracking-wider uppercase font-mono">
                          {tpl.dimensions}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(tpl);
                          }}
                          className="h-7.5 px-3 rounded-shape-xs bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-[10.5px] flex items-center gap-1 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Palette size={11} />
                          <span>{isAr ? 'استخدم القالب' : 'Use Template'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md text-[var(--text-muted)]">
                <Palette className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <h4 className="text-sm font-bold">{isAr ? 'لا تتوفر قوالب مطابقة' : 'No templates match your filters'}</h4>
                <p className="text-xs mt-1">{isAr ? 'جرب البحث بكلمة مختلفة أو تغيير تصفية الأقسام.' : 'Try a different search word or modify the category filter.'}</p>
              </div>
            )}

          </div>

          {/* Column 3: Partner Network Sidebar Directory (3 cols - Floats to the Edge) */}
          <div className="lg:col-span-3 order-3 lg:order-3 rtl:lg:order-1 space-y-6">
            
            <div className="p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl space-y-4">
              
              <div className="border-b border-[var(--border-default)] pb-2.5">
                <h3 className="text-xs font-black text-[var(--text-secondary)] tracking-wider uppercase flex items-center gap-1.5">
                  <Award size={14} className="text-[var(--accent)] animate-pulse" />
                  <span>{isAr ? 'مبدعون آخرون بالشبكة' : 'Partner Creators Index'}</span>
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-1">
                  {isAr 
                    ? 'اكتشف نخبة المبدعين والمصممين المعتمدين لتعديل واستخدام قوالبهم السحابية.' 
                    : 'Discover certified designers to build and adjust premium layouts.'}
                </p>
              </div>

              <div className="space-y-3">
                {allCreators.filter(c => c.id !== creator.id).map(c => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/creator/${c.username}`)}
                    className="group/item flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)]/60 cursor-pointer transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-9 h-9 rounded-shape-full object-cover border border-[var(--border-default)] shadow-xs"
                        />
                        {c.verified && (
                          <span className="absolute -bottom-1 -end-1 bg-[var(--surface-card)] rounded-full p-0.5">
                            <CheckCircle2 size={11} className="text-[var(--fg-success)] fill-[color-mix(in_srgb,var(--fg-success)_20%,transparent)]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate text-[var(--text-primary)] group-hover/item:text-[var(--accent)] transition-colors">{c.name}</h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.2">@{c.username}</span>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover/item:text-[var(--accent)] transition-colors shrink-0" />
                  </div>
                ))}
              </div>

              {/* Motivational Banner */}
              <div className="pt-3 border-t border-[var(--border-default)]/80 text-center">
                <div className="p-3.5 rounded-shape-sm bg-gradient-to-br from-[var(--surface-subtle)] to-[color-mix(in_oklab,var(--accent)_5%,transparent)] border border-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-center space-y-2">
                  <h4 className="text-xs font-black text-[var(--text-primary)]">
                    {isAr ? 'هل أنت مصمم محترف؟' : 'Are You a Professional?'}
                  </h4>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    {isAr 
                      ? 'انضم إلى برنامج الشركاء في رينكس، وانشر قوالبك السحابية لتوليد أرباح وعمولات مستمرة.' 
                      : 'Join the Rinex Creators Network and earn royalties for usage.'}
                  </p>
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error(isAr ? 'يرجى تسجيل الدخول للتقدم لبرنامج المبدعين.' : 'Please log in to apply for the program.');
                        setIsAuthModalOpen(true);
                      } else {
                        setIsRegistrationModalOpen(true);
                      }
                    }}
                    className="w-full h-8 rounded-shape-xs bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-[10px] flex items-center justify-center gap-1 hover:opacity-95 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles size={11} />
                    <span>{isAr ? 'انضم لشبكة المبدعين' : 'Apply to Network'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Certified Creator Registration Modal */}
      <CreatorRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />

      {/* Interactive Template Preview Modal */}
      <TemplatePreviewModal
        template={selectedTemplateForPreview}
        onClose={() => setSelectedTemplateForPreview(null)}
      />

    </div>
  );
};

export default CreatorProfilePage;
