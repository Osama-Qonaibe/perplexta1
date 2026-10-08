import { safeStorageGet } from "@/utils/safeStorage";
import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from '@/design-system';
import { 
  CheckCircle2, 
  MessageSquare, 
  LayoutGrid, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  Wallet, 
  AlertCircle, 
  X, 
  Loader2, 
  Copy, 
  Share2, 
  Search, 
  Sparkles, 
  Code2, 
  Cloud, 
  Cpu, 
  Scale, 
  Megaphone, 
  FileText, 
  Tv, 
  Mic, 
  Volume2, 
  GraduationCap, 
  Server, 
  Key, 
  Music,
  Clock
} from 'lucide-react';

import { ContentContainer } from '../components/ContentContainer';
import { ALL_TOOLS } from '../constants';
import { trackPremiumSubscriptionEvent } from '../utils/analytics';
import { triggerTierUnlockConfetti } from '../utils/confetti';

const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
};

const LimitItem = memo(({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) => {
  let daily = null;
  if (typeof value === 'object' && value !== null) {
    daily = value.daily;
  } else {
    daily = value;
  }
  const formatLimit = (v: any) => v === 'unlimited' ? '∞' : (v || 0);

  return (
    <div 
      title={label} 
      className="flex flex-col items-center justify-center p-1.5 md:p-2 rounded-shape-xs border bg-[var(--surface-subtle)] border-[var(--border-main)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-card)] transition-all duration-150 group"
    >
      <div className="transition-transform group-hover:scale-105 mb-1" style={{ color }}>
        {icon}
      </div>
      <span className="text-[10px] md:text-[11px] font-black text-[var(--text-primary)] leading-none">
        {formatLimit(daily)}
      </span>
    </div>
  );
});

LimitItem.displayName = 'LimitItem';

export const SubscriptionPage: React.FC = () => {
  const { 
    t, 
    dir, 
    plans, 
    plansLoaded, 
    payWithBalance, 
    stripeCheckout, 
    user, 
    balanceUSD, 
    refreshUser, 
    setIsAuthModalOpen, 
    token 
  } = useAppContext();

  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanCycles, setSelectedPlanCycles] = useState<Record<string, 'daily' | 'monthly' | 'annual'>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmingPlan, setConfirmingPlan] = useState<any>(null);
  const [confirmingCycle, setConfirmingCycle] = useState<'daily' | 'monthly' | 'annual'>('monthly');
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any>(null);
  const [resultModal, setResultModal] = useState<'success' | 'insufficient' | null>(null);
  const [copied, setCopied] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'user' | 'developer'>('user');

  const togglePlanExpand = (id: string) => {
    setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (params.get('success') === 'true') {
      const verifyAndRefresh = async () => {
        setIsVerifying(true);
        const authToken = safeStorageGet('app_token') || token;
        if (sessionId && authToken) {
          try {
            await fetch(`/api/payments/verify-subscription-session?session_id=${sessionId}`, {
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
          } catch (e) {
            console.error('Failed to verify session synchronously:', e);
          }
        }
        const updatedUser = (await refreshUser()) as any;
        const activePlanId = updatedUser?.subscription?.plan_id || (user as any)?.subscription?.plan_id;
        if (activePlanId) {
          const matchingPlan = plans.find(p => p.id.toString() === activePlanId.toString());
          if (matchingPlan) {
            setSelectedPlanForModal(matchingPlan);
            try {
              const price = billingCycle === 'annual' 
                ? (matchingPlan.annualPrice || matchingPlan.monthlyPrice * 12) 
                : (matchingPlan.monthlyPrice || 0);
              trackPremiumSubscriptionEvent(
                updatedUser?.id?.toString() || user?.id?.toString() || 'unknown',
                matchingPlan.id.toString(),
                matchingPlan.nameEn || matchingPlan.name || 'Premium Plan',
                Number(price),
                'USD',
                billingCycle
              );
            } catch (e) {
              console.error('[Analytics Error]:', e);
            }
          }
        }
        setResultModal('success');
        setIsVerifying(false);
        navigate('/subscription', { replace: true });
      };

      verifyAndRefresh();
    } else if (params.get('canceled') === 'true') {
      toast.info(dir === 'rtl' ? 'تم إلغاء عملية الدفع.' : 'Payment was canceled.');
      navigate('/subscription', { replace: true });
    }
  }, [refreshUser, navigate, dir, token, plans, user, billingCycle]);

  useEffect(() => {
    let timer: any;
    if (resultModal === 'success') {
      setRedirectCountdown(5);
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      setRedirectCountdown(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resultModal]);

  useEffect(() => {
    if (redirectCountdown === 0) {
      setResultModal(null);
      navigate('/');
    }
  }, [redirectCountdown, navigate]);

  const visiblePlans = plans.filter(plan => plan.isVisible);
  const displayedPlans = visiblePlans.filter(plan => {
    if (activeTab === 'developer') return plan.planType === 'developer';
    return !plan.planType || plan.planType === 'user';
  });

  const getPlanAvailableCycles = (plan: any): Array<'daily' | 'monthly' | 'annual'> => {
    const cycles: Array<'daily' | 'monthly' | 'annual'> = [];
    if (plan.isDailyEnabled) cycles.push('daily');
    if (plan.isMonthlyEnabled !== false) cycles.push('monthly');
    if (plan.isAnnualEnabled !== false) cycles.push('annual');
    return cycles.length > 0 ? cycles : ['monthly'];
  };

  const getEffectiveCycleForPlan = (plan: any): 'daily' | 'monthly' | 'annual' => {
    const planSpecific = selectedPlanCycles[plan.id];
    const avail = getPlanAvailableCycles(plan);
    if (planSpecific && avail.includes(planSpecific)) return planSpecific;
    if (avail.includes(billingCycle)) return billingCycle;
    return avail[0];
  };

  if (!plansLoaded) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-9 h-9 border-2 border-[var(--border-main)] border-t-[var(--fg-accent)] rounded-shape-full animate-spin" />
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {dir === 'rtl' ? 'جاري تحميل الخطط...' : 'Loading plans...'}
      </p>
    </div>
  );

  const getDisplayPrice = (plan: any, cycle: 'daily' | 'monthly' | 'annual') => {
    if (cycle === 'daily') return Number(plan.dailyPrice || 0);
    const m = Number(plan.monthlyPrice || 0);
    const a = Number(plan.annualPrice || 0);
    const d = Number(plan.discount || 0);
    if (cycle === 'monthly') return m;
    if (a > 0) return a;
    return m * 12 * (1 - d / 100);
  };

  const getCycleLabel = (cycle: 'daily' | 'monthly' | 'annual', plan: any) => {
    if (cycle === 'daily') {
      const days = plan.dailyDays || 7;
      return dir === 'rtl' ? `${days} أيام` : `${days} Days`;
    }
    if (cycle === 'annual') return t('annual');
    return t('monthly');
  };

  const getSavingPercentage = (plan: any) => {
    const m = Number(plan.monthlyPrice || 0);
    const a = Number(plan.annualPrice || 0);
    const d = Number(plan.discount || 0);
    if (a > 0 && m > 0) {
      const fullPrice = m * 12;
      const saving = Math.round((1 - a / fullPrice) * 100);
      return saving > 0 ? saving : 0;
    }
    if (d > 0) return d;
    return 0;
  };

  const referralLink = `${window.location.origin}/?ref=${user?.referral_code || user?.id || 'guest'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(
      dir === 'rtl' 
        ? 'تم نسخ رابط الإحالة الخاص بك بنجاح!' 
        : 'Referral link copied to clipboard successfully!'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t('appName'), text: t('subscriptionSuccessDesc'), url: referralLink });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const isActivePlan = (planId: string) => {
    return user?.subscription?.plan_id?.toString() === planId.toString() && user?.subscription?.status === 'active';
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (isActivePlan(planId)) return;
    
    const effectiveCycle = getEffectiveCycleForPlan(plan);
    const price = getDisplayPrice(plan, effectiveCycle);
    if (price === 0) {
      setLoading(`${planId}-stripe`);
      const res = await payWithBalance(planId, effectiveCycle);
      if (res.success) {
        await refreshUser();
        setResultModal('success');
      } else {
        toast.error(res.error || 'Activation failed');
      }
      setLoading(null);
      return;
    }

    setSelectedPlanForModal(plan);
    setLoading(`${planId}-stripe`);
    const res = await stripeCheckout(planId, effectiveCycle);
    if (res.error) toast.error(res.error);
    setLoading(null);
  };

  const handlePayWithBalance = async (planId: string) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const effectiveCycle = getEffectiveCycleForPlan(plan);
    setSelectedPlanForModal(plan);
    const price = getDisplayPrice(plan, effectiveCycle);
    if (balanceUSD < price) { setResultModal('insufficient'); return; }
    setConfirmingPlan(plan);
    setConfirmingCycle(effectiveCycle);
  };

  const executePayment = async () => {
    if (!confirmingPlan) return;
    setLoading(`${confirmingPlan.id}-balance`);
    const res = await payWithBalance(confirmingPlan.id, confirmingCycle);
    if (res.success) {
      triggerTierUnlockConfetti();
      setConfirmingPlan(null);
      await refreshUser();
      setResultModal('success');
      try {
        const price = getDisplayPrice(confirmingPlan, confirmingCycle);
        trackPremiumSubscriptionEvent(
          user?.id?.toString() || 'unknown',
          confirmingPlan.id.toString(),
          confirmingPlan.nameEn || confirmingPlan.name || 'Premium Plan',
          Number(price),
          'USD',
          confirmingCycle
        );
      } catch (e) {
        console.error('[Analytics Error]:', e);
      }
    } else {
      toast.error(res.error || 'Error');
    }
    setLoading(null);
  };

  return (
    <ContentContainer 
      className=""
    >
      {isVerifying && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[var(--surface-overlay)] backdrop-blur-md">
          <Loader2 className="animate-spin text-[var(--fg-accent)] mb-4" size={48} />
          <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-wider mb-2">
            {dir === 'rtl' ? 'جاري تفعيل الاشتراك...' : 'Activating Subscription...'}
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)]">
            {dir === 'rtl' ? 'يرجى الانتظار بينما نقوم بتأكيد الدفع الخاص بك وتنشيط الخطة' : 'Please wait while we confirm your payment and activate your plan'}
          </p>
        </div>
      )}

      <div className="sticky -top-0.5 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3.5 mb-6 transition-theme bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-main)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-9 h-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] sm:w-9 sm:h-9 rounded-shape-sm flex items-center justify-center transition-theme bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] active:scale-95 cursor-pointer touch-target-44"
              title={dir === 'rtl' ? 'رجوع' : 'Back'}
            >
              {dir === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase">{t('subscription')}</h1>
              <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                {dir === 'rtl' ? 'اختر الخطة المثالية لاحتياجاتك وأدائك' : 'CHOOSE YOUR PERFORMANCE TIER'}
              </p>
            </div>
          </div>

          <div className="p-1 rounded-shape-md flex items-center bg-[var(--surface-subtle)] border border-[var(--border-main)]">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 md:px-6 py-2 min-h-[36px] rounded-shape-sm text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                billingCycle === 'monthly' 
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('monthly')}
            </button>
            <button 
              onClick={() => setBillingCycle('annual')}
              className={`px-5 md:px-6 py-2 min-h-[36px] rounded-shape-sm text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual' 
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{t('annual')}</span>
              {Math.max(...plans.map(p => getSavingPercentage(p)), 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-shape-xs bg-[var(--status-success-subtle)] text-[var(--fg-success)] dark:text-[var(--fg-success)] text-[10px] font-bold">
                  -{Math.max(...plans.map(p => getSavingPercentage(p)), 0)}%
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Subscription Credit Meter */}
      {user?.subscription && user.subscription.status === 'active' && (
        <div className="mb-8 p-4 md:p-5 rounded-shape-md bg-gradient-to-r from-[var(--surface-card)] to-[var(--surface-subtle)] border border-[var(--border-main)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-shape-sm flex items-center justify-center bg-[var(--bg-accent-subtle)] text-[var(--fg-accent)] border border-[var(--border-accent)]/30 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {dir === 'rtl' ? user.subscription.plan_name_ar || user.subscription.plan_name_en : user.subscription.plan_name_en}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--status-success-subtle)] text-[var(--fg-success)]">
                    {dir === 'rtl' ? 'اشتراكك الحالي' : 'Active Plan'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                  {dir === 'rtl' 
                    ? `دورة الاشتراك: ${user.subscription.billing_period === 'annual' ? 'سنوي' : user.subscription.billing_period === 'daily' ? 'أيام مخصصة' : 'شهري'}` 
                    : `Billing Cycle: ${user.subscription.billing_period || 'Monthly'}`}
                  {user.subscription.current_period_end && ` • ${dir === 'rtl' ? 'موعد التجديد:' : 'Renewal:'} ${new Date(user.subscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-baseline sm:justify-end gap-1 font-mono">
                <span className="text-xl md:text-2xl font-black text-[var(--text-primary)]">
                  {(user.subscription.remaining_credits ?? ((user.subscription.cycle_credits || 0) - (user.subscription.used_credits || 0))).toLocaleString()}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-bold">
                  / {(user.subscription.cycle_credits || 0).toLocaleString()} {dir === 'rtl' ? 'كريديت' : 'credits'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                {dir === 'rtl' ? 'رصيد نقاط الذكاء الاصطناعي المتبقي لدورتك الحالية' : 'Remaining AI credits in this billing cycle'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-main)]">
            <div 
              className="h-full bg-gradient-to-r from-[var(--fg-accent)] to-[var(--fg-success)] transition-all duration-500 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, 100 - (user.subscription.usage_percentage || ((user.subscription.used_credits || 0) / (user.subscription.cycle_credits || 1) * 100))))}%` 
              }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="p-1 rounded-shape-md flex items-center bg-[var(--surface-subtle)] border border-[var(--border-main)] max-w-lg w-full">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 px-4 py-2.5 min-h-[40px] rounded-shape-sm text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'user'
                ? 'bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'user' ? 'text-[var(--fg-accent)]' : ''} />
            <span>
              {dir === 'rtl' ? 'خطط الاستخدام العام' : 'Performance Plans'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`flex-1 px-4 py-2.5 min-h-[40px] rounded-shape-sm text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'developer'
                ? 'bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Code2 size={14} className={activeTab === 'developer' ? 'text-[var(--fg-accent)]' : ''} />
            <span>
              {dir === 'rtl' ? 'خطط المطورين والوكلاء' : 'Developer & Agent Plans'}
            </span>
          </button>
        </div>
      </div>

      {displayedPlans.length === 0 ? (
        <div
          className="w-full max-w-3xl mx-auto rounded-shape-lg border border-[var(--border-main)] bg-[var(--surface-card)] p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] shadow-sm"
        >
          <div className="w-14 h-14 rounded-shape-md bg-[var(--surface-subtle)] flex items-center justify-center mb-5 border border-[var(--border-main)] text-[var(--fg-accent)]">
            <Code2 size={26} className="animate-pulse" />
          </div>

          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-3 tracking-wide">
            {dir === 'rtl' ? 'بوابة المطورين والوكلاء (قيد الإنشاء والتطوير)' : 'Developer & Agent Portal (Under Construction)'}
          </h2>

          <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-8">
            {dir === 'rtl' ? (
              'نحن نعمل بجِد على بناء أدوات وحلول متكاملة مخصصة للمطورين والوكلاء لتمكين التوزيع البرمجي المباشر والمزامنة لخدمات PERPLEXTA. ترقبوا إطلاق واجهات برمجة تطبيقات مخصصة، إمكانيات استخدام وكلاء مستقلين (Autonomous Bots)، وموارد حوسبة سحابية متطورة تمكّنكم من دمج الذكاء الاصطناعي الفائق في تطبيقاتكم وبنيتكم التحتية بكفاءة متناهية.'
            ) : (
              'We are working diligently on building comprehensive tools and solutions tailored for developers and partners to enable direct programmatic distribution and deep integration with PERPLEXTA services. Stay tuned for custom API key provisioning, autonomous agent hosting, and enterprise-grade high-performance compute resources designed to integrate next-generation AI into your infrastructure.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-muted)] font-bold">
              <span className="w-2.5 h-2.5 rounded-shape-full bg-[var(--fg-accent)] animate-ping" />
              <span>{dir === 'rtl' ? 'المرحلة: التأسيس المعماري والنمذجة' : 'Phase: Architectural Ingestion & Setup'}</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 min-h-[44px] rounded-shape-sm bg-[var(--fg-accent)] text-[var(--comp-button-primary-fg,#ffffff)] font-bold text-xs hover:opacity-90 transition-all duration-150 shadow-sm active:scale-95 cursor-pointer touch-target-44"
            >
              {dir === 'rtl' ? 'العودة لمساحة العمل' : 'Return to Workspace'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 items-start">
          {displayedPlans.map((plan, planIdx) => {
            const planColor = plan.color || 'var(--fg-accent)';
            const isPlanActive = isActivePlan(plan.id);
            const availableCycles = getPlanAvailableCycles(plan);
            const effectiveCycle = getEffectiveCycleForPlan(plan);
            const planPrice = getDisplayPrice(plan, effectiveCycle);

            return (
              <div 
                key={`sub-plan-${plan.id || planIdx}-${planIdx}`} 
                className={`relative rounded-shape-lg border p-5 md:p-7 flex flex-col transition-all duration-200 bg-[var(--surface-card)] border-[var(--border-main)] group ${
                  isPlanActive 
                    ? 'ring-2 shadow-md' 
                    : 'hover:border-[var(--border-strong)] hover:shadow-sm'
                }`}
                style={{
                  ...(isPlanActive ? { borderColor: planColor, boxShadow: `0 4px 20px -4px ${planColor}30` } : {})
                }}
              >
                {/* Admin Defined Plan Color Stripe */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg transition-all group-hover:h-2" 
                  style={{ backgroundColor: planColor }}
                />

                {plan.badge && plan.badge !== 'none' && (
                  <div className="absolute top-0 right-5 md:right-7 -translate-y-1/2">
                    <span 
                      className="px-2.5 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-white rounded-shape-xs shadow-sm" 
                      style={{ backgroundColor: planColor }}
                    >
                      {t(plan.badge)}
                    </span>
                  </div>
                )}

                <div className="mb-3 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
                    <span 
                      className="w-2.5 h-2.5 rounded-shape-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: planColor }}
                    />
                    <span>{dir === 'rtl' ? plan.nameAr : plan.nameEn}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{dir === 'rtl' ? plan.descAr : plan.descEn}</p>
                </div>

                {/* Plan-Specific Billing Cycle Options */}
                {availableCycles.length > 1 ? (
                  <div className="p-1 rounded-shape-sm flex items-center bg-[var(--surface-subtle)] border border-[var(--border-main)] mb-3">
                    {availableCycles.map((c) => (
                      <button
                        key={`plan-c-${plan.id}-${c}`}
                        type="button"
                        onClick={() => setSelectedPlanCycles((prev) => ({ ...prev, [plan.id]: c }))}
                        className={`flex-1 py-1.5 px-2 rounded-shape-xs text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          effectiveCycle === c
                            ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {getCycleLabel(c, plan)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs text-[11px] font-bold bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)]">
                      <Clock size={12} style={{ color: planColor }} />
                      <span>{dir === 'rtl' ? `الفترة: ${getCycleLabel(effectiveCycle, plan)}` : `Duration: ${getCycleLabel(effectiveCycle, plan)}`}</span>
                    </span>
                  </div>
                )}

                <div className="mb-5 text-[var(--text-primary)]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      ${planPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">/ {getCycleLabel(effectiveCycle, plan)}</span>
                  </div>
                  {effectiveCycle === 'monthly' && plan.isAnnualEnabled !== false && getSavingPercentage(plan) > 0 && (
                    <div className="mt-1 text-xs font-semibold" style={{ color: planColor }}>
                      {dir === 'rtl' ? `وفر ${getSavingPercentage(plan)}% مع الدفع السنوي` : `Save ${getSavingPercentage(plan)}% with annual billing`}
                    </div>
                  )}

                  {/* Plan Credits Allowance Badge */}
                  <div className="mt-2.5 p-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[var(--text-primary)]">
                      <Sparkles size={14} style={{ color: planColor }} />
                      <span>
                        {Number(
                          effectiveCycle === 'daily'
                            ? (plan.dailyCredits || Math.round((plan.dailyPrice || 0) * 1000))
                            : effectiveCycle === 'annual'
                              ? (plan.annualCredits || (plan.monthlyCredits ? plan.monthlyCredits * 12 : Math.round((plan.annualPrice || 0) * 1000)))
                              : (plan.monthlyCredits || Math.round((plan.monthlyPrice || 0) * 1000))
                        ).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {dir === 'rtl' ? 'كريديت ذكاء اصطناعي' : 'AI Credits'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-main)] text-[var(--text-secondary)]">
                      {getCycleLabel(effectiveCycle, plan)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-6 relative z-10">
                  {planPrice === 0 ? (
                    <button 
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loading !== null || isPlanActive}
                      className={`col-span-2 py-2.5 md:py-3 min-h-[44px] rounded-shape-sm text-white font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] cursor-pointer touch-target-44 ${loading === `${plan.id}-stripe` ? 'animate-pulse' : ''}`}
                      style={{ 
                        backgroundColor: planColor, 
                        boxShadow: isPlanActive ? `0 0 16px ${planColor}30` : `0 2px 10px 0 ${planColor}35`,
                        opacity: isPlanActive ? 0.9 : 1
                      }}
                    >
                      {isPlanActive ? (
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={16} />{dir === 'rtl' ? 'الخطة الحالية النشطة' : 'Current Active Plan'}</div>
                      ) : (loading === `${plan.id}-stripe` ? '...' : (dir === 'rtl' ? 'تفعيل الخطة المجانية' : 'Activate Free Plan'))}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading !== null || isPlanActive}
                        className={`py-2.5 md:py-3 min-h-[44px] rounded-shape-sm text-white font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] cursor-pointer touch-target-44 ${loading === `${plan.id}-stripe` ? 'animate-pulse' : ''}`}
                        style={{ 
                          backgroundColor: planColor, 
                          boxShadow: isPlanActive ? `0 0 16px ${planColor}30` : `0 2px 10px 0 ${planColor}35`,
                          opacity: isPlanActive ? 0.9 : 1
                        }}
                      >
                        {isPlanActive ? (
                          <div className="flex items-center gap-1.5"><CheckCircle2 size={16} />{dir === 'rtl' ? 'نشط' : 'Active'}</div>
                        ) : (loading === `${plan.id}-stripe` ? '...' : (dir === 'rtl' ? 'اشتراك' : 'Subscribe'))}
                      </button>
                      <button 
                        onClick={() => handlePayWithBalance(plan.id)}
                        disabled={loading !== null || isPlanActive}
                        className={`py-2.5 md:py-3 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 border bg-transparent hover:bg-[var(--surface-subtle)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer touch-target-44 ${loading === `${plan.id}-balance` ? 'animate-pulse' : ''}`}
                        style={{ borderColor: planColor, color: planColor, opacity: isPlanActive ? 0.8 : 1 }}
                      >
                        {isPlanActive ? (dir === 'rtl' ? 'نشط' : 'Active') : (loading === `${plan.id}-balance` ? '...' : t('payWithBalance'))}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {dir === 'rtl' ? 'الميزات والخصائص' : 'Features & Capabilities'}
                  </p>
                  {plan.features.map((feature: any, idx: number) => (
                    <div key={`feat-${plan.id}-${idx}`} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: planColor }} />
                      <span className="text-xs md:text-sm text-[var(--text-secondary)] leading-tight">
                        {dir === 'rtl' ? feature.textAr : feature.textEn}
                      </span>
                    </div>
                  ))}
                </div>

                {!plan.hideTools && (
                  <div className="mt-auto pt-4 border-t border-[var(--border-main)]">
                    <div className="flex justify-between items-center px-0.5 mb-2.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] m-0">
                        {dir === 'rtl' ? 'حدود الأدوات اليومية' : 'Daily Tool Limits'}
                      </p>
                      <button 
                        onClick={() => togglePlanExpand(plan.id.toString())}
                        className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ color: planColor }}
                      >
                        <span>{expandedPlans[plan.id.toString()] ? (dir === 'rtl' ? 'إخفاء' : 'Hide') : (dir === 'rtl' ? 'تفاصيل' : 'Details')}</span>
                        <ChevronDown size={14} className={`transition-transform duration-150 ${expandedPlans[plan.id.toString()] ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {expandedPlans[plan.id.toString()] && (
                      <div className="overflow-hidden">
                          <div className="max-h-[220px] overflow-y-auto scrollbar-none pb-1 pt-1">
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 md:gap-2">
                              {(() => {
                                const toolIcons: Record<string, React.ReactNode> = {
                                  chat: <MessageSquare size={12} className="md:w-3.5 md:h-3.5" />,
                                  chat_fast: <MessageSquare size={12} className="md:w-3.5 md:h-3.5" />,
                                  chat_pro: <Sparkles size={12} className="md:w-3.5 md:h-3.5" />,
                                  chat_reasoning: <Cpu size={12} className="md:w-3.5 md:h-3.5" />,
                                  sovereign_search: <Search size={12} className="md:w-3.5 md:h-3.5" />,
                                  perplexta_analysis: <Search size={12} className="md:w-3.5 md:h-3.5" />,
                                  ads_copilot: <Megaphone size={12} className="md:w-3.5 md:h-3.5" />,
                                  image: <Sparkles size={12} className="md:w-3.5 md:h-3.5" />,
                                  video: <Tv size={12} className="md:w-3.5 md:h-3.5" />,
                                  code: <Code2 size={12} className="md:w-3.5 md:h-3.5" />,
                                  audio_studio: <Music size={12} className="md:w-3.5 md:h-3.5" />,
                                  stt: <Mic size={12} className="md:w-3.5 md:h-3.5" />,
                                  tts: <Volume2 size={12} className="md:w-3.5 md:h-3.5" />,
                                  perplexta_music: <Music size={12} className="md:w-3.5 md:h-3.5" />,
                                  x402_api: <Key size={12} className="md:w-3.5 md:h-3.5" />,
                                  storage_mb: <Cloud size={12} className="md:w-3.5 md:h-3.5" />,
                                };
                                return ALL_TOOLS.map((toolId) => {
                                  const limitVal = (plan.limits && plan.limits[toolId] !== undefined)
                                    ? plan.limits[toolId]
                                    : { daily: 0, monthly: 0 };
                                  
                                  if (limitVal?.isHidden === true || limitVal?.isHidden === 'true') return null;

                                  const label = t(toolId) || toolId;
                                  const icon = toolIcons[toolId] || <CheckCircle2 size={12} className="md:w-3.5 md:h-3.5" />;
                                  return (
                                    <LimitItem
                                      key={`sub-tool-${plan.id}-${toolId}`}
                                      icon={icon}
                                      label={label}
                                      value={limitVal}
                                      color={planColor}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ModalPortal>
        {confirmingPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div 
                onClick={() => !loading && setConfirmingPlan(null)}
                className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-md"
              />
              <div 
                className="relative w-full max-w-md rounded-shape-lg shadow-2xl overflow-hidden border bg-[var(--surface-card)] border-[var(--border-main)]"
              >
                <div className="p-5 md:p-6 border-b border-[var(--border-main)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--fg-accent)]">
                      <Wallet size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('confirmSubscription')}</h3>
                  </div>
                  <button 
                    onClick={() => setConfirmingPlan(null)} 
                    disabled={loading !== null} 
                    className="p-1.5 rounded-shape-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5 md:p-6 space-y-5">
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {t('confirmSubscriptionDesc').replace('{plan}', dir === 'rtl' ? confirmingPlan.nameAr : confirmingPlan.nameEn)}
                  </p>
                  <div className="p-4 rounded-shape-md space-y-3 bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-[var(--text-muted)]">{t('currentBalance')}</span>
                      <span className="font-bold text-[var(--text-primary)]">${Number(balanceUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-[var(--text-muted)]">
                        {t('planPrice')} ({getCycleLabel(confirmingCycle, confirmingPlan)})
                      </span>
                      <span className="font-bold text-[var(--fg-accent)]">-${getDisplayPrice(confirmingPlan, confirmingCycle).toFixed(2)}</span>
                    </div>
                    <div className="pt-2.5 border-t border-[var(--border-main)] flex justify-between items-center text-xs md:text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{t('remainingBalance')}</span>
                      <span className={`font-bold ${balanceUSD - getDisplayPrice(confirmingPlan, confirmingCycle) < 0 ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                        ${(Number(balanceUSD || 0) - getDisplayPrice(confirmingPlan, confirmingCycle)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {balanceUSD - getDisplayPrice(confirmingPlan, confirmingCycle) < 0 && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-shape-sm bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold leading-relaxed">{t('insufficientBalance')}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6 bg-[var(--surface-subtle)] border-t border-[var(--border-main)] flex gap-3">
                  <button 
                    onClick={() => setConfirmingPlan(null)} 
                    disabled={loading !== null}
                    className="flex-1 py-2.5 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 border bg-[var(--surface-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer touch-target-44"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={executePayment}
                    disabled={loading !== null || balanceUSD - getDisplayPrice(confirmingPlan, confirmingCycle) < 0}
                    className="flex-1 py-2.5 min-h-[44px] rounded-shape-sm bg-[var(--fg-accent)] hover:opacity-90 text-[var(--comp-button-primary-fg,#ffffff)] font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-target-44 active:scale-95"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {t('confirmAndActivate')}
                  </button>
                </div>
              </div>
            </div>
        )}
      </ModalPortal>

      <ModalPortal>
        {resultModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div 
                onClick={() => {
                  if (resultModal === 'success') {
                    setResultModal(null);
                    navigate('/');
                  } else {
                    setResultModal(null);
                  }
                }}
                className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-md"
              />
              <div 
                className="relative w-full max-w-md rounded-shape-lg shadow-2xl overflow-hidden border p-5 md:p-7 text-center bg-[var(--surface-card)] border-[var(--border-main)]"
              >
                {/* Admin Defined Plan Color Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: selectedPlanForModal?.color || 'var(--fg-accent)' }} />
                
                <button 
                  onClick={() => {
                    if (resultModal === 'success') {
                      setResultModal(null);
                      navigate('/');
                    } else {
                      setResultModal(null);
                    }
                  }} 
                  className="absolute top-4 right-4 md:top-5 md:right-5 p-1.5 rounded-shape-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
                
                <div className="flex justify-center mb-5 md:mb-6 mt-2">
                  <div 
                    className="w-16 h-16 md:w-18 md:h-18 rounded-shape-md flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${selectedPlanForModal?.color || 'var(--fg-accent)'}18`, 
                      color: selectedPlanForModal?.color || 'var(--fg-accent)' 
                    }}
                  >
                    {resultModal === 'success' ? (
                      <CheckCircle2 size={32} className="md:w-9 md:h-9" style={{ filter: `drop-shadow(0 0 10px ${selectedPlanForModal?.color || '#0969da'}50)` }} />
                    ) : (
                      <AlertCircle size={32} className="md:w-9 md:h-9 text-amber-500" />
                    )}
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-black mb-2 text-[var(--text-primary)]">
                  {resultModal === 'success' ? t('subscriptionSuccess') : t('insufficientBalanceTitle')}
                </h2>
                <p className="text-[var(--text-secondary)] text-xs md:text-sm leading-relaxed mb-5 md:mb-6 px-2">
                  {resultModal === 'success' ? t('subscriptionSuccessDesc') : t('insufficientBalanceDesc')}
                </p>

                {resultModal === 'success' && redirectCountdown !== null && (
                  <div 
                    className="mb-5 p-3.5 rounded-shape-sm border flex flex-col items-center justify-center bg-[var(--surface-subtle)] border-[var(--border-main)]"
                  >
                    <div 
                      className="flex items-center gap-2 text-xs font-bold mb-2"
                      style={{ color: selectedPlanForModal?.color || 'var(--fg-accent)' }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      <span>
                        {dir === 'rtl' 
                          ? `جاري تفعيل الاشتراك وتوجيهك إلى المنصة خلال ${redirectCountdown} ثوانٍ...` 
                          : `Activating tier and redirecting in ${redirectCountdown}s...`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border-main)] h-1.5 rounded-shape-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{ width: `${(redirectCountdown / 5) * 100}%`, backgroundColor: selectedPlanForModal?.color || 'var(--fg-accent)' }}
                      />
                    </div>
                  </div>
                )}

                {resultModal === 'insufficient' && (
                  <div className="p-3.5 rounded-shape-sm mb-5 flex items-center justify-between bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium">
                      <Wallet size={15} />
                      <span>{t('currentBalance')}</span>
                    </div>
                    <span className="text-base font-bold text-[var(--text-primary)]">${Number(balanceUSD || 0).toFixed(2)}</span>
                  </div>
                )}

                <div className="p-4 rounded-shape-md mb-5 md:mb-6 border bg-[var(--surface-subtle)] border-[var(--border-main)] text-start">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {t('yourReferralLink')}
                  </p>
                  <div className="flex items-center gap-2 p-1.5 rounded-shape-sm border bg-[var(--surface-card)] border-[var(--border-main)]">
                    <button 
                      onClick={handleCopyLink}
                      className="shrink-0 w-8 h-8 rounded-shape-xs flex items-center justify-center transition-all text-white cursor-pointer active:scale-95"
                      style={{ backgroundColor: copied ? '#059669' : selectedPlanForModal?.color || 'var(--fg-accent)' }}
                      title={copied ? 'Copied' : 'Copy link'}
                    >
                      {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[11px] font-mono text-[var(--text-secondary)] truncate px-1.5">{referralLink}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleShare}
                    className="flex-1 py-2.5 min-h-[44px] rounded-shape-sm text-white font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-target-44"
                    style={{ 
                      backgroundColor: selectedPlanForModal?.color || 'var(--fg-accent)', 
                      boxShadow: `0 4px 14px -2px ${(selectedPlanForModal?.color || '#0969da')}40` 
                    }}
                  >
                    <Share2 size={16} />
                    <span>{t('shareWithFriends')}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setResultModal(null);
                      if (resultModal === 'success') {
                        navigate('/');
                      }
                    }}
                    className="flex-1 py-2.5 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 border bg-[var(--surface-subtle)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-target-44"
                  >
                    {resultModal === 'success' ? (
                      <>
                        <CheckCircle2 size={16} style={{ color: selectedPlanForModal?.color || 'var(--fg-accent)' }} />
                        <span>{dir === 'rtl' ? 'الانتقال للرئيسية' : 'Go to Homepage'}</span>
                      </>
                    ) : (
                      <span>{t('close')}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
        )}
      </ModalPortal>
    </ContentContainer>
  );
};

export default SubscriptionPage;