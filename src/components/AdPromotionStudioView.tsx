import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Rocket,
  MessageCircle,
  ThumbsUp,
  Globe,
  Phone,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Sparkles,
  Smartphone,
  Monitor,
  Film,
  Clock,
  Send,
  Plus,
  X,
  ChevronDown,
  Layers,
  Check,
  ShieldCheck,
  Edit3,
  Share2,
  Eye,
  Heart,
  Bookmark,
  ChevronUp,
  MoreHorizontal,
  Battery,
  Wifi,
  Disc,
  Volume2,
  Play,
  Flame,
  MessageSquare,
  CheckCheck,
  Activity
} from 'lucide-react';
import { BulletinAd } from '../../server/db/types';
import { getMediaUrl } from '../utils/mediaUtils';
import { PALESTINE_GEO } from '../constants/geoData';
import { toast } from '@/design-system';
import { CategoryTargetingSelector } from './CategoryTargetingSelector';
import { MASTER_PLATFORM_CATEGORIES } from '../constants/categories';

interface AdPromotionStudioViewProps {
  ad: BulletinAd;
  walletBalance: number;
  token: string | null;
  isRtl: boolean;
  onBack: () => void;
  onSuccess: (updatedAd: BulletinAd) => void;
  onNavigateToWallet?: () => void;
  onRequestDepositModal?: () => void;
}

type CampaignGoal = 'whatsapp_leads' | 'engagement' | 'traffic' | 'calls';
type PlacementMode = 'mobile' | 'desktop' | 'reels' | 'story';
type TargetGender = 'all' | 'male' | 'female';
export type PromotionStatus = 'in_review' | 'active' | 'completed';

export const PROMOTION_STATUS_CONFIG: Record<PromotionStatus, {
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  badgeBg: string;
  badgeFg: string;
  badgeBorder: string;
  dotColor: string;
  icon: any;
}> = {
  in_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'In Review',
    descAr: 'يتم فحص الإعلان والتحقق من توافقه مع معايير المنصة (خلال 5-15 دقيقة).',
    descEn: 'Ad is being reviewed for platform policy compliance (5-15 mins).',
    badgeBg: 'bg-amber-500/10',
    badgeFg: 'text-amber-600 dark:text-amber-400',
    badgeBorder: 'border-amber-500/30',
    dotColor: 'bg-amber-500',
    icon: Clock
  },
  active: {
    labelAr: 'نشط ومُموَّل',
    labelEn: 'Active & Sponsored',
    descAr: 'الإعلان نشط حالياً ويظهر في صدارة الخلاصة ومقاطع الريلز للمستهدفين.',
    descEn: 'Campaign is live and actively delivered across feeds and reels.',
    badgeBg: 'bg-[var(--status-success-subtle)]',
    badgeFg: 'text-[var(--fg-success)] dark:text-[var(--fg-success)]',
    badgeBorder: 'border-[var(--fg-success)]/30',
    dotColor: 'bg-[var(--fg-success)]',
    icon: Rocket
  },
  completed: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    descAr: 'اكتملت فترة الترويج المحددة وتم استيفاء ميزانية الحملة بنجاح.',
    descEn: 'Campaign duration finished and promotion budget successfully delivered.',
    badgeBg: 'bg-blue-500/10',
    badgeFg: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-500/30',
    dotColor: 'bg-blue-500',
    icon: CheckCheck
  }
};

const GOAL_OPTIONS: {
  id: CampaignGoal;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: any;
  badgeAr?: string;
  badgeEn?: string;
  isRecommended?: boolean;
}[] = [
  {
    id: 'whatsapp_leads',
    titleAr: 'تلقي المزيد من رسائل الواتساب',
    titleEn: 'Get More WhatsApp Messages',
    descAr: 'عرض زر واتساب بارز وتوجيه العملاء مباشرة لمحادثة مبيعات فورية.',
    descEn: 'Display a prominent WhatsApp CTA to drive direct customer inquiries.',
    icon: MessageCircle,
    badgeAr: 'مُوصى به ⭐',
    badgeEn: 'Recommended ⭐',
    isRecommended: true
  },
  {
    id: 'engagement',
    titleAr: 'زيادة معدل التفاعل والانتشار',
    titleEn: 'Boost Post Engagement',
    descAr: 'الحصول على المزيد من الإعجابات، التعليقات، ومشاركات المنشور في الخلاصة.',
    descEn: 'Get more likes, comments, and post shares across the community feed.',
    icon: ThumbsUp,
    badgeAr: 'تفاعل عالي',
    badgeEn: 'High Reach'
  },
  {
    id: 'traffic',
    titleAr: 'جذب المزيد من زوار موقع الويب',
    titleEn: 'Drive Website Visitors',
    descAr: 'تحفيز العملاء على زيارة متجرك الإلكتروني أو صفحة الهبوط الخارجية.',
    descEn: 'Encourage users to click through and visit your landing page or store.',
    icon: Globe
  },
  {
    id: 'calls',
    titleAr: 'تلقي المزيد من المكالمات الهاتفية',
    titleEn: 'Get More Phone Calls',
    descAr: 'إبراز زر الاتصال الهاتفي المباشر لخدمة العملاء والطلبات السريعة.',
    descEn: 'Highlight a direct click-to-call button for immediate customer phone calls.',
    icon: Phone
  }
];

