import React, { useState } from 'react';
import { Settings, Sparkles, Zap, Copy, Check, Share2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../../context/AppContext';
import { toast } from '@/design-system';

export const SystemInactiveCard = ({ data, dir }: { data: any; dir: 'rtl' | 'ltr' }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
    className="mt-4 p-6 rounded-shape-md border border-accent/20 bg-accent/[0.02] backdrop-blur-sm self-stretch flex flex-col gap-4 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5">
      <Settings size={64} className="text-accent" />
    </div>

    <div className="flex items-start gap-4 relative z-10">
      <div className="w-12 h-12 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(156,163,175,0.2)]">
        <Settings size={24} className="animate-spin-slow" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent font-sans shadow-sm">
            {dir === 'rtl' ? 'تحديث الأنظمة' : 'System Excellence Protocol'}
          </span>
        </div>
        <p className="text-[15px] font-medium text-[var(--text-primary)] leading-relaxed font-sans">
          {dir === 'rtl' ? data.error_ar : data.error}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-2 font-sans opacity-80">
          {dir === 'rtl' 
            ? 'نعمل حالياً على تعزيز كفاءة هذا الموديل لضمان تقديم أعلى مستويات التحليل التقني.' 
            : 'We are currently enhancing this model\'s efficiency to ensure the highest standards of technical analysis.'}
        </p>
      </div>
    </div>
  </motion.div>
);

export const QuotaExceededCard = ({ data, dir, t, navigate, user, tool }: { data: any; dir: 'rtl' | 'ltr'; t?: any; navigate: any; user: any; tool?: string }) => {
  const [copied, setCopied] = useState(false);
  const { triggerUpgradePrompt, economySettings } = useAppContext();
  const isPlanRequired = data?.type === 'PLAN_REQUIRED' || data?.period === 'plan_required';
  const referralLink = `${window.location.origin}/?ref=${user?.referral_code || user?.id || 'elite'}`;
  const minDeposit = economySettings?.referral_activation_min_deposit || 10;

  const handleCopy = () => {
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
        await navigator.share({
          title: 'Perplexta Intelligence',
          text: dir === 'rtl' ? 'انضم إلي في بيربليكستا واستخدم الذكاء الاصطناعي الأقوى.' : 'Join me on Perplexta and use the most powerful AI.',
          url: referralLink,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (isPlanRequired) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-4 p-5 rounded-shape-md border border-accent/20 bg-accent/[0.03] backdrop-blur-sm self-stretch flex flex-col gap-4 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={48} className="text-accent" />
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(156,163,175,0.2)]">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                {dir === 'rtl' ? 'مطلوب اختيار باقة' : 'Subscription Plan Required'}
              </span>
            </div>
            <p className="text-[14px] font-bold text-[var(--text-primary)] leading-relaxed mb-1">
              {dir === 'rtl' ? data.error_ar : data.error}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              {dir === 'rtl'
                ? 'يرجى اختيار باقتك المفضلة (سواء كانت مجانية أو متقدمة) للبدء في استخدام كافة أدوات المنصة فوراً.'
                : 'Please select your preferred plan (free starter or premium) to immediately start using platform tools.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 relative z-10">
          <button 
            onClick={() => navigate('/subscription')}
            className="flex-1 bg-accent hover:bg-accent text-[var(--fg-on-emphasis)] h-9 rounded-shape-sm flex items-center justify-center text-[12px] font-black uppercase tracking-wider transition-theme shadow-[0_10px_20px_rgba(156,163,175,0.3)] hover:translate-y-[-2px] active:translate-y-0 cursor-pointer"
          >
            {dir === 'rtl' ? 'اختيار باقة الاشتراك الآن' : 'Choose a Plan Now'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 p-5 rounded-shape-md border border-accent/20 bg-accent/[0.03] backdrop-blur-sm self-stretch flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={48} className="text-accent" />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-shape-sm bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(156,163,175,0.2)]">
          <Zap size={24} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Premium Upgrade Required</span>
          </div>
          <p className="text-[14px] font-bold text-[var(--text-primary)] leading-relaxed mb-1">
            {dir === 'rtl' ? data.error_ar : data.error}
          </p>
          <div className="flex items-center gap-4 mt-3">
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-0.5 tracking-tighter">{dir === 'rtl' ? 'الحد المتاح' : 'Available Limit'}</span>
               <span className="text-xs font-black text-accent">{data.limit}</span>
             </div>
             <div className="w-px h-6 bg-[var(--border-default)]" />
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-0.5 tracking-tighter">{dir === 'rtl' ? 'المستخدم حالياً' : 'Currently Used'}</span>
               <span className="text-xs font-black text-[var(--text-primary)]">{data.current}</span>
             </div>
          </div>
        </div>
      </div>

      {user?.referral_activated ? (
        <div className="relative z-10 bg-[var(--bg-overlay)] border border-accent/10 rounded-shape-sm p-3 flex items-center gap-3">
          <div className="flex-1 truncate text-[10px] font-mono text-[var(--text-muted)]">
            {referralLink}
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleCopy}
              className="w-8 h-8 flex items-center justify-center rounded-shape-sm bg-accent/10 hover:bg-accent/20 text-accent transition-theme active:scale-95 shrink-0 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
              title="Copy Link"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button 
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-shape-sm bg-accent text-[var(--fg-on-emphasis)] hover:bg-accent transition-theme shadow-none active:scale-95 shrink-0 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 bg-[var(--bg-overlay)] border border-amber-500/10 rounded-shape-sm p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex-1">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-1">
              {dir === 'rtl' ? 'مطلوب تفعيل نظام الأرباح' : 'Earnings Activation Required'}
            </span>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">
              {dir === 'rtl' 
                ? `للوصول إلى رابط الإحالة الخاص بك وكسب المكافآت، يرجى تفعيل حساب الإحالات عبر إيداع حد أدنى بقيمة $${minDeposit}.` 
                : `To obtain your referral link and earn rewards, please activate your referral account with an initial deposit of $${minDeposit}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/rewards')}
            className="h-8 px-3.5 whitespace-nowrap rounded-shape-sm bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-theme"
          >
            {dir === 'rtl' ? `إيداع $${minDeposit} وتفعيل الأرباح` : `Deposit $${minDeposit} to Activate`}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mt-1 relative z-10">
        <button 
          onClick={() => navigate('/subscription')}
          className="flex-1 bg-accent hover:bg-accent text-[var(--fg-on-emphasis)] h-8 rounded-shape-sm flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-theme shadow-[0_10px_20px_rgba(156,163,175,0.3)] hover:translate-y-[-2px] active:translate-y-0"
        >
          {dir === 'rtl' ? 'ترقية الخطة الآن' : 'Upgrade Plan Now'}
        </button>
        <button 
          onClick={() => navigate('/rewards')}
          className="flex-1 bg-[var(--surface-card)] border border-accent/20 hover:bg-accent/5 text-accent h-8 rounded-shape-sm flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-theme hover:translate-y-[-2px] active:translate-y-0"
        >
          {dir === 'rtl' ? 'صفحة المكافآت' : 'Rewards Page'}
        </button>
      </div>
    </motion.div>
  );
};

export const InsufficientFundsCard = ({ data, dir, t, navigate, user }: { data: any; dir: 'rtl' | 'ltr'; t?: any; navigate: any; user: any }) => {
  const [copied, setCopied] = useState(false);
  const { triggerUpgradePrompt, economySettings } = useAppContext();
  const referralLink = `${window.location.origin}/?ref=${user?.referral_code || user?.id || 'elite'}`;
  const minDeposit = economySettings?.referral_activation_min_deposit || 10;

  const handleCopy = () => {
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
        await navigator.share({
          title: 'Perplexta Intelligence',
          text: dir === 'rtl' ? 'انضم إلي في بيربليكستا واستخدم الذكاء الاصطناعي الأقوى.' : 'Join me on Perplexta and use the most powerful AI.',
          url: referralLink,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 p-5 rounded-shape-md border border-[var(--status-danger)]/20 bg-[var(--status-danger-subtle)] backdrop-blur-sm self-stretch flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={48} className="text-[var(--status-danger)]" />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-shape-sm bg-[var(--status-danger)]/10 flex items-center justify-center text-[var(--status-danger)] shadow-xs">
          <AlertCircle size={24} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--status-danger)]">
              {dir === 'rtl' ? 'رصيد غير كافٍ' : 'Insufficient Wallet Balance'}
            </span>
          </div>
          <p className="text-[14px] font-bold text-[var(--text-primary)] leading-relaxed mb-1">
            {dir === 'rtl' ? (data?.error_ar || data?.error) : (data?.error || data?.error_ar)}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
            {dir === 'rtl' ? 'رصيد محفظتك غير كافٍ لتشغيل الخدمة. يرجى إعادة شحن محفظتك أو دعوة الأصدقاء للمزيد من النقاط مجاناً.' : 'Your wallet balance is insufficient to execute the service. Please top up your wallet or invite friends for free points.'}
          </p>
        </div>
      </div>

      {user?.referral_activated ? (
        <div className="relative z-10 bg-[var(--bg-overlay)] border border-[var(--status-danger)]/10 rounded-shape-sm p-3 flex items-center gap-3">
          <div className="flex-1 truncate text-[10px] font-mono text-[var(--text-muted)] p-1">
            {referralLink}
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleCopy}
              className="w-8 h-8 flex items-center justify-center rounded-shape-sm bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 text-[var(--status-danger)] transition-theme active:scale-95 shrink-0 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
              title="Copy Link"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button 
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-shape-sm bg-[var(--status-danger)] text-white hover:opacity-90 transition-theme shadow-none active:scale-95 shrink-0 touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 bg-[var(--bg-overlay)] border border-amber-500/10 rounded-shape-sm p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex-1">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-1">
              {dir === 'rtl' ? 'مطلوب تفعيل نظام الأرباح' : 'Earnings Activation Required'}
            </span>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">
              {dir === 'rtl' 
                ? `للوصول إلى رابط الإحالة الخاص بك وكسب المكافآت، يرجى تفعيل حساب الإحالات عبر إيداع حد أدنى بقيمة $${minDeposit}.` 
                : `To obtain your referral link and earn rewards, please activate your referral account with an initial deposit of $${minDeposit}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/rewards')}
            className="h-8 px-3.5 whitespace-nowrap rounded-shape-sm bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-theme"
          >
            {dir === 'rtl' ? `إيداع $${minDeposit} وتفعيل الأرباح` : `Deposit $${minDeposit} to Activate`}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mt-1 relative z-10">
        <button 
          onClick={() => {
            if (triggerUpgradePrompt) {
              triggerUpgradePrompt('wallet');
            } else {
              navigate('/settings/wallet');
            }
          }}
          className="flex-1 bg-[var(--status-danger)] hover:opacity-90 text-white h-8 rounded-shape-sm flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-theme hover:translate-y-[-2px] active:translate-y-0"
        >
          {dir === 'rtl' ? 'شحن رصيد المحفظة الأن' : 'Recharge Wallet Now'}
        </button>
        <button 
          onClick={() => navigate('/rewards')}
          className="flex-1 bg-[var(--surface-card)] border border-[var(--status-danger)]/20 hover:bg-[var(--status-danger-subtle)] text-[var(--status-danger)] h-8 rounded-shape-sm flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-theme hover:translate-y-[-2px] active:translate-y-0"
        >
          {dir === 'rtl' ? 'صفحة المكافآت' : 'Rewards Page'}
        </button>
      </div>
    </motion.div>
  );
};
