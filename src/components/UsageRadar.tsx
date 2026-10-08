import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, Zap, AlertCircle, ChevronDown, ChevronUp, BarChart3, Database, Calendar } from 'lucide-react';

interface UsageItem {
  id: string;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  usage: {
    daily: number;
    monthly: number;
  };
  limits: {
    daily: number | null;
    monthly: number | null;
  };
}

interface UsageData {
  plan: {
    id: number | null;
    name_en: string;
    name_ar: string;
    limits: any;
    status: string;
    billing_period: string;
    color: string;
    current_period_end?: string;
    subscription_start?: string;
  };
  usage: UsageItem[];
}

export const UsageRadar: React.FC = () => {
  const { t, dir, token, socket, language } = useAppContext();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const usageData = await res.json();
        setData(usageData);
      } else {
        setError('Failed to fetch usage data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsage();

    if (socket) {
      const handleUpdate = () => {
        fetchUsage();
      };
      
      socket.on('user_profile_updated', handleUpdate);
      socket.on('usage_update', handleUpdate);
      
      return () => {
        socket.off('user_profile_updated', handleUpdate);
        socket.off('usage_update', handleUpdate);
      };
    }
  }, [token, socket]);

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        {/* Skeleton Header */}
        <div className="h-64 sm:h-80 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)]" />
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
          {[1, 2, 3, 4].map(i => (
            <div key={`usage-radar-skel-${i}`} className="h-36 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 p-6 rounded-[var(--radius-md)] border border-rose-500/20 bg-rose-500/5 text-rose-400 space-y-4 max-w-md mx-auto text-center">
        <AlertCircle size={36} />
        <p className="font-bold text-xs sm:text-sm">{error || 'Unknown error occurred'}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchUsage();
          }}
          className="px-5 py-2 rounded-[var(--radius-sm)] bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer"
        >
          {t('retry') || 'Retry'}
        </button>
      </div>
    );
  }

  const planColor = data.plan.color || 'var(--accent)';
  const renewalDate = data.plan.current_period_end ? new Date(data.plan.current_period_end).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '∞';
  const startDate = data.plan.subscription_start ? new Date(data.plan.subscription_start).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-12">
      {/* Usage Radar Header */}
      <div className="p-4 sm:p-7 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] relative overflow-hidden shadow-xs">
        
        {/* Header Row */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 shrink-0">
               <Activity size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)]">
                {t('usageRadar') || (dir === 'rtl' ? 'رادار الاستهلاك' : 'Usage Radar')}
              </h2>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {t('realTimeUsageSync') || (dir === 'rtl' ? 'مزامنة لحظية للموارد' : 'Real-time resource synchronization')}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Info Card */}
        <div className="p-4 sm:p-6 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col items-center relative group">
           <div className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--radius-sm)] border border-[var(--border-accent)]/20 items-center justify-center bg-[var(--bg-accent-muted)] text-[var(--fg-accent)]">
              <BarChart3 size={28} />
           </div>

           <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 w-full">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('activeSubscription') || 'Active Subscription'}
                </span>
                <h3 className="text-xl sm:text-3xl md:text-4xl font-black leading-none select-none text-[var(--fg-accent)]">
                  {dir === 'rtl' ? data.plan.name_ar : data.plan.name_en}
                </h3>
              </div>

               {/* Status Badges Row */}
               <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 pt-1">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)]">
                     <Zap size={12} className={data.plan.id === null || data.plan.status?.toLowerCase() !== 'active' ? "text-rose-400" : "text-[var(--fg-success)]"} />
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${data.plan.id === null || data.plan.status?.toLowerCase() !== 'active' ? "text-rose-400" : "text-[var(--fg-success)]"}`}>
                       {data.plan.id === null || data.plan.status?.toLowerCase() !== 'active' ? (language === 'ar' ? 'غير نشط' : 'Inactive') : (t('active') || 'Active')}
                     </span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-muted)]">
                     <Clock size={12} />
                     <span className="text-[10px] font-bold uppercase tracking-wider">
                       {data.plan.id === null || data.plan.status?.toLowerCase() !== 'active' ? (language === 'ar' ? 'بدون فترة' : 'None') : (t(data.plan.billing_period.toLowerCase()) || data.plan.billing_period)}
                     </span>
                  </div>
                  {data.plan.id !== null && data.plan.status?.toLowerCase() === 'active' && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 text-[var(--fg-accent)]">
                       <Calendar size={12} />
                       <span className="text-[10px] font-bold tracking-wider">{startDate} - {renewalDate}</span>
                    </div>
                  )}
               </div>
           </div>
        </div>
      </div>

      {/* Usage Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pb-4">
        {data.usage.map((item) => {
          const isDailyUnlimited = item.limits.daily === null;
          const isMonthlyUnlimited = item.limits.monthly === null;
          const isStorage = item.id === 'storage_mb';
          
          const dailyPercent = isDailyUnlimited ? 0 : Math.min(100, (item.usage.daily / (item.limits.daily || 1)) * 100);
          const monthlyPercent = isMonthlyUnlimited ? 0 : Math.min(100, (item.usage.monthly / (item.limits.monthly || 1)) * 100);

          const isExpanded = expanded === item.id;

          return (
            <div 
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] transition-all duration-fast overflow-hidden shadow-xs"
              key={item.id}
            >
              <div className="p-3.5 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider leading-tight text-[var(--fg-accent)]">
                      {t(item.id) || (dir === 'rtl' ? (item.name_ar || item.id) : (item.name_en || item.id))}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium line-clamp-1 leading-snug">
                      {dir === 'rtl' ? item.desc_ar : item.desc_en}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="p-1.5 rounded-[var(--radius-xs)] transition-all duration-fast hover:bg-[var(--bg-accent-muted)] text-[var(--text-muted)] hover:text-[var(--fg-accent)] shrink-0 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  {/* Primary Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-[var(--text-muted)]">{isStorage ? (t('usageLoad') || 'Capacity') : (t('usageToday') || 'Daily usage')}</span>
                      <span className={dailyPercent > 90 ? 'text-rose-400' : 'text-[var(--fg-accent)]'}>
                        {isStorage ? `${Math.round(item.usage.daily)} MB` : item.usage.daily} / {isDailyUnlimited ? '∞' : (isStorage ? `${item.limits.daily} MB` : item.limits.daily)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[var(--surface-subtle)] rounded-[var(--radius-full)] overflow-hidden p-0.5 border border-[var(--border-default)]">
                      <div 
                        style={{ 
                          width: isDailyUnlimited ? '0%' : `${Math.max(2, dailyPercent)}%`
                        }}
                        className={`h-full rounded-[var(--radius-full)] transition-all duration-base ${dailyPercent > 90 ? 'bg-rose-500' : 'bg-[var(--accent)]'}`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3 pt-3 border-t border-[var(--border-default)]"
                      >
                         {/* Monthly Progress (Skip for Storage) */}
                         {!isStorage && (
                           <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-[var(--text-muted)]">{t('usageMonthly') || 'Monthly usage'}</span>
                              <span className={monthlyPercent > 90 ? 'text-rose-400' : 'text-[var(--fg-accent)]'}>
                                {item.usage.monthly} / {isMonthlyUnlimited ? '∞' : item.limits.monthly}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[var(--surface-subtle)] rounded-[var(--radius-full)] overflow-hidden p-0.5 border border-[var(--border-default)]">
                              <div 
                                style={{ 
                                  width: isMonthlyUnlimited ? '100%' : `${Math.max(2, monthlyPercent)}%`
                                }}
                                className={`h-full rounded-[var(--radius-full)] transition-all duration-base ${monthlyPercent > 90 ? 'bg-rose-500' : 'bg-[var(--accent)] opacity-80'}`}
                              />
                            </div>
                          </div>
                         )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 rounded-[var(--radius-sm)] flex flex-col items-center justify-center text-center bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                            <Database size={13} className="text-[var(--text-muted)] mb-1" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('resourceId') || 'ID'}</span>
                            <span className="text-[11px] font-bold font-mono text-[var(--fg-accent)]">{item.id}</span>
                          </div>
                          <div className="p-2.5 rounded-[var(--radius-sm)] flex flex-col items-center justify-center text-center bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                            <Clock size={13} className="text-[var(--text-muted)] mb-1" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('renewal') || 'Renewal'}</span>
                            <span className="text-[11px] font-bold text-[var(--text-muted)]">{renewalDate}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--border-accent)]/20 bg-[var(--bg-accent-muted)]">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 shrink-0 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20">
            <AlertCircle size={16} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--fg-accent)]">
              {t('quotaInfoTitle') || (dir === 'rtl' ? 'إدارة الحصص والحدود' : 'Quota Management')}
            </h4>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed font-medium">
              {t('quotaInfoDesc') || (dir === 'rtl' 
                ? 'يتم تصفير العدادات اليومية كل 24 ساعة، بينما يتم تصفير العدادات الشهرية في بداية كل شهر ميلادي. في حال تخطي الحصة المجانية، سيقوم النظام تلقائياً بالخصم من رصيد المحفظة لضمان استمرارية الخدمة بأقل تكلفة.' 
                : 'Daily counters reset every 24 hours, while monthly counters reset at the beginning of each calendar month. If free quota is exceeded, the system automatically draws from your wallet balance to ensure service continuity.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
