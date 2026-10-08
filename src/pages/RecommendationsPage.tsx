import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  Sliders, 
  Settings,
  Megaphone, 
  Zap, 
  RefreshCw, 
  Activity,
  UserCheck,
  Cpu,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RecommendationWidget } from '../components/RecommendationWidget';
import { RecommendationPreferencesModal } from '../components/RecommendationPreferencesModal';

const EngagementTrendsChart = lazy(() => import('../components/EngagementTrendsChart'));

export const RecommendationsPage: React.FC = () => {
  const { language, token, user, setIsAuthModalOpen, dir } = useAppContext();
  const navigate = useNavigate();
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);
  const [userSummary, setUserSummary] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (token && user) {
      fetchUserSummary();
    }
  }, [token, user, refreshKey]);

  const fetchUserSummary = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/recommendations?limit=4', { headers });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (data.success && data.user_summary) {
        setUserSummary(data.user_summary);
      }
    } catch (err) {
      console.error('[RecommendationsPage] Fetch summary error:', err);
    }
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] flex items-center justify-center p-6 transition-theme">
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full p-6 sm:p-8 rounded-shape-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-center shadow-2xs relative overflow-hidden transition-theme"
        >
          <div className="w-12 h-12 rounded-shape-md bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] mx-auto mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 tracking-wide">
            {language === 'ar' ? 'محرك الاستكشاف والتوصيات الذكية' : 'AI Discovery & Recommendation Hub'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
            {language === 'ar' 
              ? 'ميزة التوصيات الذكية متاحة حصرياً للأعضاء المسجلين. سجّل الدخول للحصول على ترشيحات دقيقة ومخصصة بناءً على نشاطك واهتماماتك.'
              : 'The smart recommendation engine is exclusively available to logged-in members to deliver tailored recommendations based on your activity and preferences.'}
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 active:scale-95 shadow-2xs flex items-center justify-center gap-2 cursor-pointer touch-target-44"
          >
            <UserCheck size={16} />
            <span>{language === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] pb-24 transition-theme">
      {/* Page Sticky Header */}
      <div className="sticky top-0 z-30 bg-[var(--surface-page)]/95 backdrop-blur-md border-b border-[var(--border-default)] px-3 sm:px-6 py-2.5 transition-theme shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-8 px-2.5 flex items-center gap-1 rounded-shape-sm bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] transition-all duration-150 active:scale-95 cursor-pointer"
              title={dir === 'rtl' ? 'رجوع' : 'Back'}
            >
              {dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
            </button>

            <div className="w-8 h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
              <Compass size={16} className="animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                  <span className="sm:hidden truncate">{language === 'ar' ? 'محرك الاستكشاف' : 'Discovery Engine'}</span>
                  <span className="hidden sm:inline truncate">{language === 'ar' ? 'محرك الاكتشاف والتوصيات' : 'Discovery Engine'}</span>
                </h1>
                <span className="px-2 py-0.5 rounded-shape-xs bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 text-[10px] font-bold hidden sm:inline-flex">
                  v2.0 Elite Core
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-[var(--text-muted)] truncate">
                {language === 'ar' 
                  ? 'ترشيح موجه بالذكاء الاصطناعي وتحليل متجه التفضيلات التفاعلي' 
                  : 'AI curation matching digital services, tools and feeds to your workflow'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              title={language === 'ar' ? 'ضبط التفضيلات' : 'Customize Preferences'}
              className="px-3 py-1.5 min-h-[36px] rounded-shape-sm text-xs font-bold transition-all duration-150 bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]/60 hover:bg-[var(--surface-subtle)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Settings size={14} className="shrink-0 text-[var(--fg-accent)]" />
              <span className="hidden sm:inline">{language === 'ar' ? 'ضبط التفضيلات' : 'Customize Preferences'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3.5 sm:pt-6 space-y-4 sm:space-y-6">
        {/* User Interaction & Vector Intelligence Banner */}
        <div className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden shadow-2xs transition-theme">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0 mt-0.5">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 flex-wrap">
                {language === 'ar' ? 'متجه التوصيات المخصصة لـ ' : 'Recommendation Vector for '}
                <span className="text-[var(--fg-accent)]">{user?.name || (language === 'ar' ? 'المستخدم' : 'Developer')}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
                {language === 'ar'
                  ? 'يقوم المحرك بدمج تفاعلاتك السابقة، مشترياتك، والخدمات المحفوظة لحساب درجات التوافق بدقة عالية.'
                  : 'Your vector synthesizes interactions, purchases, and saved services to calculate high-precision match scores.'}
              </p>

              {userSummary?.top_inferred_categories?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    {language === 'ar' ? 'المجالات المستنتجة:' : 'Inferred Interests:'}
                  </span>
                  {userSummary.top_inferred_categories.map((cat: string, idx: number) => (
                    <span
                      key={`rec-cat-${cat}-${idx}`}
                      className="px-2 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] text-[10px] font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t border-[var(--border-default)] sm:border-0">
            <div className="flex-1 sm:flex-initial text-center px-3.5 sm:px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
              <p className="text-sm sm:text-base font-bold text-[var(--fg-accent)]">
                {userSummary?.avg_match_percentage ? `${userSummary.avg_match_percentage}%` : '88%'}
              </p>
              <p className="text-[10px] font-medium text-[var(--text-muted)]">
                {language === 'ar' ? 'دقة الترشيح' : 'Match Precision'}
              </p>
            </div>
            <div className="flex-1 sm:flex-initial text-center px-3.5 sm:px-4 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
              <p className="text-sm sm:text-base font-bold text-[var(--fg-accent)]">
                {userSummary?.total_recommendations ? `${userSummary.total_recommendations}+` : '15+'}
              </p>
              <p className="text-[10px] font-medium text-[var(--text-muted)]">
                {language === 'ar' ? 'عنصر مرشح' : 'Active Recommendations'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 0: D3 Analytics & Engagement Trends */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)] animate-pulse">Loading chart...</div>}>
            <EngagementTrendsChart initialTimeframe="30d" />
          </Suspense>
        </section>

        {/* Section 1: Top Picks Unified Widget */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <RecommendationWidget
            variant="full"
            limit={8}
            onOpenPreferences={() => setIsPrefModalOpen(true)}
          />
        </section>

        {/* Section 2: Perplexta Board Posts & Ads */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
                <Megaphone size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'منشورات وخدمات بيربليكستا بورد (Perplexta Board)' : 'Perplexta Board Feeds & Recommended Listings'}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block">
                  {language === 'ar' ? 'منشورات رائجة وعروض نشطة تحظى بتفاعل عالي على شبكة Perplexta Board' : 'Trending posts and active service offers on Perplexta Board with high engagement'}
                </p>
              </div>
            </div>
          </div>

          <RecommendationWidget
            variant="compact"
            filterType="bulletin"
            limit={4}
          />
        </section>

        {/* Section 3: AI Tools & Assistants */}
        <section className="p-3.5 sm:p-5 rounded-shape-md border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-shape-sm bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 flex items-center justify-center text-[var(--fg-accent)] shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {language === 'ar' ? 'أدوات الذكاء الاصطناعي المقترحة لزيادة الإنتاجية' : 'Recommended AI Productivity Tools'}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden sm:block">
                  {language === 'ar' ? 'مساعدات ذكاء اصطناعي لتسريع البرمجة، التحليل، والتسويق' : 'AI assistants customized for code auditing, strategy analysis, and design'}
                </p>
              </div>
            </div>
          </div>

          <RecommendationWidget
            variant="compact"
            filterType="tool"
            limit={4}
          />
        </section>
      </div>

      {/* Preferences Modal */}
      <RecommendationPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onSaved={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};
export default RecommendationsPage;