export const AdPromotionStudioView: React.FC<AdPromotionStudioViewProps> = ({
  ad,
  walletBalance,
  token,
  isRtl,
  onBack,
  onSuccess,
  onNavigateToWallet,
  onRequestDepositModal
}) => {
  // Real-time synced wallet balance state
  const [liveBalance, setLiveBalance] = useState<number>(walletBalance);

  useEffect(() => {
    setLiveBalance(walletBalance);
  }, [walletBalance]);

  // Fetch latest wallet balance on mount and sync on real-time balance update events
  const refreshWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        const bal = parseFloat(data.balance) || 0;
        setLiveBalance(bal);
      }
    } catch (e) {
      // Fallback to prop
    }
  };

  useEffect(() => {
    refreshWallet();
    const handleWalletUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ balance?: number }>;
      if (typeof customEvent.detail?.balance === 'number') {
        setLiveBalance(customEvent.detail.balance);
      } else {
        refreshWallet();
      }
    };
    window.addEventListener('perplexta:wallet_balance_updated', handleWalletUpdate);
    window.addEventListener('focus', refreshWallet);
    return () => {
      window.removeEventListener('perplexta:wallet_balance_updated', handleWalletUpdate);
      window.removeEventListener('focus', refreshWallet);
    };
  }, [token]);

  // Campaign Setup State
  const [goal, setGoal] = useState<CampaignGoal>('whatsapp_leads');
  const [isGoalSelectorOpen, setIsGoalSelectorOpen] = useState<boolean>(false);

  // Messaging & WhatsApp state
  const [whatsappNumber, setWhatsappNumber] = useState<string>(ad.whatsapp_number || ad.phone_number || '');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    'مرحباً! يُرجى إخبارنا بطريقة يمكننا مساعدتك بها.'
  );
  const [quickQuestions, setQuickQuestions] = useState<string[]>([
    'مرحباً! هل يمكنني الحصول على مزيد من المعلومات حول هذا؟',
    'كم السعر ومواعيد التوصيل والتوفر؟',
    'هل هذا العرض متوفر حالياً؟'
  ]);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  // Targeting Audience State
  const [gender, setGender] = useState<TargetGender>('all');
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(55);
  const [selectedCities, setSelectedCities] = useState<string[]>([
    ad.location_city || 'القدس الشريف',
    'رام الله والبيرة',
    'الخليل',
    'غزة',
    'نابلس'
  ]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'ecom_general_store',
    'biz_digital_marketing',
    'tech_software_dev'
  ]);
  const [isAudienceEditorOpen, setIsAudienceEditorOpen] = useState<boolean>(false);

  // Budget & Duration State
  const [durationDays, setDurationDays] = useState<number>(3);
  const [dailyBudget, setDailyBudget] = useState<number>(2.00);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live Preview Placement Mode
  const [placementMode, setPlacementMode] = useState<PlacementMode>('mobile');

  // Ad Promotion Status State (in_review, active, completed)
  const getInitialPromotionStatus = (): PromotionStatus => {
    if (ad.is_boosted) {
      if (ad.boosted_until && new Date(ad.boosted_until) < new Date()) {
        return 'completed';
      }
      if (ad.status === 'pending') {
        return 'in_review';
      }
      return 'active';
    }
    return ad.status === 'pending' ? 'in_review' : 'active';
  };

  const [previewStatus, setPreviewStatus] = useState<PromotionStatus>(getInitialPromotionStatus);

  // Calculations
  const totalCost = Number((durationDays * dailyBudget).toFixed(2));
  const hasSufficientBalance = liveBalance >= totalCost;
  const missingAmount = Math.max(0, totalCost - liveBalance);

  // Estimated Reach Formula (Proportional to Daily Budget)
  const estReachMin = Math.round(dailyBudget * 2200);
  const estReachMax = Math.round(dailyBudget * 6800);
  const estInteractionsMin = Math.round(dailyBudget * 8);
  const estInteractionsMax = Math.round(dailyBudget * 26);

  // End Date calculation
  const endDateFormatted = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + durationDays);
    return end.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [durationDays, isRtl]);

  const activeGoalObj = GOAL_OPTIONS.find(g => g.id === goal) || GOAL_OPTIONS[0];

  const handleToggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      if (selectedCities.length > 1) {
        setSelectedCities(prev => prev.filter(c => c !== cityName));
      } else {
        toast.info(isRtl ? 'يجب الإبقاء على مدينة مستهدفة واحدة على الأقل' : 'At least one target city is required');
      }
    } else {
      setSelectedCities(prev => [...prev, cityName]);
    }
  };

  const handleToggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(prev => prev.filter(i => i !== interestId));
    } else {
      setSelectedInterests(prev => [...prev, interestId]);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    if (quickQuestions.length >= 5) {
      toast.info(isRtl ? 'الحد الأقصى للأسئلة المجهزة هو 5 أسئلة' : 'Maximum 5 preset questions allowed');
      return;
    }
    setQuickQuestions(prev => [...prev, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuickQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLaunchPromotion = async () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً لتمويل وترويج الإعلان' : 'Please log in first to boost your ad');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error(
        isRtl
          ? `رصيدك الحالي ($${liveBalance.toFixed(2)}) غير كافٍ لتغطية ميزانية الحملة ($${totalCost.toFixed(2)} USD). يرجى شحن المحفظة أولاً.`
          : `Insufficient wallet balance ($${liveBalance.toFixed(2)}). Please top up ($${totalCost.toFixed(2)} needed).`
      );
      if (onRequestDepositModal) onRequestDepositModal();
      else if (onNavigateToWallet) onNavigateToWallet();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        days: durationDays,
        daily_budget: dailyBudget,
        tierName: isRtl ? activeGoalObj.titleAr : activeGoalObj.titleEn,
        goal: goal,
        settings: {
          whatsapp_number: whatsappNumber,
          welcome_message: welcomeMessage,
          quick_questions: quickQuestions,
          target_gender: gender,
          age_min: ageMin,
          age_max: ageMax,
          target_cities: selectedCities,
          target_interests: selectedInterests,
          daily_budget: dailyBudget,
          total_budget: totalCost,
          duration_days: durationDays
        }
      };

      const res = await fetch(`/api/bulletin/ads/${ad.id}/boost-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.ad) {
        const newCalculatedBalance = typeof data.new_balance === 'number'
          ? data.new_balance
          : Math.max(0, liveBalance - totalCost);
        
        setLiveBalance(newCalculatedBalance);
        window.dispatchEvent(new CustomEvent('perplexta:wallet_balance_updated', {
          detail: { balance: newCalculatedBalance }
        }));

        toast.success(
          isRtl
            ? `تم إطلاق وترويج حملتك الإعلانية بنجاح! تم خصم $${totalCost.toFixed(2)} USD من المحفظة وانتقل المنشور للصدارة.`
            : `Ad campaign launched successfully! $${totalCost.toFixed(2)} USD deducted from wallet.`
        );
        onSuccess(data.ad);
        onBack();
      } else {
        toast.error(data.error || (isRtl ? 'فشل إطلاق الحملة الترويجية' : 'Failed to launch promotion'));
      }
    } catch (err: any) {
      console.error('[Promotion Studio] Launch error:', err);
      toast.error(isRtl ? 'حدث خطأ أثناء معالجة الحملة الإعلانية' : 'Error processing ad promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] pb-24 transition-colors">
      {/* Top Meta-Grade Studio Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface-card)]/95 backdrop-blur-md border-b border-[var(--border-main)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 border border-transparent hover:border-[var(--border-main)]"
              title={isRtl ? 'رجوع إلى الخلاصة' : 'Back to Feed'}
            >
              {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              <span className="text-sm font-bold hidden sm:inline">
                {isRtl ? 'الرجوع إلى الخلاصة' : 'Back to Feed'}
              </span>
            </button>
            <div className="h-6 w-px bg-[var(--border-main)] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-accent/15 text-accent">
                  <Rocket size={16} />
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight">
                  {isRtl ? 'استوديو ترويج المنشورات والحملات الإعلانية' : 'Post Promotion & Ads Studio'}
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {isRtl ? 'Meta-Standard Studio' : 'Meta Standard'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate max-w-md hidden sm:block">
                {ad.title} • {ad.category || (isRtl ? 'عام' : 'General')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-Time Wallet Balance Pill */}
            <div className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center gap-2 text-xs">
              <Wallet size={15} className="text-[var(--fg-success)]" />
              <span className="text-[var(--text-muted)] font-medium hidden md:inline">
                {isRtl ? 'رصيد المحفظة:' : 'Wallet:'}
              </span>
              <span className="font-extrabold text-[var(--fg-success)] dark:text-[var(--fg-success)] font-mono">
                ${liveBalance.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace Split Screen */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ============================================================ */}
          {/* COLUMN 1: Campaign Configuration Controls (7 Columns)       */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SECTION 1: Campaign Goal / Objective */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                    1
                  </span>
                  <div>
                    <h2 className="font-bold text-base">
                      {isRtl ? 'الهدف من الترويج' : 'Campaign Objective / Goal'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isRtl ? 'ما هي النتيجة التي تود تحقيقها من هذا الإعلان؟' : 'What outcome do you want from this promotion?'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGoalSelectorOpen(!isGoalSelectorOpen)}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  {isRtl ? (isGoalSelectorOpen ? 'إخفاء' : 'تغيير الهدف') : (isGoalSelectorOpen ? 'Hide' : 'Change Goal')}
                  <ChevronDown size={14} className={`transform transition-transform ${isGoalSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Selected Goal Highlight Banner */}
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-accent text-white shadow-xs">
                  <activeGoalObj.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {isRtl ? activeGoalObj.titleAr : activeGoalObj.titleEn}
                    </span>
                    {activeGoalObj.badgeAr && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-accent/15 text-accent">
                        {isRtl ? activeGoalObj.badgeAr : activeGoalObj.badgeEn}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {isRtl ? activeGoalObj.descAr : activeGoalObj.descEn}
                  </p>
                </div>
              </div>

              {/* Expanded Goal Options Drawer */}
              <AnimatePresence>
                {isGoalSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-[var(--border-main)] space-y-2.5"
                  >
                    {GOAL_OPTIONS.map((g) => {
                      const Icon = g.icon;
                      const isSelected = goal === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGoal(g.id);
                            setIsGoalSelectorOpen(false);
                          }}
                          className={`w-full text-start p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-accent bg-accent/10 shadow-xs'
                              : 'border-[var(--border-main)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)]'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent text-white' : 'bg-[var(--surface-card)] text-[var(--text-secondary)]'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">
                                {isRtl ? g.titleAr : g.titleEn}
                              </span>
                              {isSelected && <Check size={16} className="text-accent" />}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {isRtl ? g.descAr : g.descEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 2: Messaging & Welcome Template (If WhatsApp / Messaging Goal) */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-xl bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h2 className="font-bold text-base">
                    {isRtl ? 'المراسلة وقالب الرسالة الترحيبية' : 'Messaging & Welcome Template'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isRtl ? 'الرسالة التي ستظهر للمستخدم فور نقره على زر الواتساب' : 'Greeting message shown when users click your WhatsApp CTA'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* WhatsApp Number Field */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    {isRtl ? 'رقم الواتساب المعتمد للمبيعات:' : 'Connected WhatsApp Phone Number:'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 start-3 flex items-center text-[var(--fg-success)] dark:text-[var(--fg-success)] pointer-events-none">
                      <MessageCircle size={18} />
                    </span>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+970599000000"
                      className="w-full ps-10 pe-4 py-2.5 text-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] rounded-xl focus:border-[var(--fg-success)]/40 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Greeting Message Template */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    {isRtl ? 'نص الرسالة الترحيبية التلقائية:' : 'Automated Welcome Message:'}
                  </label>
                  <textarea
                    rows={2}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full p-3 text-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] rounded-xl focus:border-accent focus:ring-1 focus:ring-accent outline-hidden resize-none"
                  />
                </div>

                {/* Quick Questions Preset */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">
                      {isRtl ? 'الأسئلة المقترحة السريعة للعملاء (FAQs):' : 'Preset Quick Inquiries for Customers:'}
                    </label>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {quickQuestions.length}/5
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {quickQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-secondary)]"
                      >
                        <span className="truncate flex-1 pe-2 font-medium">💬 {q}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {quickQuestions.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } }}
                        placeholder={isRtl ? 'أضف سؤالاً مقترحاً جديداً...' : 'Add a quick preset question...'}
                        className="flex-1 px-3 py-2 text-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] rounded-lg outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="px-3 py-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-main)] rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>{isRtl ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Advantage+ Audience & Location Targeting */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    3
                  </span>
                  <div>
                    <h2 className="font-bold text-base">
                      {isRtl ? 'الجمهور والمناطق المستهدفة' : 'Audience & Location Targeting'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isRtl ? 'تحديد الشريحة الجغرافية والديموغرافية والاهتمامات' : 'Define geographic locations, demographics, and user interests'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAudienceEditorOpen(!isAudienceEditorOpen)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 size={14} />
                  <span>{isRtl ? (isAudienceEditorOpen ? 'طي الإعدادات' : 'تعديل الجمهور') : (isAudienceEditorOpen ? 'Collapse' : 'Edit Audience')}</span>
                </button>
              </div>

              {/* Audience Summary Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block">{isRtl ? 'الجنس:' : 'Gender:'}</span>
                    <span className="font-bold">
                      {gender === 'all' ? (isRtl ? 'الكل (رجال ونساء)' : 'All') : gender === 'male' ? (isRtl ? 'رجال فقط' : 'Men') : (isRtl ? 'نساء فقط' : 'Women')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">{isRtl ? 'الفئة العمرية:' : 'Age Range:'}</span>
                    <span className="font-bold font-mono">{ageMin} - {ageMax} {isRtl ? 'سنة' : 'yrs'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[var(--text-muted)] block">{isRtl ? 'المدن المستهدفة:' : 'Target Cities:'}</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {selectedCities.length} {isRtl ? 'مدن ومحافظات' : 'cities'}
                    </span>
                  </div>
                </div>

                {/* Cities Pill Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCities.map((city) => (
                    <span
                      key={city}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-secondary)] flex items-center gap-1"
                    >
                      <MapPin size={11} className="text-purple-500" />
                      {city}
                    </span>
                  ))}
                </div>

                {/* Target Categories Summary Badges */}
                {selectedInterests.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-main)]/60">
                    <div className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      <Layers size={11} className="text-purple-500" />
                      <span>{isRtl ? `الاهتمامات والفئات المستهدفة (${selectedInterests.length}):` : `Targeted Categories (${selectedInterests.length}):`}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInterests.slice(0, 4).map((catId) => {
                        const cat = MASTER_PLATFORM_CATEGORIES.find(c => c.id === catId);
                        const label = cat ? (isRtl ? cat.nameAr : cat.nameEn) : catId;
                        return (
                          <span
                            key={catId}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                          >
                            {label}
                          </span>
                        );
                      })}
                      {selectedInterests.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-main)]">
                          +{selectedInterests.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Audience Controls Drawer */}
              <AnimatePresence>
                {isAudienceEditorOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-[var(--border-main)] space-y-5"
                  >
                    {/* Gender Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                        {isRtl ? 'الجنس المستهدف:' : 'Target Gender:'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['all', 'male', 'female'] as TargetGender[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              gender === g
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:bg-[var(--surface-card)]'
                            }`}
                          >
                            {g === 'all' ? (isRtl ? 'الكل' : 'All') : g === 'male' ? (isRtl ? 'الرجال' : 'Men') : (isRtl ? 'النساء' : 'Women')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age Range Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-[var(--text-secondary)]">{isRtl ? 'النطاق العمري:' : 'Age Range:'}</span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono">{ageMin} - {ageMax} {isRtl ? 'سنة' : 'years'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)] block mb-1">{isRtl ? 'الحد الأدنى:' : 'Min Age:'} {ageMin}</span>
                          <input
                            type="range"
                            min={18}
                            max={65}
                            value={ageMin}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val <= ageMax) setAgeMin(val);
                            }}
                            className="w-full accent-purple-600"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-[var(--text-muted)] block mb-1">{isRtl ? 'الحد الأقصى:' : 'Max Age:'} {ageMax}</span>
                          <input
                            type="range"
                            min={18}
                            max={65}
                            value={ageMax}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= ageMin) setAgeMax(val);
                            }}
                            className="w-full accent-purple-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* City Selector Multi-select */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">
                        {isRtl ? 'المدن والمحافظات المستهدفة:' : 'Target Cities & Governorates:'}
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-main)]">
                        {PALESTINE_GEO.cities.map((c) => {
                          const isSelected = selectedCities.includes(c.nameAr);
                          return (
                            <button
                              key={c.nameAr}
                              type="button"
                              onClick={() => handleToggleCity(c.nameAr)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-purple-300'
                              }`}
                            >
                              <MapPin size={12} />
                              <span>{isRtl ? c.nameAr : c.nameEn}</span>
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Platform Categories & Interests Detailed Targeting */}
                    <div className="pt-2 border-t border-[var(--border-main)]">
                      <CategoryTargetingSelector
                        selectedCategoryIds={selectedInterests}
                        onChange={setSelectedInterests}
                        isRtl={isRtl}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 4: Schedule, Duration & Daily Budget */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <div>
                  <h2 className="font-bold text-base">
                    {isRtl ? 'الجدول الزمني والميزانية اليومية' : 'Schedule, Duration & Budget'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isRtl ? 'تحكم مرن في مدة تشغيل الإعلان والمبلغ المستثمر يومياً' : 'Flexible control over campaign duration and daily investment'}
                  </p>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Calendar size={15} className="text-blue-500" />
                    {isRtl ? 'مدة الحملة الإعلانية:' : 'Campaign Duration:'}
                  </span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                    {durationDays} {isRtl ? 'أيام' : 'Days'}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full accent-blue-600 mb-3"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        durationDays === days
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-blue-300'
                      }`}
                    >
                      {days} {isRtl ? (days === 1 ? 'يوم' : days === 2 ? 'يومان' : 'أيام') : 'Days'}
                    </button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{isRtl ? 'تاريخ انتهاء الحملة:' : 'Campaign Ends:'}</span>
                  <span className="font-bold text-[var(--text-primary)]">{endDateFormatted}</span>
                </div>
              </div>

              {/* Daily Budget Slider */}
              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <DollarSign size={15} className="text-[var(--fg-success)]" />
                    {isRtl ? 'الميزانية اليومية المستثمرة:' : 'Daily Investment Budget:'}
                  </span>
                  <span className="text-base font-black text-[var(--fg-success)] dark:text-[var(--fg-success)] font-mono">
                    ${dailyBudget.toFixed(2)} USD / {isRtl ? 'يوم' : 'day'}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 mb-3"
                />

                {/* Quick Budget Pills */}
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10, 20, 50].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setDailyBudget(b)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        dailyBudget === b
                          ? 'bg-[var(--comp-button-primary-bg)] text-white border-[var(--comp-button-primary-bg)]'
                          : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-[var(--border-accent)]'
                      }`}
                    >
                      ${b} / {isRtl ? 'يوم' : 'day'}
                    </button>
                  ))}
                </div>

                {/* Total Cost Breakdown */}
                <div className="mt-3 pt-3 border-t border-[var(--border-main)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {isRtl ? 'التكلفة الإجمالية للحملة:' : 'Total Campaign Cost:'}
                  </span>
                  <span className="text-lg font-black text-accent font-mono">
                    ${totalCost.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* COLUMN 2: Multi-Placement Live Preview & Billing (5 Columns) */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-6 sticky top-20">
            
            {/* CARD 1: Live Multi-Placement Ad Preview */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Eye size={16} className="text-accent" />
                  {isRtl ? 'معاينة الإعلان المباشرة' : 'Live Multi-Placement Preview'}
                </h3>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1.5 ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeFg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBorder}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                  {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].labelAr : PROMOTION_STATUS_CONFIG[previewStatus].labelEn}
                </span>
              </div>

              {/* Live Promotion Status Tracker & Interactive Switcher */}
              <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] mb-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Activity size={14} className="text-accent" />
                    {isRtl ? 'حالة الترويج والمتابعة:' : 'Promotion Tracking Status:'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {previewStatus === 'active' 
                      ? (isRtl ? `متبقي ${durationDays} أيام` : `${durationDays} days remaining`)
                      : previewStatus === 'in_review'
                      ? (isRtl ? 'مراجعة فورية (5-15 دقيقة)' : 'Fast Review (5-15m)')
                      : (isRtl ? 'حملة مكتملة' : 'Finished Campaign')}
                  </span>
                </div>

                {/* 3 Status Toggle Buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(['in_review', 'active', 'completed'] as PromotionStatus[]).map((st) => {
                    const conf = PROMOTION_STATUS_CONFIG[st];
                    const Icon = conf.icon;
                    const isSel = previewStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPreviewStatus(st)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          isSel
                            ? `${conf.badgeBg} ${conf.badgeFg} ${conf.badgeBorder} shadow-2xs`
                            : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-main)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Icon size={13} className={isSel ? conf.badgeFg : ''} />
                        <span>{isRtl ? conf.labelAr : conf.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Description Explainer */}
                <p className="text-[10px] text-[var(--text-muted)] leading-tight pt-0.5">
                  {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].descAr : PROMOTION_STATUS_CONFIG[previewStatus].descEn}
                </p>
              </div>

              {/* Placement Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-main)] mb-4">
                {[
                  { id: 'mobile', icon: Smartphone, labelAr: 'هاتف', labelEn: 'Mobile' },
                  { id: 'desktop', icon: Monitor, labelAr: 'مكتب', labelEn: 'Desktop' },
                  { id: 'reels', icon: Film, labelAr: 'ريلز', labelEn: 'Reel' },
                  { id: 'story', icon: Clock, labelAr: 'قصة', labelEn: 'Story' }
                ].map((p) => {
                  const Icon = p.icon;
                  const isActive = placementMode === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlacementMode(p.id as PlacementMode)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-[var(--surface-card)] text-accent shadow-xs border border-[var(--border-main)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{isRtl ? p.labelAr : p.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Placement Preview Container */}
              <div className="relative min-h-[420px] flex items-center justify-center">
                
                {/* 1. MOBILE FEED PREVIEW */}
                {placementMode === 'mobile' && (
                  <div className="w-full rounded-2xl border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden shadow-md">
                    {/* Mock Mobile Status Bar */}
                    <div className="px-3.5 py-1.5 bg-[var(--surface-subtle)] border-b border-[var(--border-main)]/50 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <Wifi size={11} />
                        <span className="font-bold text-[9px]">5G</span>
                        <Battery size={12} className="rotate-90" />
                      </div>
                    </div>

                    {/* Mobile Post Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                          alt={ad.author_name || 'Author'}
                          className="w-9 h-9 rounded-full object-cover border border-[var(--border-main)]"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs">
                              {ad.page_name || ad.author_name || (isRtl ? 'المعلن' : 'Advertiser')}
                            </span>
                            {ad.page_is_verified && (
                              <CheckCircle2 size={13} className="text-blue-500 fill-blue-500 text-white" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                            <span className="font-semibold text-accent">{isRtl ? 'مُموَّل' : 'Sponsored'}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeFg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBorder}`}>
                              <span className={`w-1 h-1 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                              {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].labelAr : PROMOTION_STATUS_CONFIG[previewStatus].labelEn}
                            </span>
                            <span>•</span>
                            <Globe size={10} />
                          </div>
                        </div>
                      </div>
                      <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    {/* Post Text Caption */}
                    <div className="px-3 pb-2.5 text-xs text-[var(--text-primary)] leading-relaxed">
                      <p className="font-bold mb-1">{ad.title}</p>
                      <p className="text-[var(--text-secondary)] text-[11px] line-clamp-3">{ad.description}</p>
                    </div>

                    {/* Media Display */}
                    {(ad.image_url || ad.video_url) && (
                      <div className="relative aspect-4/3 sm:aspect-16/9 bg-black/5 overflow-hidden">
                        {ad.image_url ? (
                          <img
                            src={getMediaUrl(ad.image_url) || undefined}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white/50">
                            <Film size={24} />
                          </div>
                        )}
                        <div className={`absolute top-2 start-2 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold border flex items-center gap-1.5 shadow-md ${
                          previewStatus === 'active'
                            ? 'bg-[var(--status-success-subtle)]/80 text-[var(--fg-success)] border-[var(--fg-success)]/40'
                            : previewStatus === 'in_review'
                            ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
                            : 'bg-blue-950/80 text-blue-200 border-blue-500/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                          <span>{isRtl ? `حالة الترويج: ${PROMOTION_STATUS_CONFIG[previewStatus].labelAr}` : `Promotion: ${PROMOTION_STATUS_CONFIG[previewStatus].labelEn}`}</span>
                        </div>
                      </div>
                    )}

                    {/* High-Conversion WhatsApp / CTA Action Box */}
                    <div className="p-3 bg-[var(--surface-subtle)] border-t border-b border-[var(--border-main)] flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">
                          {isRtl ? 'محادثة مباشرة' : 'Direct Conversation'}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate block font-mono">
                          {whatsappNumber ? `WhatsApp: ${whatsappNumber}` : (isRtl ? 'تواصل فوري مع المعلن' : 'Chat with Advertiser')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-[var(--comp-button-primary-bg)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <MessageCircle size={14} className="fill-white/20" />
                        <span>{isRtl ? 'تواصل عبر واتساب' : 'WhatsApp'}</span>
                      </button>
                    </div>

                    {/* Social Reaction Summary & Interaction Bar */}
                    <div className="px-3 py-2 bg-[var(--surface-card)]">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pb-2 border-b border-[var(--border-main)]/50">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">
                            👍
                          </span>
                          <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] -ms-2">
                            ❤️
                          </span>
                          <span className="font-semibold font-mono">1.8K</span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold">
                          <span>84 {isRtl ? 'تعليق' : 'comments'}</span>
                          <span>32 {isRtl ? 'مشاركة' : 'shares'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 pt-1.5 text-center text-xs text-[var(--text-secondary)] font-bold">
                        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg hover:bg-[var(--surface-subtle)] cursor-pointer">
                          <ThumbsUp size={13} className="text-blue-500" />
                          <span>{isRtl ? 'أعجبني' : 'Like'}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg hover:bg-[var(--surface-subtle)] cursor-pointer">
                          <MessageSquare size={13} />
                          <span>{isRtl ? 'تعليق' : 'Comment'}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg hover:bg-[var(--surface-subtle)] cursor-pointer">
                          <Share2 size={13} />
                          <span>{isRtl ? 'مشاركة' : 'Share'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DESKTOP FEED PREVIEW */}
                {placementMode === 'desktop' && (
                  <div className="w-full rounded-2xl border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden shadow-md">
                    {/* Desktop Browser Header Mock */}
                    <div className="px-3 py-2 bg-[var(--surface-subtle)] border-b border-[var(--border-main)] flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--fg-success)]" />
                      </div>
                      <div className="flex-1 max-w-xs mx-auto px-2.5 py-0.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-main)] text-[10px] text-[var(--text-muted)] font-mono truncate text-center">
                        https://perplexta.com/bulletin/ad/{ad.id || 'promo'}
                      </div>
                    </div>

                    {/* Desktop Card Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                            alt={ad.author_name || 'Author'}
                            className="w-10 h-10 rounded-full object-cover border border-[var(--border-main)]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">
                                {ad.page_name || ad.author_name || (isRtl ? 'المعلن الرسمي' : 'Official Advertiser')}
                              </span>
                              {ad.page_is_verified && (
                                <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                              <span className="font-bold text-accent">{isRtl ? 'مُموَّل • Sponsored' : 'Sponsored'}</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeFg} ${PROMOTION_STATUS_CONFIG[previewStatus].badgeBorder}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                                {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].labelAr : PROMOTION_STATUS_CONFIG[previewStatus].labelEn}
                              </span>
                              <span>•</span>
                              <Globe size={11} />
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal size={18} className="text-[var(--text-muted)]" />
                      </div>

                      <div className="text-xs text-[var(--text-primary)] leading-relaxed space-y-1">
                        <h4 className="font-bold text-sm">{ad.title}</h4>
                        <p className="text-[var(--text-secondary)] text-xs line-clamp-2">{ad.description}</p>
                      </div>

                      {/* Desktop Media */}
                      {(ad.image_url || ad.video_url) && (
                        <div className="relative aspect-16/9 rounded-xl bg-black/5 overflow-hidden border border-[var(--border-main)]">
                          {ad.image_url ? (
                            <img
                              src={getMediaUrl(ad.image_url) || undefined}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white/50">
                              <Film size={28} />
                            </div>
                          )}
                          <div className={`absolute top-2.5 start-2.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-bold border flex items-center gap-1.5 shadow-md ${
                            previewStatus === 'active'
                              ? 'bg-[var(--status-success-subtle)]/80 text-[var(--fg-success)] border-[var(--fg-success)]/40'
                              : previewStatus === 'in_review'
                              ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
                              : 'bg-blue-950/80 text-blue-200 border-blue-500/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                            <span>{isRtl ? `حالة الترويج: ${PROMOTION_STATUS_CONFIG[previewStatus].labelAr}` : `Status: ${PROMOTION_STATUS_CONFIG[previewStatus].labelEn}`}</span>
                          </div>
                        </div>
                      )}

                      {/* Desktop Link Card & Action */}
                      <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block font-bold">
                            PERPLEXTA.COM
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                            {ad.title}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] truncate block">
                            {whatsappNumber ? `WhatsApp: ${whatsappNumber}` : (isRtl ? 'تواصل مع المعلن مباشرة' : 'Contact on WhatsApp')}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
                        >
                          <MessageCircle size={15} />
                          <span>{isRtl ? 'تواصل عبر واتساب' : 'Send WhatsApp Message'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. REELS VERTICAL VIDEO PREVIEW */}
                {placementMode === 'reels' && (
                  <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-9/16 rounded-3xl border-2 border-[var(--border-main)] bg-black text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                    {/* Background Media Full-Bleed */}
                    <div className="absolute inset-0 z-0">
                      {ad.image_url ? (
                        <img
                          src={getMediaUrl(ad.image_url) || undefined}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-950 to-black" />
                      )}
                      {/* Dark Overlays for Readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
                    </div>

                    {/* Top Reels Header Bar */}
                    <div className="relative z-10 p-3.5 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Film size={15} className="text-accent" />
                        <span>{isRtl ? 'مقاطع ريلز المُموَّلة' : 'Sponsored Reel'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-md flex items-center gap-1 ${
                          previewStatus === 'active'
                            ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/40'
                            : previewStatus === 'in_review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                          {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].labelAr : PROMOTION_STATUS_CONFIG[previewStatus].labelEn}
                        </span>
                      </div>
                      <Volume2 size={16} className="text-white/80" />
                    </div>

                    {/* Right-Side Vertical Engagement Rail */}
                    <div className="absolute end-3 bottom-20 z-10 flex flex-col items-center gap-3.5">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:scale-110 transition-transform">
                          <Heart size={18} className="fill-red-500 text-red-500" />
                        </div>
                        <span className="text-[10px] font-bold font-mono">24.8K</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:scale-110 transition-transform">
                          <MessageSquare size={17} />
                        </div>
                        <span className="text-[10px] font-bold font-mono">512</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:scale-110 transition-transform">
                          <Share2 size={17} />
                        </div>
                        <span className="text-[10px] font-bold font-mono">1.9K</span>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                        <Bookmark size={17} />
                      </div>

                      {/* Rotating Vinyl Audio Disc */}
                      <div className="w-8 h-8 rounded-full border border-white/30 p-1 mt-1 animate-spin" style={{ animationDuration: '4s' }}>
                        <div className="w-full h-full rounded-full bg-accent/80 flex items-center justify-center">
                          <Disc size={14} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Creator & Conversion Details */}
                    <div className="relative z-10 p-3.5 space-y-2.5">
                      {/* Creator Row */}
                      <div className="flex items-center gap-2">
                        <img
                          src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                          alt={ad.author_name || 'Author'}
                          className="w-8 h-8 rounded-full object-cover border border-white/40"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs truncate">
                              {ad.page_name || ad.author_name || (isRtl ? 'المعلن' : 'Advertiser')}
                            </span>
                            {ad.page_is_verified && (
                              <CheckCircle2 size={12} className="text-blue-400 fill-blue-400 text-white" />
                            )}
                          </div>
                          <span className="text-[9px] text-accent font-bold block">
                            {isRtl ? 'مُموَّل • Sponsored' : 'Sponsored'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full border border-white/40 text-[10px] font-bold ms-auto">
                          {isRtl ? 'متابعة' : 'Follow'}
                        </span>
                      </div>

                      {/* Title & Caption */}
                      <div className="text-[11px] text-white/90 leading-tight">
                        <p className="font-bold line-clamp-1">{ad.title}</p>
                        <p className="text-white/70 line-clamp-2 text-[10px] mt-0.5">{ad.description}</p>
                      </div>

                      {/* Audio Ticker */}
                      <div className="flex items-center gap-1 text-[9px] text-white/70">
                        <Disc size={10} className="animate-spin" />
                        <span className="truncate">{isRtl ? 'صوت أصلي • إعلان ترويجي رسمي' : 'Original Audio - Sponsored Ad'}</span>
                      </div>

                      {/* Floating Bottom Conversion Bar */}
                      <div className="pt-1">
                        <button
                          type="button"
                          className="w-full py-2 px-3 rounded-xl bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40"
                        >
                          <div className="flex items-center gap-1.5">
                            <MessageCircle size={15} className="fill-white/20" />
                            <span>{isRtl ? 'تواصل عبر واتساب' : 'WhatsApp Message'}</span>
                          </div>
                          <span className="text-[10px] opacity-80 font-mono">
                            {whatsappNumber ? `${whatsappNumber.slice(0, 7)}...` : (isRtl ? 'مباشر' : 'Direct')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. STORY 24H FULL-SCREEN PREVIEW */}
                {placementMode === 'story' && (
                  <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-9/16 rounded-3xl border-2 border-[var(--border-main)] bg-black text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                    {/* Background Visual Full-Bleed */}
                    <div className="absolute inset-0 z-0">
                      {ad.image_url ? (
                        <img
                          src={getMediaUrl(ad.image_url) || undefined}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-black" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />
                    </div>

                    {/* Top Segmented Story Progress Bars */}
                    <div className="relative z-10 p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-1 rounded-full bg-white" />
                        <div className="h-1 rounded-full bg-white" />
                        <div className="h-1 rounded-full bg-white/40 overflow-hidden">
                          <div className="h-full bg-white w-2/3" />
                        </div>
                      </div>

                      {/* Story Creator Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={ad.page_avatar || ad.author_avatar || '/default-avatar.png'}
                            alt={ad.author_name || 'Author'}
                            className="w-8 h-8 rounded-full object-cover border-2 border-accent"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs">
                                {ad.page_name || ad.author_name || (isRtl ? 'المعلن' : 'Advertiser')}
                              </span>
                              {ad.page_is_verified && (
                                <CheckCircle2 size={12} className="text-blue-400 fill-blue-400 text-white" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-white/70">
                              <span className="font-bold text-accent">{isRtl ? 'مُموَّل' : 'Sponsored'}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border backdrop-blur-md flex items-center gap-1 ${
                                previewStatus === 'active'
                                  ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border-[var(--fg-success)]/40'
                                  : previewStatus === 'in_review'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${PROMOTION_STATUS_CONFIG[previewStatus].dotColor} ${previewStatus === 'active' ? 'animate-pulse' : ''}`} />
                                {isRtl ? PROMOTION_STATUS_CONFIG[previewStatus].labelAr : PROMOTION_STATUS_CONFIG[previewStatus].labelEn}
                              </span>
                              <span>•</span>
                              <span>{isRtl ? 'منذ ساعتين' : '2h'}</span>
                            </div>
                          </div>
                        </div>
                        <X size={16} className="text-white/80" />
                      </div>
                    </div>

                    {/* Middle Story Headline Sticker */}
                    <div className="relative z-10 px-4 text-center">
                      <div className="inline-block px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
                        🔥 {ad.title}
                      </div>
                    </div>

                    {/* Bottom Swipe-Up Interactive CTA */}
                    <div className="relative z-10 p-3.5 space-y-2.5 text-center">
                      <div className="flex flex-col items-center animate-bounce">
                        <ChevronUp size={18} className="text-accent" />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-white/90">
                          {isRtl ? 'اسحب لأعلى للمراسلة' : 'Swipe Up to Chat'}
                        </span>
                      </div>

                      {/* WhatsApp Story Conversion Pill */}
                      <button
                        type="button"
                        className="w-full py-2.5 px-3 rounded-2xl bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60"
                      >
                        <MessageCircle size={15} className="fill-white/20" />
                        <span>{isRtl ? 'تواصل الآن عبر واتساب' : 'Send WhatsApp Message'}</span>
                      </button>

                      {/* Quick Reactions Bar */}
                      <div className="flex items-center justify-center gap-3 pt-1 text-sm">
                        {['❤️', '🔥', '👏', '😍', '😮'].map((emoji) => (
                          <span key={emoji} className="cursor-pointer hover:scale-125 transition-transform">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* CARD 2: Daily Estimated Results Radar */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-[var(--fg-success)]" />
                  {isRtl ? 'النتائج اليومية التقديرية' : 'Daily Estimated Results'}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {isRtl ? 'استناداً إلى الميزانية' : 'Based on budget'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Metric 1: Reach */}
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                      <Users size={14} className="text-blue-500" />
                      {isRtl ? 'مرات الظهور المقدرة:' : 'Estimated Daily Reach:'}
                    </span>
                    <span className="font-extrabold text-[var(--text-primary)] font-mono">
                      {estReachMin.toLocaleString()} - {estReachMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, (dailyBudget / 50) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: Interactions */}
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-[var(--fg-success)]" />
                      {isRtl ? 'الردود والتفاعلات المتوقعة:' : 'Estimated Inquiries / Clicks:'}
                    </span>
                    <span className="font-extrabold text-[var(--text-primary)] font-mono">
                      {estInteractionsMin} - {estInteractionsMax} {isRtl ? 'رد/يوم' : 'replies/day'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(20, (dailyBudget / 50) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Pure Wallet Account & Billing */}
            <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-main)] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[var(--fg-success)] dark:text-[var(--fg-success)]" />
                  {isRtl ? 'الحساب الإعلاني والمحفظة' : 'Ad Account & Wallet Billing'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] border border-[var(--fg-success)]/20">
                  {isRtl ? 'خصم مالي موثق' : 'Ledger Verified'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-main)] space-y-2.5 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>{isRtl ? 'رصيد المحفظة المتوفر:' : 'Available Wallet Balance:'}</span>
                  <span className="font-extrabold font-mono text-[var(--text-primary)]">${liveBalance.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>{isRtl ? 'إجمالي تكلفة الترويج:' : 'Total Promotion Cost:'}</span>
                  <span className="font-extrabold font-mono text-accent">-${totalCost.toFixed(2)} USD</span>
                </div>
                <div className="pt-2 border-t border-[var(--border-main)] flex justify-between font-bold">
                  <span>{isRtl ? 'الرصيد بعد الإطلاق:' : 'Balance After Launch:'}</span>
                  <span className={`font-mono ${hasSufficientBalance ? 'text-[var(--fg-success)] dark:text-[var(--fg-success)]' : 'text-red-500'}`}>
                    ${(liveBalance - totalCost).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Sufficiency Status Notification */}
              {hasSufficientBalance ? (
                <div className="p-3 rounded-xl bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/20 flex items-center gap-2.5 text-xs text-[var(--fg-success)] dark:text-[var(--fg-success)] font-medium">
                  <CheckCircle2 size={16} className="shrink-0 text-[var(--fg-success)]" />
                  <span>
                    {isRtl
                      ? 'رصيدك كافٍ تماماً. سيتم خصم المبلغ من المحفظة وتنشيط الحملة فورياً.'
                      : 'Sufficient balance. Campaign will activate immediately upon launch.'}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                    <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                    <span>
                      {isRtl
                        ? `الرصيد غير كافٍ. تحتاج إلى شحن $${missingAmount.toFixed(2)} USD.`
                        : `Insufficient balance. You need $${missingAmount.toFixed(2)} USD more.`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestDepositModal) onRequestDepositModal();
                      else if (onNavigateToWallet) onNavigateToWallet();
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Wallet size={14} />
                    <span>{isRtl ? 'شحن المحفظة الآن (إيداع سريع)' : 'Top Up Wallet Now'}</span>
                  </button>
                </div>
              )}

              {/* Master Launch Promotion Button */}
              <button
                type="button"
                disabled={isSubmitting || !hasSufficientBalance}
                onClick={handleLaunchPromotion}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  hasSufficientBalance && !isSubmitting
                    ? 'bg-accent hover:opacity-90 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-[var(--surface-subtle)] border border-[var(--border-default)] text-gray-500 cursor-not-allowed opacity-70'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isRtl ? 'جاري معالجة وتنشيط الحملة...' : 'Launching Promotion...'}</span>
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    <span>
                      {isRtl
                        ? `ترويج المنشور الآن (خصم $${totalCost.toFixed(2)} USD)`
                        : `Promote Post Now ($${totalCost.toFixed(2)} USD)`}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};
